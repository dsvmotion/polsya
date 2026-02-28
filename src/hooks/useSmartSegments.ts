import { useMemo } from 'react';
import type { PharmacyWithOrders, SmartSegmentKey } from '@/types/operations';

export const STALE_THRESHOLD_DAYS = 60;

export function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export function isClient(p: PharmacyWithOrders): boolean {
  return p.commercialStatus === 'client';
}

export function isNoOrdersClient(p: PharmacyWithOrders): boolean {
  return isClient(p) && !p.lastOrder;
}

export function isPaymentFailed(p: PharmacyWithOrders): boolean {
  return isClient(p) && p.lastOrder?.paymentStatus === 'failed';
}

export function isNoRecentOrders(p: PharmacyWithOrders): boolean {
  if (!isClient(p) || !p.lastOrder) return false;
  return daysSince(p.lastOrder.dateCreated) > STALE_THRESHOLD_DAYS;
}

export function isAtRisk(p: PharmacyWithOrders): boolean {
  return isNoOrdersClient(p) || isPaymentFailed(p) || isNoRecentOrders(p);
}

const MATCHERS: Record<Exclude<SmartSegmentKey, 'none'>, (p: PharmacyWithOrders) => boolean> = {
  at_risk: isAtRisk,
  no_orders_client: isNoOrdersClient,
  payment_failed: isPaymentFailed,
  no_recent_orders_60d: isNoRecentOrders,
};

export function filterBySmartSegment(
  pharmacies: PharmacyWithOrders[],
  key: SmartSegmentKey,
): PharmacyWithOrders[] {
  if (key === 'none') return pharmacies;
  const matcher = MATCHERS[key];
  return pharmacies.filter(matcher);
}

export interface SmartSegmentCounts {
  at_risk: number;
  no_orders_client: number;
  payment_failed: number;
  no_recent_orders_60d: number;
}

export function computeSmartSegmentCounts(pharmacies: PharmacyWithOrders[]): SmartSegmentCounts {
  let atRisk = 0;
  let noOrders = 0;
  let payFailed = 0;
  let noRecent = 0;

  for (const p of pharmacies) {
    const noc = isNoOrdersClient(p);
    const pf = isPaymentFailed(p);
    const nr = isNoRecentOrders(p);

    if (noc) noOrders++;
    if (pf) payFailed++;
    if (nr) noRecent++;
    if (noc || pf || nr) atRisk++;
  }

  return {
    at_risk: atRisk,
    no_orders_client: noOrders,
    payment_failed: payFailed,
    no_recent_orders_60d: noRecent,
  };
}

export function useSmartSegmentCounts(pharmacies: PharmacyWithOrders[]): SmartSegmentCounts {
  return useMemo(() => computeSmartSegmentCounts(pharmacies), [pharmacies]);
}
