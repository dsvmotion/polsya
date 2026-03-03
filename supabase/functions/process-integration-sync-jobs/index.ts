import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, corsHeaders as makeCorsHeaders } from '../_shared/cors.ts';
import { requireOrgRoleAccess } from '../_shared/auth.ts';
import {
  getIntegrationConnector,
  parseSyncTargets,
  type IntegrationConnectorContext,
  type SyncTarget,
  type SyncRecord,
} from '../_shared/integration-connectors.ts';

type IntegrationSyncJobRow = {
  id: string;
  integration_id: string;
  organization_id: string;
  provider: string;
  job_type: string;
  status: string;
  payload: Record<string, unknown> | null;
  requested_by: string | null;
  idempotency_key: string | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

type IntegrationConnectionRow = {
  id: string;
  organization_id: string;
  provider: string;
  display_name: string;
  status: string;
  is_enabled: boolean;
  metadata: Record<string, unknown> | null;
  last_sync_at: string | null;
  last_error: string | null;
};

type IntegrationOAuthTokenRow = {
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  token_type: string | null;
  scope: string | null;
  provider_account_email: string | null;
};

type PersistResult = {
  processed: number;
  failed: number;
  created: number;
  updated: number;
  summary: string;
};

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  corsHeaders: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function runStep(
  target: SyncTarget,
  ctx: IntegrationConnectorContext,
  connector: ReturnType<typeof getIntegrationConnector>,
) {
  switch (target) {
    case 'entities':
      return connector.syncEntities(ctx);
    case 'orders':
      return connector.syncOrders(ctx);
    case 'products':
      return connector.syncProducts(ctx);
    case 'inventory':
      return connector.syncInventory(ctx);
    default:
      return connector.syncOrders(ctx);
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return [];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function asMetadata(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  return { ...(value as Record<string, unknown>) };
}

async function refreshGmailAccessToken(params: {
  refreshToken: string;
}): Promise<{ accessToken: string; tokenType: string | null; scope: string | null; expiresAt: string | null }> {
  const clientId = Deno.env.get('GMAIL_CLIENT_ID') ?? '';
  const clientSecret = Deno.env.get('GMAIL_CLIENT_SECRET') ?? '';

  if (!clientId || !clientSecret) {
    throw new Error('Missing GMAIL_CLIENT_ID or GMAIL_CLIENT_SECRET for token refresh');
  }

  const tokenParams = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: params.refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenParams,
  });

  const body = await response.json().catch(() => ({})) as {
    access_token?: string;
    token_type?: string;
    scope?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !body.access_token) {
    const detail = body.error_description || body.error || `status ${response.status}`;
    throw new Error(`Failed to refresh Gmail access token: ${detail}`);
  }

  const expiresAt = typeof body.expires_in === 'number'
    ? new Date(Date.now() + body.expires_in * 1000).toISOString()
    : null;

  return {
    accessToken: body.access_token,
    tokenType: body.token_type ?? null,
    scope: body.scope ?? null,
    expiresAt,
  };
}

async function refreshOutlookAccessToken(params: {
  refreshToken: string;
  tenant: string;
}): Promise<{ accessToken: string; tokenType: string | null; scope: string | null; expiresAt: string | null }> {
  const clientId = Deno.env.get('OUTLOOK_CLIENT_ID') ?? '';
  const clientSecret = Deno.env.get('OUTLOOK_CLIENT_SECRET') ?? '';
  const scopes = Deno.env.get('OUTLOOK_OAUTH_SCOPES')
    ?? 'offline_access openid profile email User.Read Mail.Read';

  if (!clientId || !clientSecret) {
    throw new Error('Missing OUTLOOK_CLIENT_ID or OUTLOOK_CLIENT_SECRET for token refresh');
  }

  const tokenParams = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: params.refreshToken,
    grant_type: 'refresh_token',
    scope: scopes,
  });

  const response = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(params.tenant)}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenParams,
  });

  const body = await response.json().catch(() => ({})) as {
    access_token?: string;
    token_type?: string;
    scope?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !body.access_token) {
    const detail = body.error_description || body.error || `status ${response.status}`;
    throw new Error(`Failed to refresh Outlook access token: ${detail}`);
  }

  const expiresAt = typeof body.expires_in === 'number'
    ? new Date(Date.now() + body.expires_in * 1000).toISOString()
    : null;

  return {
    accessToken: body.access_token,
    tokenType: body.token_type ?? null,
    scope: body.scope ?? null,
    expiresAt,
  };
}

