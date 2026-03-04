import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformOwnerStatus } from '@/hooks/usePlatformOwnerStatus';

export interface PlatformSettingRow {
  key: string;
  value: unknown;
  description: string | null;
  updated_at: string;
}

export function usePlatformSettings() {
  const { user } = useAuth();
  const { isOwner } = usePlatformOwnerStatus();
  const qc = useQueryClient();

  const query = useQuery<PlatformSettingRow[]>({
    queryKey: ['platform-settings'],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('key, value, description, updated_at')
        .order('key');

      if (error) throw new Error(error.message);
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const upsert = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: unknown }) => {
      const { data, error } = await supabase
        .from('platform_settings')
        .upsert({ key, value: value as object, updated_at: new Date().toISOString() }, { onConflict: 'key' })
        .select('key, value')
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-settings'] });
    },
  });

  return { ...query, upsert };
}

/** Get a feature flag value. Returns undefined while loading, or the value (default false for booleans). */
export function useFeatureFlag(key: string, defaultValue = false): { value: unknown; isLoading: boolean } {
  const { data: settings = [], isLoading } = usePlatformSettings();

  const row = settings.find((s) => s.key === key);
  const value = row?.value ?? defaultValue;

  return { value, isLoading };
}
