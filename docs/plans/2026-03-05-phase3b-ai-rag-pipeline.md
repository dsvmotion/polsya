# Phase 3B: AI RAG Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade the AI assistant with a full RAG pipeline — document ingestion (PDF/text/URL), pgvector semantic search, creative domain context, and credit-based billing enforcement.

**Architecture:** Async document ingestion via Supabase edge function. Documents uploaded to Storage, metadata in `ai_documents`, chunks + 1536-dim embeddings in `ai_document_chunks`. Enhanced `ai-chat-proxy` embeds user queries, retrieves top-5 matching chunks via `match_document_chunks()`, and injects them into the system prompt alongside full creative domain context. Credit-based usage tracking via `ai_usage_monthly` table, gated by `billing_plans` columns.

**Tech Stack:** Supabase (Storage, Edge Functions, pgvector), OpenAI `text-embedding-3-small`, TanStack React Query, react-hook-form + zod, shadcn/ui Sheet/Form/Badge, Deno `pdf-lib` for PDF parsing.

---

### Task 1: Database Migration — AI Documents + Chunks + Usage

**Files:**
- Create: `supabase/migrations/20260310100000_ai_rag_pipeline.sql`

**Step 1: Write the migration**

```sql
-- Phase 3B: AI RAG Pipeline — documents, chunks, embeddings, usage tracking

-- pgvector extension already enabled by creative_style_tables migration
-- Ensure it exists for safety
create extension if not exists vector with schema extensions;

-- ─── ai_documents ────────────────────────────────────────────────────
create table if not exists public.ai_documents (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title           text not null,
  source_type     text not null check (source_type in ('pdf', 'text', 'url')),
  source_url      text,
  file_size_bytes integer,
  status          text not null default 'pending' check (status in ('pending', 'processing', 'ready', 'error')),
  error_message   text,
  chunk_count     integer not null default 0,
  metadata        jsonb not null default '{}',
  created_by      uuid not null references auth.users(id) on delete cascade,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_ai_documents_org on public.ai_documents(organization_id);
create index idx_ai_documents_status on public.ai_documents(organization_id, status);

alter table public.ai_documents enable row level security;

create policy "ai_documents_select" on public.ai_documents
  for select using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

create policy "ai_documents_insert" on public.ai_documents
  for insert with check (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

create policy "ai_documents_update" on public.ai_documents
  for update using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

create policy "ai_documents_delete" on public.ai_documents
  for delete using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

create trigger set_ai_documents_updated_at
  before update on public.ai_documents
  for each row execute function public.update_updated_at_column();

-- ─── ai_document_chunks ──────────────────────────────────────────────
create table if not exists public.ai_document_chunks (
  id              uuid primary key default gen_random_uuid(),
  document_id     uuid not null references public.ai_documents(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  chunk_index     integer not null,
  content         text not null,
  token_count     integer not null default 0,
  embedding       extensions.vector(1536),
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now()
);

create index idx_ai_chunks_doc on public.ai_document_chunks(document_id);
create index idx_ai_chunks_org on public.ai_document_chunks(organization_id);
create index idx_ai_chunks_embedding on public.ai_document_chunks
  using hnsw (embedding extensions.vector_cosine_ops) with (m = 16, ef_construction = 64);

alter table public.ai_document_chunks enable row level security;

create policy "ai_chunks_select" on public.ai_document_chunks
  for select using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

-- Chunks are inserted by service role (edge function), no user insert policy needed.

-- ─── match_document_chunks function ──────────────────────────────────
create or replace function public.match_document_chunks(
  query_embedding extensions.vector(1536),
  match_org_id    uuid,
  match_threshold float default 0.7,
  match_count     int default 5
)
returns table (id uuid, content text, document_id uuid, title text, similarity float)
language sql stable
security definer
set search_path = public
as $$
  select c.id, c.content, c.document_id, d.title,
         1 - (c.embedding <=> query_embedding) as similarity
  from ai_document_chunks c
  join ai_documents d on d.id = c.document_id
  where c.organization_id = match_org_id
    and d.status = 'ready'
    and 1 - (c.embedding <=> query_embedding) > match_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- ─── ai_usage_monthly ────────────────────────────────────────────────
create table if not exists public.ai_usage_monthly (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  period          date not null,
  credits_used    integer not null default 0,
  credits_purchased integer not null default 0,
  operation_breakdown jsonb not null default '{}',
  unique (organization_id, period)
);

create index idx_ai_usage_org_period on public.ai_usage_monthly(organization_id, period desc);

alter table public.ai_usage_monthly enable row level security;

create policy "ai_usage_select" on public.ai_usage_monthly
  for select using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

-- Usage rows inserted/updated by service role only.

-- ─── Billing plan AI columns ─────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'billing_plans') THEN
    ALTER TABLE public.billing_plans
      ADD COLUMN IF NOT EXISTS monthly_ai_credits integer NULL CHECK (monthly_ai_credits IS NULL OR monthly_ai_credits >= 0),
      ADD COLUMN IF NOT EXISTS ai_features jsonb NOT NULL DEFAULT '["chat"]';

    UPDATE public.billing_plans SET monthly_ai_credits = 500, ai_features = '["chat"]' WHERE LOWER(code) = 'starter';
    UPDATE public.billing_plans SET monthly_ai_credits = 2000, ai_features = '["chat","rag","documents"]' WHERE LOWER(code) = 'pro';
    -- Enterprise: NULL = unlimited, all features
  ELSE
    RAISE NOTICE 'billing_plans not found, skipping AI credit columns';
  END IF;
END $$;

-- ─── get_org_ai_budget function ──────────────────────────────────────
create or replace function public.get_org_ai_budget(p_org_id uuid)
returns table (monthly_credits int, credits_used int, credits_purchased int, ai_features jsonb)
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_monthly_credits integer;
  v_ai_features jsonb;
  v_credits_used integer;
  v_credits_purchased integer;
  v_period date;
begin
  v_period := date_trunc('month', now())::date;

  -- Get plan limits
  select bp.monthly_ai_credits, bp.ai_features
  into v_monthly_credits, v_ai_features
  from billing_subscriptions bs
  join billing_plans bp on bp.stripe_price_id = bs.stripe_price_id
  where bs.organization_id = p_org_id
    and bs.status in ('active', 'trialing')
  order by bs.updated_at desc
  limit 1;

  -- No subscription = no limits (trial mode)
  if not found then
    monthly_credits := null;
    credits_used := 0;
    credits_purchased := 0;
    ai_features := '["chat","rag","documents"]'::jsonb;
    return next;
    return;
  end if;

  -- Get current period usage
  select coalesce(u.credits_used, 0), coalesce(u.credits_purchased, 0)
  into v_credits_used, v_credits_purchased
  from ai_usage_monthly u
  where u.organization_id = p_org_id and u.period = v_period;

  if not found then
    v_credits_used := 0;
    v_credits_purchased := 0;
  end if;

  monthly_credits := v_monthly_credits;
  credits_used := v_credits_used;
  credits_purchased := v_credits_purchased;
  ai_features := coalesce(v_ai_features, '["chat"]'::jsonb);
  return next;
end;
$$;

-- ─── Storage bucket ──────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('ai-documents', 'ai-documents', false)
on conflict (id) do nothing;

create policy "ai_docs_storage_upload" on storage.objects
  for insert with check (bucket_id = 'ai-documents');

create policy "ai_docs_storage_select" on storage.objects
  for select using (bucket_id = 'ai-documents');

create policy "ai_docs_storage_delete" on storage.objects
  for delete using (bucket_id = 'ai-documents');
```

