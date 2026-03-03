import { useState, useMemo } from 'react';
import { useDashboardKpis } from '@/hooks/useDashboardKpis';
import type { KpiEntityTypeFilter, KpiTimeRange } from '@/hooks/useDashboardKpis';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import { useEntityTypes } from '@/hooks/useEntityTypes';
import { TrendingUp, Target, AlertTriangle, Users, Percent } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ReactNode } from 'react';

const TIME_RANGE_OPTIONS: { value: KpiTimeRange; label: string }[] = [
  { value: '30d', label: 'Last 30 days' },
  { value: '60d', label: 'Last 60 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '365d', label: 'Last year' },
  { value: 'all', label: 'All time' },
];

function currencySymbol(currency: string, locale: string): string {
  const parts = new Intl.NumberFormat(locale, { style: 'currency', currency }).formatToParts(0);
  return parts.find((p) => p.type === 'currency')?.value ?? currency;
}

function formatMoney(value: number, currency: string, locale: string): string {
  const symbol = currencySymbol(currency, locale);
  if (value >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${symbol}${(value / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

interface KpiCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  accent?: string;
}

function KpiCard({ label, value, icon, accent = 'text-gray-900' }: KpiCardProps) {
  return (
    <div className="metric-card flex items-center gap-3 min-w-0">
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
    <div className="metric-card flex items-center gap-3 animate-pulse">
      <div className="h-8 w-8 rounded-md bg-gray-200" />
      <div className="space-y-1.5">
        <div className="h-5 w-16 rounded bg-gray-200" />
        <div className="h-3 w-24 rounded bg-gray-100" />
      </div>
    </div>
  );
}

export function KpiStrip() {
  const [entityTypeKey, setEntityTypeKey] = useState<KpiEntityTypeFilter>('all');
  const [timeRange, setTimeRange] = useState<KpiTimeRange>('90d');
  const { organization } = useCurrentOrganization();
  const { data: entityTypes = [] } = useEntityTypes();

  const entityTypeOptions = useMemo<{ value: KpiEntityTypeFilter; label: string }[]>(() => {
    const dynamic = entityTypes.map((et) => ({ value: et.key as KpiEntityTypeFilter, label: et.label }));
    return [{ value: 'all' as KpiEntityTypeFilter, label: 'All types' }, ...dynamic];
  }, [entityTypes]);

  const { data: kpis, isLoading } = useDashboardKpis({ entityTypeKey, timeRange });
  const orgCurrency = organization?.currency ?? 'EUR';
  const orgLocale = organization?.locale ?? 'es-ES';
  const entityPlural = organization?.entity_label_plural ?? 'Clients';

  return (
    <div className="mb-6 space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={entityTypeKey}
          onValueChange={(v) => setEntityTypeKey(v as KpiEntityTypeFilter)}
        >
          <SelectTrigger className="h-7 w-32 text-xs bg-white border-gray-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 z-50">
            {entityTypeOptions.map((o) => (
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

        {(entityTypeKey !== 'all' || timeRange !== '90d') && (
          <span className="text-[10px] text-gray-400">
            Filtered
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        {isLoading || !kpis ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <KpiCard
              label="Pipeline"
              value={formatMoney(kpis.pipelineTotal, orgCurrency, orgLocale)}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <KpiCard
              label="Weighted Forecast"
              value={formatMoney(kpis.weightedForecast, orgCurrency, orgLocale)}
              icon={<Target className="h-4 w-4" />}
            />
            <KpiCard
              label="At Risk"
              value={String(kpis.atRiskCount)}
              icon={<AlertTriangle className="h-4 w-4" />}
              accent={kpis.atRiskCount > 0 ? 'text-red-600' : 'text-gray-900'}
            />
            <KpiCard
              label={`Active ${entityPlural}`}
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
