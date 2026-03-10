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
  return { ...(value as Record<string, unknown>) };
}

function resolveTenantPlaceholder(url: string, metadata: Record<string, unknown>): string {
  if (!url.includes('{tenant}')) return url;
  const tenant = typeof metadata.tenant_id === 'string' && metadata.tenant_id.trim().length > 0
    ? metadata.tenant_id.trim()
    : 'common';
  return url.replace('{tenant}', encodeURIComponent(tenant));
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

async function fetchProviderAccountEmail(
  provider: string,
  accessToken: string,
  metadata: Record<string, unknown>,
): Promise<{ email: string | null; enrichedMetadata: Record<string, unknown> }> {
  const enriched = { ...metadata };

  if (provider === 'gmail' || provider === 'google_drive') {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const info = await res.json() as { email?: string };
        if (typeof info.email === 'string' && info.email.length > 0) {
          return { email: info.email.toLowerCase(), enrichedMetadata: enriched };
        }
      }
    } catch { /* best effort */ }
    return { email: null, enrichedMetadata: enriched };
  }

  if (provider === 'outlook') {
    try {
      const res = await fetch('https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName,displayName', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const me = await res.json() as { mail?: string; userPrincipalName?: string; displayName?: string };
        const email = (me.mail || me.userPrincipalName || null)?.toLowerCase() ?? null;
        if (typeof me.displayName === 'string' && me.displayName.trim().length > 0 && !enriched.sender_name) {
          enriched.sender_name = me.displayName.trim();
        }
        return { email, enrichedMetadata: enriched };
      }
    } catch { /* best effort */ }
    return { email: null, enrichedMetadata: enriched };
  }

  return { email: null, enrichedMetadata: enriched };
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
    action: 'oauth_exchange',
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
    action: 'oauth_exchange',
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
      .is('consumed_at', null)
      .gt('expires_at', nowIso)
      .maybeSingle();

    if (stateError || !stateRow) {
      return jsonResponse({ error: 'Invalid or expired OAuth state' }, 400, corsHeaders);
    }

    const integrationId = stateRow.integration_id as string;
    const provider = stateRow.provider as string;

    const { data: integration, error: integrationError } = await supabaseAdmin
      .from('integration_connections')
      .select('id, provider, metadata, organization_id')
      .eq('id', integrationId)
      .eq('organization_id', auth.organizationId)
      .maybeSingle();

    if (integrationError || !integration) {
      return jsonResponse({ error: 'Integration not found for this organization' }, 404, corsHeaders);
    }

    if (integration.provider !== provider) {
      return jsonResponse({ error: `Integration provider mismatch: expected ${provider}` }, 400, corsHeaders);
    }

    const providerDef = getProviderDefinition(provider);
    if (!providerDef || providerDef.authType !== 'oauth2' || !providerDef.oauthConfig) {
      return jsonResponse({ error: `Provider ${provider} does not support OAuth2` }, 400, corsHeaders);
    }

    const { oauthConfig } = providerDef;
    const clientId = Deno.env.get(`${oauthConfig.envPrefix}_CLIENT_ID`) ?? '';
    const clientSecret = Deno.env.get(`${oauthConfig.envPrefix}_CLIENT_SECRET`) ?? '';
    const redirectUri = Deno.env.get(`${oauthConfig.envPrefix}_REDIRECT_URI`) ?? '';

    if (!clientId || !clientSecret || !redirectUri) {
      return jsonResponse({ error: `Server misconfiguration: missing ${provider} OAuth secrets` }, 500, corsHeaders);
    }

    const metadata = asMetadata(integration.metadata);
    const tokenUrl = resolveTenantPlaceholder(oauthConfig.tokenUrl, metadata);

    let tokenRes: Response;
    if (provider === 'notion') {
      const basicAuth = btoa(`${clientId}:${clientSecret}`);
      tokenRes = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${basicAuth}`,
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }),
      });
    } else {
      const tokenParams = new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });
      tokenRes = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenParams,
      });
    }

    const tokenJson = await tokenRes.json() as TokenExchangeResponse & { workspace_id?: string; workspace_name?: string };
    if (!tokenRes.ok || !tokenJson.access_token) {
      const detail = tokenJson.error_description || tokenJson.error || `status ${tokenRes.status}`;
      return jsonResponse({ error: `${provider} token exchange failed: ${detail}` }, 400, corsHeaders);
    }

    const previous = await supabaseAdmin
      .from('integration_oauth_tokens')
      .select('refresh_token')
      .eq('organization_id', auth.organizationId)
      .eq('integration_id', integrationId)
      .eq('provider', provider)
      .maybeSingle();

    const refreshToken = tokenJson.refresh_token
      || (previous.data?.refresh_token as string | null)
      || null;

    let enrichedMetadata = asMetadata(integration.metadata);
    if (provider === 'notion') {
      const wsId = (tokenJson as { workspace_id?: string }).workspace_id;
      const wsName = (tokenJson as { workspace_name?: string }).workspace_name;
      if (wsId) enrichedMetadata.workspace_id = wsId;
      if (wsName) enrichedMetadata.workspace_name = wsName;
    }

    const { email: providerEmail, enrichedMetadata: withEmail } = await fetchProviderAccountEmail(
      provider,
      tokenJson.access_token,
      enrichedMetadata,
    );
    enrichedMetadata = withEmail;

    const expiresAt = typeof tokenJson.expires_in === 'number'
      ? new Date(Date.now() + tokenJson.expires_in * 1000).toISOString()
      : null;

    const { error: tokenUpsertError } = await supabaseAdmin
      .from('integration_oauth_tokens')
      .upsert({
        organization_id: auth.organizationId,
        integration_id: integrationId,
        provider,
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

    if (providerEmail && !enrichedMetadata.workspace_email) {
      enrichedMetadata.workspace_email = providerEmail;
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
        metadata: enrichedMetadata,
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
      provider,
      accountEmail: providerEmail,
      expiresAt,
    }, 200, corsHeaders);
  } catch (error) {
    return jsonResponse({ error: safeErrorMessage(error) }, 500, corsHeaders);
  }
});
