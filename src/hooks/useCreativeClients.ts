// src/hooks/useCreativeClients.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fromTable } from '@/integrations/supabase/helpers';
import type { CreativeClient } from '@/types/creative';
import type { ClientFormValues } from '@/lib/creative-schemas';
import { toCreativeClient, toCreativeClients, type CreativeClientRow } from '@/services/creativeClientService';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';

const clientsKeys = {
  all: (orgId: string) => ['creative-clients', orgId] as const,
  detail: (id: string) => ['creative-client', id] as const,
};

export function useCreativeClients() {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<CreativeClient[]>({
    queryKey: clientsKeys.all(orgId ?? ''),
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await fromTable('creative_clients')
        .select('*')
        .eq('organization_id', orgId!)
        .order('name');
      if (error) throw error;
      return toCreativeClients((data ?? []) as unknown as CreativeClientRow[]);
    },
  });
}

export function useCreativeClient(id: string | null) {
  return useQuery<CreativeClient | null>({
    queryKey: clientsKeys.detail(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await fromTable('creative_clients')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return toCreativeClient(data as unknown as CreativeClientRow);
    },
  });
}

export function useCreateCreativeClient() {
  const queryClient = useQueryClient();
  const { membership } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (values: ClientFormValues) => {
      const orgId = membership?.organization_id;
      if (!orgId) throw new Error('No organization');
      const { data, error } = await fromTable('creative_clients')
        .insert({ ...values, organization_id: orgId, size_category: values.sizeCategory, sub_industry: values.subIndustry })
        .select('*')
        .single();
      if (error) throw error;
      return toCreativeClient(data as unknown as CreativeClientRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-clients'] });
    },
  });
}

export function useUpdateCreativeClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<ClientFormValues> }) => {
      const patch: Record<string, unknown> = { ...values };
      if (values.sizeCategory !== undefined) { patch.size_category = values.sizeCategory; delete patch.sizeCategory; }
      if (values.subIndustry !== undefined) { patch.sub_industry = values.subIndustry; delete patch.subIndustry; }

      const { data, error } = await fromTable('creative_clients')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return toCreativeClient(data as unknown as CreativeClientRow);
    },
    onSuccess: (client) => {
      queryClient.invalidateQueries({ queryKey: ['creative-clients'] });
      queryClient.setQueryData(clientsKeys.detail(client.id), client);
    },
  });
}

export function useDeleteCreativeClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await fromTable('creative_clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-clients'] });
    },
  });
}
