# Phase 2B: Four Engines Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the frontend layer (types, schemas, services, hooks, pages, components) for all four Phase 2B engines: Style Intelligence, Signal Engine, Enrichment Engine, and Entity Resolution.

**Architecture:** Each engine follows the proven layered pattern: types → Zod schema → service mapper (snake_case → camelCase) → React Query hooks → page components. All DB tables already exist with RLS. Pages use WorkspaceContainer + DataTable + Cards + FormSheet + Detail pattern.

**Tech Stack:** React 18, TypeScript, TanStack Table v8, TanStack Query v5, react-hook-form + Zod, shadcn/ui, Supabase JS client, Lucide icons.

---

## Conventions

**Patterns to follow exactly (copy from existing files):**
- Types file: `src/types/creative.ts` — `const X_STATUSES = [...] as const; type XStatus = ...; interface CreativeX { ... }`
- Schema: `src/lib/creative-schemas.ts` — Zod object with `.default()`, exported `XFormValues = z.infer<typeof xSchema>`
- Service: `src/services/creativeContactService.ts` — `interface XRow { snake_case }`, `function toX(row): X`, `function toXs(rows): X[]`
- Hooks: `src/hooks/useCreativeContacts.ts` — query key factory, useQuery, useMutation, `(data as unknown as XRow[])` cast
- Page: `src/pages/creative/CreativeContacts.tsx` — WorkspaceContainer, ViewSwitcher, DataTable, Card grid, FormSheet
- Columns: `src/components/creative/contacts/contact-columns.tsx` — `ColumnDef<X>[]` with DataTableColumnHeader
- Card: `src/components/creative/contacts/ContactCard.tsx`
- FormSheet: `src/components/creative/contacts/ContactFormSheet.tsx`
- Detail: `src/components/creative/contacts/ContactDetail.tsx`

**Verification:** After each task, run `npx tsc --noEmit` and fix any type errors.

**Supabase cast pattern:** `(data as unknown as XRow[])` — required because Supabase types don't know about these tables.

---

## ENGINE 1: STYLE INTELLIGENCE

### Task 1: Style Intelligence — Types and Schema

**Files:**
- Create: `src/types/style-intelligence.ts`
- Modify: `src/lib/creative-schemas.ts` (append style analysis schema)

**Step 1: Create `src/types/style-intelligence.ts`**

```typescript
// src/types/style-intelligence.ts
// Domain types for Style Intelligence engine.
// Matches DB table: creative_style_analyses.

export interface ColorSwatch {
  hex: string;
  name?: string;
  percentage?: number;
}

export interface TypographyProfile {
  primaryFont?: string;
  secondaryFont?: string;
  headingStyle?: string;
  bodyStyle?: string;
  scale?: string;
}

export interface StyleAnalysis {
  id: string;
  organizationId: string;
  clientId: string | null;
  portfolioId: string | null;
  sourceUrl: string | null;
  colorPalette: ColorSwatch[];
  typographyProfile: TypographyProfile;
  layoutPatterns: string[];
  brandAttributes: Record<string, unknown>;
  confidenceScore: number;
  analyzedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface StyleSimilarityResult {
  id: string;
  clientId: string | null;
  portfolioId: string | null;
  similarity: number;
}
```

**Step 2: Add style analysis schema to `src/lib/creative-schemas.ts`**

Append after the `portfolioSchema`:

```typescript
export const styleAnalysisSchema = z.object({
  clientId: z.string().uuid().optional(),
  portfolioId: z.string().uuid().optional(),
  sourceUrl: z.string().url('Invalid URL').or(z.literal('')).optional(),
  colorPalette: z.string().optional(), // JSON string for MVP
  typographyProfile: z.string().optional(), // JSON string for MVP
  brandAttributes: z.string().optional(), // JSON string for MVP
});

export type StyleAnalysisFormValues = z.infer<typeof styleAnalysisSchema>;
```

Also add the import: nothing extra needed (no enum imports).

**Step 3: Verify** — `npx tsc --noEmit`

**Step 4: Commit** — `git add src/types/style-intelligence.ts src/lib/creative-schemas.ts && git commit -m "feat(style): add Style Intelligence types and schema"`

