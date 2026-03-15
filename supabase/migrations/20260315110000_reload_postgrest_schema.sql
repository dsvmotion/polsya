-- Force PostgREST to reload its schema cache so it discovers
-- recently created tables (billing_subscriptions, integration_api_credentials, etc.)
NOTIFY pgrst, 'reload schema';
