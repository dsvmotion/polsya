import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ArrowRight, Lightbulb, RefreshCw } from 'lucide-react';
import type { Recommendation, AtRiskDeal, RiskReason } from '@/types/analytics';

type InsightCardProps =
  | { insight: Recommendation; type: 'recommendation' }
  | { insight: AtRiskDeal; type: 'risk' };

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  medium:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  low: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
};

const RECOMMENDATION_TYPE_LABELS: Record<Recommendation['type'], string> = {
  follow_up: 'Follow Up',
  update_deal: 'Update Deal',
  pattern_insight: 'Insight',
  hygiene: 'Hygiene',
};

const RECOMMENDATION_TYPE_ICONS: Record<
  Recommendation['type'],
  React.ElementType
> = {
  follow_up: ArrowRight,
  update_deal: RefreshCw,
  pattern_insight: Lightbulb,
  hygiene: RefreshCw,
};

const RISK_REASON_LABELS: Record<RiskReason, string> = {
  no_recent_activity: 'No Recent Activity',
  past_expected_close: 'Past Expected Close',
  no_communication: 'No Communication',
  stale_deal: 'Stale Deal',
};

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

export default function InsightCard(props: InsightCardProps) {
  if (props.type === 'recommendation') {
    return <RecommendationCard recommendation={props.insight} />;
  }
  return <RiskCard deal={props.insight} />;
}

function RecommendationCard({
  recommendation,
}: {
  recommendation: Recommendation;
}) {
  const TypeIcon = RECOMMENDATION_TYPE_ICONS[recommendation.type];

  return (
    <Card className="rounded-xl border-t-2 border-t-primary/40 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            className={`${PRIORITY_STYLES[recommendation.priority]} border-0 rounded-full px-2 py-0.5 text-xs`}
          >
            {recommendation.priority}
          </Badge>
          <Badge variant="outline" className="gap-1 rounded-full px-2 py-0.5 text-xs">
            <TypeIcon className="h-3 w-3" />
            {RECOMMENDATION_TYPE_LABELS[recommendation.type]}
          </Badge>
        </div>
        <CardTitle className="text-sm font-medium mt-2">{recommendation.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {recommendation.description}
        </p>
      </CardContent>
    </Card>
  );
}

function RiskCard({ deal }: { deal: AtRiskDeal }) {
  // Determine priority based on number of risk reasons
  const priority =
    deal.reasons.length >= 3
      ? 'high'
      : deal.reasons.length >= 2
        ? 'medium'
        : 'low';

  return (
    <Card className="rounded-xl border-t-2 border-t-warning shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`${PRIORITY_STYLES[priority]} border-0 rounded-full px-2 py-0.5 text-xs`}>
            <AlertTriangle className="h-3 w-3 mr-1" />
            At Risk
          </Badge>
          <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs">{deal.stage}</Badge>
        </div>
        <CardTitle className="text-sm font-medium mt-2">{deal.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{deal.clientName}</span>
            <span className="font-medium">
              {formatCurrency(deal.valueCents)}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{deal.daysSinceActivity}d since last activity</span>
            {deal.expectedCloseDate && (
              <>
                <span>&middot;</span>
                <span>Expected close: {deal.expectedCloseDate}</span>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-1 mt-1">
            {deal.reasons.map((reason) => (
              <Badge
                key={reason}
                variant="secondary"
                className="text-[10px] rounded-full px-2 py-0.5"
              >
                {RISK_REASON_LABELS[reason]}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
