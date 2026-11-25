import { completeTurn, prepareTurn, type TurnView } from "@/lib/agent";
import { enforceOutput, STEERING_REPLY } from "@/lib/guardrails";
import { buildSlots } from "@/lib/slots";
import { executeTool } from "@/lib/tools";
import { uid } from "@/lib/format";
import type { Listing, StoreData } from "@/lib/types";

const TOOLS = [
  { name: "search_listings", description: "Search the Summit Ridge catalog by budget, exact beds, area, and type.", parameters: { budget: "number", beds: "number", area: "string", type: "string" } },
  { name: "get_listing_details", description: "Fetch one listing by id such as SR-2401.", parameters: { listingId: "string" } },
  { name: "qualify_lead", description: "Score the lead from fields already on the conversation.", parameters: {} },
  { name: "estimate_home_value", description: "Mock AVM. Needs address, beds, and sqft.", parameters: { address: "string", beds: "number", sqft: "number" } },
  { name: "schedule_showing", description: "Book a showing. slotId must be one of the open slots.", parameters: { listingId: "string", slotId: "string", name: "string", email: "string", phone: "string" } },
  { name: "assign_agent", description: "Route an agent after qualify_lead.", parameters: { area: "string", valuation: "boolean" } },
  { name: "create_crm_lead", description: "Upsert the mock CRM record.", parameters: { note: "string" } },
  { name: "nurture_opt_in", description: "Store a nurture email. Do not send mail.", parameters: { email: "string" } },
  { name: "request_human", description: "Open a handoff ticket when the visitor asks for a person, is frustrated, or the notes do not cover the question.", parameters: { reason: "string" } },
];

type Provider = "groq" | "gemini";

export async function runModelTurn(data: StoreData, text: string, conversationId: string | null, now: Date): Promise<TurnView> {
  const prepared = prepareTurn(data, text, conversationId, now);
  if (prepared.kind === "refuse") return prepared.view;
  const order = providers();
  if (order.length === 0) return completeTurn(data, prepared.conversation, text, now, "mock", true);
  let lastError: unknown;
  for (const provider of order) {
    try {
      return await callProvider(provider, data, prepared.conversation, text, now);
    } catch (error) {
      lastError = error;
    }
  }
  console.error("Model providers failed", lastError);
  return completeTurn(data, prepared.conversation, text, now, "mock", true);
}

function providers(): Provider[] {
  const order: Provider[] = [];
  if (process.env.GROQ_API_KEY) order.push("groq");
  if (process.env.GEMINI_API_KEY) order.push("gemini");
  return order;
}

async function callProvider(provider: Provider, data: StoreData, conversation: StoreData["conversations"][number], text: string, now: Date): Promise<TurnView> {
  const endpoint = provider === "groq" ? "https://api.groq.com/openai/v1/chat/completions" : "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
  const key = provider === "groq" ? process.env.GROQ_API_KEY : process.env.GEMINI_API_KEY;
  const model = provider === "groq" ? process.env.GROQ_MODEL || "llama-3.3-70b-versatile" : process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const slots = buildSlots(now).map((slot) => `${slot.id} = ${slot.label}`);
  const messages: Record<string, unknown>[] = [
    {
      role: "system",
      content: `You are the text desk for Summit Ridge Realty, a fictional Denver brokerage and a Quvantic portfolio demo. Use tools for prices, scores, valuations, and bookings. Never invent a list price, a score, or an AVM number. Do not steer or rank schools. If you do not know, call request_human with reason low_confidence. Open slots:\n${slots.join("\n")}`,
    },
    ...conversation.messages.slice(0, -1).map((message) => ({ role: message.role, content: message.content })),
    { role: "user", content: text.trim() },
  ];
  const collected: Listing[] = [];
  const traces = [];
  let prose = "";
  for (let step = 0; step < 4; step += 1) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages,
        tools: TOOLS.map((tool) => ({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description,
            parameters: {
              type: "object",
              properties: Object.fromEntries(Object.entries(tool.parameters).map(([name, type]) => [name, { type }])),
            },
          },
        })),
      }),
    });
    if (!response.ok) throw new Error(`${provider} ${response.status}`);
    const payload = (await response.json()) as {
      choices?: { message?: { content?: string | null; tool_calls?: { id: string; function: { name: string; arguments: string } }[] } }[];
    };
    const message = payload.choices?.[0]?.message;
    if (!message) throw new Error("Empty model response");
    messages.push(message);
    const calls = message.tool_calls ?? [];
    if (!calls.length) {
      prose = message.content ?? "";
      break;
    }
    for (const call of calls) {
      const args = JSON.parse(call.function.arguments || "{}") as Record<string, unknown>;
      const outcome = executeTool(call.function.name, args, { data, conversation, now });
      traces.push(outcome.trace);
      if (outcome.listings) collected.push(...outcome.listings);
      messages.push({ role: "tool", tool_call_id: call.id, content: outcome.trace.summary });
    }
  }
  const safe = enforceOutput(prose || "I can search the catalog or answer from the brokerage notes.");
  const blocked = safe === STEERING_REPLY;
  const reply = {
    id: uid("msg"),
    role: "assistant" as const,
    content: safe,
    createdAt: now.toISOString(),
    listings: blocked ? undefined : collected.slice(0, 6),
    toolCalls: traces,
    guardrail: blocked ? { blocked: true as const, category: "steering" as const } : undefined,
  };
  conversation.messages.push(reply);
  conversation.updatedAt = now.toISOString();
  return { conversationId: conversation.id, message: reply, fields: conversation.fields, provider };
}
