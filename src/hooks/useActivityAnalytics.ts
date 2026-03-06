// src/hooks/useActivityAnalytics.ts
import { useQuery } from '@tanstack/react-query';
import { fromTable } from '@/integrations/supabase/helpers';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import {
  computeActivityCorrelation,
  computeTouchPatterns,
  computeActivityHeatmap,
  computeColdClients,
  getCutoffDate,
} from '@/services/analyticsService';
import type { TimeRange, ActivityAnalyticsData } from '@/types/analytics';

export function useActivityAnalytics(timeRange: TimeRange) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<ActivityAnalyticsData>({
    queryKey: ['activity-analytics', orgId ?? '', timeRange],
    enabled: !!orgId,
    staleTime: 120_000,
    queryFn: async () => {
      const cutoff = getCutoffDate(timeRange);
      const cutoffIso = cutoff?.toISOString() ?? null;

      const [activitiesRes, oppsRes, clientsRes] = await Promise.all([
        fromTable('creative_activities')
          .select('entity_id, activity_type, occurred_at')
          .eq('organization_id', orgId!)
          .order('occurred_at', { ascending: false })
          .limit(2000),
        fromTable('creative_opportunities')
          .select('id, stage, client_id, value_cents')
          .eq('organization_id', orgId!),
        fromTable('creative_clients')
          .select('id, name, status')
          .eq('organization_id', orgId!),
      ]);

      const allActivities = (activitiesRes.data ?? []) as {
        entity_id: string; activity_type: string; occurred_at: string;
      }[];
      const allOpps = (oppsRes.data ?? []) as {
        id: string; stage: string; client_id: string | null; value_cents: number;
      }[];
      const clients = (clientsRes.data ?? []) as {
        id: string; name: string; status: string;
      }[];

      // Filter activities by time range
      const activities = cutoffIso
        ? allActivities.filter((a) => a.occurred_at >= cutoffIso)
        : allActivities;

      // Build oppOutcomes: opp id -> 'won' | 'lost'
      const oppOutcomes = new Map<string, string>();
      for (const o of allOpps) {
        if (o.stage === 'won' || o.stage === 'lost') {
          oppOutcomes.set(o.id, o.stage);
        }
      }

      // Build activityCounts: entity_id -> count of activities
      const activityCounts = new Map<string, number>();
      for (const a of activities) {
        activityCounts.set(a.entity_id, (activityCounts.get(a.entity_id) ?? 0) + 1);
      }

      // Build opp -> client mapping
      const oppToClient = new Map<string, string>();
      for (const o of allOpps) {
        if (o.client_id) {
          oppToClient.set(o.id, o.client_id);
        }
      }

      // Build lastActivityByClient: client_id -> latest ISO date
      // For each activity, resolve to a client_id either directly or via opp -> client
      const clientIdSet = new Set(clients.map((c) => c.id));
      const lastActivityByClient = new Map<string, string>();

      for (const a of allActivities) {
        let clientId: string | undefined;

        // Check if entity_id is a client directly
        if (clientIdSet.has(a.entity_id)) {
          clientId = a.entity_id;
        } else {
          // Check if entity_id is an opp and map to its client
          clientId = oppToClient.get(a.entity_id);
        }

        if (clientId) {
          const existing = lastActivityByClient.get(clientId);
          if (!existing || a.occurred_at > existing) {
            lastActivityByClient.set(clientId, a.occurred_at);
          }
        }
      }

      // Build pipelineValues: client_id -> sum of value_cents from open opps
      const openStages = new Set(['lead', 'qualified', 'proposal', 'negotiation']);
      const pipelineValues = new Map<string, number>();
      for (const o of allOpps) {
        if (openStages.has(o.stage) && o.client_id) {
          pipelineValues.set(
            o.client_id,
            (pipelineValues.get(o.client_id) ?? 0) + (o.value_cents ?? 0),
          );
        }
      }

      // Compute analytics
      const correlation = computeActivityCorrelation(activities, oppOutcomes);
      const touchPatterns = computeTouchPatterns(activityCounts, oppOutcomes);
      const heatmap = computeActivityHeatmap(activities, 90);
      const coldClients = computeColdClients(clients, lastActivityByClient, pipelineValues);

      return { correlation, touchPatterns, heatmap, coldClients };
    },
  });
}
