# Agent Queue — Phase 1 (AI funnel)

> **Fuente de verdad de la cola de cloud agents.** Un task = un branch = un Draft PR.
> Lee esto **antes** de tocar código (junto con `CLAUDE.md`). Reglas: `.cursor/rules/nomaderia.mdc` + ADR-024.
>
> Phase 2 (closure alerts, in-page assistant, WhatsApp buttons) **queda fuera** de esta cola.
>
> **Nota de setup (2026-09-25):** `docs/ai-roadmap.md` no existía en el repo al crear
> esta cola; Phase 1 se materializa aquí. Si Frank añade el roadmap, enlazarlo desde
> este archivo sin duplicar la cola.

## Cómo usar esta cola

1. Toma el primer task con status `TODO` cuyas dependencias estén `DONE` en `main`.
2. Audita schema + código existente antes de escribir.
3. Abre un Draft PR; en la rama marca este task `DONE`.
4. Lista ítems **FRANK:** en el cuerpo del PR y en `docs/pending-tasks.md`.
5. Frank mergea → `main` refleja `DONE`. Si algo solo Frank puede desbloquear, marca `BLOCKED` y detente.

Status válidos: `TODO` | `DONE` | `BLOCKED`.

---

## T01 — Privacy policy (US / California)

| | |
|---|---|
| **Status** | `TODO` |
| **Depends on** | — |
| **Scope** | `src/pages/PrivacyPolicy.tsx`: quitar legislación mexicana y LFPDPPP; alinear a EE. UU. + California, foro Condado de San Diego (mismo encuadre que `/terminos`). Marcar claims legales dudosos con `⚠️ VERIFICAR` para Frank. |
| **Done when** | Privacidad ya no cita LFPDPPP/México/ARCO; jurisdicción US+CA; claims marcados; `tsc` + `build` pasan. |
| **Audit** | Sigue citando LFPDPPP, México y derechos ARCO (§1, §7). Terms ya migró a US/CA (PR #178). |

---

## T02 — Events table + `logEvent`

| | |
|---|---|
| **Status** | `DONE` |
| **Depends on** | — |
| **Scope** | Migración aditiva `events(id, created_at, session_id, lead_id null, type, payload jsonb)`. RLS: `anon` INSERT; solo admins (`has_role`) SELECT. Añadir `src/lib/events.ts` con `logEvent(type, payload)` que nunca tire ni bloquee la UI. |
| **Done when** | SQL en `supabase/migrations/` (pegado en el PR); `logEvent` fire-and-forget; tipos/docs actualizados si aplica. |
| **Audit** | No existe tabla `events` ni `src/lib/events.ts`. Sí existe `admin_events` + `trackAdminEvent` (admin-only) — **no reusar**; es otro producto. |
| **FRANK** | Pegar SQL de `20260925000000_create_events.sql` en el SQL Editor; regenerar tipos (`npx supabase gen types …`). Hasta entonces `logEvent` usa cast ADR-009. |

---

## T03 — Ranking (`src/lib/ranking.ts`)

| | |
|---|---|
| **Status** | `TODO` |
| **Depends on** | — |
| **Scope** | Portar la fórmula de [Frankmo89/us-parks-recommender](https://github.com/Frankmo89/us-parks-recommender) a `src/lib/ranking.ts`: TypeScript puro, inputs tipados, top 3 parques con scores y reasons. Tests con Vitest (ya hay setup). |
| **Done when** | `ranking.ts` + tests verdes; top 3 con scores/reasons; sin I/O de red. |
| **Audit** | Repo público legible (`src/recommender.py`, `features.py`, pesos `W_CONTENT`/`W_DAYS`/…). El quiz actual tiene un scorer heurístico distinto en `use-quiz.ts` — **no lo reemplazar aquí**; solo añadir el lib. Vitest: `npm test` / `vitest.config.ts`. |

---

## T04 — Quiz v2

| | |
|---|---|
| **Status** | `TODO` |
| **Depends on** | T02 |
| **Scope** | Campos: ciudad de salida, fechas, grupo (niños, adultos mayores, familiares desde fuera de EE. UU.), fitness, lodging, presupuesto. Loguear cada respuesta con `logEvent`. Extender el quiz actual (`QuizSection` + `use-quiz`), no crear uno paralelo. |
| **Done when** | Campos nuevos + `logEvent` por respuesta; sin romper submit existente a `quiz_responses`. |
| **Audit** | Quiz vivo: fitness, interés, duración, barrera, presupuesto, temporada, residencia EE. UU. Faltan ciudad de salida, fechas concretas, composición de grupo y lodging. |

---

## T05 — Results, AI preview, lead capture

| | |
|---|---|
| **Status** | `TODO` |
| **Depends on** | T02, T03, T04 |
| **Scope** | Mostrar top 3 del ranking. Preview IA gratuita (día 1, costo de entrada, alertas live) vía Edge Function que reutilice provider/patrón de `concierge-agent` (OpenAI). Captura de email en tabla nueva `leads`; crear `lead_id` en el browser con `crypto.randomUUID()` (anon INSERT only, sin SELECT). Loguear elección de parque. |
| **Done when** | Top 3 + preview + insert lead + eventos; SQL aditivo en el PR; EF documentada para deploy. |
| **Audit** | Resultados del quiz + CTA WhatsApp existen; no hay preview IA ni tabla `leads` con UUID cliente. Tablas cercanas (`quiz_responses`, `sentinel_leads`, `itinerary_requests`) **no sustituyen** este contrato. |
| **FRANK** | Pegar SQL; confirmar `deploy-edge-functions.yml` (nueva EF); secretos ya usados por concierge (`OPENAI_API_KEY`) — no inventar nombres nuevos sin necesidad. |

---

## T06 — Stripe checkout + webhook

| | |
|---|---|
| **Status** | `TODO` |
| **Depends on** | T05 |
| **Scope** | Botón "Pagar $49" abre el Payment Link existente con `?client_reference_id=<lead_id>`. Nueva EF `stripe-webhook`: verificar firma; en `checkout.session.completed` crear fila `orders` (`lead_id`, status `paid`, `stripe_session_id`) y loguear purchase event. **No** cambiar price/product config de Stripe. |
| **Done when** | CTA con `client_reference_id`; EF + migración `orders`; SQL en el PR. |
| **Audit** | `STRIPE_LINK_ITINERARIO_49` sigue en placeholder `"REEMPLAZAR_CON_LINK_DE_49_USD"`. No hay `stripe-webhook` ni tabla `orders`. CTA actual es WhatsApp. |
| **FRANK** | Crear Payment Link $49 y pegarlo en `pricing.ts`; configurar webhook en Stripe; set `STRIPE_WEBHOOK_SECRET`; deploy EF. |

---

## T07 — Confirmation email (post-pago)

| | |
|---|---|
| **Status** | `TODO` |
| **Depends on** | T06 |
| **Scope** | Desde `stripe-webhook`, enviar con Resend: "Tu itinerario llega en menos de 48 horas". |
| **Done when** | Email disparado en `checkout.session.completed`; copy en español; sin secrets en código. |
| **Audit** | Resend ya usado (`send-quiz-email`, `send-welcome-email`, `send-drip-emails`). No hay confirmación de compra. |
| **FRANK** | Confirmar `RESEND_API_KEY` y dominio verificado. |

---

## T08 — Draft generator + verifier

| | |
|---|---|
| **Status** | `TODO` |
| **Depends on** | T06 |
| **Scope** | Tras orden pagada: draft día a día con plan B, hikes por nivel, permisos con fechas, costo total, gear con tag Amazon `nomaderia-20` + disclosure FTC junto a cada link, reglas de tarifas para visitantes de fuera de EE. UU. Usar datos NPS + RAG (`knowledge_chunks`). Verifier marca hechos sin fuente `⚠️ VERIFICAR`. Guardar en tabla `drafts` con flags. Si la re-ingesta RAG sigue pendiente de Frank, usar **solo NPS** y decirlo en el PR. |
| **Done when** | EF/job genera draft+flags; tabla `drafts`; SQL en el PR. |
| **Audit** | Builder manual (`itinerary_templates` / `client_itineraries`) existe; no hay auto-draft post-pago ni verifier. RAG: ~1758 chunks / 63 parques, pero cleanup + `knowledge_chunks_ingest_lock` siguen pendientes humanos — fallback NPS documentado. |
| **FRANK** | Pegar SQL; deploy EF; opcional completar ingest lock si se quiere RAG completo. |

---

## T09 — Review panel (admin)

| | |
|---|---|
| **Status** | `TODO` |
| **Depends on** | T08 |
| **Scope** | Página admin-only detrás del guard existente: listar drafts, ver flags, editar, tip personal de Frank, aprobar y enviar. Guardar edits (before/after) como events para training. Aprobar crea token aleatorio y marca itinerario entregado. |
| **Done when** | Ruta admin nueva (ADD only); approve → token + delivered; edits logueados. |
| **Audit** | `AdminClientItinerary*` cubre el builder manual (share/deliver). No hay panel de drafts con flags del verifier Phase 1. Reusar patrones de `docs/admin-patterns.md` + dark admin sidebar. |

---

## T10 — Itinerary page `/i/:token`

| | |
|---|---|
| **Status** | `TODO` |
| **Depends on** | T09 |
| **Scope** | Pública. Fetch vía EF o RPC security-definer por token; **sin** SELECT anon en la tabla. Plan día a día, "Revisado y aprobado por Frank Molina, agente certificado (TAP)" + tip, links Google Maps, emergency card (911 + rangers), estilos print-to-PDF. Offline solo si es simple; justificar cualquier service worker. |
| **Done when** | Página cumple copy/emergency/print; acceso solo por token RPC/EF. |
| **Audit** | Fundación ya existe: `ClientItineraryView`, `/i/:token/print`, RPC `get_itinerary_by_token`, mención TAP en layout. Falta emergency card (911/rangers) y cablear el flujo Phase 1 (drafts aprobados). Extender; no duplicar ruta. |

---

## T11 — Delivery + night-before emails

| | |
|---|---|
| **Status** | `TODO` |
| **Depends on** | T07, T10 |
| **Scope** | Email de entrega con link `/i/:token` al aprobar. Email "noche anterior" por cron protegido con `CRON_SECRET`. |
| **Done when** | Delivery on approve; cron night-before documentado; EF(s) en el PR. |
| **Audit** | Patrón `CRON_SECRET` / `x-cron-secret` ya en drip y syncs. No hay email de entrega al aprobar ni cron night-before. |
| **FRANK** | Deploy EFs; programar cron (pg_cron o externo) con headers gateway + `x-cron-secret`. |

---

## Dependency graph (Phase 1)

```
T01 ───────────────────────────────────────────── (parallel)
T02 ──┬── T04 ──┐
      │         ├── T05 ── T06 ──┬── T07 ──┐
T03 ──┘         │               │         ├── T11
                │               └── T08 ── T09 ── T10 ──┘
                └───────────────┘
```

Parallel-safe starters on greenfield: **T01**, **T02**, **T03**.
