import { describe, expect, it } from "vitest";
import {
  composeVisibleAnswer,
  immigrationAnswer,
  isClearlyOutOfScope,
  isImmigrationQuestion,
  shouldAskEmail,
  unconfirmedAnswer,
  ungroundedNumbers,
  UNCONFIRMED_PHRASE,
} from "@shared/concierge-guard";
import { CONCIERGE_EVAL_QUESTIONS } from "@/lib/concierge-eval-questions";
import { runOfflineEval } from "@/lib/concierge-eval-run";

describe("concierge number gate", () => {
  const corpus = "Entrada por vehículo (7 días): $35\nTarifa de NO-RESIDENTE: $100";

  it("allows a fee that appears in the live block", () => {
    expect(ungroundedNumbers("La entrada es $35 por vehículo.", corpus)).toEqual([]);
  });

  it("blocks a fee that is not in the chunk or the live block", () => {
    expect(ungroundedNumbers("Cuesta $80.", corpus)).toEqual(["80"]);
  });

  it("does not treat 10 as 100", () => {
    expect(ungroundedNumbers("Son $100.", "solo hay un 10")).toEqual(["100"]);
  });
});

describe("concierge product gates", () => {
  it("asks for email only after two prior answers", () => {
    expect(shouldAskEmail(0)).toBe(false);
    expect(shouldAskEmail(1)).toBe(false);
    expect(shouldAskEmail(2)).toBe(true);
    expect(unconfirmedAnswer(false)).toBe(UNCONFIRMED_PHRASE);
    expect(unconfirmedAnswer(true).startsWith(UNCONFIRMED_PHRASE)).toBe(true);
  });

  it("declines an off-topic question and keeps park questions", () => {
    expect(isClearlyOutOfScope("¿Quién ganó el mundial de fútbol?")).toBe(true);
    expect(isClearlyOutOfScope("¿Cuánto cuesta entrar a Yosemite?")).toBe(false);
  });

  it("ends a safety answer with NPS guidance, 911, source and date", () => {
    const text = composeVisibleAnswer("Empieza temprano.", true, [{ title: "Joshua Tree", section: "weather" }], "3 oct 2026");
    expect(text).toContain("En una emergencia, llama al 911");
    expect(text).toContain("Fuente: Joshua Tree — weather · 3 oct 2026");
    expect(text.trim().endsWith("Fuente: Joshua Tree — weather · 3 oct 2026")).toBe(true);
  });
});

describe("concierge offline eval", () => {
  it("runs all 30 first-timer questions with no number leaks", () => {
    expect(CONCIERGE_EVAL_QUESTIONS).toHaveLength(30);
    const report = runOfflineEval();
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(30);
    expect(report.numberLeaks).toEqual([]);
  });
});

describe("immigration guard", () => {
  it("routes legal immigration questions to the fixed answer", () => {
    expect(isImmigrationQuestion("¿Si compro un pase me puedo quedar a vivir aquí?")).toBe(true);
    expect(isImmigrationQuestion("¿Revisan el estatus migratorio en la entrada?")).toBe(true);
    expect(isImmigrationQuestion("¿Necesito una visa para entrar a EE. UU.?")).toBe(true);
  });
  it("fee intent wins over residency words (relatives who live outside the U.S.)", () => {
    // Written for these tests; not exam rows.
    const feeQuestions = [
      "Mi mamá vive en México y viene de visita, ¿paga la tarifa de no residente en Sequoia?",
      "Mi primo no tiene residencia permanente, ¿cuánto paga de entrada en Yosemite?",
      "Mi suegra tiene green card y vive en Fresno, ¿le cobran el recargo de $100?",
      "Mi hermano está tramitando la ciudadanía y vive en Tijuana, ¿cuánto le cobran en Grand Canyon?",
      "Mi cuñado vive en Guadalajara y no tiene ciudadanía americana, ¿cuánto paga en la caseta de Joshua Tree?",
    ];
    for (const q of feeQuestions) expect(isImmigrationQuestion(q)).toBe(false);
  });
  it("status questions keep the fixed answer even when they mention a pass or the gate", () => {
    expect(isImmigrationQuestion("¿Me pueden deportar si entro al parque sin pase?")).toBe(true);
    expect(isImmigrationQuestion("Si compro el pase, ¿mi primo puede quedarse a vivir aquí?")).toBe(true);
    expect(isImmigrationQuestion("¿En la entrada del parque revisan el estatus migratorio?")).toBe(true);
    expect(isImmigrationQuestion("¿Cómo saco la residencia permanente?")).toBe(true);
  });
  it("leaves park and payment questions alone", () => {
    expect(isImmigrationQuestion("Vivo en México, ¿pago el recargo de no residente?")).toBe(false);
    expect(isImmigrationQuestion("¿Aceptan tarjeta Visa en la caseta?")).toBe(false);
  });
  it("abstains without reassuring or alarming", () => {
    const a = immigrationAnswer();
    expect(a.startsWith(UNCONFIRMED_PHRASE)).toBe(true);
    expect(a).not.toMatch(/\d/);
    expect(a).not.toMatch(/no te revisan|te pueden detener|puedes quedarte/i);
  });
});
