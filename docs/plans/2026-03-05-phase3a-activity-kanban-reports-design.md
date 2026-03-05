# Phase 3A Design: Activity Timeline + Kanban Board + Creative Reports

**Date:** 2026-03-05
**Status:** Approved

---

## 1. Activity/Timeline System

Track interactions (calls, emails, meetings, notes, tasks) against any creative entity.

### Database

New `creative_activities` table:
- `id` (uuid PK), `organization_id` (FK), `entity_type` (text), `entity_id` (uuid)
- `activity_type`: `call`, `email`, `meeting`, `note`, `task`
- `title` (text), `description` (text), `occurred_at` (timestamptz), `duration_minutes` (int), `outcome` (text)
- `created_at`, `updated_at`, `created_by` (uuid)
- RLS via `organization_id` through `organization_members` (same pattern as all creative tables)

### Types

`src/types/creative-activity.ts`:
- `ACTIVITY_TYPES` const array + `ActivityType` union
- `Activity` interface with camelCase fields
- Labels, colors, and icons per activity type

### Hook

`src/hooks/useCreativeActivities.ts`:
- `useCreativeActivities(entityType, entityId)` — fetches activities for a specific entity, ordered by `occurred_at desc`
- `useRecentActivities(limit)` — fetches latest N activities across all entities (for dashboard)
- `useCreateActivity` / `useUpdateActivity` / `useDeleteActivity` mutations

### Components

- `ActivityTimeline.tsx` — chronological list with icons per type (Phone, Mail, Users, FileText, CheckSquare), relative timestamps, expandable descriptions
- `ActivityFormSheet.tsx` — create/edit sheet with date picker, type select, duration, outcome

### Wiring

- Add `CollapsibleEngineSection` for Activities in `ClientDetail`, `ContactDetail`, `ProjectDetail`, `OpportunityDetail`
- Dashboard: use `useRecentActivities` for the "Recent Activity" card, falling back to recent signals when no activities exist

---

## 2. Kanban Board View

Drag-and-drop board view for Opportunities (by stage) and Projects (by status).

### ViewMode Extension

Add `'board'` to the `viewModes` array in `src/lib/design-tokens.ts`. Add board icon (Columns3) to `ViewSwitcher.tsx`.

### Generic Component

`src/components/creative/shared/KanbanBoard.tsx`:
- Props: `columns` (definitions with key, label, color), `items` (entity array), `getColumnKey(item)`, `onMove(itemId, newColumnKey)`, `renderCard(item)`, `isLoading`
- HTML5 Drag & Drop (no external library) — `onDragStart`, `onDragOver`, `onDrop`
- Each column: header with label + count badge, scrollable card list
- Visual drop target highlighting during drag

### Opportunity Board

- Wire in `CreativeOpportunities.tsx` with `availableViews={['table', 'cards', 'board']}`
- Columns from `OPPORTUNITY_STAGES`: lead → qualified → proposal → negotiation → won → lost
- Cards show: opportunity name, value (formatted currency), client name, probability %, close date
- `onMove` calls `useUpdateOpportunity` to patch stage

### Project Board

- Wire in `CreativeProjects.tsx` with `availableViews={['table', 'cards', 'board']}`
- Columns from `PROJECT_STATUSES`: draft → active → on_hold → completed → cancelled
- Cards show: project name, client name, budget (formatted), project type badge
- `onMove` calls `useUpdateProject` to patch status

---

## 3. Creative Reports Page

Analytics dashboard for the creative domain with pipeline, revenue, and project charts.

### Route + Navigation

- New page: `src/pages/creative/CreativeReports.tsx`
- Route: `/creative/reports`
- Sidebar: "Reports" item with BarChart3 icon, placed between Dashboard and Clients

### Hook

`src/hooks/useCreativeReports.ts` — `useCreativeReports(timeRange)`:
- Pipeline value by stage (from `creative_opportunities`)
- Won revenue over time (monthly aggregation of won opportunities)
- Conversion funnel percentages (lead → won)
- Project status breakdown counts
- Client acquisition over time (monthly count by `created_at`)

### Page Layout

Follows existing Reports page pattern:
- Time range selector (7d, 30d, 90d, 365d, all)
- 4 KPI summary cards: Pipeline Total, Win Rate, Avg Deal Size, Active Projects
- 2×2 chart grid using recharts:
  - Pipeline by Stage (horizontal bar chart)
  - Revenue Over Time (area chart)
  - Conversion Funnel (vertical bar chart)
  - Project Status Breakdown (donut chart)
- Uses existing `CHART_COLORS`, shadcn Card wrappers, ErrorBoundary per chart

---

## File Summary

| Area | New Files | Modified Files |
|---|---|---|
| **Activity** | `creative-activity.ts`, `useCreativeActivities.ts`, `ActivityTimeline.tsx`, `ActivityFormSheet.tsx`, migration | `ClientDetail.tsx`, `ContactDetail.tsx`, `ProjectDetail.tsx`, `OpportunityDetail.tsx`, `CreativeDashboard.tsx`, `useCreativeDashboard.ts` |
| **Kanban** | `KanbanBoard.tsx` | `design-tokens.ts`, `ViewSwitcher.tsx`, `CreativeOpportunities.tsx`, `CreativeProjects.tsx` |
| **Reports** | `CreativeReports.tsx`, `useCreativeReports.ts` | `App.tsx` (route), `CreativeSidebar.tsx` (nav item) |
