import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AccountActivity } from '@/types/entity';
import { toAccountActivities, type ActivityRow } from '@/services/activityService';

export function useAccountActivities(entityId: string | null) {
  return useQuery<AccountActivity[]>({
    queryKey: ['account-activities', entityId ?? ''],
    enabled: !!entityId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pharmacy_activities')
        .select('*')
        .eq('pharmacy_id', entityId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return toAccountActivities((data ?? []) as ActivityRow[]);
    },
  });
}
