-- ARCH-03B: Configurable entity types (multi-industry foundation)
-- NOTE: organization_id is nullable in this phase for legacy compatibility.
-- It will be made NOT NULL and linked to organizations in ARCH-02A backfill.

create table if not exists public.entity_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid null,
  key text not null,
  label text not null,
  color text null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_entity_types_key_format check (key ~ '^[a-z0-9_\-]+$')
);

create unique index if not exists idx_entity_types_org_key
  on public.entity_types (organization_id, key);

create unique index if not exists idx_entity_types_global_key
  on public.entity_types (key)
  where organization_id is null;

create index if not exists idx_entity_types_org_default
  on public.entity_types (organization_id, is_default desc, label);

alter table public.entity_types enable row level security;

drop policy if exists "Authenticated can select entity_types" on public.entity_types;
create policy "Authenticated can select entity_types"
  on public.entity_types for select to authenticated
  using (true);

drop policy if exists "Authenticated can insert entity_types" on public.entity_types;
create policy "Authenticated can insert entity_types"
  on public.entity_types for insert to authenticated
  with check (true);

drop policy if exists "Authenticated can update entity_types" on public.entity_types;
create policy "Authenticated can update entity_types"
  on public.entity_types for update to authenticated
  using (true) with check (true);

drop policy if exists "Authenticated can delete entity_types" on public.entity_types;
create policy "Authenticated can delete entity_types"
  on public.entity_types for delete to authenticated
  using (true);

-- Reuse global updated_at trigger helper function if available.
drop trigger if exists update_entity_types_updated_at on public.entity_types;
create trigger update_entity_types_updated_at
before update on public.entity_types
for each row execute function public.update_updated_at_column();

-- Seed legacy defaults once (global scope until organization rollout).
insert into public.entity_types (organization_id, key, label, color, is_default)
values
  (null, 'pharmacy', 'Pharmacy', '#334155', true),
  (null, 'herbalist', 'Herbalist', '#0f766e', false)
on conflict (key) where organization_id is null do nothing;

alter table public.pharmacies
  add column if not exists entity_type_id uuid null references public.entity_types(id) on delete set null;

update public.pharmacies p
set entity_type_id = et.id
from public.entity_types et
where p.entity_type_id is null
  and et.organization_id is null
  and et.key = p.client_type::text;

create index if not exists idx_pharmacies_entity_type_id
  on public.pharmacies (entity_type_id);
