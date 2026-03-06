# Phase 5A: Advanced Analytics & Insights — Design Document

## Date: 2026-03-06
## Status: Approved
## Author: AI Assistant + Diego

---

## Overview

Build an Analytics Hub within the Creative workspace that transforms raw CRM data into actionable intelligence. Five dedicated pages cover executive overview, pipeline analytics, activity patterns, communication metrics, and AI-powered recommendations.

## Approach

**Chosen: Analytics Hub** — New `/creative/analytics` section with sub-pages.

Rejected alternatives:
- "Page Overhaul" — Replacing CreativeReports with a richer page. Too cramped, violates single-responsibility.
- "Widget System" — Drag-and-drop configurable dashboards. Overengineered for current stage (YAGNI).

## Key Constraint

**Zero new database tables.** All analytics are computed from existing tables:
- `creative_opportunities` → pipeline, conversion, forecasting
- `creative_activities` → activity analytics, touch patterns
- `creative_emails` → email engagement metrics
- `creative_calendar_events` → calendar/meeting metrics
- `creative_clients` → client health scoring

**Zero new dependencies.** Recharts, React Query, shadcn/ui, and Supabase client are all already installed.

---

## Pages

### 1. Overview (`/creative/analytics`)

Executive dashboard — top-line KPIs, trends, quick AI insights.

**KPI Row** (4 cards with sparkline trends + period comparison):
- Total Pipeline Value (vs. prior period)
- Weighted Forecast (next 30/60/90 days)
- Win Rate (trend line)
- Avg Deal Velocity (days lead → won)

**Charts**:
- Revenue Trend: AreaChart — monthly revenue with prior period overlay
- Pipeline Health: Stacked BarChart — healthy / at-risk / stale deals
- Activity Volume: BarChart — daily activity counts by type (calls, emails, meetings)

**Quick Insights Panel** (right column):
- AI-generated bullet points highlighting top movers, risks, opportunities
- Deep-links to detailed analytics pages

**Controls**: Time range selector (7d / 30d / 90d / 365d / all) + period comparison toggle.

### 2. Pipeline Analytics (`/creative/analytics/pipeline`)

Deep dive into sales pipeline mechanics.

**Conversion Funnel**: Visual funnel (lead → qualified → proposal → negotiation → won)
- Per stage: count, total value, conversion rate to next stage, avg days in stage

**Revenue Forecast**: LineChart with 3 projection lines:
- Optimistic: sum of all open deal values
- Weighted: value × probability
- Conservative: only deals with >70% probability

**Deal Aging**: Scatter plot of deal age (days) vs value (€), color-coded by stage, highlighting stale deals (>2× avg velocity).

**Stage Velocity**: Horizontal BarChart — avg days per stage, benchmarked against 90-day historical average.

### 3. Activity Analytics (`/creative/analytics/activity`)

Understand how activities translate to outcomes.

**Activity-to-Outcome Correlation**: Grouped BarChart comparing activity type distribution between won vs lost deals.

**Touch Patterns**: Histogram showing distribution of total activity count before deal closure, split by outcome (won/lost).

**Activity Heatmap**: GitHub-contribution-style calendar heatmap showing daily activity volume over trailing 90 days.

**Cold Clients Table**: DataTable of clients sorted by days since last activity, with columns: client, last activity date, pipeline value, risk indicator.

### 4. Communication Analytics (`/creative/analytics/communication`)

Leverage Phase 4B email/calendar data for engagement intelligence.

**Email Metrics**:
- Avg response time distribution (histogram)
- Inbound/outbound ratio per client (BarChart)
- Thread depth analysis (avg replies per conversation)

**Calendar Metrics**:
- Weekly meeting density (AreaChart)
- Meeting-to-deal correlation (grouped BarChart: deals with meetings vs without)
- Client face-time distribution (horizontal BarChart of meeting hours per client)

**Communication Score**: Composite metric per client: email responsiveness (40%) + meeting frequency (30%) + activity recency (30%). Displayed as a ranked table with color-coded scores.

### 5. AI Insights (`/creative/analytics/insights`)

Rule-based intelligence (no ML required).

**At-Risk Deals** (auto-detected):
- No activity in >14 days on open deal
- Past expected close date and still open
- Probability dropped (if user edits it down)
- No email/meeting in >21 days for proposal+ stage

**Recommendations** (pattern-based):
- "Client X has no activity in N days — schedule follow-up"
- "Deal Y is N days past expected close — update or mark lost"
- "Pattern: deals with ≥3 meetings close 2.1× faster — prioritize face-time for Deal Z"
- "Top 3 stale deals worth €X — review pipeline hygiene"

**Weekly Digest Preview**: Renders the same output the `ai-weekly-digest` cron job would produce, so users can preview it in-app.

---

## Data Architecture

### New Hooks

| Hook | Source Tables | Returns |
|------|-------------|---------|
| `useAnalyticsOverview` | opportunities, activities, clients | KPIs with period comparison, sparkline data |
| `usePipelineAnalytics` | opportunities, activities | funnel data, forecast lines, velocity metrics, deal aging |
| `useActivityAnalytics` | activities, opportunities, clients | correlation data, touch patterns, heatmap, cold clients |
| `useCommunicationAnalytics` | emails, calendar_events, clients | email metrics, calendar metrics, communication scores |
| `useAIInsights` | opportunities, activities, emails, calendar_events | at-risk deals, recommendations, digest preview |

