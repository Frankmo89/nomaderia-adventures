// supabase/functions/_shared/product-card.ts
// Fixed product card (ADR-037), from the live page https://nomaderia.com/servicios
// (rendered DOM + FAQ answers, fetched 2026-10-05 23:2x PT). Every line restates
// a sentence of that page; nothing is added. If the page changes, update this file.
// The Stripe link constant lives elsewhere and is not touched here.

export const PRODUCT_CARD_URL = "https://nomaderia.com/servicios";
export const PRODUCT_CARD_FETCHED_AT = "2026-10-06T06:25:00Z";
export const PRODUCT_CARD_DATE_ES = "5 oct 2026";

export const PRODUCT_CARD_TEXT = [
  "Itinerario Completo Nomaderia — $49 USD (de nomaderia.com/servicios):",
  "- Pago: pagas $49 con tarjeta en nomaderia.com (Stripe).",
  "- Entrega: después de pagar, recibes nuestro WhatsApp y el itinerario en 24 a 48 horas.",
  "- Incluye: itinerario día a día en PDF; rutas listas en Google Maps (un enlace por día); plan B para cada día; permisos y reservas resueltos; logística del camino (gasolina, comida, paradas); checklist de equipo para tu nivel; presupuesto desglosado; WhatsApp durante tu viaje.",
  "- Cambios: una ronda de ajustes está incluida.",
  "- Personalizado: sin plantillas; se diseña desde cero según tu nivel de experiencia, presupuesto, fechas y grupo, 100% en español.",
  "- WhatsApp antes de comprar es solo para dudas. Durante el viaje respondemos durante el día; no somos un servicio de emergencias: en una emergencia, llama al 911.",
].join("\n");

const STRONG = /nomaderia|\$\s?49\b|\b49 ?(usd|d[oó]lares)|\bstripe\b|whatsapp|itinerario (completo|personalizado)|ronda de ajustes|servicio de itinerario|p[aá]gina de servicios/i;
const ITINERARY = /\bitinerarios?\b/i;
const PURCHASE = /\bcompr\w*|\bpag(ar|o|as|an)\b|\bprecio|cu[aá]nto (cuesta|cobran|sale|vale)|qu[eé] incluye|\bincluye|entreg\w*|cu[aá]nto tarda|\btarda\b|\bajust\w*|\bcambi\w*|\bmodific\w*|reembolso|\btarjeta\b|ustedes|me (hacen|arman|mandan|preparan)|\bcontrat\w*/i;
/** Traits of the service itself (who it is for, templates, personalization). */
const TRAIT = /plantilla|personaliza\w*|para qui[eé]n|principiantes?|\bel itinerario\b/i;
const SERVICE = /\b(sus|tus) servicios\b|\bcontratar(los|te|les)?\b|\basesor[ií]a\b|ustedes (hacen|arman|venden|ofrecen)|qu[eé] servicios? (ofrecen|tienen|venden)/i;
/** Park-fee wording: an itinerary question that asks about entrance costs is not a product question. */
const PARK_COST = /\bentrada\b|\bcaseta\b|\btarifa|\brecargo\b|\bparques?\b|\bpases?\b/i;
/** "la página" (not "la página de tarifas/del parque…") with no park in play refers to nomaderia.com. */
const SITE_PAGE = /\bla p[aá]gina\b(?!\s+(de|del|oficial|web del)\b)/i;

/**
 * Questions about the paid itinerary service (price, what's included, delivery,
 * changes, payment, WhatsApp). When a park is in play (named, a place in it, or
 * an open guide) only explicit product wording counts: a park itinerary or a
 * park page is not the product.
 */
export function isProductQuestion(question: string, opts: { mentionsPark?: boolean } = {}): boolean {
  if (STRONG.test(question)) return true;
  if (opts.mentionsPark) return false;
  if (ITINERARY.test(question) && (PURCHASE.test(question) || TRAIT.test(question)) && !PARK_COST.test(question)) return true;
  if (SITE_PAGE.test(question)) return true;
  return SERVICE.test(question);
}

/** Block the model reads (CONTEXTO) for product questions. */
export function productContextBlock(): string {
  return `TARJETA DE PRODUCTO [PÁGINA OFICIAL ${PRODUCT_CARD_URL}, consultada ${PRODUCT_CARD_DATE_ES}]\n${PRODUCT_CARD_TEXT}`;
}
