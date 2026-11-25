import { money, uid } from "@/lib/format";
import { enforceOutput, HANDOFF_REPLY, LOW_CONFIDENCE_REPLY, screenMessage, SCHOOL_DISCLAIMER } from "@/lib/guardrails";
import { listingById } from "@/lib/listings";
import { maskPii, maskValue } from "@/lib/pii";
import { retrieve } from "@/lib/rag";
import { buildSlots, matchSlot, type Slot } from "@/lib/slots";
import { executeTool, type ToolOutcome } from "@/lib/tools";
import { emptyFields, type ChatMessage, type Conversation, type LeadFields, type Listing, type StoreData } from "@/lib/types";
import { extractSignals } from "@/lib/extract";

export type TurnView = {
  conversationId: string;
  message: ChatMessage;
  fields: LeadFields;
  provider: "mock" | "groq" | "gemini";
  fallback?: boolean;
};

const KB_INTENT =
  /^(what|how|when|who|why|tell me|explain|do you|does|can you|what's|whats)\b/i;
const KB_TOPIC =
  /\b(commission|fee|fees|charge|open house|pre-approval|preapproval|pre-qualification|mortgage|financing|valuation|avm|appraisal|buying process|selling process|fair housing|who covers|which agent|agent)\b/i;
const HOME_INTENT =
  /\b(homes?|houses?|listings?|condos?|townhomes?|townhouses?|properties|show me|looking for|search|under)\b/i;
const VALUE_INTENT = /\b(worth|valuation|avm|estimate the value|what would .+ sell|home value)\b/i;
const BOOK_INTENT = /\b(book|schedule|lock in|reserve)\b/i;
const DETAIL_INTENT = /\b(details|tell me more|more about)\b/i;
const NURTURE_INTENT = /\b(email me|email new|keep me posted|nurture|opt[- ]in|send me|newsletter)\b/i;
const HUMAN_REQUEST = /\b(talk to (?:a )?(?:human|person|agent)|real person|operator|hand(?: me)? off|handoff)\b/i;
const FRUSTRATION = /\b(useless|terrible|worst bot|so frustrated|this sucks|waste of time|idiot bot)\b/i;

export function runTurn(data: StoreData, text: string, conversationId: string | null, now: Date): TurnView {
  const prepared = prepareTurn(data, text, conversationId, now);
  if (prepared.kind === "refuse") return prepared.view;
  return completeTurn(data, prepared.conversation, text, now, "mock");
}

export function completeTurn(
  data: StoreData,
  conversation: Conversation,
  text: string,
  now: Date,
  provider: "mock" | "groq" | "gemini",
  fallback = false,
): TurnView {
  const outcomes = runPolicy(data, conversation, text, now);
  const message = compose(data, conversation, text, outcomes, now);
  for (const trace of message.toolCalls ?? []) {
    data.audit.push({ id: uid("log"), at: now.toISOString(), kind: trace.name, detail: trace.summary });
  }
  conversation.messages.push(message);
  conversation.updatedAt = now.toISOString();
  return { conversationId: conversation.id, message, fields: conversation.fields, provider, fallback };
}

export function prepareTurn(
  data: StoreData,
  text: string,
  conversationId: string | null,
  now: Date,
): { kind: "refuse"; view: TurnView } | { kind: "ready"; conversation: Conversation } {
  const message = text.trim();
  const nowIso = now.toISOString();
  let conversation = conversationId ? data.conversations.find((item) => item.id === conversationId) : undefined;
  if (!conversation) {
    conversation = {
      id: uid("conv"),
      createdAt: nowIso,
      updatedAt: nowIso,
      title: message.slice(0, 80) || "New conversation",
      messages: [],
      fields: emptyFields(),
      qualifying: false,
      scored: false,
      lastListingIds: [],
    };
    data.conversations.unshift(conversation);
  }
  conversation.messages.push({
    id: uid("msg"),
    role: "user",
    content: message,
    createdAt: nowIso,
  });
  conversation.updatedAt = nowIso;

  const guard = screenMessage(message);
  if (guard.action === "refuse") {
    if (guard.category === "steering" || guard.category === "school_proxy") {
      executeTool("request_human", { reason: "sensitive" }, { data, conversation, now });
    }
    const reply: ChatMessage = {
      id: uid("msg"),
      role: "assistant",
      content: guard.reply,
      createdAt: nowIso,
      guardrail: { blocked: true, category: guard.category },
      suggestions: ["I'm looking for a 3 bed under 650k in Highlands"],
    };
    conversation.messages.push(reply);
    return {
      kind: "refuse",
      view: { conversationId: conversation.id, message: reply, fields: conversation.fields, provider: "mock" },
    };
  }

  conversation.fields = extractSignals(message, conversation.fields);
  if (conversation.fields.role === "unknown" && VALUE_INTENT.test(message)) conversation.fields.role = "seller";
  return { kind: "ready", conversation };
}

function runPolicy(data: StoreData, conversation: Conversation, text: string, now: Date): ToolOutcome[] {
  const outcomes: ToolOutcome[] = [];
  const ctx = { data, conversation, now };
  if (HUMAN_REQUEST.test(text)) {
    outcomes.push(executeTool("request_human", { reason: "request" }, ctx));
    return outcomes;
  }
  if (FRUSTRATION.test(text)) {
    outcomes.push(executeTool("request_human", { reason: "frustration" }, ctx));
    return outcomes;
  }

  const listing = mentionedListing(text, conversation);
  if (listing) conversation.preferredListingId = listing.id;

  const kb = KB_INTENT.test(text.trim()) || KB_TOPIC.test(text) || (Boolean(conversation.fields.area) && /\btell me about\b/i.test(text));
  const homes = HOME_INTENT.test(text) && (Boolean(conversation.fields.beds) || Boolean(conversation.fields.budget) || Boolean(conversation.fields.area) || Boolean(conversation.fields.propertyType));
  const wantsValue = VALUE_INTENT.test(text);
  const wantsBook = BOOK_INTENT.test(text);
  const wantsDetails = DETAIL_INTENT.test(text) || /\bSR-\d{4}\b/i.test(text);
  const gaveAnswer = bantInMessage(text);

  if (wantsDetails && listing) {
    outcomes.push(executeTool("get_listing_details", { listingId: listing.id }, ctx));
  }

  if (homes && !wantsValue) {
    outcomes.push(
      executeTool(
        "search_listings",
        {
          budget: conversation.fields.budget,
          beds: conversation.fields.beds,
          area: conversation.fields.area,
          type: conversation.fields.propertyType,
        },
        ctx,
      ),
    );
    if (!conversation.scored) conversation.qualifying = true;
  }

  if (wantsValue) {
    outcomes.push(
      executeTool(
        "estimate_home_value",
        {
          address: [conversation.fields.address, conversation.fields.area].filter(Boolean).join(", "),
          beds: conversation.fields.beds,
          sqft: conversation.fields.sqft,
        },
        ctx,
      ),
    );
  }

  const readyToScore = !conversation.scored && (gaveAnswer || (conversation.fields.role === "seller" && Boolean(conversation.fields.address) && conversation.fields.timeline !== "unknown"));
  if (readyToScore) {
    outcomes.push(executeTool("qualify_lead", {}, ctx));
    const lead = data.leads.find((item) => item.id === conversation.leadId);
    outcomes.push(
      executeTool(
        "assign_agent",
        { area: conversation.fields.area, valuation: conversation.fields.role === "seller" || wantsValue },
        ctx,
      ),
    );
    outcomes.push(executeTool("create_crm_lead", { note: lead ? `Opened from chat. Tier ${lead.tier}.` : "" }, ctx));
  }

  if (wantsBook) {
    const slots = buildSlots(now);
    const slot = matchSlot(text, slots);
    const target = listing ?? listingById(conversation.preferredListingId) ?? listingById(conversation.lastListingIds[0]);
    outcomes.push(
      executeTool(
        "schedule_showing",
        {
          listingId: target?.id,
          slotId: slot?.id,
          name: conversation.fields.name,
          email: conversation.fields.email,
          phone: conversation.fields.phone,
        },
        ctx,
      ),
    );
    if (outcomes.at(-1)?.showing) {
      const showing = outcomes.at(-1)?.showing;
      outcomes.push(
        executeTool(
          "create_crm_lead",
          { note: showing ? `Showing ${showing.slotLabel} at ${target?.address ?? showing.listingId}.` : "" },
          ctx,
        ),
      );
    }
  }

  if (NURTURE_INTENT.test(text)) {
    outcomes.push(executeTool("nurture_opt_in", { email: conversation.fields.email, topics: ["listings"] }, ctx));
  }

  if (kb) {
    const found = retrieve(text, 3);
    if (!homes && !wantsValue && !wantsBook && found.low) {
      outcomes.push(executeTool("request_human", { reason: "low_confidence" }, ctx));
    } else if (found.citations.length) {
      outcomes.push({
        trace: { name: "search_kb", args: { query: text }, summary: found.citations.map((item) => item.title).join(", ") },
        kb: found.citations,
      });
    }
  }

  return outcomes;
}

function compose(data: StoreData, conversation: Conversation, text: string, outcomes: ToolOutcome[], now: Date): ChatMessage {
  const guard = screenMessage(text);
  const school = guard.action === "allow" && guard.schoolDisclaimer;
  const listings = uniqueListings(outcomes.flatMap((item) => item.listings ?? []));
  const valuation = outcomes.find((item) => item.valuation)?.valuation;
  const qualification = outcomes.find((item) => item.qualification)?.qualification;
  const assignment = outcomes.find((item) => item.assignment)?.assignment;
  const showing = outcomes.find((item) => item.showing)?.showing;
  const crm = [...outcomes].reverse().find((item) => item.crm)?.crm;
  const citations = outcomes.find((item) => item.kb)?.kb;
  const targetId = listings[0]?.id ?? conversation.preferredListingId ?? conversation.lastListingIds[0];
  const slots = buildSlots(now)
    .filter((slot) => !data.showings.some((showing) => showing.listingId === targetId && showing.slotId === slot.id))
    .slice(0, 6);
  const scheduleTrace = outcomes.find((item) => item.trace.name === "schedule_showing");
  const searchTrace = outcomes.find((item) => item.trace.name === "search_listings");
  const nurtureTrace = outcomes.find((item) => item.trace.name === "nurture_opt_in");
  const handoff = outcomes.find((item) => item.handoff)?.handoff;

  const paragraphs: string[] = [];
  if (handoff && !searchTrace && !qualification && !showing && !valuation) {
    const lead = handoff.reason === "low_confidence" ? LOW_CONFIDENCE_REPLY : HANDOFF_REPLY;
    return {
      id: uid("msg"),
      role: "assistant",
      content: `${lead}\n\nTicket ${handoff.id}.`,
      createdAt: now.toISOString(),
      toolCalls: visibleTraces(outcomes),
      suggestions: ["I'm looking for a 3 bed under 650k in Highlands"],
    };
  }
  if (school) paragraphs.push(SCHOOL_DISCLAIMER);

  if (searchTrace) {
    if (listings.length === 0) paragraphs.push(searchTrace.trace.summary);
    else {
      paragraphs.push(
        `I found ${listings.length} ${conversation.fields.area ?? "Denver"} ${conversation.fields.beds ? `${conversation.fields.beds}-bedroom ` : ""}home${listings.length === 1 ? "" : "s"}${conversation.fields.budget ? ` at or under ${money(conversation.fields.budget)}` : ""}. List prices are from this demo catalog.`,
      );
    }
  }

  if (valuation) paragraphs.push(outcomes.find((item) => item.valuation)!.trace.summary);
  else if (VALUE_INTENT.test(text) && !conversation.fields.sqft) {
    paragraphs.push("I can run the mock AVM once I have the address, bedroom count, and finished square feet.");
  }

  const cited = pickCitation(text, citations);
  if (cited && !searchTrace) {
    paragraphs.push(cited.excerpt);
    const rest = (citations ?? []).filter((item) => item.id !== cited.id);
    if (rest.length && KB_TOPIC.test(text)) paragraphs.push(`Also on file: ${rest.map((item) => item.title).join("; ")}.`);
  } else if (cited && /\btell me about\b/i.test(text)) {
    paragraphs.push(cited.excerpt);
  }

  if (qualification && assignment && crm) {
    paragraphs.push(
      `${qualification.tier === "hot" ? "This is a hot lead" : qualification.tier === "warm" ? "This is a warm lead" : "This is a cold lead"} — score ${qualification.score} of 100. ${qualification.reasons.slice(0, 4).join(". ")}.`,
    );
    paragraphs.push(`${assignment.note} CRM record ${crm.id} is open.`);
    if (qualification.missing.length) paragraphs.push(`Still missing: ${qualification.missing.join(", ")}.`);
  }

  if (showing) {
    const home = listingById(showing.listingId);
    const agentName = assignment?.agent.name ?? "your agent";
    paragraphs.push(
      `You're booked for ${showing.slotLabel} at ${home?.address ?? showing.listingId} with ${agentName}. The showing is on the desk calendar and the CRM note includes it. This is a portfolio demo, so nobody will call or email you.`,
    );
  } else if (scheduleTrace && !showing) {
    paragraphs.push(scheduleTrace.trace.summary);
    if (scheduleTrace.trace.summary.includes("name and email")) {
      paragraphs.push("Reply with your name, email, and a 555 phone number and I'll hold the time.");
    } else if (slots.length) {
      paragraphs.push(`Open times: ${slots.map((slot) => slot.label).join("; ")}.`);
    }
  } else if (qualification && conversation.fields.role !== "seller" && qualification.tier !== "cold") {
    const top = listings[0] ?? listingById(conversation.lastListingIds[0]);
    const saturday = slots.find((slot) => slot.weekday === "Saturday" && slot.hour === 11) ?? slots[0];
    if (top && saturday) {
      paragraphs.push(
        `I can hold ${top.address} (${money(top.price)}) at ${saturday.label}. Tell me which time you want, plus your name, email, and phone.`,
      );
    }
  } else if (qualification && conversation.fields.role === "seller") {
    paragraphs.push("Elena can walk the house for a listing consult. Private showings of other people's homes wait until you say you are also buying.");
  } else if (searchTrace && !conversation.scored) {
    paragraphs.push("Before I book anything: are you pre-approved or paying cash, when do you want to move, and what prompted the search?");
  }

  if (nurtureTrace) paragraphs.push(nurtureTrace.trace.summary);
  if (qualification?.tier === "cold" && !nurtureTrace) {
    paragraphs.push("I can email new listings if you want them. Say the word and include an email address. Nothing leaves this demo.");
  }

  if (!paragraphs.length) {
    paragraphs.push("I can search the catalog, explain buying, selling, fees, and open houses, or run a mock value. What do you want to do?");
  }

  const content = enforceOutput(paragraphs.join("\n\n"));
  const blocked = content.includes("I can't help with that");
  return {
    id: uid("msg"),
    role: "assistant",
    content,
    createdAt: now.toISOString(),
    listings: blocked ? undefined : listings.slice(0, 6),
    citations: blocked ? undefined : citations,
    toolCalls: visibleTraces(outcomes),
    suggestions: blocked
      ? ["I'm looking for a 3 bed under 650k in Highlands"]
      : suggestionsFor(conversation, listings, slots, qualification?.tier, Boolean(showing)),
    qualification,
    guardrail: school ? { blocked: false } : undefined,
  };
}

function visibleTraces(outcomes: ToolOutcome[]) {
  return outcomes
    .map((item) => item.trace)
    .filter((trace) => trace.name !== "search_kb")
    .map((trace) => ({ ...trace, summary: maskPii(trace.summary), args: maskValue(trace.args) as Record<string, unknown> }));
}

function slotPhrase(slot: Slot): string {
  const suffix = slot.hour >= 12 ? "PM" : "AM";
  const hour = slot.hour % 12 === 0 ? 12 : slot.hour % 12;
  return `${slot.weekday} at ${hour}:${slot.minute.toString().padStart(2, "0")} ${suffix}`;
}

function pickCitation(text: string, citations: { id: string; title: string; excerpt: string }[] | undefined) {
  if (!citations?.length) return undefined;
  const prefer = [
    [/\b(commission|fee|fees|charge|seller pay)\b/i, "fees"],
    [/\bopen house\b/i, "open-house"],
    [/\b(pre-?approv\w*|pre-?qualif\w*|mortgage|financing)\b/i, "financing"],
    [/\b(worth|valuation|avm)\b/i, "valuation"],
    [/\b(who covers|which agent)\b/i, "agents"],
  ] as const;
  for (const [pattern, id] of prefer) {
    if (pattern.test(text)) return citations.find((item) => item.id === id) ?? citations[0];
  }
  return citations[0];
}

function suggestionsFor(
  conversation: Conversation,
  listings: Listing[],
  slots: Slot[],
  tier: string | undefined,
  booked: boolean,
): string[] {
  if (booked) return ["What's your open house policy?"];
  if (!conversation.scored && conversation.qualifying) {
    return ["Yes, I'm pre-approved. Relocating for work and I want to move within 30 days."];
  }
  if (tier === "hot" || tier === "warm") {
    const top = listings[0] ?? listingById(conversation.lastListingIds[0]);
    const saturday = slots.find((slot) => slot.weekday === "Saturday" && slot.hour === 11) ?? slots[0];
    if (top && saturday) {
      return [`Book ${top.address} on ${slotPhrase(saturday)}. I'm Alex Rivera, alex.rivera@example.com, 303-555-0148.`];
    }
  }
  if (tier === "cold") return ["Please email new listings to alex.rivera@example.com."];
  return ["What does a seller pay in commission?", "What's your open house policy?"];
}

function mentionedListing(text: string, conversation: Conversation): Listing | undefined {
  const id = text.match(/SR-\d{4}/i);
  if (id) return listingById(id[0]);
  const lower = text.toLowerCase();
  const pool = LISTING_POOL(conversation);
  return pool.find((listing) => lower.includes(listing.address.toLowerCase()));
}

function LISTING_POOL(conversation: Conversation): Listing[] {
  const ids = new Set([conversation.preferredListingId, ...conversation.lastListingIds].filter(Boolean) as string[]);
  const fromIds = [...ids].map((id) => listingById(id)).filter((item): item is Listing => Boolean(item));
  if (fromIds.length) return fromIds;
  return [];
}

function uniqueListings(listings: Listing[]): Listing[] {
  const seen = new Set<string>();
  return listings.filter((listing) => {
    if (seen.has(listing.id)) return false;
    seen.add(listing.id);
    return true;
  });
}

function bantInMessage(text: string): boolean {
  return /\b(pre-?approv\w*|cash buyer|paying cash|30 days|90 days|3 months?|6 months?|just looking|just browsing|no rush|relocat\w*|downsiz\w*|first-time|first home|for work|within a month|asap)\b/i.test(
    text,
  );
}

export function slotChoices(now: Date): Slot[] {
  return buildSlots(now);
}
