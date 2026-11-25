import { expect, it } from "vitest";
import { loadKbDocs } from "@/lib/kb";
import { LISTINGS } from "@/lib/listings";
import { runScenarios, writeScorecard } from "@/evals/suite";

it("keeps 40 seeded listings and at least 15 knowledge notes", () => {
  expect(LISTINGS.length).toBe(40);
  expect(loadKbDocs().length).toBeGreaterThanOrEqual(15);
});

it("passes the conversation scorecard", () => {
  const results = runScenarios();
  writeScorecard(results);
  const failed = results.filter((result) => !result.pass);
  expect(failed.map((result) => `${result.id}: ${result.detail}`).join("\n")).toBe("");
  expect(results.length).toBeGreaterThanOrEqual(20);
});
