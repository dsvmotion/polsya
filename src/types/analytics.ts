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
