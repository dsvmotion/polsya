# Phase 3B Design: AI Context Enrichment + Full RAG Pipeline

**Date:** 2026-03-05
**Status:** Approved

---

## Overview

Upgrade the AI assistant from a basic chat with minimal CRM context to a full RAG-powered knowledge engine. Users can upload documents (PDF, text, URLs), which are chunked, embedded, and semantically searched during chat. The chat proxy is also enhanced with full creative domain context. All AI usage is gated by a credit-based billing system tied to subscription tiers.

---

## 1. Database Schema

### `ai_documents` — uploaded file/URL metadata

```sql
CREATE TABLE ai_documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title           text NOT NULL,
  source_type     text NOT NULL CHECK (source_type IN ('pdf', 'text', 'url')),
  source_url      text,
  file_size_bytes integer,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'error')),
  error_message   text,
  chunk_count     integer NOT NULL DEFAULT 0,
  metadata        jsonb NOT NULL DEFAULT '{}',
  created_by      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```

RLS: org members can SELECT/INSERT; admins can DELETE. Same `organization_members` pattern as all creative tables.

### `ai_document_chunks` — chunked text + embeddings

```sql
CREATE TABLE ai_document_chunks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     uuid NOT NULL REFERENCES ai_documents(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  chunk_index     integer NOT NULL,
  content         text NOT NULL,
  token_count     integer NOT NULL DEFAULT 0,
  embedding       extensions.vector(1536),
  metadata        jsonb NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_chunks_embedding ON ai_document_chunks
  USING hnsw (embedding extensions.vector_cosine_ops) WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_chunks_doc ON ai_document_chunks(document_id);
CREATE INDEX idx_chunks_org ON ai_document_chunks(organization_id);
```

RLS: org members can SELECT; service role handles INSERT (via edge function).

### Similarity search function

```sql
CREATE FUNCTION match_document_chunks(
  query_embedding extensions.vector(1536),
  match_org_id    uuid,
  match_threshold float DEFAULT 0.7,
  match_count     int DEFAULT 5
)
RETURNS TABLE (id uuid, content text, document_id uuid, title text, similarity float)
LANGUAGE sql STABLE
AS $$
  SELECT c.id, c.content, c.document_id, d.title,
         1 - (c.embedding <=> query_embedding) AS similarity
  FROM ai_document_chunks c
  JOIN ai_documents d ON d.id = c.document_id
  WHERE c.organization_id = match_org_id
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;
```

### `ai_usage_monthly` — credit tracking

```sql
CREATE TABLE ai_usage_monthly (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period          date NOT NULL,
  credits_used    integer NOT NULL DEFAULT 0,
  credits_purchased integer NOT NULL DEFAULT 0,
  operation_breakdown jsonb NOT NULL DEFAULT '{}',
  UNIQUE (organization_id, period)
);
```

RLS: org members can SELECT; service role handles INSERT/UPDATE (via edge functions).

---

## 2. Credit-Based AI Usage

### Plan limits — new columns on `billing_plans`

| Column | Type | Starter | Pro | Enterprise |
|---|---|---|---|---|
| `monthly_ai_credits` | int nullable | 500 | 2000 | NULL (unlimited) |
| `ai_features` | jsonb | `["chat"]` | `["chat","rag","documents"]` | `["chat","rag","documents","api"]` |

NULL = unlimited (same convention as `entity_limit`).

### Credit costs per operation

| Operation | Credits | Notes |
|---|---|---|
| Chat message (send) | 1 | Per user message |
| Document ingest | 5 | Per document (parse + chunk + embed) |
| RAG retrieval (per chat with docs) | 2 | Similarity search + enriched context |
| Web URL scrape + ingest | 5 | Fetch + parse + embed |

### Enforcement

- Edge function calls `get_org_ai_budget(org_id)` → returns `{ monthly_credits, credits_used, credits_purchased, features[] }`
- Feature gate: is this operation's feature in `ai_features`? If not → error with upgrade prompt
- Credit gate: are there credits remaining (`monthly_credits + credits_purchased - credits_used > cost`)? If not → error with upgrade prompt
- After successful operation → increment `credits_used` and `operation_breakdown`
- No subscription / trial: no enforcement (generous trial period)

### `get_org_ai_budget()` function

```sql
CREATE FUNCTION get_org_ai_budget(p_org_id uuid)
RETURNS TABLE (monthly_credits int, credits_used int, credits_purchased int, ai_features jsonb)
```

Joins `billing_subscriptions` → `billing_plans` for limits, `ai_usage_monthly` for current period usage.

