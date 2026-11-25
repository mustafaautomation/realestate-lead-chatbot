import { connection } from "next/server";
import { handleInbound, verifyChannel } from "@/lib/channels";
import { loadStore, saveStore } from "@/lib/store";

export async function GET(request: Request) {
  await connection();
  const result = verifyChannel(new URL(request.url).searchParams, process.env.WHATSAPP_VERIFY_TOKEN);
  if (typeof result.body === "string") return new Response(result.body, { status: result.status });
  return Response.json(result.body, { status: result.status });
}

export async function POST(request: Request) {
  await connection();
  const payload = await request.json().catch(() => null);
  const data = loadStore();
  const result = handleInbound(data, "whatsapp", payload, new Date());
  saveStore(data);
  return Response.json(result.body, { status: result.status });
}