---

### Task 2: Style Intelligence — Service and Hooks

**Files:**
- Create: `src/services/styleAnalysisService.ts`
- Create: `src/hooks/useStyleAnalyses.ts`

**Step 1: Create `src/services/styleAnalysisService.ts`**

```typescript
import type { StyleAnalysis, ColorSwatch, TypographyProfile } from '@/types/style-intelligence';

export interface StyleAnalysisRow {
  id: string;
  organization_id: string;
  client_id: string | null;
  portfolio_id: string | null;
  source_url: string | null;
  style_embedding: unknown; // pgvector — not used on frontend
  color_palette: unknown;
  typography_profile: unknown;
  layout_patterns: unknown;
  brand_attributes: Record<string, unknown>;
  confidence_score: number;
  analyzed_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function toStyleAnalysis(row: StyleAnalysisRow): StyleAnalysis {
  return {
    id: row.id,
    organizationId: row.organization_id,
    clientId: row.client_id,
    portfolioId: row.portfolio_id,
    sourceUrl: row.source_url,
    colorPalette: (row.color_palette ?? []) as ColorSwatch[],
    typographyProfile: (row.typography_profile ?? {}) as TypographyProfile,
    layoutPatterns: (row.layout_patterns ?? []) as string[],
    brandAttributes: row.brand_attributes ?? {},
    confidenceScore: Number(row.confidence_score) || 0,
    analyzedAt: row.analyzed_at,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toStyleAnalyses(rows: readonly StyleAnalysisRow[]): StyleAnalysis[] {
  return rows.map(toStyleAnalysis);
}
```

**Step 2: Create `src/hooks/useStyleAnalyses.ts`**

Follow `useCreativeContacts.ts` pattern exactly. Hooks:
- `useStyleAnalyses(clientId?)` — list all, optional client filter
- `useStyleAnalysis(id)` — single detail
- `useCreateStyleAnalysis()` — create mutation
- `useUpdateStyleAnalysis()` — update mutation
- `useDeleteStyleAnalysis()` — delete mutation

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { StyleAnalysis } from '@/types/style-intelligence';
import type { StyleAnalysisFormValues } from '@/lib/creative-schemas';
import { toStyleAnalysis, toStyleAnalyses, type StyleAnalysisRow } from '@/services/styleAnalysisService';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';

const styleKeys = {
  all: (orgId: string) => ['style-analyses', orgId] as const,
  detail: (id: string) => ['style-analysis', id] as const,
};

export function useStyleAnalyses(clientId?: string) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<StyleAnalysis[]>({
    queryKey: [...styleKeys.all(orgId ?? ''), clientId ?? 'all'],
    enabled: !!orgId,
    queryFn: async () => {
      let query = supabase
        .from('creative_style_analyses')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false });
      if (clientId) query = query.eq('client_id', clientId);
      const { data, error } = await query;
      if (error) throw error;
      return toStyleAnalyses((data ?? []) as unknown as StyleAnalysisRow[]);
    },
  });
}

export function useStyleAnalysis(id: string | null) {
  return useQuery<StyleAnalysis | null>({
    queryKey: styleKeys.detail(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('creative_style_analyses')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return toStyleAnalysis(data as unknown as StyleAnalysisRow);
    },
  });
}

export function useCreateStyleAnalysis() {
  const queryClient = useQueryClient();
  const { membership } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (values: StyleAnalysisFormValues) => {
      const orgId = membership?.organization_id;
      if (!orgId) throw new Error('No organization');

      const colorPalette = values.colorPalette ? JSON.parse(values.colorPalette) : [];
      const typographyProfile = values.typographyProfile ? JSON.parse(values.typographyProfile) : {};
      const brandAttributes = values.brandAttributes ? JSON.parse(values.brandAttributes) : {};

      const { data, error } = await supabase
        .from('creative_style_analyses')
        .insert({
          organization_id: orgId,
          client_id: values.clientId || null,
          portfolio_id: values.portfolioId || null,
          source_url: values.sourceUrl || null,
          color_palette: colorPalette,
          typography_profile: typographyProfile,
          brand_attributes: brandAttributes,
        })
        .select('*')
        .single();
      if (error) throw error;
      return toStyleAnalysis(data as unknown as StyleAnalysisRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['style-analyses'] });
    },
  });
}

