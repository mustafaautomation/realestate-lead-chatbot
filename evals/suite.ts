import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { runTurn } from "@/lib/agent";
import { LISTINGS } from "@/lib/listings";
import { emptyStore, type StoreData } from "@/lib/types";
import cases from "@/evals/cases.json";

export const FIXED_NOW = new Date("2026-11-25T18:00:00.000Z");

type TurnSpec = {
  user?: string;
  suggestionPrefix?: string;
  toolsInclude?: string[];
  toolsExclude?: string[];
  textIncludes?: string[];
  textExcludes?: string[];
  citation?: string;
  tier?: string;
  agentId?: string;
  guard?: string;
  listingRule?: { area?: string; beds?: number; maxPrice?: number; minCount?: number; excludeIds?: string[] };
  handoff?: string;
  showing?: boolean;
  logMasksEmail?: boolean;
};

type EvalCase = { id: string; title: string; turns: TurnSpec[] };

export type ScenarioResult = { id: string; title: string; pass: boolean; detail: string };

export function runScenarios(now = FIXED_NOW): ScenarioResult[] {
  const results = (cases as EvalCase[]).map((item) => {
    try {
      runCase(item, now);
      return { id: item.id, title: item.title, pass: true, detail: "" };
    } catch (error) {
      return { id: item.id, title: item.title, pass: false, detail: error instanceof Error ? error.message : String(error) };
    }
  });
  try {
    runDoubleBook(now);
    results.push({ id: "double-book", title: "The same listing and slot cannot be booked twice", pass: true, detail: "" });
  } catch (error) {
    results.push({
      id: "double-book",
      title: "The same listing and slot cannot be booked twice",
      pass: false,
      detail: error instanceof Error ? error.message : String(error),
    });
  }
  return results;
}

export function writeScorecard(results: ScenarioResult[]) {
  const passed = results.filter((result) => result.pass).length;
  const lines = [
    "# Eval scorecard",
    "",
    `Passed ${passed} of ${results.length}. Catalog listings: ${LISTINGS.length}. Knowledge notes: checked in \`/kb\`.`,
    "",
    "| Scenario | Result |",
    "| --- | --- |",
    ...results.map((result) => `| ${result.id} | ${result.pass ? "pass" : "fail"} |`),
    "",
  ];
  const json = { passed, total: results.length, results };
  const docs = path.join(process.cwd(), "docs");
  mkdirSync(docs, { recursive: true });
  writeFileSync(path.join(docs, "eval-scorecard.md"), lines.join("\n"));
  writeFileSync(path.join(docs, "eval-scorecard.json"), JSON.stringify(json, null, 2));
  return json;
}

function runCase(item: EvalCase, now: Date) {
  const data = emptyStore();
  let conversationId: string | null = null;
  for (const turn of item.turns) {
    const message = turn.user ?? suggestion(data, conversationId, turn.suggestionPrefix ?? "");
    const result = runTurn(data, message, conversationId, now);
    conversationId = result.conversationId;
    const names = result.message.toolCalls?.map((call) => call.name) ?? [];
    for (const name of turn.toolsInclude ?? []) assert(names.includes(name), `${item.id}: missing tool ${name}`);
    for (const name of turn.toolsExclude ?? []) assert(!names.includes(name), `${item.id}: unexpected tool ${name}`);
    for (const text of turn.textIncludes ?? []) assert(result.message.content.toLowerCase().includes(text.toLowerCase()), `${item.id}: missing text ${text}`);
    for (const text of turn.textExcludes ?? []) assert(!result.message.content.toLowerCase().includes(text.toLowerCase()), `${item.id}: unexpected text ${text}`);
    if (turn.citation) assert(result.message.citations?.some((citation) => citation.id === turn.citation), `${item.id}: citation ${turn.citation} missing`);
    if (turn.tier) assert(result.message.qualification?.tier === turn.tier, `${item.id}: tier ${result.message.qualification?.tier}`);
    if (turn.agentId) {
      const lead = data.leads.find((itemLead) => itemLead.conversationId === conversationId);
      assert(lead?.agentId === turn.agentId, `${item.id}: agent ${lead?.agentId}`);
    }
    if (turn.guard) assert(result.message.guardrail?.category === turn.guard, `${item.id}: guard ${result.message.guardrail?.category}`);
    if (turn.handoff) assert(data.handoffs.some((ticket) => ticket.reason === turn.handoff), `${item.id}: handoff ${turn.handoff} missing`);
    if (turn.showing) assert(data.showings.some((showing) => showing.conversationId === conversationId), `${item.id}: showing missing`);
    if (turn.logMasksEmail) {
      const blob = JSON.stringify(result.message.toolCalls ?? []);
      assert(!blob.includes("alex.rivera@example.com"), `${item.id}: raw email in tool log`);
      assert(blob.includes("***@"), `${item.id}: masked email missing`);
    }
    if (turn.listingRule) {
      const cards = result.message.listings ?? [];
      const rule = turn.listingRule;
      if (rule.minCount) assert(cards.length >= rule.minCount, `${item.id}: only ${cards.length} cards`);
      for (const card of cards) {
        if (rule.area) assert(card.neighborhood === rule.area, `${item.id}: area ${card.neighborhood}`);
        if (rule.beds) assert(card.beds === rule.beds, `${item.id}: beds ${card.beds}`);
        if (rule.maxPrice) assert(card.price <= rule.maxPrice, `${item.id}: price ${card.price}`);
      }
      for (const id of rule.excludeIds ?? []) assert(!cards.some((card) => card.id === id), `${item.id}: excluded ${id}`);
    }
  }
}

function runDoubleBook(now: Date) {
  const first = book(now);
  const other = emptyStore();
  const start = runTurn(other, "looking for 3 bed under 650k in Highlands", null, now);
  const qualified = runTurn(other, "Yes, I'm pre-approved. Relocating for work and I want to move within 30 days.", start.conversationId, now);
  const text = qualified.message.suggestions?.find((item) => item.startsWith("Book"));
  assert(text, "double-book: no suggestion");
  other.showings.push(first.showings[0]!);
  const again = runTurn(other, text, start.conversationId, now);
  assert(other.showings.filter((item) => item.conversationId === start.conversationId).length === 0, "double-book: conflict booked");
  assert(/taken|already/i.test(again.message.content), "double-book: no explanation");
}

function book(now: Date): StoreData {
  const data = emptyStore();
  const first = runTurn(data, "looking for 3 bed under 650k in Highlands", null, now);
  const second = runTurn(data, "Yes, I'm pre-approved. Relocating for work and I want to move within 30 days.", first.conversationId, now);
  const text = second.message.suggestions?.find((item) => item.startsWith("Book"));
  if (!text) throw new Error("double-book setup failed");
  runTurn(data, text, first.conversationId, now);
  return data;
}

function suggestion(data: StoreData, conversationId: string | null, prefix: string): string {
  const conversation = data.conversations.find((item) => item.id === conversationId);
  const message = [...(conversation?.messages ?? [])].reverse().find((item) => item.suggestions?.some((suggestionText) => suggestionText.startsWith(prefix)));
  const found = message?.suggestions?.find((item) => item.startsWith(prefix));
  if (!found) throw new Error(`No suggestion starting with ${prefix}`);
  return found;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
