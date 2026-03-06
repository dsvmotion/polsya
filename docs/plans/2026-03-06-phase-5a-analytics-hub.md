# Phase 5A: Analytics Hub — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a 5-page Analytics Hub at `/creative/analytics/*` with pipeline forecasting, activity correlation, communication scoring, and AI-powered recommendations — all computed from existing CRM data with zero new database tables or dependencies.

**Architecture:** React pages → React Query hooks → pure analyticsService functions → Supabase client. All computation is in-memory on data already fetched by existing hooks. Follows established patterns from `CreativeReports.tsx` + `useCreativeReports.ts`.

**Tech Stack:** React 18, TypeScript, Recharts (installed), React Query v5 (installed), shadcn/ui (installed), Supabase JS client (installed).

---

## Task 1: Analytics Types

**Files:**
- Create: `src/types/analytics.ts`

**Step 1: Create the analytics type definitions**

```typescript
// src/types/analytics.ts
// Type definitions for the Analytics Hub.
// All analytics are computed in-memory from existing CRM tables.

export type TimeRange = '7d' | '30d' | '90d' | '365d' | 'all';

// ─── Overview ────────────────────────────────

export interface KpiWithTrend {
  current: number;
  previous: number;
  delta: number;       // current - previous
  deltaPercent: number; // ((current - previous) / previous) * 100
  sparkline: number[]; // last N data points for mini chart
}

export interface AnalyticsOverviewData {
  pipelineValue: KpiWithTrend;
  weightedForecast: KpiWithTrend;
  winRate: KpiWithTrend;
  avgDealVelocityDays: KpiWithTrend;
  revenueByMonth: { month: string; current: number; previous: number }[];
  pipelineHealth: { label: string; value: number; color: string }[];
  activityByDay: { date: string; calls: number; emails: number; meetings: number; notes: number; tasks: number }[];
}

// ─── Pipeline ────────────────────────────────

export interface FunnelStage {
  stage: string;
  label: string;
  count: number;
  valueCents: number;
  conversionRate: number; // rate to NEXT stage
  avgDaysInStage: number;
}

export interface ForecastLine {
  month: string;
  optimistic: number;
  weighted: number;
  conservative: number;
}

export interface DealAgingPoint {
  id: string;
  name: string;
  stage: string;
  valueCents: number;
  ageDays: number;
  isStale: boolean;
}

export interface StageVelocity {
  stage: string;
  label: string;
  avgDays: number;
  benchmarkDays: number;
}

export interface PipelineAnalyticsData {
  funnel: FunnelStage[];
  forecast: ForecastLine[];
  dealAging: DealAgingPoint[];
  stageVelocity: StageVelocity[];
}

// ─── Activity ────────────────────────────────

export interface ActivityCorrelation {
  activityType: string;
  wonDeals: number;
  lostDeals: number;
}

export interface TouchPatternBucket {
  touchCount: string; // e.g. "1-2", "3-5", "6-10", "11+"
  wonCount: number;
  lostCount: number;
}

export interface ActivityHeatmapDay {
  date: string;    // YYYY-MM-DD
  count: number;
}

export interface ColdClient {
  id: string;
  name: string;
  daysSinceActivity: number;
  pipelineValueCents: number;
  status: string;
}

export interface ActivityAnalyticsData {
  correlation: ActivityCorrelation[];
  touchPatterns: TouchPatternBucket[];
  heatmap: ActivityHeatmapDay[];
  coldClients: ColdClient[];
}

// ─── Communication ───────────────────────────

export interface EmailMetrics {
  avgResponseTimeMinutes: number;
  inboundCount: number;
  outboundCount: number;
  avgThreadDepth: number;
  byClient: { clientName: string; inbound: number; outbound: number }[];
}

export interface CalendarMetrics {
  meetingsPerWeek: { week: string; count: number }[];
  dealsWithMeetings: { label: string; count: number }[];
  clientFaceTime: { clientName: string; totalMinutes: number }[];
}

export interface CommunicationScoreEntry {
  clientId: string;
  clientName: string;
  emailScore: number;    // 0-100
  calendarScore: number; // 0-100
  activityScore: number; // 0-100
  compositeScore: number; // weighted average
}

export interface CommunicationAnalyticsData {
  emailMetrics: EmailMetrics;
  calendarMetrics: CalendarMetrics;
  communicationScores: CommunicationScoreEntry[];
}

// ─── AI Insights ─────────────────────────────

export type RiskReason =
  | 'no_recent_activity'
  | 'past_expected_close'
  | 'no_communication'
  | 'stale_deal';

export interface AtRiskDeal {
  id: string;
  name: string;
  clientName: string;
  stage: string;
  valueCents: number;
  reasons: RiskReason[];
  daysSinceActivity: number;
  expectedCloseDate: string | null;
}

export interface Recommendation {
  id: string;
  type: 'follow_up' | 'update_deal' | 'pattern_insight' | 'hygiene';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  entityId?: string;
  entityType?: string;
}

export interface AIInsightsData {
  atRiskDeals: AtRiskDeal[];
  recommendations: Recommendation[];
}
```

