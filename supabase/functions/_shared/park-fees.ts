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
  /** The visit falls on an official free-entrance day (U.S. residents only since 2026). */
  fee_free_day?: boolean;
  /** Who is in THIS entry when it differs from the whole group (e.g. another car). */
  us_resident_adults?: number;
  nonresident_adults?: number;
  children_under_16?: number;
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
  /** The pass holder enters too (passes are not transferable). Default true. */
  holder_present?: boolean;
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

/** Kings Canyon shares Sequoia's fees page and row. */
const FEE_PARK_ALIAS: Record<string, string> = { kica: "seki", sequ: "seki" };

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
    const raw = String(v?.park_code ?? "").toLowerCase().trim();
    const code = FEE_PARK_ALIAS[raw] ?? raw;
    const entry = String(v?.entry ?? "") as EntryMode;
    if (!code || !["vehicle", "motorcycle", "on_foot"].includes(entry)) return "cada visita necesita park_code y entry (vehicle | motorcycle | on_foot)";
    const visit: FeeVisit = { park_code: code, entry };
    if (v.fee_free_day === true) visit.fee_free_day = true;
    // Per-entry group only when the model sends one (another car, someone joins later).
    if (["us_resident_adults", "nonresident_adults", "children_under_16"].some((k) => v[k] !== undefined && v[k] !== null)) {
      visit.us_resident_adults = int(v.us_resident_adults);
      visit.nonresident_adults = int(v.nonresident_adults);
      visit.children_under_16 = int(v.children_under_16);
      if (visit.us_resident_adults + visit.nonresident_adults === 0) return "una visita con su propio grupo necesita al menos un adulto (16+)";
    }
    visits.push(visit);
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
    pass_park_code: a.pass_park_code ? (FEE_PARK_ALIAS[String(a.pass_park_code).toLowerCase()] ?? String(a.pass_park_code).toLowerCase()) : undefined,
    compare_passes: a.compare_passes === true,
    holder_present: a.holder_present !== false,
  };
  if (input.us_resident_adults + input.nonresident_adults === 0) return "indica cuántos adultos (16+) viven en EE. UU. y cuántos no";
  return input;
}

interface VisitCost {
  lines: string[];
  terms: string[];
  total: number;
}

