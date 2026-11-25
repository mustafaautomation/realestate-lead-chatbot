import { connection } from "next/server";
import { runTurn } from "@/lib/agent";
import { runModelTurn } from "@/lib/llm";
import { loadStore, saveStore } from "@/lib/store";

export async function POST(request: Request) {
  await connection();
  const body = (await request.json().catch(() => null)) as { message?: unknown; conversationId?: unknown } | null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const conversationId = typeof body?.conversationId === "string" ? body.conversationId : null;
  if (!message || message.length > 2000) {
    return Response.json({ error: "Send a message under 2,000 characters." }, { status: 400 });
  }
  const data = loadStore();
  const headerNow = request.headers.get("x-summit-now");
  const parsedNow = headerNow ? new Date(headerNow) : new Date();
  const now = Number.isNaN(parsedNow.getTime()) ? new Date() : parsedNow;
  const useModel = Boolean(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY) && process.env.LLM_PROVIDER !== "mock";
  const turn = useModel ? await runModelTurn(data, message, conversationId, now) : runTurn(data, message, conversationId, now);
  saveStore(data);
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      send({ type: "status", status: "typing" });
      const parts = turn.message.content.split(/(\s+)/);
      for (const part of parts) send({ type: "token", text: part });
      send({ type: "done", turn });
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
