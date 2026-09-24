# Nomaderia Adventures — Contexto para Agentes AI

> **Entrypoint.** Léelo completo antes de tocar nada. Detalle: `docs/`.
> Estado actual = este archivo + `docs/claude-context.md`. Histórico = `docs/pending-tasks.md`.
> Decisiones duras = `docs/decisions.md`. Dirección AI (planned) = `docs/ai-roadmap.md`.

---

## Qué es

Plataforma web en español para **adultos hispanos en Southern California (25–45)**,
primeros pasos en hiking. Un producto: **Itinerario Completo Nomaderia — $49 USD**.
Sitio: https://nomaderia.com · Hosting: Cloudflare Pages · Moneda: **USD only**.

Canal de cierre **hoy**: WhatsApp (`Diseña mi aventura por WhatsApp`). Stripe Payment
Link pendiente de configurar (`STRIPE_LINK_ITINERARIO_49` placeholder).

## Estado actual (código)

- Catálogo cerrado de parques nacionales US; quiz, blog, gear, calculadora, concierge IA (RAG).
- Itinerary builder en producción: admin edita → entrega `/i/:token`.
- Tema **light** editorial (Trail Green `#1F6F43`). Sin dark-mode toggle público.
- Stack congelado (ADR-001): React 18 · TypeScript · Vite · Tailwind · Shadcn/UI ·
  Framer Motion · Supabase (Postgres, Edge Functions, RLS, pgvector) · Resend · Stripe.

## Nueva dirección — sistema de agentes AI (**planned**, ADR-024)

1. Funnel: quiz → ranking de parques → preview IA gratis → pago Stripe $49 → draft en builder → Frank aprueba → `/i/:token`.
2. Entregable $49: mapa, permisos, hikes, gear afiliado, alertas vivas; email primero.
3. Content engine: reports en Drive → RAG → posts/reels → aprobación Frank → métricas.
4. ML: ranking rules + `us-parks-recommender`; loguear eventos desde día 1; ranker con datos.
5. Verifier: cada itinerario/post vs `park_live_data` + fuentes citadas antes de ship.

Detalle y fases: `docs/ai-roadmap.md`. Research desk: `docs/research-desk.md`.

## Reglas duras

1. Leer `CLAUDE.md` → `docs/claude-context.md` → `docs/decisions.md` → `docs/pending-tasks.md` antes de proponer.
2. Un cambio lógico = un commit/PR. Actualizar `pending-tasks.md` al terminar.
3. Nunca tocar `.env` ni hardcodear secretos. No editar `src/components/ui/` ni `types.ts` a mano.
4. No cambiar auth / RLS / queries Supabase sin instrucción explícita.
5. No reintroducir MXN, tiers legacy, mercado CDMX/TJ cross-border, ni orange como primario (ADR-002/012/006).
6. Antes de PR: `npx tsc --noEmit` y `npm run build` deben pasar.
7. Documentar solo lo que existe en código. Lo planned va marcado **planned**.

## Mapa de docs

| Archivo | Contenido |
|---------|-----------|
| `docs/claude-context.md` | Arquitectura **como está el código hoy** |
| `docs/decisions.md` | ADRs |
| `docs/ai-roadmap.md` | Dirección AI + fases (**planned**) |
| `docs/research-desk.md` | Bot de research en Drive (**planned**) |
| `docs/design-system.md` | Tokens visuales (fuente de verdad UI) |
| `docs/pending-tasks.md` | Humanos / Phase 1 / conflictos + changelog |
| `docs/supabase-schema.md` | Tablas, RLS, auth |
| `docs/content-strategy.md` | Monetización, SEO, quiz |
| `docs/seccion-9-concierge-ia.md` | Concierge RAG en producción |
| `docs/admin-patterns.md` | Convenciones del panel admin |

## Comandos

```sh
npm run dev
npm run build
npx tsc --noEmit
npm run test
```

Env (nombres): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SITE_URL`,
`VITE_GA_MEASUREMENT_ID`, `VITE_SENTRY_DSN`. WhatsApp `18588996802` está en `src/lib/whatsapp.ts` (no env).
