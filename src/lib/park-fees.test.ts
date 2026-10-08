import { describe, expect, it } from "vitest";
import {
  computeFees,
  parseFeeInput,
  parseNonresidentList,
  parseParkFeesPage,
  reviewFeeInput,
  statedGroupSize,
  nextFreeDayNote,
  statedToday,
  parsePassRules,
  withNonresidentList,
  type ParkFeeRow,
} from "@shared/park-fees";

// Synthetic page text in the shape extractNpsPage produces (not copied from the exam).
const T = "2026-10-06T05:00:00Z";
const listedPage = `## Entrance Fees
- Non-US residents (16 and over) must pay an additional $100 per person fee unless admitted with an Annual or America the Beautiful Pass.
### For Vehicles
Private Vehicle — $35.00
This pass is valid for 7 days.
Motorcycle — $30.00
### For Individuals without a Vehicle
If you enter on foot and are at least 16 years old, you need your own entrance pass. Children under the age of 16 don't need an entrance pass.
Per Person — $20.00
### Annual Entrance - Park
— $70.00
Each non-US resident aged 16 and older visiting Yosemite National Park must pay a $100 nonresident fee (in addition to the standard entrance fee).`;
const unlistedPage = `Private Vehicle — $30.00
Motorcycle — $25.00
Children under the age of 16 don't need an entrance pass.
Per Person — $15.00
### Annual Entrance - Park
— $55.00`;
const passes = `Type
Available to
Price
Resident Annual Pass
US citizens and residents
$80.00
Non-Resident Annual Pass
Non-US residents
$250.00
## Nonresidents of the United States
- An America the Beautiful Non-Resident Annual Pass is available for $250, which covers the entire vehicle, or 2 motorcycles, or the passholder plus three additional adults in their party where per-person rather than per-vehicle fees are charged.
- At the following national parks, nonresidents age 16 and older must pay a $100 nonresident fee (in addition to the regular entrance fee), unless admitted with an Annual or America the Beautiful Pass: Acadia National Park, Yosemite National Park, and Zion National Park. Find answers.`;
const faq = `Regardless of the year issued, all valid America the Beautiful Passes and park-specific annual passes will cover entrance fees and nonresident fees for the pass holder and passengers in a private vehicle or on two motorcycles. At sites that charge per person, all valid America the Beautiful Passes and park-specific annual passes will cover entrance fees and nonresident fees for the pass holder and three additional adults.`;

const list = parseNonresidentList(passes);
const yose = withNonresidentList(parseParkFeesPage("yose", listedPage, T), list.names);
const jotr = withNonresidentList(parseParkFeesPage("jotr", unlistedPage, T), list.names);
const rules = parsePassRules(passes, faq, T);
const rows: ParkFeeRow[] = [yose, jotr];
const run = (o: object) => {
  const input = parseFeeInput(JSON.stringify(o));
  if (typeof input === "string") throw new Error(input);
  return computeFees(input, rows, rules);
};

describe("park fee parsing", () => {
  it("reads fees, age rule and the nonresident flag, cross-checked with the official list", () => {
    expect(list.names).toEqual(["Acadia National Park", "Yosemite National Park", "Zion National Park"]);
    expect(yose).toMatchObject({ vehicle: 35, motorcycle: 30, per_person: 20, annual_park_pass: 70, min_paying_age: 16, nonresident_fee: 100, on_nonresident_list: true, parse_ok: true });
    expect(jotr).toMatchObject({ vehicle: 30, per_person: 15, nonresident_fee_on_page: false, on_nonresident_list: false, parse_ok: true });
  });
  it("marks a page/list disagreement as unverified", () => {
    const odd = withNonresidentList(parseParkFeesPage("jotr", listedPage.replace("Yosemite", "Joshua Tree"), T), list.names);
    expect(odd.parse_ok).toBe(false);
  });
  it("reads pass prices and coverage from the NPS sentences", () => {
    const res = rules.find((r) => r.pass_code === "atb_resident");
    const non = rules.find((r) => r.pass_code === "atb_nonresident");
    expect(res).toMatchObject({ price: 80, covers_nonresident_fee: true, per_person_additional_adults: 3, parse_ok: true });
    expect(non?.price).toBe(250);
  });
});

