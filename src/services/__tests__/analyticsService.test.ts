import { describe, it, expect } from 'vitest';
import {
  computePeriodComparison,
  computeConversionFunnel,
  computeRevenueForecast,
  computeActivityCorrelation,
  computeTouchPatterns,
  computeActivityHeatmap,
  computeColdClients,
  computeAtRiskDeals,
  computeRecommendations,
  computeCommunicationScores,
  getCutoffDate,
  getDaysAgo,
} from '../analyticsService';

// ─── Helpers ───────────────────────────────────

describe('getCutoffDate', () => {
  it('returns null for "all"', () => {
    expect(getCutoffDate('all')).toBeNull();
  });
  it('returns a Date N days ago for "30d"', () => {
    const now = new Date('2026-03-06T12:00:00Z');
    const cutoff = getCutoffDate('30d', now);
    expect(cutoff).not.toBeNull();
    const diff = now.getTime() - cutoff!.getTime();
    expect(Math.round(diff / (1000 * 60 * 60 * 24))).toBe(30);
  });
});

describe('getDaysAgo', () => {
  it('computes days between two dates', () => {
    const now = new Date('2026-03-06');
    const past = new Date('2026-02-28');
    expect(getDaysAgo(past.toISOString(), now)).toBe(6);
  });
});

// ─── Period Comparison ──────────────────────────

describe('computePeriodComparison', () => {
  it('computes delta and percent correctly', () => {
    const result = computePeriodComparison(150, 100);
    expect(result.current).toBe(150);
    expect(result.previous).toBe(100);
    expect(result.delta).toBe(50);
    expect(result.deltaPercent).toBe(50);
  });
  it('handles zero previous gracefully', () => {
    const result = computePeriodComparison(100, 0);
    expect(result.deltaPercent).toBe(0);
  });
});

// ─── Conversion Funnel ──────────────────────────

describe('computeConversionFunnel', () => {
  const opps = [
    { stage: 'lead', value_cents: 1000, created_at: '2026-01-01' },
    { stage: 'lead', value_cents: 2000, created_at: '2026-01-02' },
    { stage: 'qualified', value_cents: 3000, created_at: '2026-01-03' },
    { stage: 'proposal', value_cents: 4000, created_at: '2026-01-04' },
    { stage: 'won', value_cents: 5000, created_at: '2026-01-05' },
  ];

  it('returns stages in order with counts', () => {
    const funnel = computeConversionFunnel(opps, []);
    expect(funnel.map((f) => f.stage)).toEqual(['lead', 'qualified', 'proposal', 'negotiation', 'won']);
    expect(funnel[0].count).toBe(2);
    expect(funnel[1].count).toBe(1);
    expect(funnel[4].count).toBe(1);
  });
  it('computes conversion rates between stages', () => {
    const funnel = computeConversionFunnel(opps, []);
    // lead(2) -> qualified(1) = 50%
    expect(funnel[0].conversionRate).toBe(50);
  });
});

// ─── Revenue Forecast ────────────────────────────

describe('computeRevenueForecast', () => {
  const opps = [
    { stage: 'qualified', value_cents: 10000, probability: 40, expected_close_date: '2026-04-01' },
    { stage: 'proposal', value_cents: 20000, probability: 70, expected_close_date: '2026-04-15' },
    { stage: 'negotiation', value_cents: 30000, probability: 90, expected_close_date: '2026-05-01' },
  ];

  it('returns forecast lines per month', () => {
    const forecast = computeRevenueForecast(opps);
    expect(forecast.length).toBeGreaterThan(0);
    const april = forecast.find((f) => f.month.includes('2026-04'));
    expect(april).toBeDefined();
    // Optimistic: 10000 + 20000 = 30000 cents = 300
    expect(april!.optimistic).toBe(300);
  });
  it('weighted = value * probability / 100', () => {
    const forecast = computeRevenueForecast(opps);
    const april = forecast.find((f) => f.month.includes('2026-04'));
    // 10000*0.4 + 20000*0.7 = 4000+14000 = 18000 cents = 180
    expect(april!.weighted).toBe(180);
  });
  it('conservative = only >70% probability', () => {
    const forecast = computeRevenueForecast(opps);
    const april = forecast.find((f) => f.month.includes('2026-04'));
    // Only proposal (70%) qualifies: 20000 cents = 200
    expect(april!.conservative).toBe(200);
  });
});

// ─── Activity Correlation ────────────────────────

describe('computeActivityCorrelation', () => {
  const activities = [
    { entity_id: 'opp1', activity_type: 'call' },
    { entity_id: 'opp1', activity_type: 'email' },
    { entity_id: 'opp2', activity_type: 'call' },
    { entity_id: 'opp2', activity_type: 'meeting' },
  ];
  const oppOutcomes = new Map([['opp1', 'won'], ['opp2', 'lost']]);

  it('counts activity types by won/lost deals', () => {
    const result = computeActivityCorrelation(activities, oppOutcomes);
    const calls = result.find((r) => r.activityType === 'call');
    expect(calls).toBeDefined();
    expect(calls!.wonDeals).toBe(1);
    expect(calls!.lostDeals).toBe(1);
  });
});

// ─── Touch Patterns ──────────────────────────────

