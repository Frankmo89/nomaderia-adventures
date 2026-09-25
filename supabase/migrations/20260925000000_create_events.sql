-- T02 — Product analytics events (Phase 1 AI funnel).
-- Distinct from admin_events (admin WhatsApp-click tracking).
-- Additive only. Frank: paste in SQL Editor (do not db push).

CREATE TABLE IF NOT EXISTS public.events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  session_id  text NOT NULL,
  lead_id     uuid NULL,
  type        text NOT NULL,
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS events_created_at_idx
  ON public.events (created_at DESC);

CREATE INDEX IF NOT EXISTS events_session_id_idx
  ON public.events (session_id);

CREATE INDEX IF NOT EXISTS events_type_idx
  ON public.events (type);

CREATE INDEX IF NOT EXISTS events_lead_id_idx
  ON public.events (lead_id)
  WHERE lead_id IS NOT NULL;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Anon (and authenticated) may insert; never select as public.
CREATE POLICY "Anyone can insert events"
ON public.events
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins may read (existing has_role — do not modify the RPC).
CREATE POLICY "Admins can select events"
ON public.events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
