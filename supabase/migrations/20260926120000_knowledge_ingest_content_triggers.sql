-- Content-driven knowledge ingest: bump destinations.content_version when an
-- ingested field changes, and call ingest-knowledge for that one park only.
--
-- Replaces the dashboard-made webhooks "auto-ingest-destinations" and
-- "auto-ingest-gear_articles". Those posted the fixed
-- supabase_functions.http_request payload ({type, table, record, ...}) on
-- EVERY row insert/update. ingest-knowledge ignores that shape, so each call
-- scanned all 63 parks (~1,800 calls since June). Nothing ever bumped
-- content_version, so a real content edit was never re-embedded unless
-- someone remembered to. The gear webhook only ever triggered a destinations
-- scan: gear isn't ingested (ingest-knowledge returns 400 for other sources).
-- When gear ingestion exists, give it its own trigger following this pattern.
--
-- Pieces:
--   1. destinations BEFORE UPDATE: bump content_version when any column that
--      ingest-knowledge reads changes, unless the caller set the version
--      itself in the same UPDATE (manual value wins).
--   2. campgrounds AFTER INSERT/UPDATE/DELETE: bump the parent park, since
--      ingest-knowledge folds curated campgrounds into that park's chunks.
--   3. destinations AFTER INSERT, and AFTER UPDATE WHEN content_version
--      changed: pg_net POST {source, park_codes: [park_code]}.
--
-- The column lists in (1) and (2) must match what ingest-knowledge selects.
-- src/lib/knowledge-ingest-columns.test.ts fails CI if they drift.
-- Behaviour is tested in supabase/tests/sql/knowledge_ingest_triggers.test.sql.
--
-- ⚠ MANUAL STEP BEFORE THIS DOES ANYTHING: create a Vault secret named
-- "ingest_knowledge_jwt" holding a legacy service_role JWT (eyJ...).
-- ingest-knowledge runs with verify_jwt = true and the new sb_secret_ keys are
-- not JWTs. Without the secret, (3) logs a WARNING and skips; saves never fail.
--
-- Idempotent: safe to paste into the SQL editor more than once.

-- ── 1. Bump content_version on ingested-field changes ────────────────────────
CREATE OR REPLACE FUNCTION public.bump_destination_content_version()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $fn$
BEGIN
  -- Row comparison is positional: keep the OLD and NEW lists in the same order.
  -- ingested-columns:start
  IF (OLD.title, OLD.park_code, OLD.slug,
      OLD.short_description, OLD.difficulty_description, OLD.good_for, OLD.not_ideal_if,
      OLD.why_visit_markdown, OLD.itinerary_markdown, OLD.preparation_plan,
      OLD.gear_list_markdown, OLD.safety_markdown, OLD.getting_there_markdown, OLD.weather_markdown,
      OLD.accessibility_markdown, OLD.signature_hikes, OLD.lodging_info,
      OLD.with_kids_markdown, OLD.food_nearby_markdown, OLD.pet_policy_markdown,
      OLD.seasonal_closures, OLD.common_fears, OLD.faqs, OLD.wildlife,
      OLD.concierge_quick_facts, OLD.best_basecamp, OLD.signature_experience,
      OLD.crowd_calendar, OLD.nearby_parks, OLD.gateway_airport, OLD.itinerary_budget,
      OLD.special_dates, OLD.zone_closures,
      OLD.rv_max_length_ft, OLD.backcountry_camping_free, OLD.photo_spots)
     IS DISTINCT FROM
     (NEW.title, NEW.park_code, NEW.slug,
      NEW.short_description, NEW.difficulty_description, NEW.good_for, NEW.not_ideal_if,
      NEW.why_visit_markdown, NEW.itinerary_markdown, NEW.preparation_plan,
      NEW.gear_list_markdown, NEW.safety_markdown, NEW.getting_there_markdown, NEW.weather_markdown,
      NEW.accessibility_markdown, NEW.signature_hikes, NEW.lodging_info,
      NEW.with_kids_markdown, NEW.food_nearby_markdown, NEW.pet_policy_markdown,
      NEW.seasonal_closures, NEW.common_fears, NEW.faqs, NEW.wildlife,
      NEW.concierge_quick_facts, NEW.best_basecamp, NEW.signature_experience,
      NEW.crowd_calendar, NEW.nearby_parks, NEW.gateway_airport, NEW.itinerary_budget,
      NEW.special_dates, NEW.zone_closures,
      NEW.rv_max_length_ft, NEW.backcountry_camping_free, NEW.photo_spots)
  -- ingested-columns:end
     AND NEW.content_version IS NOT DISTINCT FROM OLD.content_version
  THEN
    NEW.content_version := COALESCE(OLD.content_version, 0) + 1;
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS destinations_bump_content_version ON public.destinations;
CREATE TRIGGER destinations_bump_content_version
  BEFORE UPDATE ON public.destinations
  FOR EACH ROW EXECUTE FUNCTION public.bump_destination_content_version();

