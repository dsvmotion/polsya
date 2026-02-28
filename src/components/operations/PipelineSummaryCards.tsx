import { TrendingUp, Target, Trophy, XCircle } from 'lucide-react';
import { usePipelineSummary } from '@/hooks/usePipelineSummary';

export function PipelineSummaryCards() {
  const { data, isLoading } = usePipelineSummary();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="h-3 w-20 bg-gray-200 rounded mb-2" />
            <div className="h-6 w-24 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

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
          className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3"
        >
          <card.icon className={`h-5 w-5 shrink-0 ${card.iconColor}`} />
          <div className="min-w-0">
            <p className="text-[11px] text-gray-500 truncate">{card.label}</p>
            <p className="text-lg font-bold text-gray-900 leading-tight">{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
