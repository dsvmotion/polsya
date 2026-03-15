import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, corsHeaders as makeCorsHeaders } from '../_shared/cors.ts';
import { requireOrgRoleAccess } from '../_shared/auth.ts';
import { requireBillingAccessForOrg } from '../_shared/billing.ts';

function jsonResponse(body: Record<string, unknown>, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function toTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function maskKey(value: string): string {
  if (value.length <= 8) return '****';
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

// All providers that use API key authentication
const API_KEY_PROVIDERS = new Set([
  'brevo',
  'woocommerce',
  'shopify',
  'prestashop',
  'openai',
  'anthropic',
  'pipedrive',
  'whatsapp',
  'custom_api',
]);

// Providers that require both key + secret
const DUAL_KEY_PROVIDERS = new Set(['woocommerce']);

// Providers that require a base URL (store URL)
const URL_REQUIRED_PROVIDERS = new Set(['woocommerce', 'shopify', 'prestashop']);

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('Origin') || '';
  const corsHeaders = makeCorsHeaders(origin);

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
  }

  const auth = await requireOrgRoleAccess(req, {
    action: 'api_key_upsert',
    allowedRoles: ['admin', 'manager', 'ops'],
    allowlistEnvKey: 'EMAIL_MARKETING_ALLOWED_USER_IDS',
    corsHeaders,
  });
  if (!auth.ok) return auth.response;

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SB_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Server misconfiguration: missing Supabase service credentials' }, 500, corsHeaders);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  const billing = await requireBillingAccessForOrg(supabaseAdmin, auth.organizationId, {
    action: 'api_key_upsert',
    corsHeaders,
  });
  if (!billing.ok) return billing.response;

  try {
    const body = await req.json().catch(() => ({}));
    const integrationId = toTrimmedString(body.integrationId);
    const apiKey = toTrimmedString(body.apiKey);
    const apiSecret = toTrimmedString(body.apiSecret);
    const baseUrl = toTrimmedString(body.baseUrl);

    if (!integrationId) {
      return jsonResponse({ error: 'integrationId is required' }, 400, corsHeaders);
    }
    if (!apiKey || apiKey.length < 8) {
      return jsonResponse({ error: 'API key is required and must be at least 8 characters' }, 400, corsHeaders);
    }

    const { data: integration, error: integrationError } = await supabaseAdmin
      .from('integration_connections')
      .select('id, provider, organization_id, metadata')
      .eq('id', integrationId)
      .eq('organization_id', auth.organizationId)
      .maybeSingle();

    if (integrationError || !integration) {
      return jsonResponse({ error: 'Integration not found for this organization' }, 404, corsHeaders);
    }

    if (!API_KEY_PROVIDERS.has(integration.provider)) {
      return jsonResponse({ error: `Provider "${integration.provider}" does not use API key authentication` }, 400, corsHeaders);
    }

    // Validate dual-key providers (WooCommerce needs consumer key + consumer secret)
    if (DUAL_KEY_PROVIDERS.has(integration.provider) && !apiSecret) {
      return jsonResponse({ error: 'Consumer secret is required for this provider' }, 400, corsHeaders);
    }

    // Validate URL-required providers (WooCommerce, Shopify, PrestaShop need store URL)
    if (URL_REQUIRED_PROVIDERS.has(integration.provider) && !baseUrl) {
      return jsonResponse({ error: 'Store URL is required for this provider' }, 400, corsHeaders);
    }

    // Build upsert payload
    const upsertData: Record<string, unknown> = {
      organization_id: auth.organizationId,
      integration_id: integrationId,
      provider: integration.provider,
      api_key: apiKey,
    };
    if (apiSecret) upsertData.api_secret = apiSecret;
    if (baseUrl) upsertData.base_url = baseUrl;

    const { error: upsertError } = await supabaseAdmin
      .from('integration_api_credentials')
      .upsert(upsertData, { onConflict: 'organization_id,integration_id,provider' });

    if (upsertError) {
      return jsonResponse({ error: `Failed to save credentials: ${upsertError.message}` }, 500, corsHeaders);
    }

    // Mark integration as connected
    await supabaseAdmin
      .from('integration_connections')
      .update({
        status: 'connected',
        last_error: null,
        last_sync_at: new Date().toISOString(),
      })
      .eq('id', integrationId)
      .eq('organization_id', auth.organizationId);

    return jsonResponse(
      {
        saved: true,
        integrationId,
        provider: integration.provider,
        keyMasked: maskKey(apiKey),
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse({ error: message }, 500, corsHeaders);
  }
});
