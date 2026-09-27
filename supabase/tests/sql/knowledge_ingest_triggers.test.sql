-- Behaviour tests for 20260926120000_knowledge_ingest_content_triggers.sql.
-- Run by scripts/test-sql.sh (CI job "sql-tests") after _stub_schema.sql and
-- the migration. Plain SQL: any failed assertion raises and psql exits non-zero.

\set ON_ERROR_STOP on
SET client_min_messages = warning;

CREATE FUNCTION pg_temp.assert_eq(got anyelement, want anyelement, label text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF got IS DISTINCT FROM want THEN
    RAISE EXCEPTION 'FAIL: % (got %, want %)', label, got, want;
  END IF;
  RAISE NOTICE 'ok: %', label;
END $$;

CREATE FUNCTION pg_temp.version_of(code text) RETURNS integer
LANGUAGE sql AS $$ SELECT content_version FROM public.destinations WHERE park_code = code $$;

CREATE FUNCTION pg_temp.requests() RETURNS bigint
LANGUAGE sql AS $$ SELECT count(*) FROM net._test_requests $$;

SET client_min_messages = notice;

INSERT INTO vault.decrypted_secrets VALUES ('ingest_knowledge_jwt', 'test-jwt');

INSERT INTO public.destinations (title, slug, park_code, why_visit_markdown, good_for, faqs, signature_hikes)
VALUES ('Test Park', 'test-park', 'tstp', 'Original text', ARRAY['familias', 'principiantes'],
        '[{"p": "¿Hay agua?", "r": "Sí"}]'::jsonb, '[{"nombre": "Loop", "distancia_km": 3}]'::jsonb);

-- Insert enqueues one scoped ingest, with the Vault JWT and the exact body shape.
SELECT pg_temp.assert_eq(pg_temp.requests(), 1::bigint, 'insert enqueues one ingest');
SELECT pg_temp.assert_eq(
  (SELECT body FROM net._test_requests ORDER BY id DESC LIMIT 1),
  '{"source": "destinations", "park_codes": ["tstp"]}'::jsonb,
  'body is {source, park_codes:[park_code]}');
SELECT pg_temp.assert_eq(
  (SELECT headers->>'Authorization' FROM net._test_requests ORDER BY id DESC LIMIT 1),
  'Bearer test-jwt', 'Authorization comes from Vault');
SELECT pg_temp.assert_eq(pg_temp.version_of('tstp'), 1, 'new park starts at version 1');

-- Scenario 1: content field change -> bump (and enqueue).
UPDATE public.destinations SET why_visit_markdown = 'Edited text' WHERE park_code = 'tstp';
SELECT pg_temp.assert_eq(pg_temp.version_of('tstp'), 2, 'S1 content field change bumps');
SELECT pg_temp.assert_eq(pg_temp.requests(), 2::bigint, 'S1 bump enqueues ingest (BEFORE-trigger change seen by AFTER WHEN)');

-- Scenario 2: non-ingested field alone -> no bump, no call.
UPDATE public.destinations SET hero_image_url = 'https://example.com/x.jpg', season_short = 'Oct–Abr', is_published = true
 WHERE park_code = 'tstp';
SELECT pg_temp.assert_eq(pg_temp.version_of('tstp'), 2, 'S2 non-ingested field alone does not bump');
SELECT pg_temp.assert_eq(pg_temp.requests(), 2::bigint, 'S2 no ingest call');

-- Scenario 3: identical resave (admin form sends every field) -> no bump.
UPDATE public.destinations d SET
  title = d.title, slug = d.slug, park_code = d.park_code, why_visit_markdown = d.why_visit_markdown,
  good_for = d.good_for, faqs = '[{"r": "Sí", "p": "¿Hay agua?"}]'::jsonb,  -- same jsonb, keys reordered
  signature_hikes = d.signature_hikes, crowd_calendar = d.crowd_calendar
 WHERE park_code = 'tstp';
SELECT pg_temp.assert_eq(pg_temp.version_of('tstp'), 2, 'S3 identical resave does not bump');
SELECT pg_temp.assert_eq(pg_temp.requests(), 2::bigint, 'S3 no ingest call');

-- Scenario 4: jsonb field change -> bump.
UPDATE public.destinations SET faqs = '[{"p": "¿Hay agua?", "r": "No, lleva 4 litros"}]'::jsonb
 WHERE park_code = 'tstp';
SELECT pg_temp.assert_eq(pg_temp.version_of('tstp'), 3, 'S4 jsonb change bumps');

-- Scenario 5: manual version alongside a content change -> manual value wins.
UPDATE public.destinations SET wildlife = 'Borregos cimarrones', content_version = 42 WHERE park_code = 'tstp';
SELECT pg_temp.assert_eq(pg_temp.version_of('tstp'), 42, 'S5 manual version is respected');

-- Scenario 6: array -> NULL -> bump.
UPDATE public.destinations SET good_for = NULL WHERE park_code = 'tstp';
SELECT pg_temp.assert_eq(pg_temp.version_of('tstp'), 43, 'S6 array to NULL bumps');

-- Campgrounds: insert / ingested-field update / non-ingested update / delete.
INSERT INTO public.campgrounds (destination_id, nombre)
SELECT id, 'Camp A' FROM public.destinations WHERE park_code = 'tstp';
SELECT pg_temp.assert_eq(pg_temp.version_of('tstp'), 44, 'campground insert bumps parent');

UPDATE public.campgrounds SET precio_usd = 25 WHERE nombre = 'Camp A';
SELECT pg_temp.assert_eq(pg_temp.version_of('tstp'), 45, 'campground ingested-field update bumps parent');

UPDATE public.campgrounds SET accesibilidad_nota = 'Rampa' WHERE nombre = 'Camp A';
SELECT pg_temp.assert_eq(pg_temp.version_of('tstp'), 45, 'campground non-ingested update does not bump');

DELETE FROM public.campgrounds WHERE nombre = 'Camp A';
SELECT pg_temp.assert_eq(pg_temp.version_of('tstp'), 46, 'campground delete bumps parent');

-- Missing Vault secret: save still succeeds, version still bumps, no call made.
DELETE FROM vault.decrypted_secrets;
SELECT pg_temp.requests() AS before_missing \gset
SET client_min_messages = error;  -- silence the expected WARNING
UPDATE public.destinations SET safety_markdown = 'Nuevo' WHERE park_code = 'tstp';
SET client_min_messages = notice;
SELECT pg_temp.assert_eq(pg_temp.version_of('tstp'), 47, 'missing secret: save and bump still succeed');
SELECT pg_temp.assert_eq(pg_temp.requests(), :before_missing::bigint, 'missing secret: no call made');

-- Old dashboard webhooks are gone.
SELECT pg_temp.assert_eq(
  (SELECT count(*) FROM pg_trigger WHERE tgname IN ('auto-ingest-destinations', 'auto-ingest-gear_articles')),
  0::bigint, 'dashboard webhooks dropped');

\echo 'knowledge_ingest_triggers: all assertions passed'
