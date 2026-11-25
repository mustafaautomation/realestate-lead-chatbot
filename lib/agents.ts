import type { Role, Tier } from "@/lib/types";

export type Agent = {
  id: string;
  name: string;
  email: string;
  phone: string;
  areas: string[];
  focus: "buyer" | "seller";
  title: string;
  blurb: string;
};

export const AGENTS: Agent[] = [
  {
    id: "maya-ellison",
    name: "Maya Ellison",
    email: "maya.ellison@summitridge.example",
    phone: "303-555-0101",
    areas: ["Highlands", "LoHi", "Berkeley", "Sloan's Lake"],
    focus: "buyer",
    title: "Buyer specialist, northwest Denver",
    blurb: "Maya works with buyers in the Highlands, LoHi, Berkeley, and Sloan's Lake. Twelve years on the northwest side. She tours first and talks compensation in writing before the first showing.",
  },
  {
    id: "jordan-hale",
    name: "Jordan Hale",
    email: "jordan.hale@summitridge.example",
    phone: "303-555-0102",
    areas: ["Wash Park", "Platt Park", "Baker", "City Park"],
    focus: "buyer",
    title: "Buyer specialist, south and east of downtown",
    blurb: "Jordan covers Wash Park, Platt Park, Baker, and City Park. Known for bungalow condition notes and a written list of what a house still needs before offer day.",
  },
  {
    id: "priya-shah",
    name: "Priya Shah",
    email: "priya.shah@summitridge.example",
    phone: "303-555-0103",
    areas: ["Cherry Creek", "Hilltop", "Congress Park"],
    focus: "buyer",
    title: "Buyer specialist, Cherry Creek and Hilltop",
    blurb: "Priya works Cherry Creek, Hilltop, and Congress Park. She prices against recent solds in the same block, not against the asking price next door.",
  },
  {
    id: "andre-brooks",
    name: "Andre Brooks",
    email: "andre.brooks@summitridge.example",
    phone: "303-555-0104",
    areas: ["RiNo", "Five Points", "Capitol Hill", "Central Park", "Park Hill"],
    focus: "buyer",
    title: "Buyer specialist, central and northeast Denver",
    blurb: "Andre covers RiNo, Five Points, Capitol Hill, Park Hill, and Central Park. He flags HOA rental rules before a client falls in love with a condo.",
  },
  {
    id: "sam-okada",
    name: "Sam Okada",
    email: "sam.okada@summitridge.example",
    phone: "303-555-0106",
    areas: ["Golden", "Arvada", "Lakewood", "Wheat Ridge"],
    focus: "buyer",
    title: "Buyer specialist, west metro",
    blurb: "Sam works Golden, Arvada, Lakewood, and Wheat Ridge. Useful when a Denver budget buys a yard ten minutes west.",
  },
  {
    id: "elena-voss",
    name: "Elena Voss",
    email: "elena.voss@summitridge.example",
    phone: "303-555-0105",
    areas: [],
    focus: "seller",
    title: "Listing specialist",
    blurb: "Elena runs listing appointments across the Summit Ridge map. She prepares a net sheet from the published fee schedule and a mock valuation, then a seller decides whether to list.",
  },
];

export type Assignment = {
  agent: Agent;
  priority: "call_today" | "follow_up" | "nurture" | "listing_consult";
  note: string;
};

export function agentById(id: string | undefined): Agent | undefined {
  return AGENTS.find((agent) => agent.id === id);
}

export function routeAgent(input: { area?: string; role: Role; tier: Tier; valuation: boolean }): Assignment {
  const sellerLead = input.valuation || input.role === "seller";
  if (sellerLead) {
    const elena = AGENTS.find((agent) => agent.id === "elena-voss")!;
    const areaAgent = input.area ? AGENTS.find((agent) => agent.areas.includes(input.area!)) : undefined;
    const note = areaAgent
      ? `${elena.name} takes the listing consult. ${areaAgent.name} stays on the file for the ${input.area} side.`
      : `${elena.name} takes the listing consult.`;
    return { agent: elena, priority: input.tier === "cold" ? "nurture" : "listing_consult", note };
  }

  const area = input.area;
  const areaAgent = area ? AGENTS.find((agent) => agent.areas.includes(area)) : undefined;
  const agent = areaAgent ?? AGENTS.find((item) => item.id === "maya-ellison")!;
  const priority = input.tier === "hot" ? "call_today" : input.tier === "warm" ? "follow_up" : "nurture";
  const where = input.area ? input.area : "the Denver desk";
  const note =
    priority === "call_today"
      ? `${agent.name} covers ${where} and should call today.`
      : priority === "follow_up"
        ? `${agent.name} covers ${where}. Follow up this week.`
        : `${agent.name} is on the file for ${where}. Nurture until the timeline firms up.`;
  return { agent, priority, note };
}
