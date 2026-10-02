import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import {
  WHATSAPP_NUMBER,
  products,
  STRIPE_LINK_ITINERARIO_49,
  buildStripePaymentLink,
  BUY_CTA_LABEL,
} from "@/config/pricing";

describe("Servicios / pricing buy path", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it("should generate a valid wa.me URL with the hardcoded phone number", () => {
    const url = buildWhatsAppLink("Hola");
    expect(url).toBe(`https://wa.me/${WHATSAPP_NUMBER}?text=Hola`);
  });

  it("products should use Stripe Payment Link as buy CTA", () => {
    expect(products.length).toBeGreaterThan(0);
    for (const product of products) {
      expect(product.ctaType).toBe("stripe");
      expect(product.ctaUrl).toBe(STRIPE_LINK_ITINERARIO_49);
      expect(product.ctaUrl).toContain("buy.stripe.com");
    }
  });

  it("BUY_CTA_LABEL includes $49", () => {
    expect(BUY_CTA_LABEL).toContain("$49");
    expect(BUY_CTA_LABEL).toMatch(/Comprar mi itinerario/);
  });

  it("buildStripePaymentLink appends client_reference_id and prefilled_email", () => {
    const url = buildStripePaymentLink({
      clientReferenceId: "lead-uuid-1",
      prefilledEmail: "a@b.com",
    });
    expect(url.startsWith(STRIPE_LINK_ITINERARIO_49)).toBe(true);
    expect(url).toContain("client_reference_id=lead-uuid-1");
    expect(url).toContain("prefilled_email=a%40b.com");
  });

  it("buildStripePaymentLink reads stored quiz lead from localStorage", () => {
    localStorage.setItem("nomaderia_quiz_lead_id", "stored-lead");
    localStorage.setItem("nomaderia_quiz_email", "quiz@nomaderia.com");
    const url = buildStripePaymentLink();
    expect(url).toContain("client_reference_id=stored-lead");
    expect(url).toContain("prefilled_email=quiz%40nomaderia.com");
  });

  it("should generate a valid URL for questions WhatsApp", () => {
    const heroMessage =
      "Hola Nomaderia 👋 Tengo una duda antes de comprar el Itinerario Completo.";
    const url = buildWhatsAppLink(heroMessage);
    expect(url).toContain(`https://wa.me/${WHATSAPP_NUMBER}?text=`);
    expect(url).toBe(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(heroMessage)}`
    );
  });
});
