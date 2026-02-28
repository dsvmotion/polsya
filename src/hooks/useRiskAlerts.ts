import { useMemo } from 'react';
import { usePharmaciesWithOrders } from '@/hooks/usePharmacyOperations';
import type { RiskAlert, RiskReason, RiskLevel, RiskSummary } from '@/types/operations';
import type { ClientType } from '@/types/pharmacy';

const MEDIUM_THRESHOLD_DAYS = 60;

function daysBetween(dateStr: string, now: number): number {
  return Math.floor((now - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export function useRiskAlerts(clientType: ClientType = 'pharmacy') {
  const { data: pharmacies, isLoading } = usePharmaciesWithOrders(true, clientType);

  const { alerts, summary } = useMemo(() => {
    if (!pharmacies || pharmacies.length === 0) {
      return {
        alerts: [] as RiskAlert[],
        summary: { highCount: 0, mediumCount: 0, totalAtRisk: 0 } as RiskSummary,
      };
    }

    const now = Date.now();
    const result: RiskAlert[] = [];

    for (const p of pharmacies) {
      if (p.commercialStatus !== 'client') continue;

      const reasons: RiskReason[] = [];
      let level: RiskLevel = 'low';

      const lastDate = p.lastOrder?.dateCreated ?? null;
      const days = lastDate ? daysBetween(lastDate, now) : null;
      const lastPayment = p.lastOrder?.paymentStatus ?? null;

      if (!p.lastOrder) {
        reasons.push('no_orders_client');
        level = 'high';
      } else {
        if (lastPayment === 'failed') {
          reasons.push('payment_failures');
          level = 'high';
        }
        if (days !== null && days > MEDIUM_THRESHOLD_DAYS) {
          reasons.push('no_recent_orders');
          if (level !== 'high') level = 'medium';
        }
      }

      if (reasons.length > 0) {
        result.push({
          pharmacyId: p.id,
          pharmacyName: p.name,
          riskLevel: level,
          reasons,
          lastOrderDate: lastDate,
          daysSinceLastOrder: days,
          lastPaymentStatus: lastPayment,
        });
      }
    }

    result.sort((a, b) => {
      const levelOrder: Record<RiskLevel, number> = { high: 0, medium: 1, low: 2 };
      const cmp = levelOrder[a.riskLevel] - levelOrder[b.riskLevel];
      if (cmp !== 0) return cmp;
      return (b.daysSinceLastOrder ?? Infinity) - (a.daysSinceLastOrder ?? Infinity);
    });

    const highCount = result.filter((a) => a.riskLevel === 'high').length;
    const mediumCount = result.filter((a) => a.riskLevel === 'medium').length;

    return {
      alerts: result,
      summary: { highCount, mediumCount, totalAtRisk: highCount + mediumCount } as RiskSummary,
    };
  }, [pharmacies]);

  return { alerts, summary, isLoading };
}
