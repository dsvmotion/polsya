// src/hooks/useAnalyticsOverview.ts
import { useQuery } from '@tanstack/react-query';
import { fromTable } from '@/integrations/supabase/helpers';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import {
  computePeriodComparison,
  getCutoffDate,
} from '@/services/analyticsService';
import type { TimeRange, AnalyticsOverviewData } from '@/types/analytics';

export function useAnalyticsOverview(timeRange: TimeRange) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<AnalyticsOverviewData>({
    queryKey: ['analytics-overview', orgId ?? '', timeRange],
    enabled: !!orgId,
    staleTime: 120_000, // 2 minutes
    queryFn: async () => {
      const cutoff = getCutoffDate(timeRange);
      const cutoffIso = cutoff?.toISOString() ?? null;

      // Compute the "previous period" cutoff for comparison
      const periodDays = timeRange === 'all' ? null : parseInt(timeRange);
      const previousCutoffIso = periodDays && cutoff
        ? new Date(cutoff.getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      // Fetch all data in parallel
      const [oppsRes, activitiesRes] = await Promise.all([
        fromTable('creative_opportunities')
          .select('id, stage, value_cents, probability, expected_close_date, created_at')
          .eq('organization_id', orgId!),
        fromTable('creative_activities')
          .select('activity_type, occurred_at, entity_id')
          .eq('organization_id', orgId!)
          .order('occurred_at', { ascending: false })
          .limit(1000),
      ]);

      const allOpps = (oppsRes.data ?? []) as {
        id: string; stage: string; value_cents: number; probability: number;
        expected_close_date: string | null; created_at: string;
      }[];
      const allActivities = (activitiesRes.data ?? []) as {
        activity_type: string; occurred_at: string; entity_id: string;
      }[];

      // Filter by time range
      const currentOpps = cutoffIso ? allOpps.filter((o) => o.created_at >= cutoffIso) : allOpps;
      const previousOpps = previousCutoffIso && cutoffIso
        ? allOpps.filter((o) => o.created_at >= previousCutoffIso && o.created_at < cutoffIso)
        : [];

      const openStages = new Set(['lead', 'qualified', 'proposal', 'negotiation']);

      // Pipeline value
      const currentPipeline = currentOpps.filter((o) => openStages.has(o.stage)).reduce((s, o) => s + (o.value_cents ?? 0) / 100, 0);
      const previousPipeline = previousOpps.filter((o) => openStages.has(o.stage)).reduce((s, o) => s + (o.value_cents ?? 0) / 100, 0);

      // Weighted forecast
      const currentWeighted = currentOpps.filter((o) => openStages.has(o.stage))
        .reduce((s, o) => s + ((o.value_cents ?? 0) * (o.probability ?? 0)) / 10000, 0);
      const previousWeighted = previousOpps.filter((o) => openStages.has(o.stage))
        .reduce((s, o) => s + ((o.value_cents ?? 0) * (o.probability ?? 0)) / 10000, 0);

      // Win rate
      const currentWon = currentOpps.filter((o) => o.stage === 'won').length;
      const currentLost = currentOpps.filter((o) => o.stage === 'lost').length;
      const currentWinRate = currentWon + currentLost > 0 ? Math.round((currentWon / (currentWon + currentLost)) * 100) : 0;
      const prevWon = previousOpps.filter((o) => o.stage === 'won').length;
      const prevLost = previousOpps.filter((o) => o.stage === 'lost').length;
      const prevWinRate = prevWon + prevLost > 0 ? Math.round((prevWon / (prevWon + prevLost)) * 100) : 0;

      // Revenue by month (for area chart)
      const revenueMap = new Map<string, { current: number; previous: number }>();
      for (const o of allOpps.filter((o) => o.stage === 'won')) {
        const d = new Date(o.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const existing = revenueMap.get(key) ?? { current: 0, previous: 0 };
        const isCurrentPeriod = !cutoffIso || o.created_at >= cutoffIso;
        if (isCurrentPeriod) existing.current += (o.value_cents ?? 0) / 100;
        else existing.previous += (o.value_cents ?? 0) / 100;
        revenueMap.set(key, existing);
      }
      const revenueByMonth = Array.from(revenueMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({ month, current: Math.round(data.current), previous: Math.round(data.previous) }));

      // Activity by day (for bar chart)
      interface ActivityDayBucket { calls: number; emails: number; meetings: number; notes: number; tasks: number }
      const activityByDayMap = new Map<string, ActivityDayBucket>();
      for (const a of allActivities) {
        const day = a.occurred_at.slice(0, 10);
        const existing = activityByDayMap.get(day) ?? { calls: 0, emails: 0, meetings: 0, notes: 0, tasks: 0 };
        const type = a.activity_type as keyof ActivityDayBucket;
        if (type in existing) existing[type]++;
        activityByDayMap.set(day, existing);
      }
      const activityByDay = Array.from(activityByDayMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-30) // last 30 days
        .map(([date, data]) => ({ date, ...data }));

      // Pipeline health
      const healthyDeals = currentOpps.filter((o) => openStages.has(o.stage) && (o.probability ?? 0) >= 50).length;
      const staleDeals = currentOpps.filter((o) => openStages.has(o.stage) && (o.probability ?? 0) < 30).length;
      const atRiskDeals = currentOpps.filter((o) => openStages.has(o.stage)).length - healthyDeals - staleDeals;

      return {
        pipelineValue: computePeriodComparison(currentPipeline, previousPipeline),
        weightedForecast: computePeriodComparison(currentWeighted, previousWeighted),
        winRate: computePeriodComparison(currentWinRate, prevWinRate),
        avgDealVelocityDays: computePeriodComparison(0, 0), // placeholder — needs stage transition data
        revenueByMonth,
        pipelineHealth: [
          { label: 'Healthy', value: healthyDeals, color: 'hsl(142, 72%, 46%)' },
          { label: 'At Risk', value: atRiskDeals, color: 'hsl(38, 92%, 50%)' },
          { label: 'Stale', value: staleDeals, color: 'hsl(0, 84%, 60%)' },
        ],
        activityByDay,
      };
    },
  });
}
