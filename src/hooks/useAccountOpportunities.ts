import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AccountOpportunity } from '@/types/entity';
import { toAccountOpportunities, type OpportunityRow } from '@/services/opportunityService';

export function useAccountOpportunities(entityId: string | null) {
  return useQuery<AccountOpportunity[]>({
    queryKey: ['account-opportunities', entityId ?? ''],
    enabled: !!entityId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pharmacy_opportunities')
        .select('*')
        .eq('pharmacy_id', entityId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return toAccountOpportunities((data ?? []) as OpportunityRow[]);
    },
  });
}