**Step 2: Commit**

```bash
git add src/types/analytics.ts
git commit -m "feat(analytics): add Phase 5A analytics type definitions"
```

---

## Task 2: Analytics Service — Pure Computation Functions

**Files:**
- Create: `src/services/analyticsService.ts`
- Create: `src/services/__tests__/analyticsService.test.ts`

**Step 1: Write failing tests for core computation functions**

```typescript
// src/services/__tests__/analyticsService.test.ts
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
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/services/__tests__/analyticsService.test.ts`
Expected: FAIL — module not found

**Step 3: Implement analyticsService.ts**

```typescript
// src/services/analyticsService.ts
// Pure computation functions for the Analytics Hub.
// No side effects, no Supabase calls — just data transformation.

import type {
  TimeRange,
  KpiWithTrend,
  FunnelStage,
  ForecastLine,
  ActivityCorrelation,
  TouchPatternBucket,
  ActivityHeatmapDay,
  ColdClient,
  AtRiskDeal,
  RiskReason,
  Recommendation,
  CommunicationScoreEntry,
} from '@/types/analytics';
import { OPPORTUNITY_STAGE_LABELS } from '@/types/creative';
import type { OpportunityStage } from '@/types/creative';

// ─── Helpers ──────────────────────────────────

export function getCutoffDate(timeRange: TimeRange, now: Date = new Date()): Date | null {
  if (timeRange === 'all') return null;
  const days = parseInt(timeRange);
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  return cutoff;
}

export function getDaysAgo(isoDate: string, now: Date = new Date()): number {
  return Math.round((now.getTime() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Period Comparison ────────────────────────

export function computePeriodComparison(
  current: number,
  previous: number,
  sparkline: number[] = [],
): KpiWithTrend {
  const delta = current - previous;
  const deltaPercent = previous !== 0 ? Math.round((delta / previous) * 100) : 0;
  return { current, previous, delta, deltaPercent, sparkline };
}

// ─── Conversion Funnel ────────────────────────

const FUNNEL_STAGES: OpportunityStage[] = ['lead', 'qualified', 'proposal', 'negotiation', 'won'];

interface OppForFunnel {
  stage: string;
  value_cents: number;
  created_at: string;
}

interface ActivityForVelocity {
  entity_id: string;
  activity_type: string;
  occurred_at?: string;
}

export function computeConversionFunnel(
  opps: readonly OppForFunnel[],
  _activities: readonly ActivityForVelocity[],
): FunnelStage[] {
  const stageCounts = new Map<string, { count: number; valueCents: number }>();

  for (const o of opps) {
    const existing = stageCounts.get(o.stage) ?? { count: 0, valueCents: 0 };
    existing.count += 1;
    existing.valueCents += o.value_cents ?? 0;
    stageCounts.set(o.stage, existing);
  }

  return FUNNEL_STAGES.map((stage, idx) => {
    const data = stageCounts.get(stage) ?? { count: 0, valueCents: 0 };
    const nextStage = FUNNEL_STAGES[idx + 1];
    const nextCount = nextStage ? (stageCounts.get(nextStage)?.count ?? 0) : 0;
    const conversionRate = data.count > 0 ? Math.round((nextCount / data.count) * 100) : 0;
    return {
      stage,
      label: OPPORTUNITY_STAGE_LABELS[stage] ?? stage,
      count: data.count,
      valueCents: data.valueCents,
      conversionRate,
      avgDaysInStage: 0, // computed separately when activity data available
    };
  });
}

// ─── Revenue Forecast ─────────────────────────

interface OppForForecast {
  stage: string;
  value_cents: number;
  probability: number;
  expected_close_date: string | null;
}

export function computeRevenueForecast(opps: readonly OppForForecast[]): ForecastLine[] {
  const openStages = new Set(['lead', 'qualified', 'proposal', 'negotiation']);
  const openOpps = opps.filter((o) => openStages.has(o.stage) && o.expected_close_date);

  const monthMap = new Map<string, { optimistic: number; weighted: number; conservative: number }>();

  for (const o of openOpps) {
    const d = new Date(o.expected_close_date!);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const existing = monthMap.get(key) ?? { optimistic: 0, weighted: 0, conservative: 0 };
    const valueDollars = Math.round(o.value_cents / 100);
    existing.optimistic += valueDollars;
    existing.weighted += Math.round((o.value_cents * o.probability) / 10000);
    if (o.probability >= 70) {
      existing.conservative += valueDollars;
    }
    monthMap.set(key, existing);
  }

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));
}

// ─── Activity Correlation ─────────────────────

interface ActivityForCorrelation {
  entity_id: string;
  activity_type: string;
}

export function computeActivityCorrelation(
  activities: readonly ActivityForCorrelation[],
  oppOutcomes: ReadonlyMap<string, string>, // opp_id -> 'won' | 'lost'
): ActivityCorrelation[] {
  const typeMap = new Map<string, { wonDeals: Set<string>; lostDeals: Set<string> }>();

  for (const a of activities) {
    const outcome = oppOutcomes.get(a.entity_id);
    if (!outcome || (outcome !== 'won' && outcome !== 'lost')) continue;

    const existing = typeMap.get(a.activity_type) ?? { wonDeals: new Set(), lostDeals: new Set() };
    if (outcome === 'won') existing.wonDeals.add(a.entity_id);
    else existing.lostDeals.add(a.entity_id);
    typeMap.set(a.activity_type, existing);
  }

  return Array.from(typeMap.entries()).map(([activityType, data]) => ({
    activityType,
    wonDeals: data.wonDeals.size,
    lostDeals: data.lostDeals.size,
  }));
}

// ─── Touch Patterns ───────────────────────────

export function computeTouchPatterns(
  activityCounts: ReadonlyMap<string, number>, // opp_id -> total activities
  outcomes: ReadonlyMap<string, string>,        // opp_id -> 'won' | 'lost'
): TouchPatternBucket[] {
  const buckets: { label: string; min: number; max: number; won: number; lost: number }[] = [
    { label: '0', min: 0, max: 0, won: 0, lost: 0 },
    { label: '1-2', min: 1, max: 2, won: 0, lost: 0 },
    { label: '3-5', min: 3, max: 5, won: 0, lost: 0 },
    { label: '6-10', min: 6, max: 10, won: 0, lost: 0 },
    { label: '11+', min: 11, max: Infinity, won: 0, lost: 0 },
  ];

  for (const [oppId, count] of activityCounts) {
    const outcome = outcomes.get(oppId);
    if (!outcome || (outcome !== 'won' && outcome !== 'lost')) continue;
    const bucket = buckets.find((b) => count >= b.min && count <= b.max);
    if (bucket) {
      if (outcome === 'won') bucket.won++;
      else bucket.lost++;
    }
  }

  return buckets.map((b) => ({
    touchCount: b.label,
    wonCount: b.won,
    lostCount: b.lost,
  }));
}

// ─── Activity Heatmap ─────────────────────────

interface ActivityForHeatmap {
  occurred_at: string;
}

export function computeActivityHeatmap(
  activities: readonly ActivityForHeatmap[],
  days: number = 90,
  now: Date = new Date(),
): ActivityHeatmapDay[] {
  const countMap = new Map<string, number>();
  for (const a of activities) {
    const key = a.occurred_at.slice(0, 10); // YYYY-MM-DD
    countMap.set(key, (countMap.get(key) ?? 0) + 1);
  }

  const result: ActivityHeatmapDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, count: countMap.get(key) ?? 0 });
  }
  return result;
}

// ─── Cold Clients ─────────────────────────────

interface ClientForCold {
  id: string;
  name: string;
  status: string;
}

export function computeColdClients(
  clients: readonly ClientForCold[],
  lastActivityDate: ReadonlyMap<string, string>, // client_id -> ISO date
  pipelineValues: ReadonlyMap<string, number>,   // client_id -> cents
  now: Date = new Date(),
): ColdClient[] {
  return clients
    .map((c) => {
      const lastDate = lastActivityDate.get(c.id);
      const daysSince = lastDate ? getDaysAgo(lastDate, now) : 9999;
      return {
        id: c.id,
        name: c.name,
        daysSinceActivity: daysSince,
        pipelineValueCents: pipelineValues.get(c.id) ?? 0,
        status: c.status,
      };
    })
    .sort((a, b) => b.daysSinceActivity - a.daysSinceActivity);
}

// ─── At-Risk Deals ────────────────────────────

const ACTIVITY_STALE_DAYS = 14;
const COMMUNICATION_STALE_DAYS = 21;

interface OppForRisk {
  id: string;
  name: string;
  client_name: string;
  stage: string;
  value_cents: number;
  expected_close_date: string | null;
}

export function computeAtRiskDeals(
  opps: readonly OppForRisk[],
  lastActivityDate: ReadonlyMap<string, string>,
  now: Date = new Date(),
): AtRiskDeal[] {
  const openStages = new Set(['lead', 'qualified', 'proposal', 'negotiation']);

  return opps
    .filter((o) => openStages.has(o.stage))
    .map((o) => {
      const reasons: RiskReason[] = [];
      const lastDate = lastActivityDate.get(o.id);
      const daysSince = lastDate ? getDaysAgo(lastDate, now) : 9999;

      if (daysSince > ACTIVITY_STALE_DAYS) reasons.push('no_recent_activity');
      if (o.expected_close_date && new Date(o.expected_close_date) < now) reasons.push('past_expected_close');
      if (daysSince > COMMUNICATION_STALE_DAYS && ['proposal', 'negotiation'].includes(o.stage)) {
        reasons.push('no_communication');
      }

      return {
        id: o.id,
        name: o.name,
        clientName: o.client_name,
        stage: o.stage,
        valueCents: o.value_cents,
        reasons,
        daysSinceActivity: daysSince,
        expectedCloseDate: o.expected_close_date,
      };
    })
    .filter((d) => d.reasons.length > 0)
    .sort((a, b) => b.valueCents - a.valueCents);
}

// ─── Recommendations ──────────────────────────

export function computeRecommendations(
  atRiskDeals: readonly AtRiskDeal[],
  coldClients: readonly ColdClient[],
  avgTouchesBeforeWin: number,
): Recommendation[] {
  const recs: Recommendation[] = [];
  let id = 0;

  // Follow-up recommendations for cold clients
  for (const c of coldClients.slice(0, 5)) {
    if (c.daysSinceActivity > 14 && c.status === 'active') {
      recs.push({
        id: String(++id),
        type: 'follow_up',
        priority: c.pipelineValueCents > 0 ? 'high' : 'medium',
        title: `Follow up with ${c.name}`,
        description: `No activity in ${c.daysSinceActivity} days. Schedule a check-in to maintain the relationship.`,
        entityId: c.id,
        entityType: 'client',
      });
    }
  }

  // Update deal recommendations
  for (const d of atRiskDeals.slice(0, 5)) {
    if (d.reasons.includes('past_expected_close')) {
      recs.push({
        id: String(++id),
        type: 'update_deal',
        priority: 'high',
        title: `Update "${d.name}" close date`,
        description: `This deal is past its expected close date. Update the timeline or mark as lost to keep pipeline accurate.`,
        entityId: d.id,
        entityType: 'opportunity',
      });
    }
  }

  // Pattern insights
  if (avgTouchesBeforeWin > 0) {
    recs.push({
      id: String(++id),
      type: 'pattern_insight',
      priority: 'low',
      title: `Winning deals average ${avgTouchesBeforeWin} touches`,
      description: `Deals that close successfully have an average of ${avgTouchesBeforeWin} activities before winning. Prioritize face-time for deals below this threshold.`,
    });
  }

  // Pipeline hygiene
  const staleCount = atRiskDeals.filter((d) => d.reasons.includes('no_recent_activity')).length;
  if (staleCount > 2) {
    recs.push({
      id: String(++id),
      type: 'hygiene',
      priority: 'medium',
      title: `${staleCount} stale deals need attention`,
      description: `You have ${staleCount} deals with no recent activity. Review and update or close them to maintain pipeline accuracy.`,
    });
  }

  return recs;
}

// ─── Communication Scores ─────────────────────

interface ClientForScore {
  id: string;
  name: string;
}

export function computeCommunicationScores(
  clients: readonly ClientForScore[],
  emailActivity: ReadonlyMap<string, { inbound: number; outbound: number }>,
  meetingCounts: ReadonlyMap<string, number>,
  lastActivityDate: ReadonlyMap<string, string>,
  now: Date = new Date(),
): CommunicationScoreEntry[] {
  return clients
    .map((c) => {
      // Email score: based on outbound volume (0-100)
      const email = emailActivity.get(c.id) ?? { inbound: 0, outbound: 0 };
      const emailScore = Math.min(100, (email.outbound + email.inbound) * 5);

      // Calendar score: based on meeting count (0-100)
      const meetings = meetingCounts.get(c.id) ?? 0;
      const calendarScore = Math.min(100, meetings * 20);

      // Activity score: based on recency (0-100)
      const lastDate = lastActivityDate.get(c.id);
      const daysSince = lastDate ? getDaysAgo(lastDate, now) : 9999;
      const activityScore = daysSince <= 7 ? 100 : daysSince <= 14 ? 80 : daysSince <= 30 ? 50 : daysSince <= 60 ? 20 : 0;

      // Composite: email 40%, calendar 30%, activity 30%
      const compositeScore = Math.round(emailScore * 0.4 + calendarScore * 0.3 + activityScore * 0.3);

      return { clientId: c.id, clientName: c.name, emailScore, calendarScore, activityScore, compositeScore };
    })
    .sort((a, b) => b.compositeScore - a.compositeScore);
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/services/__tests__/analyticsService.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/services/analyticsService.ts src/services/__tests__/analyticsService.test.ts
git commit -m "feat(analytics): add analyticsService with pure computation functions and tests"
```

