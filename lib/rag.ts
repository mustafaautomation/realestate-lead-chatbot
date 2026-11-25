import { loadKbDocs, type KbDoc } from "@/lib/kb";
import { matchNeighborhood } from "@/lib/neighborhoods";
import type { Citation } from "@/lib/types";

const STOP = new Set(
  "a an the of to and or in on for with about is are was were be this that it as at by from our we you your i do does can what how when who why me my summit ridge realty denver".split(
    " ",
  ),
);

export type Chunk = {
  id: string;
  docId: string;
  title: string;
  topic: string;
  text: string;
};

export function chunksFromDocs(docs: KbDoc[] = loadKbDocs()): Chunk[] {
  const chunks: Chunk[] = [];
  for (const doc of docs) {
    const sentences = doc.body.split(/(?<=\.)\s+/).map((part) => part.trim()).filter((part) => part.length > 30);
    const windows: string[] = [];
    for (let index = 0; index < sentences.length; index += 2) windows.push(sentences.slice(index, index + 2).join(" "));
    if (windows.length === 0) windows.push(doc.body);
    windows.push(doc.body);
    windows.forEach((text, index) => {
      chunks.push({ id: `${doc.id}-${index}`, docId: doc.id, title: doc.title, topic: doc.topic, text });
    });
  }
  return chunks;
}

const DOCS = loadKbDocs();
const CHUNKS = chunksFromDocs(DOCS);
const DOC_BODY = new Map(DOCS.map((doc) => [doc.id, doc.body]));

function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9%$.']+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP.has(token));
}

