-- Columns required by the generate-park-content AI pipeline
ALTER TABLE public.destinations
  ADD COLUMN IF NOT EXISTS nps_description   TEXT,
  ADD COLUMN IF NOT EXISTS research_status   TEXT NOT NULL DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS meta_title        TEXT,
  ADD COLUMN IF NOT EXISTS meta_description  TEXT,
  ADD COLUMN IF NOT EXISTS last_verified_at  TIMESTAMPTZ;

COMMENT ON COLUMN public.destinations.nps_description  IS 'Raw English description from NPS API — used as AI generation input';
COMMENT ON COLUMN public.destinations.research_status  IS 'pendiente | ai_draft | revisado | publicado';
COMMENT ON COLUMN public.destinations.meta_title       IS 'SEO title (≤60 chars), Spanish';
COMMENT ON COLUMN public.destinations.meta_description IS 'SEO meta description (≤155 chars), Spanish';
COMMENT ON COLUMN public.destinations.last_verified_at IS 'Timestamp of last AI generation or human review';
