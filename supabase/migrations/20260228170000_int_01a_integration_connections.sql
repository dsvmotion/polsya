-- INT-01A: Integration connections registry.
-- Tracks external service connections (Woo, Shopify, Gmail, etc.) with status and metadata.
-- NO secrets/tokens stored here — only non-sensitive metadata.

CREATE TABLE public.integration_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('woocommerce', 'shopify', 'gmail', 'notion', 'openai', 'anthropic', 'custom_api')),
  display_name text NOT NULL,
  status text NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  is_enabled boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_sync_at timestamptz NULL,
  last_error text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, display_name)
);

CREATE INDEX idx_integration_connections_provider_status
  ON public.integration_connections(provider, status);

CREATE INDEX idx_integration_connections_enabled
  ON public.integration_connections(is_enabled, updated_at DESC);

CREATE TRIGGER update_integration_connections_updated_at
  BEFORE UPDATE ON public.integration_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can select integrations"
  ON public.integration_connections FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert integrations"
  ON public.integration_connections FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update integrations"
  ON public.integration_connections FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete integrations"
  ON public.integration_connections FOR DELETE
  TO authenticated
  USING (true);
