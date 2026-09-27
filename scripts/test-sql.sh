#!/usr/bin/env bash
# Runs the SQL trigger tests against a THROWAWAY Postgres (never Supabase).
# Usage: DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres scripts/test-sql.sh
# The stub schema refuses to load into a database that looks like Supabase.
set -euo pipefail

: "${DATABASE_URL:?set DATABASE_URL to a throwaway Postgres}"
cd "$(dirname "$0")/.."

run() { psql "$DATABASE_URL" -X -q -o /dev/null -v ON_ERROR_STOP=1 -f "$1"; }

run supabase/tests/sql/_stub_schema.sql
run supabase/migrations/20260926120000_knowledge_ingest_content_triggers.sql
# Apply twice: the migration must stay safe to paste more than once.
run supabase/migrations/20260926120000_knowledge_ingest_content_triggers.sql
run supabase/tests/sql/knowledge_ingest_triggers.test.sql