describe("calculate_fees", () => {
  it("vehicle fee once + nonresident fee per adult", () => {
    const r = run({ visits: [{ park_code: "yose", entry: "vehicle" }], us_resident_adults: 0, nonresident_adults: 2, children_under_16: 1, pass_held: "none" });
    expect(r.total).toBe(235);
  });
  it("no nonresident fee where the park is not listed", () => {
    const r = run({ visits: [{ park_code: "jotr", entry: "vehicle" }], us_resident_adults: 0, nonresident_adults: 3, children_under_16: 0, pass_held: "none" });
    expect(r.total).toBe(30);
    expect(r.text).toMatch(/NO cobra la Tarifa de NO-RESIDENTE/);
  });
  it("on foot: (per person + nonresident fee) × adults; kids free", () => {
    const r = run({ visits: [{ park_code: "yose", entry: "on_foot" }], us_resident_adults: 0, nonresident_adults: 2, children_under_16: 2, pass_held: "none" });
    expect(r.total).toBe(240);
  });
  it("a pass covers everyone in the car, nonresident fees included", () => {
    const r = run({ visits: [{ park_code: "yose", entry: "vehicle" }], us_resident_adults: 1, nonresident_adults: 3, children_under_16: 0, pass_held: "atb_resident" });
    expect(r.total).toBe(0);
  });
  it("on foot a pass covers holder + 3 adults; the fifth pays", () => {
    const r = run({ visits: [{ park_code: "yose", entry: "on_foot" }], us_resident_adults: 0, nonresident_adults: 5, children_under_16: 0, pass_held: "atb_nonresident" });
    expect(r.total).toBe(120);
  });
  it("compares buying a pass against paying at the gate", () => {
    const r = run({ visits: [{ park_code: "yose", entry: "vehicle" }, { park_code: "jotr", entry: "vehicle" }], us_resident_adults: 1, nonresident_adults: 0, children_under_16: 0, pass_held: "none", compare_passes: true });
    expect(r.total).toBe(65);
    expect(r.text).toMatch(/COMPARACIÓN con America the Beautiful \(residente de EE\. UU\.\) \(\$80\)/);
  });
  it("refuses unknown parks and unverified data instead of guessing", () => {
    expect(run({ visits: [{ park_code: "xxxx", entry: "vehicle" }], us_resident_adults: 1, nonresident_adults: 0, children_under_16: 0, pass_held: "none" }).ok).toBe(false);
    expect(typeof parseFeeInput(JSON.stringify({ visits: [{ park_code: "yose", entry: "vehicle" }] }))).toBe("string");
  });
});

describe("reviewFeeInput", () => {
  const base = { visits: [{ park_code: "yose", entry: "vehicle" as const }], us_resident_adults: 0, nonresident_adults: 3, children_under_16: 0, pass_held: "atb_nonresident" as const };
  it("turns 'should we buy the pass?' into a priced comparison", () => {
    const r = reviewFeeInput(base, "Somos tres de Oaxaca, ¿nos sale más barato sacar el pase anual?", { mentionsNonresident: true });
    expect(r).toMatchObject({ pass_held: "none", compare_passes: true });
    const total = computeFees(r as Exclude<typeof r, string>, rows, rules);
    expect(total.total).toBe(335);
    expect(total.text).toMatch(/COMPARACIÓN con America the Beautiful \(no residente\) \(\$250\)/);
  });
  it("keeps a pass the group already has", () => {
    expect(reviewFeeInput(base, "Ya tenemos el pase anual, ¿conviene usarlo?", { mentionsNonresident: true })).toMatchObject({ pass_held: "atb_nonresident" });
  });
  it("asks for a recount when the question mentions nonresidents but none were counted", () => {
    expect(typeof reviewFeeInput({ ...base, us_resident_adults: 3, nonresident_adults: 0, pass_held: "none" }, "Vivimos en Puebla, ¿cuánto pagamos?", { mentionsNonresident: true })).toBe("string");
  });
});

