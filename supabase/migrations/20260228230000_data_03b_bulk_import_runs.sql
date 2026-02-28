-- DATA-03B: Track bulk import runs by file hash to prevent duplicate imports.

create table public.bulk_import_runs (
  id             uuid        primary key default gen_random_uuid(),
  file_hash      text        not null unique,
  file_name      text        not null,
  total_rows     int         not null default 0,
  imported_rows  int         not null default 0,
  skipped_duplicates int     not null default 0,
  status         text        not null default 'success'
                             check (status in ('success', 'failed')),
  created_at     timestamptz not null default now()
);

create index idx_bulk_import_runs_created_at on public.bulk_import_runs (created_at desc);

alter table public.bulk_import_runs enable row level security;

create policy "Authenticated can select bulk_import_runs"
  on public.bulk_import_runs for select to authenticated
  using (true);

create policy "Authenticated can insert bulk_import_runs"
  on public.bulk_import_runs for insert to authenticated
  with check (true);
