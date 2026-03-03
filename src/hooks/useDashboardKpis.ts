import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  computeDashboardKpis,
  type DashboardKpis,
  type PharmacyRow,
  type OpportunityRow,
  type DocumentRow,
} from '@/services/dashboardKpiService';

export type KpiEntityTypeFilter = 'all' | string;
export type KpiTimeRange = '30d' | '60d' | '90d' | '365d' | 'all';

export interface KpiFilters {
  entityTypeKey: KpiEntityTypeFilter;
  timeRange: KpiTimeRange;
}

export type { DashboardKpis };

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
  const entityTypeKey = filters?.entityTypeKey ?? 'all';
  const timeRange = filters?.timeRange ?? '90d';

  return useQuery<DashboardKpis>({
    queryKey: ['dashboard-kpis', entityTypeKey, timeRange],
    queryFn: async () => {
      const [oppResult, pharmResult, docResult] = await Promise.all([
        supabase
          .from('pharmacy_opportunities')
          .select('id, pharmacy_id, amount, probability, stage, created_at'),
        supabase
          .from('pharmacies')
          .select('id, commercial_status, client_type'),
        supabase
          .from('pharmacy_order_documents')
          .select('pharmacy_id, uploaded_at')
          .order('uploaded_at', { ascending: false }),
      ]);

      if (oppResult.error) throw new Error(oppResult.error.message);
      if (pharmResult.error) throw new Error(pharmResult.error.message);

      return computeDashboardKpis({
        pharmacies: (pharmResult.data ?? []) as unknown as PharmacyRow[],
        opportunities: (oppResult.data ?? []) as unknown as OpportunityRow[],
        documents: (docResult.data ?? []) as unknown as DocumentRow[],
        entityTypeKey,
        cutoffIso: cutoffDate(timeRange),
      });
    },
    staleTime: 60_000,
  });
}
