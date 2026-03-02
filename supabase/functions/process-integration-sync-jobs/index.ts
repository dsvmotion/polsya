import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, corsHeaders as makeCorsHeaders } from '../_shared/cors.ts';
import { requireOrgRoleAccess } from '../_shared/auth.ts';
import {
  getIntegrationConnector,
  parseSyncTargets,
  type IntegrationConnectorContext,
  type SyncTarget,
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
    const connector = getIntegrationConnector(integration.provider);
    const connectorCtx: IntegrationConnectorContext = {
      organizationId: auth.organizationId,
      integrationId: integration.id,
      provider: integration.provider,
      metadata: integration.metadata ?? {},
    };

    const targets = parseSyncTargets(activeJob.payload ?? {});

    let totalProcessed = 0;
    let totalFailed = 0;
    const stepSummaries: string[] = [];

    try {
      await connector.testConnection(connectorCtx);

      for (const target of targets) {
        const result = await runStep(target, connectorCtx, connector);
        totalProcessed += result.processed;
        totalFailed += result.failed;
        stepSummaries.push(`${target}: ${result.summary}`);
      }

      const finishedAt = new Date().toISOString();
      const runStatus = totalFailed > 0 ? 'error' : 'success';
      const joinedSummary = stepSummaries.join(' | ');

      await supabaseAdmin
        .from('integration_sync_runs')
        .update({
          status: runStatus,
          records_processed: totalProcessed,
          records_failed: totalFailed,
          finished_at: finishedAt,
          error_message: totalFailed > 0 ? joinedSummary : null,
        })
        .eq('id', runId)
        .eq('organization_id', auth.organizationId);

      await supabaseAdmin
        .from('integration_sync_jobs')
        .update({
          status: runStatus,
          finished_at: finishedAt,
          error_message: totalFailed > 0 ? joinedSummary : null,
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
          recordsProcessed: totalProcessed,
          recordsFailed: totalFailed,
          summary: joinedSummary,
        },
        200,
        corsHeaders,
      );
    } catch (error) {
      const message = safeErrorMessage(error);
      const finishedAt = new Date().toISOString();

      await supabaseAdmin
        .from('integration_sync_runs')
        .update({
          status: 'error',
          records_processed: totalProcessed,
          records_failed: totalFailed + 1,
          finished_at: finishedAt,
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
          recordsProcessed: totalProcessed,
          recordsFailed: totalFailed + 1,
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
