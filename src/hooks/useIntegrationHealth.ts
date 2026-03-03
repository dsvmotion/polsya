import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { IntegrationSyncJob, IntegrationSyncRun } from '@/types/integrations';
import {
  summarizeIntegrationHealth,
  type IntegrationHealthSummary,
} from '@/services/integrationHealthService';

function parseLookbackHours(raw: number | undefined): number {
  if (!Number.isFinite(raw) || !raw || raw <= 0) return 24;
  return Math.floor(raw);
}

function parseStuckMinutes(raw: number | undefined): number {
  if (!Number.isFinite(raw) || !raw || raw <= 0) return 15;
  return Math.floor(raw);
}

export function useIntegrationHealth(lookbackHours = 24) {
  const parsedLookbackHours = parseLookbackHours(lookbackHours);
  const stuckThresholdMinutes = parseStuckMinutes(
    Number(import.meta.env.VITE_INTEGRATION_STUCK_MINUTES ?? 15),
  );

  return useQuery<IntegrationHealthSummary>({
    queryKey: ['integration-health', parsedLookbackHours, stuckThresholdMinutes],
    queryFn: async () => {
      const cutoffIso = new Date(
        Date.now() - parsedLookbackHours * 60 * 60 * 1000,
      ).toISOString();

      const [{ data: jobs, error: jobsError }, { data: runs, error: runsError }] = await Promise.all([
        supabase
          .from('integration_sync_jobs')
          .select('status,created_at,next_retry_at,dead_lettered_at')
          .gte('created_at', cutoffIso)
          .order('created_at', { ascending: false })
          .limit(500),
        supabase
          .from('integration_sync_runs')
          .select('status,duration_ms,created_at')
          .gte('created_at', cutoffIso)
          .order('created_at', { ascending: false })
          .limit(500),
      ]);

      if (jobsError) throw new Error(jobsError.message);
      if (runsError) throw new Error(runsError.message);

      return summarizeIntegrationHealth({
        jobs: (jobs ?? []) as unknown as Pick<
          IntegrationSyncJob,
          'status' | 'created_at' | 'next_retry_at' | 'dead_lettered_at'
        >[],
        runs: (runs ?? []) as unknown as Pick<
          IntegrationSyncRun,
          'status' | 'duration_ms' | 'created_at'
        >[],
        stuckThresholdMinutes,
      });
    },
    staleTime: 30_000,
  });
}
