-- Contact form submissions (public landing)
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  subject text,
  message text not null,
  source text default 'contact_page',
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

-- Anonymous users can insert (public contact form)
create policy "Anyone can submit contact form"
  on public.contact_messages for insert
  to anon, authenticated
  with check (true);

-- Platform owners can read (for admin dashboard)
create policy "Platform owners can read contact messages"
  on public.contact_messages for select
  to authenticated
  using (public.is_platform_owner());

create index if not exists idx_contact_messages_created_at
  on public.contact_messages (created_at desc);
