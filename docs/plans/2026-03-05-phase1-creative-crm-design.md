# Phase 1: Creative CRM — Design Document

**Date:** 2026-03-05
**Status:** Approved
**Builds on:** Phase 0 Foundation (completed)

## Goal

Bring the Creative Relationship Intelligence Platform to life with full CRUD for Clients, Projects, and Opportunities — the three core entities. Replace all skeleton placeholders with real data-driven views.

## Architecture

Layered approach: shared infrastructure (types, services, hooks, DataTable) is built first, then each entity is a thin composition layer that wires column definitions, form schemas, and detail views to the shared primitives. All data flows through Supabase with RLS scoped to the user's organization.

## Tech Stack

- **TanStack Table** (`@tanstack/react-table` v8) — sortable, filterable data tables
- **react-hook-form** + **zod** — form state management and validation
- **shadcn Sheet** — slide-in panels for create/edit forms
- **shadcn Table** — HTML table primitives styled by design tokens
- **React Query** (`@tanstack/react-query`) — server state with cache invalidation
- **Supabase JS** — data access with RLS enforcement

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Scope | Full CRM (Clients + Projects + Opportunities) | Core entities needed for MVP |
| Table library | TanStack Table | Already installed, type-safe, headless |
| Form library | react-hook-form + zod | shadcn Form already wraps RHF |
| Create/Edit UX | Sheet (slide-in panel) | Non-disruptive, keeps table context visible |
| Architecture | Layered (shared infra → entities) | DRY, consistent patterns |

---

## Section 1: Types & Validation

### Types — `src/types/creative.ts`

Three domain interfaces with camelCase properties:

- **CreativeClient**: id, organizationId, name, primaryContactName/Email/Phone, website, industry, size (solo/small/medium/large/enterprise), status (prospect/active/paused/churned), notes, metadata, createdAt, updatedAt
- **CreativeProject**: id, organizationId, clientId, name, status (draft/briefing/in_progress/review/delivered/archived), startDate, endDate, budget, description, metadata, createdAt, updatedAt
- **CreativeOpportunity**: id, organizationId, clientId, projectId (nullable), title, stage (lead/qualified/proposal/negotiation/won/lost), value, probability (0-100), expectedCloseDate, description, metadata, createdAt, updatedAt

Status/stage unions with corresponding `*_LABELS` (Record<Status, string>) and `*_COLORS` (Record<Status, { bg, text }>) maps following the existing CRM pattern in `src/types/entity.ts`.

### Validation — `src/lib/creative-schemas.ts`

Zod schemas for form validation:
- `clientSchema`: name required (min 1), email optional but valid format, size/status from enum
- `projectSchema`: name + clientId required, budget optional non-negative, dates optional
- `opportunitySchema`: title + clientId + stage required, value/probability optional non-negative, probability max 100

Inferred `ClientFormValues`, `ProjectFormValues`, `OpportunityFormValues` types via `z.infer`.

---

## Section 2: Services & Hooks

### Services

One service file per entity following the existing Row→Domain converter pattern:

- **`src/services/creativeClientService.ts`**: `CreativeClientRow` (snake_case) ↔ `CreativeClient` (camelCase) via `toCreativeClient()`, `toCreativeClients()`, `toCreativeClientInsert()`
- **`src/services/creativeProjectService.ts`**: same pattern with `client_id` FK
- **`src/services/creativeOpportunityService.ts`**: same pattern with `client_id` + `project_id` FKs

### Hooks

One hook file per entity with query key factory and full CRUD:

- **`src/hooks/useCreativeClients.ts`**: `useCreativeClients(orgId)`, `useCreativeClient(id)`, `useCreateCreativeClient()`, `useUpdateCreativeClient()`, `useDeleteCreativeClient()`
- **`src/hooks/useCreativeProjects.ts`**: same + optional `clientId` filter
- **`src/hooks/useCreativeOpportunities.ts`**: same + optional `clientId`/`projectId` filters
- **`src/hooks/useOrganization.ts`**: shared hook returning current user's `organization_id`
- **`src/hooks/useCreativeDashboard.ts`**: parallel queries for KPI counts/aggregations

Query pattern: `useQuery` with `enabled` guards, `useMutation` with `queryClient.invalidateQueries()` on success.

---

## Section 3: Shared DataTable Component

### `src/components/creative/shared/DataTable.tsx`

Generic, type-safe TanStack Table wrapper:

