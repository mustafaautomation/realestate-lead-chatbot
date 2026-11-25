import { afterEach, describe, expect, it } from "vitest";
import { dataPath } from "@/lib/store";

describe("store path", () => {
  const previous = {
    vercel: process.env.VERCEL,
    dataPath: process.env.DATA_PATH,
  };

  afterEach(() => {
    restore("VERCEL", previous.vercel);
    restore("DATA_PATH", previous.dataPath);
  });

  it("writes under /tmp when Vercel marks the filesystem read-only", () => {
    delete process.env.DATA_PATH;
    process.env.VERCEL = "1";
    expect(dataPath()).toBe("/tmp/summit-ridge-store.json");
  });

  it("keeps the local data file when not on Vercel", () => {
    delete process.env.DATA_PATH;
    delete process.env.VERCEL;
    expect(dataPath()).toMatch(/data\/store\.json$/);
  });
});

function restore(name: "VERCEL" | "DATA_PATH", value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
