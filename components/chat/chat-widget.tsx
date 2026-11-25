"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Calendar,
  Check,
  FileText,
  Headphones,
  Home,
  Mic,
  MoreHorizontal,
  Paperclip,
  Square,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import {
  CardSkeleton,
  CitationRow,
  ConfirmCard,
  HandoffCard,
  LeadCard,
  ListingCarousel,
  ListingDetailCard,
  QualifyForm,
  QuoteCard,
  RefusalCard,
  SlotPicker,
} from "@/components/chat-cards";
import { BRAND, VISUAL_NOW } from "@/lib/brand";
import type { TurnView } from "@/lib/agent";
import type { ChatMessage, DeskCard, Listing } from "@/lib/types";
import { cn } from "@/lib/utils";

type Attachment = { id: string; name: string; type: string; url: string };
type Prompt = { id: number; text: string };

const STARTER_ICONS = {
  home: Home,
  calendar: Calendar,
  book: BookOpen,
  headphones: Headphones,
} as const;

export function ChatWidget({
  variant = "frame",
  prompt,
  onPromptConsumed,
  onClose,
  className,
}: {
  variant?: "frame" | "page" | "embed" | "overlay";
  prompt?: Prompt | null;
  onPromptConsumed?: () => void;
  onClose?: () => void;
  className?: string;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const inputId = useId();
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const stick = useRef(true);
  const fileCount = useRef(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [filesFor, setFilesFor] = useState<Record<string, Attachment[]>>({});
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [phase, setPhase] = useState<string | null>(null);
  const [liveText, setLiveText] = useState<string | null>(null);
  const [skeletons, setSkeletons] = useState<DeskCard["kind"][]>([]);
  const [streaming, setStreaming] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [joined, setJoined] = useState(false);
  const [showJump, setShowJump] = useState(false);
  const [status, setStatus] = useState("");
  const [feedback, setFeedback] = useState<Record<string, "up" | "down" | "copied">>({});
  const [drop, setDrop] = useState(false);
  const [provider, setProvider] = useState("deterministic desk");
  const [menuOpen, setMenuOpen] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);
  const [urgent, setUrgent] = useState(false);
  const storageKey = variant === "embed" ? "summit-ridge-embed" : variant === "frame" ? "summit-ridge-hero" : "summit-ridge-chat";
  const abortRef = useRef<AbortController | null>(null);
  const seenPrompt = useRef<number | null>(null);
  const sendRef = useRef<(text: string) => Promise<void>>(async () => {});

  useEffect(() => {
    sendRef.current = send;
  });

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    const timer = window.setTimeout(() => {
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
  }, [storageKey]);

  useEffect(() => {
    if (!stick.current) return;
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages, liveText, phase, skeletons]);

  useEffect(() => {
    const has = messages.some((message) => message.desk?.cards.some((card) => card.kind === "handoff"));
    if (!has) {
      const clear = window.setTimeout(() => setJoined(false), 0);
      return () => window.clearTimeout(clear);
    }
    const timer = window.setTimeout(() => setJoined(true), 800);
    return () => window.clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    if (variant === "frame") return;
    const mobile = window.matchMedia("(max-width: 639px)").matches;
    if (!mobile) inputRef.current?.focus();
  }, [variant]);

  useEffect(() => {
    if (variant !== "embed") return;
    function onMessage(event: MessageEvent) {
      const data = event.data as { type?: string; text?: string; theme?: string };
      if (!data || typeof data !== "object") return;
      if (data.type === "summit-ridge:prompt" && typeof data.text === "string") void sendRef.current(data.text);
      if (data.type === "summit-ridge:theme" && (data.theme === "light" || data.theme === "dark" || data.theme === "system")) {
        setTheme(data.theme);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [setTheme, variant]);

  useEffect(() => {
    if (!prompt || seenPrompt.current === prompt.id) return;
    seenPrompt.current = prompt.id;
    void sendRef.current(prompt.text);
    onPromptConsumed?.();
  }, [onPromptConsumed, prompt]);

  function remember(nextId: string, nextMessages: ChatMessage[]) {
    window.localStorage.setItem(storageKey, JSON.stringify({ conversationId: nextId, messages: nextMessages }));
  }

  function reset() {
    const handoff = messages.some((message) => message.desk?.cards.some((card) => card.kind === "handoff"));
    if (handoff && !window.confirm("Close this handoff and start a new conversation?")) return;
    setMessages([]);
    setConversationId(null);
    setError(null);
    setLiveText(null);
    setPhase(null);
    setJoined(false);
    window.localStorage.removeItem(storageKey);
  }

  function addFiles(list: FileList | File[]) {
    const next: Attachment[] = [];
    for (const file of Array.from(list)) {
      if (files.length + next.length >= 3) break;
      if (fileCount.current >= 10) {
        setToast("This conversation already has 10 files.");
        break;
      }
      if (!/^(image\/jpeg|image\/png|image\/webp|application\/pdf)$/.test(file.type)) {
        setToast("Use a JPG, PNG, WebP, or PDF.");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setToast("Each file must be 5 MB or smaller.");
        continue;
      }
      fileCount.current += 1;
      next.push({ id: `${file.name}-${fileCount.current}`, name: file.name, type: file.type, url: URL.createObjectURL(file) });
    }
    if (next.length) setFiles((current) => [...current, ...next]);
    window.setTimeout(() => setToast(null), 4000);
  }

  async function send(text: string) {
    const cleaned = text.trim();
    if ((!cleaned && files.length === 0) || streaming) return;
    const attached = files.length ? `\n\n[Attached: ${files.map((file) => file.name).join(", ")}]` : "";
    const message = `${cleaned}${attached}`.trim();
    const localFiles = files;
    setDraft("");
    setFiles([]);
    setError(null);
    setStopped(false);
    const userMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    };
    setFilesFor((current) => ({ ...current, [userMessage.id]: localFiles }));
    setMessages((current) => [...current, userMessage]);
    if (/(\bgas\b|fire|flood|chest pain|can'?t breathe|\b911\b)/i.test(message)) {
      setUrgent(true);
      window.dispatchEvent(new CustomEvent("summit-urgent", { detail: message }));
    }
    setStreaming(true);
    setStatus("Assistant is replying");
    setPhase(phaseFor(message));
    const controller = new AbortController();
    abortRef.current = controller;
    const started = Date.now();
    try {
      const visual = document.documentElement.dataset.visualTest === "1";
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(visual ? { "x-summit-now": VISUAL_NOW } : {}),
        },
        body: JSON.stringify({ message, conversationId }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        const failed = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(failed?.error || "The desk could not answer.");
      }
      const turn = await readChatStream(response);
      const wait = Math.max(0, 320 - (Date.now() - started));
      await sleep(wait, controller.signal);
      if (controller.signal.aborted) throw new DOMException("Stopped", "AbortError");
      setSkeletons(turn.message.desk?.cards.map((card) => card.kind) ?? []);
      setPhase(null);
      await pace(turn.message.content, setLiveText, controller.signal);
      setLiveText(null);
      setSkeletons([]);
      setConversationId(turn.conversationId);
      const label = turn.fallback ? "deterministic desk (model fallback)" : turn.provider === "groq" ? "Groq" : turn.provider === "gemini" ? "Gemini" : "deterministic desk";
      setProvider(label);
      setMessages((current) => {
        const next = [...current, turn.message];
        remember(turn.conversationId, next);
        return next;
      });
      setStatus("Assistant replied");
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") {
        setStopped(true);
        setPhase(null);
        setSkeletons([]);
        setStatus("Stopped");
        return;
      }
      setDraft(cleaned);
      setFiles(localFiles);
      setError(caught instanceof Error ? caught.message : "The desk could not answer.");
      setPhase(null);
    } finally {
      setStreaming(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  }

  function onScroll() {
    const el = scroller.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const near = distance < 80;
    stick.current = near;
    setShowJump(!near);
  }

  function bookListing(listing: Listing) {
    void send(`Book a showing for ${listing.id}`);
  }

  function bookSlot(address: string | undefined, listingId: string | undefined, label: string) {
    const where = address ? `${address}` : listingId ?? "the home";
    void send(`Book ${where} on ${label}. I'm Alex Rivera, alex.rivera@example.com, 303-555-0148.`);
  }

  const shell =
    variant === "embed"
      ? "h-dvh w-full rounded-none shadow-none"
      : variant === "overlay"
        ? "h-[100dvh] w-[100dvw] rounded-none shadow-none sm:h-[min(680px,calc(100dvh-124px))] sm:w-[380px] sm:rounded-[var(--radius-widget)] lg:w-[400px]"
        : variant === "page"
          ? "min-h-[70vh] flex-1"
          : "h-[440px] max-sm:h-[520px]";

  const latestAssistant = [...messages].reverse().find((message) => message.role === "assistant");

  return (
    <section
      id={variant === "embed" ? "summit-ridge-panel" : undefined}
      className={cn("chat-widget-shell relative flex flex-col text-[14.5px] leading-[22px]", shell, className)}
      aria-label="Summit Ridge chat"
      data-testid={variant === "frame" ? "landing-hero-chat" : "chat-widget"}
      onDragOver={(event) => {
        event.preventDefault();
        setDrop(true);
      }}
      onDragLeave={() => setDrop(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDrop(false);
        if (event.dataTransfer.files.length) addFiles(event.dataTransfer.files);
      }}
    >
      <div className="h-0.5 bg-[var(--accent)]" />
      <header data-testid="chat-header" className="flex h-16 items-center justify-between gap-2 border-b border-[var(--border)] px-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="relative grid size-7 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
            {joined ? <span className="text-[11px] font-semibold">ME</span> : <BrandMark className="size-4" />}
            {!joined && <span className="absolute right-0 bottom-0 size-2 rounded-full bg-[var(--success)] ring-2 ring-[var(--surface)]" />}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[15px] leading-5 font-semibold tracking-[-0.01em]">{joined ? BRAND.human : `${BRAND.bot} · Summit Ridge`}</span>
            <span className="flex items-center gap-1 truncate text-[12px] leading-4 text-[var(--muted-foreground)]">
              <span className="size-1.5 rounded-full bg-[var(--success)]" aria-hidden />
              {joined ? "Human specialist" : "Online 24/7"}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span data-testid="mode-pill" className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] font-medium">
            {provider === "Groq" || provider === "Gemini" ? "Live AI" : "Demo mode"}
          </span>
          <IconButton label="Chat menu" onClick={() => setMenuOpen((open) => !open)}>
            <MoreHorizontal className="size-4" strokeWidth={1.75} />
          </IconButton>
          {onClose && (
            <IconButton label="Close chat" onClick={onClose}>
              <X className="size-4" strokeWidth={1.75} />
            </IconButton>
          )}
        </div>
        {menuOpen && (
          <div className="absolute top-14 right-3 z-10 w-48 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-card)]" data-testid="chat-menu">
            <MenuItem label="New chat" onClick={() => { setMenuOpen(false); reset(); }} />
            <MenuItem
              testId="theme-toggle"
              label={resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
              onClick={() => {
                setTheme(resolvedTheme === "dark" ? "light" : "dark");
                setMenuOpen(false);
              }}
            />
            <MenuItem label="Talk to a human" onClick={() => { setMenuOpen(false); void send("I would like to talk to a human."); }} />
          </div>
        )}
      </header>
      {urgent && (
        <div data-testid="urgent-banner" className="border-b border-[var(--danger)] bg-[color-mix(in_srgb,var(--danger)_12%,var(--surface))] px-4 py-2 text-[12.5px] text-[var(--danger)]" role="alert">
          This needs a person now. The demo desk is alerted. If someone is in danger, call 911.
        </div>
      )}
      {messages.some((message) => message.desk?.cards.some((card) => card.kind === "handoff")) && (
        <div data-testid="handoff-banner" className="border-b border-[var(--info)] bg-[var(--accent-soft)] px-4 py-2 text-[12.5px]">
          {joined ? `${BRAND.human} joined` : "Connecting you to a person…"}
        </div>
      )}
      <div className="sr-only" role="status" aria-live="polite">
        {status}
      </div>
      <div ref={scroller} tabIndex={0} data-testid="chat-messages" className="relative flex-1 space-y-3 overflow-y-auto px-4 py-4" role="log" aria-label="Messages" aria-relevant="additions" aria-live="off" onScroll={onScroll}>
        {messages.length === 0 && !liveText && !phase && (
          <div className="space-y-3">
            <p>{BRAND.greeting}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {BRAND.starters.map((starter) => {
                const Icon = STARTER_ICONS[starter.icon];
                return (
                  <button
                    key={starter.label}
                    type="button"
                    className="flex min-h-11 items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left text-[13px] leading-4 font-medium hover:bg-[var(--accent-soft)]"
                    onClick={() => void send(starter.prompt)}
                  >
                    <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                    {starter.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {messages.map((message) => (
          <MessageView
            key={message.id}
            message={message}
            files={filesFor[message.id]}
            latest={message.id === latestAssistant?.id}
            feedback={feedback[message.id]}
            onFeedback={(value) => setFeedback((current) => ({ ...current, [message.id]: value }))}
            onCopy={async () => {
              await navigator.clipboard.writeText(message.content);
              setFeedback((current) => ({ ...current, [message.id]: "copied" }));
              window.setTimeout(() => setFeedback((current) => (current[message.id] === "copied" ? { ...current, [message.id]: undefined as never } : current)), 2000);
            }}
            onRetry={() => {
              const prior = [...messages].reverse().find((item) => item.role === "user");
              if (prior) void send(prior.content.replace(/\n\n\[Attached:[^\]]+\]/, ""));
            }}
            onSuggest={(value) => void send(value)}
            onBookListing={bookListing}
            onBookSlot={bookSlot}
            showActions={message.role === "assistant"}
          />
        ))}
        {phase && (
          <p data-testid="phase-indicator" className="flex items-center gap-2 text-[13px] text-[var(--muted-foreground)]">
            <span className="inline-flex gap-1" aria-hidden>
              <span className="phase-dot size-1.5 rounded-full bg-current" />
              <span className="phase-dot size-1.5 rounded-full bg-current [animation-delay:150ms]" />
              <span className="phase-dot size-1.5 rounded-full bg-current [animation-delay:300ms]" />
            </span>
            {windowLabel(phase)}
          </p>
        )}
        {liveText !== null && (
          <article data-testid="message-assistant" aria-busy="true" aria-label="Summit Ridge desk" data-streaming="true" className="mr-1">
            <p className="whitespace-pre-wrap">
              {liveText}
              <span className="stream-caret" aria-hidden />
            </p>
          </article>
        )}
        {skeletons.map((kind, index) => (
          <CardSkeleton key={`${kind}-${index}`} kind={kind} />
        ))}
        {stopped && liveText && <p className="text-[11.5px] text-[var(--muted-foreground)]">Stopped</p>}
        {error && (
          <p className="rounded-2xl border border-[var(--danger)] px-3 py-2 text-[13px] text-[var(--danger)]" role="alert">
            {error}
            <button type="button" className="ml-2 underline" onClick={() => void send(draft)}>
              Retry send
            </button>
          </p>
        )}
      </div>
      {showJump && (
        <button
          type="button"
          data-testid="jump-to-latest"
          className="absolute bottom-28 left-1/2 grid size-9 -translate-x-1/2 place-items-center rounded-full border bg-[var(--surface)] shadow-[var(--shadow-card)]"
          onClick={() => {
            stick.current = true;
            setShowJump(false);
            scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
          }}
        >
          <ArrowDown className="size-4" strokeWidth={1.75} />
          <span className="sr-only">Jump to latest</span>
        </button>
      )}
      {drop && <div className="pointer-events-none absolute inset-3 grid place-items-center rounded-3xl border border-dashed border-[var(--accent)] bg-[var(--accent-soft)] text-[13px]">Drop to attach</div>}
      <form
        data-testid="composer"
        className="border-t border-[var(--border)] px-3 pt-2 pb-1"
        onSubmit={(event) => {
          event.preventDefault();
          if (streaming) {
            abortRef.current?.abort();
            return;
          }
          void send(draft);
        }}
      >
        {files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {files.map((file) => (
              <span key={file.id} className="flex items-center gap-2 rounded-xl border bg-[var(--surface-2)] pr-1 pl-1 text-[12px]">
                {file.type.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={file.url} alt="" className="size-12 rounded-lg object-cover" />
                ) : (
                  <FileText className="size-4" strokeWidth={1.75} />
                )}
                <span className="max-w-32 truncate">{file.name}</span>
                <button type="button" aria-label={`Remove ${file.name}`} className="grid size-8 place-items-center" onClick={() => setFiles((current) => current.filter((item) => item.id !== file.id))}>
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex items-end gap-1 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] py-1 pr-1 pl-2">
          <input
            ref={fileRef}
            data-testid="composer-attach"
            className="sr-only"
            aria-label="Attach a file"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            multiple
            onChange={(event) => {
              if (event.target.files) addFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <IconButton label="Attach a file" onClick={() => fileRef.current?.click()}>
            <Paperclip className="size-5" strokeWidth={1.75} />
          </IconButton>
          <label className="sr-only" htmlFor={inputId}>
            Message Summit Ridge
          </label>
          <textarea
            id={inputId}
            ref={inputRef}
            data-testid="composer-input"
            value={draft}
            rows={1}
            placeholder={listening ? "Listening…" : joined ? BRAND.humanPlaceholder : BRAND.placeholder}
            className="max-h-36 min-h-8 flex-1 resize-none bg-transparent py-1.5 text-[14.5px] leading-[22px] outline-none"
            onChange={(event) => {
              setDraft(event.target.value);
              event.target.style.height = "auto";
              event.target.style.height = `${Math.min(event.target.scrollHeight, 144)}px`;
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (streaming) abortRef.current?.abort();
                else void send(draft);
              }
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                void send(draft);
              }
            }}
          />
          <button
            type="button"
            data-testid="composer-mic"
            className={cn("grid size-8 place-items-center rounded-full", listening && "mic-pulse ring-2 ring-[var(--accent)]")}
            aria-pressed={listening}
            aria-label={listening ? "Stop dictation" : "Start dictation"}
            onClick={() => toggleMic(listening, setListening, setDraft, setToast)}
          >
            <Mic className="size-5" strokeWidth={1.75} />
          </button>
          {streaming ? (
            <button type="submit" data-testid="composer-stop" className="grid size-8 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)]" aria-label="Stop generating">
              <Square className="size-2.5 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              data-testid="composer-send"
              className="grid size-8 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] disabled:opacity-40"
              aria-disabled={!draft.trim() && files.length === 0}
              disabled={!draft.trim() && files.length === 0}
              aria-label="Send"
            >
              <ArrowUp className="size-4" strokeWidth={1.75} />
            </button>
          )}
        </div>
        <button type="button" className="px-1 pt-1 text-left text-[12px] text-[var(--accent)] underline" onClick={() => setLeadOpen((open) => !open)}>
          Leave contact details for the team
        </button>
        {leadOpen && <div className="py-2"><LeadCard onSubmit={(value) => { setLeadOpen(false); void send(value); }} /></div>}
        <p className="px-1 py-1 text-[11.5px] leading-4 text-[var(--muted-foreground)]">
          AI assistant · Portfolio demo · Privacy.{" "}
          <button type="button" className="underline" onClick={() => void send("I would like to talk to a human.")}>
            Talk to a person
          </button>
          . {BRAND.disclaimer}
        </p>
        <p className="sr-only">Model: {provider}. No live MLS.</p>
      </form>
      {toast && (
        <p className="absolute right-3 bottom-24 left-3 rounded-xl border bg-[var(--surface)] px-3 py-2 text-[12.5px] shadow-[var(--shadow-card)]" role="status">
          {toast}
        </p>
      )}
    </section>
  );
}

function MessageView({
  message,
  files,
  latest,
  feedback,
  showActions,
  onFeedback,
  onCopy,
  onRetry,
  onSuggest,
  onBookListing,
  onBookSlot,
}: {
  message: ChatMessage;
  files?: Attachment[];
  latest: boolean;
  feedback?: "up" | "down" | "copied";
  showActions: boolean;
  onFeedback: (value: "up" | "down") => void;
  onCopy: () => void;
  onRetry: () => void;
  onSuggest: (value: string) => void;
  onBookListing: (listing: Listing) => void;
  onBookSlot: (address: string | undefined, listingId: string | undefined, label: string) => void;
}) {
  const time = clock(message.createdAt);
  const user = message.role === "user";
  return (
    <article
      data-testid={user ? "message-user" : "message-assistant"}
      aria-label={`${user ? "You" : "Summit Ridge desk"}, ${time}`}
      className={cn("group", user ? "ml-auto max-w-[82%]" : "mr-1")}
    >
      {files && files.length > 0 && (
        <div className="mb-1 flex justify-end gap-1">
          {files.map((file) =>
            file.type.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={file.id} src={file.url} alt={file.name} className="size-12 rounded-lg object-cover" />
            ) : (
              <span key={file.id} className="rounded-lg border px-2 py-1 text-[12px]">
                {file.name}
              </span>
            ),
          )}
        </div>
      )}
      {user ? (
        <p className="rounded-[18px] rounded-br-[4px] bg-[var(--accent)] px-3 py-2 text-[var(--accent-foreground)] whitespace-pre-wrap">{message.content.replace(/\n\n\[Attached:[^\]]+\]/, "")}</p>
      ) : (
        <div className="space-y-3">
          <p className="whitespace-pre-wrap">{message.content}</p>
          {message.toolCalls && message.toolCalls.length > 0 && (
            <ul className="space-y-1">
              {message.toolCalls.map((call, index) => (
                <li key={`${call.name}-${index}`} className="flex h-10 items-center justify-between rounded-xl border border-[var(--border)] px-3 text-[13px]">
                  <span className="font-mono text-[12px]">{call.name}</span>
                  <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[11.5px]">Done</span>
                </li>
              ))}
            </ul>
          )}
          {message.qualification && (
            <p className="text-[13px]">
              Score <span className="font-mono">{message.qualification.score}</span> · {message.qualification.tier}
            </p>
          )}
          {message.desk?.cards.map((card, index) => (
            <DeskCardView key={`${card.kind}-${index}`} card={card} onBookListing={onBookListing} onBookSlot={onBookSlot} onSuggest={onSuggest} />
          ))}
          {message.citations && message.citations.length > 0 && <CitationRow citations={message.citations} />}
          {latest && (
            <div className="flex flex-wrap gap-2" data-testid="follow-up-chips">
              {followUps(message).map((suggestion) => (
                <button key={suggestion} type="button" data-testid="quick-reply" className="min-h-9 max-w-full rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 text-left text-[13px] leading-4 font-medium" onClick={() => onSuggest(suggestion)}>
                  {suggestion.length > 72 ? `${suggestion.slice(0, 69)}…` : suggestion}
                </button>
              ))}
            </div>
          )}
          {showActions && (
            <div className="flex flex-wrap gap-1" data-testid="message-actions">
              <ActionButton label={feedback === "copied" ? "Copied" : "Copy"} onClick={onCopy}>
                {feedback === "copied" ? <Check className="size-3.5" /> : <span>Copy</span>}
              </ActionButton>
              <ActionButton label="Regenerate" onClick={onRetry}>
                <span>Regenerate</span>
              </ActionButton>
              <ActionButton label="Thumbs up" pressed={feedback === "up"} onClick={() => onFeedback("up")}>
                <ThumbsUp className="size-3.5" strokeWidth={1.75} />
                <span>Up</span>
              </ActionButton>
              <ActionButton label="Thumbs down" pressed={feedback === "down"} onClick={() => onFeedback("down")}>
                <ThumbsDown className="size-3.5" strokeWidth={1.75} />
                <span>Down</span>
              </ActionButton>
              {message.citations && message.citations.length > 0 && (
                <ActionButton label="Sources" onClick={() => document.querySelector<HTMLButtonElement>("[data-testid='citation-chip']")?.focus()}>
                  <span>Sources</span>
                </ActionButton>
              )}
            </div>
          )}
        </div>
      )}
      <time dateTime={message.createdAt || undefined} className="mt-1 block text-[11.5px] text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
        {time}
      </time>
    </article>
  );
}

function DeskCardView({
  card,
  onBookListing,
  onBookSlot,
  onSuggest,
}: {
  card: DeskCard;
  onBookListing: (listing: Listing) => void;
  onBookSlot: (address: string | undefined, listingId: string | undefined, label: string) => void;
  onSuggest: (value: string) => void;
}) {
  if (card.kind === "carousel") return <ListingCarousel listings={card.listings} onBook={onBookListing} />;
  if (card.kind === "listing") return <ListingDetailCard listing={card.listing} onBook={onBookListing} />;
  if (card.kind === "slots") return <SlotPicker address={card.address} slots={card.slots} onBook={(slot) => onBookSlot(card.address, card.listingId, slot.label)} />;
  if (card.kind === "qualify") return <QualifyForm onSubmit={onSuggest} />;
  if (card.kind === "quote") return <QuoteCard card={card} />;
  if (card.kind === "confirm") return <ConfirmCard card={card} />;
  if (card.kind === "refusal") return <RefusalCard />;
  if (card.kind === "handoff") return <HandoffCard ticketId={card.ticketId} />;
  return null;
}

function followUps(message: ChatMessage): string[] {
  const merged = [...(message.suggestions ?? [])];
  for (const extra of ["What are your buyer fees?", "Talk to a person"]) {
    if (merged.length >= 3) break;
    if (!merged.some((item) => item.toLowerCase().includes(extra.slice(0, 10).toLowerCase()))) merged.push(extra);
  }
  return merged.slice(0, 3);
}

function ActionButton({ children, label, onClick, pressed }: { children: React.ReactNode; label: string; onClick: () => void; pressed?: boolean }) {
  return (
    <button type="button" title={label} aria-label={label} aria-pressed={pressed} className="inline-flex min-h-8 items-center gap-1 rounded-full px-2 text-[12px] text-[var(--muted-foreground)] hover:bg-[var(--muted)]" onClick={onClick}>
      {children}
    </button>
  );
}

function MenuItem({ label, onClick, testId }: { label: string; onClick: () => void; testId?: string }) {
  return (
    <button type="button" data-testid={testId} className="block w-full rounded-xl px-3 py-2 text-left text-[13px] hover:bg-[var(--muted)]" onClick={onClick}>
      {label}
    </button>
  );
}

function IconButton({ children, label, onClick, pressed, testId }: { children: React.ReactNode; label: string; onClick: () => void; pressed?: boolean; testId?: string }) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-label={label}
      aria-pressed={pressed}
      className="grid size-8 place-items-center rounded-full text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function phaseFor(text: string): string {
  if (/talk to|person|human|agent/i.test(text)) return "Opening a handoff…";
  if (/book|showing|schedule/i.test(text)) return "Checking the calendar…";
  if (/fee|commission|open house|policy|process|fair housing/i.test(text)) return "Looking in the brokerage notes…";
  if (/worth|value|avm/i.test(text)) return "Running the mock value…";
  if (/bed|listing|home|search|under|highlands/i.test(text)) return "Searching the catalog…";
  return "Checking the desk…";
}

function windowLabel(phase: string): string {
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "Working";
  return phase;
}

function clock(iso: string): string {
  if (typeof document !== "undefined" && document.documentElement.dataset.visualTest === "1") return "12:00 PM";
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

async function pace(text: string, onChunk: (value: string) => void, signal: AbortSignal) {
  const words = text.split(/(\s+)/);
  const groups: string[] = [];
  let buffer = "";
  let count = 0;
  for (const part of words) {
    buffer += part;
    if (part.trim()) count += 1;
    if (count >= 3) {
      groups.push(buffer);
      buffer = "";
      count = 0;
    }
  }
  if (buffer) groups.push(buffer);
  const delay = Math.min(24, Math.max(8, Math.floor(700 / Math.max(groups.length, 1))));
  let shown = "";
  for (const group of groups) {
    if (signal.aborted) return;
    shown += group;
    onChunk(shown);
    await sleep(delay, signal);
  }
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => resolve(), ms);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Stopped", "AbortError"));
      },
      { once: true },
    );
  });
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
      const event = JSON.parse(line.slice(6)) as { type?: string; text?: string; turn?: TurnView };
      if (event.type === "done" && event.turn) turn = event.turn;
    }
  }
  if (!turn) throw new Error("The desk could not answer.");
  return turn;
}

function toggleMic(listening: boolean, setListening: (value: boolean) => void, setDraft: (value: string | ((current: string) => string)) => void, setToast: (value: string | null) => void) {
  if (listening) {
    setListening(false);
    return;
  }
  const speechWindow = window as Window & { SpeechRecognition?: new () => SpeechHandle; webkitSpeechRecognition?: new () => SpeechHandle };
  const Ctor = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
  if (!Ctor) {
    setToast("Voice input isn't available in this browser. Type instead.");
    window.setTimeout(() => setToast(null), 4000);
    return;
  }
  const rec = new Ctor();
  rec.lang = "en-US";
  rec.interimResults = true;
  rec.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map((result) => result[0]?.transcript ?? "")
      .join(" ");
    setDraft(transcript);
  };
  rec.onerror = () => {
    setListening(false);
    setToast("Voice input isn't available in this browser. Type instead.");
    window.setTimeout(() => setToast(null), 4000);
  };
  rec.onend = () => setListening(false);
  try {
    rec.start();
    setListening(true);
  } catch {
    setToast("Voice input isn't available in this browser. Type instead.");
    window.setTimeout(() => setToast(null), 4000);
  }
}

type SpeechHandle = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
};
