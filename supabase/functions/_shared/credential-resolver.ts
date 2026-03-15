import { getProviderDefinition, type ProviderDefinition } from './provider-registry.ts';

export interface ResolvedCredentials {
  metadata: Record<string, unknown>;
}

type OAuthTokenRow = {
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  token_type: string | null;
  scope: string | null;
  provider_account_email: string | null;
};

type TokenRefreshResult = {
  accessToken: string;
  tokenType: string | null;
  scope: string | null;
  expiresAt: string | null;
};

export async function resolveCredentials(
  supabaseClient: any,
  provider: string,
  integrationId: string,
  baseMetadata: Record<string, unknown>,
): Promise<ResolvedCredentials> {
  const def = getProviderDefinition(provider);
  if (!def) {
    return { metadata: baseMetadata };
  }

  switch (def.authType) {
    case 'oauth2':
      return resolveOAuthCredentials(supabaseClient, provider, integrationId, baseMetadata, def);
    case 'api_key':
      return resolveApiKeyCredentials(supabaseClient, provider, integrationId, baseMetadata);
    case 'credentials':
      return resolveCustomCredentials(supabaseClient, provider, integrationId, baseMetadata);
    case 'none':
      return { metadata: baseMetadata };
  }
}

async function refreshOAuthAccessToken(
  refreshToken: string,
  provider: string,
  def: ProviderDefinition,
  metadata: Record<string, unknown>,
): Promise<TokenRefreshResult> {
  const oauthConfig = def.oauthConfig;
  if (!oauthConfig) {
    throw new Error(`No OAuth config registered for provider ${provider}`);
  }

  const clientId = Deno.env.get(`${oauthConfig.envPrefix}_CLIENT_ID`) ?? '';
  const clientSecret = Deno.env.get(`${oauthConfig.envPrefix}_CLIENT_SECRET`) ?? '';

  if (!clientId || !clientSecret) {
    throw new Error(
      `Missing ${oauthConfig.envPrefix}_CLIENT_ID or ${oauthConfig.envPrefix}_CLIENT_SECRET for token refresh`,
    );
  }

  let tokenUrl = oauthConfig.tokenUrl;

  if (provider === 'notion') {
    const basicAuth = btoa(`${clientId}:${clientSecret}`);
    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: JSON.stringify({ grant_type: 'refresh_token', refresh_token: refreshToken }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      access_token?: string;
      token_type?: string;
      scope?: string;
      expires_in?: number;
      error?: string;
      error_description?: string;
    };
    if (!res.ok || !body.access_token) {
      const detail = body.error_description || body.error || `status ${res.status}`;
      throw new Error(`Failed to refresh ${provider} access token: ${detail}`);
    }
    const expiresAt =
      typeof body.expires_in === 'number'
        ? new Date(Date.now() + body.expires_in * 1000).toISOString()
        : null;
    return { accessToken: body.access_token, tokenType: body.token_type ?? null, scope: body.scope ?? null, expiresAt };
  }

  const tokenParams = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  if (provider === 'outlook') {
    const tenant =
      (typeof metadata.tenant_id === 'string' && metadata.tenant_id.length > 0)
        ? metadata.tenant_id
        : (Deno.env.get('OUTLOOK_TENANT_ID') ?? 'common');
    tokenUrl = tokenUrl.replace('{tenant}', encodeURIComponent(tenant));

    const scopes =
      Deno.env.get('OUTLOOK_OAUTH_SCOPES') ??
      'offline_access openid profile email User.Read Mail.Read';
    tokenParams.set('scope', scopes);
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenParams,
  });

  const body = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    token_type?: string;
    scope?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !body.access_token) {
    const detail = body.error_description || body.error || `status ${response.status}`;
    throw new Error(`Failed to refresh ${provider} access token: ${detail}`);
  }

  const expiresAt =
    typeof body.expires_in === 'number'
      ? new Date(Date.now() + body.expires_in * 1000).toISOString()
      : null;

  return {
    accessToken: body.access_token,
    tokenType: body.token_type ?? null,
    scope: body.scope ?? null,
    expiresAt,
  };
}

