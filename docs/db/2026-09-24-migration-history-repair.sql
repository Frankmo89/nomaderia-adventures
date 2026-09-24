-- =============================================================================
-- ONE-OFF metadata repair — NOT a supabase/migrations file.
-- Run in SQL Editor AFTER merging the repo renames/deletes AND preferably
-- after (or with) applying 20260924180000 / 20260924180100 via apply_migration
-- or SQL Editor.
--
-- Purpose: insert schema_migrations rows for migrations whose objects already
-- exist in prod but were never recorded (manual SQL Editor applies historically).
-- Does NOT run DDL. Idempotent via ON CONFLICT (version) DO NOTHING.
--
-- schema_migrations: version (PK), name, statements, created_by,
--   idempotency_key, rollback
--
-- Already recorded in prod (SKIP):
--   20260218064349 | 5a5a5e12-1c26-4604-8566-374c76f480b9
--   20260611000000 | create_park_live_data
--   20260720050056 | extend_client_itineraries_foundation
--
-- Repo alignment (this PR):
--   - Renamed extend file → 20260720050056_… (matches prod; no insert needed)
--   - Renamed blog enhancements → 20260218170000_blog_enhancements
--   - Deleted 20260601000000_create_destination_ai_meta (obsolete; omit)
--   - New forward migrations 20260924180000 / 20260924180100 will be recorded
--     automatically when applied with `supabase migration up` / apply_migration,
--     OR insert them manually if you paste those files in the SQL Editor.
-- =============================================================================

BEGIN;

INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES
  ('20260218162416', 'fa25245e-d181-4911-8234-b2e6eeb99b1f', NULL),
  ('20260218170000', 'blog_enhancements', NULL),
  ('20260218200000', 'fix_blog_posts_rls_policy', NULL),
  ('20260218210000', 'add_itinerary_requests', NULL),
  ('20260228000000', 'create_email_drip_log', NULL),
  ('20260228000001', 'setup_pg_cron_drip', NULL),
  ('20260524000000', 'sentinel_leads_admin_select', NULL),
  -- 20260601000000 create_destination_ai_meta intentionally OMITTED (deleted from repo)
  ('20260601103000', 'add_destinations_access_fields', NULL),
  ('20260601114000', 'create_ai_content_meta', NULL),
  ('20260601120000', 'create_permit_alerts_tables', NULL),
  ('20260604061822', 'add_lead_status_tracking', NULL),
  ('20260605100000', 'add_park_content_columns', NULL),
  ('20260606110000', 'add_park_content_extended_columns', NULL),
  ('20260609000000', 'fix_itinerary_requests_rls', NULL),
  ('20260609100000', 'create_itinerary_builder_tables', NULL),
  -- 20260611000000 already recorded
  ('20260614000000', 'add_itinerary_friendly_slug', NULL),
  ('20260614000001', 'update_get_itinerary_by_token', NULL),
  ('20260614000002', 'create_knowledge_chunks', NULL),
  ('20260614000003', 'match_knowledge_chunks_park_filter', NULL),
  ('20260707000000', 'create_park_trails', NULL),
  ('20260707000001', 'setup_pg_cron_park_trails', NULL),
  ('20260708000000', 'create_park_trails_sync_state', NULL),
  ('20260713000000', 'knowledge_chunks_ingest_lock', NULL),
  ('20260719000000', 'add_newsletter_unsubscribed_at', NULL),
  ('20260719120000', 'add_park_live_data_weather_synced_at', NULL),
  -- 20260720050056 extend_client_itineraries_foundation already recorded
  ('20260720000000', 'add_destinations_season_short', NULL),
  ('20260720010000', 'rename_park_trails_to_park_things_to_do', NULL),
  ('20260726000000', 'add_rag_meta_to_ai_content_meta', NULL)
  -- Forward migrations 20260924180000 / 20260924180100: prefer apply_migration
  -- so statements are stored; if you pasted them in SQL Editor instead, also run:
  --   ('20260924180000', 'add_destinations_nps_description', NULL),
  --   ('20260924180100', 'security_hardening', NULL)
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- Smoke: SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;
