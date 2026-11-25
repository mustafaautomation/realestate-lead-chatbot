export type Neighborhood = {
  name: string;
  city: string;
  zip: string;
  ppsqft: number;
  tint: string;
  aliases: string[];
};

export const NEIGHBORHOODS: Neighborhood[] = [
  { name: "Highlands", city: "Denver", zip: "80211", ppsqft: 475, tint: "#2F4A3C", aliases: ["highlands", "the highlands", "highland"] },
  { name: "LoHi", city: "Denver", zip: "80211", ppsqft: 520, tint: "#3E4638", aliases: ["lohi", "lo hi", "lower highlands", "lower highland"] },
  { name: "Berkeley", city: "Denver", zip: "80212", ppsqft: 410, tint: "#3A4E55", aliases: ["berkeley"] },
  { name: "Sloan's Lake", city: "Denver", zip: "80212", ppsqft: 455, tint: "#35515A", aliases: ["sloan's lake", "sloans lake", "sloans", "sloan lake"] },
  { name: "RiNo", city: "Denver", zip: "80205", ppsqft: 490, tint: "#5A4034", aliases: ["rino", "ri no", "river north"] },
  { name: "Five Points", city: "Denver", zip: "80205", ppsqft: 405, tint: "#4A3B32", aliases: ["five points", "fivepoints"] },
  { name: "Capitol Hill", city: "Denver", zip: "80203", ppsqft: 390, tint: "#4C3D48", aliases: ["capitol hill", "cap hill"] },
  { name: "Congress Park", city: "Denver", zip: "80206", ppsqft: 420, tint: "#3E4A3A", aliases: ["congress park"] },
  { name: "City Park", city: "Denver", zip: "80205", ppsqft: 430, tint: "#2E4A40", aliases: ["city park"] },
  { name: "Wash Park", city: "Denver", zip: "80209", ppsqft: 575, tint: "#2C4A38", aliases: ["wash park", "washington park"] },
  { name: "Platt Park", city: "Denver", zip: "80210", ppsqft: 480, tint: "#3F4A32", aliases: ["platt park", "platt"] },
  { name: "Baker", city: "Denver", zip: "80223", ppsqft: 445, tint: "#4A4036", aliases: ["baker"] },
  { name: "Cherry Creek", city: "Denver", zip: "80206", ppsqft: 640, tint: "#4A3540", aliases: ["cherry creek"] },
  { name: "Hilltop", city: "Denver", zip: "80206", ppsqft: 610, tint: "#3D4550", aliases: ["hilltop"] },
  { name: "Park Hill", city: "Denver", zip: "80207", ppsqft: 400, tint: "#3A4A38", aliases: ["park hill"] },
  { name: "Central Park", city: "Denver", zip: "80238", ppsqft: 370, tint: "#3E5148", aliases: ["central park", "stapleton"] },
  { name: "Golden", city: "Golden", zip: "80401", ppsqft: 415, tint: "#5A4A32", aliases: ["golden"] },
  { name: "Arvada", city: "Arvada", zip: "80002", ppsqft: 325, tint: "#3A4E46", aliases: ["arvada"] },
  { name: "Lakewood", city: "Lakewood", zip: "80226", ppsqft: 335, tint: "#355048", aliases: ["lakewood"] },
  { name: "Wheat Ridge", city: "Wheat Ridge", zip: "80033", ppsqft: 315, tint: "#4A4634", aliases: ["wheat ridge", "wheatridge"] },
];

const ALIAS_ORDER = NEIGHBORHOODS.flatMap((n) => n.aliases.map((alias) => ({ alias, name: n.name }))).sort(
  (a, b) => b.alias.length - a.alias.length,
);

export function neighborhoodByName(name: string | undefined): Neighborhood | undefined {
  if (!name) return undefined;
  return NEIGHBORHOODS.find((n) => n.name.toLowerCase() === name.toLowerCase());
}

export function matchNeighborhood(text: string): string | undefined {
  const hay = ` ${text.toLowerCase()} `;
  for (const entry of ALIAS_ORDER) {
    const needle = entry.alias.toLowerCase();
    if (hay.includes(needle)) {
      const index = hay.indexOf(needle);
      const before = hay[index - 1] ?? " ";
      const after = hay[index + needle.length] ?? " ";
      if (!/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after)) return entry.name;
    }
  }
  return undefined;
}

export function knownNeighborhoodNames(): string[] {
  return NEIGHBORHOODS.map((n) => n.name);
}
