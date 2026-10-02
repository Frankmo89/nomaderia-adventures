# Stripe Payment Link — Phase 1 (frontend)

> Fuente operativa corta. Decisiones: ADR-032. Cola: T06 en `agent-queue.md`.

## Link en código

- Constante: `STRIPE_LINK_ITINERARIO_49` en `src/config/pricing.ts`
- URL: `https://buy.stripe.com/00w9AT9bA2fR8I4bayaAw00`
- Helper: `buildStripePaymentLink({ clientReferenceId?, prefilledEmail? })`
  - Si el visitante terminó el quiz (lead persistido), añade `client_reference_id` y `prefilled_email`.

## FRANK — Success URL (Dashboard)

En Stripe Dashboard → Payment Links → el link de $49:

1. **After payment → Success URL** = `https://nomaderia.com/gracias`
2. Opcional: incluir `{CHECKOUT_SESSION_ID}` si Stripe lo ofrece en la plantilla.
3. **No** cambiar precio ni producto desde agentes.

Sin Success URL, el comprador no ve la página de gracias ni el Pixel Purchase del frontend.

## Fuera de este paso

- Webhook `checkout.session.completed`, tabla `orders`, `STRIPE_WEBHOOK_SECRET` → resto de T06.
