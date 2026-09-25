-- T05 — Phase 1 funnel leads (email + park choice after quiz ranking).
-- Distinct from sentinel_leads / quiz_responses / itinerary_requests.
-- Additive only. Frank: paste in SQL Editor (do not db push).
-- Client generates id with crypto.randomUUID() and never SELECTs the row back.

CREATE TABLE IF NOT EXISTS public.leads (
  id                      uuid PRIMARY KEY,
  created_at              timestamptz NOT NULL DEFAULT now(),
  email                   text NOT NULL,
  session_id              text,
  selected_park_code      text,
  selected_destination_id uuid REFERENCES public.destinations(id) ON DELETE SET NULL,
  quiz_answers            jsonb NOT NULL DEFAULT '{}'::jsonb,
  top_park_codes          text[] NOT NULL DEFAULT '{}'::text[]
);

CREATE INDEX IF NOT EXISTS leads_created_at_idx
  ON public.leads (created_at DESC);

CREATE INDEX IF NOT EXISTS leads_email_idx
  ON public.leads (email);

CREATE INDEX IF NOT EXISTS leads_selected_park_code_idx
  ON public.leads (selected_park_code)
  WHERE selected_park_code IS NOT NULL;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Anon (and authenticated) may insert; never select as public.
CREATE POLICY "Anyone can insert leads"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins may read (existing has_role — do not modify the RPC).
CREATE POLICY "Admins can select leads"
ON public.leads
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