export function useUpdateStyleAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<StyleAnalysisFormValues> }) => {
      const patch: Record<string, unknown> = {};
      if (values.clientId !== undefined) patch.client_id = values.clientId || null;
      if (values.portfolioId !== undefined) patch.portfolio_id = values.portfolioId || null;
      if (values.sourceUrl !== undefined) patch.source_url = values.sourceUrl || null;
      if (values.colorPalette !== undefined) patch.color_palette = values.colorPalette ? JSON.parse(values.colorPalette) : [];
      if (values.typographyProfile !== undefined) patch.typography_profile = values.typographyProfile ? JSON.parse(values.typographyProfile) : {};
      if (values.brandAttributes !== undefined) patch.brand_attributes = values.brandAttributes ? JSON.parse(values.brandAttributes) : {};

      const { data, error } = await supabase
        .from('creative_style_analyses')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return toStyleAnalysis(data as unknown as StyleAnalysisRow);
    },
    onSuccess: (analysis) => {
      queryClient.invalidateQueries({ queryKey: ['style-analyses'] });
      queryClient.setQueryData(styleKeys.detail(analysis.id), analysis);
    },
  });
}

export function useDeleteStyleAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('creative_style_analyses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['style-analyses'] });
    },
  });
}
```

**Step 3: Verify** — `npx tsc --noEmit`

**Step 4: Commit** — `git add src/services/styleAnalysisService.ts src/hooks/useStyleAnalyses.ts && git commit -m "feat(style): add Style Intelligence service and hooks"`

---

### Task 3: Style Intelligence — Page and Components

**Files:**
- Create: `src/components/creative/style/style-columns.tsx`
- Create: `src/components/creative/style/StyleAnalysisCard.tsx`
- Create: `src/components/creative/style/StyleAnalysisFormSheet.tsx`
- Create: `src/components/creative/style/StyleAnalysisDetail.tsx`
- Create: `src/pages/creative/CreativeStyle.tsx`
- Modify: `src/App.tsx` (add lazy import + route)

**Step 1: Create `src/components/creative/style/style-columns.tsx`**

TanStack Table columns: Source URL (or "Manual"), Client (if linked), Confidence (percentage badge), Colors (tiny swatch circles), Analyzed At.

Follow `contact-columns.tsx` pattern exactly. Use `ColumnDef<StyleAnalysis>[]`.

The color palette column renders up to 5 small color circles in a row.

**Step 2: Create `src/components/creative/style/StyleAnalysisCard.tsx`**

Visual card:
- Color palette bar across the top (horizontal gradient or swatches)
- Source URL or client name
- Confidence badge
- Typography info if available
- Click handler

**Step 3: Create `src/components/creative/style/StyleAnalysisFormSheet.tsx`**

Sheet form with react-hook-form + zodResolver(styleAnalysisSchema):
- clientId: Select from useCreativeClients
- portfolioId: Select from useCreativePortfolios
- sourceUrl: text input
- colorPalette: textarea (JSON array of {hex, name?, percentage?})
- typographyProfile: textarea (JSON)
- brandAttributes: textarea (JSON)

Handles both create (no initialData) and edit (initialData prefills).

**Step 4: Create `src/components/creative/style/StyleAnalysisDetail.tsx`**

Context panel detail view:
- Color palette: rendered as named swatches with hex codes
- Typography profile: font names, styles
- Brand attributes: key-value display
- Confidence score badge
- Source URL link
- Client/Portfolio associations
- Edit/Delete action buttons

**Step 5: Create `src/pages/creative/CreativeStyle.tsx`**

Follow `CreativeContacts.tsx` pattern:
- WorkspaceContainer with title "Style Intelligence"
- ViewSwitcher (table/cards)
- DataTable with styleColumns
- Card grid with StyleAnalysisCard
- StyleAnalysisFormSheet for create/edit
- Context panel integration for detail

**Step 6: Add lazy import and route in `src/App.tsx`**

Add lazy import near other creative imports:
```typescript
const CreativeStyle = lazy(() => import("./pages/creative/CreativeStyle"));
```

Add route inside creative group (the sidebar already has this path):
```tsx
<Route path="style" element={<CreativeStyle />} />
```

**Step 7: Verify** — `npx tsc --noEmit`

**Step 8: Commit** — `git add src/components/creative/style/ src/pages/creative/CreativeStyle.tsx src/App.tsx && git commit -m "feat(style): add Style Intelligence page and components"`

---

## ENGINE 2: SIGNAL ENGINE

### Task 4: Signal Engine — Types and Schema

**Files:**
- Create: `src/types/signal-engine.ts`
- Modify: `src/lib/creative-schemas.ts` (append signal schemas)

**Step 1: Create `src/types/signal-engine.ts`**

```typescript
// src/types/signal-engine.ts
// Domain types for Signal Engine.
// Matches DB tables: signal_rules, signals.

