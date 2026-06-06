-- Extended columns for generate-park-content AI pipeline (v2)
-- Depends on: 20260605100000_add_park_content_columns.sql

ALTER TABLE public.destinations
  ADD COLUMN IF NOT EXISTS min_days               INTEGER,
  ADD COLUMN IF NOT EXISTS max_days               INTEGER,
  ADD COLUMN IF NOT EXISTS peak_season            TEXT,
  ADD COLUMN IF NOT EXISTS beginner_friendly      BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS accessibility_markdown TEXT,
  ADD COLUMN IF NOT EXISTS top_activities         TEXT[],
  ADD COLUMN IF NOT EXISTS good_for               TEXT[],
  ADD COLUMN IF NOT EXISTS not_ideal_if           TEXT[],
  ADD COLUMN IF NOT EXISTS internal_notes         TEXT;

COMMENT ON COLUMN public.destinations.min_days IS 'Mínimo de días recomendados (IA draft, verificar)';
COMMENT ON COLUMN public.destinations.max_days IS 'Máximo de días recomendados (IA draft, verificar)';
COMMENT ON COLUMN public.destinations.peak_season IS 'Temporada de mayor afluencia (IA draft)';
COMMENT ON COLUMN public.destinations.beginner_friendly IS 'True si un principiante sin experiencia puede disfrutar el parque';
COMMENT ON COLUMN public.destinations.accessibility_markdown IS 'Notas de accesibilidad (IA draft)';
COMMENT ON COLUMN public.destinations.top_activities IS 'Lista de actividades principales (IA draft)';
COMMENT ON COLUMN public.destinations.good_for IS 'Perfiles ideales para el parque (IA draft)';
COMMENT ON COLUMN public.destinations.not_ideal_if IS 'Condiciones para quienes NO es ideal (IA draft)';
COMMENT ON COLUMN public.destinations.internal_notes IS 'Notas internas: flags ⚠️ VERIFICAR (IA), observaciones de curación manual';
