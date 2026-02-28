import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PharmacyOpportunity, OpportunityStage } from '@/types/pharmacy';

function opportunitiesKey(pharmacyId: string) {
  return ['pharmacy-opportunities', pharmacyId] as const;
}

export function usePharmacyOpportunities(pharmacyId: string | null) {
  return useQuery<PharmacyOpportunity[]>({
    queryKey: opportunitiesKey(pharmacyId ?? ''),
    enabled: !!pharmacyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pharmacy_opportunities')
        .select('*')
        .eq('pharmacy_id', pharmacyId!)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data ?? []) as PharmacyOpportunity[];
    },
  });
}

interface CreateOpportunityInput {
  pharmacyId: string;
  title: string;
  stage: OpportunityStage;
  amount: number;
  probability: number;
  expectedCloseDate?: string | null;
  notes?: string | null;
}

export function useCreatePharmacyOpportunity() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateOpportunityInput) => {
      const { data, error } = await supabase
        .from('pharmacy_opportunities')
        .insert({
          pharmacy_id: input.pharmacyId,
          title: input.title,
          stage: input.stage,
          amount: input.amount,
          probability: input.probability,
          expected_close_date: input.expectedCloseDate ?? null,
          notes: input.notes ?? null,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as PharmacyOpportunity;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: opportunitiesKey(variables.pharmacyId) });
    },
  });
}

interface UpdateOpportunityInput {
  id: string;
  pharmacyId: string;
  updates: {
    title?: string;
    stage?: OpportunityStage;
    amount?: number;
    probability?: number;
    expected_close_date?: string | null;
    notes?: string | null;
  };
}

export function useUpdatePharmacyOpportunity() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateOpportunityInput) => {
      const { data, error } = await supabase
        .from('pharmacy_opportunities')
        .update(input.updates)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as PharmacyOpportunity;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: opportunitiesKey(variables.pharmacyId) });
    },
  });
}

interface DeleteOpportunityInput {
  id: string;
  pharmacyId: string;
}

export function useDeletePharmacyOpportunity() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeleteOpportunityInput) => {
      const { error } = await supabase
        .from('pharmacy_opportunities')
        .delete()
        .eq('id', input.id);

      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: opportunitiesKey(variables.pharmacyId) });
    },
  });
}