describe("group size check", () => {
  it("reads the stated group size", () => {
    expect(statedGroupSize("Somos seis adultos de Sonora")).toBe(6);
    expect(statedGroupSize("Vamos 3 personas en carro")).toBe(3);
    expect(statedGroupSize("¿Cuánto paga mi tía?")).toBeNull();
  });
  it("asks for a recount when the pass holder was left out", () => {
    const input = { visits: [{ park_code: "yose", entry: "on_foot" as const }], us_resident_adults: 0, nonresident_adults: 5, children_under_16: 0, pass_held: "atb_nonresident" as const };
    expect(typeof reviewFeeInput(input, "Seis adultos que viven en Chiapas entran caminando y uno trae el pase de no residente, ¿cuánto pagan los demás?", { mentionsNonresident: true })).toBe("string");
    expect(reviewFeeInput({ ...input, nonresident_adults: 6 }, "Seis adultos que viven en Chiapas entran caminando y uno trae el pase de no residente, ¿cuánto pagan los demás?", { mentionsNonresident: true })).toMatchObject({ nonresident_adults: 6, pass_held: "atb_nonresident" });
  });
  it("treats 'tengo el America the Beautiful' as a pass already held", () => {
    const input = { visits: [{ park_code: "yose", entry: "vehicle" as const }], us_resident_adults: 1, nonresident_adults: 2, children_under_16: 0, pass_held: "atb_resident" as const };
    expect(reviewFeeInput(input, "Yo tengo el America the Beautiful y mis tíos viven en Oaxaca; ¿tienen que comprar otro pase?", { mentionsNonresident: false })).toMatchObject({ pass_held: "atb_resident" });
  });
});

describe("residency check", () => {
  const input = { visits: [{ park_code: "grca", entry: "on_foot" as const }], us_resident_adults: 2, nonresident_adults: 4, children_under_16: 0, pass_held: "atb_nonresident" as const };
  it("rejects U.S. residents nobody mentioned when the group lives abroad", () => {
    expect(typeof reviewFeeInput(input, "Seis adultos que viven en Zacatecas entran a pie y uno trae el pase de no residente, ¿cuánto pagan?", { mentionsNonresident: false })).toBe("string");
  });
  it("accepts a mixed group", () => {
    expect(reviewFeeInput({ ...input, us_resident_adults: 1, nonresident_adults: 1, pass_held: "none" }, "Mi esposa vive en Tecate y yo en Chula Vista, ¿cuánto pagamos caminando?", { mentionsNonresident: false })).toMatchObject({ us_resident_adults: 1 });
  });
});

