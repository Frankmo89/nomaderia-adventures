import { describe, it, expect } from "vitest";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { WHATSAPP_NUMBER, products } from "@/config/pricing";

describe("Servicios WhatsApp URLs", () => {
  it("should generate a valid wa.me URL with the hardcoded phone number", () => {
    const url = buildWhatsAppUrl("Hola", WHATSAPP_NUMBER);
    expect(url).toBe("https://wa.me/18588996802?text=Hola");
  });

  it("products should have valid ctaUrl for WhatsApp-based products", () => {
    const whatsappProducts = products.filter((p) => p.ctaUrl.includes("wa.me"));
    expect(whatsappProducts.length).toBeGreaterThan(0);
    for (const product of whatsappProducts) {
      expect(product.ctaUrl).toContain("https://wa.me/18588996802?text=");
    }
  });

  it("should generate a valid URL for the Hero CTA message", () => {
    const heroMessage =
      "¡Hola Nomaderia! Me interesa diseñar mi próxima aventura. ¿Cuáles son los siguientes pasos?";
    const url = buildWhatsAppUrl(heroMessage, WHATSAPP_NUMBER);
    expect(url).toContain("https://wa.me/18588996802?text=");
    expect(url).toBe(
      `https://wa.me/18588996802?text=${encodeURIComponent(heroMessage)}`
    );
  });
});