---

## Task 3: Analytics Overview Hook

**Files:**
- Create: `src/hooks/useAnalyticsOverview.ts`

**Context:** Follow the exact pattern from `src/hooks/useCreativeReports.ts` — use `fromTable()`, `useCurrentOrganization()`, and `useQuery`.

**Step 1: Create the hook**

```typescript
// src/hooks/useAnalyticsOverview.ts
import { useQuery } from '@tanstack/react-query';
import { fromTable } from '@/integrations/supabase/helpers';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import {
  computePeriodComparison,
  getCutoffDate,
} from '@/services/analyticsService';
import type { TimeRange, AnalyticsOverviewData } from '@/types/analytics';

export function useAnalyticsOverview(timeRange: TimeRange) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<AnalyticsOverviewData>({
    queryKey: ['analytics-overview', orgId ?? '', timeRange],
    enabled: !!orgId,
    staleTime: 120_000, // 2 minutes
    queryFn: async () => {
      const cutoff = getCutoffDate(timeRange);
      const cutoffIso = cutoff?.toISOString() ?? null;

      // Compute the "previous period" cutoff for comparison
      const periodDays = timeRange === 'all' ? null : parseInt(timeRange);
      const previousCutoffIso = periodDays && cutoff
        ? new Date(cutoff.getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      // Fetch all data in parallel
      const [oppsRes, activitiesRes] = await Promise.all([
        fromTable('creative_opportunities')
          .select('id, stage, value_cents, probability, expected_close_date, created_at')
          .eq('organization_id', orgId!),
        fromTable('creative_activities')
          .select('activity_type, occurred_at, entity_id')
          .eq('organization_id', orgId!)
          .order('occurred_at', { ascending: false })
          .limit(1000),
      ]);

      const allOpps = (oppsRes.data ?? []) as {
        id: string; stage: string; value_cents: number; probability: number;
        expected_close_date: string | null; created_at: string;
      }[];
      const allActivities = (activitiesRes.data ?? []) as {
        activity_type: string; occurred_at: string; entity_id: string;
      }[];

      // Filter by time range
      const currentOpps = cutoffIso ? allOpps.filter((o) => o.created_at >= cutoffIso) : allOpps;
      const previousOpps = previousCutoffIso && cutoffIso
        ? allOpps.filter((o) => o.created_at >= previousCutoffIso && o.created_at < cutoffIso)
        : [];

      const openStages = new Set(['lead', 'qualified', 'proposal', 'negotiation']);

      // Pipeline value
      const currentPipeline = currentOpps.filter((o) => openStages.has(o.stage)).reduce((s, o) => s + (o.value_cents ?? 0) / 100, 0);
      const previousPipeline = previousOpps.filter((o) => openStages.has(o.stage)).reduce((s, o) => s + (o.value_cents ?? 0) / 100, 0);

      // Weighted forecast
      const currentWeighted = currentOpps.filter((o) => openStages.has(o.stage))
        .reduce((s, o) => s + ((o.value_cents ?? 0) * (o.probability ?? 0)) / 10000, 0);
      const previousWeighted = previousOpps.filter((o) => openStages.has(o.stage))
        .reduce((s, o) => s + ((o.value_cents ?? 0) * (o.probability ?? 0)) / 10000, 0);

      // Win rate
      const currentWon = currentOpps.filter((o) => o.stage === 'won').length;
      const currentLost = currentOpps.filter((o) => o.stage === 'lost').length;
      const currentWinRate = currentWon + currentLost > 0 ? Math.round((currentWon / (currentWon + currentLost)) * 100) : 0;
      const prevWon = previousOpps.filter((o) => o.stage === 'won').length;
      const prevLost = previousOpps.filter((o) => o.stage === 'lost').length;
      const prevWinRate = prevWon + prevLost > 0 ? Math.round((prevWon / (prevWon + prevLost)) * 100) : 0;

      // Revenue by month (for area chart)
      const revenueMap = new Map<string, { current: number; previous: number }>();
      for (const o of allOpps.filter((o) => o.stage === 'won')) {
        const d = new Date(o.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const existing = revenueMap.get(key) ?? { current: 0, previous: 0 };
        const isCurrentPeriod = !cutoffIso || o.created_at >= cutoffIso;
        if (isCurrentPeriod) existing.current += (o.value_cents ?? 0) / 100;
        else existing.previous += (o.value_cents ?? 0) / 100;
        revenueMap.set(key, existing);
      }
      const revenueByMonth = Array.from(revenueMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({ month, current: Math.round(data.current), previous: Math.round(data.previous) }));

      // Activity by day (for bar chart)
      const activityByDayMap = new Map<string, Record<string, number>>();
      for (const a of allActivities) {
        const day = a.occurred_at.slice(0, 10);
        const existing = activityByDayMap.get(day) ?? { calls: 0, emails: 0, meetings: 0, notes: 0, tasks: 0 };
        const type = a.activity_type as keyof typeof existing;
        if (type in existing) (existing[type] as number)++;
        activityByDayMap.set(day, existing);
      }
      const activityByDay = Array.from(activityByDayMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-30) // last 30 days
        .map(([date, data]) => ({ date, ...data }));

      // Pipeline health
      const healthyDeals = currentOpps.filter((o) => openStages.has(o.stage) && (o.probability ?? 0) >= 50).length;
      const staleDeals = currentOpps.filter((o) => openStages.has(o.stage) && (o.probability ?? 0) < 30).length;
      const atRiskDeals = currentOpps.filter((o) => openStages.has(o.stage)).length - healthyDeals - staleDeals;

      return {
        pipelineValue: computePeriodComparison(currentPipeline, previousPipeline),
        weightedForecast: computePeriodComparison(currentWeighted, previousWeighted),
        winRate: computePeriodComparison(currentWinRate, prevWinRate),
        avgDealVelocityDays: computePeriodComparison(0, 0), // placeholder — needs stage transition data
        revenueByMonth,
        pipelineHealth: [
          { label: 'Healthy', value: healthyDeals, color: 'hsl(142, 72%, 46%)' },
          { label: 'At Risk', value: atRiskDeals, color: 'hsl(38, 92%, 50%)' },
          { label: 'Stale', value: staleDeals, color: 'hsl(0, 84%, 60%)' },
        ],
        activityByDay,
      };
    },
  });
}
```

