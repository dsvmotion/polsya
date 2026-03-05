// Domain types for the Ingestion Engine.
// Matches DB tables: ingestion_providers, ingestion_runs, ingestion_jobs.

// ─── Provider ───────────────────────────────

export const PROVIDER_TYPES = ['linkedin', 'behance', 'dribbble', 'csv_import', 'api', 'webhook', 'manual'] as const;
export type ProviderType = (typeof PROVIDER_TYPES)[number];

export const PROVIDER_TYPE_LABELS: Record<ProviderType, string> = {
  linkedin: 'LinkedIn',
  behance: 'Behance',
  dribbble: 'Dribbble',
  csv_import: 'CSV Import',
  api: 'API',
  webhook: 'Webhook',
  manual: 'Manual',
};

export interface IngestionProvider {
  id: string;
  organizationId: string;
  providerType: ProviderType;
  name: string;
  config: Record<string, unknown>;
  isActive: boolean;
  lastSyncAt: string | null;
  syncFrequencyMinutes: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── Run ────────────────────────────────────

export const RUN_STATUSES = ['pending', 'running', 'completed', 'failed', 'cancelled'] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];

export const RUN_STATUS_LABELS: Record<RunStatus, string> = {
  pending: 'Pending',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export const RUN_STATUS_COLORS: Record<RunStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-gray-100', text: 'text-gray-800' },
  running: { bg: 'bg-blue-100', text: 'text-blue-800' },
  completed: { bg: 'bg-green-100', text: 'text-green-800' },
  failed: { bg: 'bg-red-100', text: 'text-red-800' },
  cancelled: { bg: 'bg-amber-100', text: 'text-amber-800' },
};

export interface IngestionRun {
  id: string;
  organizationId: string;
  providerId: string;
  status: RunStatus;
  startedAt: string | null;
  completedAt: string | null;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  errorLog: unknown[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── Job ────────────────────────────────────

export const JOB_STATUSES = ['pending', 'running', 'completed', 'failed', 'skipped'] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  pending: 'Pending',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
  skipped: 'Skipped',
};

export const JOB_STATUS_COLORS: Record<JobStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-gray-100', text: 'text-gray-800' },
  running: { bg: 'bg-blue-100', text: 'text-blue-800' },
  completed: { bg: 'bg-green-100', text: 'text-green-800' },
  failed: { bg: 'bg-red-100', text: 'text-red-800' },
  skipped: { bg: 'bg-slate-100', text: 'text-slate-600' },
};

export interface IngestionJob {
  id: string;
  runId: string;
  organizationId: string;
  jobType: string;
  status: JobStatus;
  inputData: Record<string, unknown>;
  outputData: Record<string, unknown>;
  errorMessage: string | null;
  attempts: number;
  maxAttempts: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
