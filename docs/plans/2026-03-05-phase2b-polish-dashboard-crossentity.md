# Phase 2B Polish + Dashboard + Cross-Entity Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add detail panels for all 4 engines, similarity search for style intelligence, actual enrichment execution via Edge Function, replace dashboard placeholders with live engine data, and add cross-entity engine sections to Client/Contact detail panels.

**Architecture:** Each engine gets a detail panel component opened via `useCreativeLayout().setContextPanelContent()`. Dashboard hook expands to query engine tables in the existing `Promise.all`. Cross-entity navigation uses a shared `CollapsibleEngineSection` wrapping per-entity hook data. Enrichment execution happens via a Supabase Edge Function invoked after run row creation.

**Tech Stack:** React 18, TypeScript, TanStack React Query, Supabase (client + Edge Functions/Deno), shadcn/ui, Tailwind CSS, Lucide icons.

---

## Task 1: Style Intelligence — Similarity Hook

**Files:**
- Modify: `src/hooks/useStyleAnalyses.ts` (add `useStyleSimilarity` hook at end of file)

**Step 1: Add the `useStyleSimilarity` hook**

Append to `src/hooks/useStyleAnalyses.ts`:

```ts
export function useStyleSimilarity(analysisId: string | null) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery({
    queryKey: ['style-similarity', orgId ?? '', analysisId ?? ''],
    enabled: !!orgId && !!analysisId,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('match_style_analyses', {
        query_analysis_id: analysisId,
        match_count: 10,
      });
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        client_id: string | null;
        portfolio_id: string | null;
        similarity: number;
        color_palette: unknown;
        confidence_score: number | null;
      }>;
    },
  });
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No new errors from this file.

**Step 3: Commit**

```bash
git add src/hooks/useStyleAnalyses.ts
git commit -m "feat(style): add useStyleSimilarity hook calling match_style_analyses RPC"
```

---

## Task 2: Style Intelligence — Similarity Results Component

**Files:**
- Create: `src/components/creative/style/StyleSimilarityResults.tsx`

**Step 1: Create the component**

```tsx
import { Badge } from '@/components/ui/badge';
import { useStyleSimilarity } from '@/hooks/useStyleAnalyses';

interface StyleSimilarityResultsProps {
  analysisId: string | null;
}

