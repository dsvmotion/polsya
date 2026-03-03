import type { IntegrationSyncJob, IntegrationSyncRun } from '@/types/integrations';

export type IntegrationHealthLevel = 'ok' | 'warning' | 'critical';

export interface IntegrationHealthSummary {
  totalJobs: number;
  queuedJobs: number;
  runningJobs: number;
  successJobs: number;
  errorJobs: number;
  cancelledJobs: number;
  deadLetteredJobs: number;
  completedRuns: number;
  p95DurationMs: number;
  avgDurationMs: number;
  errorRatePct: number;
  stuckQueuedJobs: number;
  retryScheduledJobs: number;
  lastRunAt: string | null;
  level: IntegrationHealthLevel;
}

interface SummarizeInput {
  jobs: readonly Pick<
    IntegrationSyncJob,
    'status' | 'created_at' | 'next_retry_at' | 'dead_lettered_at'
  >[];
  runs: readonly Pick<IntegrationSyncRun, 'status' | 'duration_ms' | 'created_at'>[];
  nowMs?: number;
  stuckThresholdMinutes?: number;
}

function percentile95(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
  return sorted[index];
}

function avg(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((acc, v) => acc + v, 0) / values.length);
}

function toPct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function isStuckQueuedJob(
  job: Pick<IntegrationSyncJob, 'status' | 'created_at' | 'next_retry_at'>,
  nowMs: number,
  thresholdMs: number,
): boolean {
  if (job.status !== 'queued') return false;

  const createdMs = new Date(job.created_at).getTime();
  if (!Number.isFinite(createdMs)) return false;
  if (nowMs - createdMs < thresholdMs) return false;

  if (!job.next_retry_at) return true;
  const retryMs = new Date(job.next_retry_at).getTime();
  if (!Number.isFinite(retryMs)) return true;
  return retryMs <= nowMs;
}

function deriveLevel(params: {
  errorRatePct: number;
  stuckQueuedJobs: number;
  deadLetteredJobs: number;
}): IntegrationHealthLevel {
  if (params.deadLetteredJobs > 0 || params.errorRatePct >= 20 || params.stuckQueuedJobs >= 3) {
    return 'critical';
  }
  if (params.errorRatePct >= 5 || params.stuckQueuedJobs > 0) {
    return 'warning';
  }
  return 'ok';
}

export function summarizeIntegrationHealth(input: SummarizeInput): IntegrationHealthSummary {
  const nowMs = input.nowMs ?? Date.now();
  const thresholdMs = (input.stuckThresholdMinutes ?? 15) * 60_000;

  const queuedJobs = input.jobs.filter((j) => j.status === 'queued').length;
  const runningJobs = input.jobs.filter((j) => j.status === 'running').length;
  const successJobs = input.jobs.filter((j) => j.status === 'success').length;
  const errorJobs = input.jobs.filter((j) => j.status === 'error').length;
  const cancelledJobs = input.jobs.filter((j) => j.status === 'cancelled').length;
  const deadLetteredJobs = input.jobs.filter((j) => !!j.dead_lettered_at).length;
  const retryScheduledJobs = input.jobs.filter((j) => j.status === 'queued' && !!j.next_retry_at).length;

  const stuckQueuedJobs = input.jobs.filter((job) =>
    isStuckQueuedJob(job, nowMs, thresholdMs)
  ).length;

  const completedRuns = input.runs.filter((run) => run.status === 'success' || run.status === 'error');
  const durations = completedRuns
    .map((run) => Number(run.duration_ms))
    .filter((value) => Number.isFinite(value) && value >= 0);

  const errorRuns = completedRuns.filter((run) => run.status === 'error').length;
  const errorRatePct = toPct(errorRuns, completedRuns.length);
  const p95DurationMs = percentile95(durations);
  const avgDurationMs = avg(durations);

  const lastRunAt = input.runs.length
    ? [...input.runs]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.created_at ?? null
    : null;

  const level = deriveLevel({ errorRatePct, stuckQueuedJobs, deadLetteredJobs });

  return {
    totalJobs: input.jobs.length,
    queuedJobs,
    runningJobs,
    successJobs,
    errorJobs,
    cancelledJobs,
    deadLetteredJobs,
    completedRuns: completedRuns.length,
    p95DurationMs,
    avgDurationMs,
    errorRatePct,
    stuckQueuedJobs,
    retryScheduledJobs,
    lastRunAt,
    level,
  };
}
