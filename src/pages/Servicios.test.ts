import { describe, it, expect } from "vitest";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const SERVICIOS_WHATSAPP_NUMBER = "18588996802";

describe("Servicios WhatsApp URLs", () => {
  it("should generate a valid wa.me URL with the hardcoded phone number", () => {
    const url = buildWhatsAppUrl("Hola", SERVICIOS_WHATSAPP_NUMBER);
    expect(url).toBe("https://wa.me/18588996802?text=Hola");
  });

  it("should encode the package messages correctly", () => {
    const messages = [
      "Hola Nomaderia, me interesa el paquete Weekend para un viaje de 1-3 días. ¿Cuáles son los siguientes pasos?",
      "Hola Nomaderia, me interesa el paquete Aventura para un viaje de 4-7 días. ¿Cuáles son los siguientes pasos?",
      "Hola Nomaderia, me interesa el paquete Expedición para un viaje de 8+ días. ¿Cuáles son los siguientes pasos?",
    ];

    for (const msg of messages) {
      const url = buildWhatsAppUrl(msg, SERVICIOS_WHATSAPP_NUMBER);
      expect(url).toContain("https://wa.me/18588996802?text=");
      expect(url).toBe(
        `https://wa.me/18588996802?text=${encodeURIComponent(msg)}`
      );
    }
  });

  it("should generate a valid URL for the Hero CTA message", () => {
    const heroMessage =
      "¡Hola Nomaderia! Me interesa diseñar mi próxima aventura. ¿Cuáles son los siguientes pasos?";
    const url = buildWhatsAppUrl(heroMessage, SERVICIOS_WHATSAPP_NUMBER);
    expect(url).toContain("https://wa.me/18588996802?text=");
    expect(url).toBe(
      `https://wa.me/18588996802?text=${encodeURIComponent(heroMessage)}`
    );
  });
});
