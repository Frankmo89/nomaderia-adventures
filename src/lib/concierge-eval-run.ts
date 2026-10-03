import {
  composeVisibleAnswer,
  isClearlyOutOfScope,
  isSafetyTopic,
  safetySuffix,
  unconfirmedAnswer,
  ungroundedNumbers,
  UNCONFIRMED_PHRASE,
} from "../../supabase/functions/_shared/concierge-guard.ts";
import { CONCIERGE_EVAL_QUESTIONS, type ConciergeEvalQuestion } from "./concierge-eval-questions.ts";

export interface ConciergeEvalFailure {
  id: string;
  question: string;
  reasons: string[];
}

export interface ConciergeEvalReport {
  total: number;
  passed: number;
  passRate: number;
  failures: ConciergeEvalFailure[];
  /** Bad answers whose invented digits were NOT blocked. */
  numberLeaks: Array<{ id: string; numbers: string[] }>;
}

function corpusOf(q: ConciergeEvalQuestion): string {
  return [q.fixture_chunk, q.live_line ?? ""].filter(Boolean).join("\n");
}

export function evaluateQuestion(q: ConciergeEvalQuestion): string[] {
  const reasons: string[] = [];
  if (isClearlyOutOfScope(q.question)) {
    reasons.push("pregunta de primerizo marcada fuera de alcance");
  }
  if (q.safety !== isSafetyTopic(q.question)) {
    reasons.push(`safety esperado ${q.safety} pero el detector dijo ${isSafetyTopic(q.question)}`);
  }
  const corpus = corpusOf(q);
  const leaked = ungroundedNumbers(q.bad_answer, corpus);
  if (leaked.length === 0) {
    reasons.push("la respuesta inventada no fue bloqueada (no hay cifra fuera del chunk)");
  }
  const goodBad = ungroundedNumbers(q.good_answer, corpus);
  if (goodBad.length > 0) {
    reasons.push(`la respuesta buena trae cifras fuera del chunk: ${goodBad.join(", ")}`);
  }
  if (q.safety) {
    const visible = composeVisibleAnswer(q.good_answer, true, [{ title: "Guía", section: q.expected_source }], "3 oct 2026");
    if (!visible.includes(safetySuffix()) && !visible.includes("En una emergencia, llama al 911")) {
      reasons.push("falta el aviso de emergencia / 911");
    }
    if (!visible.includes("Fuente:")) reasons.push("falta la fuente");
  }
  if (!q.good_answer.includes(UNCONFIRMED_PHRASE)) {
    // Grounded answers must still be able to end with a source line.
    const visible = composeVisibleAnswer(q.good_answer, q.safety, [{ title: "Guía Nomaderia", section: "fixture" }], "3 oct 2026");
    if (!/Fuente: .+ · /.test(visible)) reasons.push("la respuesta no termina con fuente y fecha");
  }
  return reasons;
}

export function runOfflineEval(questions: ConciergeEvalQuestion[] = CONCIERGE_EVAL_QUESTIONS): ConciergeEvalReport {
  const failures: ConciergeEvalFailure[] = [];
  const numberLeaks: ConciergeEvalReport["numberLeaks"] = [];
  for (const q of questions) {
    const reasons = evaluateQuestion(q);
    const leaked = ungroundedNumbers(q.bad_answer, corpusOf(q));
    if (leaked.length === 0) numberLeaks.push({ id: q.id, numbers: [] });
    if (reasons.length) failures.push({ id: q.id, question: q.question, reasons });
  }
  // Email gate is part of the contract, checked once for the set.
  if (unconfirmedAnswer(false) !== UNCONFIRMED_PHRASE) {
    failures.push({ id: "gate", question: "(umbral)", reasons: ["la frase sin correo cambió"] });
  }
  const passed = questions.length - failures.filter((f) => f.id !== "gate").length;
  return {
    total: questions.length,
    passed,
    passRate: questions.length ? passed / questions.length : 0,
    failures,
    numberLeaks: numberLeaks.filter((n) => failures.some((f) => f.id === n.id)),
  };
}
