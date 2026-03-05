# Phase 2A: Contacts, Portfolios & Ingestion Engine — Design

**Goal:** Complete the CRM data layer (Contacts + Portfolios CRUD) and build the first advanced engine UI (Ingestion), establishing the data pipeline that feeds all downstream engines.

**Architecture:** Layered, following Phase 1 patterns — types → Zod schema → service mapper → React Query hook → page (DataTable + Cards + FormSheet + Detail). Ingestion UI adds a provider management + run monitoring pattern on top.

**Tech Stack:** Same as Phase 1 — TanStack Table v8, react-hook-form + zod, shadcn/ui, React Query, Supabase JS. All tables already exist in DB with RLS.

---

## 1. Contacts Management

Contacts are people at client organizations. They link to clients via `client_id` and optionally to opportunities via `contact_id`.

- **Route:** `/creative/contacts`
- **Sidebar:** New item between Projects and Opportunities (UserRound icon)
- **Views:** DataTable (default) + Card grid (toggle)
- **CRUD:** Full create/edit/delete via FormSheet + ContextPanel detail
- **Key fields:** first_name, last_name, email, phone, title, role, client_id (select), is_decision_maker (toggle), linkedin_url, status
- **Search:** By name, email, title
- **Filters:** By client, by status, by is_decision_maker

## 2. Portfolios Management

Portfolios are visual work samples linked to projects and/or clients.

- **Route:** `/creative/portfolios`
- **Sidebar:** Already listed (Image icon)
- **Views:** Card grid (default, with thumbnail) + DataTable (toggle)
- **CRUD:** Full create/edit/delete via FormSheet + ContextPanel detail
- **Key fields:** title, description, category, media_urls[] (comma-separated URLs for MVP), thumbnail_url, is_public (toggle), project_id (optional select), client_id (optional select), tags
- **Card view:** Thumbnail preview with title, category badge, public/private indicator
- **Filters:** By category, by client, by project, by is_public

## 3. Ingestion Engine UI

The ingestion engine connects external data sources and syncs records into the creative domain.

- **Route:** `/creative/ingestion`
- **Sidebar:** New item after Style Intelligence (CloudDownload icon)
- **Sub-views:** Providers list + Run history (tabs or split layout)
- **Provider Management:** List providers, add/edit provider config, toggle active/inactive, manual sync trigger
- **Run Dashboard:** List recent runs with status badges, record counts, duration, error indicators
- **Job Drill-down:** Click a run to see individual jobs within it (status, input/output preview, error messages)
- **For MVP:** Manual trigger only, no automated cron scheduling

## 4. Sidebar Updates

Add to `mainNavItems` in CreativeSidebar:
```
Contacts    → /creative/contacts    (UserRound icon)
Ingestion   → /creative/ingestion   (Download icon)
```

## 5. Future: Phase 2B (Engines)

After 2A ships, revisit to build:
- Style Intelligence (pgvector similarity, brand analysis)
- Signal Engine (rules editor, signal feed)
- Enrichment Engine (recipe builder, credit tracking)
- Entity Resolution (duplicate detection, merge UI)
