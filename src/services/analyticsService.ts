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