**Step 2: Commit**

```bash
git add src/hooks/useAnalyticsOverview.ts
git commit -m "feat(analytics): add useAnalyticsOverview hook with period comparison"
```

---

## Task 4: Pipeline, Activity, Communication, AI Insights Hooks

**Files:**
- Create: `src/hooks/usePipelineAnalytics.ts`
- Create: `src/hooks/useActivityAnalytics.ts`
- Create: `src/hooks/useCommunicationAnalytics.ts`
- Create: `src/hooks/useAIInsights.ts`

**Implementation:** Each hook follows the same pattern as `useAnalyticsOverview` — fetch from Supabase via `fromTable()`, compute via `analyticsService.*` pure functions, return typed result.

These hooks are independent and can be created in parallel. The code structure mirrors Task 3 exactly: `useQuery` with `staleTime: 120_000`, keyed by `[hook-name, orgId, timeRange]`, fetching from the relevant tables.

Key data sources per hook:
- `usePipelineAnalytics`: `creative_opportunities` + `creative_activities` (for velocity)
- `useActivityAnalytics`: `creative_activities` + `creative_opportunities` + `creative_clients`
- `useCommunicationAnalytics`: `creative_emails` + `creative_calendar_events` + `creative_clients`
- `useAIInsights`: all of the above combined

