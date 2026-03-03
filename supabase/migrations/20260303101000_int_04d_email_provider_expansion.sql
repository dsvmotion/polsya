-- INT-04D-A: Expand email providers to include Outlook and custom IMAP/SMTP.

-- 1) integration_connections.provider
alter table public.integration_connections
  drop constraint if exists integration_connections_provider_check;

alter table public.integration_connections
  drop constraint if exists chk_integration_connections_provider;

alter table public.integration_connections
  add constraint chk_integration_connections_provider
  check (provider in (
    'woocommerce',
    'shopify',
    'gmail',
    'outlook',
    'email_imap',
    'notion',
    'openai',
    'anthropic',
    'custom_api'
  ));

-- 2) integration_sync_jobs.provider (new check)
alter table public.integration_sync_jobs
  drop constraint if exists chk_integration_sync_jobs_provider;

alter table public.integration_sync_jobs
  add constraint chk_integration_sync_jobs_provider
  check (provider in (
    'woocommerce',
    'shopify',
    'gmail',
    'outlook',
    'email_imap',
    'notion',
    'openai',
    'anthropic',
    'custom_api'
  ));

-- 3) integration_sync_objects.provider (new check)
alter table public.integration_sync_objects
  drop constraint if exists chk_integration_sync_objects_provider;

alter table public.integration_sync_objects
  add constraint chk_integration_sync_objects_provider
  check (provider in (
    'woocommerce',
    'shopify',
    'gmail',
    'outlook',
    'email_imap',
    'notion',
    'openai',
    'anthropic',
    'custom_api'
  ));

-- 4) OAuth provider checks: allow gmail + outlook
alter table public.integration_oauth_states
  drop constraint if exists integration_oauth_states_provider_check;

alter table public.integration_oauth_states
  drop constraint if exists chk_integration_oauth_states_provider;

alter table public.integration_oauth_states
  add constraint chk_integration_oauth_states_provider
  check (provider in ('gmail', 'outlook'));

alter table public.integration_oauth_tokens
  drop constraint if exists integration_oauth_tokens_provider_check;

alter table public.integration_oauth_tokens
  drop constraint if exists chk_integration_oauth_tokens_provider;

alter table public.integration_oauth_tokens
  add constraint chk_integration_oauth_tokens_provider
  check (provider in ('gmail', 'outlook'));
