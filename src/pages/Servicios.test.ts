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
      "¡Hola! Me interesa diseñar mi viaje con el paquete Escapada de $9 USD. ¿Cuáles son los siguientes pasos?",
      "¡Hola! Me interesa diseñar mi viaje con el paquete Aventura de $25 USD. ¿Cuáles son los siguientes pasos?",
      "¡Hola! Me interesa diseñar mi viaje con el paquete Expedición de $49 USD. ¿Cuáles son los siguientes pasos?",
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
      "¡Hola! Me interesa diseñar mi próxima aventura. ¿Cuáles son los siguientes pasos?";
    const url = buildWhatsAppUrl(heroMessage, SERVICIOS_WHATSAPP_NUMBER);
    expect(url).toContain("https://wa.me/18588996802?text=");
    expect(url).toBe(
      `https://wa.me/18588996802?text=${encodeURIComponent(heroMessage)}`
    );
  });
});
