import { describe, expect, it } from "vitest";
import { isProductQuestion, PRODUCT_CARD_TEXT, PRODUCT_CARD_URL } from "@shared/product-card";
import { ungroundedNumbers } from "@shared/concierge-guard";

describe("product card", () => {
  it("states the service facts from nomaderia.com/servicios", () => {
    expect(PRODUCT_CARD_URL).toBe("https://nomaderia.com/servicios");
    expect(PRODUCT_CARD_TEXT).toMatch(/Itinerario Completo Nomaderia — \$49 USD/);
    expect(PRODUCT_CARD_TEXT).toMatch(/24 a 48 horas/);
    expect(PRODUCT_CARD_TEXT).toMatch(/una ronda de ajustes/);
    expect(PRODUCT_CARD_TEXT).toMatch(/con tarjeta en nomaderia\.com/);
    expect(PRODUCT_CARD_TEXT).toMatch(/después de pagar, recibes nuestro WhatsApp/);
    expect(PRODUCT_CARD_TEXT).toMatch(/WhatsApp durante tu viaje/);
  });
  it("detects product questions (fresh wording)", () => {
    for (const q of [
      "¿Qué precio tiene su itinerario completo?",
      "Si compro el itinerario, ¿en cuánto tiempo me lo entregan?",
      "¿Puedo pedir que me cambien algo del itinerario después?",
      "¿Cómo les pago, aceptan tarjeta para el itinerario?",
      "¿Me dan su WhatsApp antes de comprar?",
      "¿El itinerario es para gente principiante?",
    ]) expect(isProductQuestion(q), q).toBe(true);
  });
  it("does not treat park questions as product questions", () => {
    expect(isProductQuestion("¿Cuánto cuesta la entrada al parque xxxx en carro?")).toBe(false);
    expect(isProductQuestion("Arma un itinerario de dos días y dime cuánto cuesta la entrada", { mentionsPark: true })).toBe(false);
    expect(isProductQuestion("¿Qué dice la página de tarifas del parque sobre motos?")).toBe(false);
    expect(isProductQuestion("¿Qué itinerario de 1 día me recomiendas en el valle?", { mentionsPark: true })).toBe(false);
  });
  it("card digits pass the number lock against its own context block", () => {
    expect(ungroundedNumbers(PRODUCT_CARD_TEXT, PRODUCT_CARD_TEXT)).toEqual([]);
  });
});