function visitCost(fee: ParkFeeRow, visit: FeeVisit, input: FeeInput, pass: PassHeld, rules: Map<string, PassRuleRow>): VisitCost | string {
  const name = fee.park_name;
  const entry = visit.entry;
  if (!fee.parse_ok) return `${name}: los datos oficiales no se pudieron verificar (${fee.issues.join("; ")})`;
  const res = visit.us_resident_adults ?? input.us_resident_adults;
  const non = visit.nonresident_adults ?? input.nonresident_adults;
  const kids = visit.children_under_16 ?? input.children_under_16;
  const freeDay = visit.fee_free_day === true;
  if (!fee.entrance_fee_required) {
    return { lines: [`${name}: no cobra entrada (página oficial: no se requiere pase).`], terms: ["0"], total: 0 };
  }
  const nrApplies = fee.nonresident_fee_on_page && fee.on_nonresident_list === true;
  const nrFee = nrApplies ? fee.nonresident_fee ?? 0 : 0;
  const lines: string[] = [];
  if (!nrApplies) lines.push(`${name} NO cobra la Tarifa de NO-RESIDENTE (no está en la lista oficial de parques que la cobran).`);
  if (kids && fee.min_paying_age === 16) lines.push(`Menores de 16: no pagan entrada ni Tarifa de NO-RESIDENTE (${kids}).`);

  const rule = pass !== "none" ? rules.get(pass) : undefined;
  // Passes are not transferable: the holder enters and must be eligible for that pass type.
  const holderHere = input.holder_present !== false &&
    (pass !== "atb_resident" || res > 0) && (pass !== "atb_nonresident" || non > 0);
  const passUsable = Boolean(rule?.parse_ok) && holderHere && (pass !== "park_annual" || input.pass_park_code === fee.park_code);
  if (pass !== "none" && !passUsable) {
    lines.push(
      !holderHere
        ? `El pase no es transferible: el titular tiene que entrar y mostrar identificación con foto. Sin el titular no cubre a nadie; se calcula sin pase.`
        : pass === "park_annual" ? `El pase anual de otro parque no sirve en ${name}.` : `No pude verificar las reglas del pase; se calcula sin pase.`,
    );
  }
  if (freeDay && !passUsable) {
    lines.push(`Día de entrada gratis: desde 2026 solo aplica a quienes viven en EE. UU. Quien tiene 16+ y no vive en EE. UU. paga la entrada${nrFee ? " y la Tarifa de NO-RESIDENTE" : ""}.`);
  }

  if (entry === "vehicle") {
    if (fee.vehicle === null) return `${name}: tarifa de vehículo no disponible`;
    if (passUsable && rule?.covers_vehicle_and_passengers) {
      lines.push(`Con el pase (${rule.label_es}): cubre la entrada del carro${rule.covers_nonresident_fee ? " y la Tarifa de NO-RESIDENTE" : ""} del titular y de todos los pasajeros del carro → $0.`);
      return { lines, terms: ["0"], total: 0 };
    }
    if (freeDay && non === 0) {
      lines.push(`En el carro solo van personas que viven en EE. UU. → entrada gratis ese día ($0).`);
      return { lines, terms: ["0"], total: 0 };
    }
    if (freeDay) {
      lines.push(`El carro lleva a alguien de 16+ que no vive en EE. UU.: la página oficial no da una regla distinta para carros mixtos, así que se cobra la entrada del carro.`);
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
    if (freeDay && non === 0) {
      lines.push(`En la moto solo van personas que viven en EE. UU. → entrada gratis ese día ($0).`);
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
  if (payRes && freeDay) {
    lines.push(`Personas (16+) que viven en EE. UU.: entrada gratis ese día × ${payRes} = $0.`);
  } else if (payRes) {
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
    const c = visitCost(fee, v, input, pass, rules);
    if (typeof c === "string") return c;
    const who = v.us_resident_adults !== undefined
      ? ` (esta entrada: ${v.us_resident_adults} que viven en EE. UU., ${v.nonresident_adults} que no${v.children_under_16 ? `, ${v.children_under_16} menor(es)` : ""})`
      : "";
    lines.push(`• ${fee.park_name}, ${ENTRY_ES[v.entry]}${v.fee_free_day ? ", en día de entrada gratis" : ""}${who}:`, ...c.lines.map((l) => `  - ${l}`), `  - Subtotal ${fee.park_name}: ${fmt(c.total)}`);
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
    const priced: Array<{ label: string; price: number; input: FeeInput; pass: PassHeld }> = [];
    for (const o of options) {
      const rule = rules.get(o.code);
      if (!o.eligible || !rule?.parse_ok || rule.price === null) continue;
      priced.push({ label: rule.label_es, price: rule.price, input: { ...input, pass_held: o.code }, pass: o.code });
    }
    // One park only: its own annual pass is also an option.
    const parks = [...new Set(input.visits.map((v) => v.park_code))];
    const annual = rules.get("park_annual");
    const onlyFee = parks.length === 1 ? fees.get(parks[0]) : undefined;
    if (onlyFee && annual?.parse_ok && onlyFee.annual_park_pass !== null && onlyFee.entrance_fee_required) {
      priced.push({ label: `Pase anual de ${onlyFee.park_name}`, price: onlyFee.annual_park_pass, input: { ...input, pass_held: "park_annual", pass_park_code: onlyFee.park_code }, pass: "park_annual" });
    }
    const costed: Array<{ label: string; price: number; gate: number; cost: number }> = [];
    for (const o of priced) {
      const withPass = runVisits(o.input, o.pass, fees, rules);
      if (typeof withPass === "string") continue;
      costed.push({ label: o.label, price: o.price, gate: withPass.total, cost: o.price + withPass.total });
    }
    // Only the cheapest option gets "CONVIENE": two passes can both beat the gate.
    const best = costed.reduce<(typeof costed)[number] | null>((b, o) => (o.cost < base.total && (!b || o.cost < b.cost) ? o : b), null);
    for (const o of costed) {
      const diff = base.total - o.cost;
      const verdict = diff < 0
        ? "CONVIENE PAGAR EN CASETA"
        : diff === 0
        ? "da igual"
        : o === best
        ? "CONVIENE EL PASE"
        : `ahorra frente a la caseta, pero ${best!.label} sale más barato`;
      out.push(`COMPARACIÓN con ${o.label} (${fmt(o.price)}): ${fmt(o.price)} + ${fmt(o.gate)} en caseta = ${fmt(o.cost)}; sin pase ${fmt(base.total)}; diferencia ${diff >= 0 ? `${fmt(base.total)} − ${fmt(o.cost)}` : `${fmt(o.cost)} − ${fmt(base.total)}`} = ${fmt(Math.abs(diff))} (${verdict}).`);
    }
    if (costed.length) {
      out.push(best
        ? `MEJOR OPCIÓN: ${best.label} — ${fmt(best.cost)} en total, ${fmt(base.total - best.cost)} menos que pagar en caseta (${fmt(base.total)}). Empieza la respuesta por aquí.`
        : `MEJOR OPCIÓN: pagar en caseta — ${fmt(base.total)}; ningún pase sale más barato para este viaje. Empieza la respuesta por aquí.`);
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
    lines.push(`- ${f.park_name}: carro ${fmt(f.vehicle ?? 0)} (una vez por carro, cubre a todos dentro${f.valid_days ? `; la entrada vale ${f.valid_days} días` : ""}); moto ${fmt(f.motorcycle ?? 0)}; por persona a pie/bici ${fmt(f.per_person ?? 0)}${f.min_paying_age ? ` (${f.min_paying_age}+; menores de ${f.min_paying_age} no pagan)` : ""}; pase anual del parque ${f.annual_park_pass === null ? "—" : fmt(f.annual_park_pass)}; ${nr}. (${f.source_url}, consultada ${dayEs(f.fetched_at)})`);
  }
  const res = passRows.find((p) => p.pass_code === "atb_resident");
  const non = passRows.find((p) => p.pass_code === "atb_nonresident");
  if (res?.parse_ok && non?.parse_ok) {
    lines.push(`- America the Beautiful: residente de EE. UU. ${fmt(res.price ?? 0)}; no residente ${fmt(non.price ?? 0)}. Todo America the Beautiful o pase anual del parque vigente cubre la entrada y la Tarifa de NO-RESIDENTE del titular y los pasajeros de su carro (o 2 motos); donde se cobra por persona, del titular y ${res.per_person_additional_adults ?? 3} adultos más. (${res.source_url}, consultada ${dayEs(res.fetched_at)})`);
  }
  lines.push("Para cualquier total usa la herramienta calculate_fees; no sumes tarifas a mano.");
  return lines.join("\n");
}

// ─── Question-aware review of the model's arguments ──────────────────────────

const BUY_PASS = /\bconviene|vale la pena|\bcomprar\b|\bcompro\b|\bsacar (el|un) pase|sale m[aá]s barato|ahorr\w*|ajust\w* de pases|\bqu[eé] pase|\bcompar\w*/i;
const NO_PASS = /\bsin (ning[uú]n )?pase\b|\bno (tengo|tenemos|tiene|tienen) (ning[uú]n |el |un )?pase/i;
const FREE_DAY = /d[ií]a(s)? (de entrada )?gratis|entrada gratis|fee[- ]free/i;
/** "¿Cuándo es el próximo día gratis?" asks for a date, not a free-day price. */
const ASKS_WHEN = /cu[aá]ndo (es|son|hay|cae|caen)\b/i;
/** The pass holder will not be there ("le presto mi pase", "sin mí"). */
const HOLDER_ABSENT = /\b(le|les) prest\w*|\bprest\w* (mi|el|nuestro) (pase|america the beautiful)|\bsin m[ií](?=[\s.,;:?!)]|$)|sin el titular|sin que yo (vaya|est[eé])/i;
const HAS_PASS = /\b(ya )?(tengo|tienes?|tenemos|tienen?|traigo|traes?|traemos|traen|llevo|llevas?|llevamos|llevan)\b[^.?!]{0,40}(\bpase|america the beautiful|annual pass)|(?<!compar\w* )\bcon (mi|nuestro|el|su) (pase|america the beautiful)\b|\b(pase|america the beautiful) que (ya )?(tengo|tenemos)/i;
/** Lives outside the U.S.: Mexican states/big cities and Latin American countries (fee residency is where you live). */
const OUTSIDE_US = new RegExp(
  String.raw`\b(viv\w*|radic\w*|son|somos|es|soy|vienen?|venimos)\b[^.?!]{0,30}\b(en|de|desde)\s+(m[eé]xico|cdmx|ciudad de m[eé]xico|tijuana|mexicali|ensenada|rosarito|tecate|hermosillo|nogales|ju[aá]rez|chihuahua|monterrey|saltillo|torre[oó]n|guadalajara|zapopan|le[oó]n|quer[eé]taro|puebla|oaxaca|chiapas|tabasco|veracruz|yucat[aá]n|m[eé]rida|canc[uú]n|quintana roo|sonora|sinaloa|culiac[aá]n|mazatl[aá]n|durango|zacatecas|aguascalientes|san luis potos[ií]|michoac[aá]n|morelia|jalisco|nayarit|colima|guerrero|acapulco|morelos|cuernavaca|hidalgo|pachuca|tlaxcala|estado de m[eé]xico|toluca|nuevo le[oó]n|coahuila|tamaulipas|baja california|la paz|los cabos|campeche|guanajuato|guatemala|el salvador|honduras|nicaragua|costa rica|panam[aá]|colombia|venezuela|ecuador|per[uú]|bolivia|chile|argentina|uruguay|paraguay|cuba|rep[uú]blica dominicana|espa[nñ]a|canad[aá])\b`,
  "i",
);
/** Someone in the group lives in the U.S. */
const IN_US = /viv\w* en (ee\.?\s?uu|estados unidos|usa|los estados unidos)|soy residente|residente de (ee|estados)|\b(en|de)\s+(san diego|los [aá]ngeles|california|texas|arizona|nevada|fresno|sacramento|san francisco|san jos[eé]|phoenix|tucson|las vegas|houston|dallas|chicago|nueva york|new york|florida|oxnard|riverside|bakersfield|chula vista|el centro|calexico|yuma|el paso)\b|green card|residencia permanente/i;

export function mentionsLivingOutsideUS(question: string): boolean {
  return OUTSIDE_US.test(question);
}

const NUM_WORDS: Record<string, number> = { dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10 };

/** "cinco adultos", "4 personas" → the largest stated group size (adults/people), or null. */
export function statedGroupSize(question: string): number | null {
  let best: number | null = null;
  for (const m of question.matchAll(/\b(\d{1,2}|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+(adultos|personas|amigos|viajeros)\b/gi)) {
    const n = /^\d+$/.test(m[1]) ? Number(m[1]) : NUM_WORDS[m[1].toLowerCase()];
    if (n && (best === null || n > best)) best = n;
  }
  return best;
}

/**
 * Deterministic fixes of tool arguments against the user's own question:
 * - "¿conviene comprar el pase?" without already holding one → price the visit
 *   without a pass and compare (pass_held none + compare_passes).
 * - the question says someone lives outside the U.S. but nobody was counted as
 *   nonresident → ask the model to fix the counts (no guessing here).
 */
export function reviewFeeInput(
  input: FeeInput,
  question: string,
  opts: { mentionsNonresident: boolean; tripParks?: string[] },
): FeeInput | string {
  let out = input;
  // "sin pase" is explicit; "¿cómo se compara con el pase?" is a pass to buy, not one held.
  const hasPass = !NO_PASS.test(question) && (HAS_PASS.test(question) || HOLDER_ABSENT.test(question));
  if (HOLDER_ABSENT.test(question)) out = { ...out, holder_present: false };
  // "¿Si voy el día gratis…?": the model often forgets the flag; the question decides.
  if (FREE_DAY.test(question) && !ASKS_WHEN.test(question) && !out.visits.some((v) => v.fee_free_day)) {
    out = { ...out, visits: out.visits.map((v) => ({ ...v, fee_free_day: true })) };
  }
  // A pass the user never said they have is a pass to BUY: price it as a comparison
  // (with its price), never as "already covered".
  if (out.pass_held !== "none" && !hasPass) {
    out = { ...out, pass_held: "none", pass_park_code: undefined, compare_passes: true };
  }
  if (BUY_PASS.test(question) && !hasPass) out = { ...out, compare_passes: true };
  // A pass is bought for the whole trip: comparing one park at a time gives the wrong verdict.
  const trip = [...new Set(opts.tripParks ?? [])];
  const missing = trip.filter((p) => !out.visits.some((v) => v.park_code === p));
  if (out.compare_passes && trip.length > 1 && missing.length) {
    return `la pregunta habla de ${trip.join(", ")} y la llamada no incluye ${missing.join(", ")}: para comparar pases pon TODAS las visitas del viaje en UNA sola llamada y vuelve a llamar`;
  }
  const stated = statedGroupSize(question);
  if (stated !== null && out.us_resident_adults + out.nonresident_adults < stated && !/\bniñ|menor|hij[oa]s?\b/i.test(question)) {
    return `la pregunta habla de ${stated} adultos/personas y contaste ${out.us_resident_adults + out.nonresident_adults}: cuenta a TODOS, incluido el titular del pase, y vuelve a llamar`;
  }
  const outside = opts.mentionsNonresident || OUTSIDE_US.test(question);
  const inUs = IN_US.test(question);
  if (outside && out.nonresident_adults === 0) {
    return "la pregunta dice que alguien de 16+ NO vive en EE. UU.: cuéntalo en nonresident_adults (y en us_resident_adults solo a quien sí vive en EE. UU.) y vuelve a llamar";
  }
  // A held resident pass ($80) implies its holder lives in the U.S.
  const residentHolder = hasPass && out.pass_held === "atb_resident";
  if (outside && !inUs && out.us_resident_adults > 0 && !residentHolder) {
    return "nadie en la pregunta dice vivir en EE. UU.: si todos viven fuera, ponlos a todos en nonresident_adults (us_resident_adults = 0) y vuelve a llamar";
  }
  return out;
}

// ─── DB rows → typed rows (PostgREST returns numeric columns as strings) ─────

const num = (v: unknown): number | null => (v === null || v === undefined || v === "" ? null : Number.isFinite(Number(v)) ? Number(v) : null);

export function normalizeFeeRow(r: Record<string, unknown>): ParkFeeRow {
  return {
    park_code: String(r.park_code ?? ""),
    park_name: String(r.park_name ?? ""),
    entrance_fee_required: Boolean(r.entrance_fee_required),
    vehicle: num(r.vehicle),
    motorcycle: num(r.motorcycle),
    per_person: num(r.per_person),
    annual_park_pass: num(r.annual_park_pass),
    min_paying_age: num(r.min_paying_age),
    valid_days: num(r.valid_days),
    nonresident_fee_on_page: Boolean(r.nonresident_fee_on_page),
    on_nonresident_list: r.on_nonresident_list === null || r.on_nonresident_list === undefined ? null : Boolean(r.on_nonresident_list),
    nonresident_fee: num(r.nonresident_fee),
    parse_ok: Boolean(r.parse_ok),
    issues: Array.isArray(r.issues) ? r.issues.map(String) : [],
    source_url: String(r.source_url ?? ""),
    nonresident_list_url: String(r.nonresident_list_url ?? PASSES_URL),
    fetched_at: String(r.fetched_at ?? ""),
  };
}

export function normalizePassRow(r: Record<string, unknown>): PassRuleRow {
  return {
    pass_code: String(r.pass_code) as PassRuleRow["pass_code"],
    label_es: String(r.label_es ?? ""),
    price: num(r.price),
    available_to: String(r.available_to ?? "") as PassRuleRow["available_to"],
    covers_vehicle_and_passengers: Boolean(r.covers_vehicle_and_passengers),
    per_person_additional_adults: num(r.per_person_additional_adults),
    covers_nonresident_fee: Boolean(r.covers_nonresident_fee),
    evidence: String(r.evidence ?? ""),
    source_url: String(r.source_url ?? ""),
    fetched_at: String(r.fetched_at ?? ""),
    parse_ok: Boolean(r.parse_ok),
  };
}

// ─── OpenAI tool schema ───────────────────────────────────────────────────────

export const CALCULATE_FEES_TOOL = {
  type: "function",
  function: {
    name: "calculate_fees",
    description:
      "Calcula con la tabla oficial de tarifas NPS (park_fees + pass_rules) cuánto paga un grupo de entrada. " +
      "Úsala SIEMPRE que pregunten cuánto pagan / cuánto cuesta entrar, la Tarifa de NO-RESIDENTE, si conviene un pase, " +
      "o totales de entrada para varias personas o parques. El código suma; tú explicas el resultado y citas la fuente y fecha que devuelve. " +
      "Parques: jotr (Joshua Tree), deva (Death Valley), chis (Channel Islands), pinn (Pinnacles), seki (Sequoia & Kings Canyon), yose (Yosemite), grca (Grand Canyon).",
    parameters: {
      type: "object",
      properties: {
        visits: {
          type: "array",
          description: "TODAS las visitas del viaje en UNA sola llamada (una entrada por parque), para que el total y la comparación con pases salgan completos.",
          items: {
            type: "object",
            properties: {
              park_code: { type: "string", enum: ["jotr", "deva", "chis", "pinn", "seki", "yose", "grca"] },
              entry: { type: "string", enum: ["vehicle", "motorcycle", "on_foot"], description: "vehicle = carro particular (default si van en carro o no lo dicen); on_foot = a pie o en bici" },
              fee_free_day: { type: "boolean", description: "true si esa entrada es en un día oficial de entrada gratis." },
              us_resident_adults: { type: "integer", description: "Solo si ESTA entrada lleva a otro grupo (p. ej. alguien llega en otro carro): adultos 16+ de esta entrada que viven en EE. UU." },
              nonresident_adults: { type: "integer", description: "Solo con un grupo propio de esta entrada: adultos 16+ que no viven en EE. UU." },
              children_under_16: { type: "integer", description: "Solo con un grupo propio de esta entrada: menores de 16." },
            },
            required: ["park_code", "entry"],
            additionalProperties: false,
          },
        },
        us_resident_adults: { type: "integer", description: "Personas de 16+ que VIVEN en EE. UU. (sin importar ciudadanía). Cuenta a TODOS, incluido quien tiene el pase." },
        nonresident_adults: { type: "integer", description: "Personas de 16+ que NO viven en EE. UU. (p. ej. viven en México). Cuenta a TODOS, incluido quien tiene el pase." },
        children_under_16: { type: "integer", description: "Menores de 16 años." },
        pass_held: { type: "string", enum: ["none", "atb_resident", "atb_nonresident", "park_annual"], description: "Pase que YA tienen (none si no dicen). Para saber si conviene COMPRAR un pase deja none y usa compare_passes: true." },
        pass_park_code: { type: "string", description: "Solo con park_annual: parque del pase anual." },
        compare_passes: { type: "boolean", description: "true si preguntan si conviene comprar un pase o cómo se compara con un pase." },
        holder_present: { type: "boolean", description: "false si el titular del pase NO va (p. ej. lo presta). Los pases no son transferibles." },
      },
      required: ["visits", "us_resident_adults", "nonresident_adults", "children_under_16", "pass_held"],
      additionalProperties: false,
    },
  },
} as const;

// ─── Dates: today and the next free-entrance day (from the official list) ─────

const MONTHS_EN = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const MONTHS_ES_FULL = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const WEEKDAYS_ES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** Today in America/Tijuana as {y, m (1-12), d, weekday}. */
export function todayPacific(now = new Date()): { y: number; m: number; d: number; weekday: number } {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Tijuana", year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { y: Number(get("year")), m: Number(get("month")), d: Number(get("day")), weekday: wd };
}

export function todayLineEs(now = new Date()): string {
  const t = todayPacific(now);
  return `HOY (hora del Pacífico): ${WEEKDAYS_ES[t.weekday]} ${t.d} de ${MONTHS_ES_FULL[t.m - 1]} de ${t.y}.`;
}

/** "hoy es sábado 3 de octubre (de 2026)" in the question → that date. */
export function statedToday(question: string): { m: number; d: number } | null {
  const m = question.match(/\bhoy es\s+(?:\p{L}+\s+)?(\d{1,2})\s+de\s+(\p{L}+)/iu);
  if (!m) return null;
  const month = MONTHS_ES_FULL.indexOf(m[2].toLowerCase()) + 1;
  return month ? { m: month, d: Number(m[1]) } : null;
}

/**
 * From an official "Free Entrance Days" list ("- October 27 : Theodore Roosevelt's birthday"),
 * the first listed date after `from`. Returns a context note, or "" when no list is present.
 */
export function nextFreeDayNote(texts: string[], from: { m: number; d: number }): string {
  const list = texts.find((t) => /Free Entrance Days/i.test(t));
  if (!list) return "";
  const days: Array<{ m: number; d: number; name: string; raw: string }> = [];
  for (const line of list.split("\n")) {
    const mm = line.match(/^-\s*([A-Z][a-z]+)\s+(\d{1,2})(?:[–-]\d{1,2})?\s*:\s*(.+)$/);
    if (!mm) continue;
    const m = MONTHS_EN.indexOf(mm[1].toLowerCase()) + 1;
    if (m) days.push({ m, d: Number(mm[2]), name: mm[3].trim(), raw: line.replace(/^-\s*/, "").trim() });
  }
  if (!days.length) return "";
  const after = days.filter((x) => x.m > from.m || (x.m === from.m && x.d > from.d));
  const next = after[0];
  const fromEs = `${from.d} de ${MONTHS_ES_FULL[from.m - 1]}`;
  return next
    ? `PRÓXIMO DÍA DE ENTRADA GRATIS después del ${fromEs} (lista oficial NPS): ${next.raw}.${after[1] ? ` El siguiente: ${after[1].raw}.` : ""}`
    : `No queda ningún día de entrada gratis de la lista oficial después del ${fromEs}.`;
}
