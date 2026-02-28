-- PROD-01C: Activity timeline for pharmacies/herbalists.
-- Tracks calls, emails, visits, notes, and tasks per pharmacy.

CREATE TABLE public.pharmacy_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('call', 'email', 'visit', 'note', 'task')),
  title text NOT NULL,
  description text NULL,
  due_at timestamptz NULL,
  completed_at timestamptz NULL,
  owner text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pharmacy_activities_timeline
  ON public.pharmacy_activities(pharmacy_id, created_at DESC);

CREATE INDEX idx_pharmacy_activities_pending
  ON public.pharmacy_activities(pharmacy_id, completed_at, due_at);

-- Reuse existing trigger function for updated_at
CREATE TRIGGER update_pharmacy_activities_updated_at
  BEFORE UPDATE ON public.pharmacy_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.pharmacy_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can select activities"
  ON public.pharmacy_activities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert activities"
  ON public.pharmacy_activities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update activities"
  ON public.pharmacy_activities FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete activities"
  ON public.pharmacy_activities FOR DELETE
  TO authenticated
  USING (true);
