import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { IntegrationConnection, IntegrationProvider, IntegrationStatus } from '@/types/integrations';

const QUERY_KEY = ['integration-connections'] as const;

export function useIntegrations() {
  return useQuery<IntegrationConnection[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_connections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data ?? []) as IntegrationConnection[];
    },
  });
}

interface CreateIntegrationInput {
  provider: IntegrationProvider;
  displayName: string;
  metadata?: Record<string, unknown>;
}

export function useCreateIntegration() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateIntegrationInput) => {
      const { data, error } = await supabase
        .from('integration_connections')
        .insert({
          provider: input.provider,
          display_name: input.displayName,
          ...(input.metadata ? { metadata: input.metadata } : {}),
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as IntegrationConnection;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

interface UpdateIntegrationInput {
  id: string;
  updates: {
    display_name?: string;
    status?: IntegrationStatus;
    is_enabled?: boolean;
    metadata?: Record<string, unknown>;
    last_sync_at?: string | null;
    last_error?: string | null;
  };
}

export function useUpdateIntegration() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateIntegrationInput) => {
      const { data, error } = await supabase
        .from('integration_connections')
        .update(input.updates)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as IntegrationConnection;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteIntegration() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('integration_connections')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useToggleIntegrationEnabled() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { data, error } = await supabase
        .from('integration_connections')
        .update({ is_enabled })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as IntegrationConnection;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