function expandQuery(query: string): string {
  const extra: string[] = [];
  if (/\b(commission|fee|fees|charge|seller pay|compensation)\b/i.test(query)) {
    extra.push("commission fee schedule seller pays 5.5 percent");
  }
  if (/\bopen house\b/i.test(query)) extra.push("open house policy Saturday Sunday");
  if (/\b(pre-?approv\w*|pre-?qualif\w*|mortgage|financing|down payment|fha|va loan)\b/i.test(query)) {
    extra.push("financing basics pre-approval pre-qualification");
  }
  if (/\b(buy|buying|offer|earnest|inspection)\b/i.test(query)) extra.push("buying process");
  if (/\b(sell|selling|list my|listing)\b/i.test(query)) extra.push("selling process");
  if (/\b(valuat|avm|appraisal|worth)\b/i.test(query)) extra.push("home valuation explainer mock AVM");
  if (/\b(agent|who covers|maya|elena|jordan|priya|andre|okada)\b/i.test(query)) extra.push("agent bios");
  if (/\bfair housing|steer/i.test(query)) extra.push("fair housing policy");
  const area = matchNeighborhood(query);
  if (area && /\b(tell me about|what'?s it like|describe|neighborhood|guide)\b/i.test(query)) {
    extra.push(`neighborhood guide ${area}`);
  }
  return `${query} ${extra.join(" ")}`.trim();
}

const EMBED_DIM = 48;

function hashEmbed(words: string[]): Float64Array {
  const vector = new Float64Array(EMBED_DIM);
  for (const word of words) {
    let hash = 2166136261;
    for (let index = 0; index < word.length; index += 1) hash = Math.imul(hash ^ word.charCodeAt(index), 16777619);
    vector[Math.abs(hash) % EMBED_DIM] += hash & 1 ? 1 : -1;
  }
  let norm = 0;
  for (const value of vector) norm += value * value;
  const scale = Math.sqrt(norm) || 1;
  for (let index = 0; index < vector.length; index += 1) vector[index] /= scale;
  return vector;
}

function cosine(left: Float64Array, right: Float64Array): number {
  let dot = 0;
  for (let index = 0; index < left.length; index += 1) dot += left[index] * right[index];
  return dot;
}

const CHUNK_VECTORS = CHUNKS.map((chunk) => hashEmbed(tokens(`${chunk.title} ${chunk.text}`)));

export type Retrieval = { citations: Citation[]; confidence: number; low: boolean };

export function retrieve(query: string, limit = 3): Retrieval {
  const queryTokens = tokens(expandQuery(query));
  if (queryTokens.length === 0) return { citations: [], confidence: 0, low: true };
  const queryVector = hashEmbed(queryTokens);
  const documentFrequency = new Map<string, number>();
  const chunkTokenLists = CHUNKS.map((chunk) => tokens(`${chunk.title} ${chunk.text}`));
  for (const list of chunkTokenLists) {
    for (const token of new Set(list)) documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
  }
  const averageLength = chunkTokenLists.reduce((sum, list) => sum + list.length, 0) / (chunkTokenLists.length || 1);
  const scored = CHUNKS.map((chunk, index) => {
    const list = chunkTokenLists[index];
    const counts = new Map<string, number>();
    for (const token of list) counts.set(token, (counts.get(token) ?? 0) + 1);
    let bm25 = 0;
    for (const token of new Set(queryTokens)) {
      const frequency = counts.get(token) ?? 0;
      if (!frequency) continue;
      const df = documentFrequency.get(token) ?? 0;
      const idf = Math.log(1 + (CHUNKS.length - df + 0.5) / (df + 0.5));
      const k1 = 1.2;
      const b = 0.75;
      bm25 += (idf * (frequency * (k1 + 1))) / (frequency + k1 * (1 - b + (b * list.length) / averageLength));
    }
    const title = new Set(tokens(chunk.title));
    for (const token of queryTokens) if (title.has(token)) bm25 += 1.5;
    if (topicBoost(query, chunk.topic)) bm25 += 6;
    const vector = (cosine(queryVector, CHUNK_VECTORS[index]) + 1) / 2;
    const hybrid = bm25 * 0.75 + vector * 2;
    return { chunk, score: hybrid, bm25 };
  }).sort((a, b) => b.score - a.score);
  const best = new Map<string, (typeof scored)[number]>();
  for (const row of scored) {
    const current = best.get(row.chunk.docId);
    if (!current || row.score > current.score) best.set(row.chunk.docId, row);
  }
  const ranked = [...best.values()].sort((a, b) => b.score - a.score);
  const top = ranked[0];
  const confidence = top ? Math.max(0, Math.min(1, top.bm25 / 8)) : 0;
  const citations: Citation[] = [];
  for (const row of ranked) {
    if (row.score < 3) continue;
    citations.push({
      id: row.chunk.docId,
      title: row.chunk.title,
      excerpt: bestExcerpt(query, DOC_BODY.get(row.chunk.docId) ?? row.chunk.text),
    });
    if (citations.length >= limit) break;
  }
  return { citations, confidence, low: confidence < 0.34 || citations.length === 0 };
}

function topicBoost(query: string, topic: string): boolean {
  const rules: [RegExp, string][] = [
    [/\b(commission|fee|fees|charge|seller pay|compensation)\b/i, "fees"],
    [/\bopen house\b/i, "open-house"],
    [/\b(pre-?approv\w*|pre-?qualif\w*|mortgage|financing|down payment)\b/i, "financing"],
    [/\b(worth|valuation|avm|appraisal)\b/i, "valuation"],
    [/\b(who covers|which agent|agent bio)\b/i, "agents"],
    [/\bfair housing|steer/i, "fair-housing"],
  ];
  return rules.some(([pattern, name]) => name === topic && pattern.test(query));
}

function mustKeep(query: string, sentence: string): boolean {
  if (/\b(pre-?approv\w*|pre-?qualif\w*|mortgage|financing)\b/i.test(query) && /not a loan offer/i.test(sentence)) return true;
  if (/\b(commission|fee|fees|charge)\b/i.test(query) && /5\.5 percent/.test(sentence)) return true;
  if (/\bopen house\b/i.test(query) && /general public/i.test(sentence)) return true;
  return false;
}

function bestExcerpt(query: string, body: string): string {
  const sentences = body.split(/(?<=\.)\s+/).map((sentence) => sentence.trim()).filter(Boolean);
  const wanted = new Set(tokens(expandQuery(query)));
  const ranked = sentences
    .map((sentence, index) => ({
      sentence,
      index,
      score: tokens(sentence).filter((token) => wanted.has(token)).length + (mustKeep(query, sentence) ? 5 : 0),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 4)
    .sort((a, b) => a.index - b.index);
  const text = (ranked.length ? ranked : sentences.slice(0, 2).map((sentence, index) => ({ sentence, index, score: 0 })))
    .map((row) => row.sentence)
    .join(" ");
  return text.length > 520 ? `${text.slice(0, 517)}...` : text;
}
