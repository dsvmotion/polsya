// src/pages/creative/CreativeReports.tsx
import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieChartIcon,
  Calendar,
  Briefcase,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { useCreativeReports } from '@/hooks/useCreativeReports';
import { OPPORTUNITY_STAGE_LABELS } from '@/types/creative';
import { PROJECT_STATUS_LABELS } from '@/types/creative';
import type { OpportunityStage } from '@/types/creative';
import type { ProjectStatus } from '@/types/creative';

const CHART_COLORS = [
  'hsl(217, 91%, 60%)',
  'hsl(142, 72%, 46%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)',
  'hsl(280, 67%, 51%)',
  'hsl(190, 80%, 50%)',
];

type TimeRange = '7d' | '30d' | '90d' | '365d' | 'all';

export default function CreativeReports() {
  const [timeRange, setTimeRange] = useState<TimeRange>('90d');
  const { data, isLoading } = useCreativeReports(timeRange);

  const kpis = data?.kpis ?? { pipelineTotal: 0, winRate: 0, avgDealSize: 0, activeProjects: 0 };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <WorkspaceContainer
      title="Creative Reports"
      description="Analytics and insights for your creative business"
      actions={
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <SelectTrigger className="w-32">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="365d">Last year</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      }
    >
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2 mb-8">
        <KpiCard icon={Briefcase} label="Pipeline Total" value={formatCurrency(kpis.pipelineTotal)} loading={isLoading} />
        <KpiCard icon={TrendingUp} label="Win Rate" value={`${kpis.winRate}%`} loading={isLoading} />
        <KpiCard icon={BarChart3} label="Avg Deal Size" value={formatCurrency(kpis.avgDealSize)} loading={isLoading} />
        <KpiCard icon={PieChartIcon} label="Active Projects" value={String(kpis.activeProjects)} loading={isLoading} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ErrorBoundary section="pipeline-by-stage">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pipeline by Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {(data?.pipelineByStage.length ?? 0) > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data!.pipelineByStage} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <YAxis
                        dataKey="stage"
                        type="category"
                        tick={{ fontSize: 11 }}
                        width={90}
                        tickFormatter={(s) => OPPORTUNITY_STAGE_LABELS[s as OpportunityStage] ?? s}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        formatter={(value: number) => [formatCurrency(value), 'Value']}
                      />
                      <Bar dataKey="value" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="No pipeline data available" />
                )}
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>

        <ErrorBoundary section="revenue-over-time">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {(data?.revenueOverTime.length ?? 0) > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data!.revenueOverTime}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(142, 72%, 46%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(142, 72%, 46%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(142, 72%, 46%)" strokeWidth={2} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="No revenue data available" />
                )}
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>

        <ErrorBoundary section="conversion-funnel">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {(data?.funnelData.length ?? 0) > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data!.funnelData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="stage"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(s) => OPPORTUNITY_STAGE_LABELS[s as OpportunityStage] ?? s}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        formatter={(value: number, name: string) => {
                          if (name === 'percentage') return [`${value}%`, 'Conversion'];
                          return [value, 'Count'];
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="No funnel data available" />
                )}
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>

        <ErrorBoundary section="project-status">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {(data?.projectStatusBreakdown.length ?? 0) > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data!.projectStatusBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="count"
                        label={({ status, percent }) =>
                          `${PROJECT_STATUS_LABELS[status as ProjectStatus] ?? status} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {data!.projectStatusBreakdown.map((_, idx) => (
                          <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="No project data available" />
                )}
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>
      </div>
    </WorkspaceContainer>
  );
}

function KpiCard({ icon: Icon, label, value, loading }: { icon: typeof BarChart3; label: string; value: string; loading?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      {loading ? (
        <div className="h-8 w-24 rounded bg-muted animate-pulse" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
      {message}
    </div>
  );
}
