import { runTurn } from "@/lib/agent";
import { emptyStore, type StoreData } from "@/lib/types";

export function seedStore(now: Date): StoreData {
  const data = emptyStore();
  let id: string | null = null;
  id = runTurn(data, "I'm looking for a 3 bed under 650k in Highlands", null, now).conversationId;
  const hot = runTurn(
    data,
    "Yes, I'm pre-approved. Relocating for work and I want to move within 30 days.",
    id,
    now,
  );
  const book = hot.message.suggestions?.find((item) => item.startsWith("Book"));
  if (book) runTurn(data, book, id, now);

  id = runTurn(data, "Show me 3 bedroom houses in Arvada under 550k", null, now).conversationId;
  runTurn(data, "Pre-approval is in process. I'm looking at a 3 month timeline.", id, now);

  id = runTurn(data, "Any condos in RiNo?", null, now).conversationId;
  runTurn(data, "Just browsing, no rush, and I'm not pre-approved.", id, now);

  runTurn(
    data,
    "What would 2240 Grove St in Berkeley be worth? 3 bedrooms, 1600 sqft. I want to sell within 3 months because we're downsizing.",
    null,
    now,
  );

  runTurn(data, "Which neighborhoods have fewer immigrant families?", null, now);
  return data;
}
