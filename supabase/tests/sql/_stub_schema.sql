-- CI-ONLY stub of the production objects the knowledge-ingest triggers touch.
-- Loaded into a throwaway Postgres before the migration and the test file.
-- Column types match production (checked against information_schema, 2026-09-26).
-- NEVER run this against the Supabase project: the guard below refuses.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname IN ('supabase_functions', 'auth')) THEN
    RAISE EXCEPTION 'CI-only stub: refusing to run against a Supabase database';
  END IF;
END $$;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.destinations (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title                    text NOT NULL,
  slug                     text NOT NULL,
  park_code                text,
  short_description        text,
  difficulty_description   text,
  good_for                 text[],
  not_ideal_if             text[],
  why_visit_markdown       text,
  itinerary_markdown       text,
  preparation_plan         text,
  gear_list_markdown       text,
  safety_markdown          text,
  getting_there_markdown   text,
  weather_markdown         text,
  accessibility_markdown   text,
  signature_hikes          jsonb DEFAULT '[]'::jsonb,
  lodging_info             jsonb DEFAULT '[]'::jsonb,
  with_kids_markdown       text,
  food_nearby_markdown     text,
  pet_policy_markdown      text,
  seasonal_closures        text,
  common_fears             jsonb DEFAULT '[]'::jsonb,
  faqs                     jsonb DEFAULT '[]'::jsonb,
  wildlife                 text,
  concierge_quick_facts    text,
  best_basecamp            text,
  signature_experience     text,
  crowd_calendar           jsonb DEFAULT '{}'::jsonb,
  nearby_parks             jsonb DEFAULT '{}'::jsonb,
  gateway_airport          jsonb DEFAULT '{}'::jsonb,
  itinerary_budget         jsonb DEFAULT '{}'::jsonb,
  special_dates            jsonb DEFAULT '[]'::jsonb,
  zone_closures            jsonb DEFAULT '[]'::jsonb,
  rv_max_length_ft         integer,
  backcountry_camping_free boolean DEFAULT false,
  photo_spots              jsonb DEFAULT '[]'::jsonb,
  -- not ingested:
  hero_image_url           text,
  season_short             text,
  is_published             boolean DEFAULT false,
  content_version          integer DEFAULT 1,
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.campgrounds (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id     uuid NOT NULL REFERENCES public.destinations(id),
  nombre             text NOT NULL,
  nota_soul          text,
  precio_usd         numeric,
  precio_nota        text,
  rv_max_pies        integer,
  tiene_agua         boolean,
  senal_celular      text,
  es_recomendado     boolean DEFAULT false,
  accesibilidad_nota text  -- not ingested
);

CREATE TABLE public.gear_articles (id uuid PRIMARY KEY DEFAULT gen_random_uuid());

-- The dashboard webhooks the migration must drop (dummy function body).
CREATE FUNCTION public._stub_old_webhook() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NULL; END $$;
CREATE TRIGGER "auto-ingest-destinations" AFTER INSERT OR UPDATE ON public.destinations
  FOR EACH ROW EXECUTE FUNCTION public._stub_old_webhook();
CREATE TRIGGER "auto-ingest-gear_articles" AFTER INSERT OR UPDATE ON public.gear_articles
  FOR EACH ROW EXECUTE FUNCTION public._stub_old_webhook();

-- pg_net stub: records calls instead of sending them. Same signature as prod.
CREATE SCHEMA net;
CREATE TABLE net._test_requests (
  id      bigserial PRIMARY KEY,
  url     text,
  body    jsonb,
  headers jsonb,
  timeout_milliseconds integer
);
CREATE FUNCTION net.http_post(
  url text,
  body jsonb DEFAULT '{}'::jsonb,
  params jsonb DEFAULT '{}'::jsonb,
  headers jsonb DEFAULT '{"Content-Type": "application/json"}'::jsonb,
  timeout_milliseconds integer DEFAULT 5000
) RETURNS bigint LANGUAGE sql AS $$
  INSERT INTO net._test_requests (url, body, headers, timeout_milliseconds)
  VALUES (url, body, headers, timeout_milliseconds)
  RETURNING id;
$$;

-- Vault stub.
CREATE SCHEMA vault;
CREATE TABLE vault.decrypted_secrets (name text PRIMARY KEY, decrypted_secret text);
