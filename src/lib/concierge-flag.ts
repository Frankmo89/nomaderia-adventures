/**
 * Pre-purchase concierge is off unless the build sets VITE_CONCIERGE_ENABLED=true.
 * While off, public doubt CTAs stay «¿Dudas? Escríbenos» (WhatsApp). Frank turns
 * the flag on only after he accepts eval/report.md (ADR-035).
 */
export function isConciergeEnabled(
  raw: string | boolean | undefined = import.meta.env.VITE_CONCIERGE_ENABLED,
): boolean {
  return raw === true || raw === "true";
}

export const PRE_PURCHASE_DOUBT_COPY = isConciergeEnabled()
  ? "Antes de comprar, el concierge responde tus dudas."
  : "WhatsApp antes de comprar es solo para dudas.";

export const STRIPE_THEN_DELIVERY_COPY =
  "Pagas $49 con tarjeta en nomaderia.com (Stripe). Después de pagar, recibes nuestro WhatsApp y el itinerario en 24 a 48 horas.";

export const STRIPE_AND_DOUBT_COPY = `${STRIPE_THEN_DELIVERY_COPY} ${PRE_PURCHASE_DOUBT_COPY}`;