describe("pass comparison and dates", () => {
  it("prices an unmentioned pass as a purchase, with its price", () => {
    const input = { visits: [{ park_code: "jotr", entry: "vehicle" as const }, { park_code: "yose", entry: "vehicle" as const }], us_resident_adults: 2, nonresident_adults: 1, children_under_16: 0, pass_held: "park_annual" as const, pass_park_code: "yose" };
    const r = reviewFeeInput(input, "Vivimos en Oxnard y viene una amiga de Puebla en el carro, ¿qué hacemos con los pases?", { mentionsNonresident: true });
    expect(r).toMatchObject({ pass_held: "none", compare_passes: true });
    const out = computeFees(r as Exclude<typeof r, string>, rows, rules);
    expect(out.total).toBe(165);
    expect(out.text).toMatch(/COMPARACIÓN con America the Beautiful \(residente de EE\. UU\.\) \(\$80\): \$80 \+ \$0 en caseta = \$80; sin pase \$165; diferencia \$165 − \$80 = \$85 \(CONVIENE EL PASE\)/);
  });
  it("offers the park's own annual pass when only one park is visited", () => {
    const input = { visits: [{ park_code: "jotr", entry: "vehicle" as const }], us_resident_adults: 1, nonresident_adults: 0, children_under_16: 0, pass_held: "none" as const, compare_passes: true };
    expect(computeFees(input, rows, rules).text).toMatch(/Pase anual de Joshua Tree National Park \(\$55\).*CONVIENE PAGAR EN CASETA/);
  });
  it("finds the next free-entrance day after a date", () => {
    const list = "## 2026 Free Entrance Days\n- March 3 : Day one\n- July 3–5: Long weekend\n- October 27 : Day two\n- November 11: Day three";
    expect(nextFreeDayNote([list], { m: 10, d: 3 })).toMatch(/October 27 : Day two\. El siguiente: November 11: Day three/);
    expect(nextFreeDayNote(["sin lista"], { m: 10, d: 3 })).toBe("");
    expect(statedToday("Hoy es sábado 3 de octubre de 2026, ¿cuándo es gratis?")).toEqual({ m: 10, d: 3 });
  });
});