export function StyleSimilarityResults({ analysisId }: StyleSimilarityResultsProps) {
  const { data: results = [], isLoading } = useStyleSimilarity(analysisId);

  if (!analysisId) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        Select a style analysis and click "Find Similar" to search for matches.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4 animate-pulse">
            <div className="h-4 w-3/4 bg-muted rounded mb-2" />
            <div className="h-3 w-1/2 bg-muted/60 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        No embeddings available. Similarity search requires style analysis embeddings to be populated.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((r) => {
        const palette = Array.isArray(r.color_palette) ? (r.color_palette as string[]) : [];
        const pct = Math.round(r.similarity * 100);
        return (
          <div key={r.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium truncate">
                {r.client_id ? `Client ${r.client_id.slice(0, 8)}…` : r.portfolio_id ? `Portfolio ${r.portfolio_id.slice(0, 8)}…` : 'Unknown'}
              </span>
              <Badge variant="secondary" className={pct >= 80 ? 'bg-green-100 text-green-800' : pct >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}>
                {pct}% match
              </Badge>
            </div>
            {palette.length > 0 && (
              <div className="flex gap-1">
                {palette.slice(0, 6).map((color, i) => (
                  <div
                    key={i}
                    className="h-6 w-6 rounded-full border border-border"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

**Step 3: Commit**

```bash
git add src/components/creative/style/StyleSimilarityResults.tsx
git commit -m "feat(style): add StyleSimilarityResults component with palette previews"
```

---

## Task 3: Style Intelligence — Wire Similarity Tab into CreativeStyle

**Files:**
- Modify: `src/pages/creative/CreativeStyle.tsx`
- Modify: `src/components/creative/style/StyleAnalysisDetail.tsx`

**Step 1: Add Similarity tab and "Find Similar" button**

In `CreativeStyle.tsx`:
- Add `useState` for `similarityAnalysisId: string | null`
- Wrap the existing content in a `<Tabs>` with two tabs: "Analyses" (existing) and "Similarity" (new)
- Import and render `<StyleSimilarityResults analysisId={similarityAnalysisId} />` in the Similarity tab

In `StyleAnalysisDetail.tsx`:
- Accept a new optional prop `onFindSimilar?: (id: string) => void`
- Add a "Find Similar" button after the source URL section that calls `onFindSimilar?.(analysis.id)`

**Step 2: Edit `CreativeStyle.tsx`**

Add imports at top:
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StyleSimilarityResults } from '@/components/creative/style/StyleSimilarityResults';
```

Add state:
```tsx
const [similarityAnalysisId, setSimilarityAnalysisId] = useState<string | null>(null);
const [activeTab, setActiveTab] = useState('analyses');
```

Wrap the inner content of `<WorkspaceContainer>` in:
```tsx
<Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
  <TabsList>
    <TabsTrigger value="analyses">Analyses</TabsTrigger>
    <TabsTrigger value="similarity">Similarity</TabsTrigger>
  </TabsList>
  <TabsContent value="analyses" className="mt-4">
    {/* existing ViewSwitcher + table/cards content here */}
  </TabsContent>
  <TabsContent value="similarity" className="mt-4">
    <StyleSimilarityResults analysisId={similarityAnalysisId} />
  </TabsContent>
</Tabs>
```

Update the `handleRowClick` to also pass `onFindSimilar`:
```tsx
function handleRowClick(analysis: StyleAnalysis) {
  setContextPanelContent(
    <StyleAnalysisDetail
      analysis={analysis}
      onClose={() => { setContextPanelOpen(false); setContextPanelContent(null); }}
      onFindSimilar={(id) => { setSimilarityAnalysisId(id); setActiveTab('similarity'); }}
    />
  );
  setContextPanelOpen(true);
}
```

**Step 3: Edit `StyleAnalysisDetail.tsx`**

Add `onFindSimilar` to props interface:
```tsx
interface StyleAnalysisDetailProps {
  analysis: StyleAnalysis;
  onClose: () => void;
  onFindSimilar?: (id: string) => void;
}
```

After the source URL section (before metadata footer), add:
```tsx
{onFindSimilar && (
  <Button variant="outline" size="sm" className="w-full" onClick={() => onFindSimilar(analysis.id)}>
    Find Similar Styles
  </Button>
)}
```

Import `Button` from `@/components/ui/button` if not already imported.

**Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

**Step 5: Commit**

```bash
git add src/pages/creative/CreativeStyle.tsx src/components/creative/style/StyleAnalysisDetail.tsx
git commit -m "feat(style): add Similarity tab and Find Similar button to style page"
```

---

## Task 4: Signal Engine — SignalDetail Component

**Files:**
- Create: `src/components/creative/signals/SignalDetail.tsx`

**Step 1: Create the component**

Reference the existing `SignalCard.tsx` patterns (severity colors, status badges, `getTimeAgo`).

```tsx
import type { Signal } from '@/types/signal-engine';
import { SIGNAL_SEVERITY_LABELS, SIGNAL_SEVERITY_COLORS, SIGNAL_STATUS_LABELS, SIGNAL_STATUS_COLORS } from '@/types/signal-engine';
import { useUpdateSignalStatus } from '@/hooks/useSignals';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, CheckCircle2, XCircle } from 'lucide-react';

interface SignalDetailProps {
  signal: Signal;
  onClose: () => void;
}

function getTimeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function SignalDetail({ signal, onClose }: SignalDetailProps) {
  const updateStatus = useUpdateSignalStatus();

  const severityColors = SIGNAL_SEVERITY_COLORS[signal.severity];
  const statusColors = SIGNAL_STATUS_COLORS[signal.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">{signal.title}</h2>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className={`${severityColors.bg} ${severityColors.text} border-0`}>
            {SIGNAL_SEVERITY_LABELS[signal.severity]}
          </Badge>
          <Badge variant="secondary" className={`${statusColors.bg} ${statusColors.text} border-0`}>
            {SIGNAL_STATUS_LABELS[signal.status]}
          </Badge>
        </div>
      </div>

      {/* Description */}
      {signal.description && (
        <div>
          <h3 className="text-sm font-medium mb-1">Description</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{signal.description}</p>
        </div>
      )}

      {/* Entity info */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Entity Type</span>
          <span className="font-medium capitalize">{signal.entityType}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Entity ID</span>
          <span className="font-mono text-xs">{signal.entityId}</span>
        </div>
        {signal.ruleName && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Matched Rule</span>
            <span className="font-medium">{signal.ruleName}</span>
          </div>
        )}
      </div>

      {/* Timestamps */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Created</span>
          <span>{getTimeAgo(signal.createdAt)}</span>
        </div>
        {signal.seenAt && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Seen</span>
            <span>{getTimeAgo(signal.seenAt)}</span>
          </div>
        )}
        {signal.actionedAt && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Actioned</span>
            <span>{getTimeAgo(signal.actionedAt)}</span>
          </div>
        )}
      </div>

      {/* Data payload */}
      {signal.data && Object.keys(signal.data).length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Data</h3>
          <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-48">
            {JSON.stringify(signal.data, null, 2)}
          </pre>
        </div>
      )}

      {/* Action buttons — always visible */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={() => updateStatus.mutate({ id: signal.id, status: 'seen' })}
          disabled={updateStatus.isPending}
        >
          <Eye className="h-3.5 w-3.5" /> Mark Seen
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={() => updateStatus.mutate({ id: signal.id, status: 'actioned' })}
          disabled={updateStatus.isPending}
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> Action
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={() => updateStatus.mutate({ id: signal.id, status: 'dismissed' })}
          disabled={updateStatus.isPending}
        >
          <XCircle className="h-3.5 w-3.5" /> Dismiss
        </Button>
      </div>
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

**Step 3: Commit**

```bash
git add src/components/creative/signals/SignalDetail.tsx
git commit -m "feat(signals): add SignalDetail context panel component"
```

---

## Task 5: Signal Engine — Wire SignalDetail into CreativeSignals

**Files:**
- Modify: `src/pages/creative/CreativeSignals.tsx`

**Step 1: Add context panel integration**

Add imports:
```tsx
import { useCreativeLayout } from '@/components/creative/layout/CreativeLayout';
import { SignalDetail } from '@/components/creative/signals/SignalDetail';
import type { Signal } from '@/types/signal-engine';
```

Add layout hook and handler:
```tsx
const { setContextPanelOpen, setContextPanelContent } = useCreativeLayout();

function handleSignalClick(signal: Signal) {
  setContextPanelContent(
    <SignalDetail
      signal={signal}
      onClose={() => {
        setContextPanelOpen(false);
        setContextPanelContent(null);
      }}
    />
  );
  setContextPanelOpen(true);
}
```

Wrap each `<SignalCard>` in the signal feed with a clickable div:
```tsx
signals.map((signal) => (
  <div
    key={signal.id}
    className="cursor-pointer"
    onClick={() => handleSignalClick(signal)}
  >
    <SignalCard signal={signal} />
  </div>
))
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

**Step 3: Commit**

```bash
git add src/pages/creative/CreativeSignals.tsx
git commit -m "feat(signals): wire signal feed cards to open SignalDetail in context panel"
```

---

## Task 6: Enrichment Engine — RunNowDialog Component

**Files:**
- Create: `src/components/creative/enrichment/RunNowDialog.tsx`

**Step 1: Create the dialog component**

Simple dialog asking for entity type + comma-separated UUIDs:

```tsx
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTriggerEnrichmentRun } from '@/hooks/useEnrichmentEngine';
import { useToast } from '@/components/ui/use-toast';
import type { EnrichmentRecipe } from '@/types/enrichment-engine';

interface RunNowDialogProps {
  recipe: EnrichmentRecipe;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RunNowDialog({ recipe, open, onOpenChange }: RunNowDialogProps) {
  const [entityType, setEntityType] = useState<string>(recipe.targetType);
  const [entityIds, setEntityIds] = useState('');
  const triggerRun = useTriggerEnrichmentRun();
  const { toast } = useToast();

  async function handleSubmit() {
    const ids = entityIds
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      toast({ title: 'Error', description: 'Enter at least one entity ID', variant: 'destructive' });
      return;
    }

    try {
      await triggerRun.mutateAsync({
        recipeId: recipe.id,
        entityType: entityType as 'client' | 'contact' | 'project',
        entityIds: ids,
      });
      toast({ title: 'Enrichment run started' });
      onOpenChange(false);
      setEntityIds('');
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Run "{recipe.name}"</DialogTitle>
          <DialogDescription>Select entity type and enter the IDs to enrich.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Entity Type</Label>
            <Select value={entityType} onValueChange={setEntityType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="contact">Contact</SelectItem>
                <SelectItem value="project">Project</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Entity IDs (comma-separated UUIDs)</Label>
            <Input
              placeholder="uuid-1, uuid-2, ..."
              value={entityIds}
              onChange={(e) => setEntityIds(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={triggerRun.isPending}>
            {triggerRun.isPending ? 'Starting…' : 'Run Now'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

**Step 3: Commit**

```bash
git add src/components/creative/enrichment/RunNowDialog.tsx
git commit -m "feat(enrichment): add RunNowDialog component for triggering enrichment runs"
```

---

## Task 7: Enrichment Engine — RunDetail Component

**Files:**
- Create: `src/components/creative/enrichment/RunDetail.tsx`

**Step 1: Create the component**

```tsx
import type { EnrichmentRun } from '@/types/enrichment-engine';
import { ENRICHMENT_RUN_STATUS_LABELS, ENRICHMENT_RUN_STATUS_COLORS } from '@/types/enrichment-engine';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface RunDetailProps {
  run: EnrichmentRun;
  onClose: () => void;
}

function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt) return '—';
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const seconds = Math.round((end - start) / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export function RunDetail({ run, onClose }: RunDetailProps) {
  const statusColors = ENRICHMENT_RUN_STATUS_COLORS[run.status];
  const results = run.results as Record<string, unknown> | null;
  const errorLog = run.errorLog as Record<string, unknown> | null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Enrichment Run</h2>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className={`${statusColors.bg} ${statusColors.text} border-0`}>
            {ENRICHMENT_RUN_STATUS_LABELS[run.status]}
          </Badge>
          <span className="text-xs text-muted-foreground capitalize">{run.entityType}</span>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Recipe ID</span>
          <span className="font-mono text-xs">{run.recipeId.slice(0, 8)}…</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Entity Count</span>
          <span>{run.entityIds.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Credits Used</span>
          <span>{run.creditsUsed}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Duration</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(run.startedAt, run.completedAt)}
          </span>
        </div>
      </div>

      {/* Entity IDs */}
      <div>
        <h3 className="text-sm font-medium mb-2">Entity IDs</h3>
        <div className="space-y-1">
          {run.entityIds.map((id, i) => (
            <div key={i} className="text-xs font-mono bg-muted px-2 py-1 rounded">{id}</div>
          ))}
        </div>
      </div>

      {/* Results */}
      {results && Object.keys(results).length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-green-600" /> Results
          </h3>
          <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-48">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}

      {/* Errors */}
      {errorLog && Object.keys(errorLog).length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-destructive" /> Errors
          </h3>
          <pre className="text-xs bg-destructive/5 text-destructive p-3 rounded-lg overflow-auto max-h-48">
            {JSON.stringify(errorLog, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

**Step 3: Commit**

```bash
git add src/components/creative/enrichment/RunDetail.tsx
git commit -m "feat(enrichment): add RunDetail context panel component"
```

---

## Task 8: Enrichment Engine — Supabase Edge Function

**Files:**
- Create: `supabase/functions/process-enrichment-run/index.ts`

**Step 1: Create the Edge Function**

```ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { runId } = await req.json();
    if (!runId) {
      return new Response(JSON.stringify({ error: 'runId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch the run
    const { data: run, error: runError } = await supabase
      .from('enrichment_runs')
      .select('*')
      .eq('id', runId)
      .single();

    if (runError || !run) {
      return new Response(JSON.stringify({ error: 'Run not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Mark as running
    await supabase
      .from('enrichment_runs')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', runId);

    // 3. Fetch the recipe
    const { data: recipe, error: recipeError } = await supabase
      .from('enrichment_recipes')
      .select('*')
      .eq('id', run.recipe_id)
      .single();

    if (recipeError || !recipe) {
      await supabase
        .from('enrichment_runs')
        .update({
          status: 'failed',
          error_log: { message: 'Recipe not found' },
          completed_at: new Date().toISOString(),
        })
        .eq('id', runId);
      return new Response(JSON.stringify({ error: 'Recipe not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const steps = Array.isArray(recipe.steps) ? recipe.steps : [];
    const entityIds: string[] = Array.isArray(run.entity_ids) ? run.entity_ids : [];
    const entityType: string = run.entity_type;

    // Resolve table name
    const tableMap: Record<string, string> = {
      client: 'creative_clients',
      contact: 'creative_contacts',
      project: 'creative_projects',
    };
    const tableName = tableMap[entityType];

    const results: Record<string, unknown> = {};
    const errors: Record<string, string> = {};
    let creditsUsed = 0;

    // 4. Process each entity
    for (const entityId of entityIds) {
      try {
        // Fetch entity
        const { data: entity } = tableName
          ? await supabase.from(tableName).select('*').eq('id', entityId).single()
          : { data: null };

        const entityResults: Record<string, unknown> = {};

        // Process each step
        for (const step of steps) {
          const stepType = (step as Record<string, unknown>).type as string;

          if (stepType === 'fetch_url_metadata') {
            const url = entity?.website ?? entity?.linkedin_url;
            if (url) {
              try {
                const resp = await fetch(url, {
                  headers: { 'User-Agent': 'Polsya-Enrichment/1.0' },
                  redirect: 'follow',
                  signal: AbortSignal.timeout(10000),
                });
                const html = await resp.text();
                const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
                const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i);
                const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["'](.*?)["']/i);

                entityResults[stepType] = {
                  title: titleMatch?.[1] ?? null,
                  description: descMatch?.[1] ?? null,
                  ogImage: ogImageMatch?.[1] ?? null,
                  statusCode: resp.status,
                };
                creditsUsed += 1;
              } catch (fetchErr) {
                entityResults[stepType] = { error: (fetchErr as Error).message };
              }
            } else {
              entityResults[stepType] = { skipped: 'no URL found on entity' };
            }
          } else if (stepType === 'enrich_from_source') {
            const { data: mapping } = await supabase
              .from('entity_source_mappings')
              .select('source_data')
              .eq('entity_id', entityId)
              .eq('entity_type', entityType)
              .order('last_synced_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            entityResults[stepType] = mapping?.source_data ?? { skipped: 'no source mapping found' };
            if (mapping) creditsUsed += 1;
          } else if (stepType === 'compute_style') {
            const { data: styleRow } = await supabase
              .from('creative_style_analyses')
              .insert({
                client_id: entityType === 'client' ? entityId : null,
                portfolio_id: null,
                source_url: entity?.website ?? null,
                confidence_score: 0,
                color_palette: [],
                typography_profile: {},
                brand_attributes: [],
                organization_id: run.organization_id,
              })
              .select('id')
              .single();

            entityResults[stepType] = { styleAnalysisId: styleRow?.id ?? null };
            creditsUsed += 1;
          } else {
            entityResults[stepType] = { skipped: `unknown step type: ${stepType}` };
          }
        }

        results[entityId] = entityResults;
      } catch (entityErr) {
        errors[entityId] = (entityErr as Error).message;
      }
    }

    // 5. Deduct credits
    if (creditsUsed > 0 && recipe.provider) {
      await supabase.rpc('increment_used_credits', {
        p_provider: recipe.provider,
        p_org_id: run.organization_id,
        p_amount: creditsUsed,
      }).catch(() => {
        // Credit deduction is best-effort; log but don't fail the run
      });
    }

    // 6. Complete
    const finalStatus = Object.keys(errors).length > 0 ? 'failed' : 'completed';
    await supabase
      .from('enrichment_runs')
      .update({
        status: finalStatus,
        results,
        error_log: Object.keys(errors).length > 0 ? errors : null,
        credits_used: creditsUsed,
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);

    return new Response(
      JSON.stringify({ status: finalStatus, creditsUsed, entityCount: entityIds.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

**Step 2: Commit**

```bash
git add supabase/functions/process-enrichment-run/index.ts
git commit -m "feat(enrichment): add process-enrichment-run Edge Function with real execution"
```

---

## Task 9: Enrichment Engine — Modify useTriggerEnrichmentRun to Call Edge Function

**Files:**
- Modify: `src/hooks/useEnrichmentEngine.ts`

**Step 1: Update `useTriggerEnrichmentRun`**

Find the `useTriggerEnrichmentRun` mutation function. After the run row insert succeeds:

1. Ensure the insert returns the row by adding `.select('*').single()` if not already there
2. After insert, add: `await supabase.functions.invoke('process-enrichment-run', { body: { runId: insertedRun.id } })`
3. Handle invoke errors gracefully (toast but don't throw — run is already created)

The mutation function should look like:
```ts
mutationFn: async ({ recipeId, entityType, entityIds }: { recipeId: string; entityType: string; entityIds: string[] }) => {
  const { data: run, error } = await (supabase.from as any)('enrichment_runs')
    .insert({
      recipe_id: recipeId,
      entity_type: entityType,
      entity_ids: entityIds,
      status: 'pending',
      credits_used: 0,
      organization_id: orgId!,
    })
    .select('*')
    .single();

  if (error) throw error;

  // Fire-and-forget Edge Function invocation
  supabase.functions.invoke('process-enrichment-run', {
    body: { runId: run.id },
  }).catch((err: Error) => {
    console.error('Edge Function invocation failed:', err.message);
  });

  return run;
},
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

**Step 3: Commit**

```bash
git add src/hooks/useEnrichmentEngine.ts
git commit -m "feat(enrichment): invoke process-enrichment-run Edge Function after run creation"
```

---

## Task 10: Enrichment Engine — Add Run Now Button to Recipe Columns + Wire RunDetail

**Files:**
- Modify: `src/components/creative/enrichment/recipe-columns.tsx`
- Modify: `src/pages/creative/CreativeEnrichment.tsx`

**Step 1: Add "Run Now" action to recipe-columns.tsx**

The `recipeColumns` definition needs a new action column. Since we can't pass callbacks through static column defs, convert to a factory function:

Change `export const recipeColumns` to `export function createRecipeColumns(onRunNow: (recipe: EnrichmentRecipe) => void)`.

Add an actions column at the end with a "Run Now" button:
```tsx
{
  id: 'actions',
  cell: ({ row }) => (
    <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => onRunNow(row.original)}>
      <Play className="h-3.5 w-3.5" /> Run
    </Button>
  ),
}
```

Import `Play` from `lucide-react` and `Button` from `@/components/ui/button`.

**Step 2: Update CreativeEnrichment.tsx**

- Import `RunNowDialog`, `RunDetail`, `useCreativeLayout`
- Add state: `runNowRecipe`, `runNowOpen`
- Use `useMemo` to create columns: `const recipeCols = useMemo(() => createRecipeColumns((recipe) => { setRunNowRecipe(recipe); setRunNowOpen(true); }), []);`
- Add context panel handler for run rows:
```tsx
function handleRunClick(run: EnrichmentRun) {
  setContextPanelContent(
    <RunDetail run={run} onClose={() => { setContextPanelOpen(false); setContextPanelContent(null); }} />
  );
  setContextPanelOpen(true);
}
```
- Pass `onRowClick={handleRunClick}` to the runs DataTable
- Add `<RunNowDialog>` at the bottom of the component

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

**Step 4: Commit**

```bash
git add src/components/creative/enrichment/recipe-columns.tsx src/pages/creative/CreativeEnrichment.tsx src/components/creative/enrichment/RunNowDialog.tsx src/components/creative/enrichment/RunDetail.tsx
git commit -m "feat(enrichment): add Run Now button on recipes and RunDetail context panel"
```

---

## Task 11: Entity Resolution — CandidateDetail Component

**Files:**
- Create: `src/components/creative/resolution/CandidateDetail.tsx`

**Step 1: Create the component**

```tsx
import type { ResolutionCandidate } from '@/types/entity-resolution';
import { RESOLUTION_STATUS_LABELS, RESOLUTION_STATUS_COLORS } from '@/types/entity-resolution';
import { useResolveCandidate } from '@/hooks/useEntityResolution';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface CandidateDetailProps {
  candidate: ResolutionCandidate;
  onClose: () => void;
}

export function CandidateDetail({ candidate, onClose }: CandidateDetailProps) {
  const resolveMutation = useResolveCandidate();
  const statusColors = RESOLUTION_STATUS_COLORS[candidate.status];
  const confidencePct = Math.round(candidate.confidenceScore * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Resolution Candidate</h2>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className={`${statusColors.bg} ${statusColors.text} border-0`}>
            {RESOLUTION_STATUS_LABELS[candidate.status]}
          </Badge>
          <Badge variant="secondary" className={
            confidencePct >= 80 ? 'bg-green-100 text-green-800 border-0'
              : confidencePct >= 50 ? 'bg-amber-100 text-amber-800 border-0'
                : 'bg-gray-100 text-gray-800 border-0'
          }>
            {confidencePct}% confidence
          </Badge>
        </div>
      </div>

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase">Entity A</h3>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="capitalize">{candidate.entityAType}</span>
            </div>
            <div className="text-xs font-mono break-all">{candidate.entityAId}</div>
          </div>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase">Entity B</h3>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="capitalize">{candidate.entityBType}</span>
            </div>
            <div className="text-xs font-mono break-all">{candidate.entityBId}</div>
          </div>
        </div>
      </div>

      {/* Match reasons */}
      {candidate.matchReasons.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Match Reasons</h3>
          <div className="flex flex-wrap gap-1">
            {candidate.matchReasons.map((reason, i) => (
              <Badge key={i} variant="outline" className="text-xs">{reason}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Detected</span>
          <span>{new Date(candidate.createdAt).toLocaleDateString()}</span>
        </div>
        {candidate.resolvedAt && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Resolved</span>
            <span>{new Date(candidate.resolvedAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 text-green-700"
          onClick={() => resolveMutation.mutate({ id: candidate.id, status: 'confirmed' })}
          disabled={resolveMutation.isPending}
        >
          <Check className="h-3.5 w-3.5" /> Confirm Merge
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 text-destructive"
          onClick={() => resolveMutation.mutate({ id: candidate.id, status: 'rejected' })}
          disabled={resolveMutation.isPending}
        >
          <X className="h-3.5 w-3.5" /> Reject
        </Button>
      </div>
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

**Step 3: Commit**

```bash
git add src/components/creative/resolution/CandidateDetail.tsx
git commit -m "feat(resolution): add CandidateDetail context panel with side-by-side comparison"
```

---

## Task 12: Entity Resolution — Wire CandidateDetail into CreativeResolution

**Files:**
- Modify: `src/pages/creative/CreativeResolution.tsx`

**Step 1: Add context panel integration**

Add imports:
```tsx
import { useCreativeLayout } from '@/components/creative/layout/CreativeLayout';
import { CandidateDetail } from '@/components/creative/resolution/CandidateDetail';
import type { ResolutionCandidate } from '@/types/entity-resolution';
```

Add handler:
```tsx
const { setContextPanelOpen, setContextPanelContent } = useCreativeLayout();

function handleCandidateClick(candidate: ResolutionCandidate) {
  setContextPanelContent(
    <CandidateDetail
      candidate={candidate}
      onClose={() => { setContextPanelOpen(false); setContextPanelContent(null); }}
    />
  );
  setContextPanelOpen(true);
}
```

Pass `onRowClick={handleCandidateClick}` to the candidates DataTable.

Add `onClick={() => handleCandidateClick(candidate)}` to each `<CandidateCard>` wrapper in cards view.

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

**Step 3: Commit**

```bash
git add src/pages/creative/CreativeResolution.tsx
git commit -m "feat(resolution): wire candidate rows/cards to open CandidateDetail in context panel"
```

---

## Task 13: Dashboard — Expand useCreativeDashboard Hook

**Files:**
- Modify: `src/hooks/useCreativeDashboard.ts`

**Step 1: Add engine stats to the hook**

Expand `DashboardStats` interface (after line 12):
```ts
newSignals: number;
activeRules: number;
pendingResolutions: number;
remainingCredits: number;
```

Add 4 queries to the `Promise.all` (after `oppsRes`):
```ts
const [clientsRes, projectsRes, oppsRes, signalsRes, rulesRes, resolutionRes, creditsRes] = await Promise.all([
  // existing 3...
  (supabase.from as any)('creative_signals').select('id', { count: 'exact', head: true }).eq('organization_id', orgId!).eq('status', 'new'),
  (supabase.from as any)('creative_signal_rules').select('id', { count: 'exact', head: true }).eq('organization_id', orgId!).eq('is_active', true),
  (supabase.from as any)('entity_resolution_candidates').select('id', { count: 'exact', head: true }).eq('organization_id', orgId!).eq('status', 'pending'),
  (supabase.from as any)('enrichment_credits').select('total_credits, used_credits').eq('organization_id', orgId!),
]);
```

Compute remaining credits:
```ts
const creditRows: { total_credits: number; used_credits: number }[] = creditsRes.data ?? [];
const remainingCredits = creditRows.reduce((sum, c) => sum + (c.total_credits - c.used_credits), 0);
```

Add to return object:
```ts
newSignals: signalsRes.count ?? 0,
activeRules: rulesRes.count ?? 0,
pendingResolutions: resolutionRes.count ?? 0,
remainingCredits,
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

**Step 3: Commit**

```bash
git add src/hooks/useCreativeDashboard.ts
git commit -m "feat(dashboard): expand useCreativeDashboard with engine stats queries"
```

---

## Task 14: Dashboard — Add useRecentSignals Hook

**Files:**
- Modify: `src/hooks/useSignals.ts` (add `useRecentSignals` at end of file)

**Step 1: Add the hook**

```ts
export function useRecentSignals(limit: number = 5) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery({
    queryKey: [...signalKeys.signals, 'recent', limit],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('creative_signals')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return toSignals(data ?? []);
    },
  });
}
```

Ensure `toSignals` is imported from `@/services/signalService` (it should already be imported).

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

**Step 3: Commit**

```bash
git add src/hooks/useSignals.ts
git commit -m "feat(dashboard): add useRecentSignals hook"
```

---

## Task 15: Dashboard — Update CreativeDashboard.tsx with Engine Metrics + Live Data

**Files:**
- Modify: `src/pages/creative/CreativeDashboard.tsx`

**Step 1: Add engine metrics row and replace placeholders**

Add imports:
```tsx
import { Zap, Shield, GitMerge, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRecentSignals } from '@/hooks/useSignals';
import { useResolutionCandidates } from '@/hooks/useEntityResolution';
import { SIGNAL_SEVERITY_COLORS } from '@/types/signal-engine';
```

Add hooks inside the component:
```tsx
const { data: recentSignals = [] } = useRecentSignals(5);
const { data: pendingCandidates = [] } = useResolutionCandidates('pending');
```

Extract new stats:
```tsx
const newSignals = data?.newSignals ?? 0;
const activeRules = data?.activeRules ?? 0;
const pendingResolutions = data?.pendingResolutions ?? 0;
const remainingCredits = data?.remainingCredits ?? 0;
```

After the CRM metrics row, before Stage Breakdown, add engine metrics row:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
  <MetricCard icon={Zap} label="New Signals" value={String(newSignals)} trend="Unread" loading={isLoading} />
  <MetricCard icon={Shield} label="Active Rules" value={String(activeRules)} trend="Monitoring" loading={isLoading} />
  <MetricCard icon={GitMerge} label="Pending Merges" value={String(pendingResolutions)} trend="Awaiting review" loading={isLoading} />
  <MetricCard icon={Layers} label="Enrichment Credits" value={String(remainingCredits)} trend="Remaining" loading={isLoading} />
</div>
```

Replace the "Recent Activity" placeholder (lines 101-108) with:
```tsx
<div className="rounded-lg border bg-card p-6">
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <Activity className="h-5 w-5 text-muted-foreground" />
      <h2 className="text-lg font-semibold">Recent Signals</h2>
    </div>
    <Link to="/creative/signals" className="text-sm text-primary hover:underline">View all &rarr;</Link>
  </div>
  {recentSignals.length === 0 ? (
    <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
      No signals yet. Signals appear when rules are triggered.
    </div>
  ) : (
    <div className="space-y-2">
      {recentSignals.map((signal) => {
        const sevColors = SIGNAL_SEVERITY_COLORS[signal.severity];
        return (
          <div key={signal.id} className="flex items-center gap-3 py-1.5">
            <div className={`h-2 w-2 rounded-full ${sevColors.bg}`} />
            <span className="text-sm flex-1 truncate">{signal.title}</span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(signal.createdAt).toLocaleDateString()}
            </span>
          </div>
        );
      })}
    </div>
  )}
</div>
```

Replace the "Signals" placeholder (lines 111-118) with:
```tsx
<div className="rounded-lg border bg-card p-6">
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <GitMerge className="h-5 w-5 text-muted-foreground" />
      <h2 className="text-lg font-semibold">Pending Resolutions</h2>
    </div>
    <Link to="/creative/resolution" className="text-sm text-primary hover:underline">View all &rarr;</Link>
  </div>
  {pendingCandidates.length === 0 ? (
    <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
      No pending resolutions. Candidates appear when duplicates are detected.
    </div>
  ) : (
    <div className="space-y-3">
      {pendingCandidates.slice(0, 3).map((c) => (
        <div key={c.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
          <div className="text-sm">
            <span className="capitalize">{c.entityAType}</span>
            <span className="text-muted-foreground mx-1.5">vs</span>
            <span className="capitalize">{c.entityBType}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {Math.round(c.confidenceScore * 100)}%
          </Badge>
        </div>
      ))}
    </div>
  )}
</div>
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

**Step 3: Commit**

```bash
git add src/pages/creative/CreativeDashboard.tsx
git commit -m "feat(dashboard): add engine metrics row and replace placeholders with live data"
```

---

## Task 16: Cross-Entity — CollapsibleEngineSection Component

**Files:**
- Create: `src/components/creative/shared/CollapsibleEngineSection.tsx`

**Step 1: Create the component**

```tsx
import type { LucideIcon } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CollapsibleEngineSectionProps {
  icon: LucideIcon;
  label: string;
  count: number;
  isLoading: boolean;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleEngineSection({
  icon: Icon,
  label,
  count,
  isLoading,
  children,
  defaultOpen = false,
}: CollapsibleEngineSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 text-sm font-medium hover:text-foreground text-muted-foreground transition-colors">
        <ChevronRight className={cn('h-4 w-4 transition-transform', open && 'rotate-90')} />
        <Icon className="h-4 w-4" />
        <span className="flex-1 text-left">{label}</span>
        {isLoading ? (
          <div className="h-5 w-8 rounded-full bg-muted animate-pulse" />
        ) : (
          <Badge variant="secondary" className="text-xs">{count}</Badge>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-8 pb-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

**Step 3: Commit**

```bash
git add src/components/creative/shared/CollapsibleEngineSection.tsx
git commit -m "feat(shared): add CollapsibleEngineSection component for cross-entity navigation"
```

---

## Task 17: Cross-Entity — useResolutionCandidatesForEntity Hook

**Files:**
- Modify: `src/hooks/useEntityResolution.ts`

**Step 1: Add the hook**

Append to the file:

```ts
export function useResolutionCandidatesForEntity(entityType: string, entityId: string) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery({
    queryKey: ['resolution-candidates', 'entity', orgId ?? '', entityType, entityId],
    enabled: !!orgId && !!entityId,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('entity_resolution_candidates')
        .select('*')
        .eq('organization_id', orgId!)
        .or(`entity_a_id.eq.${entityId},entity_b_id.eq.${entityId}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return toResolutionCandidates(data ?? []);
    },
  });
}
```

Ensure `toResolutionCandidates` is imported from `@/services/entityResolutionService`.

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

**Step 3: Commit**

```bash
git add src/hooks/useEntityResolution.ts
git commit -m "feat(resolution): add useResolutionCandidatesForEntity hook with .or() filter"
```

---

## Task 18: Cross-Entity — Enhance ClientDetail with Engine Sections

**Files:**
- Modify: `src/components/creative/clients/ClientDetail.tsx`

**Step 1: Add engine sections**

Add imports:
```tsx
import { Zap, Palette, GitMerge } from 'lucide-react';
import { CollapsibleEngineSection } from '@/components/creative/shared/CollapsibleEngineSection';
import { useSignals } from '@/hooks/useSignals';
import { useStyleAnalyses } from '@/hooks/useStyleAnalyses';
import { useResolutionCandidatesForEntity } from '@/hooks/useEntityResolution';
import { SIGNAL_SEVERITY_COLORS } from '@/types/signal-engine';
import { Link } from 'react-router-dom';
```

Add hooks inside the component:
```tsx
const { data: signals = [], isLoading: signalsLoading } = useSignals({ entityType: 'client', entityId: client.id });
const { data: analyses = [], isLoading: analysesLoading } = useStyleAnalyses(client.id);
const { data: candidates = [], isLoading: candidatesLoading } = useResolutionCandidatesForEntity('client', client.id);
```

After the Tags section (after the closing `)}` for tags, before the Metadata `<div>`), add:

```tsx
{/* Engine sections */}
<div className="space-y-1">
  <CollapsibleEngineSection icon={Zap} label="Signals" count={signals.length} isLoading={signalsLoading}>
    {signals.length === 0 ? (
      <p className="text-xs text-muted-foreground py-2">No signals for this client.</p>
    ) : (
      <div className="space-y-1">
        {signals.slice(0, 5).map((s) => {
          const sevColors = SIGNAL_SEVERITY_COLORS[s.severity];
          return (
            <Link key={s.id} to="/creative/signals" className="flex items-center gap-2 py-1 text-sm hover:text-foreground text-muted-foreground">
              <div className={`h-2 w-2 rounded-full ${sevColors.bg}`} />
              <span className="truncate flex-1">{s.title}</span>
            </Link>
          );
        })}
      </div>
    )}
  </CollapsibleEngineSection>

  <CollapsibleEngineSection icon={Palette} label="Style Analyses" count={analyses.length} isLoading={analysesLoading}>
    {analyses.length === 0 ? (
      <p className="text-xs text-muted-foreground py-2">No style analyses for this client.</p>
    ) : (
      <div className="space-y-2">
        {analyses.slice(0, 3).map((a) => (
          <Link key={a.id} to="/creative/style" className="flex items-center gap-2 py-1 hover:bg-muted/50 rounded px-1">
            <div className="flex gap-0.5">
              {(a.colorPalette ?? []).slice(0, 4).map((c: string, i: number) => (
                <div key={i} className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{a.confidenceScore ? `${a.confidenceScore}%` : '—'}</span>
          </Link>
        ))}
      </div>
    )}
  </CollapsibleEngineSection>

  <CollapsibleEngineSection icon={GitMerge} label="Resolution Candidates" count={candidates.length} isLoading={candidatesLoading}>
    {candidates.length === 0 ? (
      <p className="text-xs text-muted-foreground py-2">No resolution candidates.</p>
    ) : (
      <div className="space-y-1">
        {candidates.slice(0, 3).map((c) => (
          <Link key={c.id} to="/creative/resolution" className="flex items-center justify-between py-1 text-sm hover:text-foreground text-muted-foreground">
            <span className="capitalize">{c.entityAType} vs {c.entityBType}</span>
            <span className="text-xs">{Math.round(c.confidenceScore * 100)}%</span>
          </Link>
        ))}
      </div>
    )}
  </CollapsibleEngineSection>
</div>
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

**Step 3: Commit**

```bash
git add src/components/creative/clients/ClientDetail.tsx
git commit -m "feat(clients): add Signals, Style Analyses, Resolution engine sections to ClientDetail"
```

---

## Task 19: Cross-Entity — Enhance ContactDetail with Engine Sections

**Files:**
- Modify: `src/components/creative/contacts/ContactDetail.tsx`

**Step 1: Add engine sections (2 sections — no style analyses for contacts)**

Add imports:
```tsx
import { Zap, GitMerge } from 'lucide-react';
import { CollapsibleEngineSection } from '@/components/creative/shared/CollapsibleEngineSection';
import { useSignals } from '@/hooks/useSignals';
import { useResolutionCandidatesForEntity } from '@/hooks/useEntityResolution';
import { SIGNAL_SEVERITY_COLORS } from '@/types/signal-engine';
import { Link } from 'react-router-dom';
```

Add hooks:
```tsx
const { data: signals = [], isLoading: signalsLoading } = useSignals({ entityType: 'contact', entityId: contact.id });
const { data: candidates = [], isLoading: candidatesLoading } = useResolutionCandidatesForEntity('contact', contact.id);
```

After Tags section, before Metadata footer, add:

```tsx
{/* Engine sections */}
<div className="space-y-1">
  <CollapsibleEngineSection icon={Zap} label="Signals" count={signals.length} isLoading={signalsLoading}>
    {signals.length === 0 ? (
      <p className="text-xs text-muted-foreground py-2">No signals for this contact.</p>
    ) : (
      <div className="space-y-1">
        {signals.slice(0, 5).map((s) => {
          const sevColors = SIGNAL_SEVERITY_COLORS[s.severity];
          return (
            <Link key={s.id} to="/creative/signals" className="flex items-center gap-2 py-1 text-sm hover:text-foreground text-muted-foreground">
              <div className={`h-2 w-2 rounded-full ${sevColors.bg}`} />
              <span className="truncate flex-1">{s.title}</span>
            </Link>
          );
        })}
      </div>
    )}
  </CollapsibleEngineSection>

  <CollapsibleEngineSection icon={GitMerge} label="Resolution Candidates" count={candidates.length} isLoading={candidatesLoading}>
    {candidates.length === 0 ? (
      <p className="text-xs text-muted-foreground py-2">No resolution candidates.</p>
    ) : (
      <div className="space-y-1">
        {candidates.slice(0, 3).map((c) => (
          <Link key={c.id} to="/creative/resolution" className="flex items-center justify-between py-1 text-sm hover:text-foreground text-muted-foreground">
            <span className="capitalize">{c.entityAType} vs {c.entityBType}</span>
            <span className="text-xs">{Math.round(c.confidenceScore * 100)}%</span>
          </Link>
        ))}
      </div>
    )}
  </CollapsibleEngineSection>
</div>
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

**Step 3: Commit**

```bash
git add src/components/creative/contacts/ContactDetail.tsx
git commit -m "feat(contacts): add Signals and Resolution engine sections to ContactDetail"
```

---

## Task 20: Final Verification

**Step 1: Run full TypeScript check**

Run: `npx tsc --noEmit`
Expected: Zero errors

**Step 2: Run production build**

Run: `npx vite build`
Expected: Build succeeds

**Step 3: Verify no regressions**

Run: `npx tsc --noEmit 2>&1 | wc -l`
Expected: 0 or just the success message

---

## File Summary

| Area | New Files | Modified Files |
|---|---|---|
| **Style Similarity** | `StyleSimilarityResults.tsx` | `useStyleAnalyses.ts`, `CreativeStyle.tsx`, `StyleAnalysisDetail.tsx` |
| **Signal Detail** | `SignalDetail.tsx` | `CreativeSignals.tsx` |
| **Enrichment Exec** | `RunNowDialog.tsx`, `RunDetail.tsx`, `process-enrichment-run/index.ts` | `useEnrichmentEngine.ts`, `recipe-columns.tsx`, `CreativeEnrichment.tsx` |
| **Resolution Detail** | `CandidateDetail.tsx` | `CreativeResolution.tsx` |
| **Dashboard** | — | `useCreativeDashboard.ts`, `useSignals.ts`, `CreativeDashboard.tsx` |
| **Cross-Entity** | `CollapsibleEngineSection.tsx` | `useEntityResolution.ts`, `ClientDetail.tsx`, `ContactDetail.tsx` |
