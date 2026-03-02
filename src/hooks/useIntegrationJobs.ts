import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { buildEdgeFunctionHeaders } from '@/lib/edge-function-headers';
import type {
  IntegrationSyncJob,
  IntegrationJobType,
  IntegrationJobStatus,
} from '@/types/integrations';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

function jobsKey(integrationId: string, limit: number) {
  return ['integration-jobs', integrationId, limit] as const;
}

function jobsPrefixKey(integrationId: string) {
  return ['integration-jobs', integrationId] as const;
}

export function useIntegrationJobs(integrationId: string | null, limit = 5) {
  return useQuery<IntegrationSyncJob[]>({
    queryKey: jobsKey(integrationId ?? '', limit),
    enabled: !!integrationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_sync_jobs')
        .select('*')
        .eq('integration_id', integrationId!)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as IntegrationSyncJob[];
    },
  });
}

interface EnqueueJobInput {
  integrationId: string;
  provider: string;
  jobType: IntegrationJobType;
  payload?: Record<string, unknown>;
  requestedBy?: string | null;
  idempotencyKey?: string | null;
}

export function useEnqueueIntegrationJob() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: EnqueueJobInput) => {
      const { data, error } = await supabase
        .from('integration_sync_jobs')
        .insert({
          integration_id: input.integrationId,
          provider: input.provider,
          job_type: input.jobType,
          status: 'queued' as const,
          payload: (input.payload ?? {}) as unknown as import('@/integrations/supabase/types').Json,
          requested_by: input.requestedBy ?? null,
          idempotency_key: input.idempotencyKey ?? null,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as unknown as IntegrationSyncJob;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: jobsPrefixKey(variables.integrationId) });
    },
  });
}

interface UpdateJobInput {
  id: string;
  integrationId: string;
  updates: {
    status?: IntegrationJobStatus;
    started_at?: string | null;
    finished_at?: string | null;
    error_message?: string | null;
  };
}

export function useUpdateIntegrationJob() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateJobInput) => {
      const { data, error } = await supabase
        .from('integration_sync_jobs')
        .update(input.updates)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as unknown as IntegrationSyncJob;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: jobsPrefixKey(variables.integrationId) });
    },
  });
}

interface ProcessJobInput {
  integrationId: string;
  jobId?: string;
}

interface ProcessJobResponse {
  processed: boolean;
  jobId?: string;
  runId?: string;
  status?: string;
  recordsProcessed?: number;
  recordsFailed?: number;
  summary?: string;
  error?: string;
}

export function useProcessIntegrationJob() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: ProcessJobInput): Promise<ProcessJobResponse> => {
      const headers = await buildEdgeFunctionHeaders({ 'Content-Type': 'application/json' });
      const response = await fetch(`${SUPABASE_URL}/functions/v1/process-integration-sync-jobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ jobId: input.jobId ?? null }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? `Failed to process integration job (${response.status})`);
      }

      return body as ProcessJobResponse;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: jobsPrefixKey(variables.integrationId) });
      qc.invalidateQueries({ queryKey: ['integration-runs', variables.integrationId] });
      qc.invalidateQueries({ queryKey: ['integration-connections'] });
    },
  });
}

export function createJobIdempotencyKey(
  integrationId: string,
  jobType: IntegrationJobType,
): string {
  const bucket = new Date().toISOString().slice(0, 16); // minute-level
  return `${integrationId}:${jobType}:${bucket}`;
}
