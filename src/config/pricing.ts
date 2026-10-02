export { WHATSAPP_NUMBER } from "@/lib/whatsapp";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { getStoredQuizEmail, getStoredQuizLeadId } from "@/lib/quiz-lead";

export interface Product {
  id: string;
  name: string;
  priceUSD: number;
  currency: "USD";
  ctaType: "whatsapp" | "stripe";
  features: string[];
  /** Base buy URL (Stripe Payment Link). Prefer buildStripePaymentLink() at click time. */
  ctaUrl: string;
}

export const PRICING = {
  itinerarioCompleto: 49,
} as const;

/** Live Stripe Payment Link for Itinerario Completo ($49 USD). Do not change price/product in Stripe Dashboard from agents. */
export const STRIPE_LINK_ITINERARIO_49 =
  "https://buy.stripe.com/00w9AT9bA2fR8I4bayaAw00";

export const BUY_CTA_LABEL = `Comprar mi itinerario – $${PRICING.itinerarioCompleto}`;

/**
 * Payment Link URL with optional Stripe query params.
 * - client_reference_id ← quiz lead UUID (if visitor finished quiz + email capture)
 * - prefilled_email ← known email
 * Reads localStorage when opts omitted so any buy button stays consistent.
 */
export function buildStripePaymentLink(opts?: {
  clientReferenceId?: string | null;
  prefilledEmail?: string | null;
}): string {
  const url = new URL(STRIPE_LINK_ITINERARIO_49);
  const leadId =
    opts?.clientReferenceId !== undefined
      ? opts.clientReferenceId
      : getStoredQuizLeadId();
  const email =
    opts?.prefilledEmail !== undefined
      ? opts.prefilledEmail
      : getStoredQuizEmail();
  if (leadId) url.searchParams.set("client_reference_id", leadId);
  if (email) url.searchParams.set("prefilled_email", email);
  return url.toString();
}

/** WhatsApp for questions only — never the buy path. */
export const QUESTIONS_WHATSAPP_URL = buildWhatsAppLink(
  "Hola Nomaderia 👋 Tengo una duda antes de comprar el Itinerario Completo.",
);

export const QUESTIONS_WHATSAPP_LABEL = "¿Dudas? Escríbenos";

export const products: Product[] = [
  {
    id: "itinerario-completo",
    name: "Itinerario Completo Nomaderia",
    priceUSD: PRICING.itinerarioCompleto,
    currency: "USD",
    ctaType: "stripe",
    features: [
      "Itinerario día a día en PDF",
      "Rutas listas en Google Maps",
      "Plan B para cada día",
      "Permisos y reservas resueltos",
      "Logística del camino",
      "Checklist de equipo para tu nivel",
      "Presupuesto desglosado",
      "Soporte por WhatsApp durante tu viaje",
    ],
    ctaUrl: STRIPE_LINK_ITINERARIO_49,
  },
];
