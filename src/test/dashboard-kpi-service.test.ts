import { describe, it, expect } from 'vitest';
import {
  filterPharmaciesByClientType,
  filterOpportunitiesByTimeRange,
  filterOpportunitiesByPharmacyIds,
  computeConversionRate,
  countActiveClients,
  computeAtRiskCount,
  computeDashboardKpis,
  STALE_THRESHOLD_MS,
  type PharmacyRow,
  type OpportunityRow,
  type DocumentRow,
} from '@/services/dashboardKpiService';

function makePharmacy(overrides: Partial<PharmacyRow> = {}): PharmacyRow {
  return { id: 'p1', commercial_status: 'client', client_type: 'pharmacy', ...overrides };
}

function makeOpp(overrides: Partial<OpportunityRow> = {}): OpportunityRow {
  return {
    id: 'o1',
    pharmacy_id: 'p1',
    amount: 1000,
    probability: 50,
    stage: 'qualified',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function daysAgoIso(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// filterPharmaciesByClientType
// ---------------------------------------------------------------------------
describe('filterPharmaciesByClientType', () => {
  const pharmacies = [
    makePharmacy({ id: 'p1', client_type: 'pharmacy' }),
    makePharmacy({ id: 'p2', client_type: 'herbalist' }),
    makePharmacy({ id: 'p3', client_type: 'pharmacy' }),
  ];

  it('returns all when clientType is "all"', () => {
    expect(filterPharmaciesByClientType(pharmacies, 'all')).toHaveLength(3);
  });

  it('filters to pharmacy only', () => {
    const result = filterPharmaciesByClientType(pharmacies, 'pharmacy');
    expect(result).toHaveLength(2);
    expect(result.every((p) => p.client_type === 'pharmacy')).toBe(true);
  });

  it('filters to herbalist only', () => {
    const result = filterPharmaciesByClientType(pharmacies, 'herbalist');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('p2');
  });
});

// ---------------------------------------------------------------------------
// filterOpportunitiesByTimeRange
// ---------------------------------------------------------------------------
describe('filterOpportunitiesByTimeRange', () => {
  const opps = [
    makeOpp({ id: 'o1', created_at: daysAgoIso(10) }),
    makeOpp({ id: 'o2', created_at: daysAgoIso(50) }),
    makeOpp({ id: 'o3', created_at: daysAgoIso(100) }),
  ];

  it('returns all when cutoff is null', () => {
    expect(filterOpportunitiesByTimeRange(opps, null)).toHaveLength(3);
  });

  it('filters by 30d cutoff', () => {
    const cutoff = daysAgoIso(30);
    const result = filterOpportunitiesByTimeRange(opps, cutoff);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('o1');
  });

  it('filters by 90d cutoff', () => {
    const cutoff = daysAgoIso(90);
    const result = filterOpportunitiesByTimeRange(opps, cutoff);
    expect(result).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// filterOpportunitiesByPharmacyIds
// ---------------------------------------------------------------------------
describe('filterOpportunitiesByPharmacyIds', () => {
  it('keeps only opportunities linked to given pharmacy ids', () => {
    const opps = [
      makeOpp({ id: 'o1', pharmacy_id: 'p1' }),
      makeOpp({ id: 'o2', pharmacy_id: 'p2' }),
      makeOpp({ id: 'o3', pharmacy_id: 'p1' }),
    ];
    const result = filterOpportunitiesByPharmacyIds(opps, new Set(['p1']));
    expect(result).toHaveLength(2);
    expect(result.map((o) => o.id).sort()).toEqual(['o1', 'o3']);
  });
});

// ---------------------------------------------------------------------------
// computeConversionRate
// ---------------------------------------------------------------------------
describe('computeConversionRate', () => {
  it('returns 0 when no eligible pharmacies', () => {
    expect(computeConversionRate([
      makePharmacy({ commercial_status: 'not_contacted' }),
    ])).toBe(0);
  });

  it('returns 0 when denominator is 0 (empty array)', () => {
    expect(computeConversionRate([])).toBe(0);
  });

  it('calculates correctly with mixed statuses', () => {
    const pharmacies = [
      makePharmacy({ commercial_status: 'contacted' }),
      makePharmacy({ commercial_status: 'qualified' }),
      makePharmacy({ commercial_status: 'proposal' }),
      makePharmacy({ commercial_status: 'client' }),
    ];
    expect(computeConversionRate(pharmacies)).toBe(25);
  });

  it('returns 100 when all eligible are clients', () => {
    const pharmacies = [
      makePharmacy({ commercial_status: 'client' }),
      makePharmacy({ commercial_status: 'client' }),
    ];
    expect(computeConversionRate(pharmacies)).toBe(100);
  });

  it('ignores not_contacted, retained, lost', () => {
    const pharmacies = [
      makePharmacy({ commercial_status: 'not_contacted' }),
      makePharmacy({ commercial_status: 'retained' }),
      makePharmacy({ commercial_status: 'lost' }),
      makePharmacy({ commercial_status: 'client' }),
    ];
    expect(computeConversionRate(pharmacies)).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// countActiveClients
// ---------------------------------------------------------------------------
describe('countActiveClients', () => {
  it('counts only client status', () => {
    const pharmacies = [
      makePharmacy({ commercial_status: 'client' }),
      makePharmacy({ commercial_status: 'contacted' }),
      makePharmacy({ commercial_status: 'client' }),
    ];
    expect(countActiveClients(pharmacies)).toBe(2);
  });

  it('returns 0 for empty array', () => {
    expect(countActiveClients([])).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computeAtRiskCount
// ---------------------------------------------------------------------------
describe('computeAtRiskCount', () => {
  const now = Date.now();

  it('returns 0 for empty client list', () => {
    expect(computeAtRiskCount([], [], now)).toBe(0);
  });

  it('counts client with no documents as at-risk', () => {
    expect(computeAtRiskCount(['p1'], [], now)).toBe(1);
  });

  it('counts client with stale document as at-risk', () => {
    const docs: DocumentRow[] = [
      { pharmacy_id: 'p1', uploaded_at: new Date(now - STALE_THRESHOLD_MS - 1000).toISOString() },
    ];
    expect(computeAtRiskCount(['p1'], docs, now)).toBe(1);
  });

  it('does not count client with recent document', () => {
    const docs: DocumentRow[] = [
      { pharmacy_id: 'p1', uploaded_at: new Date(now - 1000).toISOString() },
    ];
    expect(computeAtRiskCount(['p1'], docs, now)).toBe(0);
  });

  it('handles mixed clients correctly', () => {
    const docs: DocumentRow[] = [
      { pharmacy_id: 'p1', uploaded_at: new Date(now - 1000).toISOString() },
      { pharmacy_id: 'p2', uploaded_at: new Date(now - STALE_THRESHOLD_MS - 1000).toISOString() },
    ];
    expect(computeAtRiskCount(['p1', 'p2', 'p3'], docs, now)).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// computeDashboardKpis (integration of all pure functions)
// ---------------------------------------------------------------------------
describe('computeDashboardKpis', () => {
  it('returns zeros for empty inputs', () => {
    const result = computeDashboardKpis({
      pharmacies: [],
      opportunities: [],
      documents: [],
      clientType: 'all',
      cutoffIso: null,
    });
    expect(result).toEqual({
      pipelineTotal: 0,
      weightedForecast: 0,
      atRiskCount: 0,
      activeClientsCount: 0,
      conversionRate: 0,
    });
  });

  it('computes pipeline from open opportunities only', () => {
    const result = computeDashboardKpis({
      pharmacies: [makePharmacy({ id: 'p1' })],
      opportunities: [
        makeOpp({ id: 'o1', pharmacy_id: 'p1', amount: 1000, probability: 50, stage: 'qualified' }),
        makeOpp({ id: 'o2', pharmacy_id: 'p1', amount: 2000, probability: 80, stage: 'proposal' }),
        makeOpp({ id: 'o3', pharmacy_id: 'p1', amount: 500, probability: 100, stage: 'won' }),
      ],
      documents: [],
      clientType: 'all',
      cutoffIso: null,
    });
    expect(result.pipelineTotal).toBe(3000);
    expect(result.weightedForecast).toBe(1000 * 0.5 + 2000 * 0.8);
  });

  it('filters opportunities by clientType=pharmacy', () => {
    const result = computeDashboardKpis({
      pharmacies: [
        makePharmacy({ id: 'p1', client_type: 'pharmacy' }),
        makePharmacy({ id: 'p2', client_type: 'herbalist' }),
      ],
      opportunities: [
        makeOpp({ id: 'o1', pharmacy_id: 'p1', amount: 1000, probability: 50, stage: 'qualified' }),
        makeOpp({ id: 'o2', pharmacy_id: 'p2', amount: 2000, probability: 80, stage: 'qualified' }),
      ],
      documents: [],
      clientType: 'pharmacy',
      cutoffIso: null,
    });
    expect(result.pipelineTotal).toBe(1000);
  });

  it('filters opportunities by timeRange cutoff', () => {
    const result = computeDashboardKpis({
      pharmacies: [makePharmacy({ id: 'p1' })],
      opportunities: [
        makeOpp({ id: 'o1', pharmacy_id: 'p1', amount: 1000, stage: 'qualified', created_at: daysAgoIso(10) }),
        makeOpp({ id: 'o2', pharmacy_id: 'p1', amount: 2000, stage: 'qualified', created_at: daysAgoIso(100) }),
      ],
      documents: [],
      clientType: 'all',
      cutoffIso: daysAgoIso(30),
    });
    expect(result.pipelineTotal).toBe(1000);
  });

  it('computes at-risk from document staleness', () => {
    const now = Date.now();
    const result = computeDashboardKpis({
      pharmacies: [
        makePharmacy({ id: 'p1', commercial_status: 'client' }),
        makePharmacy({ id: 'p2', commercial_status: 'client' }),
      ],
      opportunities: [],
      documents: [
        { pharmacy_id: 'p1', uploaded_at: new Date(now - 1000).toISOString() },
      ],
      clientType: 'all',
      cutoffIso: null,
      nowMs: now,
    });
    expect(result.atRiskCount).toBe(1);
    expect(result.activeClientsCount).toBe(2);
  });

  it('computes conversion rate scoped by clientType', () => {
    const result = computeDashboardKpis({
      pharmacies: [
        makePharmacy({ id: 'p1', commercial_status: 'contacted', client_type: 'pharmacy' }),
        makePharmacy({ id: 'p2', commercial_status: 'client', client_type: 'pharmacy' }),
        makePharmacy({ id: 'p3', commercial_status: 'contacted', client_type: 'herbalist' }),
      ],
      opportunities: [],
      documents: [],
      clientType: 'pharmacy',
      cutoffIso: null,
    });
    expect(result.conversionRate).toBe(50);
    expect(result.activeClientsCount).toBe(1);
  });

  it('combined: clientType + timeRange + at-risk', () => {
    const now = Date.now();
    const result = computeDashboardKpis({
      pharmacies: [
        makePharmacy({ id: 'p1', commercial_status: 'client', client_type: 'pharmacy' }),
        makePharmacy({ id: 'p2', commercial_status: 'contacted', client_type: 'herbalist' }),
      ],
      opportunities: [
        makeOpp({ id: 'o1', pharmacy_id: 'p1', amount: 500, probability: 60, stage: 'proposal', created_at: daysAgoIso(5) }),
        makeOpp({ id: 'o2', pharmacy_id: 'p2', amount: 800, probability: 40, stage: 'qualified', created_at: daysAgoIso(5) }),
      ],
      documents: [],
      clientType: 'pharmacy',
      cutoffIso: daysAgoIso(30),
      nowMs: now,
    });
    expect(result.pipelineTotal).toBe(500);
    expect(result.weightedForecast).toBe(300);
    expect(result.activeClientsCount).toBe(1);
    expect(result.atRiskCount).toBe(1);
    expect(result.conversionRate).toBe(100);
  });
});