**Step 2: Apply migration**

Run: `npx supabase db push`
Expected: Migration applies with no errors.

**Step 3: Commit**

```bash
git add supabase/migrations/20260310100000_ai_rag_pipeline.sql
git commit -m "feat(db): add AI RAG pipeline tables, functions, storage bucket, billing columns"
```

---

### Task 2: Types — `ai-documents.ts`

**Files:**
- Create: `src/types/ai-documents.ts`

**Step 1: Write the types file**

```ts
// Domain types for AI knowledge base documents and usage.

export const DOCUMENT_SOURCE_TYPES = ['pdf', 'text', 'url'] as const;
export type DocumentSourceType = (typeof DOCUMENT_SOURCE_TYPES)[number];

export const DOCUMENT_STATUSES = ['pending', 'processing', 'ready', 'error'] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const DOCUMENT_SOURCE_LABELS: Record<DocumentSourceType, string> = {
  pdf: 'PDF',
  text: 'Text',
  url: 'URL',
};

export const DOCUMENT_SOURCE_COLORS: Record<DocumentSourceType, { bg: string; text: string }> = {
  pdf: { bg: 'bg-red-100', text: 'text-red-800' },
  text: { bg: 'bg-blue-100', text: 'text-blue-800' },
  url: { bg: 'bg-green-100', text: 'text-green-800' },
};

export const DOCUMENT_STATUS_COLORS: Record<DocumentStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  processing: { bg: 'bg-blue-100', text: 'text-blue-800' },
  ready: { bg: 'bg-green-100', text: 'text-green-800' },
  error: { bg: 'bg-red-100', text: 'text-red-800' },
};

export interface AiDocument {
  id: string;
  organizationId: string;
  title: string;
  sourceType: DocumentSourceType;
  sourceUrl: string | null;
  fileSizeBytes: number | null;
  status: DocumentStatus;
  errorMessage: string | null;
  chunkCount: number;
  metadata: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiUsageMonthly {
  organizationId: string;
  period: string;
  creditsUsed: number;
  creditsPurchased: number;
  operationBreakdown: Record<string, number>;
}

export interface AiBudget {
  monthlyCredits: number | null; // null = unlimited
  creditsUsed: number;
  creditsPurchased: number;
  aiFeatures: string[];
  remaining: number | null; // null = unlimited
}

// Credit costs per operation
export const AI_CREDIT_COSTS = {
  chat: 1,
  rag_chat: 2,
  document_ingest: 5,
  url_ingest: 5,
} as const;
```

