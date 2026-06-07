// Edit `value` and `lastVerified` here when policy changes — this is the
// ONLY place these facts live. Frank: verify amounts at nps.gov before filling in.

export interface PolicyFact {
  id: string;
  label: string;
  value: string;
  lastVerified: string;
  source: string;
}

export const NOMADERIA_FACTS: PolicyFact[] = [
  {
    id: "nonresident_surcharge",
    label: "Cargo adicional por no residente (parques con timed entry)",
    value: "⚠️ VERIFICAR",
    lastVerified: "PENDIENTE",
    source: "https://www.nps.gov/subjects/fees/",
  },
  {
    id: "atb_pass_resident",
    label: "Precio America the Beautiful — residente EE. UU.",
    value: "⚠️ VERIFICAR",
    lastVerified: "PENDIENTE",
    source: "https://store.usgs.gov/america-the-beautiful-passes",
  },
  {
    id: "atb_pass_nonresident",
    label: "Precio America the Beautiful — no residente",
    value: "⚠️ VERIFICAR",
    lastVerified: "PENDIENTE",
    source: "https://store.usgs.gov/america-the-beautiful-passes",
  },
];
