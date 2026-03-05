# Phase 2B Design: Four Engines

**Date:** 2026-03-05
**Status:** Approved
**Scope:** Style Intelligence, Signal Engine, Enrichment Engine, Entity Resolution

## Context

Phase 2A (Contacts, Portfolios, Ingestion CRUD) is complete. All Phase 2B database migrations are deployed:
- `20260309110000_creative_style_tables.sql` — creative_style_analyses (pgvector 512-dim)
- `20260309140000_signal_engine_tables.sql` — signal_rules, signals
- `20260309150000_enrichment_engine_tables.sql` — enrichment_credits, enrichment_recipes, enrichment_runs
- `20260309130000_entity_resolution_tables.sql` — entity_resolution_candidates, entity_source_mappings
- `20260309160000_engine_events_tables.sql` — engine_events (inter-engine bus)

Each engine follows the proven layered architecture: types → Zod schema → service mapper → React Query hooks → page + components.

---

## Engine 1: Style Intelligence

**Route:** `/creative/style` (already in sidebar)
**DB Table:** `creative_style_analyses`

### Schema Summary
- id, organization_id, client_id (FK), portfolio_id (FK)
- source_url (text)
- style_embedding (vector 512) — pgvector with IVFFlat cosine index
- color_palette (jsonb array), typography_profile (jsonb), layout_patterns (jsonb array), brand_attributes (jsonb)
- confidence_score (numeric 5,4), analyzed_at (timestamptz)
- metadata, created_at, updated_at

### Page Design — Two Tabs

**Analyses Tab:**
- DataTable: client name, confidence score, analyzed_at, color palette preview (tiny swatches)
- Card view: visual color-palette bar per analysis
- FormSheet: create/edit with client_id (select), portfolio_id (select), source_url, color_palette (JSON), typography_profile (JSON), brand_attributes (JSON)
- Detail panel: full palette visualization, typography info, brand attributes, "Find Similar" button

**Similarity Tab:**
- Select an analysis → see top-N matches ranked by cosine distance
- Each result: matched client/portfolio, distance score, palette preview
- Uses Supabase RPC function `match_style_analyses(query_embedding, match_threshold, match_count)`

### Supabase RPC Function
```sql
create or replace function match_style_analyses(
  query_embedding vector(512),
  match_threshold float default 0.8,
  match_count int default 10,
  org_id uuid default null
)
returns table (
  id uuid,
  client_id uuid,
  portfolio_id uuid,
  similarity float
)
language plpgsql as $$
begin
  return query
  select
    sa.id,
    sa.client_id,
    sa.portfolio_id,
    1 - (sa.style_embedding <=> query_embedding) as similarity
  from creative_style_analyses sa
  where sa.organization_id = org_id
    and sa.style_embedding is not null
    and 1 - (sa.style_embedding <=> query_embedding) > match_threshold
  order by sa.style_embedding <=> query_embedding
  limit match_count;
end;
$$;
```

---

## Engine 2: Signal Engine

**Route:** `/creative/signals` (new — add to sidebar with Zap icon)
**DB Tables:** `signal_rules`, `signals`

### Schema Summary — signal_rules
- id, organization_id, name, description, rule_type (text)
- conditions (jsonb), actions (jsonb array)
- is_active (bool), priority (int)
- metadata, created_at, updated_at

### Schema Summary — signals
- id, organization_id, rule_id (FK nullable)
- entity_type (text), entity_id (uuid)
- signal_type (text), title, description
- severity: info | low | medium | high | critical
- status: new | seen | actioned | dismissed
- data (jsonb), seen_by (FK), seen_at, actioned_at, expires_at
- metadata, created_at, updated_at

### Page Design — Two Tabs

**Rules Tab:**
- DataTable: name, rule_type, priority, active badge, conditions preview (truncated)
- FormSheet: name, description, rule_type (select), conditions (JSON textarea MVP), actions (JSON textarea MVP), priority (number input), is_active (switch)
- Detail panel: full conditions/actions JSON prettified

