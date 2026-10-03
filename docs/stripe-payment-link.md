# Stripe Payment Link — Phase 1 (frontend)

> Fuente operativa corta. Decisiones: ADR-032. Cola: T06 en `agent-queue.md`.

## Link en código

- Único literal: `STRIPE_LINK_ITINERARIO_49` en `src/config/stripe-link.ts` (reexportado desde `src/config/pricing.ts`).
- URL: `https://buy.stripe.com/28EaEX2Nc4nZ5vS3I6aAw01` ($49; el link $29 anterior está retirado).
- Helper frontend: `buildStripePaymentLink({ clientReferenceId?, prefilledEmail? })`
  - Si el visitante terminó el quiz (lead persistido en `localStorage`, o opts), añade `client_reference_id` y `prefilled_email`.
- Email del quiz: `send-quiz-email` importa el mismo literal y añade los mismos params cuando hay email / `lead_id`.
- No va en `.env` / `.env.example`.

## FRANK — Success URL (Dashboard)

En Stripe Dashboard → Payment Links → el link de $49:

1. **After payment → Success URL** = `https://nomaderia.com/gracias`
2. Opcional: incluir `{CHECKOUT_SESSION_ID}` si Stripe lo ofrece en la plantilla.
3. **No** cambiar precio ni producto desde agentes.

Sin Success URL, el comprador no ve la página de gracias ni el Pixel Purchase del frontend.

## Fuera de este paso

- Webhook `checkout.session.completed`, tabla `orders`, `STRIPE_WEBHOOK_SECRET` → resto de T06.
