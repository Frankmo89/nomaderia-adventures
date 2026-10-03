/**
 * Pre-purchase concierge gates. Pure functions shared by the Edge Function,
 * Vitest, and scripts/concierge-eval.ts. No I/O.
 *
 * Numbers are grounded in retrieved chunk text + the DATOS EN VIVO block +
 * the ranking-tool text (ADR-029). The source/date footer and the 911 line
 * are appended AFTER this check so they are not treated as invented facts.
 */

export const UNCONFIRMED_PHRASE = "Eso no lo tengo confirmado.";
export const EMAIL_AFTER_PRIOR_ANSWERS = 2;
export const CONCIERGE_MAX_PER_HOUR = 40;

const IN_SCOPE =
  /parque|sender|hik|trail|campam|acampar|mochile|nps|permiso|tarifa|reserv|equipo|mochila|essentials|llevar|niñ|adulto|calor|deshidrat|oso|puma|serpiente|v[ií]bora|fauna|clima|tormenta|emergenc|911|itinerario|viaje|hiking|camping|entrada|yosemite|zion|joshua|sequoia|secuoya|ca[nñ][oó]n|yellowstone|glacier|arches|bryce|redwood|olympic|acadia|everglades|denali|saguaro|rainier|teton|smoky|canyonland|capitol reef|mesa verde|pinnacles|lassen|carlsbad|badlands|biscayne|haleakal|volc[aá]n|haw[aá]i|samoa|v[ií]rgenes|guadalupe|rocosas|rocky|death valley|valle de la muerte|kings canyon|white sands|big bend|channel islands|islas del canal/i;

const OFF_TOPIC =
  /\b(receta|bitcoin|criptomoneda|cripto|javascript|python|c[oó]digo fuente|hor[oó]scopo|netflix|pel[ií]cula|mundial|f[uú]tbol|nba|divorcio|hipoteca|impuestos|bolsa de valores)\b/i;

const SAFETY =
  /emergenc|911|me perd[ií]|herid|lastim|torc[ií]|accidente|ambulanc|calor|insolaci[oó]n|golpe de calor|deshidrat|sin agua|cu[aá]nta agua|agua que|oso|puma|serpiente|v[ií]bora|fauna|animal salvaje|clima|tormenta|lluvia|rayos|hipoterm|crecida/i;

const GREETING =
  /^(hola|buenas|buenos d[ií]as|buenas tardes|buenas noches|hey|qu[eé] tal)[¡!.,?\s]*$/i;

export function isClearlyOutOfScope(question: string): boolean {
  const q = question.trim();
  if (q.length < 2) return false;
  if (IN_SCOPE.test(q)) return false;
  return OFF_TOPIC.test(q);
}

export function isSafetyTopic(question: string): boolean {
  return SAFETY.test(question);
}

export function isGreetingOnly(question: string): boolean {
  return GREETING.test(question.trim());
}

export function shouldAskEmail(priorAnswers: number): boolean {
  return priorAnswers >= EMAIL_AFTER_PRIOR_ANSWERS;
}

export function unconfirmedAnswer(askEmail: boolean): string {
  if (!askEmail) return UNCONFIRMED_PHRASE;
  return `${UNCONFIRMED_PHRASE} Si me dejas tu correo, lo revisamos y te escribimos.`;
}

export function outOfScopeAnswer(): string {
  return "Solo puedo ayudarte con parques nacionales de Estados Unidos y con planear ese tipo de viaje. ¿Qué parque te interesa?";
}

export function greetingAnswer(): string {
  return "Hola, soy el concierge de Nomaderia. Pregúntame sobre parques nacionales de EE.UU.: tarifas, qué llevar, reservas o tu primer sendero.";
}

export function rateLimitAnswer(): string {
  return "Has hecho muchas preguntas seguidas. Espera un poco y vuelve a intentar.";
}

export function safetySuffix(): string {
  return "Sigue la orientación del Servicio de Parques Nacionales (nps.gov) sobre calor, agua, fauna y clima. En una emergencia, llama al 911.";
}

export function canonicalNumber(raw: string): string {
  const thousands = raw.match(/^(\d{1,3}),(\d{3})$/);
  if (thousands) return String(Number(thousands[1] + thousands[2]));
  const n = Number(raw.replace(",", "."));
  if (!Number.isFinite(n)) return raw;
  return String(n);
}

export function normalizedNumbers(text: string): Set<string> {
  const set = new Set<string>();
  for (const match of text.matchAll(/\d+(?:[.,]\d+)?/g)) {
    set.add(canonicalNumber(match[0]));
  }
  return set;
}

/** Digit tokens in `answer` that do not appear in `corpus` (or `allow`). */
export function ungroundedNumbers(answer: string, corpus: string, allow: string[] = []): string[] {
  const allowed = normalizedNumbers(corpus);
  for (const extra of allow) allowed.add(canonicalNumber(extra));
  const seen = new Set<string>();
  const bad: string[] = [];
  for (const match of answer.matchAll(/\d+(?:[.,]\d+)?/g)) {
    const canon = canonicalNumber(match[0]);
    if (allowed.has(canon) || seen.has(canon)) continue;
    seen.add(canon);
    bad.push(match[0]);
  }
  return bad;
}

export function formatAnswerDate(date = new Date()): string {
  const formatted = new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Tijuana",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
  return formatted.replace(/\./g, "");
}

export function appendSourceFooter(
  answer: string,
  sources: Array<{ title: string; section: string }>,
  dateLabel: string,
): string {
  const src = sources.length
    ? sources.slice(0, 3).map((s) => `${s.title} — ${s.section}`).join("; ")
    : "base de conocimiento Nomaderia";
  const footer = `Fuente: ${src} · ${dateLabel}`;
  const trimmed = answer.trim();
  if (trimmed.endsWith(footer)) return trimmed;
  return `${trimmed}\n\n${footer}`;
}

export function composeVisibleAnswer(
  answer: string,
  safety: boolean,
  sources: Array<{ title: string; section: string }>,
  dateLabel: string,
): string {
  let text = answer.trim();
  if (safety && !text.includes("En una emergencia, llama al 911")) {
    text = `${text}\n\n${safetySuffix()}`;
  }
  return appendSourceFooter(text, sources, dateLabel);
}
