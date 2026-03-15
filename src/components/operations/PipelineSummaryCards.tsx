import { TrendingUp, Target, Trophy, XCircle } from 'lucide-react';
import { usePipelineSummary } from '@/hooks/usePipelineSummary';
import { EmptyState, LoadingState } from '@/components/ui/view-states';

export function PipelineSummaryCards() {
  const { data, isLoading } = usePipelineSummary();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="metric-card animate-pulse">
            <div className="h-3 w-20 bg-muted rounded mb-2" />
            <div className="h-6 w-24 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="Pipeline unavailable"
        description="Could not load opportunity metrics right now."
        className="col-span-2"
        tone="warning"
      />
    );
  }

  if (data.openCount === 0 && data.wonCount === 0 && data.lostCount === 0) {
    return (
      <EmptyState
        title="No pipeline data yet"
        description="Create opportunities to see pipeline and forecast metrics."
        className="col-span-2"
      />
    );
  }

  const cards = [
    {
      label: 'Total Pipeline',
      value: `€${data.totalPipeline.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: TrendingUp,
      iconColor: 'text-blue-500',
    },
    {
      label: 'Weighted Forecast',
      value: `€${data.weightedForecast.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: Target,
      iconColor: 'text-indigo-500',
    },
    {
      label: 'Open Opportunities',
      value: String(data.openCount),
      icon: TrendingUp,
      iconColor: 'text-amber-500',
    },
    {
      label: 'Won / Lost',
      value: `${data.wonCount} / ${data.lostCount}`,
      icon: data.wonCount >= data.lostCount ? Trophy : XCircle,
      iconColor: data.wonCount >= data.lostCount ? 'text-green-500' : 'text-red-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="metric-card flex items-center gap-3"
        >
          <card.icon className={`h-5 w-5 shrink-0 ${card.iconColor}`} />
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground truncate">{card.label}</p>
            <p className="text-lg font-bold text-foreground leading-tight">{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
