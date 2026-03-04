import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRemovePlatformOwner() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase
        .from('platform_owner_emails')
        .delete()
        .eq('email', email);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-owner-emails'] });
    },
  });
}
