import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AccountContact } from '@/types/entity';
import { toAccountContacts, type ContactRow } from '@/services/contactService';

export function useAccountContacts(entityId: string | null) {
  return useQuery<AccountContact[]>({
    queryKey: ['account-contacts', entityId ?? ''],
    enabled: !!entityId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pharmacy_contacts')
        .select('*')
        .eq('pharmacy_id', entityId!)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return toAccountContacts((data ?? []) as ContactRow[]);
    },
  });
}