**Step 1: Create all 4 hooks** (detailed implementation follows pattern from Task 3)

**Step 2: Commit**

```bash
git add src/hooks/usePipelineAnalytics.ts src/hooks/useActivityAnalytics.ts src/hooks/useCommunicationAnalytics.ts src/hooks/useAIInsights.ts
git commit -m "feat(analytics): add pipeline, activity, communication, and AI insights hooks"
```

---

## Task 5: Reusable Analytics Components

**Files:**
- Create: `src/components/creative/analytics/KpiCardWithTrend.tsx`
- Create: `src/components/creative/analytics/ConversionFunnel.tsx`
- Create: `src/components/creative/analytics/ActivityHeatmap.tsx`
- Create: `src/components/creative/analytics/InsightCard.tsx`
- Create: `src/components/creative/analytics/EmptyState.tsx`
- Create: `src/components/creative/analytics/TimeRangeSelect.tsx`

**Context:** Follow UI patterns from `src/pages/creative/CreativeReports.tsx` — uses `Card/CardHeader/CardTitle/CardContent` from shadcn, `ResponsiveContainer` from Recharts, dark-mode-safe tooltip styles.

**Step 1: Build KpiCardWithTrend** — KPI card with value, delta percentage, and optional sparkline using Recharts `LineChart` (no axis, just the line).

