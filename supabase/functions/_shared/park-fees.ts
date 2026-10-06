// supabase/functions/_shared/park-fees.ts
// Entrance fees as data (ADR-037). Parsers read the text that ingest-nps-pages
// already extracts from the official nps.gov pages; computeFees() is the only
// place a fee total is calculated. Deno and Vite (`@shared/park-fees`) share it.

/** Parks whose fees page is parsed into public.park_fees. */
export const FEE_PARKS: Record<string, string> = {
  jotr: "Joshua Tree National Park",
  deva: "Death Valley National Park",
  chis: "Channel Islands National Park",
  pinn: "Pinnacles National Park",
  seki: "Sequoia & Kings Canyon National Parks",
  yose: "Yosemite National Park",
  grca: "Grand Canyon National Park",
};

export const PASSES_URL = "https://www.nps.gov/planyourvisit/passes.htm";
export const NONRESIDENT_FAQ_URL = "https://www.nps.gov/aboutus/nonresident-fees.htm";

export function feesUrl(parkCode: string): string {
  return `https://www.nps.gov/${parkCode}/planyourvisit/fees.htm`;
}

/** A row of public.park_fees. */
export interface ParkFeeRow {
  park_code: string;
  park_name: string;
  entrance_fee_required: boolean;
  vehicle: number | null;
  motorcycle: number | null;
  per_person: number | null;
  annual_park_pass: number | null;
  /** People younger than this pay no entrance fee and no nonresident fee. */
  min_paying_age: number | null;
  valid_days: number | null;
  /** The park's own fees page says it charges the nonresident fee. */
  nonresident_fee_on_page: boolean;
  /** The park is in the official list on passes.htm (null until that page is parsed). */
  on_nonresident_list: boolean | null;
  nonresident_fee: number | null;
  /** Page and list agree, and every fee the park charges was found. */
  parse_ok: boolean;
  issues: string[];
  source_url: string;
  nonresident_list_url: string;
  fetched_at: string;
}

/** A row of public.pass_rules. */
export interface PassRuleRow {
  pass_code: "atb_resident" | "atb_nonresident" | "park_annual";
  label_es: string;
  price: number | null;
  available_to: "us_residents" | "nonresidents" | "us_residents_park";
  covers_vehicle_and_passengers: boolean;
  /** At per-person sites: holder + N additional adults. */
  per_person_additional_adults: number | null;
  covers_nonresident_fee: boolean;
  evidence: string;
  source_url: string;
  fetched_at: string;
  parse_ok: boolean;
}

