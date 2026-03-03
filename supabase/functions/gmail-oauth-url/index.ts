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

function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
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
    action: 'gmail_oauth_url',
    allowedRoles: ['admin', 'manager', 'ops'],
    allowlistEnvKey: 'GMAIL_OAUTH_ALLOWED_USER_IDS',
    corsHeaders,
  });
  if (!auth.ok) return auth.response;

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SB_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Server misconfiguration: missing Supabase service credentials' }, 500, corsHeaders);
  }

  const googleClientId = Deno.env.get('GMAIL_CLIENT_ID') ?? '';
  const redirectUri = Deno.env.get('GMAIL_REDIRECT_URI') ?? '';
  const oauthScopes = Deno.env.get('GMAIL_OAUTH_SCOPES')
    ?? 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email';

  if (!googleClientId || !redirectUri) {
    return jsonResponse({ error: 'Server misconfiguration: missing Gmail OAuth client settings' }, 500, corsHeaders);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  const billing = await requireBillingAccessForOrg(supabaseAdmin, auth.organizationId, {
    action: 'gmail_oauth_url',
    corsHeaders,
  });
  if (!billing.ok) return billing.response;

  try {
    const body = await req.json().catch(() => ({}));
    const integrationId = typeof body.integrationId === 'string' ? body.integrationId : null;

    if (!integrationId) {
      return jsonResponse({ error: 'integrationId is required' }, 400, corsHeaders);
    }

    const { data: integration, error: integrationError } = await supabaseAdmin
      .from('integration_connections')
      .select('id, provider, organization_id')
      .eq('id', integrationId)
      .eq('organization_id', auth.organizationId)
      .maybeSingle();

    if (integrationError || !integration) {
      return jsonResponse({ error: 'Integration not found for this organization' }, 404, corsHeaders);
    }

    if (integration.provider !== 'gmail') {
      return jsonResponse({ error: 'Integration provider must be gmail' }, 400, corsHeaders);
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const state = crypto.randomUUID().replace(/-/g, '');

    const { error: stateError } = await supabaseAdmin
      .from('integration_oauth_states')
      .insert({
        state,
        organization_id: auth.organizationId,
        integration_id: integrationId,
        provider: 'gmail',
        created_by: auth.user.id,
        expires_at: expiresAt,
      });

    if (stateError) {
      return jsonResponse({ error: `Could not persist OAuth state: ${stateError.message}` }, 500, corsHeaders);
    }

    const params = new URLSearchParams({
      client_id: googleClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      access_type: 'offline',
      include_granted_scopes: 'true',
      prompt: 'consent',
      scope: oauthScopes,
      state,
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return jsonResponse({
      authUrl,
      state,
      expiresAt,
    }, 200, corsHeaders);
  } catch (error) {
    return jsonResponse({ error: safeErrorMessage(error) }, 500, corsHeaders);
  }
});
