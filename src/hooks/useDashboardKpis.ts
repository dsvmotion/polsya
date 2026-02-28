import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { summarizePipeline, type OpportunityInput } from '@/services/pipelineService';

export type KpiClientType = 'all' | 'pharmacy' | 'herbalist';
export type KpiTimeRange = '30d' | '60d' | '90d' | '365d' | 'all';

export interface KpiFilters {
  clientType: KpiClientType;
  timeRange: KpiTimeRange;
}

export interface DashboardKpis {
  pipelineTotal: number;
  weightedForecast: number;
  atRiskCount: number;
  activeClientsCount: number;
  conversionRate: number;
}

const CONVERSION_STATUSES = new Set([
  'contacted',
  'qualified',
  'proposal',
  'client',
]);

const STALE_DAYS = 60;

const TIME_RANGE_DAYS: Record<KpiTimeRange, number | null> = {
  '30d': 30,
  '60d': 60,
  '90d': 90,
  '365d': 365,
  all: null,
};

function cutoffDate(range: KpiTimeRange): string | null {
  const days = TIME_RANGE_DAYS[range];
  if (days === null) return null;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export function useDashboardKpis(filters?: KpiFilters) {
  const clientType = filters?.clientType ?? 'all';
  const timeRange = filters?.timeRange ?? '90d';

  return useQuery<DashboardKpis>({
    queryKey: ['dashboard-kpis', clientType, timeRange],
    queryFn: async () => {
      const cutoff = cutoffDate(timeRange);

      let oppQuery = supabase
        .from('pharmacy_opportunities')
        .select('amount, probability, stage, created_at');
      if (cutoff) {
        oppQuery = oppQuery.gte('created_at', cutoff);
      }

      let pharmQuery = supabase
        .from('pharmacies')
        .select('id, commercial_status, client_type');
      if (clientType !== 'all') {
        pharmQuery = pharmQuery.eq('client_type', clientType);
      }

      const [oppResult, pharmResult] = await Promise.all([
        oppQuery,
        pharmQuery,
      ]);

      if (oppResult.error) throw new Error(oppResult.error.message);
      if (pharmResult.error) throw new Error(pharmResult.error.message);

      // Filter opportunities to pharmacies matching clientType
      let oppRows = (oppResult.data ?? []) as (OpportunityInput & { created_at: string })[];

      if (clientType !== 'all') {
        const pharmIds = new Set(
          (pharmResult.data ?? []).map((p) => p.id as string),
        );
        // Opportunities are linked via pharmacy_id; re-fetch with join is expensive.
        // Instead, fetch pharmacy_ids for the opportunities in a lightweight way.
        const { data: oppLinks } = await supabase
          .from('pharmacy_opportunities')
          .select('id, pharmacy_id');
        if (oppLinks) {
          const validOppIds = new Set(
            oppLinks
              .filter((o) => pharmIds.has(o.pharmacy_id as string))
              .map((o) => o.id as string),
          );
          oppRows = oppRows.filter((o) =>
            validOppIds.has((o as unknown as { id: string }).id),
          );
        }
      }

      const pipeline = summarizePipeline(oppRows);

      const pharmacies = pharmResult.data ?? [];

      let activeClients = 0;
      let conversionEligible = 0;
      let converted = 0;

      for (const p of pharmacies) {
        const status = p.commercial_status as string;
        if (status === 'client') activeClients++;
        if (CONVERSION_STATUSES.has(status)) {
          conversionEligible++;
          if (status === 'client') converted++;
        }
      }

      const conversionRate =
        conversionEligible > 0 ? (converted / conversionEligible) * 100 : 0;

      let atRisk = 0;
      if (activeClients > 0) {
        const clientIds = pharmacies
          .filter((p) => (p.commercial_status as string) === 'client')
          .map((p) => p.id as string);

        const now = Date.now();
        const threshold = STALE_DAYS * 24 * 60 * 60 * 1000;

        const { data: docs } = await supabase
          .from('pharmacy_order_documents')
          .select('pharmacy_id, uploaded_at')
          .in('pharmacy_id', clientIds)
          .order('uploaded_at', { ascending: false });

        const latestByPharmacy = new Map<string, string>();
        for (const doc of docs ?? []) {
          const pid = doc.pharmacy_id as string;
          if (!latestByPharmacy.has(pid)) {
            latestByPharmacy.set(pid, doc.uploaded_at as string);
          }
        }

        for (const cid of clientIds) {
          const latest = latestByPharmacy.get(cid);
          if (!latest || now - new Date(latest).getTime() > threshold) {
            atRisk++;
          }
        }
      }

      return {
        pipelineTotal: pipeline.totalPipeline,
        weightedForecast: pipeline.weightedForecast,
        atRiskCount: atRisk,
        activeClientsCount: activeClients,
        conversionRate,
      };
    },
    staleTime: 60_000,
  });
}