**Signal Feed Tab:**
- Filterable list sorted by created_at desc
- Severity badges with color coding (info=gray, low=blue, medium=amber, high=orange, critical=red)
- Status workflow buttons: Mark Seen, Take Action, Dismiss
- Filters: severity, status, entity_type
- Each signal: title, description, entity link, matched rule name, expiry countdown
- Detail: full data payload JSON view

---

## Engine 3: Enrichment Engine

**Route:** `/creative/enrichment` (new — add to sidebar with Layers icon)
**DB Tables:** `enrichment_credits`, `enrichment_recipes`, `enrichment_runs`

### Schema Summary — enrichment_credits
- id, organization_id, provider (text unique per org)
- total_credits (int), used_credits (int), reset_at
- metadata, created_at, updated_at

### Schema Summary — enrichment_recipes
- id, organization_id, name, description
- steps (jsonb array), target_entity_type (text)
- is_active (bool), run_count (int), last_run_at
- metadata, created_at, updated_at

### Schema Summary — enrichment_runs
- id, organization_id, recipe_id (FK nullable)
- status: pending | running | completed | failed
- entity_type (text), entity_ids (uuid[]), results (jsonb)
- credits_used (int), started_at, completed_at, error_log (jsonb)
- metadata, created_at, updated_at

### Page Design — Three Tabs

**Recipes Tab:**
- DataTable: name, target_entity_type, step count, run_count, last_run_at, active badge
- FormSheet: name, description, target_entity_type (select: client/contact/project), steps (JSON textarea MVP), is_active (switch)
- Detail: steps rendered as numbered waterfall pipeline, "Run Now" button

**Credits Tab:**
- Card grid: one card per provider
- Each card: provider name, progress bar (used/total), remaining count, reset date
- Read-only dashboard (credits managed externally)

**Run History Tab:**
- DataTable: recipe name, status badge, entity count, credits_used, started_at, duration
- Expandable rows: per-entity results, error log entries

---

## Engine 4: Entity Resolution

**Route:** `/creative/resolution` (new — add to sidebar with GitMerge icon)
**DB Tables:** `entity_resolution_candidates`, `entity_source_mappings`

### Schema Summary — entity_resolution_candidates
- id, organization_id
- entity_a_type (text), entity_a_id (uuid)
- entity_b_type (text), entity_b_id (uuid)
- confidence_score (numeric 5,4), match_reasons (jsonb array)
- status: pending | confirmed | rejected | auto_merged
- resolved_by (FK user), resolved_at
- metadata, created_at, updated_at

### Schema Summary — entity_source_mappings
- id, organization_id
- entity_type (text), entity_id (uuid)
- source_provider (text), source_id (text), source_data (jsonb)
- is_primary (bool), last_synced_at
- created_at, updated_at

### Page Design — Two Tabs

**Candidates Tab:**
- DataTable: entity A (name + type), entity B (name + type), confidence %, match_reasons summary, status badge
- Filter by: status (pending/confirmed/rejected/auto_merged), entity_type
- Action buttons per row: Confirm Match, Reject
- Detail panel: side-by-side entity field comparison with highlighted diffs

**Source Mappings Tab:**
- DataTable: entity name + type, source_provider, source_id, is_primary badge, last_synced_at
- Read-only for MVP (mappings created by ingestion engine)

---

## Shared Updates

### Sidebar Additions (CreativeSidebar.tsx)
After "Ingestion" in mainNavItems:
```ts
{ label: 'Signals', icon: Zap, path: '/creative/signals' },
{ label: 'Enrichment', icon: Layers, path: '/creative/enrichment' },
{ label: 'Resolution', icon: GitMerge, path: '/creative/resolution' },
```

### Route Additions (App.tsx)
Inside creative route group:
```tsx
<Route path="signals" element={<CreativeSignals />} />
<Route path="enrichment" element={<CreativeEnrichment />} />
<Route path="resolution" element={<CreativeResolution />} />
```

### Implementation Order
1. Style Intelligence (route already exists in sidebar)
2. Signal Engine
3. Enrichment Engine
4. Entity Resolution

Each engine is independent. Built sequentially following the proven pattern: types → schema → service → hooks → page + components.
