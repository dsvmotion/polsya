import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, corsHeaders as makeCorsHeaders } from '../_shared/cors.ts';
import { requireOrgRoleAccess } from '../_shared/auth.ts';
import { requireBillingAccessForOrg } from '../_shared/billing.ts';
import { logEdgeEvent } from '../_shared/observability.ts';
import {
  buildIntegrationHealthSummary,
  parseIntegrationMetricsSampleLimit,
  parseLookbackHours,
  parseStuckThresholdMinutes,
  type IntegrationHealthJobRow,
  type IntegrationHealthRunRow,
} from '../_shared/integration-job-metrics.ts';
import { planRetryTransition } from '../_shared/integration-job-retry.ts';
import {
  getIntegrationConnector,
  parseSyncTargets,
  type IntegrationConnectorContext,
  type SyncTarget,
  type SyncRecord,
} from '../_shared/integration-connectors.ts';
import { resolveCredentials } from '../_shared/credential-resolver.ts';

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
  attempt_count: number;
  max_attempts: number;
  next_retry_at: string | null;
  last_attempt_at: string | null;
  dead_lettered_at: string | null;
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

type PersistResult = {
  processed: number;
  failed: number;
  created: number;
  updated: number;
  summary: string;
};

type RetryTransition = {
  status: 'queued' | 'error';
  retryScheduled: boolean;
  deadLettered: boolean;
  nextRetryAt: string | null;
  attemptCount: number;
  maxAttempts: number;
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

function retryBaseDelayMs(): number {
  const value = Number(Deno.env.get('INTEGRATION_JOB_RETRY_BASE_MS') ?? '60000');
  return Number.isFinite(value) && value > 0 ? value : 60_000;
}

function retryMaxDelayMs(): number {
  const value = Number(Deno.env.get('INTEGRATION_JOB_RETRY_MAX_MS') ?? '1800000');
  return Number.isFinite(value) && value > 0 ? value : 1_800_000;
}

async function transitionJobAfterFailure(
  supabaseAdmin: ReturnType<typeof createClient>,
  params: {
    job: IntegrationSyncJobRow;
    errorMessage: string;
    finishedAt: string;
  },
): Promise<RetryTransition> {
  const plan = planRetryTransition({
    attemptCountRaw: params.job.attempt_count,
    maxAttemptsRaw: params.job.max_attempts,
    nowMs: Date.now(),
    baseDelayMs: retryBaseDelayMs(),
    maxDelayMs: retryMaxDelayMs(),
  });

  if (plan.deadLettered) {
    const { error: jobUpdateError } = await supabaseAdmin
      .from('integration_sync_jobs')
      .update({
        status: 'error',
        finished_at: params.finishedAt,
        started_at: null,
        next_retry_at: null,
        dead_lettered_at: params.finishedAt,
        error_message: params.errorMessage,
      })
      .eq('id', params.job.id)
      .eq('organization_id', params.job.organization_id);

    if (jobUpdateError) {
      throw new Error(`Failed to dead-letter integration job: ${jobUpdateError.message}`);
    }

    const { error: dlqError } = await supabaseAdmin
      .from('integration_sync_job_dead_letters')
      .upsert(
        {
          organization_id: params.job.organization_id,
          job_id: params.job.id,
          integration_id: params.job.integration_id,
          provider: params.job.provider,
          job_type: params.job.job_type,
          payload: params.job.payload ?? {},
          attempt_count: plan.attemptCount,
          max_attempts: plan.maxAttempts,
          error_message: params.errorMessage,
          first_created_at: params.job.created_at,
          failed_at: params.finishedAt,
        },
        { onConflict: 'job_id', ignoreDuplicates: false },
      );

    if (dlqError) {
      throw new Error(`Failed to write dead-letter record: ${dlqError.message}`);
    }

    return plan;
  }

  const { error: jobUpdateError } = await supabaseAdmin
    .from('integration_sync_jobs')
    .update({
      status: 'queued',
      started_at: null,
      finished_at: null,
      next_retry_at: plan.nextRetryAt,
      dead_lettered_at: null,
      error_message: params.errorMessage,
    })
    .eq('id', params.job.id)
    .eq('organization_id', params.job.organization_id);

  if (jobUpdateError) {
    throw new Error(`Failed to schedule integration job retry: ${jobUpdateError.message}`);
  }

  return plan;
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
  const billing = await requireBillingAccessForOrg(supabaseAdmin, auth.organizationId, {
    action: 'process_integration_sync_jobs',
    corsHeaders,
  });
  if (!billing.ok) return billing.response;

  try {
    const body = await req.json().catch(() => ({}));
    if (body?.mode === 'metrics') {
      const lookbackHours = parseLookbackHours((body as Record<string, unknown>).lookbackHours);
      const stuckThresholdMinutes = parseStuckThresholdMinutes((body as Record<string, unknown>).stuckThresholdMinutes);
      const sampleLimit = parseIntegrationMetricsSampleLimit(
        Deno.env.get('INTEGRATION_METRICS_SAMPLE_LIMIT'),
      );
      const cutoffIso = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString();

      const [{ data: jobs, error: jobsError }, { data: runs, error: runsError }] = await Promise.all([
        supabaseAdmin
          .from('integration_sync_jobs')
          .select('provider,status,created_at,next_retry_at,dead_lettered_at')
          .eq('organization_id', auth.organizationId)
          .gte('created_at', cutoffIso)
          .order('created_at', { ascending: false })
          .limit(sampleLimit),
        supabaseAdmin
          .from('integration_sync_runs')
          .select('provider,status,duration_ms,created_at')
          .eq('organization_id', auth.organizationId)
          .gte('created_at', cutoffIso)
          .order('created_at', { ascending: false })
          .limit(sampleLimit),
      ]);

      if (jobsError) {
        return jsonResponse({ error: `Failed to fetch integration jobs metrics: ${jobsError.message}` }, 500, corsHeaders);
      }
      if (runsError) {
        return jsonResponse({ error: `Failed to fetch integration runs metrics: ${runsError.message}` }, 500, corsHeaders);
      }

      const summary = buildIntegrationHealthSummary({
        jobs: (jobs ?? []) as unknown as IntegrationHealthJobRow[],
        runs: (runs ?? []) as unknown as IntegrationHealthRunRow[],
        lookbackHours,
        stuckThresholdMinutes,
      });

      logEdgeEvent('info', {
        action: 'integration_sync_metrics_exported',
        organization_id: auth.organizationId,
        integration_id: null,
        job_id: null,
        lookback_hours: lookbackHours,
        queue_depth: summary.queueDepth,
        queued_ready_jobs: summary.queuedReadyJobs,
        running_jobs: summary.runningJobs,
        dead_lettered_jobs: summary.deadLetteredJobs,
        stuck_queued_jobs: summary.stuckQueuedJobs,
        p95_duration_ms: summary.p95DurationMs,
        avg_duration_ms: summary.avgDurationMs,
        error_rate_pct: summary.errorRatePct,
        sample_jobs: summary.sampleJobs,
        sample_runs: summary.sampleRuns,
      });

      return jsonResponse(summary as unknown as Record<string, unknown>, 200, corsHeaders);
    }

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
      const nowIso = new Date().toISOString();

      const { data: readyWithoutRetryDate, error: readyWithoutRetryDateError } = await supabaseAdmin
        .from('integration_sync_jobs')
        .select('*')
        .eq('organization_id', auth.organizationId)
        .eq('status', 'queued')
        .is('next_retry_at', null)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (readyWithoutRetryDateError) {
        return jsonResponse({ error: `Failed to fetch queued jobs: ${readyWithoutRetryDateError.message}` }, 500, corsHeaders);
      }

      if (readyWithoutRetryDate) {
        job = readyWithoutRetryDate as unknown as IntegrationSyncJobRow;
      } else {
        const { data: retryReadyData, error: retryReadyError } = await supabaseAdmin
          .from('integration_sync_jobs')
          .select('*')
          .eq('organization_id', auth.organizationId)
          .eq('status', 'queued')
          .lte('next_retry_at', nowIso)
          .order('next_retry_at', { ascending: true })
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (retryReadyError) {
          return jsonResponse({ error: `Failed to fetch retryable jobs: ${retryReadyError.message}` }, 500, corsHeaders);
        }

        job = (retryReadyData ?? null) as unknown as IntegrationSyncJobRow | null;
      }
    }

    if (!job) {
      logEdgeEvent('info', {
        action: 'integration_sync_job_scan',
        organization_id: auth.organizationId,
        integration_id: null,
        job_id: null,
        processed: false,
        reason: 'no_queued_jobs',
      });
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
      .update({
        status: 'running',
        started_at: startedAt,
        last_attempt_at: startedAt,
        attempt_count: Math.max(0, job.attempt_count) + 1,
        next_retry_at: null,
        error_message: null,
      })
      .eq('id', job.id)
      .eq('organization_id', auth.organizationId)
      .eq('status', 'queued')
      .eq('attempt_count', Math.max(0, job.attempt_count))
      .select('*')
      .maybeSingle();

    if (claimError) {
      return jsonResponse({ error: `Failed to claim job: ${claimError.message}` }, 500, corsHeaders);
    }

    if (!claimedJob) {
      return jsonResponse({ processed: false, jobId: job.id, message: 'Job was claimed by another worker' }, 409, corsHeaders);
    }

    const activeJob = claimedJob as unknown as IntegrationSyncJobRow;
    logEdgeEvent('info', {
      action: 'integration_sync_job_claimed',
      organization_id: auth.organizationId,
      integration_id: activeJob.integration_id,
      job_id: activeJob.id,
      attempt_count: activeJob.attempt_count,
      max_attempts: activeJob.max_attempts,
      requested_job_id: requestedJobId,
    });

    const { data: integrationData, error: integrationError } = await supabaseAdmin
      .from('integration_connections')
      .select('*')
      .eq('id', activeJob.integration_id)
      .eq('organization_id', auth.organizationId)
      .maybeSingle();

    if (integrationError || !integrationData) {
      const errMsg = integrationError?.message ?? 'Integration not found';
      const finishedAt = new Date().toISOString();
      const retry = await transitionJobAfterFailure(supabaseAdmin, {
        job: activeJob,
        errorMessage: errMsg,
        finishedAt,
      });
      logEdgeEvent('error', {
        action: 'integration_sync_job_failed',
        organization_id: auth.organizationId,
        integration_id: activeJob.integration_id,
        job_id: activeJob.id,
        status: retry.status,
        retry_scheduled: retry.retryScheduled,
        next_retry_at: retry.nextRetryAt,
        dead_lettered: retry.deadLettered,
        error: errMsg,
      });

      return jsonResponse(
        {
          processed: true,
          jobId: activeJob.id,
          status: retry.status,
          retryScheduled: retry.retryScheduled,
          nextRetryAt: retry.nextRetryAt,
          deadLettered: retry.deadLettered,
          attemptCount: retry.attemptCount,
          maxAttempts: retry.maxAttempts,
          error: `Cannot process job: ${errMsg}`,
        },
        200,
        corsHeaders,
      );
    }

    const integration = integrationData as unknown as IntegrationConnectionRow;
    if (!integration.is_enabled) {
      const errMsg = 'Integration is disabled';
      const { error: cancelError } = await supabaseAdmin
        .from('integration_sync_jobs')
        .update({ status: 'cancelled', error_message: errMsg, finished_at: new Date().toISOString() })
        .eq('id', activeJob.id)
        .eq('organization_id', auth.organizationId);
      if (cancelError) {
        console.error('Failed to cancel sync job:', cancelError.message);
      }
      logEdgeEvent('warn', {
        action: 'integration_sync_job_cancelled',
        organization_id: auth.organizationId,
        integration_id: integration.id,
        job_id: activeJob.id,
        status: 'cancelled',
        reason: 'integration_disabled',
      });
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
      const finishedAt = new Date().toISOString();
      const retry = await transitionJobAfterFailure(supabaseAdmin, {
        job: activeJob,
        errorMessage: runCreateError.message,
        finishedAt,
      });
      logEdgeEvent('error', {
        action: 'integration_sync_job_failed',
        organization_id: auth.organizationId,
        integration_id: integration.id,
        job_id: activeJob.id,
        status: retry.status,
        retry_scheduled: retry.retryScheduled,
        next_retry_at: retry.nextRetryAt,
        dead_lettered: retry.deadLettered,
        error: `run_create_failed: ${runCreateError.message}`,
      });

      await supabaseAdmin
        .from('integration_connections')
        .update({
          status: 'error',
          last_sync_at: finishedAt,
          last_error: runCreateError.message,
        })
        .eq('id', integration.id)
        .eq('organization_id', auth.organizationId);

      return jsonResponse(
        {
          processed: true,
          jobId: activeJob.id,
          status: retry.status,
          retryScheduled: retry.retryScheduled,
          nextRetryAt: retry.nextRetryAt,
          deadLettered: retry.deadLettered,
          attemptCount: retry.attemptCount,
          maxAttempts: retry.maxAttempts,
          error: `Failed to create sync run: ${runCreateError.message}`,
        },
        200,
        corsHeaders,
      );
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
      const baseMetadata = {
        ...asMetadata(integration.metadata),
        _organization_id: integration.organization_id,
      };
      const resolved = await resolveCredentials(
        supabaseAdmin,
        integration.provider,
        integration.id,
        baseMetadata,
      );
      const { _organization_id: _, ...connectorMetadata } = resolved.metadata;
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

      const { error: runFinalizeError } = await supabaseAdmin
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
      if (runFinalizeError) {
        console.error('Failed to finalize sync run:', runFinalizeError.message);
      }

      let retry: RetryTransition | null = null;
      if (runStatus === 'success') {
        const { error: jobSuccessError } = await supabaseAdmin
          .from('integration_sync_jobs')
          .update({
            status: 'success',
            finished_at: finishedAt,
            started_at: null,
            next_retry_at: null,
            dead_lettered_at: null,
            error_message: null,
          })
          .eq('id', activeJob.id)
          .eq('organization_id', auth.organizationId);
        if (jobSuccessError) {
          console.error('Failed to mark sync job as success:', jobSuccessError.message);
        }
      } else {
        retry = await transitionJobAfterFailure(supabaseAdmin, {
          job: activeJob,
          errorMessage: joinedSummary || 'Sync failed',
          finishedAt,
        });
      }

      const { error: connStatusError } = await supabaseAdmin
        .from('integration_connections')
        .update({
          status: runStatus === 'success' ? 'connected' : 'error',
          last_sync_at: finishedAt,
          last_error: runStatus === 'success' ? null : joinedSummary,
        })
        .eq('id', integration.id)
        .eq('organization_id', auth.organizationId);
      if (connStatusError) {
        console.error('Failed to update integration connection status after sync:', connStatusError.message);
      }

      if (runStatus === 'success') {
        logEdgeEvent('info', {
          action: 'integration_sync_job_completed',
          organization_id: auth.organizationId,
          integration_id: integration.id,
          job_id: activeJob.id,
          run_id: runId,
          status: 'success',
          duration_ms: durationMs,
          records_processed: totalProcessed,
          records_failed: totalFailed,
          records_created: totalCreated,
          records_updated: totalUpdated,
        });
      } else {
        logEdgeEvent('warn', {
          action: 'integration_sync_job_failed',
          organization_id: auth.organizationId,
          integration_id: integration.id,
          job_id: activeJob.id,
          run_id: runId,
          status: retry?.status ?? 'error',
          retry_scheduled: retry?.retryScheduled ?? false,
          next_retry_at: retry?.nextRetryAt ?? null,
          dead_lettered: retry?.deadLettered ?? false,
          duration_ms: durationMs,
          records_processed: totalProcessed,
          records_failed: totalFailed,
          records_created: totalCreated,
          records_updated: totalUpdated,
          summary: joinedSummary,
        });
      }

      return jsonResponse(
        {
          processed: true,
          jobId: activeJob.id,
          runId,
          status: retry?.status ?? 'success',
          retryScheduled: retry?.retryScheduled ?? false,
          nextRetryAt: retry?.nextRetryAt ?? null,
          deadLettered: retry?.deadLettered ?? false,
          attemptCount: retry?.attemptCount ?? activeJob.attempt_count,
          maxAttempts: retry?.maxAttempts ?? activeJob.max_attempts,
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

      const retry = await transitionJobAfterFailure(supabaseAdmin, {
        job: activeJob,
        errorMessage: message,
        finishedAt,
      });

      await supabaseAdmin
        .from('integration_connections')
        .update({
          status: 'error',
          last_sync_at: finishedAt,
          last_error: message,
        })
        .eq('id', integration.id)
        .eq('organization_id', auth.organizationId);

      logEdgeEvent('error', {
        action: 'integration_sync_job_failed',
        organization_id: auth.organizationId,
        integration_id: integration.id,
        job_id: activeJob.id,
        run_id: runId,
        status: retry.status,
        retry_scheduled: retry.retryScheduled,
        next_retry_at: retry.nextRetryAt,
        dead_lettered: retry.deadLettered,
        duration_ms: durationMs,
        records_processed: totalProcessed,
        records_failed: totalFailed + 1,
        records_created: totalCreated,
        records_updated: totalUpdated,
        error: message,
      });

      return jsonResponse(
        {
          processed: true,
          jobId: activeJob.id,
          runId,
          status: retry.status,
          retryScheduled: retry.retryScheduled,
          nextRetryAt: retry.nextRetryAt,
          deadLettered: retry.deadLettered,
          attemptCount: retry.attemptCount,
          maxAttempts: retry.maxAttempts,
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
    logEdgeEvent('error', {
      action: 'integration_sync_job_unhandled_error',
      organization_id: auth.organizationId,
      integration_id: null,
      job_id: null,
      error: safeErrorMessage(error),
    });
    return jsonResponse({ error: safeErrorMessage(error) }, 500, corsHeaders);
  }
});
