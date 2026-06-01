CREATE TABLE public.destination_ai_meta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id UUID REFERENCES public.destinations(id) ON DELETE CASCADE NOT NULL,
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  verify_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  model TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (destination_id)
);

ALTER TABLE public.destination_ai_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage destination_ai_meta" ON public.destination_ai_meta
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
