import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import { Users, FolderKanban, Briefcase, TrendingUp, Activity, BarChart3, Zap, Shield, GitMerge, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCreativeDashboard } from '@/hooks/useCreativeDashboard';
import { useRecentSignals } from '@/hooks/useSignals';
import { useResolutionCandidates } from '@/hooks/useEntityResolution';
import { OPPORTUNITY_STAGE_LABELS, OPPORTUNITY_STAGE_COLORS } from '@/types/creative';
import type { OpportunityStage } from '@/types/creative';
import { SIGNAL_SEVERITY_COLORS } from '@/types/signal-engine';
import { Badge } from '@/components/ui/badge';
import { useRecentActivities } from '@/hooks/useCreativeActivities';
import { ACTIVITY_TYPE_COLORS } from '@/types/creative-activity';
import type { ActivityType } from '@/types/creative-activity';
import { Clock } from 'lucide-react';

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

export default function CreativeDashboard() {
  const { data, isLoading } = useCreativeDashboard();
  const { data: recentSignals = [] } = useRecentSignals(5);
  const { data: pendingCandidates = [] } = useResolutionCandidates('pending');
  const { data: recentActivities = [] } = useRecentActivities(5);

  const totalClients = data?.totalClients ?? 0;
  const activeProjects = data?.activeProjects ?? 0;
  const pipelineValueCents = data?.pipelineValueCents ?? 0;
  const winRate = data?.winRate ?? 0;
  const stageBreakdown = data?.stageBreakdown ?? {};
  const newSignals = data?.newSignals ?? 0;
  const activeRules = data?.activeRules ?? 0;
  const pendingResolutions = data?.pendingResolutions ?? 0;
  const remainingCredits = data?.remainingCredits ?? 0;

  return (
    <WorkspaceContainer
      title="Creative Intelligence"
      description="Your creative relationship overview"
    >
      {/* Metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

      {/* Engine metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={Zap} label="New Signals" value={String(newSignals)} trend="Unread" loading={isLoading} />
        <MetricCard icon={Shield} label="Active Rules" value={String(activeRules)} trend="Monitoring" loading={isLoading} />
        <MetricCard icon={GitMerge} label="Pending Merges" value={String(pendingResolutions)} trend="Awaiting review" loading={isLoading} />
        <MetricCard icon={Layers} label="Enrichment Credits" value={String(remainingCredits)} trend="Remaining" loading={isLoading} />
      </div>

      {/* Stage Breakdown */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6 shadow-elevation-card">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-display text-lg font-semibold">Stage Breakdown</h2>
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

      {/* Recent Signals and Pending Resolutions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-elevation-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-display text-lg font-semibold">Recent Activity</h2>
            </div>
          </div>
          {recentActivities.length === 0 && recentSignals.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
              No recent activity. Log activities on entity detail panels.
            </div>
          ) : (
            <div className="space-y-2">
              {recentActivities.map((activity) => {
                const colors = ACTIVITY_TYPE_COLORS[activity.activityType as ActivityType];
                return (
                  <div key={activity.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors duration-150">
                    <div className={`h-2 w-2 rounded-full ${colors?.bg ?? 'bg-muted'}`} />
                    <span className="text-sm flex-1 truncate">{activity.title}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(activity.occurredAt).toLocaleDateString()}
                    </span>
                  </div>
                );
              })}
              {recentSignals.length > 0 && recentActivities.length > 0 && (
                <div className="border-t pt-2 mt-2">
                  <p className="text-xs text-muted-foreground mb-2">Signals</p>
                </div>
              )}
              {recentSignals.map((signal) => {
                const sevColors = SIGNAL_SEVERITY_COLORS[signal.severity];
                return (
                  <div key={signal.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors duration-150">
                    <div className={`h-2 w-2 rounded-full ${sevColors.bg}`} />
                    <span className="text-sm flex-1 truncate">{signal.title}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(signal.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-elevation-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GitMerge className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-display text-lg font-semibold">Pending Resolutions</h2>
            </div>
            <Link to="/creative/resolution" className="text-sm text-primary hover:underline">View all →</Link>
          </div>
          {pendingCandidates.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
              No pending resolutions. Candidates appear when duplicates are detected.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingCandidates.slice(0, 3).map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border px-3 py-2 hover:bg-accent transition-colors duration-150">
                  <div className="text-sm">
                    <span className="capitalize">{c.entityAType}</span>
                    <span className="text-muted-foreground mx-1.5">vs</span>
                    <span className="capitalize">{c.entityBType}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(c.confidenceScore * 100)}%
                  </Badge>
                </div>
              ))}
            </div>
          )}
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
    <div className="metric-card">
      <div className="flex items-center gap-3 mb-3">
        <div className="gradient-icon-container h-10 w-10">
          <Icon className="h-5 w-5 text-white" />
        </div>
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      {loading ? (
        <div className="h-8 w-24 rounded-lg bg-muted animate-pulse mb-1" />
      ) : (
        <div className="font-display text-2xl font-bold tracking-tight">{value}</div>
      )}
      <div className="mt-1">
        <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-semantic-success-light text-semantic-success">
          {trend}
        </span>
      </div>
    </div>
  );
}
