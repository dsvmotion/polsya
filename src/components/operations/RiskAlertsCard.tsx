import { AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useRiskAlerts } from '@/hooks/useRiskAlerts';
import { RISK_REASON_LABELS } from '@/types/operations';
import type { RiskLevel, RiskAlert } from '@/types/operations';
import type { ClientType } from '@/types/pharmacy';
import { cn } from '@/lib/utils';

const LEVEL_CONFIG: Record<RiskLevel, { bg: string; text: string; dot: string; label: string }> = {
  high: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'High' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Medium' },
  low: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', label: 'Low' },
};

function AlertRow({ alert }: { alert: RiskAlert }) {
  const cfg = LEVEL_CONFIG[alert.riskLevel];
  return (
    <div className="flex items-start gap-2 py-1.5">
      <span className={cn('mt-1.5 h-2 w-2 rounded-full shrink-0', cfg.dot)} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 truncate">{alert.pharmacyName}</p>
        <p className="text-xs text-gray-500">
          {alert.reasons.map((r) => RISK_REASON_LABELS[r]).join(' · ')}
          {alert.daysSinceLastOrder !== null && (
            <span className="ml-1 text-gray-400">({alert.daysSinceLastOrder}d ago)</span>
          )}
        </p>
      </div>
      <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', cfg.bg, cfg.text)}>
        {cfg.label}
      </span>
    </div>
  );
}

interface RiskAlertsCardProps {
  clientType?: ClientType;
}

export function RiskAlertsCard({ clientType = 'pharmacy' }: RiskAlertsCardProps) {
  const { alerts, summary, isLoading } = useRiskAlerts(clientType);

  if (isLoading) {
    return (
      <div className="border border-gray-200 rounded-lg bg-white p-4 animate-pulse">
        <div className="h-4 w-28 bg-gray-200 rounded mb-3" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-gray-100 rounded" />
          <div className="h-3 w-3/4 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (summary.totalAtRisk === 0) {
    return (
      <div className="border border-gray-200 rounded-lg bg-white p-4 flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-green-500 shrink-0" />
        <div>
          <p className="text-sm font-medium text-gray-900">No risk alerts</p>
          <p className="text-xs text-gray-500">All clients are in good standing</p>
        </div>
      </div>
    );
  }

  const top5 = alerts.slice(0, 5);

  return (
    <div className="border border-gray-200 rounded-lg bg-white p-4">
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert className="h-4 w-4 text-red-500" />
        <h3 className="text-sm font-semibold text-gray-900">Risk Alerts</h3>
      </div>

      {/* Summary badges */}
      <div className="flex items-center gap-3 mb-3">
        {summary.highCount > 0 && (
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            <span className="text-xs font-medium text-red-700">{summary.highCount} High</span>
          </div>
        )}
        {summary.mediumCount > 0 && (
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-medium text-amber-700">{summary.mediumCount} Medium</span>
          </div>
        )}
        <span className="text-xs text-gray-400">{summary.totalAtRisk} total at risk</span>
      </div>

      {/* Top alerts */}
      <div className="divide-y divide-gray-100">
        {top5.map((alert) => (
          <AlertRow key={alert.pharmacyId} alert={alert} />
        ))}
      </div>

      {alerts.length > 5 && (
        <p className="text-xs text-gray-400 mt-2">+{alerts.length - 5} more</p>
      )}
    </div>
  );
}
