import { useState } from 'react';
import { useDashboardKpis } from '@/hooks/useDashboardKpis';
import type { KpiClientType, KpiTimeRange } from '@/hooks/useDashboardKpis';
import { TrendingUp, Target, AlertTriangle, Users, Percent } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ReactNode } from 'react';

const CLIENT_TYPE_OPTIONS: { value: KpiClientType; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'pharmacy', label: 'Pharmacies' },
  { value: 'herbalist', label: 'Herbalists' },
];

const TIME_RANGE_OPTIONS: { value: KpiTimeRange; label: string }[] = [
  { value: '30d', label: 'Last 30 days' },
  { value: '60d', label: 'Last 60 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '365d', label: 'Last year' },
  { value: 'all', label: 'All time' },
];

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
  const [clientType, setClientType] = useState<KpiClientType>('all');
  const [timeRange, setTimeRange] = useState<KpiTimeRange>('90d');

  const { data: kpis, isLoading } = useDashboardKpis({ clientType, timeRange });

  return (
    <div className="mb-6 space-y-2">
      <div className="flex items-center gap-3">
        <Select
          value={clientType}
          onValueChange={(v) => setClientType(v as KpiClientType)}
        >
          <SelectTrigger className="h-7 w-32 text-xs bg-white border-gray-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 z-50">
            {CLIENT_TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={timeRange}
          onValueChange={(v) => setTimeRange(v as KpiTimeRange)}
        >
          <SelectTrigger className="h-7 w-32 text-xs bg-white border-gray-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 z-50">
            {TIME_RANGE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(clientType !== 'all' || timeRange !== '90d') && (
          <span className="text-[10px] text-gray-400">
            Filtered
          </span>
        )}
      </div>

      <div className="grid grid-cols-5 gap-3">
        {isLoading || !kpis ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