**Step 2: Commit**

```bash
git add src/types/ai-documents.ts
git commit -m "feat: add AI document and usage types"
```

---

### Task 3: Hooks — `useAiDocuments.ts` and `useAiUsage.ts`

**Files:**
- Create: `src/hooks/useAiDocuments.ts`
- Create: `src/hooks/useAiUsage.ts`

**Step 1: Write useAiDocuments hook**

Follow the `useCreativeActivities.ts` pattern exactly: `fromTable()`, `Row` interface, `toAiDocument()` mapper, query key factory, list/create/delete mutations.

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fromTable } from '@/integrations/supabase/helpers';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import type { AiDocument, DocumentSourceType } from '@/types/ai-documents';

interface AiDocumentRow {
  id: string;
  organization_id: string;
  title: string;
  source_type: string;
  source_url: string | null;
  file_size_bytes: number | null;
  status: string;
  error_message: string | null;
  chunk_count: number;
  metadata: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function toAiDocument(row: AiDocumentRow): AiDocument {
  return {
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
    sourceType: row.source_type as DocumentSourceType,
    sourceUrl: row.source_url,
    fileSizeBytes: row.file_size_bytes,
    status: row.status as AiDocument['status'],
    errorMessage: row.error_message,
    chunkCount: row.chunk_count,
    metadata: row.metadata,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const documentKeys = {
  all: (orgId: string) => ['ai-documents', orgId] as const,
  single: (docId: string) => ['ai-documents', 'detail', docId] as const,
};

export function useAiDocuments() {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id;

  return useQuery({
    queryKey: documentKeys.all(orgId ?? ''),
    queryFn: async () => {
      const { data, error } = await fromTable('ai_documents')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as AiDocumentRow[]).map(toAiDocument);
    },
    enabled: !!orgId,
  });
}

export function useDocumentStatus(documentId: string | null) {
  return useQuery({
    queryKey: documentKeys.single(documentId ?? ''),
    queryFn: async () => {
      const { data, error } = await fromTable('ai_documents')
        .select('*')
        .eq('id', documentId)
        .single();
      if (error) throw error;
      return toAiDocument(data as AiDocumentRow);
    },
    enabled: !!documentId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Poll every 3s while pending/processing, stop when ready/error
      return status === 'pending' || status === 'processing' ? 3000 : false;
    },
  });
}

export interface UploadDocumentInput {
  title: string;
  sourceType: DocumentSourceType;
  file?: File;
  textContent?: string;
  url?: string;
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id;

