// src/pages/creative/analytics/AnalyticsOverview.tsx
import { useState } from 'react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { DollarSign, Target, TrendingUp, Clock, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import KpiCardWithTrend from '@/components/creative/analytics/KpiCardWithTrend';
import TimeRangeSelect from '@/components/creative/analytics/TimeRangeSelect';
import EmptyState from '@/components/creative/analytics/EmptyState';
import { useAnalyticsOverview } from '@/hooks/useAnalyticsOverview';
import type { TimeRange } from '@/types/analytics';

const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val);

export default function AnalyticsOverview() {
  const [timeRange, setTimeRange] = useState<TimeRange>('90d');
  const { data, isLoading } = useAnalyticsOverview(timeRange);

  const hasRevenue = (data?.revenueByMonth.length ?? 0) > 0;
  const hasHealth = (data?.pipelineHealth.length ?? 0) > 0;
  const hasActivity = (data?.activityByDay.length ?? 0) > 0;

  return (
    <WorkspaceContainer
      title="Analytics Overview"
      description="Executive dashboard with key metrics and trends"
      actions={
        <TimeRangeSelect value={timeRange} onChange={setTimeRange} />
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2 mb-6">
        <KpiCardWithTrend
          title="Pipeline Value"
          value={data ? formatCurrency(data.pipelineValue.current) : '$0'}
          trend={data?.pipelineValue ?? { current: 0, previous: 0, delta: 0, deltaPercent: 0, sparkline: [] }}
          icon={DollarSign}
          loading={isLoading}
        />
        <KpiCardWithTrend
          title="Weighted Forecast"
          value={data ? formatCurrency(data.weightedForecast.current) : '$0'}
          trend={data?.weightedForecast ?? { current: 0, previous: 0, delta: 0, deltaPercent: 0, sparkline: [] }}
          icon={Target}
          loading={isLoading}
        />
        <KpiCardWithTrend
          title="Win Rate"
          value={data ? `${data.winRate.current}%` : '0%'}
          trend={data?.winRate ?? { current: 0, previous: 0, delta: 0, deltaPercent: 0, sparkline: [] }}
          icon={TrendingUp}
          loading={isLoading}
        />
        <KpiCardWithTrend
          title="Deal Velocity"
          value={data ? `${data.avgDealVelocityDays.current} days` : '0 days'}
          trend={data?.avgDealVelocityDays ?? { current: 0, previous: 0, delta: 0, deltaPercent: 0, sparkline: [] }}
          icon={Clock}
          loading={isLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <ErrorBoundary section="revenue-trend">
          <Card className="rounded-xl border border-border bg-card shadow-elevation-card">
            <CardHeader>
              <CardTitle className="text-base font-display">Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {hasRevenue ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data!.revenueByMonth}>
                      <defs>
                        <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(280, 67%, 51%)" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="hsl(280, 67%, 51%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(value: number, name: string) => [
                          formatCurrency(value),
                          name === 'current' ? 'Current Period' : 'Previous Period',
                        ]}
                      />
                      <Legend formatter={(value) => (value === 'current' ? 'Current Period' : 'Previous Period')} />
                      <Area
                        type="monotone"
                        dataKey="previous"
                        stroke="hsl(280, 67%, 51%)"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        fill="url(#colorPrevious)"
                      />
                      <Area
                        type="monotone"
                        dataKey="current"
                        stroke="hsl(217, 91%, 60%)"
                        strokeWidth={2}
                        fill="url(#colorCurrent)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState icon={BarChart3} title="No revenue data" description="Revenue data will appear here once deals are closed." />
                )}
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>

        {/* Pipeline Health */}
        <ErrorBoundary section="pipeline-health">
          <Card className="rounded-xl border border-border bg-card shadow-elevation-card">
            <CardHeader>
              <CardTitle className="text-base font-display">Pipeline Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {hasHealth ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data!.pipelineHealth}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(value: number) => [value, 'Deals']}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {data!.pipelineHealth.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState icon={BarChart3} title="No pipeline data" description="Pipeline health data will appear once you have open deals." />
                )}
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>

        {/* Activity Volume */}
        <ErrorBoundary section="activity-volume">
          <Card className="lg:col-span-2 rounded-xl border border-border bg-card shadow-elevation-card">
            <CardHeader>
              <CardTitle className="text-base font-display">Activity Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {hasActivity ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data!.activityByDay}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(d) => d.slice(5)}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend />
                      <Bar dataKey="calls" stackId="a" fill="hsl(217, 91%, 60%)" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="emails" stackId="a" fill="hsl(142, 72%, 46%)" />
                      <Bar dataKey="meetings" stackId="a" fill="hsl(38, 92%, 50%)" />
                      <Bar dataKey="notes" stackId="a" fill="hsl(280, 67%, 51%)" />
                      <Bar dataKey="tasks" stackId="a" fill="hsl(190, 80%, 50%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState icon={BarChart3} title="No activity data" description="Log activities to see volume trends." />
                )}
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>
      </div>
    </WorkspaceContainer>
  );
}
