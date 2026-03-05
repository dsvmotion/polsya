// src/hooks/useCreativeDashboard.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';

interface DashboardStats {
  totalClients: number;
  activeProjects: number;
  pipelineValueCents: number;
  pipelineCurrency: string;
  winRate: number;
  stageBreakdown: Record<string, number>;
}

export function useCreativeDashboard() {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<DashboardStats>({
    queryKey: ['creative-dashboard', orgId ?? ''],
    enabled: !!orgId,
    queryFn: async () => {
      const [clientsRes, projectsRes, oppsRes] = await Promise.all([
        (supabase.from as any)('creative_clients').select('id', { count: 'exact', head: true }).eq('organization_id', orgId!),
        (supabase.from as any)('creative_projects').select('id', { count: 'exact', head: true }).eq('organization_id', orgId!).eq('status', 'active'),
        (supabase.from as any)('creative_opportunities').select('stage, value_cents, currency').eq('organization_id', orgId!),
      ]);

      const opps: { stage: string; value_cents: number | null; currency: string }[] = oppsRes.data ?? [];
      const openStages = ['lead', 'qualified', 'proposal', 'negotiation'];
      const pipelineValueCents = opps
        .filter((o) => openStages.includes(o.stage))
        .reduce((sum, o) => sum + (o.value_cents ?? 0), 0);

      const won = opps.filter((o) => o.stage === 'won').length;
      const lost = opps.filter((o) => o.stage === 'lost').length;
      const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0;

      const stageBreakdown: Record<string, number> = {};
      opps.forEach((o) => {
        stageBreakdown[o.stage] = (stageBreakdown[o.stage] ?? 0) + 1;
      });

      return {
        totalClients: clientsRes.count ?? 0,
        activeProjects: projectsRes.count ?? 0,
        pipelineValueCents,
        pipelineCurrency: 'USD',
        winRate,
        stageBreakdown,
      };
    },
  });
}
