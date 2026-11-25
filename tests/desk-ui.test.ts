import { describe, expect, it } from "vitest";
import { runTurn } from "@/lib/agent";
import { buildDesk, parseDeskPayload } from "@/lib/desk-ui";
import { LISTINGS } from "@/lib/listings";
import { emptyStore } from "@/lib/types";

describe("desk cards", () => {
  it("builds a listing carousel from a search", () => {
    const desk = buildDesk({ listings: LISTINGS.slice(0, 3), qualifying: true, scored: false });
    expect(desk?.cards.some((card) => card.kind === "carousel")).toBe(true);
    expect(desk?.cards.some((card) => card.kind === "qualify")).toBe(true);
  });

  it("rejects a carousel with no listings", () => {
    expect(parseDeskPayload({ cards: [{ kind: "carousel", listings: [] }] })).toBeUndefined();
  });

  it("offers slot chips after a hot lead", () => {
    const data = emptyStore();
    const now = new Date("2026-11-25T18:00:00.000Z");
    const first = runTurn(data, "I'm looking for a 3 bed under 650k in Highlands", null, now);
    const second = runTurn(data, "Yes, I'm pre-approved. Relocating for work and I want to move within 30 days.", first.conversationId, now);
    expect(second.message.desk?.cards.map((card) => card.kind)).toContain("slots");
  });

  it("keeps a fair-housing refusal card", () => {
    const desk = buildDesk({ refusal: true });
    expect(desk?.cards).toEqual([{ kind: "refusal" }]);
  });
});
