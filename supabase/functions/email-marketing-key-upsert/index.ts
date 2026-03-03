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

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('Origin') || '';
  const corsHeaders = makeCorsHeaders(origin);

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
  }

  const auth = await requireOrgRoleAccess(req, {
    action: 'email_marketing_key_upsert',
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
    action: 'email_marketing_key_upsert',
    corsHeaders,
  });
  if (!billing.ok) return billing.response;

  try {
    const body = await req.json().catch(() => ({}));
    const integrationId = toTrimmedString(body.integrationId);
    const apiKey = toTrimmedString(body.apiKey);

    if (!integrationId) {
      return jsonResponse({ error: 'integrationId is required' }, 400, corsHeaders);
    }
    if (!apiKey || apiKey.length < 12) {
      return jsonResponse({ error: 'apiKey is required and must be valid' }, 400, corsHeaders);
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

    if (integration.provider !== 'brevo') {
      return jsonResponse({ error: 'Integration provider must be brevo' }, 400, corsHeaders);
    }

    const { error: upsertError } = await supabaseAdmin
      .from('integration_api_credentials')
      .upsert(
        {
          organization_id: auth.organizationId,
          integration_id: integrationId,
          provider: 'brevo',
          api_key: apiKey,
        },
        { onConflict: 'organization_id,integration_id,provider' },
      );

    if (upsertError) {
      return jsonResponse({ error: `Failed to save API key: ${upsertError.message}` }, 500, corsHeaders);
    }

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
        provider: 'brevo',
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
