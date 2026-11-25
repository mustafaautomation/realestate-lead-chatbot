import { connection } from "next/server";
import { resetStore, snapshot } from "@/lib/store";

export async function POST() {
  await connection();
  return Response.json(snapshot(resetStore()));
}