function money(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function feeLine(text: string, label: string): number | null {
  const m = text.match(new RegExp(String.raw`^${label}\s+—\s+\$(\d{1,4}(?:\.\d{2})?)`, "mi"));
  return money(m?.[1]);
}

/** Parses an extracted fees.htm page (extractNpsPage text). */
export function parseParkFeesPage(parkCode: string, text: string, fetchedAt: string): ParkFeeRow {
  const issues: string[] = [];
  const free = /No entrance pass required|There is no fee to enter|An entrance pass is not required/i.test(text);
  const vehicle = feeLine(text, "Private Vehicle");
  const motorcycle = feeLine(text, "Motorcycle");
  const perPerson = feeLine(text, "Per Person");
  const annualMatch = text.match(/###\s*Annual Entrance - Park\s*\n\s*—\s*\$(\d{1,4}(?:\.\d{2})?)/i);
  const annual = money(annualMatch?.[1]);
  const minAge = /Children under the age of 16|15 years (?:old )?(?:and|or) younger|15 and under|at least 16 years/i.test(text) ? 16 : null;
  const validDays = /valid for (?:1-)?7 days|seven consecutive days|valid for seven days|1-7 days/i.test(text) ? 7 : null;
  const nr = text.match(/non-?US resident[^.]{0,80}?must pay an? (?:additional )?\$(\d{2,4})(?: per person)?(?: nonresident)? fee/i);
  const nonresOnPage = Boolean(nr);
  if (!free) {
    if (vehicle === null) issues.push("vehicle fee not found");
    if (perPerson === null) issues.push("per-person fee not found");
    if (minAge === null) issues.push("age rule not found");
  }
  return {
    park_code: parkCode,
    park_name: FEE_PARKS[parkCode] ?? parkCode,
    entrance_fee_required: !free,
    vehicle: free ? 0 : vehicle,
    motorcycle: free ? 0 : motorcycle,
    per_person: free ? 0 : perPerson,
    annual_park_pass: free ? null : annual,
    min_paying_age: free ? null : minAge,
    valid_days: free ? null : validDays,
    nonresident_fee_on_page: nonresOnPage,
    on_nonresident_list: null,
    nonresident_fee: nonresOnPage ? money(nr?.[1]) : null,
    parse_ok: issues.length === 0,
    issues,
    source_url: feesUrl(parkCode),
    nonresident_list_url: PASSES_URL,
    fetched_at: fetchedAt,
  };
}

/** Park names in the official "$100 nonresident fee" list on passes.htm. */
export function parseNonresidentList(passesText: string): { names: string[]; amount: number | null } {
  const m = passesText.match(/At the following national parks, nonresidents[^:]*?\$(\d{2,4}) nonresident fee[^:]*:\s*([^\n]+)/i);
  if (!m) return { names: [], amount: null };
  const list = m[2].split(/\.\s/)[0];
  const names = list
    .split(/,\s*(?:and\s+)?|\s+and\s+/)
    .map((s) => s.trim().replace(/\.$/, ""))
    .filter((s) => /National Park/i.test(s));
  return { names, amount: money(m[1]) };
}

export function parkOnList(parkName: string, names: string[]): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/national parks?/g, "").replace(/[^a-z&]/g, "");
  return names.some((n) => norm(n) === norm(parkName));
}

/** Applies the official list to a parsed park row (verification: page and list must agree). */
export function withNonresidentList(row: ParkFeeRow, names: string[]): ParkFeeRow {
  if (!names.length) return row;
  const onList = parkOnList(row.park_name, names);
  const issues = row.issues.filter((i) => !i.startsWith("nonresident"));
  if (onList !== row.nonresident_fee_on_page) {
    issues.push(`nonresident mismatch: page ${row.nonresident_fee_on_page}, list ${onList}`);
  }
  return { ...row, on_nonresident_list: onList, issues, parse_ok: issues.length === 0 };
}

/** America the Beautiful + park annual pass rules, each backed by a sentence of the NPS page. */
export function parsePassRules(passesText: string, faqText: string, fetchedAt: string): PassRuleRow[] {
  const resident = passesText.match(/Resident Annual Pass\s*\n\s*US citizens and residents\s*\n\s*\$(\d{2,4}(?:\.\d{2})?)/i);
  const nonresident = passesText.match(/Non-Resident Annual Pass\s*\n\s*Non-US residents\s*\n\s*\$(\d{2,4}(?:\.\d{2})?)/i);
  const coverSentence = faqText.match(/[^.\n]*all valid America the Beautiful Passes and park-specific annual passes will cover entrance fees and nonresident fees for the pass holder and passengers in a private vehicle[^.\n]*\.[^.\n]*three additional adults\./i)?.[0] ?? "";
  const nonresCover = passesText.match(/[^\n]*Non-Resident Annual Pass is available for \$\d+, which covers the entire vehicle[^\n]*?three additional adults[^.\n]*\./i)?.[0] ?? "";
  const coverOk = Boolean(coverSentence);
  const threeAdults = /three additional adults/i.test(coverSentence) ? 3 : null;
  return [
    {
      pass_code: "atb_resident",
      label_es: "America the Beautiful (residente de EE. UU.)",
      price: money(resident?.[1]),
      available_to: "us_residents",
      covers_vehicle_and_passengers: coverOk,
      per_person_additional_adults: threeAdults,
      covers_nonresident_fee: coverOk,
      evidence: coverSentence,
      source_url: NONRESIDENT_FAQ_URL,
      fetched_at: fetchedAt,
      parse_ok: Boolean(resident) && coverOk,
    },
    {
      pass_code: "atb_nonresident",
      label_es: "America the Beautiful (no residente)",
      price: money(nonresident?.[1]),
      available_to: "nonresidents",
      covers_vehicle_and_passengers: coverOk || Boolean(nonresCover),
      per_person_additional_adults: threeAdults ?? (nonresCover ? 3 : null),
      covers_nonresident_fee: coverOk,
      evidence: nonresCover || coverSentence,
      source_url: PASSES_URL,
      fetched_at: fetchedAt,
      parse_ok: Boolean(nonresident) && coverOk,
    },
    {
      pass_code: "park_annual",
      label_es: "Pase anual del parque",
      price: null,
      available_to: "us_residents_park",
      covers_vehicle_and_passengers: coverOk,
      per_person_additional_adults: threeAdults,
      covers_nonresident_fee: coverOk,
      evidence: coverSentence,
      source_url: NONRESIDENT_FAQ_URL,
      fetched_at: fetchedAt,
      parse_ok: coverOk,
    },
  ];
}

