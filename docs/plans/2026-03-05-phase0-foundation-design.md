# Phase 0: Foundation — Design Document

**Date**: 2026-03-05
**Status**: Approved
**Scope**: Database foundation + UI shell + routing for Creative Intelligence Platform

## What Gets Built

### 1. Database Migrations (7 new migrations)

All tables workspace-scoped via `organizations.id`, with RLS policies, `updated_at` triggers.

| Migration | Tables |
|---|---|
| `creative_domain_core` | `creative_clients`, `creative_contacts`, `creative_projects`, `creative_portfolios`, `creative_opportunities` |
| `creative_style_tables` | `creative_style_analyses` (pgvector) |
| `ingestion_engine_tables` | `ingestion_providers`, `ingestion_runs`, `ingestion_jobs` |
| `entity_resolution_tables` | `entity_resolution_candidates`, `entity_source_mappings` |
| `signal_engine_tables` | `signals`, `signal_rules` |
| `enrichment_engine_tables` | `enrichment_credits`, `enrichment_runs`, `enrichment_recipes` |
| `engine_events_tables` | `engine_events` |

### 2. Design Tokens
- `src/lib/design-tokens.ts` — centralized colors, typography, spacing, shadows, layout

### 3. Layout Components
- `AppShell.tsx` — root wrapper
- `Sidebar.tsx` — collapsible navigation
- `TopBar.tsx` — breadcrumbs + actions
- `ContextPanel.tsx` — resizable right panel
- `WorkspaceContainer.tsx` — main canvas

### 4. Command Palette
- `CommandPalette.tsx` using `cmdk` library
- CMD+K global search

### 5. View Switcher
- `ViewSwitcher.tsx` — Table/Cards/Graph/Map toggle
- Skeleton views for each mode

### 6. Routing
- New `/creative/*` namespace (existing routes untouched)
- Lazy-loaded feature pages

### 7. Dependencies
- `cmdk` — command palette
- `@tanstack/react-table` — data tables (if not present)

## What Does NOT Change
- Existing CRM routes, pages, components
- Existing database tables
- Existing edge functions
- Existing Stripe billing

## Deployment
1. Commit to `main`
2. `git push` → Vercel rebuild
3. `supabase db push` → production migrations
4. Verify both deployments
