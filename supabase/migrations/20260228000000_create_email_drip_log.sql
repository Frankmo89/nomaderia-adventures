CREATE TABLE public.email_drip_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  email_type TEXT NOT NULL, -- 'quiz_results' | 'gear_guide' | 'itinerary_cta'
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'sent', -- 'sent' | 'failed'
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.email_drip_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read email logs"
ON public.email_drip_log
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Índice para búsqueda rápida de duplicados
CREATE INDEX idx_email_drip_log_email_type ON public.email_drip_log(email, email_type);
