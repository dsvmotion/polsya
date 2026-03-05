// src/hooks/useCreativeOpportunities.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fromTable } from '@/integrations/supabase/helpers';
import type { CreativeOpportunity } from '@/types/creative';
import type { OpportunityFormValues } from '@/lib/creative-schemas';
import { toCreativeOpportunity, toCreativeOpportunities, type CreativeOpportunityRow } from '@/services/creativeOpportunityService';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';

const oppsKeys = {
  all: (orgId: string) => ['creative-opportunities', orgId] as const,
  byClient: (clientId: string) => ['creative-opportunities', 'client', clientId] as const,
  detail: (id: string) => ['creative-opportunity', id] as const,
};

export function useCreativeOpportunities(clientId?: string) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<CreativeOpportunity[]>({
    queryKey: clientId ? oppsKeys.byClient(clientId) : oppsKeys.all(orgId ?? ''),
    enabled: !!orgId,
    queryFn: async () => {
      let query = fromTable('creative_opportunities')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false });
      if (clientId) query = query.eq('client_id', clientId);
      const { data, error } = await query;
      if (error) throw error;
      return toCreativeOpportunities((data ?? []) as unknown as CreativeOpportunityRow[]);
    },
  });
}

export function useCreativeOpportunity(id: string | null) {
  return useQuery<CreativeOpportunity | null>({
    queryKey: oppsKeys.detail(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await fromTable('creative_opportunities')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return toCreativeOpportunity(data as unknown as CreativeOpportunityRow);
    },
  });
}

export function useCreateCreativeOpportunity() {
  const queryClient = useQueryClient();
  const { membership } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (values: OpportunityFormValues) => {
      const orgId = membership?.organization_id;
      if (!orgId) throw new Error('No organization');
      const { data, error } = await fromTable('creative_opportunities')
        .insert({
          organization_id: orgId,
          title: values.title,
          client_id: values.clientId,
          contact_id: values.contactId,
          stage: values.stage,
          value_cents: values.valueCents,
          currency: values.currency,
          probability: values.probability ?? 0,
          expected_close_date: values.expectedCloseDate,
          description: values.description,
          source: values.source,
          tags: values.tags,
        })
        .select('*')
        .single();
      if (error) throw error;
      return toCreativeOpportunity(data as unknown as CreativeOpportunityRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-opportunities'] });
    },
  });
}

export function useUpdateCreativeOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<OpportunityFormValues> }) => {
      const patch: Record<string, unknown> = {};
      if (values.title !== undefined) patch.title = values.title;
      if (values.clientId !== undefined) patch.client_id = values.clientId;
      if (values.contactId !== undefined) patch.contact_id = values.contactId;
      if (values.stage !== undefined) patch.stage = values.stage;
      if (values.valueCents !== undefined) patch.value_cents = values.valueCents;
      if (values.currency !== undefined) patch.currency = values.currency;
      if (values.probability !== undefined) patch.probability = values.probability;
      if (values.expectedCloseDate !== undefined) patch.expected_close_date = values.expectedCloseDate;
      if (values.description !== undefined) patch.description = values.description;
      if (values.source !== undefined) patch.source = values.source;
      if (values.tags !== undefined) patch.tags = values.tags;

      const { data, error } = await fromTable('creative_opportunities')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return toCreativeOpportunity(data as unknown as CreativeOpportunityRow);
    },
    onSuccess: (opp) => {
      queryClient.invalidateQueries({ queryKey: ['creative-opportunities'] });
      queryClient.setQueryData(oppsKeys.detail(opp.id), opp);
    },
  });
}

export function useDeleteCreativeOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await fromTable('creative_opportunities').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-opportunities'] });
    },
  });
}
