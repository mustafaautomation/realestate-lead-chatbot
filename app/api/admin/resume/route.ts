import { connection } from "next/server";
import { loadStore, saveStore } from "@/lib/store";

export async function POST(request: Request) {
  await connection();
  const body = (await request.json().catch(() => null)) as { conversationId?: unknown } | null;
  const conversationId = typeof body?.conversationId === "string" ? body.conversationId : "";
  const data = loadStore();
  const conversation = data.conversations.find((item) => item.id === conversationId) ?? data.conversations.find((item) => item.botPaused);
  if (!conversation) return Response.json({ error: "No paused conversation." }, { status: 404 });
  conversation.botPaused = false;
  saveStore(data);
  return Response.json({ ok: true, status: "Bot resumed", conversationId: conversation.id });
}