async function resolveConnectorMetadata(
  supabaseAdmin: ReturnType<typeof createClient>,
  integration: IntegrationConnectionRow,
): Promise<Record<string, unknown>> {
  const metadata = asMetadata(integration.metadata);

  if (integration.provider === 'email_imap') {
    const { data: credsRow, error: credsError } = await supabaseAdmin
      .from('integration_email_credentials')
      .select('account_email, username, password, imap_host, imap_port, imap_secure, smtp_host, smtp_port, smtp_secure')
      .eq('organization_id', integration.organization_id)
      .eq('integration_id', integration.id)
      .eq('provider', 'email_imap')
      .maybeSingle();

    if (credsError) {
      throw new Error(`Failed to load IMAP credentials: ${credsError.message}`);
    }
    if (!credsRow) {
      throw new Error('IMAP/SMTP credentials not found. Configure email_imap first.');
    }

    return {
      ...metadata,
      account_email: (credsRow as Record<string, unknown>).account_email,
      username: (credsRow as Record<string, unknown>).username,
      password: (credsRow as Record<string, unknown>).password,
      imap_host: (credsRow as Record<string, unknown>).imap_host,
      imap_port: (credsRow as Record<string, unknown>).imap_port,
      imap_secure: (credsRow as Record<string, unknown>).imap_secure,
      smtp_host: (credsRow as Record<string, unknown>).smtp_host,
      smtp_port: (credsRow as Record<string, unknown>).smtp_port,
      smtp_secure: (credsRow as Record<string, unknown>).smtp_secure,
    };
  }

  if (integration.provider !== 'gmail' && integration.provider !== 'outlook') {
    return metadata;
  }

  const oauthProvider = integration.provider as 'gmail' | 'outlook';

  const { data: tokenRow, error: tokenError } = await supabaseAdmin
    .from('integration_oauth_tokens')
    .select('access_token, refresh_token, expires_at, token_type, scope, provider_account_email')
    .eq('organization_id', integration.organization_id)
    .eq('integration_id', integration.id)
    .eq('provider', oauthProvider)
    .maybeSingle();

  if (tokenError) {
    throw new Error(`Failed to load ${oauthProvider} OAuth token: ${tokenError.message}`);
  }

  if (!tokenRow) {
    throw new Error(`${oauthProvider} OAuth token not found. Connect ${oauthProvider} first.`);
  }

  const token = tokenRow as unknown as IntegrationOAuthTokenRow;
  let accessToken = token.access_token;
  let tokenType = token.token_type;
  let scope = token.scope;
  let expiresAt = token.expires_at;

  const expiresSoon = !!expiresAt && Date.parse(expiresAt) <= Date.now() + 60_000;
  if (expiresSoon) {
    if (!token.refresh_token) {
      throw new Error(`${oauthProvider} OAuth token expired and no refresh token is available. Reconnect ${oauthProvider}.`);
    }

    const refreshed = oauthProvider === 'gmail'
      ? await refreshGmailAccessToken({ refreshToken: token.refresh_token })
      : await refreshOutlookAccessToken({
        refreshToken: token.refresh_token,
        tenant: (typeof metadata.tenant_id === 'string' && metadata.tenant_id.length > 0)
          ? metadata.tenant_id
          : (Deno.env.get('OUTLOOK_TENANT_ID') ?? 'common'),
      });
    accessToken = refreshed.accessToken;
    tokenType = refreshed.tokenType;
    scope = refreshed.scope;
    expiresAt = refreshed.expiresAt;

    const { error: updateTokenError } = await supabaseAdmin
      .from('integration_oauth_tokens')
      .update({
        access_token: accessToken,
        token_type: tokenType,
        scope,
        expires_at: expiresAt,
      })
      .eq('organization_id', integration.organization_id)
      .eq('integration_id', integration.id)
      .eq('provider', oauthProvider);

    if (updateTokenError) {
      throw new Error(`Failed to persist refreshed ${oauthProvider} token: ${updateTokenError.message}`);
    }
  }

  if (oauthProvider === 'outlook') {
    return {
      ...metadata,
      outlook_access_token: accessToken,
      outlook_account_email: token.provider_account_email,
      outlook_token_type: tokenType,
      outlook_scope: scope,
      outlook_token_expires_at: expiresAt,
    };
  }

  return {
    ...metadata,
    gmail_access_token: accessToken,
    gmail_account_email: token.provider_account_email,
    gmail_token_type: tokenType,
    gmail_scope: scope,
    gmail_token_expires_at: expiresAt,
  };
}

