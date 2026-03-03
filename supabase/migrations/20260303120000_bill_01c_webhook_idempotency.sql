-- BILL-01C hardening: idempotent Stripe webhook processing ledger.

create table if not exists public.billing_webhook_events (
  id text primary key,
  provider text not null check (provider in ('stripe')),
  organization_id uuid null references public.organizations(id) on delete set null,
  event_type text not null,
  processing_status text not null default 'processing'
    check (processing_status in ('processing', 'processed', 'ignored', 'error')),
  payload jsonb not null default '{}'::jsonb,
  error_message text null,
  received_at timestamptz not null default now(),
  processed_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists idx_billing_webhook_events_status_received
  on public.billing_webhook_events (processing_status, received_at desc);

create index if not exists idx_billing_webhook_events_org_received
  on public.billing_webhook_events (organization_id, received_at desc);

alter table public.billing_webhook_events enable row level security;

-- Service-role only table by design (no authenticated policies).
