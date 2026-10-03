import { describe, expect, it } from "vitest";
import {
  composeVisibleAnswer,
  isClearlyOutOfScope,
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
