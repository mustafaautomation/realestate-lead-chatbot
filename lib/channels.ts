import { runTurn } from "@/lib/agent";
import type { StoreData } from "@/lib/types";

export type ChannelName = "whatsapp" | "messenger";

export type ChannelResult = {
  status: number;
  body: Record<string, unknown> | string;
};

const DEMO_VERIFY_TOKEN = "summit-ridge-verify";

export function verifyChannel(params: URLSearchParams, envToken: string | undefined): ChannelResult {
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");
  const expected = envToken || DEMO_VERIFY_TOKEN;
  if (mode === "subscribe" && token === expected && challenge) {
    return { status: 200, body: challenge };
  }
  return { status: 403, body: { error: "Verification failed." } };
}

export function inboundText(channel: ChannelName, payload: unknown): { externalId: string; messageId: string; text: string } | null {
  if (!payload || typeof payload !== "object") return null;
  if (channel === "whatsapp") {
    const message = (payload as WhatsAppPayload).entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message || message.type !== "text" || !message.text?.body) return null;
    return { externalId: message.from, messageId: message.id, text: message.text.body };
  }
  const event = (payload as MessengerPayload).entry?.[0]?.messaging?.[0];
  const text = event?.message?.text;
  if (!event?.sender?.id || !event.message?.mid || !text) return null;
  return { externalId: event.sender.id, messageId: event.message.mid, text };
}

export function handleInbound(data: StoreData, channel: ChannelName, payload: unknown, now = new Date()): ChannelResult {
  const inbound = inboundText(channel, payload);
  if (!inbound) return { status: 200, body: { ok: true, ignored: true } };
  const seen = data.processedInbound.find((item) => item.id === `${channel}:${inbound.messageId}`);
  if (seen) return { status: 200, body: { ok: true, duplicate: true, reply: seen.reply, conversationId: seen.conversationId } };
  const key = `${channel}:${inbound.externalId}`;
  const thread = data.channelThreads.find((item) => item.key === key);
  const turn = runTurn(data, inbound.text, thread?.conversationId ?? null, now);
  if (!thread) data.channelThreads.push({ key, conversationId: turn.conversationId });
  data.processedInbound.push({ id: `${channel}:${inbound.messageId}`, conversationId: turn.conversationId, reply: turn.message.content });
  return {
    status: 200,
    body: {
      ok: true,
      channel,
      conversationId: turn.conversationId,
      reply: turn.message.content,
      provider: turn.provider,
    },
  };
}

type WhatsAppPayload = {
  entry?: { changes?: { value?: { messages?: { from: string; id: string; type?: string; text?: { body?: string } }[] } }[] }[];
};

type MessengerPayload = {
  entry?: { messaging?: { sender?: { id?: string }; message?: { mid?: string; text?: string } }[] }[];
};
