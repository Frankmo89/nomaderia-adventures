CREATE TABLE public.ai_content_meta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  verify_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  model TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (content_type, content_id)
);

ALTER TABLE public.ai_content_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage ai_content_meta" ON public.ai_content_meta
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