**Step 2: Build ConversionFunnel** — Horizontal bar visualization showing pipeline stages with conversion rates between them.

**Step 3: Build ActivityHeatmap** — CSS grid of colored squares (90 days, 7 rows = weeks), styled with intensity colors.

**Step 4: Build InsightCard** — Card with priority badge, title, description, and optional action link.

**Step 5: Build EmptyState** — Reusable empty state with icon + message (extract pattern from `EmptyChart` in CreativeReports).

**Step 6: Build TimeRangeSelect** — Extract the time range `Select` component from CreativeReports into a shared component.

**Step 7: Commit**

```bash
git add src/components/creative/analytics/
git commit -m "feat(analytics): add reusable analytics components (KPI, funnel, heatmap, insight card)"
```

---

## Task 6: Analytics Overview Page

**Files:**
- Create: `src/pages/creative/analytics/AnalyticsOverview.tsx`

**Context:** Follow the exact structure of `src/pages/creative/CreativeReports.tsx` — `WorkspaceContainer` wrapper, time range select in `actions`, KPI cards grid, chart grid.

**Step 1: Build the overview page**

Page structure:
1. `WorkspaceContainer` with title "Analytics Overview", description, TimeRangeSelect in actions
2. 4x `KpiCardWithTrend` (Pipeline, Forecast, Win Rate, Velocity)
3. 2-column chart grid:
   - Revenue Trend (AreaChart with current/previous overlay)
   - Pipeline Health (BarChart — healthy/at-risk/stale)
   - Activity Volume (stacked BarChart — calls/emails/meetings by day)

