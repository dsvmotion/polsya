// src/pages/creative/analytics/AIInsights.tsx
import { useState } from 'react';
import { Lightbulb, AlertTriangle, Brain } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import InsightCard from '@/components/creative/analytics/InsightCard';
import TimeRangeSelect from '@/components/creative/analytics/TimeRangeSelect';
import EmptyState from '@/components/creative/analytics/EmptyState';
import { useAIInsights } from '@/hooks/useAIInsights';
import type { TimeRange } from '@/types/analytics';

export default function AIInsights() {
  const [timeRange, setTimeRange] = useState<TimeRange>('90d');
  const { data, isLoading } = useAIInsights(timeRange);

  const atRiskDeals = data?.atRiskDeals ?? [];
  const recommendations = data?.recommendations ?? [];

  if (isLoading) {
    return (
      <WorkspaceContainer
        title="AI Insights"
        description="Rule-based intelligence for your pipeline"
        actions={
          <TimeRangeSelect value={timeRange} onChange={setTimeRange} />
        }
      >
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-lg border bg-card animate-pulse"
            />
          ))}
        </div>
      </WorkspaceContainer>
    );
  }

  return (
    <WorkspaceContainer
      title="AI Insights"
      description="Rule-based intelligence for your pipeline"
      actions={
        <TimeRangeSelect value={timeRange} onChange={setTimeRange} />
      }
    >
      {/* At-Risk Deals Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h2 className="text-lg font-semibold">At-Risk Deals</h2>
          <Badge variant="secondary" className="ml-1">
            {atRiskDeals.length}
          </Badge>
        </div>

        {atRiskDeals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {atRiskDeals.map((deal) => (
              <InsightCard key={deal.id} insight={deal} type="risk" />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Brain}
            title="No at-risk deals"
            description="All your deals are on track. Keep up the great work!"
          />
        )}
      </div>

      {/* Recommendations Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <h2 className="text-lg font-semibold">Recommendations</h2>
          <Badge variant="secondary" className="ml-1">
            {recommendations.length}
          </Badge>
        </div>

        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => (
              <InsightCard key={rec.id} insight={rec} type="recommendation" />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Lightbulb}
            title="No recommendations"
            description="No actionable recommendations at this time."
          />
        )}
      </div>
    </WorkspaceContainer>
  );
}
