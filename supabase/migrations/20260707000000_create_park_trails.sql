-- park_trails: hiking trail listings synced from the NPS /thingstodo endpoint
-- (activity=Hiking) by the sync-park-trails Edge Function.
-- SOUL/Live boundary rule (same as park_live_data, see 20260611000000):
--   public.destinations  → curated, editor-owned, Spanish-language content (never overwritten by sync jobs)
--   public.park_trails   → machine-synced trail data fetched from NPS (overwritten on every sync run)
-- One row per NPS "thing to do" item; nps_thing_id is the NPS-assigned id,
-- deduped per park via the unique constraint below so re-syncs upsert in place.

CREATE TABLE public.park_trails (
  id              uuid        NOT NULL DEFAULT gen_random_uuid(),
  park_code       text        NOT NULL,
  destination_id  uuid        NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  nps_thing_id    text        NOT NULL,  -- NPS /thingstodo `id` — dedup key across syncs
  name            text        NOT NULL,
  -- Raw NPS text (English) — the NPS API has no Spanish content and this sync
  -- does not machine-translate (no translation service in this pipeline).
  -- Manual Spanish curation is a future/manual step. See docs/pending-tasks.md.
  description_es  text,
  -- NPS /thingstodo has no mileage field. Stores the NPS `duration` free-text
  -- value (e.g. "1 to 2 hours"), NOT a parsed distance in miles.
  distance        text,
  -- NPS /thingstodo has no difficulty rating. Always NULL until a future data
  -- source is added — intentionally not inferred/fabricated from duration.
  difficulty      text,
  coordinates     jsonb,      -- {lat, lng} or null if NPS didn't return coordinates
  nps_url         text,
  synced_at       timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (park_code, nps_thing_id)
);

CREATE INDEX idx_park_trails_park_code ON public.park_trails(park_code);

CREATE TRIGGER update_park_trails_updated_at
  BEFORE UPDATE ON public.park_trails
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.park_trails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read park trails"
  ON public.park_trails FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage park trails"
  ON public.park_trails FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
