import { matchNeighborhood } from "@/lib/neighborhoods";
import type { LeadFields, PreApproval, PropertyType, Role, Timeline } from "@/lib/types";

const NAME_STOP = new Set(
  "pre pre-approved preapproved approved looking relocating interested trying a the just not already ready selling buying searching currently still very also really".split(
    " ",
  ),
);

export function extractSignals(text: string, prior: LeadFields): LeadFields {
  const next: LeadFields = { ...prior };
  const lower = text.toLowerCase();

  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (email) next.email = email[0].toLowerCase();

  const phone = text.match(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/);
  if (phone) next.phone = phone[0];

  const sqft = text.match(/(\d{3,5})\s*(?:sq\.?\s*ft|sqft|square feet)/i);
  if (sqft) next.sqft = Number(sqft[1]);

  const beds = text.match(/(\d+)\s*[- ]?\s*(?:bed|br|bedroom)/i);
  if (beds) next.beds = Number(beds[1]);

  const area = matchNeighborhood(text);
  if (area) next.area = area;

  const type = propertyType(lower);
  if (type) next.propertyType = type;

  const budget = parseBudget(text);
  if (budget) next.budget = budget;
  if (/\b(?:no budget|don't have a budget|do not have a budget|not sure (?:of|about) (?:my )?budget)\b/i.test(text)) {
    next.budget = undefined;
  }

  const pre = parsePreApproval(lower);
  if (pre) next.preApproval = pre;

  const timeline = parseTimeline(lower);
  if (timeline) next.timeline = timeline;

  const motivation = parseMotivation(lower);
  if (motivation) next.motivation = motivation;

  const role = parseRole(lower, next.role);
  if (role) next.role = role;

  const address = parseAddress(text);
  if (address) next.address = address;

  const name = parseName(text);
  if (name) next.name = name;

  if (/\b(email me|email new|keep me posted|nurture|opt[- ]in|send me|newsletter)\b/i.test(text)) next.nurture = true;

  return next;
}

function parseBudget(text: string): number | undefined {
  const patterns = [
    /(?:under|below|max(?:imum)?|budget(?:\s+of|\s+is)?|around|up to|less than|at)\s*\$?\s*(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s*(k|m|million)?/gi,
    /\$\s*(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s*(k|m|million)?/gi,
    /\b(\d+(?:\.\d+)?)\s*(k|m|million)\b/gi,
  ];
  let best: number | undefined;
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const amount = scaleMoney(match[1], match[2]);
      if (amount >= 50000) best = amount;
    }
  }
  return best;
}

function scaleMoney(raw: string, unit: string | undefined): number {
  const base = Number(raw.replace(/,/g, ""));
  const mark = (unit ?? "").toLowerCase();
  if (mark === "k") return Math.round(base * 1000);
  if (mark === "m" || mark === "million") return Math.round(base * 1000000);
  return Math.round(base);
}

function parsePreApproval(lower: string): PreApproval | undefined {
  if (/\b(not pre-?approved|no pre-?approval|haven't been pre-?approved|have not been pre-?approved|without pre-?approval)\b/.test(lower)) {
    return "none";
  }
  if (/\b(pre-?approval (is )?in process|working on (a )?pre-?approval|getting pre-?approved|pre-?approval pending)\b/.test(lower)) {
    return "in_process";
  }
  if (/\b(paying cash|cash buyer|all cash)\b/.test(lower)) return "cash";
  if (/\b(pre-?approved|already approved)\b/.test(lower)) return "approved";
  return undefined;
}

function parseTimeline(lower: string): Timeline | undefined {
  if (/\b(just looking|just browsing|browsing|no rush|someday|not sure when)\b/.test(lower)) return "browsing";
  if (/\b(6 months|six months|half a year|next year)\b/.test(lower)) return "6_months";
  if (/\b(90 days|3 months?|three months|2 months?|two months|couple of months|a few months)\b/.test(lower)) return "90_days";
  if (/\b(30 days|this month|asap|as soon as possible|immediately|right away|within a month|within 30 days|4 weeks|four weeks)\b/.test(lower)) {
    return "30_days";
  }
  return undefined;
}

function parseMotivation(lower: string): string | undefined {
  if (/\b(relocat\w*|new job|job transfer|for work)\b/.test(lower)) return "Relocating for work";
  if (/\b(first[- ]time|first home)\b/.test(lower)) return "First-time buyer";
  if (/\bdownsiz\w*/.test(lower)) return "Downsizing";
  if (/\b(investment|rental property)\b/.test(lower)) return "Investment";
  if (/\b(growing family|expecting|new baby)\b/.test(lower)) return "Growing family";
  if (/\bmore space\b/.test(lower)) return "Needs more space";
  return undefined;
}

function parseRole(lower: string, prior: Role): Role | undefined {
  const selling = /\b(sell my|selling my|list my|i want to sell|we're selling|we are selling)\b/.test(lower);
  const buying =
    /\b(looking for|buy a|buying|home search|show me|homes? for)\b/.test(lower) ||
    /\b(beds?|bedrooms?|condos?|townhomes?|townhouses?|houses?)\b/.test(lower);
  if (selling && buying) return "both";
  if (selling) return "seller";
  if (buying && prior !== "seller") return "buyer";
  return undefined;
}

function propertyType(lower: string): PropertyType | undefined {
  if (/\btown(?:home|house)s?\b/.test(lower)) return "townhome";
  if (/\bcondos?\b/.test(lower)) return "condo";
  if (/\b(single[- ]family|houses|a house)\b/.test(lower)) return "house";
  return undefined;
}

function parseAddress(text: string): string | undefined {
  const match = text.match(
    /\b(\d{3,5}\s+[A-Za-z0-9][A-Za-z0-9.' ]{1,40}?(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Court|Ct|Place|Pl|Way|Lane|Ln)\.?)\b/,
  );
  return match?.[1]?.replace(/\s+/g, " ").trim();
}

function parseName(text: string): string | undefined {
  const match = text.match(/\b(?:my name is|i'm|i am|this is)\s+([A-Za-z]+(?:\s+[A-Za-z]+){1,2})/i);
  if (!match) return undefined;
  const words = match[1].split(/\s+/);
  if (NAME_STOP.has(words[0].toLowerCase())) return undefined;
  if (words.length < 2) return undefined;
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
}