async function persistStepRecords(
  supabaseAdmin: ReturnType<typeof createClient>,
  params: {
    organizationId: string;
    integrationId: string;
    provider: string;
    target: SyncTarget;
    records: SyncRecord[];
  },
): Promise<PersistResult> {
  const nowIso = new Date().toISOString();

  const dedupedMap = new Map<string, SyncRecord>();
  for (const record of params.records) {
    if (record.externalId) dedupedMap.set(record.externalId, record);
  }
  const deduped = Array.from(dedupedMap.values());

  if (deduped.length === 0) {
    return {
      processed: 0,
      failed: 0,
      created: 0,
      updated: 0,
      summary: `${params.target}: no records to persist`,
    };
  }

  const existingIds = new Set<string>();
  for (const idsChunk of chunk(deduped.map((record) => record.externalId), 500)) {
    const { data: existingRows, error: existingError } = await supabaseAdmin
      .from('integration_sync_objects')
      .select('external_id')
      .eq('organization_id', params.organizationId)
      .eq('integration_id', params.integrationId)
      .eq('provider', params.provider)
      .eq('sync_target', params.target)
      .in('external_id', idsChunk);

    if (existingError) {
      throw new Error(`Failed reading existing sync objects: ${existingError.message}`);
    }

    for (const row of existingRows ?? []) {
      const externalId = (row as { external_id?: string }).external_id;
      if (externalId) existingIds.add(externalId);
    }
  }

  const created = deduped.reduce((acc, record) => acc + (existingIds.has(record.externalId) ? 0 : 1), 0);
  const updated = deduped.length - created;

  const upsertRows = deduped.map((record) => ({
    organization_id: params.organizationId,
    integration_id: params.integrationId,
    provider: params.provider,
    sync_target: params.target,
    external_id: record.externalId,
    external_updated_at: record.externalUpdatedAt,
    payload: record.payload,
    last_seen_at: nowIso,
    first_seen_at: existingIds.has(record.externalId) ? undefined : nowIso,
  }));

  const { error: upsertError } = await supabaseAdmin
    .from('integration_sync_objects')
    .upsert(upsertRows, {
      onConflict: 'organization_id,integration_id,provider,sync_target,external_id',
      ignoreDuplicates: false,
    });

  if (upsertError) {
    throw new Error(`Failed persisting sync objects: ${upsertError.message}`);
  }

  return {
    processed: deduped.length,
    failed: 0,
    created,
    updated,
    summary: `${params.target}: upserted ${deduped.length} (${created} new, ${updated} updated)`,
  };
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('Origin') || '';
  const corsHeaders = makeCorsHeaders(origin);

  const auth = await requireOrgRoleAccess(req, {
    action: 'process_integration_sync_jobs',
    allowedRoles: ['admin', 'manager', 'ops'],
    allowlistEnvKey: 'INTEGRATION_JOBS_ALLOWED_USER_IDS',
    corsHeaders,
  });
  if (!auth.ok) return auth.response;

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SB_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Server misconfiguration: missing service role key or URL' }, 500, corsHeaders);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  try {
    const body = await req.json().catch(() => ({}));
    const requestedJobId = typeof body.jobId === 'string' ? body.jobId : null;

    let job: IntegrationSyncJobRow | null = null;

    if (requestedJobId) {
      const { data, error } = await supabaseAdmin
        .from('integration_sync_jobs')
        .select('*')
        .eq('id', requestedJobId)
        .eq('organization_id', auth.organizationId)
        .maybeSingle();

      if (error) {
        return jsonResponse({ error: `Failed to load integration job: ${error.message}` }, 500, corsHeaders);
      }

      if (!data) {
        return jsonResponse({ error: 'Integration job not found' }, 404, corsHeaders);
      }

      job = data as unknown as IntegrationSyncJobRow;
    } else {
      const { data, error } = await supabaseAdmin
        .from('integration_sync_jobs')
        .select('*')
        .eq('organization_id', auth.organizationId)
        .eq('status', 'queued')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        return jsonResponse({ error: `Failed to fetch queued jobs: ${error.message}` }, 500, corsHeaders);
      }

      job = (data ?? null) as unknown as IntegrationSyncJobRow | null;
    }

    if (!job) {
      return jsonResponse({ processed: false, message: 'No queued jobs for this organization' }, 200, corsHeaders);
    }

    if (job.status !== 'queued') {
      return jsonResponse(
        {
          processed: false,
          jobId: job.id,
          status: job.status,
          message: `Job is not queued (current status: ${job.status})`,
        },
        409,
        corsHeaders,
      );
    }

    const startedAt = new Date().toISOString();
    const { data: claimedJob, error: claimError } = await supabaseAdmin
      .from('integration_sync_jobs')
      .update({ status: 'running', started_at: startedAt, error_message: null })
      .eq('id', job.id)
      .eq('organization_id', auth.organizationId)
      .eq('status', 'queued')
      .select('*')
      .maybeSingle();

    if (claimError) {
      return jsonResponse({ error: `Failed to claim job: ${claimError.message}` }, 500, corsHeaders);
    }

    if (!claimedJob) {
      return jsonResponse({ processed: false, jobId: job.id, message: 'Job was claimed by another worker' }, 409, corsHeaders);
    }

    const activeJob = claimedJob as unknown as IntegrationSyncJobRow;

    const { data: integrationData, error: integrationError } = await supabaseAdmin
      .from('integration_connections')
      .select('*')
      .eq('id', activeJob.integration_id)
      .eq('organization_id', auth.organizationId)
      .maybeSingle();

    if (integrationError || !integrationData) {
      const errMsg = integrationError?.message ?? 'Integration not found';
      await supabaseAdmin
        .from('integration_sync_jobs')
        .update({ status: 'error', error_message: errMsg, finished_at: new Date().toISOString() })
        .eq('id', activeJob.id)
        .eq('organization_id', auth.organizationId);
      return jsonResponse({ error: `Cannot process job: ${errMsg}` }, 400, corsHeaders);
    }

    const integration = integrationData as unknown as IntegrationConnectionRow;
    if (!integration.is_enabled) {
      const errMsg = 'Integration is disabled';
      await supabaseAdmin
        .from('integration_sync_jobs')
        .update({ status: 'cancelled', error_message: errMsg, finished_at: new Date().toISOString() })
        .eq('id', activeJob.id)
        .eq('organization_id', auth.organizationId);
      return jsonResponse({ processed: false, jobId: activeJob.id, status: 'cancelled', message: errMsg }, 200, corsHeaders);
    }

    const { data: runRow, error: runCreateError } = await supabaseAdmin
      .from('integration_sync_runs')
      .insert({
        integration_id: integration.id,
        organization_id: auth.organizationId,
        run_type: activeJob.job_type,
        status: 'running',
      })
      .select('id')
      .single();

    if (runCreateError) {
      await supabaseAdmin
        .from('integration_sync_jobs')
        .update({ status: 'error', error_message: runCreateError.message, finished_at: new Date().toISOString() })
        .eq('id', activeJob.id)
        .eq('organization_id', auth.organizationId);

      return jsonResponse({ error: `Failed to create sync run: ${runCreateError.message}` }, 500, corsHeaders);
    }

    const runId = runRow.id as string;
    let targets: SyncTarget[] = [];

    let totalProcessed = 0;
    let totalFailed = 0;
    let totalCreated = 0;
    let totalUpdated = 0;
    const stepSummaries: string[] = [];
    const perTarget: Record<string, { fetched: number; created: number; updated: number; failed: number }> = {};

    try {
      const connector = getIntegrationConnector(integration.provider);
      const connectorMetadata = await resolveConnectorMetadata(supabaseAdmin, integration);
      const connectorCtx: IntegrationConnectorContext = {
        organizationId: auth.organizationId,
        integrationId: integration.id,
        provider: integration.provider,
        metadata: connectorMetadata,
      };
      targets = parseSyncTargets(integration.provider, activeJob.payload ?? {});

      await connector.testConnection(connectorCtx);

      for (const target of targets) {
        try {
          const syncResult = await runStep(target, connectorCtx, connector);
          const persisted = await persistStepRecords(supabaseAdmin, {
            organizationId: auth.organizationId,
            integrationId: integration.id,
            provider: integration.provider,
            target,
            records: syncResult.records,
          });

          totalProcessed += persisted.processed;
          totalFailed += syncResult.failed + persisted.failed;
          totalCreated += persisted.created;
          totalUpdated += persisted.updated;

          perTarget[target] = {
            fetched: syncResult.records.length,
            created: persisted.created,
            updated: persisted.updated,
            failed: syncResult.failed + persisted.failed,
          };

          stepSummaries.push(`${target}: ${persisted.summary}`);
        } catch (stepError) {
          const stepMessage = safeErrorMessage(stepError);
          totalFailed += 1;
          perTarget[target] = {
            fetched: 0,
            created: 0,
            updated: 0,
            failed: 1,
          };
          stepSummaries.push(`${target}: failed (${stepMessage})`);
        }
      }

      const finishedAt = new Date().toISOString();
      const durationMs = Math.max(0, Date.now() - new Date(startedAt).getTime());
      const runStatus = totalFailed > 0 ? 'error' : 'success';
      const joinedSummary = stepSummaries.join(' | ');
      const metrics = {
        targets,
        created: totalCreated,
        updated: totalUpdated,
        per_target: perTarget,
      };

      await supabaseAdmin
        .from('integration_sync_runs')
        .update({
          status: runStatus,
          records_processed: totalProcessed,
          records_failed: totalFailed,
          finished_at: finishedAt,
          duration_ms: durationMs,
          metrics,
          error_message: runStatus === 'success' ? null : joinedSummary,
        })
        .eq('id', runId)
        .eq('organization_id', auth.organizationId);

      await supabaseAdmin
        .from('integration_sync_jobs')
        .update({
          status: runStatus,
          finished_at: finishedAt,
          error_message: runStatus === 'success' ? null : joinedSummary,
        })
        .eq('id', activeJob.id)
        .eq('organization_id', auth.organizationId);

      await supabaseAdmin
        .from('integration_connections')
        .update({
          status: runStatus === 'success' ? 'connected' : 'error',
          last_sync_at: finishedAt,
          last_error: runStatus === 'success' ? null : joinedSummary,
        })
        .eq('id', integration.id)
        .eq('organization_id', auth.organizationId);

      return jsonResponse(
        {
          processed: true,
          jobId: activeJob.id,
          runId,
          status: runStatus,
          targets,
          durationMs,
          recordsProcessed: totalProcessed,
          recordsFailed: totalFailed,
          recordsCreated: totalCreated,
          recordsUpdated: totalUpdated,
          summary: joinedSummary,
        },
        200,
        corsHeaders,
      );
    } catch (error) {
      const message = safeErrorMessage(error);
      const finishedAt = new Date().toISOString();
      const durationMs = Math.max(0, Date.now() - new Date(startedAt).getTime());

      await supabaseAdmin
        .from('integration_sync_runs')
        .update({
          status: 'error',
          records_processed: totalProcessed,
          records_failed: totalFailed + 1,
          finished_at: finishedAt,
          duration_ms: durationMs,
          metrics: {
            targets,
            created: totalCreated,
            updated: totalUpdated,
            per_target: perTarget,
          },
          error_message: message,
        })
        .eq('id', runId)
        .eq('organization_id', auth.organizationId);

      await supabaseAdmin
        .from('integration_sync_jobs')
        .update({
          status: 'error',
          finished_at: finishedAt,
          error_message: message,
        })
        .eq('id', activeJob.id)
        .eq('organization_id', auth.organizationId);

      await supabaseAdmin
        .from('integration_connections')
        .update({
          status: 'error',
          last_sync_at: finishedAt,
          last_error: message,
        })
        .eq('id', integration.id)
        .eq('organization_id', auth.organizationId);

      return jsonResponse(
        {
          processed: true,
          jobId: activeJob.id,
          runId,
          status: 'error',
          targets,
          durationMs,
          recordsProcessed: totalProcessed,
          recordsFailed: totalFailed + 1,
          recordsCreated: totalCreated,
          recordsUpdated: totalUpdated,
          error: message,
        },
        200,
        corsHeaders,
      );
    }
  } catch (error) {
    return jsonResponse({ error: safeErrorMessage(error) }, 500, corsHeaders);
  }
});
