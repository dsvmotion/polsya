import { useDashboardKpis } from '@/hooks/useDashboardKpis';
import { TrendingUp, Target, AlertTriangle, Users, Percent } from 'lucide-react';
import type { ReactNode } from 'react';

function formatEur(value: number): string {
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `€${(value / 1_000).toFixed(1)}K`;
  return `€${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

interface KpiCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  accent?: string;
}

function KpiCard({ label, value, icon, accent = 'text-gray-900' }: KpiCardProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white min-w-0">
      <div className="p-1.5 rounded-md bg-gray-100 text-gray-500 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className={`text-lg font-bold leading-tight ${accent}`}>{value}</p>
        <p className="text-[11px] text-gray-500 truncate">{label}</p>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white animate-pulse">
      <div className="h-8 w-8 rounded-md bg-gray-200" />
      <div className="space-y-1.5">
        <div className="h-5 w-16 rounded bg-gray-200" />
        <div className="h-3 w-24 rounded bg-gray-100" />
      </div>
    </div>
  );
}

export function KpiStrip() {
  const { data: kpis, isLoading } = useDashboardKpis();

  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-5 gap-3 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-5 gap-3 mb-6">
      <KpiCard
        label="Pipeline"
        value={formatEur(kpis.pipelineTotal)}
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <KpiCard
        label="Weighted Forecast"
        value={formatEur(kpis.weightedForecast)}
        icon={<Target className="h-4 w-4" />}
      />
      <KpiCard
        label="At Risk"
        value={String(kpis.atRiskCount)}
        icon={<AlertTriangle className="h-4 w-4" />}
        accent={kpis.atRiskCount > 0 ? 'text-red-600' : 'text-gray-900'}
      />
      <KpiCard
        label="Active Clients"
        value={String(kpis.activeClientsCount)}
        icon={<Users className="h-4 w-4" />}
        accent="text-green-700"
      />
      <KpiCard
        label="Conversion Rate"
        value={`${kpis.conversionRate.toFixed(1)}%`}
        icon={<Percent className="h-4 w-4" />}
      />
    </div>
  );
}
