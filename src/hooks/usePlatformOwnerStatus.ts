import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isPlatformOwner } from '@/lib/platform';

/**
 * Returns whether the current user is a platform owner.
 * Checks app_metadata, VITE_PLATFORM_OWNER_EMAILS, and platform_owner_emails table.
 */
export function usePlatformOwnerStatus() {
  const { user } = useAuth();

  const syncOwner = isPlatformOwner(user);

  const { data: inTable, isLoading: queryLoading } = useQuery({
    queryKey: ['platform-owner-email', user?.email ?? ''],
    enabled: !!user?.email && !syncOwner,
    queryFn: async () => {
      if (!user?.email) return false;
      const { data } = await supabase
        .from('platform_owner_emails')
        .select('email')
        .ilike('email', user.email)
        .maybeSingle();
      return !!data;
    },
    staleTime: 60_000,
  });

  return {
    isOwner: syncOwner || !!inTable,
    isLoading: !!user && !syncOwner && queryLoading,
  };
}
