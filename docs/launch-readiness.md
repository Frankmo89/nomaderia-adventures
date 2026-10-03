# Launch readiness — primera venta de $49

> Snapshot de código: `origin/main` @ `5f1dd2e` (2026-10-03 PT).
> Solo evidencia del repo. No se verificó el deploy de Cloudflare ni el Dashboard de Supabase/Stripe/Instagram.
> Producto locked: **Itinerario Completo $49 USD** · link vivo `https://buy.stripe.com/28EaEX2Nc4nZ5vS3I6aAw01` · el link de $29 está retirado · Frank revisa cada itinerario · audiencia SoCal hispana, primer hike, parques de EE. UU.

“Bloquea la primera venta” = ¿sin esto alguien no puede pagar $49 en el sitio y Frank no puede entregar a mano?

---

## 1. Meta Pixel ID

- **Status:** not built
- **Evidence:** `index.html` sigue con el placeholder `fbq('init', 'TU_PIXEL_ID_AQUI')` y el `<img>` noscript con el mismo id. `src/lib/analytics.ts` reenvía a `fbq` solo si existe. `/gracias` dispara `Purchase` ($49 USD) solo si `window.fbq` es función (`src/pages/Gracias.tsx`). Pendiente humano abierto en `docs/pending-tasks.md` (“Facebook Pixel”). `docs/claude-context.md` §9.2 lo marca igual.
- **Blocks first paid sale:** no — el Payment Link cobra sin Pixel. Solo se pierde atribución de ads.

## 2. UTM capture into events

- **Status:** not built
- **Evidence:** `public.events` (`supabase/migrations/20260925000000_create_events.sql`) guarda `session_id`, `lead_id`, `type`, `payload`. `src/lib/events.ts` no lee la query string. No hay `utm_source` / `utm_medium` / `utm_campaign` en `src/` salvo un link *saliente* de Instagram en `src/components/landing/Footer.tsx` (`utm_source=qr` hacia instagram.com, no captura de entrada).
- **Blocks first paid sale:** no — es atribución, no el checkout.

## 3. Quiz email capture

