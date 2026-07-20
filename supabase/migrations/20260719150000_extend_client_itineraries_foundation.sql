-- =============================================================================
-- Itinerary Builder — Foundation extensions (additive only, ADR-018)
-- The v1 Spanish JSONB contract stays canonical; this migration only ADDS:
--   • client_itineraries.title            — admin-facing trip title
--   • client_itineraries.destination_id   — direct FK to destinations (park)
--   • client_itineraries.show_costs       — server-enforced cost visibility
--   • client_itineraries.internal_notes   — admin-only notes (never public)
--   • get_itinerary_by_token v3           — same fields + `title` appended;
--     strips precio_usd/precio_nota from every block when show_costs = false
-- No renames, no type changes, no drops. itinerary_templates untouched.
-- Idempotent: safe to re-run in the Supabase SQL Editor.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. show_costs — default false for NEW rows, but backfill true for rows that
--    existed before this migration: live /i/:token links currently render
--    costs and must keep doing so unchanged (condition of the extension PR).
--    Wrapped in a DO block so a re-run never re-backfills newer rows.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'client_itineraries'
      AND column_name  = 'show_costs'
  ) THEN
    ALTER TABLE public.client_itineraries
      ADD COLUMN show_costs boolean NOT NULL DEFAULT false;
    -- Preserve current behavior for pre-existing itineraries
    UPDATE public.client_itineraries SET show_costs = true;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Plain additive columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.client_itineraries
  ADD COLUMN IF NOT EXISTS title text;

ALTER TABLE public.client_itineraries
  ADD COLUMN IF NOT EXISTS destination_id uuid REFERENCES public.destinations(id);

ALTER TABLE public.client_itineraries
  ADD COLUMN IF NOT EXISTS internal_notes text;

CREATE INDEX IF NOT EXISTS client_itineraries_destination_id_idx
  ON public.client_itineraries (destination_id);

-- ---------------------------------------------------------------------------
-- 3. RPC get_itinerary_by_token — v3
--    Backward-compatible: existing return columns unchanged (same names,
--    same types, same order); `title` is APPENDED at the end.
--    New behavior: when show_costs = false, precio_usd and precio_nota are
--    removed from every block server-side. internal_notes is never returned
--    (it is not part of the return set), same as client_email/party/etc.
--    DROP + CREATE because the return type changes (OR REPLACE can't).
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_itinerary_by_token(text);

CREATE FUNCTION public.get_itinerary_by_token(p_token text)
RETURNS TABLE (
  client_name  text,
  trip_start   date,
  trip_end     date,
  content      jsonb,
  status       text,
  updated_at   timestamptz,
  title        text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ci.client_name,
    ci.trip_start,
    ci.trip_end,
    CASE
      WHEN ci.show_costs THEN ci.content
      -- Malformed/legacy content without a dias array: return as-is
      WHEN jsonb_typeof(ci.content->'dias') <> 'array' THEN ci.content
      ELSE jsonb_set(
        ci.content,
        '{dias}',
        (
          SELECT COALESCE(
            jsonb_agg(
              CASE
                WHEN jsonb_typeof(dia.value->'bloques') = 'array' THEN jsonb_set(
                  dia.value,
                  '{bloques}',
                  (
                    SELECT COALESCE(
                      jsonb_agg(
                        CASE
                          WHEN jsonb_typeof(blq.value) = 'object'
                            THEN (blq.value - 'precio_usd') - 'precio_nota'
                          ELSE blq.value
                        END
                        ORDER BY blq.ordinality
                      ),
                      '[]'::jsonb
                    )
                    FROM jsonb_array_elements(dia.value->'bloques')
                      WITH ORDINALITY AS blq(value, ordinality)
                  )
                )
                ELSE dia.value
              END
              ORDER BY dia.ordinality
            ),
            '[]'::jsonb
          )
          FROM jsonb_array_elements(ci.content->'dias')
            WITH ORDINALITY AS dia(value, ordinality)
        )
      )
    END AS content,
    ci.status,
    ci.updated_at,
    ci.title
  FROM public.client_itineraries ci
  WHERE (ci.share_token = p_token OR ci.friendly_slug = p_token)
    AND ci.status IN ('entregado', 'viaje_activo', 'completado');
$$;

GRANT EXECUTE ON FUNCTION public.get_itinerary_by_token(text) TO anon, authenticated;
