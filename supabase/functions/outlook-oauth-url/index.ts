import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, corsHeaders as makeCorsHeaders } from '../_shared/cors.ts';
import { requireOrgRoleAccess } from '../_shared/auth.ts';

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

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('Origin') || '';
  const corsHeaders = makeCorsHeaders(origin);

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
  }

  const auth = await requireOrgRoleAccess(req, {
    action: 'outlook_oauth_url',
    allowedRoles: ['admin', 'manager', 'ops'],
    allowlistEnvKey: 'OUTLOOK_OAUTH_ALLOWED_USER_IDS',
    corsHeaders,
  });
  if (!auth.ok) return auth.response;

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SB_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Server misconfiguration: missing Supabase service credentials' }, 500, corsHeaders);
  }

  const clientId = Deno.env.get('OUTLOOK_CLIENT_ID') ?? '';
  const redirectUri = Deno.env.get('OUTLOOK_REDIRECT_URI') ?? '';
  const defaultTenant = Deno.env.get('OUTLOOK_TENANT_ID') ?? 'common';
  const oauthScopes = Deno.env.get('OUTLOOK_OAUTH_SCOPES')
    ?? 'offline_access openid profile email User.Read Mail.Read';

  if (!clientId || !redirectUri) {
    return jsonResponse({ error: 'Server misconfiguration: missing Outlook OAuth client settings' }, 500, corsHeaders);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  try {
    const body = await req.json().catch(() => ({}));
    const integrationId = typeof body.integrationId === 'string' ? body.integrationId : null;

    if (!integrationId) {
      return jsonResponse({ error: 'integrationId is required' }, 400, corsHeaders);
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

    if (integration.provider !== 'outlook') {
      return jsonResponse({ error: 'Integration provider must be outlook' }, 400, corsHeaders);
    }

    const metadata = asMetadata(integration.metadata);
    const tenant = typeof metadata.tenant_id === 'string' && metadata.tenant_id.trim().length > 0
      ? metadata.tenant_id.trim()
      : defaultTenant;

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const state = crypto.randomUUID().replace(/-/g, '');

    const { error: stateError } = await supabaseAdmin
      .from('integration_oauth_states')
      .insert({
        state,
        organization_id: auth.organizationId,
        integration_id: integrationId,
        provider: 'outlook',
        created_by: auth.user.id,
        expires_at: expiresAt,
      });

    if (stateError) {
      return jsonResponse({ error: `Could not persist OAuth state: ${stateError.message}` }, 500, corsHeaders);
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      response_mode: 'query',
      scope: oauthScopes,
      state,
      prompt: 'select_account',
    });

    const authUrl = `https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0/authorize?${params.toString()}`;

    return jsonResponse({ authUrl, state, expiresAt, tenant }, 200, corsHeaders);
  } catch (error) {
    return jsonResponse({ error: safeErrorMessage(error) }, 500, corsHeaders);
  }
});
