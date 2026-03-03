-- AI Chat: encrypted API-key vault + conversation history per organization
-- Keys are encrypted at rest via pgcrypto; the raw key NEVER leaves the DB unencrypted.

create extension if not exists pgcrypto;

-- ─── ai_chat_config ──────────────────────────────────────────────────
-- One row per organization. Stores an AES-256 encrypted OpenAI API key.
-- The encryption passphrase is the Supabase service-role key (env-only).
create table if not exists public.ai_chat_config (
  id            uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider      text not null default 'openai' check (provider in ('openai')),
  encrypted_key bytea not null,
  model         text not null default 'gpt-4o-mini',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint uq_ai_chat_config_org unique (organization_id)
);

alter table public.ai_chat_config enable row level security;

create policy "ai_chat_config_select_member"
  on public.ai_chat_config for select
  using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "ai_chat_config_insert_admin"
  on public.ai_chat_config for insert
  with check (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and status = 'active' and role in ('admin', 'manager')
    )
  );

create policy "ai_chat_config_update_admin"
  on public.ai_chat_config for update
  using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and status = 'active' and role in ('admin', 'manager')
    )
  );

create policy "ai_chat_config_delete_admin"
  on public.ai_chat_config for delete
  using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and status = 'active' and role in ('admin', 'manager')
    )
  );

-- ─── ai_chat_messages ────────────────────────────────────────────────
-- Persists conversation history scoped to organization + user.
create table if not exists public.ai_chat_messages (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null check (role in ('user', 'assistant', 'system')),
  content         text not null,
  created_at      timestamptz not null default now()
);

create index idx_ai_chat_messages_org_user on public.ai_chat_messages (organization_id, user_id, created_at desc);

alter table public.ai_chat_messages enable row level security;

create policy "ai_chat_messages_own"
  on public.ai_chat_messages for all
  using (
    user_id = auth.uid()
    and organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and status = 'active'
    )
  )
  with check (
    user_id = auth.uid()
    and organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and status = 'active'
    )
  );
