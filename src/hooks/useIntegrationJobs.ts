import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  IntegrationSyncJob,
  IntegrationJobType,
  IntegrationJobStatus,
} from '@/types/integrations';

function jobsKey(integrationId: string) {
  return ['integration-jobs', integrationId] as const;
}

export function useIntegrationJobs(integrationId: string | null, limit = 5) {
  return useQuery<IntegrationSyncJob[]>({
    queryKey: jobsKey(integrationId ?? ''),
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
      qc.invalidateQueries({ queryKey: jobsKey(variables.integrationId) });
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
      qc.invalidateQueries({ queryKey: jobsKey(variables.integrationId) });
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