```typescript
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  searchKey?: string;
  searchPlaceholder?: string;
  onRowClick?: (row: TData) => void;
  emptyState?: React.ReactNode;
}
```

Features: search input filtering, sortable column headers, pagination (10/25/50), loading skeleton, customizable empty state, row click handler.

Supporting components:
- `DataTableColumnHeader.tsx` — sortable header with sort direction indicators
- `DataTablePagination.tsx` — page size selector + navigation

---

## Section 4: Entity Form Sheets

Each entity gets a form Sheet component using react-hook-form + zodResolver:

- **`ClientFormSheet.tsx`**: Fields — name*, primary contact name/email/phone, website, size, industry, status, notes. Dual mode via optional `client` prop.
- **`ProjectFormSheet.tsx`**: Fields — name*, client (select)*, status, start/end date, budget, description. Client select populated by `useCreativeClients()`.
- **`OpportunityFormSheet.tsx`**: Fields — title*, client (select)*, project (select), stage, value, probability, expected close date, description. Project select filtered by selected client.

All forms: submit calls create/update mutation, toast on result, auto-close on success.

---

## Section 5: Table & Card Views

Each entity page replaces its skeleton placeholder:

- **CreativeClients.tsx**: Table columns (Name, Primary Contact, Industry, Size, Status, Created) + Card grid. "+ New Client" opens ClientFormSheet.
- **CreativeProjects.tsx**: Table columns (Name, Client, Status, Start Date, End Date, Budget) + Card grid. "+ New Project" opens ProjectFormSheet.
- **CreativeOpportunities.tsx**: Table columns (Title, Client, Project, Stage, Value, Probability, Expected Close) + Card grid. "+ New Opportunity" opens OpportunityFormSheet.

Column definitions in separate files: `client-columns.tsx`, `project-columns.tsx`, `opportunity-columns.tsx`.

Card components: `ClientCard.tsx`, `ProjectCard.tsx`, `OpportunityCard.tsx`.

---

## Section 6: Context Panel (Detail View)

Content components rendered inside the existing `ContextPanel`:

- **`ClientDetail.tsx`**: Header (name, status, edit/delete), Contact Info, linked Projects, linked Opportunities, Notes
- **`ProjectDetail.tsx`**: Header (name, client link, status), Details (dates, budget), Client info, Opportunities, Notes
- **`OpportunityDetail.tsx`**: Header (title, stage, value), Details (probability, expected close), Client, Project, Notes

Edit opens the corresponding FormSheet in edit mode. Delete with confirmation dialog.

---

## Section 7: Dashboard KPIs

**`CreativeDashboard.tsx`** replaces placeholder with:

- **4 KPI cards**: Total Clients, Active Projects, Pipeline Value, Win Rate
- **Recent Activity**: latest 5 created/updated entities
- **Pipeline by Stage**: horizontal bar chart of opportunity counts per stage

---

## File Structure

```
src/
├── types/creative.ts
├── lib/creative-schemas.ts
├── services/
│   ├── creativeClientService.ts
│   ├── creativeProjectService.ts
│   └── creativeOpportunityService.ts
├── hooks/
│   ├── useOrganization.ts
│   ├── useCreativeClients.ts
│   ├── useCreativeProjects.ts
│   ├── useCreativeOpportunities.ts
│   └── useCreativeDashboard.ts
├── components/creative/
│   ├── shared/
│   │   ├── DataTable.tsx
│   │   ├── DataTableColumnHeader.tsx
│   │   └── DataTablePagination.tsx
│   ├── clients/
│   │   ├── client-columns.tsx
│   │   ├── ClientFormSheet.tsx
│   │   ├── ClientDetail.tsx
│   │   └── ClientCard.tsx
│   ├── projects/
│   │   ├── project-columns.tsx
│   │   ├── ProjectFormSheet.tsx
│   │   ├── ProjectDetail.tsx
│   │   └── ProjectCard.tsx
│   └── opportunities/
│       ├── opportunity-columns.tsx
│       ├── OpportunityFormSheet.tsx
│       ├── OpportunityDetail.tsx
│       └── OpportunityCard.tsx
└── pages/creative/
    ├── CreativeDashboard.tsx        (modified)
    ├── CreativeClients.tsx          (modified)
    ├── CreativeProjects.tsx         (modified)
    └── CreativeOpportunities.tsx    (modified)
```

**New files: ~24** | **Modified files: 4**