// ─── Signal Rule ─────────────────────────────

export const RULE_TYPES = ['engagement', 'lifecycle', 'market', 'custom'] as const;
export type RuleType = (typeof RULE_TYPES)[number];

export const RULE_TYPE_LABELS: Record<RuleType, string> = {
  engagement: 'Engagement',
  lifecycle: 'Lifecycle',
  market: 'Market',
  custom: 'Custom',
};

export const RULE_TYPE_COLORS: Record<RuleType, { bg: string; text: string }> = {
  engagement: { bg: 'bg-blue-100', text: 'text-blue-800' },
  lifecycle: { bg: 'bg-purple-100', text: 'text-purple-800' },
  market: { bg: 'bg-amber-100', text: 'text-amber-800' },
  custom: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

export interface SignalRule {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  ruleType: RuleType;
  conditions: Record<string, unknown>;
  actions: unknown[];
  isActive: boolean;
  priority: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── Signal ──────────────────────────────────

export const SIGNAL_SEVERITIES = ['info', 'low', 'medium', 'high', 'critical'] as const;
export type SignalSeverity = (typeof SIGNAL_SEVERITIES)[number];

export const SIGNAL_SEVERITY_LABELS: Record<SignalSeverity, string> = {
  info: 'Info',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const SIGNAL_SEVERITY_COLORS: Record<SignalSeverity, { bg: string; text: string }> = {
  info: { bg: 'bg-gray-100', text: 'text-gray-800' },
  low: { bg: 'bg-blue-100', text: 'text-blue-800' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-800' },
  high: { bg: 'bg-orange-100', text: 'text-orange-800' },
  critical: { bg: 'bg-red-100', text: 'text-red-800' },
};

export const SIGNAL_STATUSES = ['new', 'seen', 'actioned', 'dismissed'] as const;
export type SignalStatus = (typeof SIGNAL_STATUSES)[number];

export const SIGNAL_STATUS_LABELS: Record<SignalStatus, string> = {
  new: 'New',
  seen: 'Seen',
  actioned: 'Actioned',
  dismissed: 'Dismissed',
};

export const SIGNAL_STATUS_COLORS: Record<SignalStatus, { bg: string; text: string }> = {
  new: { bg: 'bg-blue-100', text: 'text-blue-800' },
  seen: { bg: 'bg-gray-100', text: 'text-gray-800' },
  actioned: { bg: 'bg-green-100', text: 'text-green-800' },
  dismissed: { bg: 'bg-slate-100', text: 'text-slate-600' },
};

export interface Signal {
  id: string;
  organizationId: string;
  ruleId: string | null;
  entityType: string;
  entityId: string;
  signalType: string;
  title: string;
  description: string | null;
  severity: SignalSeverity;
  status: SignalStatus;
  data: Record<string, unknown>;
  seenBy: string | null;
  seenAt: string | null;
  actionedAt: string | null;
  expiresAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
```

**Step 2: Add schemas to `src/lib/creative-schemas.ts`**

Add import at top: `import { RULE_TYPES, SIGNAL_SEVERITIES } from '@/types/signal-engine';`

Append:

```typescript
export const signalRuleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  ruleType: z.enum(RULE_TYPES).default('custom'),
  conditions: z.string().min(1, 'Conditions JSON is required'), // JSON string for MVP
  actions: z.string().optional(), // JSON string for MVP
  priority: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type SignalRuleFormValues = z.infer<typeof signalRuleSchema>;
```

**Step 3: Verify** — `npx tsc --noEmit`

**Step 4: Commit** — `git add src/types/signal-engine.ts src/lib/creative-schemas.ts && git commit -m "feat(signals): add Signal Engine types and schema"`

---

### Task 5: Signal Engine — Service and Hooks

**Files:**
- Create: `src/services/signalService.ts`
- Create: `src/hooks/useSignals.ts`

**Step 1: Create `src/services/signalService.ts`**

Two row types + mappers:
- `SignalRuleRow` → `SignalRule` via `toSignalRule(row)`
- `SignalRow` → `Signal` via `toSignal(row)`

Follow creativeContactService.ts pattern.

**Step 2: Create `src/hooks/useSignals.ts`**

Hooks:
- `useSignalRules()` — list all rules
- `useCreateSignalRule()` / `useUpdateSignalRule()` / `useDeleteSignalRule()`
- `useSignals(filters?)` — list signals with optional status/severity/entityType filters
- `useUpdateSignalStatus()` — mutation for Mark Seen / Take Action / Dismiss workflow

Key query keys:
```typescript
const signalKeys = {
  rules: (orgId: string) => ['signal-rules', orgId] as const,
  signals: (orgId: string) => ['signals', orgId] as const,
};
```

The `useUpdateSignalStatus` mutation takes `{ id, status, seenBy? }` and patches the signal.

**Step 3: Verify** — `npx tsc --noEmit`

**Step 4: Commit** — `git add src/services/signalService.ts src/hooks/useSignals.ts && git commit -m "feat(signals): add Signal Engine service and hooks"`

---

### Task 6: Signal Engine — Page and Components

**Files:**
- Create: `src/components/creative/signals/rule-columns.tsx`
- Create: `src/components/creative/signals/signal-columns.tsx`
- Create: `src/components/creative/signals/SignalRuleFormSheet.tsx`
- Create: `src/components/creative/signals/SignalCard.tsx`
- Create: `src/pages/creative/CreativeSignals.tsx`
- Modify: `src/App.tsx` (add lazy import + route)
- Modify: `src/components/creative/layout/CreativeSidebar.tsx` (add Signals nav item)

**Step 1: Create `rule-columns.tsx`** — Columns: Name, Rule Type (badge), Priority, Active (badge), Created.

**Step 2: Create `signal-columns.tsx`** — Columns: Title, Entity Type, Severity (color badge), Status (badge), Created.

**Step 3: Create `SignalRuleFormSheet.tsx`** — Form: name, description, ruleType (select), conditions (textarea), actions (textarea), priority (number), isActive (switch).

**Step 4: Create `SignalCard.tsx`** — Card for signal feed: title, severity indicator stripe on left edge, description truncated, entity type badge, status, time ago.

**Step 5: Create `src/pages/creative/CreativeSignals.tsx`**

Tabs-based page (not ViewSwitcher since rules and signals are different views):
- Tab "Rules": DataTable with ruleColumns, Add Rule button, FormSheet
- Tab "Signal Feed": Signal cards in a list (not DataTable — better UX for feed), filter dropdowns for severity/status

Use shadcn `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`.

**Step 6: Update App.tsx**

```typescript
const CreativeSignals = lazy(() => import("./pages/creative/CreativeSignals"));
// Add route:
<Route path="signals" element={<CreativeSignals />} />
```

**Step 7: Update CreativeSidebar.tsx**

Add import: `import { Zap } from 'lucide-react';`

Add to mainNavItems after Style Intelligence:
```typescript
{ label: 'Signals', icon: Zap, path: '/creative/signals' },
```

**Step 8: Verify** — `npx tsc --noEmit`

**Step 9: Commit** — `git add src/components/creative/signals/ src/pages/creative/CreativeSignals.tsx src/App.tsx src/components/creative/layout/CreativeSidebar.tsx && git commit -m "feat(signals): add Signal Engine page and components"`

---

## ENGINE 3: ENRICHMENT ENGINE

### Task 7: Enrichment Engine — Types and Schema

**Files:**
- Create: `src/types/enrichment-engine.ts`
- Modify: `src/lib/creative-schemas.ts` (append enrichment schema)

**Step 1: Create `src/types/enrichment-engine.ts`**

```typescript
// src/types/enrichment-engine.ts
// Domain types for Enrichment Engine.
// Matches DB tables: enrichment_credits, enrichment_recipes, enrichment_runs.

// ─── Credits ──────────────────────────────────

export interface EnrichmentCredit {
  id: string;
  organizationId: string;
  provider: string;
  totalCredits: number;
  usedCredits: number;
  resetAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── Recipe ───────────────────────────────────

export const RECIPE_TARGET_TYPES = ['client', 'contact', 'project'] as const;
export type RecipeTargetType = (typeof RECIPE_TARGET_TYPES)[number];

export const RECIPE_TARGET_LABELS: Record<RecipeTargetType, string> = {
  client: 'Client',
  contact: 'Contact',
  project: 'Project',
};

export interface EnrichmentRecipe {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  steps: unknown[];
  targetEntityType: RecipeTargetType;
  isActive: boolean;
  runCount: number;
  lastRunAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── Run ──────────────────────────────────────

export const ENRICHMENT_RUN_STATUSES = ['pending', 'running', 'completed', 'failed'] as const;
export type EnrichmentRunStatus = (typeof ENRICHMENT_RUN_STATUSES)[number];

export const ENRICHMENT_RUN_STATUS_LABELS: Record<EnrichmentRunStatus, string> = {
  pending: 'Pending',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
};

export const ENRICHMENT_RUN_STATUS_COLORS: Record<EnrichmentRunStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-gray-100', text: 'text-gray-800' },
  running: { bg: 'bg-blue-100', text: 'text-blue-800' },
  completed: { bg: 'bg-green-100', text: 'text-green-800' },
  failed: { bg: 'bg-red-100', text: 'text-red-800' },
};

export interface EnrichmentRun {
  id: string;
  organizationId: string;
  recipeId: string | null;
  status: EnrichmentRunStatus;
  entityType: string;
  entityIds: string[];
  results: unknown[];
  creditsUsed: number;
  startedAt: string | null;
  completedAt: string | null;
  errorLog: unknown[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
```

**Step 2: Add schema to `src/lib/creative-schemas.ts`**

Add import: `import { RECIPE_TARGET_TYPES } from '@/types/enrichment-engine';`

Append:

```typescript
export const enrichmentRecipeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  targetEntityType: z.enum(RECIPE_TARGET_TYPES).default('client'),
  steps: z.string().min(1, 'Steps JSON is required'), // JSON string for MVP
  isActive: z.boolean().default(true),
});

export type EnrichmentRecipeFormValues = z.infer<typeof enrichmentRecipeSchema>;
```

**Step 3: Verify** — `npx tsc --noEmit`

**Step 4: Commit** — `git add src/types/enrichment-engine.ts src/lib/creative-schemas.ts && git commit -m "feat(enrichment): add Enrichment Engine types and schema"`

---

### Task 8: Enrichment Engine — Service and Hooks

**Files:**
- Create: `src/services/enrichmentService.ts`
- Create: `src/hooks/useEnrichment.ts`

**Step 1: Create `src/services/enrichmentService.ts`**

Three row types + mappers:
- `EnrichmentCreditRow` → `EnrichmentCredit`
- `EnrichmentRecipeRow` → `EnrichmentRecipe`
- `EnrichmentRunRow` → `EnrichmentRun`

**Step 2: Create `src/hooks/useEnrichment.ts`**

Hooks:
- `useEnrichmentCredits()` — list all credit balances
- `useEnrichmentRecipes()` — list all recipes
- `useCreateEnrichmentRecipe()` / `useUpdateEnrichmentRecipe()` / `useDeleteEnrichmentRecipe()`
- `useEnrichmentRuns(recipeId?)` — list runs, optional filter
- `useTriggerEnrichmentRun()` — mutation to create a new run (inserts with status='pending')

Query keys:
```typescript
const enrichmentKeys = {
  credits: (orgId: string) => ['enrichment-credits', orgId] as const,
  recipes: (orgId: string) => ['enrichment-recipes', orgId] as const,
  runs: (orgId: string) => ['enrichment-runs', orgId] as const,
};
```

**Step 3: Verify** — `npx tsc --noEmit`

**Step 4: Commit** — `git add src/services/enrichmentService.ts src/hooks/useEnrichment.ts && git commit -m "feat(enrichment): add Enrichment Engine service and hooks"`

---

### Task 9: Enrichment Engine — Page and Components

**Files:**
- Create: `src/components/creative/enrichment/recipe-columns.tsx`
- Create: `src/components/creative/enrichment/run-columns.tsx`
- Create: `src/components/creative/enrichment/CreditCard.tsx`
- Create: `src/components/creative/enrichment/RecipeFormSheet.tsx`
- Create: `src/pages/creative/CreativeEnrichment.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/creative/layout/CreativeSidebar.tsx`

**Step 1: Create `recipe-columns.tsx`** — Columns: Name, Target Type (badge), Steps count, Run Count, Last Run, Active (badge).

**Step 2: Create `run-columns.tsx`** — Columns: Recipe Name (or "—"), Status (badge), Entity Count, Credits Used, Started At, Duration.

**Step 3: Create `CreditCard.tsx`** — Card showing: provider name, progress bar (used/total), remaining count, reset date. Uses shadcn `Progress` component.

**Step 4: Create `RecipeFormSheet.tsx`** — Form: name, description, targetEntityType (select), steps (textarea JSON), isActive (switch).

**Step 5: Create `src/pages/creative/CreativeEnrichment.tsx`**

Tabs-based page:
- Tab "Recipes": DataTable + Add Recipe button + FormSheet
- Tab "Credits": CreditCard grid (read-only)
- Tab "Run History": DataTable with runColumns

**Step 6: Update App.tsx** — Add lazy import + route for `enrichment`.

**Step 7: Update CreativeSidebar.tsx** — Add `Layers` icon import, add nav item `{ label: 'Enrichment', icon: Layers, path: '/creative/enrichment' }` after Signals.

**Step 8: Verify** — `npx tsc --noEmit`

**Step 9: Commit** — `git add src/components/creative/enrichment/ src/pages/creative/CreativeEnrichment.tsx src/App.tsx src/components/creative/layout/CreativeSidebar.tsx && git commit -m "feat(enrichment): add Enrichment Engine page and components"`

---

## ENGINE 4: ENTITY RESOLUTION

### Task 10: Entity Resolution — Types and Schema

**Files:**
- Create: `src/types/entity-resolution.ts`

No form schema needed — entity resolution candidates are system-generated, not user-created. Source mappings are read-only.

**Step 1: Create `src/types/entity-resolution.ts`**

```typescript
// src/types/entity-resolution.ts
// Domain types for Entity Resolution engine.
// Matches DB tables: entity_resolution_candidates, entity_source_mappings.

// ─── Resolution Candidate ────────────────────

export const RESOLUTION_STATUSES = ['pending', 'confirmed', 'rejected', 'auto_merged'] as const;
export type ResolutionStatus = (typeof RESOLUTION_STATUSES)[number];

export const RESOLUTION_STATUS_LABELS: Record<ResolutionStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  rejected: 'Rejected',
  auto_merged: 'Auto-Merged',
};

export const RESOLUTION_STATUS_COLORS: Record<ResolutionStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-800' },
  confirmed: { bg: 'bg-green-100', text: 'text-green-800' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800' },
  auto_merged: { bg: 'bg-blue-100', text: 'text-blue-800' },
};

export const ENTITY_TYPES = ['client', 'contact', 'project'] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export interface ResolutionCandidate {
  id: string;
  organizationId: string;
  entityAType: string;
  entityAId: string;
  entityBType: string;
  entityBId: string;
  confidenceScore: number;
  matchReasons: string[];
  status: ResolutionStatus;
  resolvedBy: string | null;
  resolvedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── Source Mapping ──────────────────────────

export interface EntitySourceMapping {
  id: string;
  organizationId: string;
  entityType: string;
  entityId: string;
  sourceProvider: string;
  sourceId: string;
  sourceData: Record<string, unknown>;
  isPrimary: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

**Step 2: Verify** — `npx tsc --noEmit`

**Step 3: Commit** — `git add src/types/entity-resolution.ts && git commit -m "feat(resolution): add Entity Resolution types"`

---

### Task 11: Entity Resolution — Service and Hooks

**Files:**
- Create: `src/services/entityResolutionService.ts`
- Create: `src/hooks/useEntityResolution.ts`

**Step 1: Create `src/services/entityResolutionService.ts`**

Two row types + mappers:
- `ResolutionCandidateRow` → `ResolutionCandidate`
- `EntitySourceMappingRow` → `EntitySourceMapping`

`matchReasons` in DB is JSONB array — cast to `string[]`.

**Step 2: Create `src/hooks/useEntityResolution.ts`**

Hooks:
- `useResolutionCandidates(statusFilter?)` — list with optional status filter, default 'pending'
- `useResolveCandidate()` — mutation to confirm/reject a candidate: patches status + resolved_by + resolved_at
- `useEntitySourceMappings(entityType?, entityId?)` — list source mappings
- No create/delete hooks needed for MVP (system-generated)

Query keys:
```typescript
const resolutionKeys = {
  candidates: (orgId: string) => ['resolution-candidates', orgId] as const,
  mappings: (orgId: string) => ['entity-source-mappings', orgId] as const,
};
```

**Step 3: Verify** — `npx tsc --noEmit`

**Step 4: Commit** — `git add src/services/entityResolutionService.ts src/hooks/useEntityResolution.ts && git commit -m "feat(resolution): add Entity Resolution service and hooks"`

---

### Task 12: Entity Resolution — Page and Components

**Files:**
- Create: `src/components/creative/resolution/candidate-columns.tsx`
- Create: `src/components/creative/resolution/mapping-columns.tsx`
- Create: `src/components/creative/resolution/CandidateCard.tsx`
- Create: `src/pages/creative/CreativeResolution.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/creative/layout/CreativeSidebar.tsx`

**Step 1: Create `candidate-columns.tsx`** — Columns: Entity A (type + id truncated), Entity B (type + id truncated), Confidence (percentage), Match Reasons (comma-joined), Status (badge), Actions (Confirm/Reject buttons inline).

The Actions column uses `useMutation` inline or passes callback through. For simplicity, use a cell renderer that emits `onResolve(id, status)` passed via meta.

**Step 2: Create `mapping-columns.tsx`** — Columns: Entity Type, Entity ID (truncated), Source Provider, Source ID, Primary (badge), Last Synced.

**Step 3: Create `CandidateCard.tsx`** — Card showing: entity A vs entity B with "vs" divider, confidence as circular progress or badge, match reasons as tag list, Confirm/Reject buttons.

**Step 4: Create `src/pages/creative/CreativeResolution.tsx`**

Tabs-based page:
- Tab "Candidates": DataTable with candidateColumns + status filter dropdown (default: pending). Also a card view option for visual comparison.
- Tab "Source Mappings": DataTable with mappingColumns (read-only).

**Step 5: Update App.tsx** — Add lazy import + route for `resolution`.

**Step 6: Update CreativeSidebar.tsx** — Add `GitMerge` icon import, add nav item `{ label: 'Resolution', icon: GitMerge, path: '/creative/resolution' }` after Enrichment.

**Step 7: Verify** — `npx tsc --noEmit`

**Step 8: Commit** — `git add src/components/creative/resolution/ src/pages/creative/CreativeResolution.tsx src/App.tsx src/components/creative/layout/CreativeSidebar.tsx && git commit -m "feat(resolution): add Entity Resolution page and components"`

---

## FINAL VERIFICATION

### Task 13: Full Build Verification and Push

**Step 1:** Run `npx tsc --noEmit` — expect clean (0 errors).

**Step 2:** Run `npm run build` — expect clean Vite build.

**Step 3:** Review sidebar order by reading `CreativeSidebar.tsx` — verify all 11 nav items present:
Dashboard, Clients, Projects, Contacts, Opportunities, Portfolios, Style Intelligence, Signals, Enrichment, Resolution, Ingestion.

**Step 4:** Run `git log --oneline -15` to verify all commits are clean.

**Step 5:** Push to origin: `git push origin main`