**Step 2: Verify it renders** (manual check — `npm run dev`, navigate to `/creative/analytics`)

**Step 3: Commit**

```bash
git add src/pages/creative/analytics/AnalyticsOverview.tsx
git commit -m "feat(analytics): add Analytics Overview page with KPIs and charts"
```

---

## Task 7: Pipeline Analytics Page

**Files:**
- Create: `src/pages/creative/analytics/PipelineAnalytics.tsx`

**Step 1: Build the pipeline page**

Page structure:
1. `WorkspaceContainer` with title "Pipeline Analytics"
2. `ConversionFunnel` component (full width)
3. Revenue Forecast — LineChart with 3 lines (optimistic/weighted/conservative)
4. Deal Aging — scatter chart (age vs value, color by stage)
5. Stage Velocity — horizontal BarChart (avg days per stage vs benchmark)

**Step 2: Commit**

```bash
git add src/pages/creative/analytics/PipelineAnalytics.tsx
git commit -m "feat(analytics): add Pipeline Analytics page with funnel, forecast, and velocity"
```

---

## Task 8: Activity Analytics Page

**Files:**
- Create: `src/pages/creative/analytics/ActivityAnalytics.tsx`

**Step 1: Build the activity page**

Page structure:
1. `WorkspaceContainer` with title "Activity Analytics"
2. Activity-to-Outcome Correlation — grouped BarChart (won vs lost by activity type)
3. Touch Pattern Distribution — BarChart showing touch buckets
4. Activity Heatmap — `ActivityHeatmap` component (90-day calendar)
5. Cold Clients Table — data table with columns: Client, Days Since Activity, Pipeline Value, Status

**Step 2: Commit**

```bash
git add src/pages/creative/analytics/ActivityAnalytics.tsx
git commit -m "feat(analytics): add Activity Analytics page with correlation and heatmap"
```

---

## Task 9: Communication Analytics Page

**Files:**
- Create: `src/pages/creative/analytics/CommunicationAnalytics.tsx`

**Step 1: Build the communication page**

Page structure:
1. `WorkspaceContainer` with title "Communication Analytics"
2. Email Metrics — inbound/outbound ratio BarChart + response time display
3. Calendar Metrics — meetings per week AreaChart
4. Communication Scores Table — ranked table with color-coded composite scores

**Step 2: Commit**

```bash
git add src/pages/creative/analytics/CommunicationAnalytics.tsx
git commit -m "feat(analytics): add Communication Analytics page with email and calendar metrics"
```

---

## Task 10: AI Insights Page

**Files:**
- Create: `src/pages/creative/analytics/AIInsights.tsx`

**Step 1: Build the insights page**

Page structure:
1. `WorkspaceContainer` with title "AI Insights"
2. At-Risk Deals section — list of `InsightCard` components with risk badges
3. Recommendations section — list of `InsightCard` components with action buttons
4. Empty state when no insights available

**Step 2: Commit**

