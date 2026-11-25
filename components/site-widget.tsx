"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { ChatWidget } from "@/components/chat/chat-widget";
import { BRAND } from "@/lib/brand";

const EASE = [0.22, 1, 0.36, 1] as const;

export function SiteWidgetGate() {
  const pathname = usePathname();
  if (pathname === "/embed" || pathname === "/embed-demo") return null;
  return <SiteWidget immediatePills={pathname === "/embed-demo" || pathname === "/"} />;
}

function SiteWidget({ immediatePills }: { immediatePills: boolean }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [pills, setPills] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [prompt, setPrompt] = useState<{ id: number; text: string } | null>(null);
  const [unread, setUnread] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const pillsGone = window.sessionStorage.getItem("summit-ridge-nudges") === "off";
    const teaserGone = window.localStorage.getItem("summit-ridge-teaser") === "off";
    const delay = reduce || immediatePills ? 0 : 1200;
    const teaserDelay = reduce ? 0 : 4000;
    const pillTimer = window.setTimeout(() => setPills(!pillsGone), delay);
    const teaserTimer = window.setTimeout(() => {
      if (immediatePills) setTeaser(!teaserGone);
    }, teaserDelay);
    function onAsk(event: Event) {
      const text = (event as CustomEvent<string>).detail;
      setOpen(true);
      setPrompt({ id: Date.now(), text });
    }
    function onUrgent() {
      setToast("Desk alerted");
      window.setTimeout(() => setToast(null), 5000);
    }
    window.addEventListener("summit-ask", onAsk);
    window.addEventListener("summit-urgent", onUrgent);
    return () => {
      window.clearTimeout(pillTimer);
      window.clearTimeout(teaserTimer);
      window.removeEventListener("summit-ask", onAsk);
      window.removeEventListener("summit-urgent", onUrgent);
    };
  }, [immediatePills, reduce]);

  function ask(text: string) {
    setOpen(true);
    setPills(false);
    setTeaser(false);
    setPrompt({ id: Date.now(), text });
  }

  return (
    <>
      {toast && (
        <div data-testid="ops-toast" className="fixed top-4 right-4 z-[2147483001] max-w-xs rounded-2xl border border-[var(--danger)] bg-[var(--surface)] px-4 py-3 text-[13px] shadow-[var(--shadow-card)]" role="status">
          <p className="font-semibold text-[var(--danger)]">Desk alerted</p>
          <p className="text-[var(--muted-foreground)]">Urgent note from the chat. This demo does not send an SMS.</p>
        </div>
      )}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed z-[2147483000] max-sm:inset-0 sm:right-6 sm:bottom-[100px]"
            initial={reduce ? false : { opacity: 0, y: 18, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: reduce ? 0 : 0.28, ease: EASE }}
            style={{ transformOrigin: "bottom right" }}
          >
            <ChatWidget variant="overlay" prompt={prompt} onPromptConsumed={() => setPrompt(null)} onClose={() => { setOpen(false); setUnread(false); }} />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="fixed right-4 bottom-4 z-[2147483000] flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
        {teaser && !open && (
          <div data-testid="launcher-teaser" className="nudge-pill relative max-w-[260px] rounded-2xl px-3 py-2 text-[13px] leading-5 font-medium">
            {BRAND.teaser}
            <button
              type="button"
              className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full border bg-[var(--surface)]"
              aria-label="Dismiss teaser"
              onClick={() => {
                setTeaser(false);
                window.localStorage.setItem("summit-ridge-teaser", "off");
              }}
            >
              <X className="size-3" />
            </button>
          </div>
        )}
        {pills && !open &&
          BRAND.nudges.map((label) => (
            <button
              key={label}
              type="button"
              data-testid="launcher-nudge"
              className="nudge-pill h-9 rounded-full px-3.5 text-[13px] font-medium"
              onClick={() => ask(BRAND.nudgePrompts[label])}
            >
              {label}
            </button>
          ))}
        {pills && !open && (
          <button
            type="button"
            className="text-[12px] text-[var(--muted-foreground)]"
            onClick={() => {
              setPills(false);
              window.sessionStorage.setItem("summit-ridge-nudges", "off");
            }}
          >
            Dismiss suggestions
          </button>
        )}
        <button
          type="button"
          data-testid="chat-launcher"
          className="relative grid size-14 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[var(--shadow-launcher)] transition-transform hover:scale-105 active:scale-95 sm:size-[60px] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[var(--ring)]"
          style={{ boxShadow: "var(--shadow-launcher), inset 0 1px 0 rgba(255,255,255,0.25)" }}
          aria-label={open ? "Close chat" : "Open chat with Summit Ridge desk"}
          aria-expanded={open}
          aria-controls="summit-ridge-panel"
          onClick={() => {
            setOpen((value) => !value);
            setUnread(false);
          }}
        >
          {open ? <X className="size-[22px]" strokeWidth={2} /> : <BrandMark className="size-[22px]" />}
          {unread && !open && <span className="absolute top-1 right-1 size-2 rounded-full bg-[var(--danger)]" aria-label="1 unread" />}
        </button>
      </div>
    </>
  );
}
