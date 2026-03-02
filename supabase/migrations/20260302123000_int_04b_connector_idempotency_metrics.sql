-- INT-04B: Standardized Woo/Shopify sync persistence with org-scoped idempotency
-- and per-run duration/metrics.

create table if not exists public.integration_sync_objects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  integration_id uuid not null references public.integration_connections(id) on delete cascade,
  provider text not null,
  sync_target text not null check (sync_target in ('entities', 'orders', 'products', 'inventory')),
  external_id text not null,
  external_updated_at timestamptz null,
  payload jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, integration_id, provider, sync_target, external_id)
);

create index if not exists idx_integration_sync_objects_lookup
  on public.integration_sync_objects (integration_id, sync_target, last_seen_at desc);

create index if not exists idx_integration_sync_objects_org_provider
  on public.integration_sync_objects (organization_id, provider, sync_target, updated_at desc);

create trigger update_integration_sync_objects_updated_at
  before update on public.integration_sync_objects
  for each row
  execute function public.update_updated_at_column();

alter table public.integration_sync_objects enable row level security;

create policy "Org members can select integration_sync_objects"
  on public.integration_sync_objects for select to authenticated
  using (public.is_org_member(organization_id));

create policy "Org members can insert integration_sync_objects"
  on public.integration_sync_objects for insert to authenticated
  with check (
    public.is_org_member(organization_id)
    and exists (
      select 1 from public.integration_connections c
      where c.id = integration_id
        and c.organization_id = organization_id
    )
  );

create policy "Org members can update integration_sync_objects"
  on public.integration_sync_objects for update to authenticated
  using (public.is_org_member(organization_id))
  with check (
    public.is_org_member(organization_id)
    and exists (
      select 1 from public.integration_connections c
      where c.id = integration_id
        and c.organization_id = organization_id
    )
  );

create policy "Org members can delete integration_sync_objects"
  on public.integration_sync_objects for delete to authenticated
  using (public.is_org_member(organization_id));

alter table public.integration_sync_runs
  add column if not exists duration_ms integer not null default 0;

alter table public.integration_sync_runs
  add column if not exists metrics jsonb not null default '{}'::jsonb;
