/**
 * Single source of truth for the live Stripe Payment Link ($49).
 * Re-exported from src/config/pricing.ts. Edge functions import this file
 * directly (no Vite alias, no browser APIs).
 */
export const STRIPE_LINK_ITINERARIO_49 =
  "https://buy.stripe.com/28EaEX2Nc4nZ5vS3I6aAw01";

/** Append Stripe Payment Link params when quiz lead data exists. */
export function appendStripeCheckoutParams(
  base: string,
  opts: {
    clientReferenceId?: string | null;
    prefilledEmail?: string | null;
  },
): string {
  const url = new URL(base);
  const leadId = opts.clientReferenceId?.trim();
  const email = opts.prefilledEmail?.trim();
  if (leadId) url.searchParams.set("client_reference_id", leadId);
  if (email) url.searchParams.set("prefilled_email", email);
  return url.toString();
}
