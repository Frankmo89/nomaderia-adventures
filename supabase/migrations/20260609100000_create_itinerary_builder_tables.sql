-- =============================================================================
-- Itinerary Builder — Phase 1 (Fase 1)
-- Creates two new tables:
--   • public.itinerary_templates  — per-park drafts (admin-only)
--   • public.client_itineraries   — per-client instances (admin + token RPC)
-- Reuses existing public.update_updated_at_column() trigger function.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. itinerary_templates
--    Admin-authored base itinerary for a destination.
--    Not published directly to clients; cloned into client_itineraries.
-- ---------------------------------------------------------------------------
CREATE TABLE public.itinerary_templates (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id  uuid        NOT NULL REFERENCES public.destinations(id),
  title           text        NOT NULL,  -- e.g. "Joshua Tree — 2 días esencial"
  summary         text,                  -- short admin-facing description
  suggested_days  int         NOT NULL DEFAULT 2,
  -- content JSONB shape (v1):
  -- { "version": 1, "dias": [ { "dia": 1, "titulo": "...", "bloques": [ {
  --   "id": "<uuid>", "tipo": "ruta|comida|alojamiento|traslado|tip_seguridad|permiso|costo|nota",
  --   "titulo": "...", "contenido_md": "...", "horario": "HH:MM–HH:MM",
  --   "precio_usd": null, "precio_nota": null, "fuente_url": "...", "afiliado_url": null,
  --   "verify_flag": null  -- or "⚠️ VERIFICAR (IA) [YYYY-MM-DD]" for volatile data
  -- } ] } ] }
  content         jsonb       NOT NULL DEFAULT '{"version":1,"dias":[]}'::jsonb,
  research_status text        NOT NULL DEFAULT 'ai_draft',  -- ai_draft | revisado | publicado
  is_published    boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.itinerary_templates ENABLE ROW LEVEL SECURITY;

CREATE INDEX itinerary_templates_destination_id_idx
  ON public.itinerary_templates (destination_id);

-- Trigger: keep updated_at current (reuses existing function)
CREATE TRIGGER update_itinerary_templates_updated_at
  BEFORE UPDATE ON public.itinerary_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: admin-only, no public access
CREATE POLICY "Admins can manage itinerary templates"
  ON public.itinerary_templates
  FOR ALL TO authenticated
  USING  (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- 2. client_itineraries
--    One-per-client itinerary delivered after purchase.
--    Optionally cloned from a template; always linked to an intake request.
-- ---------------------------------------------------------------------------
CREATE TABLE public.client_itineraries (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id      uuid        REFERENCES public.itinerary_templates(id),  -- nullable: cloned-from
  request_id       uuid        REFERENCES public.itinerary_requests(id),   -- nullable: links intake
  client_name      text        NOT NULL,
  client_email     text,
  client_whatsapp  text,       -- digits only, e.g. 16195551234
  trip_start       date,
  trip_end         date,
  -- party JSONB shape:
  -- { "adultos": 2, "ninos": 1, "nivel": "principiante",
  --   "miedos": ["osos","perderse"], "presupuesto_usd": 800, "notas": "" }
  party            jsonb       NOT NULL DEFAULT '{}'::jsonb,
  -- content JSONB shape (v1) — same schema as itinerary_templates.content:
  -- { "version": 1, "dias": [ { "dia": 1, "titulo": "...", "bloques": [ {
  --   "id": "<uuid>", "tipo": "ruta|comida|alojamiento|traslado|tip_seguridad|permiso|costo|nota",
  --   "titulo": "...", "contenido_md": "...", "horario": "HH:MM–HH:MM",
  --   "precio_usd": null, "precio_nota": null, "fuente_url": "...", "afiliado_url": null,
  --   "verify_flag": null  -- or "⚠️ VERIFICAR (IA) [YYYY-MM-DD]" for volatile data
  -- } ] } ] }
  content          jsonb       NOT NULL DEFAULT '{"version":1,"dias":[]}'::jsonb,
  share_token      text        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
  status           text        NOT NULL DEFAULT 'borrador'
    CONSTRAINT client_itineraries_status_check
      CHECK (status IN ('borrador','entregado','viaje_activo','completado','archivado')),
  delivered_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_itineraries ENABLE ROW LEVEL SECURITY;

CREATE INDEX client_itineraries_share_token_idx
  ON public.client_itineraries (share_token);

CREATE INDEX client_itineraries_status_idx
  ON public.client_itineraries (status);

-- Trigger: keep updated_at current (reuses existing function)
CREATE TRIGGER update_client_itineraries_updated_at
  BEFORE UPDATE ON public.client_itineraries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: admin-only for all DML; public access only through the RPC below
CREATE POLICY "Admins can manage client itineraries"
  ON public.client_itineraries
  FOR ALL TO authenticated
  USING  (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- 3. RPC: get_itinerary_by_token
--    Public (anon) entry point for the client-facing itinerary page.
--    Returns a single safe row by share_token only when status is viewable.
--    Does NOT expose: client_email, client_whatsapp, party, template_id,
--    request_id, or any internal/admin fields.
-- ---------------------------------------------------------------------------
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
  WHERE ci.share_token = p_token
    AND ci.status IN ('entregado', 'viaje_activo', 'completado');
$$;

GRANT EXECUTE ON FUNCTION public.get_itinerary_by_token(text) TO anon, authenticated;
