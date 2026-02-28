import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { IntegrationSyncRun, SyncRunType, SyncRunStatus } from '@/types/integrations';

function runsKey(integrationId: string, limit: number) {
  return ['integration-runs', integrationId, limit] as const;
}

export function useIntegrationRuns(integrationId: string | null, limit = 5) {
  return useQuery<IntegrationSyncRun[]>({
    queryKey: runsKey(integrationId ?? '', limit),
    enabled: !!integrationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_sync_runs')
        .select('*')
        .eq('integration_id', integrationId!)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw new Error(error.message);
      return (data ?? []) as IntegrationSyncRun[];
    },
  });
}

interface CreateRunInput {
  integrationId: string;
  runType: SyncRunType;
  status: SyncRunStatus;
  finishedAt?: string | null;
  recordsProcessed?: number;
  recordsFailed?: number;
  errorMessage?: string | null;
}

export function useCreateIntegrationRun() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRunInput) => {
      const { data, error } = await supabase
        .from('integration_sync_runs')
        .insert({
          integration_id: input.integrationId,
          run_type: input.runType,
          status: input.status,
          finished_at: input.finishedAt ?? null,
          records_processed: input.recordsProcessed ?? 0,
          records_failed: input.recordsFailed ?? 0,
          error_message: input.errorMessage ?? null,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as IntegrationSyncRun;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['integration-runs', variables.integrationId] });
    },
  });
}

interface UpdateRunInput {
  id: string;
  integrationId: string;
  updates: {
    status?: SyncRunStatus;
    finished_at?: string | null;
    records_processed?: number;
    records_failed?: number;
    error_message?: string | null;
  };
}

export function useUpdateIntegrationRun() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateRunInput) => {
      const { data, error } = await supabase
        .from('integration_sync_runs')
        .update(input.updates)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as IntegrationSyncRun;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['integration-runs', variables.integrationId] });
    },
  });
}

export function useLogManualSync() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (integrationId: string) => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('integration_sync_runs')
        .insert({
          integration_id: integrationId,
          run_type: 'manual',
          status: 'success',
          finished_at: now,
          records_processed: 0,
          records_failed: 0,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as IntegrationSyncRun;
    },
    onSuccess: (_data, integrationId) => {
      qc.invalidateQueries({ queryKey: ['integration-runs', integrationId] });
    },
  });
}
