import { describe, expect, it } from "vitest";
import {
  computeFees,
  parseFeeInput,
  parseNonresidentList,
  parseParkFeesPage,
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
