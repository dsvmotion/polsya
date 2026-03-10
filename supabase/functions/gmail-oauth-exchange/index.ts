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

type TokenExchangeResponse = {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  scope?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('Origin') || '';
  const corsHeaders = makeCorsHeaders(origin);

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
  }

  const auth = await requireOrgRoleAccess(req, {
    action: 'gmail_oauth_exchange',
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
  const googleClientSecret = Deno.env.get('GMAIL_CLIENT_SECRET') ?? '';
  const redirectUri = Deno.env.get('GMAIL_REDIRECT_URI') ?? '';

  if (!googleClientId || !googleClientSecret || !redirectUri) {
    return jsonResponse({ error: 'Server misconfiguration: missing Gmail OAuth secrets' }, 500, corsHeaders);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  const billing = await requireBillingAccessForOrg(supabaseAdmin, auth.organizationId, {
    action: 'gmail_oauth_exchange',
    corsHeaders,
  });
  if (!billing.ok) return billing.response;

  try {
    const body = await req.json().catch(() => ({}));
    const code = typeof body.code === 'string' ? body.code : null;
    const state = typeof body.state === 'string' ? body.state : null;

    if (!code || !state) {
      return jsonResponse({ error: 'code and state are required' }, 400, corsHeaders);
    }

    const nowIso = new Date().toISOString();
    const { data: stateRow, error: stateError } = await supabaseAdmin
      .from('integration_oauth_states')
      .select('state, integration_id, organization_id, provider, consumed_at, expires_at')
      .eq('state', state)
      .eq('organization_id', auth.organizationId)
      .eq('provider', 'gmail')
      .is('consumed_at', null)
      .gt('expires_at', nowIso)
      .maybeSingle();

    if (stateError || !stateRow) {
      return jsonResponse({ error: 'Invalid or expired OAuth state' }, 400, corsHeaders);
    }

    const integrationId = stateRow.integration_id as string;

    const { data: integration, error: integrationError } = await supabaseAdmin
      .from('integration_connections')
      .select('id, provider, metadata, organization_id')
      .eq('id', integrationId)
      .eq('organization_id', auth.organizationId)
      .maybeSingle();

    if (integrationError || !integration) {
      return jsonResponse({ error: 'Integration not found for this organization' }, 404, corsHeaders);
    }

    if (integration.provider !== 'gmail') {
      return jsonResponse({ error: 'Integration provider must be gmail' }, 400, corsHeaders);
    }

    const tokenParams = new URLSearchParams({
      code,
      client_id: googleClientId,
      client_secret: googleClientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams,
    });

    const tokenJson = await tokenRes.json() as TokenExchangeResponse;
    if (!tokenRes.ok || !tokenJson.access_token) {
      const detail = tokenJson.error_description || tokenJson.error || `status ${tokenRes.status}`;
      return jsonResponse({ error: `Gmail token exchange failed: ${detail}` }, 400, corsHeaders);
    }

    const previous = await supabaseAdmin
      .from('integration_oauth_tokens')
      .select('refresh_token')
      .eq('organization_id', auth.organizationId)
      .eq('integration_id', integrationId)
      .eq('provider', 'gmail')
      .maybeSingle();

    const refreshToken = tokenJson.refresh_token
      || (previous.data?.refresh_token as string | null)
      || null;

    let providerEmail: string | null = null;
    try {
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenJson.access_token}` },
      });
      if (userInfoRes.ok) {
        const userInfo = await userInfoRes.json() as { email?: string };
        if (typeof userInfo.email === 'string' && userInfo.email.length > 0) {
          providerEmail = userInfo.email.toLowerCase();
        }
      }
    } catch {
      // Best effort only.
    }

    const expiresAt = typeof tokenJson.expires_in === 'number'
      ? new Date(Date.now() + tokenJson.expires_in * 1000).toISOString()
      : null;

    const { error: tokenUpsertError } = await supabaseAdmin
      .from('integration_oauth_tokens')
      .upsert({
        organization_id: auth.organizationId,
        integration_id: integrationId,
        provider: 'gmail',
        provider_account_email: providerEmail,
        access_token: tokenJson.access_token,
        refresh_token: refreshToken,
        token_type: tokenJson.token_type ?? null,
        scope: tokenJson.scope ?? null,
        expires_at: expiresAt,
      }, {
        onConflict: 'organization_id,integration_id,provider',
      });

    if (tokenUpsertError) {
      return jsonResponse({ error: `Could not store OAuth tokens: ${tokenUpsertError.message}` }, 500, corsHeaders);
    }

    const metadata = (integration.metadata && typeof integration.metadata === 'object')
      ? { ...(integration.metadata as Record<string, unknown>) }
      : {};
    if (providerEmail && !metadata.workspace_email) {
      metadata.workspace_email = providerEmail;
    }

    const finishedAt = new Date().toISOString();

    const { error: consumeError } = await supabaseAdmin
      .from('integration_oauth_states')
      .update({ consumed_at: finishedAt })
      .eq('state', state)
      .eq('organization_id', auth.organizationId);
    if (consumeError) {
      console.error('Failed to mark OAuth state as consumed:', consumeError.message);
    }

    const { error: connectError } = await supabaseAdmin
      .from('integration_connections')
      .update({
        status: 'connected',
        last_error: null,
        metadata,
        last_sync_at: finishedAt,
      })
      .eq('id', integrationId)
      .eq('organization_id', auth.organizationId);
    if (connectError) {
      console.error('Failed to update integration connection status:', connectError.message);
    }

    return jsonResponse({
      connected: true,
      integrationId,
      provider: 'gmail',
      accountEmail: providerEmail,
      expiresAt,
    }, 200, corsHeaders);
  } catch (error) {
    return jsonResponse({ error: safeErrorMessage(error) }, 500, corsHeaders);
  }
});
