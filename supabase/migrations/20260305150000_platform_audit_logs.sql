-- Platform audit logs: high-level audit trail for critical actions (billing, org changes).
-- Readable by platform owners; inserts from service role (Edge Functions, triggers).

create table if not exists public.platform_audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  action text not null,
  resource_type text not null,
  resource_id text null,
  organization_id uuid null references public.organizations(id) on delete set null,
  actor_type text not null default 'system' check (actor_type in ('system', 'user', 'webhook')),
  actor_id text null,
  actor_email text null,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_platform_audit_logs_created
  on public.platform_audit_logs (created_at desc);
create index if not exists idx_platform_audit_logs_org
  on public.platform_audit_logs (organization_id, created_at desc);
create index if not exists idx_platform_audit_logs_action
  on public.platform_audit_logs (action, created_at desc);

alter table public.platform_audit_logs enable row level security;

-- Platform owners can read all audit logs
create policy "Platform owners can select platform_audit_logs"
  on public.platform_audit_logs for select to authenticated
  using (public.is_platform_owner());

-- No insert/update/delete for authenticated; service role inserts only
-- (no policies = only service_role can insert/update/delete)
