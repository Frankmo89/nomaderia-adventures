-- Add friendly_slug to client_itineraries so URLs look like
-- nomaderia.com/i/maria-yosemite-x8k2 instead of the raw hex token.
-- The column is nullable so existing rows keep working via share_token.

ALTER TABLE public.client_itineraries
  ADD COLUMN IF NOT EXISTS friendly_slug text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_client_itineraries_friendly_slug
  ON public.client_itineraries(friendly_slug);
