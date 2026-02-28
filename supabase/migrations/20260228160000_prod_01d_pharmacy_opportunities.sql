-- PROD-01D: Commercial opportunities per pharmacy for simple forecast.
-- Tracks deal title, stage, amount, probability, and expected close date.

CREATE TABLE public.pharmacy_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  title text NOT NULL,
  stage text NOT NULL CHECK (stage IN ('qualified', 'proposal', 'negotiation', 'won', 'lost')),
  amount numeric(12, 2) NOT NULL DEFAULT 0,
  probability int NOT NULL DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date date NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pharmacy_opportunities_stage
  ON public.pharmacy_opportunities(pharmacy_id, stage, expected_close_date);

CREATE INDEX idx_pharmacy_opportunities_timeline
  ON public.pharmacy_opportunities(pharmacy_id, created_at DESC);

CREATE TRIGGER update_pharmacy_opportunities_updated_at
  BEFORE UPDATE ON public.pharmacy_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.pharmacy_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can select opportunities"
  ON public.pharmacy_opportunities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert opportunities"
  ON public.pharmacy_opportunities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update opportunities"
  ON public.pharmacy_opportunities FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete opportunities"
  ON public.pharmacy_opportunities FOR DELETE
  TO authenticated
  USING (true);
