"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { BRAND } from "@/lib/brand";

export default function EmbedDemoPage() {
  const { resolvedTheme, setTheme } = useTheme();
  useEffect(() => {
    if (document.querySelector("script[src='/widget.js']")) return;
    const script = document.createElement("script");
    script.src = "/widget.js";
    script.dataset.brokerage = "summit-ridge";
    script.dataset.title = "Ask Summit Ridge";
    script.dataset.theme = "system";
    document.body.appendChild(script);
  }, []);
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="bg-[var(--accent)] px-4 py-2 text-center text-[13px] text-[var(--accent-foreground)]">
        This is how the embed looks on a real site. The banner is not part of the host page.
        <button type="button" className="ml-3 underline" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
          Toggle theme
        </button>
      </div>
      <header className="border-b border-[var(--border)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <p className="font-display text-2xl">North Table Listings</p>
          <p className="text-sm text-[var(--muted-foreground)]">Sample host site</p>
        </div>
      </header>
      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-10 md:grid-cols-2">
        <div>
          <p className="text-sm tracking-wide text-[var(--brass)] uppercase">Denver sample page</p>
          <h1 className="font-display mt-2 text-4xl">Homes on the host site, chat in the corner.</h1>
          <p className="mt-3 text-[var(--muted-foreground)]">This page is not the Summit Ridge app. It loads the widget with one script tag.</p>
          <pre tabIndex={0} aria-label="Embed snippet" className="mt-4 overflow-x-auto rounded-xl bg-[var(--accent)] p-4 text-sm text-[var(--accent-foreground)]">{`<script src="/widget.js" data-brokerage="summit-ridge" data-title="Ask Summit Ridge"></script>`}</pre>
          <p className="mt-4 text-[12px] text-[var(--muted-foreground)]">{BRAND.disclaimer}</p>
        </div>
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="font-display text-2xl">2840 Boulder St</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">A pretend listing card on a host website.</p>
          <p className="mt-4 font-mono text-3xl">$599,000</p>
          <p className="mt-2">3 bedrooms · Highlands · SR-2403</p>
        </article>
      </section>
    </main>
  );
}
