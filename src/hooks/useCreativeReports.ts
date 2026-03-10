// src/hooks/useCreativeReports.ts
import { useQuery } from '@tanstack/react-query';
import { fromTable } from '@/integrations/supabase/helpers';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';

type TimeRange = '7d' | '30d' | '90d' | '365d' | 'all';

export interface CreativeReportData {
  pipelineByStage: { stage: string; value: number; count: number }[];
  revenueOverTime: { month: string; revenue: number }[];
  funnelData: { stage: string; count: number; percentage: number }[];
  projectStatusBreakdown: { status: string; count: number }[];
  clientAcquisition: { month: string; count: number }[];
  kpis: {
    pipelineTotal: number;
    winRate: number;
    avgDealSize: number;
    activeProjects: number;
  };
}

function getCutoffDate(timeRange: TimeRange): Date | null {
  if (timeRange === 'all') return null;
  const days = parseInt(timeRange);
  if (!Number.isFinite(days) || days <= 0) return null;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return cutoff;
}

export function useCreativeReports(timeRange: TimeRange) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<CreativeReportData>({
    queryKey: ['creative-reports', orgId ?? '', timeRange],
    enabled: !!orgId,
    queryFn: async () => {
      const cutoff = getCutoffDate(timeRange);

      // Fetch opportunities and projects
      let oppsQuery = fromTable('creative_opportunities')
        .select('stage, value_cents, currency, created_at')
        .eq('organization_id', orgId!);
      if (cutoff) oppsQuery = oppsQuery.gte('created_at', cutoff.toISOString());

      let projectsQuery = fromTable('creative_projects')
        .select('status, created_at')
        .eq('organization_id', orgId!);
      if (cutoff) projectsQuery = projectsQuery.gte('created_at', cutoff.toISOString());

      let clientsQuery = fromTable('creative_clients')
        .select('created_at')
        .eq('organization_id', orgId!);
      if (cutoff) clientsQuery = clientsQuery.gte('created_at', cutoff.toISOString());

      const [oppsRes, projectsRes, clientsRes] = await Promise.all([
        oppsQuery, projectsQuery, clientsQuery,
      ]);

      const opps: { stage: string; value_cents: number | null; currency: string; created_at: string }[] = oppsRes.data ?? [];
      const projects: { status: string; created_at: string }[] = projectsRes.data ?? [];
      const clients: { created_at: string }[] = clientsRes.data ?? [];

      // Pipeline by stage
      const stageMap = new Map<string, { value: number; count: number }>();
      const openStages = ['lead', 'qualified', 'proposal', 'negotiation'];
      opps.forEach((o) => {
        if (openStages.includes(o.stage)) {
          const existing = stageMap.get(o.stage) ?? { value: 0, count: 0 };
          existing.value += (o.value_cents ?? 0) / 100;
          existing.count += 1;
          stageMap.set(o.stage, existing);
        }
      });
      const pipelineByStage = openStages
        .filter((s) => stageMap.has(s))
        .map((stage) => ({ stage, ...stageMap.get(stage)! }));

      // Revenue over time (won opps)
      const revenueMap = new Map<string, number>();
      opps.filter((o) => o.stage === 'won').forEach((o) => {
        const d = new Date(o.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        revenueMap.set(key, (revenueMap.get(key) ?? 0) + (o.value_cents ?? 0) / 100);
      });
      const revenueOverTime = Array.from(revenueMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, revenue]) => ({ month, revenue: Math.round(revenue) }));

      // Funnel data
      const funnelStages = ['lead', 'qualified', 'proposal', 'negotiation', 'won'];
      const stageCounts = new Map<string, number>();
      opps.forEach((o) => {
        stageCounts.set(o.stage, (stageCounts.get(o.stage) ?? 0) + 1);
      });
      const totalLeads = (stageCounts.get('lead') ?? 0) || 1;
      const funnelData = funnelStages.map((stage) => {
        const count = stageCounts.get(stage) ?? 0;
        return { stage, count, percentage: Math.round((count / totalLeads) * 100) };
      });

      // Project status breakdown
      const statusMap = new Map<string, number>();
      projects.forEach((p) => {
        statusMap.set(p.status, (statusMap.get(p.status) ?? 0) + 1);
      });
      const projectStatusBreakdown = Array.from(statusMap.entries())
        .map(([status, count]) => ({ status, count }));

      // Client acquisition over time
      const clientMonthMap = new Map<string, number>();
      clients.forEach((c) => {
        const d = new Date(c.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        clientMonthMap.set(key, (clientMonthMap.get(key) ?? 0) + 1);
      });
      const clientAcquisition = Array.from(clientMonthMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({ month, count }));

      // KPIs
      const pipelineTotal = pipelineByStage.reduce((s, p) => s + p.value, 0);
      const won = opps.filter((o) => o.stage === 'won').length;
      const lost = opps.filter((o) => o.stage === 'lost').length;
      const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0;
      const avgDealSize = won > 0
        ? Math.round(opps.filter((o) => o.stage === 'won').reduce((s, o) => s + (o.value_cents ?? 0), 0) / won / 100)
        : 0;
      const activeProjects = projects.filter((p) => p.status === 'active').length;

      return {
        pipelineByStage,
        revenueOverTime,
        funnelData,
        projectStatusBreakdown,
        clientAcquisition,
        kpis: { pipelineTotal, winRate, avgDealSize, activeProjects },
      };
    },
  });
}
