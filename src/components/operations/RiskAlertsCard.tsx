import { useState } from 'react';
import { AlertTriangle, ShieldAlert, ShieldCheck, ExternalLink, ListTodo, Loader2 } from 'lucide-react';
import { useRiskAlerts } from '@/hooks/useRiskAlerts';
import { RISK_REASON_LABELS } from '@/types/operations';
import type { RiskLevel, RiskAlert, RiskReason } from '@/types/operations';
import type { EntityTypeKey } from '@/types/entity';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EmptyState, LoadingState } from '@/components/ui/view-states';

const LEVEL_CONFIG: Record<RiskLevel, { bg: string; text: string; dot: string; label: string }> = {
  high: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'High' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Medium' },
  low: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', label: 'Low' },
};

interface AlertRowProps {
  alert: RiskAlert;
  onOpen: (pharmacyId: string, pharmacyName: string) => void;
  onFollowUp: (pharmacyId: string, pharmacyName: string, reasons: RiskReason[]) => Promise<void>;
}

function AlertRow({ alert, onOpen, onFollowUp }: AlertRowProps) {
  const cfg = LEVEL_CONFIG[alert.riskLevel];
  const [creating, setCreating] = useState(false);

  const handleFollowUp = async () => {
    setCreating(true);
    try {
      await onFollowUp(alert.pharmacyId, alert.pharmacyName, alert.reasons);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex items-start gap-2 py-1.5">
      <span className={cn('mt-1.5 h-2 w-2 rounded-full shrink-0', cfg.dot)} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{alert.pharmacyName}</p>
        <p className="text-xs text-muted-foreground">
          {alert.reasons.map((r) => RISK_REASON_LABELS[r]).join(' · ')}
          {alert.daysSinceLastOrder !== null && (
            <span className="ml-1 text-muted-foreground">({alert.daysSinceLastOrder}d ago)</span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          onClick={() => onOpen(alert.pharmacyId, alert.pharmacyName)}
          title="Open pharmacy"
        >
          <ExternalLink className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
          onClick={handleFollowUp}
          disabled={creating}
          title="Create follow-up task"
        >
          {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <ListTodo className="h-3 w-3" />}
        </Button>
        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', cfg.bg, cfg.text)}>
          {cfg.label}
        </span>
      </div>
    </div>
  );
}

interface RiskAlertsCardProps {
  clientType?: EntityTypeKey;
  onOpenPharmacy?: (pharmacyId: string, pharmacyName: string) => void;
  onCreateFollowUpTask?: (pharmacyId: string, pharmacyName: string, reasons: RiskReason[]) => Promise<void>;
}

export function RiskAlertsCard({
  clientType = 'pharmacy',
  onOpenPharmacy,
  onCreateFollowUpTask,
}: RiskAlertsCardProps) {
  const { alerts, summary, isLoading } = useRiskAlerts(clientType);

  const handleOpen = (pharmacyId: string, pharmacyName: string) => {
    onOpenPharmacy?.(pharmacyId, pharmacyName);
  };

  const handleFollowUp = async (pharmacyId: string, pharmacyName: string, reasons: RiskReason[]) => {
    await onCreateFollowUpTask?.(pharmacyId, pharmacyName, reasons);
  };

  const top5 = alerts.slice(0, 5);

  return (
    <div className="surface-card">
      <div className="surface-card-header">
        <ShieldAlert className="h-4 w-4 text-red-500" />
        <h3 className="text-sm font-semibold text-foreground">Risk Alerts</h3>
      </div>
      <div className="surface-card-body pt-3">
        {isLoading ? (
          <LoadingState
            title="Loading risk alerts..."
            description="Evaluating client health signals."
            className="h-full min-h-[180px]"
          />
        ) : summary.totalAtRisk === 0 ? (
          <EmptyState
            title="No risk alerts"
            description="All clients are in good standing."
            icon={ShieldCheck}
            tone="success"
            className="h-full min-h-[180px]"
          />
        ) : (
          <>
            {/* Summary badges */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
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
              <span className="text-xs text-muted-foreground">{summary.totalAtRisk} total at risk</span>
            </div>

            {/* Top alerts */}
            <div className="divide-y divide-border">
              {top5.map((alert) => (
                <AlertRow
                  key={alert.pharmacyId}
                  alert={alert}
                  onOpen={handleOpen}
                  onFollowUp={handleFollowUp}
                />
              ))}
            </div>

            {alerts.length > 5 && (
              <p className="text-xs text-muted-foreground mt-2">+{alerts.length - 5} more</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
