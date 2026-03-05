import type { IngestionProvider, IngestionRun, IngestionJob, ProviderType, RunStatus, JobStatus } from '@/types/ingestion';

// ─── Provider Row ───────────────────────────

export interface IngestionProviderRow {
  id: string;
  organization_id: string;
  provider_type: string;
  name: string;
  config: Record<string, unknown>;
  credentials_encrypted: string | null;
  is_active: boolean;
  last_sync_at: string | null;
  sync_frequency_minutes: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function toIngestionProvider(row: IngestionProviderRow): IngestionProvider {
  return {
    id: row.id,
    organizationId: row.organization_id,
    providerType: row.provider_type as ProviderType,
    name: row.name,
    config: row.config ?? {},
    isActive: row.is_active ?? true,
    lastSyncAt: row.last_sync_at,
    syncFrequencyMinutes: row.sync_frequency_minutes ?? 60,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toIngestionProviders(rows: readonly IngestionProviderRow[]): IngestionProvider[] {
  return rows.map(toIngestionProvider);
}

// ─── Run Row ────────────────────────────────

export interface IngestionRunRow {
  id: string;
  organization_id: string;
  provider_id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  records_processed: number;
  records_created: number;
  records_updated: number;
  records_failed: number;
  error_log: unknown[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function toIngestionRun(row: IngestionRunRow): IngestionRun {
  return {
    id: row.id,
    organizationId: row.organization_id,
    providerId: row.provider_id,
    status: row.status as RunStatus,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    recordsProcessed: row.records_processed ?? 0,
    recordsCreated: row.records_created ?? 0,
    recordsUpdated: row.records_updated ?? 0,
    recordsFailed: row.records_failed ?? 0,
    errorLog: row.error_log ?? [],
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toIngestionRuns(rows: readonly IngestionRunRow[]): IngestionRun[] {
  return rows.map(toIngestionRun);
}

// ─── Job Row ────────────────────────────────

export interface IngestionJobRow {
  id: string;
  run_id: string;
  organization_id: string;
  job_type: string;
  status: string;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  error_message: string | null;
  attempts: number;
  max_attempts: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function toIngestionJob(row: IngestionJobRow): IngestionJob {
  return {
    id: row.id,
    runId: row.run_id,
    organizationId: row.organization_id,
    jobType: row.job_type,
    status: row.status as JobStatus,
    inputData: row.input_data ?? {},
    outputData: row.output_data ?? {},
    errorMessage: row.error_message,
    attempts: row.attempts ?? 0,
    maxAttempts: row.max_attempts ?? 3,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toIngestionJobs(rows: readonly IngestionJobRow[]): IngestionJob[] {
  return rows.map(toIngestionJob);
}
