import { describe, expect, it } from "vitest";
import { handleInbound, verifyChannel } from "@/lib/channels";
import { maskPii } from "@/lib/pii";
import { validateToolArgs } from "@/lib/tool-schemas";
import { emptyStore } from "@/lib/types";

describe("channels", () => {
  it("verifies the webhook token and rejects a bad one", () => {
    const ok = verifyChannel(new URLSearchParams("hub.mode=subscribe&hub.verify_token=summit-ridge-verify&hub.challenge=8841"), undefined);
    expect(ok.status).toBe(200);
    expect(ok.body).toBe("8841");
    const bad = verifyChannel(new URLSearchParams("hub.mode=subscribe&hub.verify_token=nope&hub.challenge=8841"), undefined);
    expect(bad.status).toBe(403);
  });

  it("maps a WhatsApp text payload onto the desk", () => {
    const data = emptyStore();
    const result = handleInbound(data, "whatsapp", {
      entry: [{ changes: [{ value: { messages: [{ from: "15555550123", id: "wamid.1", type: "text", text: { body: "What does Summit Ridge charge a seller?" } }] } }] }],
    });
    expect(result.status).toBe(200);
    const body = result.body as { reply: string };
    expect(body.reply).toMatch(/5\.5 percent/);
    const again = handleInbound(data, "whatsapp", {
      entry: [{ changes: [{ value: { messages: [{ from: "15555550123", id: "wamid.1", type: "text", text: { body: "again" } }] } }] }],
    });
    expect((again.body as { duplicate?: boolean }).duplicate).toBe(true);
  });

  it("maps a Messenger payload onto the desk", () => {
    const data = emptyStore();
    const result = handleInbound(data, "messenger", {
      entry: [{ messaging: [{ sender: { id: "user-9" }, message: { mid: "mid.1", text: "What's your open house policy?" } }] }],
    });
    expect((result.body as { reply: string }).reply).toMatch(/Saturday 11:00 AM/);
  });
});

describe("guardrails and tools", () => {
  it("masks email and phone numbers", () => {
    expect(maskPii("Write alex.rivera@example.com or 303-555-0148")).toBe("Write a***@example.com or ***-***-****");
  });

  it("rejects a listing id that is not in the catalog shape", () => {
    const parsed = validateToolArgs("get_listing_details", { listingId: "drop table" });
    expect(parsed.ok).toBe(false);
  });
});
