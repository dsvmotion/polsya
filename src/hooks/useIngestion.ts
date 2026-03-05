import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { IngestionProvider, IngestionRun, IngestionJob } from '@/types/ingestion';
import {
  toIngestionProvider, toIngestionProviders, type IngestionProviderRow,
  toIngestionRun, toIngestionRuns, type IngestionRunRow,
  toIngestionJobs, type IngestionJobRow,
} from '@/services/ingestionService';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';

const ingestionKeys = {
  providers: (orgId: string) => ['ingestion-providers', orgId] as const,
  runs: (orgId: string) => ['ingestion-runs', orgId] as const,
  jobs: (runId: string) => ['ingestion-jobs', runId] as const,
};

// ─── Providers ──────────────────────────────

export function useIngestionProviders() {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<IngestionProvider[]>({
    queryKey: ingestionKeys.providers(orgId ?? ''),
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ingestion_providers')
        .select('*')
        .eq('organization_id', orgId!)
        .order('name');
      if (error) throw error;
      return toIngestionProviders((data ?? []) as unknown as IngestionProviderRow[]);
    },
  });
}

export function useCreateIngestionProvider() {
  const queryClient = useQueryClient();
  const { membership } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (values: { name: string; providerType: string; config?: Record<string, unknown> }) => {
      const orgId = membership?.organization_id;
      if (!orgId) throw new Error('No organization');
      const { data, error } = await supabase
        .from('ingestion_providers')
        .insert({
          organization_id: orgId,
          name: values.name,
          provider_type: values.providerType,
          config: values.config ?? {},
        })
        .select('*')
        .single();
      if (error) throw error;
      return toIngestionProvider(data as unknown as IngestionProviderRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingestion-providers'] });
    },
  });
}

export function useUpdateIngestionProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: { name?: string; providerType?: string; isActive?: boolean; config?: Record<string, unknown> } }) => {
      const patch: Record<string, unknown> = {};
      if (values.name !== undefined) patch.name = values.name;
      if (values.providerType !== undefined) patch.provider_type = values.providerType;
      if (values.isActive !== undefined) patch.is_active = values.isActive;
      if (values.config !== undefined) patch.config = values.config;

      const { data, error } = await supabase
        .from('ingestion_providers')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return toIngestionProvider(data as unknown as IngestionProviderRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingestion-providers'] });
    },
  });
}

export function useDeleteIngestionProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ingestion_providers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingestion-providers'] });
    },
  });
}

// ─── Runs ───────────────────────────────────

export function useIngestionRuns(providerId?: string) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<IngestionRun[]>({
    queryKey: [...ingestionKeys.runs(orgId ?? ''), providerId ?? 'all'],
    enabled: !!orgId,
    queryFn: async () => {
      let query = supabase
        .from('ingestion_runs')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (providerId) query = query.eq('provider_id', providerId);
      const { data, error } = await query;
      if (error) throw error;
      return toIngestionRuns((data ?? []) as unknown as IngestionRunRow[]);
    },
  });
}

export function useTriggerIngestionRun() {
  const queryClient = useQueryClient();
  const { membership } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (providerId: string) => {
      const orgId = membership?.organization_id;
      if (!orgId) throw new Error('No organization');
      const { data, error } = await supabase
        .from('ingestion_runs')
        .insert({
          organization_id: orgId,
          provider_id: providerId,
          status: 'pending',
        })
        .select('*')
        .single();
      if (error) throw error;
      return toIngestionRun(data as unknown as IngestionRunRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingestion-runs'] });
    },
  });
}

// ─── Jobs ───────────────────────────────────

export function useIngestionJobs(runId: string | null) {
  return useQuery<IngestionJob[]>({
    queryKey: ingestionKeys.jobs(runId ?? ''),
    enabled: !!runId,
    queryFn: async () => {
      if (!runId) return [];
      const { data, error } = await supabase
        .from('ingestion_jobs')
        .select('*')
        .eq('run_id', runId)
        .order('created_at');
      if (error) throw error;
      return toIngestionJobs((data ?? []) as unknown as IngestionJobRow[]);
    },
  });
}
