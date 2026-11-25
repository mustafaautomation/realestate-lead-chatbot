"use client";

import { useEffect, useRef, useState } from "react";
import { ListingCard } from "@/components/listing-card";
import { MarkdownText } from "@/components/markdown-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TurnView } from "@/lib/agent";
import type { ChatMessage } from "@/lib/types";

const STARTERS = [
  "I'm looking for a 3 bed under 650k in Highlands",
  "What does a seller pay in commission?",
  "What's your open house policy?",
  "Which neighborhoods have fewer immigrant families?",
];

export function ChatPanel({ variant = "panel" }: { variant?: "panel" | "full" | "embed" }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState("deterministic desk");
  const scroller = useRef<HTMLDivElement>(null);
  const localIds = useRef(0);
  const storageKey = "summit-ridge-chat";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem(storageKey);
      if (!saved) return;
      try {
        const parsed = JSON.parse(saved) as { conversationId: string; messages: ChatMessage[] };
        setConversationId(parsed.conversationId);
        setMessages(parsed.messages);
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages, pending]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || pending) return;
    setDraft("");
    setError(null);
    localIds.current += 1;
    const optimistic: ChatMessage = {
      id: `local-${localIds.current}`,
      role: "user",
      content: message,
      createdAt: "",
    };
    setMessages((current) => [...current, optimistic]);
    setPending(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, conversationId }),
      });
      if (!response.ok || !response.body) {
        const failed = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(failed?.error || "The desk could not answer.");
      }
      const payload = await readChatStream(response);
      setConversationId(payload.conversationId);
      const label = payload.fallback ? "deterministic desk (model fallback)" : payload.provider === "groq" ? "Groq" : payload.provider === "gemini" ? "Gemini" : "deterministic desk";
      setProvider(label);
      setMessages((current) => {
        const next = [...current, payload.message];
        window.localStorage.setItem(storageKey, JSON.stringify({ conversationId: payload.conversationId, messages: next }));
        return next;
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The desk could not answer.");
    } finally {
      setPending(false);
    }
  }

  function reset() {
    setMessages([]);
    setConversationId(null);
    setError(null);
    window.localStorage.removeItem(storageKey);
  }

  const shell =
    variant === "embed"
      ? "h-dvh"
      : variant === "full"
        ? "min-h-[70vh] flex-1"
        : "h-[680px]";

  return (
    <section className={`flex ${shell} flex-col overflow-hidden rounded-2xl border bg-card shadow-sm`} aria-label="Summit Ridge chat">
      <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <p className="font-heading text-base">Summit Ridge desk</p>
          <p className="text-xs text-muted-foreground">Model: {provider}. No live MLS.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => send("I would like to talk to a human.")}>
            Talk to a person
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={reset}>
            New chat
          </Button>
        </div>
      </header>
      <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto px-4 py-4" role="log" aria-live="polite" aria-busy={pending}>
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Ask for homes, a fee, or a showing. The last starter is a fair-housing refusal, so you can see the gate.
            </p>
            <div className="flex flex-col gap-2">
              {STARTERS.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  className="rounded-lg border bg-background px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => send(starter)}
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((message) => (
          <article key={message.id} className={message.role === "user" ? "ml-8" : "mr-4"}>
            <p className="mb-1 text-xs tracking-wide text-muted-foreground uppercase">{message.role === "user" ? "You" : "Desk"}</p>
            <div className={message.role === "user" ? "rounded-2xl bg-primary px-3 py-2 text-primary-foreground" : "space-y-3 rounded-2xl border bg-background px-3 py-3"}>
              {message.role === "assistant" ? <MarkdownText text={message.content} /> : <p className="text-sm whitespace-pre-wrap">{message.content}</p>}
              {message.guardrail?.blocked && <Badge variant="destructive">Fair housing gate</Badge>}
              {message.qualification && (
                <Badge variant="outline">
                  {message.qualification.tier} · {message.qualification.score}
                </Badge>
              )}
              {message.toolCalls && message.toolCalls.length > 0 && (
                <ul className="flex flex-wrap gap-1">
                  {message.toolCalls.map((call, index) => (
                    <li key={`${call.name}-${index}`}>
                      <Badge variant="secondary">{call.name}</Badge>
                    </li>
                  ))}
                </ul>
              )}
              {message.listings && message.listings.length > 0 && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {message.listings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} compact />
                  ))}
                </div>
              )}
              {message.citations && message.citations.length > 0 && (
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {message.citations.map((citation) => (
                    <li key={citation.id}>Source: {citation.title}</li>
                  ))}
                </ul>
              )}
              {message.suggestions && message.id === messages.at(-1)?.id && (
                <div className="flex flex-col gap-2">
                  {message.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="rounded-lg border bg-background px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => send(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </article>
        ))}
        {pending && (
          <p className="text-sm text-muted-foreground" role="status">
            <span className="mr-2 inline-flex gap-1" aria-hidden>
              <span className="size-1.5 animate-pulse rounded-full bg-current" />
              <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:150ms]" />
              <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:300ms]" />
            </span>
            Checking the catalog and the notes…
          </p>
        )}
        {error && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
      <form
        className="flex gap-2 border-t p-3"
        onSubmit={(event) => {
          event.preventDefault();
          void send(draft);
        }}
      >
        <label className="sr-only" htmlFor="desk-message">
          Message
        </label>
        <Input
          id="desk-message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="3 beds under 650k in Highlands"
          className="h-10"
          disabled={pending}
        />
        <Button type="submit" disabled={pending || !draft.trim()}>
          Send
        </Button>
      </form>
    </section>
  );
}

async function readChatStream(response: Response): Promise<TurnView> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("The desk could not answer.");
  const decoder = new TextDecoder();
  let buffer = "";
  let turn: TurnView | null = null;
  while (true) {
    const step = await reader.read();
    if (step.done) break;
    buffer += decoder.decode(step.value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";
    for (const chunk of chunks) {
      const line = chunk.split("\n").find((item) => item.startsWith("data: "));
      if (!line) continue;
      const event = JSON.parse(line.slice(6)) as { type?: string; turn?: TurnView };
      if (event.type === "done" && event.turn) turn = event.turn;
    }
  }
  if (!turn) throw new Error("The desk could not answer.");
  return turn;
}
