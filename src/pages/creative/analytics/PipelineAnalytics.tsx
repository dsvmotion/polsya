// src/pages/creative/analytics/PipelineAnalytics.tsx
import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { GitBranch, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import ConversionFunnel from '@/components/creative/analytics/ConversionFunnel';
import TimeRangeSelect from '@/components/creative/analytics/TimeRangeSelect';
import EmptyState from '@/components/creative/analytics/EmptyState';
import { usePipelineAnalytics } from '@/hooks/usePipelineAnalytics';
import type { TimeRange } from '@/types/analytics';

const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
};

const STAGE_COLORS: Record<string, string> = {
  lead: 'hsl(217, 91%, 60%)',
  qualified: 'hsl(142, 72%, 46%)',
  proposal: 'hsl(38, 92%, 50%)',
  negotiation: 'hsl(280, 67%, 51%)',
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val);

export default function PipelineAnalytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('90d');
  const { data, isLoading } = usePipelineAnalytics(timeRange);

  const hasFunnel = (data?.funnel.length ?? 0) > 0;
  const hasForecast = (data?.forecast.length ?? 0) > 0;
  const hasAging = (data?.dealAging.length ?? 0) > 0;

  return (
    <WorkspaceContainer
      title="Pipeline Analytics"
      description="Funnel performance, revenue forecast, and deal aging"
      actions={
        <TimeRangeSelect value={timeRange} onChange={setTimeRange} />
      }
    >
      {/* Conversion Funnel (full width) */}
      <div className="mb-6">
        <ErrorBoundary section="conversion-funnel">
          {hasFunnel || isLoading ? (
            <ConversionFunnel stages={data?.funnel ?? []} loading={isLoading} />
          ) : (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={GitBranch}
                  title="No funnel data"
                  description="Create opportunities to see your conversion funnel."
                />
              </CardContent>
            </Card>
          )}
        </ErrorBoundary>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Forecast */}
        <ErrorBoundary section="revenue-forecast">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {hasForecast ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data?.forecast ?? []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(value: number, name: string) => [
                          formatCurrency(value),
                          name.charAt(0).toUpperCase() + name.slice(1),
                        ]}
                      />
                      <Legend formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)} />
                      <Line
                        type="monotone"
                        dataKey="optimistic"
                        stroke="hsl(217, 91%, 60%)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="weighted"
                        stroke="hsl(38, 92%, 50%)"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="conservative"
                        stroke="hsl(142, 72%, 46%)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState
                    icon={BarChart3}
                    title="No forecast data"
                    description="Add open deals to generate a revenue forecast."
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>

        {/* Deal Aging */}
        <ErrorBoundary section="deal-aging">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Deal Aging</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] overflow-auto">
                {hasAging ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-medium text-muted-foreground">Deal</th>
                        <th className="pb-2 font-medium text-muted-foreground">Stage</th>
                        <th className="pb-2 font-medium text-muted-foreground text-right">Value</th>
                        <th className="pb-2 font-medium text-muted-foreground text-right">Age</th>
                        <th className="pb-2 font-medium text-muted-foreground text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.dealAging ?? [])
                        .sort((a, b) => b.ageDays - a.ageDays)
                        .map((deal) => (
                          <tr key={deal.id} className="border-b last:border-0">
                            <td className="py-2 font-medium truncate max-w-[140px]">{deal.name}</td>
                            <td className="py-2">
                              <Badge
                                variant="outline"
                                className="text-xs"
                                style={{ borderColor: STAGE_COLORS[deal.stage] ?? 'hsl(var(--border))' }}
                              >
                                {deal.stage}
                              </Badge>
                            </td>
                            <td className="py-2 text-right">{formatCurrency(deal.valueCents / 100)}</td>
                            <td className="py-2 text-right">{deal.ageDays}d</td>
                            <td className="py-2 text-right">
                              {deal.isStale ? (
                                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-0 text-xs">
                                  Stale
                                </Badge>
                              ) : (
                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-0 text-xs">
                                  Active
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                ) : (
                  <EmptyState
                    icon={BarChart3}
                    title="No deal aging data"
                    description="Open deals will appear here with their age."
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>
      </div>
    </WorkspaceContainer>
  );
}
