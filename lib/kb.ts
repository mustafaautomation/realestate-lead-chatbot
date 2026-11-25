import fs from "node:fs";
import path from "node:path";

export type KbDoc = {
  id: string;
  title: string;
  topic: string;
  body: string;
};

export function kbDirectory(): string {
  return path.join(process.cwd(), "kb");
}

export function loadKbDocs(dir = kbDirectory()): KbDoc[] {
  const files = fs.readdirSync(/* turbopackIgnore: true */ dir).filter((file) => file.endsWith(".md")).sort();
  return files.map((file) => parseKbFile(fs.readFileSync(/* turbopackIgnore: true */ path.join(/* turbopackIgnore: true */ dir, file), "utf8"), file));
}

export function parseKbFile(source: string, filename: string): KbDoc {
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const meta = match?.[1] ?? "";
  const body = (match?.[2] ?? source).trim();
  const read = (key: string) => meta.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1]?.trim() ?? "";
  return {
    id: read("id") || filename.replace(/\.md$/, ""),
    title: read("title") || filename,
    topic: read("topic") || "general",
    body,
  };
}