async function resolveOAuthCredentials(
  supabaseClient: any,
  provider: string,
  integrationId: string,
  baseMetadata: Record<string, unknown>,
  def: ProviderDefinition,
): Promise<ResolvedCredentials> {
  const organizationId = baseMetadata._organization_id as string | undefined;

  const query = supabaseClient
    .from('integration_oauth_tokens')
    .select('access_token, refresh_token, expires_at, token_type, scope, provider_account_email')
    .eq('integration_id', integrationId)
    .eq('provider', provider);

  if (organizationId) {
    query.eq('organization_id', organizationId);
  }

  const { data: tokenRow, error: tokenError } = await query.maybeSingle();

  if (tokenError) {
    throw new Error(`Failed to load ${provider} OAuth token: ${tokenError.message}`);
  }
  if (!tokenRow) {
    throw new Error(`${provider} OAuth token not found. Connect ${provider} first.`);
  }

  const token = tokenRow as unknown as OAuthTokenRow;
  let accessToken = token.access_token;
  let tokenType = token.token_type;
  let scope = token.scope;
  let expiresAt = token.expires_at;

  const expiresSoon = !!expiresAt && Date.parse(expiresAt) <= Date.now() + 60_000;
  if (expiresSoon) {
    if (!token.refresh_token) {
      throw new Error(
        `${provider} OAuth token expired and no refresh token is available. Reconnect ${provider}.`,
      );
    }

    const refreshed = await refreshOAuthAccessToken(
      token.refresh_token,
      provider,
      def,
      baseMetadata,
    );
    accessToken = refreshed.accessToken;
    tokenType = refreshed.tokenType;
    scope = refreshed.scope;
    expiresAt = refreshed.expiresAt;

    const updateQuery = supabaseClient
      .from('integration_oauth_tokens')
      .update({
        access_token: accessToken,
        token_type: tokenType,
        scope,
        expires_at: expiresAt,
      })
      .eq('integration_id', integrationId)
      .eq('provider', provider);

    if (organizationId) {
      updateQuery.eq('organization_id', organizationId);
    }

    const { error: updateTokenError } = await updateQuery;

    if (updateTokenError) {
      throw new Error(`Failed to persist refreshed ${provider} token: ${updateTokenError.message}`);
    }
  }

  const tokenKeyPrefix = `${provider}_`;
  return {
    metadata: {
      ...baseMetadata,
      [`${tokenKeyPrefix}access_token`]: accessToken,
      [`${tokenKeyPrefix}account_email`]: token.provider_account_email,
      [`${tokenKeyPrefix}token_type`]: tokenType,
      [`${tokenKeyPrefix}scope`]: scope,
      [`${tokenKeyPrefix}token_expires_at`]: expiresAt,
    },
  };
}

async function resolveApiKeyCredentials(
  supabaseClient: any,
  provider: string,
  integrationId: string,
  baseMetadata: Record<string, unknown>,
): Promise<ResolvedCredentials> {
  const organizationId = baseMetadata._organization_id as string | undefined;

  const query = supabaseClient
    .from('integration_api_credentials')
    .select('api_key, api_secret, base_url')
    .eq('integration_id', integrationId)
    .eq('provider', provider);

  if (organizationId) {
    query.eq('organization_id', organizationId);
  }

  const { data: credsRow, error: credsError } = await query.maybeSingle();

  if (credsError) {
    const msg = (credsError.message ?? '').toLowerCase();
    if (msg.includes('schema cache') || msg.includes('does not exist') || credsError.code === '42P01') {
      return { metadata: baseMetadata };
    }
    throw new Error(`Failed to load ${provider} API credentials: ${credsError.message}`);
  }
  if (!credsRow) {
    throw new Error(`${provider} API credentials not found. Configure ${provider} credentials first.`);
  }

  const creds = credsRow as Record<string, unknown>;
  return {
    metadata: {
      ...baseMetadata,
      [`${provider}_api_key`]: creds.api_key,
      ...(creds.api_secret ? { [`${provider}_api_secret`]: creds.api_secret } : {}),
      ...(creds.base_url ? { [`${provider}_base_url`]: creds.base_url } : {}),
    },
  };
}

async function resolveCustomCredentials(
  supabaseClient: any,
  provider: string,
  integrationId: string,
  baseMetadata: Record<string, unknown>,
): Promise<ResolvedCredentials> {
  if (provider === 'email_imap') {
    const organizationId = baseMetadata._organization_id as string | undefined;

    const query = supabaseClient
      .from('integration_email_credentials')
      .select(
        'account_email, username, password, imap_host, imap_port, imap_secure, smtp_host, smtp_port, smtp_secure',
      )
      .eq('integration_id', integrationId)
      .eq('provider', 'email_imap');

    if (organizationId) {
      query.eq('organization_id', organizationId);
    }

    const { data: credsRow, error: credsError } = await query.maybeSingle();

    if (credsError) {
      throw new Error(`Failed to load IMAP credentials: ${credsError.message}`);
    }
    if (!credsRow) {
      throw new Error('IMAP/SMTP credentials not found. Configure email_imap first.');
    }

    const creds = credsRow as Record<string, unknown>;
    return {
      metadata: {
        ...baseMetadata,
        account_email: creds.account_email,
        username: creds.username,
        password: creds.password,
        imap_host: creds.imap_host,
        imap_port: creds.imap_port,
        imap_secure: creds.imap_secure,
        smtp_host: creds.smtp_host,
        smtp_port: creds.smtp_port,
        smtp_secure: creds.smtp_secure,
      },
    };
  }

  return { metadata: baseMetadata };
}
