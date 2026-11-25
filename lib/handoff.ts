import { uid } from "@/lib/format";
import { maskPii } from "@/lib/pii";
import type { Conversation, Handoff, HandoffReason, StoreData } from "@/lib/types";

export function openHandoff(data: StoreData, conversation: Conversation, reason: HandoffReason, now: Date): Handoff {
  const existing = data.handoffs.find((item) => item.conversationId === conversation.id && item.reason === reason && item.status === "open");
  if (existing) return existing;
  const summary = maskPii(summarize(conversation));
  const ticket: Handoff = {
    id: `HO-${1000 + data.handoffs.length + 1}`,
    conversationId: conversation.id,
    reason,
    summary,
    status: "open",
    createdAt: now.toISOString(),
  };
  data.handoffs.push(ticket);
  data.audit.push({
    id: uid("log"),
    at: now.toISOString(),
    kind: "handoff",
    detail: maskPii(`${ticket.id} ${reason}. ${summary}`),
  });
  return ticket;
}

function summarize(conversation: Conversation): string {
  const fields = conversation.fields;
  const said = conversation.messages
    .filter((message) => message.role === "user")
    .slice(-4)
    .map((message) => message.content)
    .join(" | ");
  return [
    `Visitor: ${fields.name ?? "unknown"}`,
    fields.email ? `Email: ${fields.email}` : "",
    fields.phone ? `Phone: ${fields.phone}` : "",
    fields.role !== "unknown" ? `Role: ${fields.role}` : "",
    fields.area ? `Area: ${fields.area}` : "",
    `Said: ${said}`,
  ]
    .filter(Boolean)
    .join(". ");
}
