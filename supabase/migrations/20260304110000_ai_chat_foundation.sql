-- AI Chat: built-in assistant with per-user private conversations
-- The OpenAI API key is set as a platform-level env var (OPENAI_API_KEY).
-- Users never configure or see it — the assistant just works.

-- ─── ai_chat_config (platform admin override) ───────────────────────
-- Optional: one row per org to override the default model.
-- Managed by platform admins via direct DB access, never exposed to end users.
create table if not exists public.ai_chat_config (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  model           text not null default 'gpt-4o-mini',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint uq_ai_chat_config_org unique (organization_id)
);

alter table public.ai_chat_config enable row level security;

-- Only service_role (edge functions) reads this table — no user-facing RLS needed.
-- Deny all direct client access.
create policy "ai_chat_config_deny_all"
  on public.ai_chat_config for select
  using (false);

-- ─── ai_chat_messages ────────────────────────────────────────────────
-- Persists conversation history. Each user has their own private thread
-- within their organization. No user can see another user's messages.
create table if not exists public.ai_chat_messages (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null check (role in ('user', 'assistant', 'system')),
  content         text not null,
  created_at      timestamptz not null default now()
);

create index idx_ai_chat_messages_org_user
  on public.ai_chat_messages (organization_id, user_id, created_at desc);

alter table public.ai_chat_messages enable row level security;

-- Users can only see and manage their OWN messages within their org.
create policy "ai_chat_messages_own"
  on public.ai_chat_messages for all
  using (
    user_id = auth.uid()
    and organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid() and om.status = 'active'
    )
  )
  with check (
    user_id = auth.uid()
    and organization_id in (
      select om.organization_id from public.organization_members om
      where om.user_id = auth.uid() and om.status = 'active'
    )
  );
