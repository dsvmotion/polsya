import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { summarizePipeline, type OpportunityInput } from '@/services/pipelineService';

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

export function useDashboardKpis() {
  return useQuery<DashboardKpis>({
    queryKey: ['dashboard-kpis'],
    queryFn: async () => {
      const [oppResult, pharmResult] = await Promise.all([
        supabase
          .from('pharmacy_opportunities')
          .select('amount, probability, stage'),
        supabase
          .from('pharmacies')
          .select('id, commercial_status, client_type'),
      ]);

      if (oppResult.error) throw new Error(oppResult.error.message);
      if (pharmResult.error) throw new Error(pharmResult.error.message);

      const pipeline = summarizePipeline(
        (oppResult.data ?? []) as OpportunityInput[],
      );

      const pharmacies = pharmResult.data ?? [];

      let activeClients = 0;
      let conversionEligible = 0;
      let converted = 0;

      for (const p of pharmacies) {
        const status = p.commercial_status as string;
        if (status === 'client') {
          activeClients++;
        }
        if (CONVERSION_STATUSES.has(status)) {
          conversionEligible++;
          if (status === 'client') converted++;
        }
      }

      const conversionRate =
        conversionEligible > 0 ? (converted / conversionEligible) * 100 : 0;

      // At-risk: clients with no orders or stale orders
      // Lightweight approach: fetch clients + their latest order date
      let atRisk = 0;
      if (activeClients > 0) {
        const clientIds = pharmacies
          .filter((p) => (p.commercial_status as string) === 'client')
          .map((p) => p.id as string);

        const now = Date.now();
        const threshold = STALE_DAYS * 24 * 60 * 60 * 1000;

        // Batch check: get latest WooCommerce order per client pharmacy
        // Use pharmacy_order_documents as a proxy for order activity
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
