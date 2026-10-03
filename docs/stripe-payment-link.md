# Stripe Payment Link — Phase 1 (frontend)

> Fuente operativa corta. Decisiones: ADR-032. Cola: T06 en `agent-queue.md`.

## Link en código

- Constante única: `STRIPE_LINK_ITINERARIO_49` en `supabase/functions/_shared/stripe-link.ts` (re-export desde `src/config/pricing.ts`; emails en Edge Functions importan el mismo archivo).
- URL viva (único producto): `https://buy.stripe.com/28EaEX2Nc4nZ5vS3I6aAw01` — Itinerario Completo, **$49 USD**.
- El Payment Link de **$29** ("Acceso de Fundador", alerta Yosemite) está **retirado**. No es el link de $49 y no debe usarse en código.
- Helper: `buildStripePaymentLink({ clientReferenceId?, prefilledEmail? })`
  - Si el visitante terminó el quiz (lead persistido), añade `client_reference_id` y `prefilled_email`.

## FRANK — Success URL (Dashboard)

En Stripe Dashboard → Payment Links → el link vivo de $49 (`28EaEX2Nc4nZ5vS3I6aAw01`), no el link retirado de $29:

1. **After payment → Success URL** = `https://nomaderia.com/gracias`
2. Opcional: incluir `{CHECKOUT_SESSION_ID}` si Stripe lo ofrece en la plantilla.
3. **No** cambiar precio ni producto desde agentes.

Sin Success URL, el comprador no ve la página de gracias ni el Pixel Purchase del frontend.

## Fuera de este paso

- Webhook `checkout.session.completed`, tabla `orders`, `STRIPE_WEBHOOK_SECRET` → resto de T06.
