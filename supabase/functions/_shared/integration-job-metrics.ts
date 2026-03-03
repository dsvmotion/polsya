export type IntegrationHealthJobRow = {
  provider: string;
  status: string;
  created_at: string;
  next_retry_at: string | null;
  dead_lettered_at: string | null;
};

export type IntegrationHealthRunRow = {
  provider: string;
  status: string;
  duration_ms: number;
  created_at: string;
};

export type ProviderHealthSummary = {
  queueDepth: number;
  runningJobs: number;
  deadLetteredJobs: number;
  completedRuns: number;
  p95DurationMs: number;
  errorRatePct: number;
};

export type IntegrationHealthLevel = 'ok' | 'warning' | 'critical';

export type IntegrationHealthSummary = {
  lookbackHours: number;
  windowStart: string;
  windowEnd: string;
  totalJobs: number;
  queuedJobs: number;
  successJobs: number;
  errorJobs: number;
  cancelledJobs: number;
  queueDepth: number;
  queuedReadyJobs: number;
  retryScheduledJobs: number;
  runningJobs: number;
  deadLetteredJobs: number;
  completedRuns: number;
  p95DurationMs: number;
  avgDurationMs: number;
  errorRatePct: number;
  stuckQueuedJobs: number;
  lastRunAt: string | null;
  level: IntegrationHealthLevel;
  byProvider: Record<string, ProviderHealthSummary>;
  sampleJobs: number;
  sampleRuns: number;
};

export function parsePositiveInt(raw: unknown, fallback: number, min: number, max: number): number {
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  const parsed = Math.floor(value);
  if (parsed < min) return min;
  if (parsed > max) return max;
  return parsed;
}

export function parseLookbackHours(raw: unknown): number {
  return parsePositiveInt(raw, 24, 1, 168);
}

export function parseStuckThresholdMinutes(raw: unknown): number {
  return parsePositiveInt(raw, 15, 1, 240);
}

export function parseIntegrationMetricsSampleLimit(raw: unknown): number {
  return parsePositiveInt(raw, 2000, 100, 10_000);
}

export function computeRetryBackoffMs(
  attemptCount: number,
  baseDelayMs: number,
  maxDelayMs: number,
): number {
  const exponent = Math.max(0, attemptCount - 1);
  const delay = baseDelayMs * (2 ** exponent);
  return Math.min(delay, maxDelayMs);
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

function deriveHealthLevel(params: {
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

function isQueuedReady(job: Pick<IntegrationHealthJobRow, 'status' | 'next_retry_at'>, nowMs: number): boolean {
  if (job.status !== 'queued') return false;
  if (!job.next_retry_at) return true;
  const retryMs = Date.parse(job.next_retry_at);
  return Number.isFinite(retryMs) ? retryMs <= nowMs : true;
}

function isStuckQueuedJob(
  job: Pick<IntegrationHealthJobRow, 'status' | 'created_at' | 'next_retry_at'>,
  nowMs: number,
  thresholdMs: number,
): boolean {
  if (job.status !== 'queued') return false;
  const createdMs = Date.parse(job.created_at);
  if (!Number.isFinite(createdMs)) return false;
  if (nowMs - createdMs < thresholdMs) return false;
  return isQueuedReady(job, nowMs);
}

function summarizeProviderHealth(
  jobs: readonly IntegrationHealthJobRow[],
  runs: readonly IntegrationHealthRunRow[],
): ProviderHealthSummary {
  const queueDepth = jobs.filter((job) => job.status === 'queued').length;
  const runningJobs = jobs.filter((job) => job.status === 'running').length;
  const deadLetteredJobs = jobs.filter((job) => !!job.dead_lettered_at).length;

  const completedRuns = runs.filter((run) => run.status === 'success' || run.status === 'error');
  const durations = completedRuns
    .map((run) => Number(run.duration_ms))
    .filter((value) => Number.isFinite(value) && value >= 0);
  const errorRuns = completedRuns.filter((run) => run.status === 'error').length;

  return {
    queueDepth,
    runningJobs,
    deadLetteredJobs,
    completedRuns: completedRuns.length,
    p95DurationMs: percentile95(durations),
    errorRatePct: toPct(errorRuns, completedRuns.length),
  };
}

export function buildIntegrationHealthSummary(params: {
  jobs: readonly IntegrationHealthJobRow[];
  runs: readonly IntegrationHealthRunRow[];
  lookbackHours: number;
  stuckThresholdMinutes: number;
  nowMs?: number;
}): IntegrationHealthSummary {
  const nowMs = params.nowMs ?? Date.now();
  const thresholdMs = params.stuckThresholdMinutes * 60_000;
  const windowStart = new Date(nowMs - params.lookbackHours * 60 * 60 * 1000).toISOString();

  const queuedJobs = params.jobs.filter((job) => job.status === 'queued').length;
  const queuedReadyJobs = params.jobs.filter((job) => isQueuedReady(job, nowMs)).length;
  const retryScheduledJobs = params.jobs.filter((job) => job.status === 'queued' && !!job.next_retry_at).length;
  const runningJobs = params.jobs.filter((job) => job.status === 'running').length;
  const successJobs = params.jobs.filter((job) => job.status === 'success').length;
  const errorJobs = params.jobs.filter((job) => job.status === 'error').length;
  const cancelledJobs = params.jobs.filter((job) => job.status === 'cancelled').length;
  const deadLetteredJobs = params.jobs.filter((job) => !!job.dead_lettered_at).length;
  const stuckQueuedJobs = params.jobs.filter((job) =>
    isStuckQueuedJob(job, nowMs, thresholdMs)
  ).length;

  const completedRuns = params.runs.filter((run) => run.status === 'success' || run.status === 'error');
  const durations = completedRuns
    .map((run) => Number(run.duration_ms))
    .filter((value) => Number.isFinite(value) && value >= 0);
  const errorRuns = completedRuns.filter((run) => run.status === 'error').length;

  const providers = new Set<string>();
  for (const job of params.jobs) providers.add(job.provider);
  for (const run of params.runs) providers.add(run.provider);

  const byProvider: Record<string, ProviderHealthSummary> = {};
  for (const provider of providers) {
    byProvider[provider] = summarizeProviderHealth(
      params.jobs.filter((job) => job.provider === provider),
      params.runs.filter((run) => run.provider === provider),
    );
  }

  const lastRunAt = params.runs.length
    ? [...params.runs]
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0]?.created_at ?? null
    : null;
  const errorRatePct = toPct(errorRuns, completedRuns.length);
  const level = deriveHealthLevel({ errorRatePct, stuckQueuedJobs, deadLetteredJobs });

  return {
    lookbackHours: params.lookbackHours,
    windowStart,
    windowEnd: new Date(nowMs).toISOString(),
    totalJobs: params.jobs.length,
    queuedJobs,
    successJobs,
    errorJobs,
    cancelledJobs,
    queueDepth: queuedJobs,
    queuedReadyJobs,
    retryScheduledJobs,
    runningJobs,
    deadLetteredJobs,
    completedRuns: completedRuns.length,
    p95DurationMs: percentile95(durations),
    avgDurationMs: avg(durations),
    errorRatePct,
    stuckQueuedJobs,
    lastRunAt,
    level,
    byProvider,
    sampleJobs: params.jobs.length,
    sampleRuns: params.runs.length,
  };
}
