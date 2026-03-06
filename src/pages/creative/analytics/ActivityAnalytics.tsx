// src/pages/creative/analytics/ActivityAnalytics.tsx
import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Activity, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import ActivityHeatmap from '@/components/creative/analytics/ActivityHeatmap';
import TimeRangeSelect from '@/components/creative/analytics/TimeRangeSelect';
import EmptyState from '@/components/creative/analytics/EmptyState';
import { useActivityAnalytics } from '@/hooks/useActivityAnalytics';
import type { TimeRange } from '@/types/analytics';

const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
};

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);

export default function ActivityAnalytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('90d');
  const { data, isLoading } = useActivityAnalytics(timeRange);

  const hasCorrelation = (data?.correlation.length ?? 0) > 0;
  const hasTouch = (data?.touchPatterns.length ?? 0) > 0;
  const hasHeatmap = (data?.heatmap.length ?? 0) > 0;
  const hasCold = (data?.coldClients.length ?? 0) > 0;

  return (
    <WorkspaceContainer
      title="Activity Analytics"
      description="Correlation between activities and deal outcomes"
      actions={
        <TimeRangeSelect value={timeRange} onChange={setTimeRange} />
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity-to-Outcome Correlation */}
        <ErrorBoundary section="activity-correlation">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity-to-Outcome Correlation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {hasCorrelation ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data!.correlation}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="activityType" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend />
                      <Bar
                        dataKey="wonDeals"
                        name="Won Deals"
                        fill="hsl(142, 72%, 46%)"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="lostDeals"
                        name="Lost Deals"
                        fill="hsl(0, 84%, 60%)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState
                    icon={Activity}
                    title="No correlation data"
                    description="Log activities on deals to see how they correlate with outcomes."
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>

        {/* Touch Pattern Distribution */}
        <ErrorBoundary section="touch-patterns">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Touch Pattern Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {hasTouch ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data!.touchPatterns}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="touchCount" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend />
                      <Bar
                        dataKey="wonCount"
                        name="Won"
                        fill="hsl(142, 72%, 46%)"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="lostCount"
                        name="Lost"
                        fill="hsl(0, 84%, 60%)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState
                    icon={BarChart3}
                    title="No touch pattern data"
                    description="Activity data on won/lost deals is needed for this analysis."
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>
      </div>

      {/* Activity Heatmap (full width) */}
      <div className="mt-6">
        <ErrorBoundary section="activity-heatmap">
          {hasHeatmap || isLoading ? (
            <ActivityHeatmap data={data?.heatmap ?? []} loading={isLoading} />
          ) : (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={Activity}
                  title="No heatmap data"
                  description="Log activities to populate the heatmap."
                />
              </CardContent>
            </Card>
          )}
        </ErrorBoundary>
      </div>

      {/* Cold Clients Table */}
      <div className="mt-6">
        <ErrorBoundary section="cold-clients">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cold Clients</CardTitle>
            </CardHeader>
            <CardContent>
              {hasCold ? (
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-medium text-muted-foreground">Client</th>
                        <th className="pb-2 font-medium text-muted-foreground text-right">Days Since Activity</th>
                        <th className="pb-2 font-medium text-muted-foreground text-right">Pipeline Value</th>
                        <th className="pb-2 font-medium text-muted-foreground text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data!.coldClients
                        .sort((a, b) => b.daysSinceActivity - a.daysSinceActivity)
                        .map((client) => (
                          <tr key={client.id} className="border-b last:border-0">
                            <td className="py-2 font-medium">{client.name}</td>
                            <td className="py-2 text-right">{client.daysSinceActivity}d</td>
                            <td className="py-2 text-right">{formatCurrency(client.pipelineValueCents)}</td>
                            <td className="py-2 text-right">
                              <Badge variant="outline" className="text-xs">
                                {client.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  icon={Activity}
                  title="No cold clients"
                  description="All your clients have recent activity."
                />
              )}
            </CardContent>
          </Card>
        </ErrorBoundary>
      </div>
    </WorkspaceContainer>
  );
}