describe('computeTouchPatterns', () => {
  it('buckets touch counts correctly', () => {
    // opp1: 5 activities, opp2: 1 activity
    const activityCounts = new Map([['opp1', 5], ['opp2', 1]]);
    const outcomes = new Map([['opp1', 'won'], ['opp2', 'lost']]);
    const result = computeTouchPatterns(activityCounts, outcomes);
    const bucket1_2 = result.find((b) => b.touchCount === '1-2');
    expect(bucket1_2?.lostCount).toBe(1);
    const bucket3_5 = result.find((b) => b.touchCount === '3-5');
    expect(bucket3_5?.wonCount).toBe(1);
  });
});

// ─── Activity Heatmap ───────────────────────────────

describe('computeActivityHeatmap', () => {
  it('generates one entry per day for the trailing window', () => {
    const activities = [
      { occurred_at: '2026-03-04T10:00:00Z' },
      { occurred_at: '2026-03-04T14:00:00Z' },
      { occurred_at: '2026-03-05T09:00:00Z' },
    ];
    const now = new Date('2026-03-06T00:00:00Z');
    const result = computeActivityHeatmap(activities, 7, now);
    expect(result.length).toBe(7);
    const mar4 = result.find((d) => d.date === '2026-03-04');
    expect(mar4?.count).toBe(2);
    const mar5 = result.find((d) => d.date === '2026-03-05');
    expect(mar5?.count).toBe(1);
    const mar01 = result.find((d) => d.date === '2026-03-01');
    expect(mar01?.count).toBe(0);
  });
});

// ─── Cold Clients ────────────────────────────────

describe('computeColdClients', () => {
  it('identifies clients with no recent activity', () => {
    const clients = [
      { id: 'c1', name: 'Client A', status: 'active' },
      { id: 'c2', name: 'Client B', status: 'active' },
    ];
    const lastActivity = new Map([['c1', '2026-01-01']]); // 64 days ago
    const pipelineValues = new Map([['c1', 5000]]);
    const now = new Date('2026-03-06');
    const result = computeColdClients(clients, lastActivity, pipelineValues, now);
    expect(result.length).toBe(2);
    expect(result[0].daysSinceActivity).toBeGreaterThan(60);
  });
});

// ─── At-Risk Deals ───────────────────────────────

describe('computeAtRiskDeals', () => {
  it('flags deals with no recent activity', () => {
    const opps = [{
      id: 'opp1',
      name: 'Big Deal',
      client_name: 'Client A',
      stage: 'proposal',
      value_cents: 50000,
      expected_close_date: '2026-04-01',
    }];
    const lastActivity = new Map<string, string>(); // no activity at all
    const now = new Date('2026-03-06');
    const result = computeAtRiskDeals(opps, lastActivity, now);
    expect(result.length).toBe(1);
    expect(result[0].reasons).toContain('no_recent_activity');
  });
  it('flags deals past expected close date', () => {
    const opps = [{
      id: 'opp1',
      name: 'Late Deal',
      client_name: 'Client B',
      stage: 'negotiation',
      value_cents: 30000,
      expected_close_date: '2026-02-01', // past
    }];
    const lastActivity = new Map([['opp1', '2026-03-05']]);
    const now = new Date('2026-03-06');
    const result = computeAtRiskDeals(opps, lastActivity, now);
    expect(result[0].reasons).toContain('past_expected_close');
  });
});

// ─── Recommendations ────────────────────────────────

describe('computeRecommendations', () => {
  it('generates follow_up recs for cold active clients', () => {
    const coldClients = [
      { id: 'c1', name: 'Client A', daysSinceActivity: 20, pipelineValueCents: 5000, status: 'active' },
    ];
    const atRiskDeals = [
      {
        id: 'opp1', name: 'Deal A', clientName: 'Client A',
        stage: 'proposal', valueCents: 10000,
        reasons: ['past_expected_close' as const],
        daysSinceActivity: 20, expectedCloseDate: '2026-02-01',
      },
    ];
    const result = computeRecommendations(atRiskDeals, coldClients, 5);
    const followUp = result.find((r) => r.type === 'follow_up');
    expect(followUp).toBeDefined();
    expect(followUp!.title).toContain('Client A');
    const updateDeal = result.find((r) => r.type === 'update_deal');
    expect(updateDeal).toBeDefined();
    const insight = result.find((r) => r.type === 'pattern_insight');
    expect(insight).toBeDefined();
    expect(insight!.title).toContain('5');
  });
});

// ─── Communication Scores ────────────────────────

describe('computeCommunicationScores', () => {
  it('calculates composite score from sub-scores', () => {
    const clients = [{ id: 'c1', name: 'Client A' }];
    const emailActivity = new Map([['c1', { inbound: 10, outbound: 8 }]]);
    const meetingCounts = new Map([['c1', 5]]);
    const lastActivity = new Map([['c1', '2026-03-05']]);
    const now = new Date('2026-03-06');
    const result = computeCommunicationScores(clients, emailActivity, meetingCounts, lastActivity, now);
    expect(result.length).toBe(1);
    expect(result[0].compositeScore).toBeGreaterThan(0);
    expect(result[0].compositeScore).toBeLessThanOrEqual(100);
  });
});