### New Service

`analyticsService.ts` — Pure computation functions:
- `computePeriodComparison(current, previous)` — delta + percentage change
- `computeConversionFunnel(opportunities)` — stage counts, rates, value
- `computeRevenueForecast(opportunities)` — 3-line projection
- `computeStageVelocity(opportunities, activities)` — avg days per stage
- `computeActivityCorrelation(activities, opportunities)` — win/loss activity profiles
- `computeTouchPatterns(activities, opportunities)` — pre-close activity distribution
- `computeEmailMetrics(emails)` — response times, ratios, thread depth
- `computeCalendarMetrics(calendarEvents)` — density, client distribution
- `computeCommunicationScore(emails, calendarEvents, activities)` — composite 0-100
- `computeAtRiskDeals(opportunities, activities, emails)` — flagged deals
- `computeRecommendations(opportunities, activities, emails, calendarEvents)` — actionable suggestions

### Query Pattern

```
AnalyticsPage Component
    ↓
useXxxAnalytics() hook (React Query, staleTime: 120s)
    ↓
Supabase queries (org-scoped via RLS)
    ↓
analyticsService.computeXxx() (pure functions, in-memory)
    ↓
Typed result → Recharts / Cards / Tables
```

---

## Subscription Gating

| Feature | Starter (€29) | Pro (€79) | Enterprise (€149+) |
|---------|---------------|-----------|---------------------|
| Overview KPIs + trends | ✅ | ✅ | ✅ |
| Pipeline conversion funnel | ✅ Basic | ✅ Full | ✅ Full |
| Revenue forecasting | — | ✅ | ✅ |
| Activity analytics | — | ✅ | ✅ |
| Communication analytics | — | ✅ | ✅ |
| AI Insights (at-risk) | — | ✅ Basic | ✅ Full |
| AI Recommendations | — | — | ✅ |
| CSV/PDF Export | — | — | ✅ |

Enforcement: Check `subscription.plan_code` in each analytics hook and return partial data or `{ gated: true }` for restricted features.

---

## Navigation

Add to `CreativeSidebar.tsx` main nav (after Reports):

```
Analytics  →  /creative/analytics
  ├── Overview     /creative/analytics
  ├── Pipeline     /creative/analytics/pipeline
  ├── Activity     /creative/analytics/activity
  ├── Communication /creative/analytics/communication
  └── AI Insights  /creative/analytics/insights
```

Existing `/creative/reports` page remains unchanged.

---

## UI Patterns

All pages use:
- `WorkspaceContainer` for page structure (title, description, action buttons)
- `Card` from shadcn/ui for KPI cards and chart containers
- `Tabs` for sub-navigation where needed
- `Select` for time range filtering (7d / 30d / 90d / 365d / all)
- `ResponsiveContainer` from Recharts wrapping all charts
- `ChartContainer` from `@/components/ui/chart` for themed charts
- Dark mode support via CSS variables (already configured)

---

## File Structure

```
src/
├── pages/creative/analytics/
│   ├── AnalyticsOverview.tsx
│   ├── PipelineAnalytics.tsx
│   ├── ActivityAnalytics.tsx
│   ├── CommunicationAnalytics.tsx
│   └── AIInsights.tsx
├── components/creative/analytics/
│   ├── KpiCard.tsx              (reusable KPI card with sparkline)
│   ├── ConversionFunnel.tsx     (visual funnel component)
│   ├── ForecastChart.tsx        (3-line projection chart)
│   ├── ActivityHeatmap.tsx      (GitHub-style calendar heatmap)
│   ├── CommunicationScore.tsx   (scored client table)
│   ├── RiskBadge.tsx            (at-risk indicator)
│   ├── InsightCard.tsx          (AI recommendation card)
│   └── PeriodComparison.tsx     (delta display component)
├── hooks/
│   ├── useAnalyticsOverview.ts
│   ├── usePipelineAnalytics.ts
│   ├── useActivityAnalytics.ts
│   ├── useCommunicationAnalytics.ts
│   └── useAIInsights.ts
├── services/
│   └── analyticsService.ts
└── types/
    └── analytics.ts
```

---

## Testing Strategy

- Unit tests for all `analyticsService.ts` pure functions (no mocking needed)
- Hook tests with React Query test utilities
- Component tests for custom chart components (KpiCard, ConversionFunnel, etc.)
- Integration test: full page render with mock data

---

## Definition of Done

- [ ] All 5 analytics pages render with real data
- [ ] Time range filtering works across all pages
- [ ] Period comparison (vs prior period) on Overview KPIs
- [ ] Subscription gating enforced per plan tier
- [ ] Navigation updated in CreativeSidebar
- [ ] Routes registered in App.tsx
- [ ] Dark mode renders correctly
- [ ] Tests pass (typecheck, lint, unit, build)
- [ ] No new dependencies added
- [ ] Responsive on desktop (mobile optimization deferred to Phase 5D)
