-- park_trails_sync_state: per-park bookkeeping for sync-park-trails' batch
-- rotation. Independent of park_trails row existence — a park with zero
-- Hiking-tagged /thingstodo results (e.g. Channel Islands "chis", Saguaro
-- "sagu") still needs its sync attempt recorded here, otherwise the
-- least-recently-synced priority query (previously MAX(park_trails.synced_at)
-- GROUP BY park_code) always sees it as "never synced" and re-selects it on
-- every single invocation instead of rotating the batch forward. See
-- docs/pending-tasks.md (julio 2026) for the bug this fixes.

CREATE TABLE public.park_trails_sync_state (
  park_code       text        NOT NULL,
  destination_id  uuid        NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  synced_at       timestamptz NOT NULL DEFAULT now(),
  trail_count     integer     NOT NULL DEFAULT 0,
  last_error      text,       -- last sync_errors message, if the attempt failed (best effort, not authoritative)
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (park_code)
);

CREATE TRIGGER update_park_trails_sync_state_updated_at
  BEFORE UPDATE ON public.park_trails_sync_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.park_trails_sync_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read park trails sync state"
  ON public.park_trails_sync_state FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage park trails sync state"
  ON public.park_trails_sync_state FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
