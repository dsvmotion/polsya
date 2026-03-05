import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import { Users, FolderKanban, Briefcase, Sparkles, TrendingUp, Activity } from 'lucide-react';

export default function CreativeDashboard() {
  return (
    <WorkspaceContainer
      title="Creative Intelligence"
      description="Your creative relationship overview"
    >
      {/* Metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard icon={Users} label="Clients" value="—" trend="Phase 1" />
        <MetricCard icon={FolderKanban} label="Active Projects" value="—" trend="Phase 1" />
        <MetricCard icon={Briefcase} label="Open Opportunities" value="—" trend="Phase 1" />
        <MetricCard icon={Sparkles} label="Style Analyses" value="—" trend="Phase 1" />
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
}: {
  icon: typeof Users;
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{trend}</div>
    </div>
  );
}