  return useMutation({
    mutationFn: async (input: UploadDocumentInput) => {
      if (!orgId) throw new Error('No organization');

      let sourceUrl: string | null = null;
      let fileSizeBytes: number | null = null;
      const metadata: Record<string, unknown> = {};

      // Upload file to Storage if PDF/file
      if (input.sourceType === 'pdf' && input.file) {
        const filePath = `${orgId}/${Date.now()}-${input.file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('ai-documents')
          .upload(filePath, input.file);
        if (uploadError) throw uploadError;
        sourceUrl = filePath;
        fileSizeBytes = input.file.size;
      } else if (input.sourceType === 'text') {
        metadata.raw_content = input.textContent;
      } else if (input.sourceType === 'url') {
        sourceUrl = input.url ?? null;
      }

      // Create document row
      const { data, error } = await fromTable('ai_documents')
        .insert({
          organization_id: orgId,
          title: input.title,
          source_type: input.sourceType,
          source_url: sourceUrl,
          file_size_bytes: fileSizeBytes,
          status: 'pending',
          metadata,
          created_by: membership?.user_id,
        })
        .select()
        .single();
      if (error) throw error;

      // Trigger ingestion edge function
      const { error: fnError } = await supabase.functions.invoke('ai-document-ingest', {
        body: { document_id: (data as AiDocumentRow).id },
      });
      if (fnError) {
        console.error('Ingest trigger failed:', fnError);
        // Document stays in pending — user can retry
      }

      return toAiDocument(data as AiDocumentRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-documents'] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doc: AiDocument) => {
      // Delete storage file if exists
      if (doc.sourceUrl && doc.sourceType === 'pdf') {
        await supabase.storage.from('ai-documents').remove([doc.sourceUrl]);
      }
      const { error } = await fromTable('ai_documents')
        .delete()
        .eq('id', doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-documents'] });
    },
  });
}
```

**Step 2: Write useAiUsage hook**

```ts
import { useQuery } from '@tanstack/react-query';
import { rpcCall } from '@/integrations/supabase/helpers';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import type { AiBudget } from '@/types/ai-documents';

export function useAiUsage() {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id;

  return useQuery({
    queryKey: ['ai-usage', orgId],
    queryFn: async () => {
      const { data, error } = await rpcCall('get_org_ai_budget', { p_org_id: orgId });
      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        // No subscription — unlimited trial
        return {
          monthlyCredits: null,
          creditsUsed: 0,
          creditsPurchased: 0,
          aiFeatures: ['chat', 'rag', 'documents'],
          remaining: null,
        } as AiBudget;
      }

      const budget: AiBudget = {
        monthlyCredits: row.monthly_credits,
        creditsUsed: row.credits_used,
        creditsPurchased: row.credits_purchased,
        aiFeatures: Array.isArray(row.ai_features) ? row.ai_features : JSON.parse(row.ai_features || '["chat"]'),
        remaining: row.monthly_credits === null
          ? null
          : row.monthly_credits + row.credits_purchased - row.credits_used,
      };
      return budget;
    },
    enabled: !!orgId,
  });
}
```

**Step 3: Commit**

```bash
git add src/hooks/useAiDocuments.ts src/hooks/useAiUsage.ts
git commit -m "feat: add useAiDocuments and useAiUsage hooks"
```

---

### Task 4: Edge Function — `ai-document-ingest`

**Files:**
- Create: `supabase/functions/ai-document-ingest/index.ts`

**Step 1: Write the edge function**

Follow the same boilerplate as `ai-embeddings/index.ts`: `serve()`, CORS handling, `requireOrgRoleAccess`, `jsonResponse` helper, `logEdgeEvent`.

The function:
1. Receives `{ document_id }` via POST
2. Reads the document row from `ai_documents`
3. Sets status → `processing`
4. Parses content based on `source_type` (PDF from Storage, text from metadata, URL via fetch)
5. Chunks text into ~512-token windows with 50-token overlap
6. Embeds chunks in batches via OpenAI API
7. Bulk inserts chunks into `ai_document_chunks`
8. Updates document status → `ready` (or `error`)
9. Increments `ai_usage_monthly` credits

Key implementation details:
- **PDF parsing**: Use `https://cdn.skypack.dev/pdf-parse` or extract text via `pdf-lib` (`https://esm.sh/pdf-lib@1.17.1`) in Deno. Fallback: if PDF parsing fails, set error status.
- **URL parsing**: `fetch(url)` → strip HTML with regex (`/<[^>]*>/g`) → clean whitespace.
- **Chunking**: Split on `\n\n` (paragraphs), then `\n` (lines), then `. ` (sentences). Build chunks up to ~2000 chars (~512 tokens). Overlap: repeat last 200 chars (~50 tokens) at start of next chunk.
- **Embedding**: Call OpenAI `text-embedding-3-small` directly (same as `ai-embeddings/index.ts`), batch up to 100 texts per request.
- **Credit tracking**: Upsert into `ai_usage_monthly` using `ON CONFLICT (organization_id, period) DO UPDATE SET credits_used = credits_used + 5`.

**Step 2: Commit**

```bash
git add supabase/functions/ai-document-ingest/index.ts
git commit -m "feat: add ai-document-ingest edge function with chunking and embedding"
```

---

### Task 5: Enhanced `ai-chat-proxy`

**Files:**
- Modify: `supabase/functions/ai-chat-proxy/index.ts`

**Step 1: Add creative domain context queries**

After the existing `pharmacy_activities` count query (line ~102), add queries for:
- `creative_clients` count + recent 10
- `creative_projects` count + recent 5
- `creative_opportunities` count + recent 5
- `creative_contacts` count
- `creative_activities` count + recent 5

**Step 2: Add RAG retrieval**

Before the LLM call, add:
1. Credit check via `get_org_ai_budget` RPC
2. Embed user message via OpenAI `text-embedding-3-small`
3. Call `match_document_chunks` RPC with the embedding
4. If chunks found, build `KNOWLEDGE BASE CONTEXT` block
5. Inject into system prompt before `GUIDELINES`

**Step 3: Add credit deduction**

After successful LLM response, upsert into `ai_usage_monthly`:
- +1 credit for basic chat
- +2 credits for chat with RAG (when chunks were retrieved)

**Step 4: Update system prompt builder**

Add creative domain data (clients, projects, opportunities, contacts, activities) to the `buildSystemPrompt` function. Add optional `ragContext` parameter for knowledge base snippets.

**Step 5: Commit**

```bash
git add supabase/functions/ai-chat-proxy/index.ts
git commit -m "feat: enhance ai-chat-proxy with creative context, RAG retrieval, and credit tracking"
```

---

### Task 6: Knowledge Base Page + Components

**Files:**
- Create: `src/pages/creative/CreativeDocuments.tsx`
- Create: `src/components/creative/documents/DocumentUploadSheet.tsx`
- Create: `src/components/creative/documents/DocumentStatusBadge.tsx`
- Create: `src/components/creative/documents/document-columns.tsx`
- Modify: `src/components/creative/layout/CreativeSidebar.tsx` — add nav item
- Modify: `src/App.tsx` — add route

**Step 1: Create DocumentStatusBadge**

Small component: renders a colored Badge based on `DocumentStatus`. Processing status uses `animate-pulse` class.

```tsx
import { Badge } from '@/components/ui/badge';
import { DOCUMENT_STATUS_COLORS, type DocumentStatus } from '@/types/ai-documents';
import { Loader2 } from 'lucide-react';

const STATUS_LABELS: Record<DocumentStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  ready: 'Ready',
  error: 'Error',
};

export function DocumentStatusBadge({ status, errorMessage }: { status: DocumentStatus; errorMessage?: string | null }) {
  const colors = DOCUMENT_STATUS_COLORS[status];
  return (
    <Badge
      variant="outline"
      className={`${colors.bg} ${colors.text} ${status === 'processing' ? 'animate-pulse' : ''}`}
      title={status === 'error' ? errorMessage ?? 'Unknown error' : undefined}
    >
      {status === 'processing' && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
      {STATUS_LABELS[status]}
    </Badge>
  );
}
```

**Step 2: Create document-columns.tsx**

Column definitions for DataTable: Title, Type (badge), Status (DocumentStatusBadge), Chunks, Created (formatted date), Actions (delete button).

**Step 3: Create DocumentUploadSheet**

Sheet with Tabs (File / Text / URL). Each tab has a form:
- File tab: title input + file drop zone (accept `.pdf,.txt,.md`)
- Text tab: title input + textarea
- URL tab: title input + URL input

Submit calls `useUploadDocument().mutateAsync()`, toast on result.

**Step 4: Create CreativeDocuments page**

Main page with:
- Header with title "Knowledge Base" + credit usage badge from `useAiUsage()`
- "Upload Document" button → opens `DocumentUploadSheet`
- DataTable with `useAiDocuments()` data and `document-columns`
- Empty state when no documents

**Step 5: Add sidebar nav item**

In `CreativeSidebar.tsx`, add to `mainNavItems` after Reports:
```ts
{ label: 'Knowledge Base', icon: BookOpen, path: '/creative/knowledge-base' },
```

Import `BookOpen` from `lucide-react`.

**Step 6: Add route**

In `App.tsx`, add inside the creative routes block:
```tsx
<Route path="knowledge-base" element={<CreativeDocuments />} />
```

Add lazy import at top.

**Step 7: Commit**

```bash
git add src/pages/creative/CreativeDocuments.tsx \
  src/components/creative/documents/DocumentUploadSheet.tsx \
  src/components/creative/documents/DocumentStatusBadge.tsx \
  src/components/creative/documents/document-columns.tsx \
  src/components/creative/layout/CreativeSidebar.tsx \
  src/App.tsx
git commit -m "feat: add Knowledge Base page with document upload, status tracking, and credit display"
```

---

### Task 7: AI Chat Enhancements

**Files:**
- Modify: `src/components/layout/AiChatSheet.tsx`

**Step 1: Add credit display**

In the chat header, add a small credit counter badge using `useAiUsage()`:
```tsx
const { data: budget } = useAiUsage();
// In header: "Credits: 455 remaining" or "Unlimited"
```

**Step 2: Add RAG indicator**

When the response includes source documents (detected from response content or a `sources` field added to the API response), show a "Sources" section below the message bubble with document titles.

**Step 3: Add upgrade prompt**

When `budget.remaining !== null && budget.remaining <= 0`, show an inline banner above the input:
"AI credits exhausted for this month. Upgrade your plan for more."

**Step 4: Commit**

```bash
git add src/components/layout/AiChatSheet.tsx
git commit -m "feat: add credit display and upgrade prompts to AI chat"
```

---

### Task 8: Tests

**Files:**
- Create: `src/components/creative/documents/__tests__/DocumentStatusBadge.test.tsx`
- Create: `src/types/__tests__/ai-documents.test.ts`

**Step 1: Write DocumentStatusBadge tests**

Test each status renders correct label and class. Test error tooltip appears.

**Step 2: Write types tests**

Test that `DOCUMENT_SOURCE_TYPES`, `DOCUMENT_STATUSES`, label maps, and color maps are all internally consistent (every type has a label and color entry).

**Step 3: Run tests**

Run: `npx vitest run`
Expected: All tests pass.

**Step 4: Commit**

```bash
git add src/components/creative/documents/__tests__/DocumentStatusBadge.test.tsx \
  src/types/__tests__/ai-documents.test.ts
git commit -m "test: add tests for DocumentStatusBadge and AI document types"
```

---

### Task 9: Build + Deploy Verification

**Step 1: TypeScript check**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: No errors.

**Step 2: Full test suite**

Run: `npx vitest run`
Expected: All tests pass.

**Step 3: Push and verify CI**

Run: `git push origin main`
Expected: GitHub CI passes (typecheck + tests).

**Step 4: Verify Vercel deployment**

Check Vercel dashboard: deployment state should be READY.

**Step 5: Apply database migration**

Run: `npx supabase db push`
Expected: Migration applies successfully.

**Step 6: Deploy edge functions**

Run: `npx supabase functions deploy ai-document-ingest`
Run: `npx supabase functions deploy ai-chat-proxy`
Expected: Both functions deploy successfully.
