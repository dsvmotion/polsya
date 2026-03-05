# Phase 2B Polish + Dashboard + Cross-Entity Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Date:** 2026-03-05
**Status:** Approved
**Scope:** Phase 2B engine enhancements, dashboard integration, cross-entity navigation in context panels

---

## 1. Phase 2B Polish

Fill in enhancement gaps from the original Phase 2B design — detail panels, similarity search, run execution, and side-by-side comparison.

### 1A. Style Intelligence — Similarity Tab

- Add a "Similarity" tab to `CreativeStyle.tsx`
- New hook `useStyleSimilarity(analysisId)` — calls existing `match_style_analyses` RPC via `supabase.rpc()`
- New component `StyleSimilarityResults.tsx` — list of matched analyses with distance scores and palette previews
- "Find Similar" button in `StyleAnalysisDetail` selects an analysis and switches to the Similarity tab
- Gracefully shows "No embeddings available" when RPC returns empty (embeddings not yet populated)

### 1B. Signal Engine — Detail Panel

- New component `SignalDetail.tsx` — opens in context panel on row/card click
- Shows: full title, description, severity/status badges, entity type + ID, matched rule name, created/seen/actioned timestamps
- "Data" section: prettified JSON view of `signal.data` payload using `<pre>` with `JSON.stringify(data, null, 2)`
- Status action buttons always visible (Mark Seen, Action, Dismiss) regardless of current status
- Wire `CreativeSignals.tsx` feed cards and any future table rows to open this detail panel via `useCreativeLayout`

### 1C. Enrichment Engine — Run Now + Run Detail

**Run Now button:**
- Add "Run Now" action button to recipe rows in `recipeColumns.tsx`
- Requires a target entity selection — for MVP, opens a simple dialog asking for entity type + IDs (comma-separated UUIDs)

**Supabase Edge Function `process-enrichment-run`:**
1. Input: `{ runId: string }`
2. Updates run status → `running`, sets `started_at`
3. Fetches recipe to get steps JSON
4. For each entity ID, fetches entity from appropriate table (clients/contacts/projects based on `entity_type`)
5. Processes each step based on `step.type`:
   - `fetch_url_metadata` — HTTP GET the entity's website URL, extracts title, description, OG tags
   - `enrich_from_source` — looks up entity in `entity_source_mappings`, returns latest `source_data`
   - `compute_style` — creates a stub `creative_style_analyses` row for the entity
6. Collects per-entity results into `results` JSON array
7. Deducts `credits_used` from the provider's `enrichment_credits.used_credits`
8. Sets `completed_at`, status → `completed`
9. On error: status → `failed`, populates `error_log` JSON

**Modified hook:** `useTriggerEnrichmentRun` — after inserting the run row, calls `supabase.functions.invoke('process-enrichment-run', { body: { runId } })`

**Run Detail panel:**
- New component `RunDetail.tsx` — context panel showing per-entity results from `run.results` and error entries from `run.errorLog`
- Click a run row in the History tab → opens RunDetail via `useCreativeLayout`

### 1D. Entity Resolution — Candidate Detail Panel

- New component `CandidateDetail.tsx` — opens in context panel on row/card click
- Fetches both entities by type (entityAType → creative_clients/contacts/projects) and ID
- Displays fields side by side in a two-column layout with highlighted differences (name, email, website, industry, etc.)
- Status badge + confidence % at top
- Match reasons as badges
- Confirm/Reject action buttons at bottom
- Wire `CreativeResolution.tsx` candidate rows/cards to open this panel

---

## 2. Dashboard Integration

Replace the two placeholder cards in `CreativeDashboard.tsx` with live engine data.

### Expanded `useCreativeDashboard` Hook

Add four engine queries to the existing `Promise.all`:
- `signals` count where `status = 'new'`
- `signal_rules` count where `is_active = true`
- `entity_resolution_candidates` count where `status = 'pending'`
- `enrichment_credits` — sum remaining credits across providers

New fields in `DashboardStats`:
```ts
newSignals: number;
activeRules: number;
pendingResolutions: number;
remainingCredits: number;
```

### New Engine Metrics Row

Second 4-column grid below existing CRM metrics:
- New Signals (Zap icon, count)
- Active Rules (Shield icon, count)
- Pending Merges (GitMerge icon, count)
- Enrichment Credits (Layers icon, remaining sum)

### Replace "Recent Activity" Placeholder

New hook `useRecentSignals(limit: number)` — fetches latest N signals by `created_at desc`.
Render compact rows: severity color dot + title + time ago.
"View all →" link to `/creative/signals`.

### Replace "Signals" Placeholder with Pending Resolutions

Reuse `useResolutionCandidates('pending')` with limit of 3.
Show compact candidate cards: entity A vs B + confidence %.
"View all →" link to `/creative/resolution`.

---

## 3. Cross-Entity Navigation

Collapsible engine sections in context-panel detail views for Clients and Contacts.

### New Shared Component: `CollapsibleEngineSection`

Location: `src/components/creative/shared/CollapsibleEngineSection.tsx`

Props:
- `icon`: LucideIcon
- `label`: string
- `count`: number
- `isLoading`: boolean
- `children`: ReactNode
- `defaultOpen?`: boolean (default false)

Uses shadcn Collapsible. Header shows icon + label + count badge. Collapsed by default.

### ClientDetail Enhancement

Add 3 collapsible sections after Tags, before metadata footer:

1. **Signals** — `useSignals({ entityType: 'client', entityId: client.id })`
   - Compact rows: severity dot + title + time ago
   - Click signal → navigate to `/creative/signals`

2. **Style Analyses** — `useStyleAnalyses(client.id)`
   - Palette preview swatches + confidence badge + date
   - Click → navigate to `/creative/style`

3. **Resolution Candidates** — `useResolutionCandidatesForEntity('client', client.id)`
   - Match % badge + opposing entity info + status badge
   - Click → navigate to `/creative/resolution`

### ContactDetail Enhancement

Add 2 collapsible sections (no style analyses for contacts):
1. Signals
2. Resolution Candidates

### New Hook: `useResolutionCandidatesForEntity`

Location: add to `src/hooks/useEntityResolution.ts`

Queries `entity_resolution_candidates` with `.or()` filter:
`entity_a_id.eq.${entityId},entity_b_id.eq.${entityId}`

---

## File Summary

| Area | New Files | Modified Files |
|---|---|---|
| **Style Similarity** | `StyleSimilarityResults.tsx` | `CreativeStyle.tsx`, `StyleAnalysisDetail.tsx`, `useStyleAnalyses.ts` |
| **Signal Detail** | `SignalDetail.tsx` | `CreativeSignals.tsx` |
| **Enrichment Exec** | `RunDetail.tsx`, `RunNowDialog.tsx`, `supabase/functions/process-enrichment-run/index.ts` | `CreativeEnrichment.tsx`, `recipeColumns.tsx`, `useEnrichmentEngine.ts` |
| **Resolution Detail** | `CandidateDetail.tsx` | `CreativeResolution.tsx` |
| **Dashboard** | — | `useCreativeDashboard.ts`, `CreativeDashboard.tsx` |
| **Cross-Entity** | `CollapsibleEngineSection.tsx` | `ClientDetail.tsx`, `ContactDetail.tsx`, `useEntityResolution.ts` |
