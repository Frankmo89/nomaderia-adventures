import { describe, expect, it } from "vitest";
import { WHATSAPP_NUMBER, buildWhatsAppLink, buildWhatsAppShareLink } from "@/lib/whatsapp";

describe("WhatsApp links", () => {
  it("buildWhatsAppLink goes to Nomaderia's number", () => {
    expect(buildWhatsAppLink("Hola")).toBe(`https://wa.me/${WHATSAPP_NUMBER}?text=Hola`);
  });

  it("buildWhatsAppShareLink lets the visitor pick any chat", () => {
    const link = buildWhatsAppShareLink("¿Vamos? $767 & más");
    expect(link.startsWith("https://wa.me/?text=")).toBe(true);
    expect(link).not.toContain(WHATSAPP_NUMBER);
    expect(decodeURIComponent(link.split("text=")[1])).toBe("¿Vamos? $767 & más");
  });
});
