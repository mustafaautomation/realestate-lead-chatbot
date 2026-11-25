import { openHandoff } from "@/lib/handoff";
import { validateToolArgs } from "@/lib/tool-schemas";
import { agentById, routeAgent, type Assignment } from "@/lib/agents";
import { estimateHomeValue, formatValuation, type Valuation } from "@/lib/avm";
import { money, uid } from "@/lib/format";
import { listingById, LISTINGS } from "@/lib/listings";
import { neighborhoodByName } from "@/lib/neighborhoods";
import { qualifyLead } from "@/lib/qualify";
import { areaHelp, searchListings } from "@/lib/search";
import { buildSlots, type Slot } from "@/lib/slots";
import type { Citation, Conversation, CrmRecord, Handoff, Lead, Listing, Qualification, SearchFilters, Showing, StoreData, ToolTrace } from "@/lib/types";

export type ToolContext = {
  data: StoreData;
  conversation: Conversation;
  now: Date;
};

export type ToolOutcome = {
  trace: ToolTrace;
  listings?: Listing[];
  valuation?: Valuation;
  qualification?: Qualification;
  assignment?: Assignment;
  showing?: Showing;
  crm?: CrmRecord;
  slots?: Slot[];
  kb?: Citation[];
  handoff?: Handoff;
};

export function executeTool(name: string, args: Record<string, unknown>, ctx: ToolContext): ToolOutcome {
  const parsed = validateToolArgs(name, args);
  if (!parsed.ok) return { trace: { name, args, summary: parsed.error } };
  args = parsed.data;
  switch (name) {
    case "search_listings":
      return searchTool(args, ctx);
    case "get_listing_details":
      return detailsTool(args);
    case "qualify_lead":
      return qualifyTool(ctx);
    case "estimate_home_value":
      return valueTool(args);
    case "schedule_showing":
      return scheduleTool(args, ctx);
    case "assign_agent":
      return assignTool(args, ctx);
    case "create_crm_lead":
      return crmTool(args, ctx);
    case "nurture_opt_in":
      return nurtureTool(args, ctx);
    case "request_human":
      return humanTool(args, ctx);
    default:
      return { trace: { name, args, summary: "Unknown tool." } };
  }
}

function searchTool(args: Record<string, unknown>, ctx: ToolContext): ToolOutcome {
  const filters: SearchFilters = {};
  const budget = numberArg(args.budget) ?? ctx.conversation.fields.budget;
  const beds = numberArg(args.beds) ?? ctx.conversation.fields.beds;
  const area = stringArg(args.area) ?? ctx.conversation.fields.area;
  const type = stringArg(args.type);
  if (budget) filters.budget = budget;
  if (beds) filters.beds = beds;
  if (type === "house" || type === "condo" || type === "townhome") filters.type = type;
  else if (ctx.conversation.fields.propertyType) filters.type = ctx.conversation.fields.propertyType;
  if (area) {
    const known = neighborhoodByName(area);
    if (!known) {
      return {
        trace: {
          name: "search_listings",
          args: { ...filters, area },
          summary: `No area named "${area}" is in the catalog. Known areas: ${areaHelp()}.`,
        },
        listings: [],
      };
    }
    filters.area = known.name;
  }
  const listings = searchListings(filters);
  ctx.conversation.lastListingIds = listings.map((listing) => listing.id);
  const summary =
    listings.length === 0
      ? "No listings matched those filters."
      : `${listings.length} listing${listings.length === 1 ? "" : "s"} matched.`;
  return { trace: { name: "search_listings", args: { ...filters }, summary }, listings };
}

function detailsTool(args: Record<string, unknown>): ToolOutcome {
  const listing = listingById(stringArg(args.listingId));
  if (!listing) {
    return { trace: { name: "get_listing_details", args, summary: "That listing id is not in the catalog." } };
  }
  return {
    trace: {
      name: "get_listing_details",
      args: { listingId: listing.id },
      summary: `${listing.id} ${listing.address}, ${money(listing.price)}, ${listing.beds} bd, ${listing.baths} ba, ${listing.sqft} sqft.`,
    },
    listings: [listing],
  };
}

