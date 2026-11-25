import { connection } from "next/server";

export async function GET() {
  await connection();
  const provider = process.env.LLM_PROVIDER === "openai" && process.env.OPENAI_API_KEY ? "openai" : "mock";
  return Response.json({
    ok: true,
    brand: "Summit Ridge Realty",
    subdomain: "realty-chat",
    provider,
  });
}
