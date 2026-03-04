import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformOwnerStatus } from '@/hooks/usePlatformOwnerStatus';

export interface PlatformOwnerEmailRow {
  email: string;
  created_at: string;
}

export function usePlatformOwnerEmails() {
  const { user } = useAuth();
  const { isOwner } = usePlatformOwnerStatus();

  return useQuery<PlatformOwnerEmailRow[]>({
    queryKey: ['platform-owner-emails'],
    enabled: !!user && isOwner,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_owner_emails')
        .select('email, created_at')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data ?? [];
    },
    staleTime: 30_000,
  });
}
