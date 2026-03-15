-- Expand integration_api_credentials to support all API-key providers
-- Previously restricted to 'brevo' only

-- 1. Drop the old check constraint and add a broader one
alter table public.integration_api_credentials
  drop constraint if exists integration_api_credentials_provider_check;

alter table public.integration_api_credentials
  add constraint integration_api_credentials_provider_check
  check (provider in (
    'brevo',
    'woocommerce',
    'shopify',
    'prestashop',
    'openai',
    'anthropic',
    'pipedrive',
    'whatsapp',
    'custom_api'
  ));

-- 2. Add optional api_secret column for providers that need key+secret (e.g., WooCommerce)
alter table public.integration_api_credentials
  add column if not exists api_secret text;

-- 3. Add optional base_url column for providers that need a store URL (e.g., WooCommerce, Shopify)
alter table public.integration_api_credentials
  add column if not exists base_url text;
