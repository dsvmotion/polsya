// src/hooks/useAIInsights.ts
import { useQuery } from '@tanstack/react-query';
import { fromTable } from '@/integrations/supabase/helpers';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import {
  computeAtRiskDeals,
  computeRecommendations,
  computeColdClients,
  getCutoffDate,
  getDaysAgo,
} from '@/services/analyticsService';
import type { TimeRange, AIInsightsData } from '@/types/analytics';

export function useAIInsights(timeRange: TimeRange) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<AIInsightsData>({
    queryKey: ['ai-insights', orgId ?? '', timeRange],
    enabled: !!orgId,
    staleTime: 120_000,
    queryFn: async () => {
      const cutoff = getCutoffDate(timeRange);
      const cutoffIso = cutoff?.toISOString() ?? null;

      const [oppsRes, activitiesRes, clientsRes] = await Promise.all([
        fromTable('creative_opportunities')
          .select('id, name, stage, value_cents, expected_close_date, client_id')
          .eq('organization_id', orgId!),
        fromTable('creative_activities')
          .select('entity_id, occurred_at')
          .eq('organization_id', orgId!)
          .order('occurred_at', { ascending: false })
          .limit(2000),
        fromTable('creative_clients')
          .select('id, name, status')
          .eq('organization_id', orgId!),
      ]);

      const allOpps = (oppsRes.data ?? []) as {
        id: string; name: string; stage: string; value_cents: number;
        expected_close_date: string | null; client_id: string | null;
      }[];
      const allActivities = (activitiesRes.data ?? []) as {
        entity_id: string; occurred_at: string;
      }[];
      const clients = (clientsRes.data ?? []) as {
        id: string; name: string; status: string;
      }[];

      // Filter opps by time range (based on created_at is not available here,
      // but we keep all opps since at-risk analysis applies to current open deals)
      // Activities are filtered by cutoff for recency computation
      const activities = cutoffIso
        ? allActivities.filter((a) => a.occurred_at >= cutoffIso)
        : allActivities;

      // Build client name lookup
      const clientNameMap = new Map<string, string>();
      for (const c of clients) {
        clientNameMap.set(c.id, c.name);
      }

      // Build lastActivityDate per entity_id (latest occurred_at)
      const lastActivityDate = new Map<string, string>();
      for (const a of allActivities) {
        const existing = lastActivityDate.get(a.entity_id);
        if (!existing || a.occurred_at > existing) {
          lastActivityDate.set(a.entity_id, a.occurred_at);
        }
      }

      // Prepare opps with client_name for computeAtRiskDeals
      const oppsWithClientName = allOpps.map((o) => ({
        id: o.id,
        name: o.name,
        client_name: (o.client_id ? clientNameMap.get(o.client_id) : null) ?? 'Unknown',
        stage: o.stage,
        value_cents: o.value_cents,
        expected_close_date: o.expected_close_date,
      }));

      const atRiskDeals = computeAtRiskDeals(oppsWithClientName, lastActivityDate);

      // Build cold clients for recommendations
      // Map opp -> client for activity resolution
      const oppToClient = new Map<string, string>();
      for (const o of allOpps) {
        if (o.client_id) {
          oppToClient.set(o.id, o.client_id);
        }
      }

      // Last activity per client (resolve via direct match or opp -> client)
      const clientIdSet = new Set(clients.map((c) => c.id));
      const lastActivityByClient = new Map<string, string>();
      for (const a of allActivities) {
        let clientId: string | undefined;
        if (clientIdSet.has(a.entity_id)) {
          clientId = a.entity_id;
        } else {
          clientId = oppToClient.get(a.entity_id);
        }
        if (clientId) {
          const existing = lastActivityByClient.get(clientId);
          if (!existing || a.occurred_at > existing) {
            lastActivityByClient.set(clientId, a.occurred_at);
          }
        }
      }

      // Pipeline values per client (open opps)
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

      const coldClients = computeColdClients(clients, lastActivityByClient, pipelineValues);

      // Compute average touches before win
      const wonOppIds = allOpps.filter((o) => o.stage === 'won').map((o) => o.id);
      let totalTouches = 0;
      for (const oppId of wonOppIds) {
        totalTouches += activities.filter((a) => a.entity_id === oppId).length;
      }
      const avgTouches = wonOppIds.length > 0
        ? Math.round(totalTouches / wonOppIds.length)
        : 0;

      const recommendations = computeRecommendations(atRiskDeals, coldClients, avgTouches);

      return { atRiskDeals, recommendations };
    },
  });
}
