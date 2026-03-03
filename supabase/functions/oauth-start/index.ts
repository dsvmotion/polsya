import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, corsHeaders as makeCorsHeaders } from '../_shared/cors.ts';
import { requireOrgRoleAccess } from '../_shared/auth.ts';
import { requireBillingAccessForOrg } from '../_shared/billing.ts';
import { getProviderDefinition } from '../_shared/provider-registry.ts';

function jsonResponse(body: Record<string, unknown>, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function asMetadata(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function resolveTenantPlaceholder(url: string, metadata: Record<string, unknown>): string {
  if (!url.includes('{tenant}')) return url;
  const tenant = typeof metadata.tenant_id === 'string' && metadata.tenant_id.trim().length > 0
    ? metadata.tenant_id.trim()
    : 'common';
  return url.replace('{tenant}', encodeURIComponent(tenant));
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
    action: 'oauth_start',
    allowedRoles: ['admin', 'manager', 'ops'],
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
    action: 'oauth_start',
    corsHeaders,
  });
  if (!billing.ok) return billing.response;

  try {
    const body = await req.json().catch(() => ({}));
    const integrationId = typeof body.integrationId === 'string' ? body.integrationId : null;
    const provider = typeof body.provider === 'string' ? body.provider : null;

    if (!integrationId || !provider) {
      return jsonResponse({ error: 'integrationId and provider are required' }, 400, corsHeaders);
    }

    const providerDef = getProviderDefinition(provider);
    if (!providerDef) {
      return jsonResponse({ error: `Unknown provider: ${provider}` }, 400, corsHeaders);
    }
    if (providerDef.authType !== 'oauth2' || !providerDef.oauthConfig) {
      return jsonResponse({ error: `Provider ${provider} does not support OAuth2` }, 400, corsHeaders);
    }

    const { oauthConfig } = providerDef;
    const clientId = Deno.env.get(`${oauthConfig.envPrefix}_CLIENT_ID`) ?? '';
    const redirectUri = Deno.env.get(`${oauthConfig.envPrefix}_REDIRECT_URI`) ?? '';

    if (!clientId || !redirectUri) {
      return jsonResponse({ error: `Server misconfiguration: missing ${provider} OAuth client settings` }, 500, corsHeaders);
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

    if (integration.provider !== provider) {
      return jsonResponse({ error: `Integration provider mismatch: expected ${provider}` }, 400, corsHeaders);
    }

    const metadata = asMetadata(integration.metadata);
    const authUrl = resolveTenantPlaceholder(oauthConfig.authUrl, metadata);

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const state = crypto.randomUUID().replace(/-/g, '');

    const { error: stateError } = await supabaseAdmin
      .from('integration_oauth_states')
      .insert({
        state,
        organization_id: auth.organizationId,
        integration_id: integrationId,
        provider,
        created_by: auth.user.id,
        expires_at: expiresAt,
      });

    if (stateError) {
      return jsonResponse({ error: `Could not persist OAuth state: ${stateError.message}` }, 500, corsHeaders);
    }

    const scopes = oauthConfig.scopes.join(' ');
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      state,
      ...(oauthConfig.extraAuthParams ?? {}),
    });

    const fullAuthUrl = `${authUrl}?${params.toString()}`;

    return jsonResponse({
      authUrl: fullAuthUrl,
      state,
      expiresAt,
      provider,
    }, 200, corsHeaders);
  } catch (error) {
    return jsonResponse({ error: safeErrorMessage(error) }, 500, corsHeaders);
  }
});
