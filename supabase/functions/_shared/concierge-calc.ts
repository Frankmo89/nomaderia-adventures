/**
 * Deterministic arithmetic for the concierge (ADR-036). Pure, no I/O.
 *
 * The model never does sums in its head: it calls `calculate` with an
 * expression. Every operand must already be grounded (in the retrieved
 * context, the DATOS EN VIVO block, or a count the user wrote in the
 * question, including Spanish number words). The tool output — operands and
 * result — is added to the number corpus, so the ungrounded-number lock
 * stays as strict as before for anything the tool did not compute.
 */
import { canonicalNumber, normalizedNumbers } from "./concierge-guard.ts";

const WORD_NUMBERS: Record<string, number> = {
  un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8,
  nueve: 9, diez: 10, once: 11, doce: 12, ambos: 2, ambas: 2, pareja: 2,
};

/** Counts the user wrote in words or digits ("dos adultos", "4 personas"). */
export function questionNumbers(question: string): Set<string> {
  const out = normalizedNumbers(question);
  for (const w of question.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").match(/\p{L}+/gu) ?? []) {
    if (w in WORD_NUMBERS) out.add(String(WORD_NUMBERS[w]));
  }
  return out;
}

type Token = { t: "num"; v: number; raw: string } | { t: "op"; v: string };

function tokenize(expr: string): Token[] {
  const src = expr.replace(/[×x]/g, "*").replace(/÷/g, "/").replace(/[−–]/g, "-").replace(/\$/g, "");
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) { i++; continue; }
    const num = src.slice(i).match(/^\d+(?:[.,]\d+)?/);
    if (num) {
      tokens.push({ t: "num", v: Number(num[0].replace(",", ".")), raw: num[0] });
      i += num[0].length;
      continue;
    }
    if ("+-*/()".includes(ch)) { tokens.push({ t: "op", v: ch }); i++; continue; }
    throw new Error(`carácter no permitido: ${ch}`);
  }
  return tokens;
}

/** Recursive-descent evaluation of + - * / and parentheses. */
export function evaluateExpression(expr: string): { value: number; operands: string[] } {
  const tokens = tokenize(expr);
  if (!tokens.length || tokens.length > 60) throw new Error("expresión vacía o demasiado larga");
  let pos = 0;
  const operands: string[] = [];
  const peek = () => tokens[pos];
  function primary(): number {
    const tok = tokens[pos++];
    if (!tok) throw new Error("expresión incompleta");
    if (tok.t === "num") { operands.push(tok.raw); return tok.v; }
    if (tok.v === "(") {
      const v = sum();
      const close = tokens[pos++];
      if (!close || close.t !== "op" || close.v !== ")") throw new Error("falta )");
      return v;
    }
    if (tok.v === "-") return -primary();
    throw new Error(`token inesperado ${tok.v}`);
  }
  function product(): number {
    let v = primary();
    for (let tok = peek(); tok && tok.t === "op" && (tok.v === "*" || tok.v === "/"); tok = peek()) {
      pos++;
      const r = primary();
      if (tok.v === "/" && r === 0) throw new Error("división entre cero");
      v = tok.v === "*" ? v * r : v / r;
    }
    return v;
  }
  function sum(): number {
    let v = product();
    for (let tok = peek(); tok && tok.t === "op" && (tok.v === "+" || tok.v === "-"); tok = peek()) {
      pos++;
      const r = product();
      v = tok.v === "+" ? v + r : v - r;
    }
    return v;
  }
  const value = sum();
  if (pos !== tokens.length) throw new Error("sobran tokens");
  if (!Number.isFinite(value)) throw new Error("resultado no finito");
  return { value, operands };
}

function formatResult(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0$/, "");
}

export const CALCULATE_TOOL = {
  type: "function",
  function: {
    name: "calculate",
    description:
      "Calculadora exacta. Úsala SIEMPRE que la respuesta requiera sumar, restar, multiplicar o dividir cifras " +
      "(tarifas × personas, agua por persona × personas, diferencias). Cada número de la expresión tiene que estar en el " +
      "CONTEXTO, en DATOS EN VIVO o ser una cantidad que el usuario escribió en su pregunta. Solo + - * / y paréntesis.",
    parameters: {
      type: "object",
      properties: {
        expression: { type: "string", description: "p. ej. (20 + 100) * 2" },
        label: { type: "string", description: "qué representa el resultado, en español" },
      },
      required: ["expression"],
      additionalProperties: false,
    },
  },
} as const;

/** Runs the tool. Returns the text the model reads (and the number corpus gains). */
export function runCalculate(rawArgs: string, groundCorpus: string, question: string): string {
  let args: { expression?: unknown; label?: unknown };
  try {
    args = JSON.parse(rawArgs || "{}");
  } catch {
    return "ERROR DE CÁLCULO: argumentos no válidos.";
  }
  const expression = typeof args.expression === "string" ? args.expression : "";
  const label = typeof args.label === "string" ? args.label.replace(/\d/g, "").slice(0, 120) : "";
  let result: { value: number; operands: string[] };
  try {
    result = evaluateExpression(expression);
  } catch (err) {
    return `ERROR DE CÁLCULO: ${err instanceof Error ? err.message : String(err)}`;
  }
  const grounded = normalizedNumbers(groundCorpus);
  const asked = questionNumbers(question);
  const missing = result.operands.filter((o) => {
    const c = canonicalNumber(o);
    return !grounded.has(c) && !asked.has(c);
  });
  if (missing.length) {
    return `ERROR DE CÁLCULO: estas cifras no están en el CONTEXTO, en DATOS EN VIVO ni en la pregunta: ${missing.join(", ")}. No las uses.`;
  }
  const shown = expression.replace(/\*/g, "×").replace(/\s+/g, " ").trim();
  return `CÁLCULO${label ? ` (${label})` : ""}: ${shown} = ${formatResult(result.value)}`;
}