// Cases from the 2026-10-05 exam failures (B07, E10, F09, F11), on synthetic pages.
describe("exam regressions", () => {
  const grcaPage = listedPage.replace(/Yosemite/g, "Grand Canyon");
  const list3 = parseNonresidentList(passes.replace("Yosemite National Park, and", "Yosemite National Park, Grand Canyon National Park, and"));
  const yose3 = withNonresidentList(parseParkFeesPage("yose", listedPage, T), list3.names);
  const grca3 = withNonresidentList(parseParkFeesPage("grca", grcaPage, T), list3.names);
  const jotr3 = withNonresidentList(parseParkFeesPage("jotr", unlistedPage, T), list3.names);
  const rows3: ParkFeeRow[] = [yose3, grca3, jotr3];
  const review = (o: object, q: string, tripParks: string[] = []) => {
    const parsed = parseFeeInput(JSON.stringify(o));
    if (typeof parsed === "string") throw new Error(parsed);
    return reviewFeeInput(parsed, q, { mentionsNonresident: false, tripParks });
  };

  it("B07: 'cómo se compara con el pase' compares, and only for the whole trip", () => {
    const q = "Un adulto que vive en México, sin pase, entra en su auto a Yosemite y, otro día, en su auto a Grand Canyon. ¿Cuánto paga en las dos entradas, y cómo se compara con el pase de $250?";
    const one = { visits: [{ park_code: "yose", entry: "vehicle" }], us_resident_adults: 0, nonresident_adults: 1, children_under_16: 0, pass_held: "none" };
    expect(review(one, q, ["yose", "grca"])).toMatch(/UNA sola llamada/);
    const both = review({ ...one, visits: [{ park_code: "yose", entry: "vehicle" }, { park_code: "grca", entry: "vehicle" }] }, q, ["yose", "grca"]);
    if (typeof both === "string") throw new Error(both);
    const r = computeFees(both, rows3, rules);
    expect(r.total).toBe(270);
    expect(r.text).toMatch(/America the Beautiful \(no residente\).*\$270 − \$250 = \$20 \(CONVIENE EL PASE\)/);
    expect(r.text).toMatch(/MEJOR OPCIÓN: America the Beautiful \(no residente\) — \$250/);
    expect(r.text).not.toMatch(/Pase anual de/); // a single park's annual pass does not cover a two-park trip
  });

  it("F11: two passes beat the gate, only the cheapest is 'CONVIENE'", () => {
    const q = "Íbamos a hacer solo Joshua Tree, pago por día, porque vivimos en EE. UU. Cambio a mitad del plan: la misma semana también entramos a Yosemite, y en nuestro auto vienen dos tíos que viven en México. ¿Qué ajusto de pases y de dinero?";
    const input = review({ visits: [{ park_code: "jotr", entry: "vehicle" }, { park_code: "yose", entry: "vehicle" }], us_resident_adults: 2, nonresident_adults: 2, children_under_16: 0, pass_held: "none" }, q, ["jotr", "yose"]);
    if (typeof input === "string") throw new Error(input);
    const r = computeFees(input, rows3, rules);
    expect(r.total).toBe(265);
    expect(r.text).toMatch(/residente de EE\. UU\.\) \(\$80\).*\(CONVIENE EL PASE\)/);
    expect(r.text).toMatch(/no residente\) \(\$250\).*pero America the Beautiful \(residente de EE\. UU\.\) sale más barato/);
    expect(r.text).toMatch(/MEJOR OPCIÓN: America the Beautiful \(residente de EE\. UU\.\) — \$80 en total, \$185 menos/);
  });

  it("E10: a lent pass does not cover anyone without its holder", () => {
    const q = "Le presto mi America the Beautiful a mi primo, que vive en México, para que entre a Yosemite sin mí. Así no paga el recargo. ¿Correcto?";
    const input = review({ visits: [{ park_code: "yose", entry: "vehicle" }], us_resident_adults: 0, nonresident_adults: 1, children_under_16: 0, pass_held: "atb_resident" }, q);
    if (typeof input === "string") throw new Error(input);
    expect(input).toMatchObject({ pass_held: "atb_resident", holder_present: false });
    const r = computeFees(input, rows3, rules);
    expect(r.total).toBe(135);
    expect(r.text).toMatch(/no es transferible/);
  });

  it("F09: free day — the U.S. resident enters free; the sister in another car pays entrance + $100", () => {
    const q = "Quiero entrar a Grand Canyon el 27 de octubre porque es día gratis. Yo vivo en EE. UU. y mi hermana, que vive en México, llega ese día en otro auto, sin pase. ¿Los dos entramos gratis?";
    const input = review({
      visits: [
        { park_code: "grca", entry: "vehicle", us_resident_adults: 1, nonresident_adults: 0 },
        { park_code: "grca", entry: "vehicle", us_resident_adults: 0, nonresident_adults: 1 },
      ],
      us_resident_adults: 1, nonresident_adults: 1, children_under_16: 0, pass_held: "none",
    }, q);
    if (typeof input === "string") throw new Error(input);
    expect(input.visits.every((v) => v.fee_free_day)).toBe(true);
    const r = computeFees(input, rows3, rules);
    expect(r.total).toBe(135);
    expect(r.text).toMatch(/solo van personas que viven en EE\. UU\. → entrada gratis ese día \(\$0\)/);
    expect(r.text).toMatch(/desde 2026 solo aplica a quienes viven en EE\. UU\./);
  });

  it("free day on foot: residents $0, nonresidents entrance + $100", () => {
    const r = run({ visits: [{ park_code: "yose", entry: "on_foot", fee_free_day: true }], us_resident_adults: 1, nonresident_adults: 1, children_under_16: 0, pass_held: "none" });
    expect(r.total).toBe(120);
  });

  it("a pass still covers the car on a free day", () => {
    const r = run({ visits: [{ park_code: "yose", entry: "vehicle", fee_free_day: true }], us_resident_adults: 1, nonresident_adults: 2, children_under_16: 0, pass_held: "atb_resident" });
    expect(r.total).toBe(0);
  });

  it("does not flag a free day when the question asks for the date", () => {
    const input = review({ visits: [{ park_code: "yose", entry: "vehicle" }], us_resident_adults: 1, nonresident_adults: 0, children_under_16: 0, pass_held: "none" }, "¿Cuándo es el próximo día gratis y cuánto cuesta entrar otro día?");
    if (typeof input === "string") throw new Error(input);
    expect(input.visits[0].fee_free_day).toBeUndefined();
  });
});
