# AI Agent Roadmap — Nomaderia

> **Estado:** dirección **planned** (ADR-024). Nada de este documento está
> implementado salvo lo que ya existe en código (quiz, ranking rules en
> `use-quiz.ts`, itinerary builder, `park_live_data`, concierge RAG, Stripe
> placeholder). No inventar tablas, rutas ni columnas; marcar todo lo nuevo como
> planned hasta que exista migración/código.

---

## 1. Visión

Nomaderia pasa de “sitio + WhatsApp manual” a un **sistema de agentes AI** con
**Frank (agente de viajes certificado TAP)** como revisor y aprobador humano.

Audiencia: adultos hispanos en Southern California, 25–45, first-time hikers.
Producto único: **Itinerario Completo Nomaderia — $49 USD**.

## 2. Flujo de ventas (**planned**)

```
Quiz → ranked parks → free AI preview (top 3, day 1, map)
  → Stripe $49 → auto draft en itinerary builder
  → Frank edita y aprueba → entrega /i/:token (+ email primero)
```

### Hoy (código)

| Paso | Qué hay |
|------|---------|
| Quiz | `QuizSection` + `use-quiz.ts` → `quiz_responses` + email Resend |
| Ranking | Reglas en `SCORING_RULES` (`use-quiz.ts`). Repo hermano `us-parks-recommender` (cosine + closeness) — **no integrado** al sitio |
| Preview IA gratis | **No existe** |
| Pago | CTA WhatsApp. `STRIPE_LINK_ITINERARIO_49` = placeholder en `src/config/pricing.ts` |
| Draft builder | Admin crea/edita `client_itineraries` a mano |
| Entrega | `/i/:token` vía RPC `get_itinerary_by_token` |

## 3. Entregable $49 (**planned** vs hoy)

| Pieza | Hoy | Planned |
|-------|-----|---------|
| Mapa | Bloques en builder / vista cliente | Incluido + día 1 en preview gratis |
| Permisos y reservas | Contenido editorial + `permit_*` / admin | Checklist resuelta en el draft |
| Hikes por nivel | Trails / things-to-do + contenido destino | Curado en el itinerario |
| Gear + affiliate | `gear_list` + Amazon tag `nomaderia-20` | Lista en el PDF/email |
| Live alerts | `park_live_data` + `ParkAlertsBanner` / weather | Empaquetadas en la entrega |
| Canal | WhatsApp manual | Email primero, luego `/i/:token` |

## 4. Content engine (**planned**)

```
Research reports (Google Drive) → RAG → articles / posts / reels
  → cola de aprobación de Frank → publish → métricas → feedback
```

Formato de reports y carpetas: `docs/research-desk.md`.
Hoy ya existen `generate-blog-draft`, `generate-gear-draft`, `ingest-knowledge`,
`knowledge_chunks` (pgvector) y `ai_content_meta` — piezas reutilizables, no el
pipeline Drive→publish completo.

## 5. Tabla de eventos (**proposal only — NO migration**)

> **No confundir** con `admin_events` (ya existe: clicks WhatsApp del admin vía
> `src/lib/admin-tracking.ts`). La tabla de aprendizaje del funnel es **nueva**
> y provisionalmente se llama `funnel_events`.

Propuesta (planned):

```sql
-- PROPUESTA — no aplicar. Solo documentación.
-- public.funnel_events (
--   id uuid PK default gen_random_uuid(),
--   created_at timestamptz not null default now(),
--   session_id text null,          -- anon / cookie
--   user_email text null,
--   event_type text not null,      -- ver enum abajo
--   quiz_response_id uuid null,    -- FK opcional → quiz_responses
--   park_codes text[] null,        -- parks shown / chosen
--   client_itinerary_id uuid null, -- draft afectado
--   payload jsonb not null default '{}'::jsonb
-- )
```

`event_type` mínimo (planned):

| event_type | Cuándo |
|------------|--------|
| `quiz_answered` | Cada paso o submit del quiz |
| `parks_shown` | Ranking / preview muestra N parques |
| `park_chosen` | Usuario elige un parque |
| `purchase` | Stripe $49 confirmado |
| `frank_edit` | Diff de edición de Frank sobre un draft (labeled data) |

## 6. Plan ML (**planned**)

1. **Ahora:** ranking = reglas (`use-quiz.ts`) + evaluar integración de
   `us-parks-recommender` (content-based, 63 parques).
2. **Día 1 del funnel nuevo:** loguear los eventos de la tabla de arriba.
3. **Cuando haya volumen:** entrenar un ranker; las ediciones de Frank
   (`frank_edit`) son etiquetas (lo que el humano corrigió vs. el draft IA).
4. No entrenar ni inventar features sin datos reales.

## 7. Verifier (**planned**)

Antes de publicar un itinerario o un post:

1. Contrastar afirmaciones volátiles contra `park_live_data` (alerts, fees,
   hours, weather cuando existan).
2. Exigir fuentes citadas (mismo espíritu que reports en Drive + RAG).
3. Bloquear ship si falla el check; Frank puede override explícito (auditable).

Hoy no hay un verifier automático. `ai_content_meta.verify_flags` existe en
tipos — reutilizar si encaja; no asumir comportamiento no leído en código.

## 8. Orden de construcción

| Fase | Alcance | Dependencias |
|------|---------|--------------|
| **1** | Sales flow + `funnel_events` + preview IA + Stripe real | Payment Link; no romper WhatsApp hasta cutover |
| **2** | Live deliverable (alerts, permisos, email-first) | Fase 1 + sync `park_live_data` estable |
| **3** | Content engine (Drive → RAG → approve → publish) | Research desk + parser tolerante |
| **4** | Learning loop (ranker entrenado con eventos + edits) | Volumen de `funnel_events` |

## 9. Fuentes de verdad

- Producto/precio: `src/config/pricing.ts` + ADR-012
- Arquitectura hoy: `docs/claude-context.md`
- Esta dirección: ADR-024 en `docs/decisions.md`
- Research: `docs/research-desk.md`