- **Status:** partial
- **Evidence:** UI y submit en `src/hooks/use-quiz.ts` `handleEmailSubmit` + `src/components/landing/QuizSection.tsx`: insert anónimo en `leads` (id del cliente), `newsletter_subscribers` (`source: "quiz"`), `quiz_responses`, `logEvent("lead_created"|"quiz_completed")`, e invoke de `send-quiz-email`. Tabla: `supabase/migrations/20260925120000_create_leads.sql` (PR #184). Si el insert de `leads` falla, igual persiste el email en `localStorage` (`src/lib/quiz-lead.ts`). **No confirmado en este repo** que Frank haya pegado ese SQL en producción (`docs/pending-tasks.md`, T05, sigue abierto).
- **Blocks first paid sale:** no — se puede pagar el link de $49 sin terminar el quiz. Sin la migración, el lead del quiz no queda en `leads`.

## 4. Free AI preview

- **Status:** partial
- **Evidence:** Edge Function `supabase/functions/quiz-preview/index.ts` y `loadPreview` en `use-quiz.ts` (sigue llamándose al rankear y al elegir parque). El panel **no se renderiza**: comentario en `QuizSection.tsx` (“Preview IA (PreviewPanel) oculto…”) y changelog del copy audit (PR #195) en `docs/pending-tasks.md`. `PreviewPanel` existe en el mismo archivo pero no está en el JSX de resultados.
- **Blocks first paid sale:** no — el ranking y el CTA de $49 no dependen del preview. Oculto a propósito hasta el flujo E2E.

## 5. Resend emails (confirmation, delivery, drip)

- **Status:** partial
- **Evidence:**
  - **Quiz results:** `supabase/functions/send-quiz-email/index.ts` (asunto “Tu destino ideal: …”). No es confirmación de pago.
  - **Welcome:** `supabase/functions/send-welcome-email/index.ts` desde `NewsletterSignup`.
  - **Drip:** `supabase/functions/send-drip-emails/index.ts` (`gear_guide` ~3 días, `itinerary_cta` ~7 días) + migración `20260228000000_create_email_drip_log.sql`. El changelog 2026-07-19 dice que el cron falló siempre y que `email_drip_log` no se había aplicado; el re-enable sigue en Pendientes Humanos (5 pasos). El CTA de compra del drip ya usa el link de $49 (`_shared/stripe-link.ts`, PR #200).
  - **Confirmación post-pago:** no existe. T07 en `docs/agent-queue.md` (`TODO`). No hay función que mande “tu itinerario llega en menos de 48 horas” al cobrar.
  - **Entrega:** no existe email con `/i/:token` al aprobar. T11 `TODO`. La página `/i/:token` del builder manual sí existe.
  - `RESEND_API_KEY` no está en el repo (correcto). Que el dominio y la key estén vivos en Supabase no se puede ver desde aquí.
- **Blocks first paid sale:** no — Stripe cobra igual. Frank puede avisar y entregar por WhatsApp. No hay correo automático de “pagaste” ni de entrega.

## 6. AI concierge

- **Status:** partial
- **Evidence:** `supabase/functions/concierge-agent/index.ts`, `src/components/ConciergeChat.tsx`, `src/components/ConciergeLauncher.tsx`. El launcher **no está montado**: `src/App.tsx` no lo importa (copy audit, PR #195; checkbox marcado en `docs/pending-tasks.md`). `DestinationDetail.tsx` ya no tiene la barra embebida. ADR-030 en `docs/decisions.md`.
- **Blocks first paid sale:** no — no está en el camino de pago. El CTA de compra es el Payment Link.

## 7. Stripe payment alert

- **Status:** not built
- **Evidence:** no hay `supabase/functions/stripe-webhook`, ni tabla `orders`, ni `STRIPE_WEBHOOK_SECRET` en código. T06 en `docs/agent-queue.md`: frontend del Payment Link **done**; webhook/`orders` **no**. `docs/stripe-payment-link.md` lo deja fuera de este paso. `/gracias` solo pinta gracias y, si hay Pixel real, `Purchase`. No hay email, Slack ni fila admin cuando entra un pago. No confundir con el producto retirado de $29 (“alerta Yosemite”, `buy.stripe.com/00w9AT9bA2fR8I4bayaAw00`). Si Stripe Dashboard manda el mail de “payment received” al dueño de la cuenta, eso no está en el repo.
- **Blocks first paid sale:** no — el link de $49 cobra sin webhook. Frank tiene que mirar Stripe (o el mail de Stripe, no verificado aquí) para enterarse. Success URL → `https://nomaderia.com/gracias` sigue pendiente en el Dashboard (`docs/stripe-payment-link.md`).

## 8. Public signup disabled in Supabase Auth

- **Status:** blocked
- **Evidence:** no hay flag en `supabase/config.toml` ni en migraciones. El único registro es el pendiente humano, sin marcar, en `docs/pending-tasks.md`: Authentication → Settings → desactivar “Enable email signups”. **No se puede verificar el Dashboard desde el código.**
- **Blocks first paid sale:** no — es higiene de Auth, no el checkout. Hay que confirmarlo en el Dashboard.

## 9. IG bio link

- **Status:** partial
- **Evidence:** el perfil sí está en código: `Footer.tsx` → `https://www.instagram.com/nomaderia.mx?...`. El **link del bio** no vive en el repo. Pendiente humano sin marcar: debe ir a `https://nomaderia.com`, no a TikTok (`docs/pending-tasks.md`, auditoría 2026-09-25). Tarea manual de Frank en la app de Instagram.
- **Blocks first paid sale:** no para quien ya llega a nomaderia.com. **Sí para tráfico de Instagram** si el bio sigue en TikTok — eso no se puede ver desde aquí.

## 10. PWA icons

- **Status:** done
- **Evidence:** PR #199 merged (`4da5c10`). En `main`: `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `public/manifest.webmanifest` (`#1F6F43` / `#FBFAF7`), `index.html` enlaza `rel="manifest"` y `apple-touch-icon`. Checkbox marcado en `docs/pending-tasks.md`. ADR-033.
- **Blocks first paid sale:** no — marca, no checkout. Falta el scrape manual del Facebook Sharing Debugger (pendiente humano, post-deploy).

## 11. diploma.jpg

- **Status:** not built
- **Evidence:** no hay `public/diploma.jpg`. `src/pages/SobreNosotros.tsx` muestra un bloque placeholder (“Agente de Viajes Certificado TAP”) con TODO de reemplazar por imagen; ya no usa `src="/diploma.jpg"`. Pendiente humano abierto. `docs/claude-context.md` §9.1 está viejo: todavía dice que la página usa `/diploma.jpg`.
- **Blocks first paid sale:** no — la credencial se afirma en texto; la foto no está en el flujo de pago.

## 12. Open PRs

- **Status:** partial (tres abiertos; ninguno es el cobro de $49)
- **Evidence:** `gh pr list --state open` el 2026-10-03 PT:
  - **#196** — fix(seo): per-URL OG tags via Cloudflare Pages Function — https://github.com/Frankmo89/nomaderia-adventures/pull/196 — open, no draft
  - **#192** — feat(video): Remotion vertical reel renderer + live-features docs — https://github.com/Frankmo89/nomaderia-adventures/pull/192 — open, no draft (`docs/live-features.md` está en este PR, no en `main`)
  - **#177** — docs: align context with AI agent direction — https://github.com/Frankmo89/nomaderia-adventures/pull/177 — open, no draft
- **#199** (El Pin) y **#200** (botones al link de $49) están **merged**.
- **Blocks first paid sale:** no — ninguno de los tres abiertos cambia el Payment Link ni Auth.

---

## Qué sí falta para operar la primera venta (no son blockers de código del cobro)

1. Stripe Dashboard: Success URL del link $49 → `https://nomaderia.com/gracias`. Desactivar el link de $29. (Pendientes humanos.)
2. Mirar Stripe al cobrar: no hay alerta en la app (ítem 7).
3. Entrega: sigue manual (Frank revisa; WhatsApp / `/i/:token`). No hay email de confirmación ni de entrega.
