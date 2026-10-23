-- media_slider: `caption`, the park a photo shows («Joshua Tree · California»).
--
-- The home hero now plays the photos Frank keeps active in /admin/galeria
-- (ADR-046) and shows the park under each one. He types it in the panel.
--
-- web_url / web_storage_path were added in the same step for a planned
-- "light web copy" made in the panel. It turned out not to be needed: the
-- project already serves resized images through Supabase's render endpoint
-- (`src/lib/resized-image.ts`, 200/304 in the logs). Both columns stay empty
-- and unused; dropping them needs Frank's OK (see docs/pending-tasks.md).
--
-- Additive: nullable columns, no policy changes; the existing admin update
-- policy covers writing them. Applied 2026-10-23 via Supabase MCP.

ALTER TABLE public.media_slider
  ADD COLUMN IF NOT EXISTS web_url text,
  ADD COLUMN IF NOT EXISTS web_storage_path text,
  ADD COLUMN IF NOT EXISTS caption text;

COMMENT ON COLUMN public.media_slider.web_url IS
  'Public URL of the light web copy (≤1600 px). Null until the panel makes it.';
COMMENT ON COLUMN public.media_slider.web_storage_path IS
  'Path of the web copy in the media_gallery bucket (web/<uuid>.webp|jpg).';
COMMENT ON COLUMN public.media_slider.caption IS
  'Park shown in the photo, e.g. "Joshua Tree · California". Optional.';
