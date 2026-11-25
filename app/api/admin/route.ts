import { connection } from "next/server";
import { loadStore, snapshot } from "@/lib/store";

export async function GET() {
  await connection();
  return Response.json(snapshot(loadStore()));
}
