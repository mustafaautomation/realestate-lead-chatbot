"use client";

import { useState } from "react";
import Link from "next/link";
import { ChatWidget } from "@/components/chat/chat-widget";
import { ListingCarousel, RefusalCard } from "@/components/chat-cards";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { BRAND } from "@/lib/brand";
import { LISTINGS } from "@/lib/listings";
import { cn } from "@/lib/utils";

const sample = LISTINGS.filter((listing) => listing.neighborhood === "Highlands" && listing.beds === 3 && listing.price <= 650000).slice(0, 3);

export default function HomePage() {
  const [preview, setPreview] = useState<"desktop" | "phone">("desktop");
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-4 py-10">
        <section className="grid items-start gap-8 lg:grid-cols-[1fr_minmax(0,440px)]">
          <div className="space-y-5">
            <p className="text-[12px] tracking-[0.16em] text-[var(--muted-foreground)] uppercase">Denver · Fictional brokerage</p>
            <h1 className="font-display max-w-xl text-[48px] leading-[1.05] sm:text-[60px]">
              Qualify the buyer <span className="italic">before</span> anyone gets in a car.
            </h1>
            <p className="max-w-xl text-[18px] leading-7 text-[var(--muted-foreground)]">
              Summit Ridge keeps 40 demo listings, a short set of brokerage notes, and a desk that will search, score, and book. It will not steer, and it will not rank schools.
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="min-h-11 rounded-full bg-[var(--accent)] px-4 text-[var(--accent-foreground)]" onClick={() => window.dispatchEvent(new CustomEvent("summit-ask", { detail: BRAND.starters[0].prompt }))}>
                Chat now
              </button>
              <Link className="inline-flex min-h-11 items-center rounded-full border border-[var(--border)] px-4" href="/embed-demo">
                See the embed
              </Link>
            </div>
            <p className="text-[13px] text-[var(--muted-foreground)]">No sign-in. The inbox at /admin is a public demo.</p>
            <div className="flex flex-wrap gap-2" data-testid="try-asking">
              {BRAND.tryAsking.map((item) => (
                <button key={item.label} type="button" className="min-h-9 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px]" onClick={() => window.dispatchEvent(new CustomEvent("summit-ask", { detail: item.prompt }))}>
                  Try asking: {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex gap-2">
              <button type="button" className={cn("rounded-full px-3 py-1 text-[12px]", preview === "desktop" ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "border")} onClick={() => setPreview("desktop")}>Desktop</button>
              <button type="button" className={cn("rounded-full px-3 py-1 text-[12px]", preview === "phone" ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "border")} onClick={() => setPreview("phone")}>Phone</button>
            </div>
            <div className={cn("mx-auto", preview === "phone" ? "max-w-[390px]" : "max-w-[440px]")}>
              <ChatWidget variant="frame" />
            </div>
            <aside data-testid="trust-panel" className="grid gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4 sm:grid-cols-2">
              <div>
                <h2 className="text-[13px] font-semibold">What it does</h2>
                <ul className="mt-2 space-y-1 text-[13px]">
                  {BRAND.does.map((item) => (
                    <li key={item}>✓ {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="text-[13px] font-semibold">What it won&apos;t do</h2>
                <ul className="mt-2 space-y-1 text-[13px]">
                  {BRAND.wont.map((item) => (
                    <li key={item}>✕ {item}</li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </section>
        <section data-testid="metrics-strip" className="grid grid-cols-2 gap-4 border-y border-[var(--border)] py-5 sm:grid-cols-4">
          {BRAND.metrics.map((item) => (
            <div key={item.label}>
              <p className="text-[12px] text-[var(--muted-foreground)]">{item.label}</p>
              <p className="text-[28px] font-semibold">{item.value}</p>
            </div>
          ))}
        </section>
        <section id="how" className="space-y-4">
          <h2 className="font-display text-3xl">How it works</h2>
          <div className="grid gap-3 text-sm md:grid-cols-4">
            {["Channel", "Retrieve", "Tools", "Desk / handoff"].map((step, index) => (
              <div key={step} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
                <p className="text-[12px] text-[var(--muted-foreground)]">0{index + 1}</p>
                <p className="text-[16px] font-semibold">{step}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="space-y-4">
          <h2 className="font-display text-3xl">What the thread can show</h2>
          <ListingCarousel listings={sample} onBook={() => window.dispatchEvent(new CustomEvent("summit-ask", { detail: "Book a showing for SR-2403" }))} />
          <RefusalCard />
        </section>
        <section className="space-y-3">
          <h2 className="font-display text-3xl">Embed</h2>
          <pre tabIndex={0} aria-label="Embed snippet" className="overflow-x-auto rounded-2xl bg-[var(--accent)] p-4 font-mono text-[13px] text-[var(--accent-foreground)]">{`<script src="https://realty-chat.quvantic.com/widget.js" data-brokerage="summit-ridge" data-title="Ask Summit Ridge"></script>`}</pre>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
