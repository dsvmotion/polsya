import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import { Users, FolderKanban, Briefcase, TrendingUp, Activity, BarChart3 } from 'lucide-react';
import { useCreativeDashboard } from '@/hooks/useCreativeDashboard';
import { OPPORTUNITY_STAGE_LABELS, OPPORTUNITY_STAGE_COLORS } from '@/types/creative';
import type { OpportunityStage } from '@/types/creative';

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

export default function CreativeDashboard() {
  const { data, isLoading } = useCreativeDashboard();

  const totalClients = data?.totalClients ?? 0;
  const activeProjects = data?.activeProjects ?? 0;
  const pipelineValueCents = data?.pipelineValueCents ?? 0;
  const winRate = data?.winRate ?? 0;
  const stageBreakdown = data?.stageBreakdown ?? {};

  return (
    <WorkspaceContainer
      title="Creative Intelligence"
      description="Your creative relationship overview"
    >
      {/* Metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          icon={Users}
          label="Clients"
          value={String(totalClients)}
          trend="All time"
          loading={isLoading}
        />
        <MetricCard
          icon={FolderKanban}
          label="Active Projects"
          value={String(activeProjects)}
          trend="Currently active"
          loading={isLoading}
        />
        <MetricCard
          icon={Briefcase}
          label="Pipeline Value"
          value={formatCurrency(pipelineValueCents)}
          trend="Open pipeline"
          loading={isLoading}
        />
        <MetricCard
          icon={TrendingUp}
          label="Win Rate"
          value={`${winRate}%`}
          trend="Won vs lost"
          loading={isLoading}
        />
      </div>

      {/* Stage Breakdown */}
      <div className="rounded-lg border bg-card p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Stage Breakdown</h2>
        </div>
        {isLoading ? (
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-7 w-24 rounded-full bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : Object.keys(stageBreakdown).length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No opportunities yet. Create your first opportunity to see the stage breakdown.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Object.entries(stageBreakdown).map(([stage, count]) => {
              const colors =
                OPPORTUNITY_STAGE_COLORS[stage as OpportunityStage] ?? {
                  bg: 'bg-gray-100',
                  text: 'text-gray-800',
                };
              const label =
                OPPORTUNITY_STAGE_LABELS[stage as OpportunityStage] ?? stage;
              return (
                <span
                  key={stage}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${colors.bg} ${colors.text}`}
                >
                  {label}
                  <span className="font-bold">{count}</span>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Activity and signals placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Recent Activity</h2>
          </div>
          <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
            Activity feed will appear here once data flows through the ingestion engine
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Signals</h2>
          </div>
          <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
            Signal detection will populate here once signal rules are configured
          </div>
        </div>
      </div>
    </WorkspaceContainer>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  trend,
  loading,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  trend: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      {loading ? (
        <div className="h-8 w-24 rounded bg-muted animate-pulse mb-1" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
      <div className="text-xs text-muted-foreground mt-1">{trend}</div>
    </div>
  );
}
