export const STATE_NAMES: Record<string, string> = {
  AK: "Alaska",
  AR: "Arkansas",
  AS: "Samoa Americana",
  AZ: "Arizona",
  CA: "California",
  CO: "Colorado",
  FL: "Florida",
  HI: "Hawái",
  ID: "Idaho",
  IN: "Indiana",
  KY: "Kentucky",
  ME: "Maine",
  MI: "Míchigan",
  MN: "Minnesota",
  MO: "Misuri",
  MT: "Montana",
  NC: "Carolina del Norte",
  ND: "Dakota del Norte",
  NM: "Nuevo México",
  NV: "Nevada",
  OH: "Ohio",
  OR: "Oregón",
  SC: "Carolina del Sur",
  SD: "Dakota del Sur",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VA: "Virginia",
  VI: "Islas Vírgenes",
  WA: "Washington",
  WV: "Virginia Occidental",
  WY: "Wyoming",
};

export function getRegionCodes(region: string | null): string[] {
  if (!region) return [];
  return region
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function formatRegionDisplay(region: string | null): string {
  const codes = getRegionCodes(region);
  if (codes.length === 0) return "";
  return codes.map((code) => STATE_NAMES[code] ?? code).join(" & ");
}
