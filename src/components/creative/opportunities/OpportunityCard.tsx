import type { CreativeOpportunity } from '@/types/creative';
import { OPPORTUNITY_STAGE_LABELS, OPPORTUNITY_STAGE_COLORS } from '@/types/creative';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Target, Calendar } from 'lucide-react';

interface OpportunityCardProps {
  opportunity: CreativeOpportunity;
  clientName?: string;
  onClick?: () => void;
}

export function OpportunityCard({ opportunity, clientName, onClick }: OpportunityCardProps) {
  const stageColors = OPPORTUNITY_STAGE_COLORS[opportunity.stage];
  const value = opportunity.valueCents != null
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: opportunity.currency ?? 'USD' }).format(opportunity.valueCents / 100)
    : null;

  return (
    <div
      className="rounded-xl border border-border border-t-2 border-t-success bg-card p-4 space-y-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <h3 className="font-medium text-sm truncate">{opportunity.title}</h3>
          {clientName && <p className="text-xs text-muted-foreground truncate">{clientName}</p>}
        </div>
        <Badge variant="secondary" className={`${stageColors.bg} ${stageColors.text} border-0 shrink-0 ml-2 rounded-full px-2 py-0.5 text-xs`}>
          {OPPORTUNITY_STAGE_LABELS[opportunity.stage]}
        </Badge>
      </div>
      {value && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <DollarSign className="h-3.5 w-3.5" />
          <span>{value}</span>
        </div>
      )}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5" />
          <span>{opportunity.probability}%</span>
        </div>
        {opportunity.expectedCloseDate && (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>{new Date(opportunity.expectedCloseDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
