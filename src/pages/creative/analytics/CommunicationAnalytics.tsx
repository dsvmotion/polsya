// src/pages/creative/analytics/CommunicationAnalytics.tsx
import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { Mail, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import TimeRangeSelect from '@/components/creative/analytics/TimeRangeSelect';
import EmptyState from '@/components/creative/analytics/EmptyState';
import { useCommunicationAnalytics } from '@/hooks/useCommunicationAnalytics';
import type { TimeRange } from '@/types/analytics';

const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
};

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
  if (score >= 50) return 'bg-yellow-100 dark:bg-yellow-900/30';
  return 'bg-red-100 dark:bg-red-900/30';
}

export default function CommunicationAnalytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('90d');
  const { data, isLoading } = useCommunicationAnalytics(timeRange);

  const hasEmailByClient = (data?.emailMetrics.byClient.length ?? 0) > 0;
  const hasMeetings = (data?.calendarMetrics.meetingsPerWeek.length ?? 0) > 0;
  const hasScores = (data?.communicationScores.length ?? 0) > 0;

  return (
    <WorkspaceContainer
      title="Communication Analytics"
      description="Email and calendar engagement metrics"
      actions={
        <TimeRangeSelect value={timeRange} onChange={setTimeRange} />
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Metrics */}
        <ErrorBoundary section="email-metrics">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Email Volume by Client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {hasEmailByClient ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.emailMetrics.byClient ?? []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis
                        dataKey="clientName"
                        type="category"
                        tick={{ fontSize: 11 }}
                        width={100}
                      />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend />
                      <Bar
                        dataKey="inbound"
                        name="Inbound"
                        fill="hsl(217, 91%, 60%)"
                        stackId="email"
                        radius={[0, 0, 0, 0]}
                      />
                      <Bar
                        dataKey="outbound"
                        name="Outbound"
                        fill="hsl(142, 72%, 46%)"
                        stackId="email"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState
                    icon={Mail}
                    title="No email data"
                    description="Sync your email to see communication volume."
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>

        {/* Calendar Metrics */}
        <ErrorBoundary section="calendar-metrics">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Meetings per Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {hasMeetings ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.calendarMetrics.meetingsPerWeek ?? []}>
                      <defs>
                        <linearGradient id="colorMeetings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="week"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(w) => w.slice(5)}
                      />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        labelFormatter={(w) => `Week of ${w}`}
                        formatter={(value: number) => [value, 'Meetings']}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="hsl(38, 92%, 50%)"
                        strokeWidth={2}
                        fill="url(#colorMeetings)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState
                    icon={BarChart3}
                    title="No meeting data"
                    description="Sync your calendar to see meeting trends."
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>
      </div>

      {/* Communication Scores Table */}
      <div className="mt-6">
        <ErrorBoundary section="communication-scores">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Communication Scores</CardTitle>
            </CardHeader>
            <CardContent>
              {hasScores ? (
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-medium text-muted-foreground">Client</th>
                        <th className="pb-2 font-medium text-muted-foreground text-center">Email Score</th>
                        <th className="pb-2 font-medium text-muted-foreground text-center">Calendar Score</th>
                        <th className="pb-2 font-medium text-muted-foreground text-center">Activity Score</th>
                        <th className="pb-2 font-medium text-muted-foreground text-center">Composite Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.communicationScores ?? [])
                        .sort((a, b) => b.compositeScore - a.compositeScore)
                        .map((entry) => (
                          <tr key={entry.clientId} className="border-b last:border-0">
                            <td className="py-2 font-medium">{entry.clientName}</td>
                            <td className="py-2 text-center">{entry.emailScore}</td>
                            <td className="py-2 text-center">{entry.calendarScore}</td>
                            <td className="py-2 text-center">{entry.activityScore}</td>
                            <td className="py-2 text-center">
                              <span
                                className={`inline-flex items-center justify-center w-10 h-6 rounded-full text-xs font-bold ${getScoreColor(entry.compositeScore)} ${getScoreBg(entry.compositeScore)}`}
                              >
                                {entry.compositeScore}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  icon={Mail}
                  title="No communication scores"
                  description="Sync email and calendar to compute engagement scores."
                />
              )}
            </CardContent>
          </Card>
        </ErrorBoundary>
      </div>
    </WorkspaceContainer>
  );
}
