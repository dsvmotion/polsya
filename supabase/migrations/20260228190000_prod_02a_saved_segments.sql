-- PROD-02A: Saved filter segments for reusable commercial searches.
-- Stores named filter presets scoped to operations or prospecting.

CREATE TABLE public.saved_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NULL,
  scope text NOT NULL DEFAULT 'operations' CHECK (scope IN ('operations', 'prospecting')),
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, scope)
);

CREATE INDEX idx_saved_segments_scope_favorite
  ON public.saved_segments(scope, is_favorite DESC, updated_at DESC);

CREATE TRIGGER update_saved_segments_updated_at
  BEFORE UPDATE ON public.saved_segments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.saved_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can select segments"
  ON public.saved_segments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert segments"
  ON public.saved_segments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update segments"
  ON public.saved_segments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete segments"
  ON public.saved_segments FOR DELETE
  TO authenticated
  USING (true);
