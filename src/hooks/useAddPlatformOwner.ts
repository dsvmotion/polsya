import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useAddPlatformOwner() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (email: string) => {
      const { data, error } = await supabase
        .from('platform_owner_emails')
        .insert({
          email: email.trim().toLowerCase(),
          created_by: user?.id ?? null,
        })
        .select('email')
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-owner-emails'] });
    },
  });
}
