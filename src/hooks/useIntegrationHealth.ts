import { useQuery } from '@tanstack/react-query';
import { buildEdgeFunctionHeaders } from '@/lib/edge-function-headers';
import type { IntegrationHealthSummary } from '@/services/integrationHealthService';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

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
      const headers = await buildEdgeFunctionHeaders({ 'Content-Type': 'application/json' });
      const response = await fetch(`${SUPABASE_URL}/functions/v1/process-integration-sync-jobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          mode: 'metrics',
          lookbackHours: parsedLookbackHours,
          stuckThresholdMinutes,
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          (body as { error?: string }).error
            ?? `Failed to load integration health metrics (${response.status})`,
        );
      }

      return body as IntegrationHealthSummary;
    },
    staleTime: 30_000,
  });
}
