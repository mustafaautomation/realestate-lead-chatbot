import { money } from "@/lib/format";
import { matchNeighborhood, neighborhoodByName } from "@/lib/neighborhoods";

export type Valuation = {
  address: string;
  neighborhood: string;
  usedFallback: boolean;
  ppsqft: number;
  beds: number;
  sqft: number;
  low: number;
  mid: number;
  high: number;
  disclaimer: string;
};

const DISCLAIMER =
  "Mock AVM for this demo. It is not an appraisal and not a promise of sale price. A listing consult with Elena Voss is how a seller gets a number that looks at condition.";

export function estimateHomeValue(input: { address: string; beds: number; sqft: number }): Valuation {
  const named = neighborhoodByName(matchNeighborhood(input.address) ?? "") ?? null;
  const neighborhood = named?.name ?? "Denver";
  const ppsqft = named?.ppsqft ?? 400;
  const bedFactor = input.beds >= 4 ? 1.03 : input.beds <= 2 ? 0.98 : 1;
  const mid = Math.round((input.sqft * ppsqft * bedFactor) / 1000) * 1000;
  const low = Math.round((mid * 0.92) / 1000) * 1000;
  const high = Math.round((mid * 1.08) / 1000) * 1000;
  return {
    address: input.address,
    neighborhood,
    usedFallback: !named,
    ppsqft,
    beds: input.beds,
    sqft: input.sqft,
    low,
    mid,
    high,
    disclaimer: DISCLAIMER,
  };
}

export function formatValuation(value: Valuation): string {
  const basis = value.usedFallback
    ? `No known neighborhood was in the address, so the formula used the Denver fallback of ${money(value.ppsqft)} per foot.`
    : `${value.neighborhood} is on the card at ${money(value.ppsqft)} per foot.`;
  return `${value.address}: ${money(value.low)} to ${money(value.high)}, midpoint ${money(value.mid)}. ${basis} ${value.disclaimer}`;
}