function qualifyTool(ctx: ToolContext): ToolOutcome {
  const qualification = qualifyLead(ctx.conversation.fields);
  const now = ctx.now.toISOString();
  let lead = ctx.data.leads.find((item) => item.conversationId === ctx.conversation.id);
  if (!lead) {
    lead = {
      id: uid("lead"),
      conversationId: ctx.conversation.id,
      fields: { ...ctx.conversation.fields },
      score: qualification.score,
      tier: qualification.tier,
      reasons: qualification.reasons,
      missing: qualification.missing,
      createdAt: now,
      updatedAt: now,
    };
    ctx.data.leads.push(lead);
    ctx.conversation.leadId = lead.id;
  } else {
    lead.fields = { ...ctx.conversation.fields };
    lead.score = qualification.score;
    lead.tier = qualification.tier;
    lead.reasons = qualification.reasons;
    lead.missing = qualification.missing;
    lead.updatedAt = now;
  }
  ctx.conversation.scored = true;
  return {
    trace: {
      name: "qualify_lead",
      args: {
        role: ctx.conversation.fields.role,
        budget: ctx.conversation.fields.budget ?? null,
        preApproval: ctx.conversation.fields.preApproval,
        timeline: ctx.conversation.fields.timeline,
        motivation: ctx.conversation.fields.motivation ?? null,
      },
      summary: `Score ${qualification.score}, tier ${qualification.tier}.`,
    },
    qualification,
  };
}

function valueTool(args: Record<string, unknown>): ToolOutcome {
  const address = stringArg(args.address);
  const beds = numberArg(args.beds);
  const sqft = numberArg(args.sqft);
  if (!address || !beds || !sqft) {
    return {
      trace: {
        name: "estimate_home_value",
        args,
        summary: "Need an address, bedroom count, and square feet before the mock AVM can run.",
      },
    };
  }
  const valuation = estimateHomeValue({ address, beds, sqft });
  return {
    trace: { name: "estimate_home_value", args: { address, beds, sqft }, summary: formatValuation(valuation) },
    valuation,
  };
}

function scheduleTool(args: Record<string, unknown>, ctx: ToolContext): ToolOutcome {
  const listing = listingById(stringArg(args.listingId)) ?? listingById(ctx.conversation.preferredListingId) ?? listingById(ctx.conversation.lastListingIds[0]);
  const slots = buildSlots(ctx.now);
  const slot = slots.find((item) => item.id === stringArg(args.slotId)) ?? slots.find((item) => item.label === stringArg(args.slotLabel));
  const name = stringArg(args.name) ?? ctx.conversation.fields.name;
  const email = stringArg(args.email) ?? ctx.conversation.fields.email;
  const phone = stringArg(args.phone) ?? ctx.conversation.fields.phone;
  if (!listing || !slot) {
    return {
      trace: {
        name: "schedule_showing",
        args,
        summary: "Need a catalog listing and one of the open slots.",
      },
      slots,
    };
  }
  if (!name || !email) {
    return {
      trace: {
        name: "schedule_showing",
        args: { listingId: listing.id, slotId: slot.id },
        summary: "Need a name and email before the showing can be booked.",
      },
      listings: [listing],
      slots: [slot],
    };
  }
  const same = ctx.data.showings.find((item) => item.listingId === listing.id && item.slotId === slot.id && item.conversationId === ctx.conversation.id);
  if (same) {
    return { trace: { name: "schedule_showing", args: { listingId: listing.id, slotId: slot.id }, summary: `Already booked ${slot.label}.` }, showing: same, listings: [listing] };
  }
  const conflict = ctx.data.showings.find((item) => item.listingId === listing.id && item.slotId === slot.id);
  if (conflict) {
    return {
      trace: { name: "schedule_showing", args: { listingId: listing.id, slotId: slot.id }, summary: `${slot.label} is already taken for ${listing.address}.` },
      listings: [listing],
      slots,
    };
  }
  const lead = ctx.data.leads.find((item) => item.id === ctx.conversation.leadId);
  const showing: Showing = {
    id: uid("show"),
    listingId: listing.id,
    slotId: slot.id,
    slotLabel: slot.label,
    startsAt: slot.startsAt,
    leadId: lead?.id ?? "unscored",
    conversationId: ctx.conversation.id,
    agentId: lead?.agentId ?? "maya-ellison",
    name,
    email,
    phone,
    status: "booked",
  };
  ctx.data.showings.push(showing);
  return {
    trace: {
      name: "schedule_showing",
      args: { listingId: listing.id, slotId: slot.id, name, email },
      summary: `Booked ${listing.address} for ${slot.label}.`,
    },
    showing,
    listings: [listing],
  };
}

