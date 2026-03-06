// src/hooks/usePipelineAnalytics.ts
import { useQuery } from '@tanstack/react-query';
import { fromTable } from '@/integrations/supabase/helpers';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import {
  computeConversionFunnel,
  computeRevenueForecast,
  getCutoffDate,
  getDaysAgo,
} from '@/services/analyticsService';
import type { TimeRange, PipelineAnalyticsData } from '@/types/analytics';

export function usePipelineAnalytics(timeRange: TimeRange) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<PipelineAnalyticsData>({
    queryKey: ['pipeline-analytics', orgId ?? '', timeRange],
    enabled: !!orgId,
    staleTime: 120_000,
    queryFn: async () => {
      const cutoff = getCutoffDate(timeRange);
      const cutoffIso = cutoff?.toISOString() ?? null;

      const [oppsRes, activitiesRes] = await Promise.all([
        fromTable('creative_opportunities')
          .select('id, name, stage, value_cents, probability, expected_close_date, created_at')
          .eq('organization_id', orgId!),
        fromTable('creative_activities')
          .select('entity_id, activity_type, occurred_at')
          .eq('organization_id', orgId!)
          .order('occurred_at', { ascending: false })
          .limit(2000),
      ]);

      const allOpps = (oppsRes.data ?? []) as {
        id: string; name: string; stage: string; value_cents: number;
        probability: number; expected_close_date: string | null; created_at: string;
      }[];
      const allActivities = (activitiesRes.data ?? []) as {
        entity_id: string; activity_type: string; occurred_at: string;
      }[];

      // Filter by time range
      const opps = cutoffIso
        ? allOpps.filter((o) => o.created_at >= cutoffIso)
        : allOpps;

      const activities = cutoffIso
        ? allActivities.filter((a) => a.occurred_at >= cutoffIso)
        : allActivities;

      // Funnel
      const funnel = computeConversionFunnel(opps, activities);

      // Forecast — only open-stage opportunities
      const openStages = new Set(['lead', 'qualified', 'proposal', 'negotiation']);
      const openOpps = opps.filter((o) => openStages.has(o.stage));
      const forecast = computeRevenueForecast(openOpps);

      // Deal aging — for each open opp compute age and stale flag
      const dealAging = openOpps.map((o) => {
        const ageDays = getDaysAgo(o.created_at);
        return {
          id: o.id,
          name: o.name,
          stage: o.stage,
          valueCents: o.value_cents,
          ageDays,
          isStale: ageDays > 60,
        };
      });

      // Stage velocity — placeholder (needs stage transition data)
      const stageVelocity: PipelineAnalyticsData['stageVelocity'] = [];

      return { funnel, forecast, dealAging, stageVelocity };
    },
  });
}