-- ── 2. Campground changes bump the parent park ────────────────────────────────
CREATE OR REPLACE FUNCTION public.bump_campground_destination_content_version()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $fn$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    UPDATE public.destinations
       SET content_version = COALESCE(content_version, 0) + 1
     WHERE id = OLD.destination_id;
  END IF;
  IF TG_OP = 'INSERT'
     OR (TG_OP = 'UPDATE' AND NEW.destination_id IS DISTINCT FROM OLD.destination_id) THEN
    UPDATE public.destinations
       SET content_version = COALESCE(content_version, 0) + 1
     WHERE id = NEW.destination_id;
  END IF;
  RETURN NULL;
END;
$fn$;

DROP TRIGGER IF EXISTS campgrounds_bump_destination_content_version ON public.campgrounds;
CREATE TRIGGER campgrounds_bump_destination_content_version
  AFTER INSERT OR DELETE ON public.campgrounds
  FOR EACH ROW EXECUTE FUNCTION public.bump_campground_destination_content_version();

DROP TRIGGER IF EXISTS campgrounds_bump_destination_content_version_upd ON public.campgrounds;
CREATE TRIGGER campgrounds_bump_destination_content_version_upd
  AFTER UPDATE ON public.campgrounds
  FOR EACH ROW
  -- campground-columns:start
  WHEN ((OLD.destination_id, OLD.nombre, OLD.nota_soul, OLD.precio_usd, OLD.precio_nota,
         OLD.rv_max_pies, OLD.tiene_agua, OLD.senal_celular, OLD.es_recomendado)
        IS DISTINCT FROM
        (NEW.destination_id, NEW.nombre, NEW.nota_soul, NEW.precio_usd, NEW.precio_nota,
         NEW.rv_max_pies, NEW.tiene_agua, NEW.senal_celular, NEW.es_recomendado))
  -- campground-columns:end
  EXECUTE FUNCTION public.bump_campground_destination_content_version();

-- ── 3. Call ingest-knowledge for one park when its content version moves ─────
CREATE OR REPLACE FUNCTION public.enqueue_knowledge_ingest()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  v_jwt text;
BEGIN
  IF NEW.park_code IS NULL THEN
    RETURN NULL;
  END IF;
  -- Never let the webhook break an admin save: warn and move on.
  BEGIN
    SELECT decrypted_secret INTO v_jwt
      FROM vault.decrypted_secrets
     WHERE name = 'ingest_knowledge_jwt';
    IF v_jwt IS NULL THEN
      RAISE WARNING 'enqueue_knowledge_ingest: Vault secret ingest_knowledge_jwt missing; % not re-ingested', NEW.park_code;
      RETURN NULL;
    END IF;
    -- pg_net sends only after this transaction commits, so the function
    -- always reads the committed row.
    PERFORM net.http_post(
      url := 'https://vrixiuvnhvqafmxlcyex.supabase.co/functions/v1/ingest-knowledge',
      body := jsonb_build_object(
        'source', 'destinations',
        'park_codes', jsonb_build_array(NEW.park_code)
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_jwt
      ),
      timeout_milliseconds := 15000
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'enqueue_knowledge_ingest: % not re-ingested: %', NEW.park_code, SQLERRM;
  END;
  RETURN NULL;
END;
$fn$;

REVOKE ALL ON FUNCTION public.enqueue_knowledge_ingest() FROM PUBLIC;

DROP TRIGGER IF EXISTS destinations_enqueue_knowledge_ingest_insert ON public.destinations;
CREATE TRIGGER destinations_enqueue_knowledge_ingest_insert
  AFTER INSERT ON public.destinations
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_knowledge_ingest();

-- No "UPDATE OF content_version" column list on purpose: a column-list trigger
-- only fires when the column is in the UPDATE's SET list, and ignores changes
-- made by BEFORE triggers. The admin form never sets content_version, so the
-- bump from (1) would never fire it. WHEN sees the final NEW row.
DROP TRIGGER IF EXISTS destinations_enqueue_knowledge_ingest_update ON public.destinations;
CREATE TRIGGER destinations_enqueue_knowledge_ingest_update
  AFTER UPDATE ON public.destinations
  FOR EACH ROW
  WHEN (OLD.content_version IS DISTINCT FROM NEW.content_version)
  EXECUTE FUNCTION public.enqueue_knowledge_ingest();

-- ── 4. Retire the dashboard webhooks ─────────────────────────────────────────
DROP TRIGGER IF EXISTS "auto-ingest-destinations" ON public.destinations;
DROP TRIGGER IF EXISTS "auto-ingest-gear_articles" ON public.gear_articles;
