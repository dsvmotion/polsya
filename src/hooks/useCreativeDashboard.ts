// src/hooks/useCreativeDashboard.ts
import { useQuery } from '@tanstack/react-query';
import { fromTable } from '@/integrations/supabase/helpers';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';

interface DashboardStats {
  totalClients: number;
  activeProjects: number;
  pipelineValueCents: number;
  pipelineCurrency: string;
  winRate: number;
  stageBreakdown: Record<string, number>;
  newSignals: number;
  activeRules: number;
  pendingResolutions: number;
  remainingCredits: number;
}

export function useCreativeDashboard() {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<DashboardStats>({
    queryKey: ['creative-dashboard', orgId ?? ''],
    enabled: !!orgId,
    queryFn: async () => {
      const [clientsRes, projectsRes, oppsRes, signalsRes, rulesRes, resolutionRes, creditsRes] = await Promise.all([
        fromTable('creative_clients').select('id', { count: 'exact', head: true }).eq('organization_id', orgId!),
        fromTable('creative_projects').select('id', { count: 'exact', head: true }).eq('organization_id', orgId!).eq('status', 'active'),
        fromTable('creative_opportunities').select('stage, value_cents, currency').eq('organization_id', orgId!),
        fromTable('signals').select('id', { count: 'exact', head: true }).eq('organization_id', orgId!).eq('status', 'new'),
        fromTable('signal_rules').select('id', { count: 'exact', head: true }).eq('organization_id', orgId!).eq('is_active', true),
        fromTable('entity_resolution_candidates').select('id', { count: 'exact', head: true }).eq('organization_id', orgId!).eq('status', 'pending'),
        fromTable('enrichment_credits').select('total_credits, used_credits').eq('organization_id', orgId!),
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

      const creditRows: { total_credits: number; used_credits: number }[] = creditsRes.data ?? [];
      const remainingCredits = creditRows.reduce((sum, c) => sum + (c.total_credits - c.used_credits), 0);

      return {
        totalClients: clientsRes.count ?? 0,
        activeProjects: projectsRes.count ?? 0,
        pipelineValueCents,
        pipelineCurrency: 'USD',
        winRate,
        stageBreakdown,
        newSignals: signalsRes.count ?? 0,
        activeRules: rulesRes.count ?? 0,
        pendingResolutions: resolutionRes.count ?? 0,
        remainingCredits,
      };
    },
  });
}
