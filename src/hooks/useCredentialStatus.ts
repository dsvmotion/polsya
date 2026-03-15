import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CredentialStatus {
  hasCredentials: boolean;
  provider: string;
  maskedKey?: string;
  updatedAt?: string;
}

export function useCredentialStatus(integrationId: string | null, provider: string | null) {
  return useQuery<CredentialStatus>({
    queryKey: ['credential-status', integrationId, provider],
    enabled: !!integrationId && !!provider,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_api_credentials')
        .select('api_key, updated_at')
        .eq('integration_id', integrationId!)
        .eq('provider', provider!)
        .maybeSingle();

      if (error) {
        const msg = (error.message ?? '').toLowerCase();
        if (msg.includes('schema cache') || msg.includes('does not exist') || error.code === '42P01') {
          return { hasCredentials: false, provider: provider! };
        }
        return { hasCredentials: false, provider: provider! };
      }

      if (!data) {
        return { hasCredentials: false, provider: provider! };
      }

      const key = (data as Record<string, unknown>).api_key as string;
      const maskedKey = key && key.length > 8
        ? `${key.slice(0, 4)}...${key.slice(-4)}`
        : '••••••••';

      return {
        hasCredentials: true,
        provider: provider!,
        maskedKey,
        updatedAt: (data as Record<string, unknown>).updated_at as string,
      };
    },
    staleTime: 30_000,
  });
}