// ─── calculate_fees ──────────────────────────────────────────────────────────

export type EntryMode = "vehicle" | "motorcycle" | "on_foot";
export type PassHeld = "none" | "atb_resident" | "atb_nonresident" | "park_annual";

export interface FeeVisit {
  park_code: string;
  entry: EntryMode;
}

export interface FeeInput {
  visits: FeeVisit[];
  us_resident_adults: number;
  nonresident_adults: number;
  children_under_16: number;
  pass_held: PassHeld;
  /** park_annual only: the park the annual pass belongs to. */
  pass_park_code?: string;
  /** Also price the passes the group could buy. */
  compare_passes?: boolean;
}

export interface FeeResult {
  ok: boolean;
  text: string;
  total: number | null;
  sources: Array<{ url: string; fetched_at: string }>;
}

const ENTRY_ES: Record<EntryMode, string> = { vehicle: "en un carro particular", motorcycle: "en una moto", on_foot: "a pie o en bici (cobro por persona)" };
const fmt = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
const MONTHS_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
/** "6 oct 2026" in the America/Tijuana calendar (same as the concierge footer). */
function dayEs(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Tijuana", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return `${get("day")} ${MONTHS_ES[get("month") - 1]} ${get("year")}`;
}

function int(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

/** Validates the raw tool arguments. */
export function parseFeeInput(raw: string): FeeInput | string {
  let a: Record<string, unknown>;
  try {
    a = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return "argumentos inválidos";
  }
  const visitsRaw = Array.isArray(a.visits) ? a.visits : a.park_code ? [{ park_code: a.park_code, entry: a.entry }] : [];
  const visits: FeeVisit[] = [];
  for (const v of visitsRaw as Array<Record<string, unknown>>) {
    const code = String(v?.park_code ?? "").toLowerCase();
    const entry = String(v?.entry ?? "") as EntryMode;
    if (!code || !["vehicle", "motorcycle", "on_foot"].includes(entry)) return "cada visita necesita park_code y entry (vehicle | motorcycle | on_foot)";
    visits.push({ park_code: code, entry });
  }
  if (!visits.length) return "falta al menos una visita";
  const pass = String(a.pass_held ?? "none") as PassHeld;
  if (!["none", "atb_resident", "atb_nonresident", "park_annual"].includes(pass)) return "pass_held inválido";
  const input: FeeInput = {
    visits,
    us_resident_adults: int(a.us_resident_adults),
    nonresident_adults: int(a.nonresident_adults),
    children_under_16: int(a.children_under_16),
    pass_held: pass,
    pass_park_code: a.pass_park_code ? String(a.pass_park_code).toLowerCase() : undefined,
    compare_passes: a.compare_passes === true,
  };
  if (input.us_resident_adults + input.nonresident_adults === 0) return "indica cuántos adultos (16+) viven en EE. UU. y cuántos no";
  return input;
}

interface VisitCost {
  lines: string[];
  terms: string[];
  total: number;
}

function visitCost(fee: ParkFeeRow, entry: EntryMode, input: FeeInput, pass: PassHeld, rules: Map<string, PassRuleRow>): VisitCost | string {
  const name = fee.park_name;
  if (!fee.parse_ok) return `${name}: los datos oficiales no se pudieron verificar (${fee.issues.join("; ")})`;
  const res = input.us_resident_adults;
  const non = input.nonresident_adults;
  const kids = input.children_under_16;
  if (!fee.entrance_fee_required) {
    return { lines: [`${name}: no cobra entrada (página oficial: no se requiere pase).`], terms: ["0"], total: 0 };
  }
  const nrApplies = fee.nonresident_fee_on_page && fee.on_nonresident_list === true;
  const nrFee = nrApplies ? fee.nonresident_fee ?? 0 : 0;
  const lines: string[] = [];
  if (!nrApplies) lines.push(`${name} NO cobra la Tarifa de NO-RESIDENTE (no está en la lista oficial de parques que la cobran).`);
  if (kids && fee.min_paying_age === 16) lines.push(`Menores de 16: no pagan entrada ni Tarifa de NO-RESIDENTE (${kids}).`);

  const rule = pass !== "none" ? rules.get(pass) : undefined;
  const passUsable = Boolean(rule?.parse_ok) && (pass !== "park_annual" || input.pass_park_code === fee.park_code);
  if (pass !== "none" && !passUsable) {
    lines.push(pass === "park_annual" ? `El pase anual de otro parque no sirve en ${name}.` : `No pude verificar las reglas del pase; se calcula sin pase.`);
  }

  if (entry === "vehicle") {
    if (fee.vehicle === null) return `${name}: tarifa de vehículo no disponible`;
    if (passUsable && rule?.covers_vehicle_and_passengers) {
      lines.push(`Con el pase (${rule.label_es}): cubre la entrada del carro${rule.covers_nonresident_fee ? " y la Tarifa de NO-RESIDENTE" : ""} del titular y de todos los pasajeros del carro → $0.`);
      return { lines, terms: ["0"], total: 0 };
    }
    const terms = [`${fee.vehicle} (carro)`];
    let total = fee.vehicle;
    lines.push(`Entrada por vehículo: ${fmt(fee.vehicle)} una sola vez por carro (cubre a todos los que van dentro${fee.valid_days ? `; válida ${fee.valid_days} días` : ""}).`);
    if (nrFee && non) {
      terms.push(`${nrFee} × ${non} (NO-RESIDENTE)`);
      total += nrFee * non;
      lines.push(`Tarifa de NO-RESIDENTE: ${fmt(nrFee)} por persona de 16+ que no vive en EE. UU. × ${non} = ${fmt(nrFee * non)}.`);
    }
    return { lines, terms, total };
  }

  if (entry === "motorcycle") {
    if (fee.motorcycle === null) return `${name}: tarifa de moto no disponible`;
    if (passUsable && rule?.covers_vehicle_and_passengers) {
      lines.push(`Con el pase (${rule.label_es}): cubre hasta dos motos con titular y pasajeros${rule.covers_nonresident_fee ? ", incluida la Tarifa de NO-RESIDENTE" : ""} → $0.`);
      return { lines, terms: ["0"], total: 0 };
    }
    const terms = [`${fee.motorcycle} (moto)`];
    let total = fee.motorcycle;
    lines.push(`Entrada en moto: ${fmt(fee.motorcycle)}.`);
    if (nrFee && non) {
      terms.push(`${nrFee} × ${non} (NO-RESIDENTE)`);
      total += nrFee * non;
      lines.push(`Tarifa de NO-RESIDENTE: ${fmt(nrFee)} × ${non} = ${fmt(nrFee * non)}.`);
    }
    return { lines, terms, total };
  }

  // on_foot: per-person fees; a pass covers the holder + N additional adults.
  if (fee.per_person === null) return `${name}: tarifa por persona no disponible`;
  let coveredRes = 0;
  let coveredNon = 0;
  if (passUsable && rule?.per_person_additional_adults !== null && rule) {
    let slots = 1 + (rule.per_person_additional_adults ?? 0);
    // The holder must be eligible for the pass type; fill slots residents-first only for resident passes.
    const order: Array<"res" | "non"> = pass === "atb_nonresident" ? ["non", "res"] : ["res", "non"];
    for (const who of order) {
      const avail = who === "res" ? res : non;
      const take = Math.min(avail, slots);
      if (who === "res") coveredRes = take; else coveredNon = take;
      slots -= take;
    }
    lines.push(`Con el pase (${rule.label_es}): donde se cobra por persona cubre al titular y a ${rule.per_person_additional_adults} adultos más${rule.covers_nonresident_fee ? ", incluida su Tarifa de NO-RESIDENTE" : ""} (${coveredRes + coveredNon} cubiertos).`);
  }
  const payRes = res - coveredRes;
  const payNon = non - coveredNon;
  const terms: string[] = [];
  let total = 0;
  if (payRes) {
    terms.push(`${fee.per_person} × ${payRes} (entrada)`);
    total += fee.per_person * payRes;
    lines.push(`Entrada por persona (16+) que vive en EE. UU.: ${fmt(fee.per_person)} × ${payRes} = ${fmt(fee.per_person * payRes)}.`);
  }
  if (payNon) {
    const each = fee.per_person + nrFee;
    terms.push(nrFee ? `(${fee.per_person} + ${nrFee}) × ${payNon}` : `${fee.per_person} × ${payNon} (entrada)`);
    total += each * payNon;
    lines.push(nrFee
      ? `Cada persona de 16+ que no vive en EE. UU.: entrada ${fmt(fee.per_person)} + Tarifa de NO-RESIDENTE ${fmt(nrFee)} = ${fmt(each)} × ${payNon} = ${fmt(each * payNon)}.`
      : `Entrada por persona (16+) que no vive en EE. UU.: ${fmt(fee.per_person)} × ${payNon} = ${fmt(fee.per_person * payNon)}.`);
  }
  if (!terms.length) terms.push("0");
  return { lines, terms, total };
}

function runVisits(input: FeeInput, pass: PassHeld, fees: Map<string, ParkFeeRow>, rules: Map<string, PassRuleRow>): { lines: string[]; terms: string[]; total: number } | string {
  const lines: string[] = [];
  const terms: string[] = [];
  let total = 0;
  for (const v of input.visits) {
    const fee = fees.get(v.park_code);
    if (!fee) return `No tengo tarifas oficiales guardadas para ${v.park_code}.`;
    const c = visitCost(fee, v.entry, input, pass, rules);
    if (typeof c === "string") return c;
    lines.push(`• ${fee.park_name}, ${ENTRY_ES[v.entry]}:`, ...c.lines.map((l) => `  - ${l}`), `  - Subtotal ${fee.park_name}: ${fmt(c.total)}`);
    terms.push(...c.terms.map((t) => (input.visits.length > 1 ? `${t} [${fee.park_code}]` : t)));
    total += c.total;
  }
  return { lines, terms, total };
}

/** Deterministic fee calculation. The model only explains the result. */
export function computeFees(input: FeeInput, feeRows: ParkFeeRow[], passRows: PassRuleRow[]): FeeResult {
  const fees = new Map(feeRows.map((r) => [r.park_code, r]));
  const rules = new Map(passRows.map((r) => [r.pass_code, r]));
  const base = runVisits(input, input.pass_held, fees, rules);
  if (typeof base === "string") return { ok: false, text: `ERROR calculate_fees: ${base} No des un total; di que no lo tienes confirmado y da la liga oficial.`, total: null, sources: [] };
  const groupEs = `${input.us_resident_adults} adulto(s) que viven en EE. UU., ${input.nonresident_adults} adulto(s) que no viven en EE. UU., ${input.children_under_16} menor(es) de 16`;
  const out: string[] = [
    `TARIFAS CALCULADAS (calculate_fees, datos oficiales NPS) — grupo: ${groupEs}; pase: ${input.pass_held}.`,
    ...base.lines,
    `TOTAL: ${base.terms.join(" + ")} = ${fmt(base.total)}`,
  ];
  if (input.compare_passes) {
    const options: Array<{ code: "atb_resident" | "atb_nonresident"; eligible: boolean }> = [
      { code: "atb_resident", eligible: input.us_resident_adults > 0 },
      { code: "atb_nonresident", eligible: input.nonresident_adults > 0 },
    ];
    for (const o of options) {
      const rule = rules.get(o.code);
      if (!o.eligible || !rule?.parse_ok || rule.price === null) continue;
      const withPass = runVisits({ ...input, pass_held: o.code }, o.code, fees, rules);
      if (typeof withPass === "string") continue;
      const cost = rule.price + withPass.total;
      const diff = base.total - cost;
      out.push(`COMPARACIÓN con ${rule.label_es} (${fmt(rule.price)}): ${fmt(rule.price)} + ${fmt(withPass.total)} en caseta = ${fmt(cost)}; sin pase ${fmt(base.total)}; diferencia ${fmt(base.total)} − ${fmt(cost)} = ${diff < 0 ? "-" : ""}${fmt(Math.abs(diff))} (${diff > 0 ? "conviene el pase" : diff < 0 ? "conviene pagar en caseta" : "da igual"}).`);
    }
  }
  const srcs = new Map<string, string>();
  for (const v of input.visits) {
    const f = fees.get(v.park_code);
    if (f) {
      srcs.set(f.source_url, f.fetched_at);
      if (f.entrance_fee_required) srcs.set(f.nonresident_list_url, f.fetched_at);
    }
  }
  if (input.pass_held !== "none" || input.compare_passes) {
    for (const r of passRows) srcs.set(r.source_url, r.fetched_at);
  }
  const sources = [...srcs].map(([url, fetched_at]) => ({ url, fetched_at }));
  out.push(`FUENTES: ${sources.map((s) => `${s.url} (consultada ${dayEs(s.fetched_at)})`).join("; ")}`);
  return { ok: true, text: out.join("\n"), total: base.total, sources };
}

/** Short fee facts for the parks a fee question names (context block, no math). */
export function feeFactsBlock(feeRows: ParkFeeRow[], passRows: PassRuleRow[]): string {
  const lines: string[] = ["TARIFAS OFICIALES (tabla park_fees, de las páginas de tarifas de nps.gov):"];
  for (const f of feeRows) {
    if (!f.parse_ok) {
      lines.push(`- ${f.park_name}: datos sin verificar; no des cifras, manda a ${f.source_url}.`);
      continue;
    }
    if (!f.entrance_fee_required) {
      lines.push(`- ${f.park_name}: no cobra entrada. (${f.source_url}, consultada ${dayEs(f.fetched_at)})`);
      continue;
    }
    const nr = f.nonresident_fee_on_page && f.on_nonresident_list === true
      ? `Tarifa de NO-RESIDENTE ${fmt(f.nonresident_fee ?? 0)} por persona de 16+ que no vive en EE. UU. (además de la entrada)`
      : "NO cobra Tarifa de NO-RESIDENTE (no está en la lista oficial)";
    lines.push(`- ${f.park_name}: carro ${fmt(f.vehicle ?? 0)} (una vez por carro, cubre a todos dentro); moto ${fmt(f.motorcycle ?? 0)}; por persona a pie/bici ${fmt(f.per_person ?? 0)} (16+; menores de 16 no pagan); pase anual del parque ${f.annual_park_pass === null ? "—" : fmt(f.annual_park_pass)}; ${nr}. (${f.source_url}, consultada ${dayEs(f.fetched_at)})`);
  }
  const res = passRows.find((p) => p.pass_code === "atb_resident");
  const non = passRows.find((p) => p.pass_code === "atb_nonresident");
  if (res?.parse_ok && non?.parse_ok) {
    lines.push(`- America the Beautiful: residente de EE. UU. ${fmt(res.price ?? 0)}; no residente ${fmt(non.price ?? 0)}. Todo America the Beautiful o pase anual del parque vigente cubre la entrada y la Tarifa de NO-RESIDENTE del titular y los pasajeros de su carro (o 2 motos); donde se cobra por persona, del titular y ${res.per_person_additional_adults ?? 3} adultos más. (${res.source_url}, consultada ${dayEs(res.fetched_at)})`);
  }
  lines.push("Para cualquier total usa la herramienta calculate_fees; no sumes tarifas a mano.");
  return lines.join("\n");
}
