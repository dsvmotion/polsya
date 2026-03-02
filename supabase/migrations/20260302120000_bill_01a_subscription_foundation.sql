-- BILL-01A: Stripe subscription data model (organization-level billing)

create table if not exists public.billing_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text null,
  stripe_price_id text not null unique,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'eur',
  interval text not null default 'month' check (interval in ('month', 'year')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  stripe_customer_id text not null unique,
  email text null,
  name text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id)
);

create table if not exists public.billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  stripe_subscription_id text not null unique,
  stripe_price_id text not null,
  status text not null check (status in ('trialing', 'active', 'past_due', 'unpaid', 'canceled', 'incomplete', 'incomplete_expired')),
  current_period_start timestamptz null,
  current_period_end timestamptz null,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz null,
  trial_end timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  subscription_id uuid null references public.billing_subscriptions(id) on delete set null,
  stripe_invoice_id text not null unique,
  invoice_number text null,
  status text not null check (status in ('draft', 'open', 'paid', 'void', 'uncollectible')),
  currency text not null default 'eur',
  amount_due_cents integer not null default 0 check (amount_due_cents >= 0),
  amount_paid_cents integer not null default 0 check (amount_paid_cents >= 0),
  hosted_invoice_url text null,
  invoice_pdf_url text null,
  period_start timestamptz null,
  period_end timestamptz null,
  due_date timestamptz null,
  paid_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists idx_billing_plans_active on public.billing_plans (is_active, amount_cents);
create index if not exists idx_billing_customers_org on public.billing_customers (organization_id);
create index if not exists idx_billing_subscriptions_org_status on public.billing_subscriptions (organization_id, status, updated_at desc);
create index if not exists idx_billing_subscriptions_price on public.billing_subscriptions (stripe_price_id);
create index if not exists idx_billing_invoices_org_created on public.billing_invoices (organization_id, created_at desc);
create index if not exists idx_billing_invoices_subscription_created on public.billing_invoices (subscription_id, created_at desc);

-- V1 invariant: one current billable subscription per organization.
create unique index if not exists idx_billing_subscriptions_one_current_per_org
  on public.billing_subscriptions (organization_id)
  where status in ('trialing', 'active', 'past_due', 'unpaid');

alter table public.billing_plans enable row level security;
alter table public.billing_customers enable row level security;
alter table public.billing_subscriptions enable row level security;
alter table public.billing_invoices enable row level security;

drop trigger if exists update_billing_plans_updated_at on public.billing_plans;
create trigger update_billing_plans_updated_at
before update on public.billing_plans
for each row execute function public.update_updated_at_column();

drop trigger if exists update_billing_customers_updated_at on public.billing_customers;
create trigger update_billing_customers_updated_at
before update on public.billing_customers
for each row execute function public.update_updated_at_column();

drop trigger if exists update_billing_subscriptions_updated_at on public.billing_subscriptions;
create trigger update_billing_subscriptions_updated_at
before update on public.billing_subscriptions
for each row execute function public.update_updated_at_column();

alter table public.billing_customers alter column organization_id set default public.current_user_organization_id();
alter table public.billing_subscriptions alter column organization_id set default public.current_user_organization_id();
alter table public.billing_invoices alter column organization_id set default public.current_user_organization_id();

-- Plans are catalog data; readable by all authenticated users, mutable via service role only.
drop policy if exists "Authenticated can read billing plans" on public.billing_plans;
create policy "Authenticated can read billing plans"
  on public.billing_plans for select to authenticated
  using (true);

-- Billing customer/subscription/invoice data is tenant-isolated.
drop policy if exists "Org members can select billing_customers" on public.billing_customers;
create policy "Org members can select billing_customers"
  on public.billing_customers for select to authenticated
  using (public.is_org_member(organization_id));

drop policy if exists "Org admins can insert billing_customers" on public.billing_customers;
create policy "Org admins can insert billing_customers"
  on public.billing_customers for insert to authenticated
  with check (public.is_org_admin(organization_id));

drop policy if exists "Org admins can update billing_customers" on public.billing_customers;
create policy "Org admins can update billing_customers"
  on public.billing_customers for update to authenticated
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

drop policy if exists "Org admins can delete billing_customers" on public.billing_customers;
create policy "Org admins can delete billing_customers"
  on public.billing_customers for delete to authenticated
  using (public.is_org_admin(organization_id));

drop policy if exists "Org members can select billing_subscriptions" on public.billing_subscriptions;
create policy "Org members can select billing_subscriptions"
  on public.billing_subscriptions for select to authenticated
  using (public.is_org_member(organization_id));

drop policy if exists "Org admins can insert billing_subscriptions" on public.billing_subscriptions;
create policy "Org admins can insert billing_subscriptions"
  on public.billing_subscriptions for insert to authenticated
  with check (public.is_org_admin(organization_id));

drop policy if exists "Org admins can update billing_subscriptions" on public.billing_subscriptions;
create policy "Org admins can update billing_subscriptions"
  on public.billing_subscriptions for update to authenticated
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

drop policy if exists "Org admins can delete billing_subscriptions" on public.billing_subscriptions;
create policy "Org admins can delete billing_subscriptions"
  on public.billing_subscriptions for delete to authenticated
  using (public.is_org_admin(organization_id));

drop policy if exists "Org members can select billing_invoices" on public.billing_invoices;
create policy "Org members can select billing_invoices"
  on public.billing_invoices for select to authenticated
  using (public.is_org_member(organization_id));

drop policy if exists "Org admins can insert billing_invoices" on public.billing_invoices;
create policy "Org admins can insert billing_invoices"
  on public.billing_invoices for insert to authenticated
  with check (
    public.is_org_admin(organization_id)
    and (
      subscription_id is null
      or exists (
        select 1
        from public.billing_subscriptions s
        where s.id = subscription_id
          and s.organization_id = organization_id
      )
    )
  );

drop policy if exists "Org admins can update billing_invoices" on public.billing_invoices;
create policy "Org admins can update billing_invoices"
  on public.billing_invoices for update to authenticated
  using (public.is_org_admin(organization_id))
  with check (
    public.is_org_admin(organization_id)
    and (
      subscription_id is null
      or exists (
        select 1
        from public.billing_subscriptions s
        where s.id = subscription_id
          and s.organization_id = organization_id
      )
    )
  );

drop policy if exists "Org admins can delete billing_invoices" on public.billing_invoices;
create policy "Org admins can delete billing_invoices"
  on public.billing_invoices for delete to authenticated
  using (public.is_org_admin(organization_id));