```bash
git add src/pages/creative/analytics/AIInsights.tsx
git commit -m "feat(analytics): add AI Insights page with at-risk deals and recommendations"
```

---

## Task 11: Routing + Navigation Integration

**Files:**
- Modify: `src/App.tsx` — add lazy imports + routes under `/creative/analytics/*`
- Modify: `src/components/creative/layout/CreativeSidebar.tsx` — add Analytics nav item with `TrendingUp` icon

**Step 1: Add lazy imports to App.tsx** (after line 69, the CreativeCalendar import)

```typescript
// Analytics Hub (Phase 5A)
const AnalyticsOverview = lazy(() => import("./pages/creative/analytics/AnalyticsOverview"));
const PipelineAnalytics = lazy(() => import("./pages/creative/analytics/PipelineAnalytics"));
const ActivityAnalytics = lazy(() => import("./pages/creative/analytics/ActivityAnalytics"));
const CommunicationAnalytics = lazy(() => import("./pages/creative/analytics/CommunicationAnalytics"));
const AIInsights = lazy(() => import("./pages/creative/analytics/AIInsights"));
```

**Step 2: Add routes** (after the `calendar` route on line 184)

```tsx
{/* Analytics Hub */}
<Route path="analytics" element={<AnalyticsOverview />} />
<Route path="analytics/pipeline" element={<PipelineAnalytics />} />
<Route path="analytics/activity" element={<ActivityAnalytics />} />
<Route path="analytics/communication" element={<CommunicationAnalytics />} />
<Route path="analytics/insights" element={<AIInsights />} />
```

**Step 3: Add nav item to CreativeSidebar.tsx** (in `mainNavItems` array, after Reports line 48)

```typescript
{ label: 'Analytics', icon: TrendingUp, path: '/creative/analytics' },
```

Import `TrendingUp` is already imported on line 6.

**Step 4: Fix isActive logic** — the current `isActive` function checks `startsWith(path)`, which means `/creative/analytics` would also match the Dashboard (`/creative`). The existing logic on line 82 already handles this:
```typescript
if (path === '/creative') return location.pathname === '/creative';
return location.pathname.startsWith(path);
```
This works correctly — `/creative/analytics` starts with `/creative/analytics`, not with `/creative` (exact match check).

**Step 5: Commit**

```bash
git add src/App.tsx src/components/creative/layout/CreativeSidebar.tsx
git commit -m "feat(analytics): add routing and navigation for Analytics Hub"
```

---

## Task 12: TypeCheck, Lint, Build, Tests

**Step 1: Run typecheck**

```bash
npx tsc --noEmit
```
Expected: No errors. Fix any type issues.

**Step 2: Run lint**

```bash
npx eslint src/types/analytics.ts src/services/analyticsService.ts src/hooks/useAnalyticsOverview.ts src/hooks/usePipelineAnalytics.ts src/hooks/useActivityAnalytics.ts src/hooks/useCommunicationAnalytics.ts src/hooks/useAIInsights.ts src/pages/creative/analytics/ src/components/creative/analytics/ --fix
```

**Step 3: Run unit tests**

```bash
npx vitest run
```
Expected: All tests pass (existing 402 + new analytics tests).

**Step 4: Run production build**

```bash
npx vite build
```
Expected: Build succeeds with no errors.

**Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(analytics): address typecheck, lint, and build issues"
```

---

## Task Summary

| # | Task | Files | Independent? |
|---|------|-------|-------------|
| 1 | Analytics types | 1 new | Yes |
| 2 | Analytics service + tests | 2 new | Depends on 1 |
| 3 | Overview hook | 1 new | Depends on 1, 2 |
| 4 | Pipeline/Activity/Communication/AI hooks | 4 new | Depends on 1, 2 |
| 5 | Reusable components | 6 new | Depends on 1 |
| 6 | Overview page | 1 new | Depends on 3, 5 |
| 7 | Pipeline page | 1 new | Depends on 4, 5 |
| 8 | Activity page | 1 new | Depends on 4, 5 |
| 9 | Communication page | 1 new | Depends on 4, 5 |
| 10 | AI Insights page | 1 new | Depends on 4, 5 |
| 11 | Routing + Navigation | 2 modified | Depends on 6-10 |
| 12 | Typecheck, lint, build, tests | 0 | Depends on all |

**Parallelization opportunities:**
- Tasks 3 + 4 + 5 can run in parallel (after 1 + 2)
- Tasks 6 + 7 + 8 + 9 + 10 can run in parallel (after 3-5)

**Total new files:** ~20
**Total modified files:** 2 (App.tsx, CreativeSidebar.tsx)
**New dependencies:** 0
**New database tables:** 0
