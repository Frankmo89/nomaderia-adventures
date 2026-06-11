-- park_live_data: machine-synced live data refreshed by sync-park-live-data.
-- SOUL/Live boundary rule:
--   public.destinations  → curated, editor-owned, Spanish-language content (never overwritten by sync jobs)
--   public.park_live_data → volatile live data fetched from NPS + RIDB (overwritten on every sync run)
--   Edge functions that ingest official data MUST write ONLY to park_live_data, never to destinations.

CREATE TABLE public.park_live_data (
  id              uuid        NOT NULL DEFAULT gen_random_uuid(),
  park_code       text        NOT NULL UNIQUE,
  destination_id  uuid        NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  -- NPS /parks fields (full mode)
  entrance_fees   jsonb,        -- [{cost, description, title}]
  operating_hours jsonb,        -- [{name, description, standardHours, exceptions}]
  images          jsonb,        -- [{url, altText, title, caption, credit}]
  lat_long        text,         -- raw NPS "lat:X, long:Y" string
  -- NPS /alerts (refreshed in both modes)
  alerts          jsonb,        -- [{id, title, description, category, url, lastIndexedDate}]
  -- RIDB campground quick-links (full mode)
  campgrounds     jsonb,        -- [{facilityId, nombre, reservation_url}]
  -- Sync metadata
  sync_errors     jsonb        NOT NULL DEFAULT '[]', -- [{step, error}] from last sync run
  synced_at       timestamptz  NOT NULL DEFAULT now(),
  created_at      timestamptz  NOT NULL DEFAULT now(),
  updated_at      timestamptz  NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TRIGGER update_park_live_data_updated_at
  BEFORE UPDATE ON public.park_live_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.park_live_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read park live data"
  ON public.park_live_data FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage park live data"
  ON public.park_live_data FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