---

## 3. Edge Functions

### `ai-document-ingest` (new)

Triggered by frontend POST with `{ document_id }` after upload.

**Flow:**
1. Auth check via `requireOrgRoleAccess` (admin, manager, rep, ops)
2. Credit + feature gate check (`get_org_ai_budget`) — requires `documents` feature, costs 5 credits
3. Set document status → `processing`
4. **Parse** based on `source_type`:
   - `pdf`: Download from Supabase Storage → parse via Deno-compatible PDF library → extract text per page
   - `text`: Read content from `ai_documents.metadata.raw_content`
   - `url`: Fetch URL → strip HTML → extract main content
5. **Chunk**: Recursive text splitter — 512-token windows, 50-token overlap, split on paragraph → sentence → word boundaries
6. **Embed**: Batch chunks (up to 100 per OpenAI API call) via `text-embedding-3-small`
7. **Store**: Bulk insert into `ai_document_chunks` with embeddings
8. Update `ai_documents`: status → `ready`, `chunk_count`, metadata (page_count, word_count)
9. Increment `ai_usage_monthly.credits_used` (+5) and `operation_breakdown.ingest`
10. On error: status → `error`, `error_message` set, log via `logEdgeEvent`

### Enhanced `ai-chat-proxy` (modified)

New steps injected before LLM call:

1. **Credit check**: `get_org_ai_budget(org_id)` — reject if no credits left
2. **Creative domain context** — new queries added to system prompt:
   - `creative_clients` count + recent 10 (name, industry, status)
   - `creative_projects` count + recent 5 (name, client, status, budget)
   - `creative_opportunities` count + recent 5 (title, stage, value)
   - `creative_contacts` count
   - `creative_activities` count + recent 5 (type, title, occurred_at)
3. **RAG retrieval** (if org has `rag` in `ai_features`):
   - Embed user message via OpenAI `text-embedding-3-small` → 1536-dim vector
   - Call `match_document_chunks(embedding, org_id, 0.7, 5)` — top 5 matching chunks
   - If results found, prepend `KNOWLEDGE BASE CONTEXT` block to system prompt with chunk content + source document title
   - Costs 2 credits instead of 1 when RAG retrieval is used
4. **Updated system prompt**: Includes CRM overview + creative domain data + knowledge base snippets
5. **Credit deduction**: +1 (basic chat) or +2 (chat with RAG) after successful response

Provider handling unchanged — existing OpenAI/Anthropic dual-provider logic stays as-is. RAG context is injected into the system prompt, which works identically for both providers.

---

## 4. Frontend

### Knowledge Base Page

- **Route:** `/creative/knowledge-base`
- **Sidebar:** "Knowledge Base" item with `BookOpen` icon, after Reports
- **Views:** DataTable with columns: Title, Type badge (PDF/Text/URL), Status badge, Chunks, Created, Actions

**Components:**

- `KnowledgeBasePage.tsx` — main page with upload button, document list, credit usage indicator
- `DocumentUploadSheet.tsx` — Sheet with three tabs:
  - File tab: drag-and-drop for PDF/text → Supabase Storage → create `ai_documents` row → trigger ingest
  - Text tab: textarea + title field
  - URL tab: URL input + title field
- `DocumentStatusBadge.tsx` — pending (yellow), processing (blue pulse), ready (green), error (red + tooltip)

### AI Chat Enhancements

Modify existing `AiChatSheet.tsx`:
- "Searching knowledge base..." indicator when RAG is active
- Source attribution below responses when RAG chunks are used
- Credit counter in chat header
- Upgrade prompt when credits exhausted or feature unavailable

### Hooks

- `useAiDocuments.ts`: `useAiDocuments(orgId)`, `useUploadDocument()`, `useDeleteDocument()`, `useDocumentStatus(docId)` with 3s polling while processing
- `useAiUsage.ts`: `useAiUsage(orgId)` — current month credits used/remaining

---

## 5. File Summary

| Area | New Files | Modified Files |
|---|---|---|
| **Database** | migration (tables + functions + RLS + billing columns) | |
| **Edge Functions** | `ai-document-ingest/index.ts` | `ai-chat-proxy/index.ts` |
| **Types** | `src/types/ai-documents.ts` | |
| **Hooks** | `useAiDocuments.ts`, `useAiUsage.ts` | |
| **Components** | `KnowledgeBasePage.tsx`, `DocumentUploadSheet.tsx`, `DocumentStatusBadge.tsx` | `AiChatSheet.tsx`, `CreativeSidebar.tsx`, `App.tsx` |
