import { z } from "zod";
import { agentById } from "@/lib/agents";
import { money } from "@/lib/format";
import type { DeskCard, DeskPayload, Listing, Qualification, Showing } from "@/lib/types";
import type { Slot } from "@/lib/slots";
import type { Valuation } from "@/lib/avm";

const listingSchema = z.object({
  id: z.string(),
  address: z.string(),
  neighborhood: z.string(),
  city: z.string(),
  state: z.literal("CO"),
  zip: z.string(),
  price: z.number(),
  beds: z.number(),
  baths: z.number(),
  sqft: z.number(),
  type: z.enum(["house", "condo", "townhome"]),
  yearBuilt: z.number(),
  hoa: z.number().nullable(),
  daysOnMarket: z.number(),
  description: z.string(),
  highlights: z.array(z.string()),
  openHouse: z.string().optional(),
});

const slotSchema = z.object({
  id: z.string(),
  label: z.string(),
  weekday: z.string(),
  startsAt: z.string(),
});

const cardSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("carousel"), listings: z.array(listingSchema).min(1) }),
  z.object({ kind: z.literal("listing"), listing: listingSchema }),
  z.object({
    kind: z.literal("slots"),
    listingId: z.string().optional(),
    address: z.string().optional(),
    slots: z.array(slotSchema).min(1),
  }),
  z.object({ kind: z.literal("qualify") }),
  z.object({
    kind: z.literal("confirm"),
    code: z.string(),
    when: z.string(),
    where: z.string(),
    who: z.string(),
    startsAt: z.string(),
  }),
  z.object({
    kind: z.literal("quote"),
    title: z.string(),
    rows: z.array(z.object({ label: z.string(), amount: z.string() })).min(1),
    total: z.string(),
    note: z.string(),
  }),
  z.object({ kind: z.literal("refusal") }),
  z.object({ kind: z.literal("handoff"), ticketId: z.string() }),
]);

const payloadSchema = z.object({
  cards: z.array(cardSchema),
  agentName: z.string().optional(),
});

export function parseDeskPayload(value: unknown): DeskPayload | undefined {
  const parsed = payloadSchema.safeParse(value);
  return parsed.success ? (parsed.data as DeskPayload) : undefined;
}

export function buildDesk(input: {
  listings?: Listing[];
  detail?: boolean;
  slots?: Slot[];
  showing?: Showing;
  where?: string;
  who?: string;
  qualification?: Qualification;
  qualifying?: boolean;
  scored?: boolean;
  handoffId?: string;
  refusal?: boolean;
  valuation?: Valuation;
  agentName?: string;
}): DeskPayload | undefined {
  const cards: DeskCard[] = [];
  if (input.refusal) cards.push({ kind: "refusal" });
  if (input.handoffId) cards.push({ kind: "handoff", ticketId: input.handoffId });
  if (input.listings && input.listings.length > 1) cards.push({ kind: "carousel", listings: input.listings.slice(0, 6) });
  if (input.listings && input.listings.length === 1) {
    cards.push({ kind: "listing", listing: input.listings[0] });
  } else if (input.detail && input.listings && input.listings[0]) {
    cards.push({ kind: "listing", listing: input.listings[0] });
  }
  if (input.valuation) {
    cards.push({
      kind: "quote",
      title: "Mock value range",
      rows: [
        { label: "Low", amount: money(input.valuation.low) },
        { label: "Mid", amount: money(input.valuation.mid) },
      ],
      total: money(input.valuation.high),
      note: "Sample range for this demo, not a bill.",
    });
  }
  if (input.qualifying && !input.scored && !input.showing) cards.push({ kind: "qualify" });
  if (input.slots && input.slots.length && !input.showing) {
    const home = input.listings?.[0];
    cards.push({
      kind: "slots",
      listingId: home?.id,
      address: home?.address,
      slots: input.slots.slice(0, 6).map((slot) => ({
        id: slot.id,
        label: slot.label,
        weekday: slot.weekday,
        startsAt: slot.startsAt,
      })),
    });
  }
  if (input.showing) {
    cards.push({
      kind: "confirm",
      code: input.showing.id,
      when: input.showing.slotLabel,
      where: input.where ?? input.showing.listingId,
      who: input.who ?? agentById(input.showing.agentId)?.name ?? "your agent",
      startsAt: input.showing.startsAt,
    });
  }
  const payload = { cards, agentName: input.agentName };
  return parseDeskPayload(payload);
}