function assignTool(args: Record<string, unknown>, ctx: ToolContext): ToolOutcome {
  const lead = ctx.data.leads.find((item) => item.id === ctx.conversation.leadId);
  const tier = lead?.tier ?? "cold";
  const area = stringArg(args.area) ?? ctx.conversation.fields.area;
  const valuation = Boolean(args.valuation);
  const assignment = routeAgent({
    area,
    role: ctx.conversation.fields.role,
    tier,
    valuation,
  });
  if (lead) {
    lead.agentId = assignment.agent.id;
    lead.updatedAt = ctx.now.toISOString();
  }
  return {
    trace: {
      name: "assign_agent",
      args: { area: area ?? null, tier, agentId: assignment.agent.id },
      summary: assignment.note,
    },
    assignment,
  };
}

function crmTool(args: Record<string, unknown>, ctx: ToolContext): ToolOutcome {
  const lead = ctx.data.leads.find((item) => item.id === ctx.conversation.leadId);
  if (!lead) {
    return { trace: { name: "create_crm_lead", args, summary: "Qualify the lead before opening a CRM record." } };
  }
  const note = buildNotes(lead, stringArg(args.note));
  const now = ctx.now.toISOString();
  let record = ctx.data.crm.find((item) => item.conversationId === ctx.conversation.id);
  if (!record) {
    record = {
      id: `CRM-${1000 + ctx.data.crm.length + 1}`,
      leadId: lead.id,
      conversationId: ctx.conversation.id,
      name: lead.fields.name,
      email: lead.fields.email,
      phone: lead.fields.phone,
      tier: lead.tier,
      score: lead.score,
      notes: note,
      createdAt: now,
      updatedAt: now,
    };
    ctx.data.crm.push(record);
    lead.crmId = record.id;
  } else {
    record.name = lead.fields.name;
    record.email = lead.fields.email;
    record.phone = lead.fields.phone;
    record.tier = lead.tier;
    record.score = lead.score;
    record.notes = note;
    record.updatedAt = now;
  }
  return {
    trace: { name: "create_crm_lead", args: { crmId: record.id }, summary: `${record.id} updated. ${note}` },
    crm: record,
  };
}

function humanTool(args: Record<string, unknown>, ctx: ToolContext): ToolOutcome {
  const reason = stringArg(args.reason);
  const allowed = reason === "request" || reason === "frustration" || reason === "low_confidence" || reason === "sensitive" ? reason : "request";
  const ticket = openHandoff(ctx.data, ctx.conversation, allowed, ctx.now);
  ctx.conversation.botPaused = true;
  return {
    trace: { name: "request_human", args: { reason: allowed }, summary: `Opened ${ticket.id} (${allowed}).` },
    handoff: ticket,
  };
}

function nurtureTool(args: Record<string, unknown>, ctx: ToolContext): ToolOutcome {
  const email = (stringArg(args.email) ?? ctx.conversation.fields.email)?.toLowerCase();
  if (!email) {
    return { trace: { name: "nurture_opt_in", args, summary: "Need an email before the nurture list can take the opt-in." } };
  }
  const existing = ctx.data.nurture.find((item) => item.email === email && item.conversationId === ctx.conversation.id);
  if (existing) {
    return { trace: { name: "nurture_opt_in", args: { email }, summary: `${email} is already on the nurture list.` } };
  }
  ctx.data.nurture.push({
    id: uid("nurture"),
    email,
    conversationId: ctx.conversation.id,
    topics: Array.isArray(args.topics) ? args.topics.map(String) : ["listings"],
    createdAt: ctx.now.toISOString(),
  });
  ctx.conversation.fields.nurture = true;
  return { trace: { name: "nurture_opt_in", args: { email }, summary: `${email} opted in for listing notes. Nothing is actually emailed.` } };
}

export function buildNotes(lead: Lead, extra?: string): string {
  const fields = lead.fields;
  const agent = agentById(lead.agentId);
  const parts = [
    `Role: ${fields.role}`,
    fields.area ? `Area: ${fields.area}` : "",
    fields.beds ? `Beds: ${fields.beds}` : "",
    fields.budget ? `Budget: ${fields.budget}` : "",
    fields.address ? `Address: ${fields.address}` : "",
    `Pre-approval: ${fields.preApproval}`,
    `Timeline: ${fields.timeline}`,
    fields.motivation ? `Motivation: ${fields.motivation}` : "",
    `Score ${lead.score} (${lead.tier})`,
    agent ? `Agent: ${agent.name}` : "",
    extra ?? "",
  ].filter(Boolean);
  return parts.join(". ");
}

export function catalogListing(id: string | undefined): Listing | undefined {
  return listingById(id);
}

export function allListings(): Listing[] {
  return LISTINGS;
}

function stringArg(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberArg(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}
