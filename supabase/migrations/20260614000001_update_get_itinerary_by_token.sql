-- Update get_itinerary_by_token to resolve by either share_token OR
-- friendly_slug using the same p_token parameter.
-- Existing token URLs continue to work unchanged.

CREATE OR REPLACE FUNCTION public.get_itinerary_by_token(p_token text)
RETURNS TABLE (
  client_name  text,
  trip_start   date,
  trip_end     date,
  content      jsonb,
  status       text,
  updated_at   timestamptz
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
    ci.content,
    ci.status,
    ci.updated_at
  FROM public.client_itineraries ci
  WHERE (ci.share_token = p_token OR ci.friendly_slug = p_token)
    AND ci.status IN ('entregado', 'viaje_activo', 'completado');
$$;

GRANT EXECUTE ON FUNCTION public.get_itinerary_by_token(text) TO anon, authenticated;
