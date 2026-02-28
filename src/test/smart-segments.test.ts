import { describe, it, expect } from 'vitest';
import type { PharmacyWithOrders, DetailedOrder } from '@/types/operations';
import {
  isClient,
  isNoOrdersClient,
  isPaymentFailed,
  isNoRecentOrders,
  isAtRisk,
  filterBySmartSegment,
  computeSmartSegmentCounts,
  STALE_THRESHOLD_DAYS,
} from '@/hooks/useSmartSegments';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function makeOrder(overrides: Partial<DetailedOrder> = {}): DetailedOrder {
  return {
    id: '1',
    orderId: 'WC-1',
    status: 'completed',
    customerName: 'Test',
    customerType: 'pharmacy',
    email: '',
    phone: '',
    billingAddress: '',
    billingCity: '',
    billingProvince: '',
    billingCountry: '',
    shippingAddress: '',
    shippingCity: '',
    amount: 100,
    dateCreated: daysAgo(10),
    datePaid: daysAgo(10),
    paymentMethod: 'bacs',
    paymentMethodTitle: 'Bank',
    paymentStatus: 'paid',
    products: [],
    paymentLinkUrl: null,
    ...overrides,
  };
}

function makePharmacy(overrides: Partial<PharmacyWithOrders> = {}): PharmacyWithOrders {
  return {
    id: 'p1',
    name: 'Farmacia Test',
    address: null,
    city: null,
    province: null,
    country: null,
    clientType: 'pharmacy',
    phone: null,
    email: null,
    commercialStatus: 'client',
    notes: null,
    orders: [],
    lastOrder: null,
    totalRevenue: 0,
    hasInvoice: false,
    hasReceipt: false,
    lat: 0,
    lng: 0,
    savedAt: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// isClient
// ---------------------------------------------------------------------------
describe('isClient', () => {
  it('returns true for commercialStatus=client', () => {
    expect(isClient(makePharmacy({ commercialStatus: 'client' }))).toBe(true);
  });

  it.each(['not_contacted', 'contacted', 'qualified', 'proposal', 'retained', 'lost'] as const)(
    'returns false for commercialStatus=%s',
    (status) => {
      expect(isClient(makePharmacy({ commercialStatus: status }))).toBe(false);
    },
  );
});

// ---------------------------------------------------------------------------
// isNoOrdersClient
// ---------------------------------------------------------------------------
describe('isNoOrdersClient', () => {
  it('returns true for client with no lastOrder', () => {
    expect(isNoOrdersClient(makePharmacy({ commercialStatus: 'client', lastOrder: null }))).toBe(true);
  });

  it('returns false for client with a lastOrder', () => {
    expect(isNoOrdersClient(makePharmacy({ lastOrder: makeOrder() }))).toBe(false);
  });

  it('returns false for non-client even without orders', () => {
    expect(isNoOrdersClient(makePharmacy({ commercialStatus: 'contacted', lastOrder: null }))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isPaymentFailed
// ---------------------------------------------------------------------------
describe('isPaymentFailed', () => {
  it('returns true when client lastOrder paymentStatus is failed', () => {
    const p = makePharmacy({ lastOrder: makeOrder({ paymentStatus: 'failed' }) });
    expect(isPaymentFailed(p)).toBe(true);
  });

  it('returns false when client lastOrder paymentStatus is paid', () => {
    const p = makePharmacy({ lastOrder: makeOrder({ paymentStatus: 'paid' }) });
    expect(isPaymentFailed(p)).toBe(false);
  });

  it('returns false when client lastOrder paymentStatus is pending', () => {
    const p = makePharmacy({ lastOrder: makeOrder({ paymentStatus: 'pending' }) });
    expect(isPaymentFailed(p)).toBe(false);
  });

  it('returns false when client lastOrder paymentStatus is refunded', () => {
    const p = makePharmacy({ lastOrder: makeOrder({ paymentStatus: 'refunded' }) });
    expect(isPaymentFailed(p)).toBe(false);
  });

  it('returns false for non-client even with failed payment', () => {
    const p = makePharmacy({ commercialStatus: 'contacted', lastOrder: makeOrder({ paymentStatus: 'failed' }) });
    expect(isPaymentFailed(p)).toBe(false);
  });

  it('returns false when client has no lastOrder', () => {
    expect(isPaymentFailed(makePharmacy({ lastOrder: null }))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isNoRecentOrders
// ---------------------------------------------------------------------------
describe('isNoRecentOrders', () => {
  it('returns true when last order is older than 60 days', () => {
    const p = makePharmacy({ lastOrder: makeOrder({ dateCreated: daysAgo(61) }) });
    expect(isNoRecentOrders(p)).toBe(true);
  });

  it('returns false when last order is exactly 60 days ago', () => {
    const p = makePharmacy({ lastOrder: makeOrder({ dateCreated: daysAgo(STALE_THRESHOLD_DAYS) }) });
    expect(isNoRecentOrders(p)).toBe(false);
  });

  it('returns false when last order is recent (10 days)', () => {
    const p = makePharmacy({ lastOrder: makeOrder({ dateCreated: daysAgo(10) }) });
    expect(isNoRecentOrders(p)).toBe(false);
  });

  it('returns false for non-client even with old order', () => {
    const p = makePharmacy({ commercialStatus: 'not_contacted', lastOrder: makeOrder({ dateCreated: daysAgo(90) }) });
    expect(isNoRecentOrders(p)).toBe(false);
  });

  it('returns false when client has no lastOrder', () => {
    expect(isNoRecentOrders(makePharmacy({ lastOrder: null }))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isAtRisk
// ---------------------------------------------------------------------------
describe('isAtRisk', () => {
  it('returns true for client with no orders', () => {
    expect(isAtRisk(makePharmacy({ lastOrder: null }))).toBe(true);
  });

  it('returns true for client with failed payment', () => {
    expect(isAtRisk(makePharmacy({ lastOrder: makeOrder({ paymentStatus: 'failed' }) }))).toBe(true);
  });

  it('returns true for client with stale order (>60d)', () => {
    expect(isAtRisk(makePharmacy({ lastOrder: makeOrder({ dateCreated: daysAgo(90) }) }))).toBe(true);
  });

  it('returns false for healthy client (recent paid order)', () => {
    expect(isAtRisk(makePharmacy({ lastOrder: makeOrder({ dateCreated: daysAgo(5), paymentStatus: 'paid' }) }))).toBe(false);
  });

  it('returns false for non-client regardless of orders', () => {
    expect(isAtRisk(makePharmacy({ commercialStatus: 'contacted', lastOrder: null }))).toBe(false);
    expect(isAtRisk(makePharmacy({ commercialStatus: 'not_contacted', lastOrder: makeOrder({ paymentStatus: 'failed' }) }))).toBe(false);
  });

  it('returns true when multiple risk reasons apply simultaneously', () => {
    const p = makePharmacy({ lastOrder: makeOrder({ paymentStatus: 'failed', dateCreated: daysAgo(90) }) });
    expect(isAtRisk(p)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// filterBySmartSegment
// ---------------------------------------------------------------------------
describe('filterBySmartSegment', () => {
  const healthy = makePharmacy({ id: 'healthy', lastOrder: makeOrder({ dateCreated: daysAgo(5), paymentStatus: 'paid' }) });
  const noOrders = makePharmacy({ id: 'no-orders', lastOrder: null });
  const failedPay = makePharmacy({ id: 'failed', lastOrder: makeOrder({ paymentStatus: 'failed', dateCreated: daysAgo(5) }) });
  const stale = makePharmacy({ id: 'stale', lastOrder: makeOrder({ dateCreated: daysAgo(90), paymentStatus: 'paid' }) });
  const nonClient = makePharmacy({ id: 'non-client', commercialStatus: 'contacted', lastOrder: null });

  const all = [healthy, noOrders, failedPay, stale, nonClient];

  it('"none" returns all pharmacies unchanged', () => {
    const result = filterBySmartSegment(all, 'none');
    expect(result).toBe(all);
  });

  it('"at_risk" returns only at-risk pharmacies', () => {
    const result = filterBySmartSegment(all, 'at_risk');
    expect(result.map((p) => p.id).sort()).toEqual(['failed', 'no-orders', 'stale']);
  });

  it('"no_orders_client" returns only clients without orders', () => {
    const result = filterBySmartSegment(all, 'no_orders_client');
    expect(result.map((p) => p.id)).toEqual(['no-orders']);
  });

  it('"payment_failed" returns only clients with failed payment', () => {
    const result = filterBySmartSegment(all, 'payment_failed');
    expect(result.map((p) => p.id)).toEqual(['failed']);
  });

  it('"no_recent_orders_60d" returns only clients with stale orders', () => {
    const result = filterBySmartSegment(all, 'no_recent_orders_60d');
    expect(result.map((p) => p.id)).toEqual(['stale']);
  });

  it('returns empty array when no pharmacies match', () => {
    const result = filterBySmartSegment([healthy, nonClient], 'payment_failed');
    expect(result).toEqual([]);
  });

  it('handles empty input array', () => {
    expect(filterBySmartSegment([], 'at_risk')).toEqual([]);
    expect(filterBySmartSegment([], 'none')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// computeSmartSegmentCounts
// ---------------------------------------------------------------------------
describe('computeSmartSegmentCounts', () => {
  it('returns all zeros for empty array', () => {
    expect(computeSmartSegmentCounts([])).toEqual({
      at_risk: 0,
      no_orders_client: 0,
      payment_failed: 0,
      no_recent_orders_60d: 0,
    });
  });

  it('returns all zeros when no pharmacies are at risk', () => {
    const healthy = makePharmacy({ lastOrder: makeOrder({ dateCreated: daysAgo(5), paymentStatus: 'paid' }) });
    const nonClient = makePharmacy({ commercialStatus: 'contacted', lastOrder: null });
    expect(computeSmartSegmentCounts([healthy, nonClient])).toEqual({
      at_risk: 0,
      no_orders_client: 0,
      payment_failed: 0,
      no_recent_orders_60d: 0,
    });
  });

  it('counts each risk category correctly', () => {
    const noOrders = makePharmacy({ id: 'a', lastOrder: null });
    const failedPay = makePharmacy({ id: 'b', lastOrder: makeOrder({ paymentStatus: 'failed', dateCreated: daysAgo(5) }) });
    const stale = makePharmacy({ id: 'c', lastOrder: makeOrder({ dateCreated: daysAgo(90), paymentStatus: 'paid' }) });
    const healthy = makePharmacy({ id: 'd', lastOrder: makeOrder({ dateCreated: daysAgo(5), paymentStatus: 'paid' }) });

    const counts = computeSmartSegmentCounts([noOrders, failedPay, stale, healthy]);
    expect(counts).toEqual({
      at_risk: 3,
      no_orders_client: 1,
      payment_failed: 1,
      no_recent_orders_60d: 1,
    });
  });

  it('pharmacy matching multiple risks is counted once in at_risk', () => {
    const multi = makePharmacy({ lastOrder: makeOrder({ paymentStatus: 'failed', dateCreated: daysAgo(90) }) });
    const counts = computeSmartSegmentCounts([multi]);
    expect(counts.at_risk).toBe(1);
    expect(counts.payment_failed).toBe(1);
    expect(counts.no_recent_orders_60d).toBe(1);
    expect(counts.no_orders_client).toBe(0);
  });

  it('non-client pharmacies are never counted', () => {
    const nonClient = makePharmacy({ commercialStatus: 'not_contacted', lastOrder: null });
    const counts = computeSmartSegmentCounts([nonClient]);
    expect(counts).toEqual({
      at_risk: 0,
      no_orders_client: 0,
      payment_failed: 0,
      no_recent_orders_60d: 0,
    });
  });
});
