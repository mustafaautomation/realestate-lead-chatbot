"use client";

import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Copy } from "lucide-react";
import { ListingArt } from "@/components/listing-art";
import { money } from "@/lib/format";
import type { Citation, DeskCard, Listing } from "@/lib/types";
import { cn } from "@/lib/utils";

const cardClass = "w-full rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-card)]";

export function CardSkeleton({ kind }: { kind: DeskCard["kind"] }) {
  const tall = kind === "carousel" || kind === "listing" || kind === "slots";
  return (
    <div className={cn(cardClass, "animate-pulse")} aria-hidden data-testid="card-skeleton">
      <div className={cn("rounded-xl bg-[var(--muted)]", tall ? "h-36" : "h-16")} />
      <div className="mt-3 h-3 w-2/3 rounded bg-[var(--muted)]" />
      <div className="mt-2 h-3 w-1/2 rounded bg-[var(--muted)]" />
    </div>
  );
}

export function ListingCarousel({
  listings,
  onBook,
}: {
  listings: Listing[];
  onBook: (listing: Listing) => void;
}) {
  const scrollerId = "listing-carousel";
  function scrollByCard(direction: number) {
    document.getElementById(scrollerId)?.scrollBy({ left: direction * 240, behavior: "smooth" });
  }
  return (
    <div className="relative" data-testid="card-carousel">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[14px] font-semibold leading-5">Homes that match</p>
        <div className="hidden gap-1 sm:flex">
          <button type="button" className="grid size-7 place-items-center rounded-full border bg-[var(--surface)]" aria-label="Previous listings" onClick={() => scrollByCard(-1)}>
            <ChevronLeft className="size-4" strokeWidth={1.75} />
          </button>
          <button type="button" className="grid size-7 place-items-center rounded-full border bg-[var(--surface)]" aria-label="Next listings" onClick={() => scrollByCard(1)}>
            <ChevronRight className="size-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
      <div id={scrollerId} className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
        {listings.map((listing) => (
          <article key={listing.id} className="w-[232px] shrink-0 snap-start overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] dark:border-white/15">
            <div className="aspect-[16/10] overflow-hidden border-b border-[var(--border)] dark:border-white/10">
              <ListingArt id={listing.id} neighborhood={listing.neighborhood} label={listing.address} />
            </div>
            <div className="space-y-1 p-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-1 text-[14px] font-semibold leading-5">{listing.address}</h3>
                {listing.openHouse && <span className="shrink-0 rounded-full bg-[var(--brass)] px-2 py-0.5 text-[11px] font-medium text-[#1a2420]">Open house</span>}
              </div>
              <p className="font-mono text-[13px] tabular-nums text-[var(--brass)]">{money(listing.price)} · {listing.id}</p>
              <p className="text-[12px] text-[var(--muted-foreground)]">
                {listing.beds} bd · {listing.baths} ba · {listing.sqft.toLocaleString()} sqft
              </p>
              <button type="button" className="mt-2 min-h-11 w-full rounded-[var(--radius-control)] bg-[var(--accent)] px-3 text-[13px] font-medium text-[var(--accent-foreground)]" onClick={() => onBook(listing)}>
                Book showing
              </button>
            </div>
          </article>
        ))}
        <div className="w-4 shrink-0" aria-hidden />
      </div>
    </div>
  );
}

export function ListingDetailCard({ listing, onBook }: { listing: Listing; onBook: (listing: Listing) => void }) {
  return (
    <article className={cn(cardClass, "overflow-hidden p-0")} data-testid="card-listing">
      <div className="aspect-[16/10] border-b border-[var(--border)] dark:border-white/10">
        <ListingArt id={listing.id} neighborhood={listing.neighborhood} label={listing.address} />
      </div>
      <div className="space-y-2 p-3">
        <p className="font-mono text-[11.5px] text-[var(--muted-foreground)]">{listing.id}</p>
        <h3 className="text-[14px] font-semibold leading-5">{listing.address}</h3>
        <p className="font-mono text-[13px] text-[var(--brass)]">{money(listing.price)}</p>
        <p className="text-[12.5px] text-[var(--muted-foreground)]">
          {listing.neighborhood} · {listing.beds} bd · {listing.baths} ba · {listing.sqft.toLocaleString()} sqft
        </p>
        <button type="button" className="min-h-11 rounded-[var(--radius-control)] bg-[var(--accent)] px-3 text-[13px] font-medium text-[var(--accent-foreground)]" onClick={() => onBook(listing)}>
          Book a showing
        </button>
      </div>
    </article>
  );
}

export function SlotPicker({
  address,
  slots,
  onBook,
}: {
  address?: string;
  slots: { id: string; label: string; weekday: string; startsAt: string }[];
  onBook: (slot: { id: string; label: string }) => void;
}) {
  const [slotId, setSlotId] = useState<string | null>(null);
  const selected = slots.find((slot) => slot.id === slotId);
  const heading = slots[0] ? `Open times · ${slots[0].label.split("·")[0]?.trim()}` : "Open times";
  return (
    <div className={cardClass} data-testid="card-booking">
      <h3 className="text-[14px] font-semibold leading-5">{heading}</h3>
      {address && <p className="mt-1 text-[12px] text-[var(--muted-foreground)]">{address} · America/Denver</p>}
      <div className="mt-3 flex flex-wrap gap-2" data-testid="slot-chips">
        {slots.map((slot) => (
          <button
            key={slot.id}
            type="button"
            data-testid="slot-chip"
            className={cn(
              "min-h-11 rounded-xl border px-3 text-[13px] font-medium",
              slot.id === slotId ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-[var(--surface)]",
            )}
            onClick={() => setSlotId(slot.id)}
          >
            {slot.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[11.5px] text-[var(--muted-foreground)]">Only times the booking system returned</p>
      <button
        type="button"
        className="mt-3 min-h-11 rounded-[var(--radius-control)] bg-[var(--accent)] px-3 text-[13px] font-medium text-[var(--accent-foreground)] disabled:opacity-40"
        disabled={!selected}
        onClick={() => selected && onBook(selected)}
      >
        {selected ? `Book ${selected.label}` : "Book a time"}
      </button>
    </div>
  );
}

export function LeadCard({ onSubmit }: { onSubmit: (prompt: string) => void }) {
  const [name, setName] = useState("Alex Rivera");
  const [phone, setPhone] = useState("303-555-0148");
  const [email, setEmail] = useState("alex.rivera@example.com");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  function submit() {
    if (!consent) {
      setError("Check consent before the desk keeps these details.");
      return;
    }
    if (!name.trim() || !email.includes("@") || phone.replace(/\D/g, "").length < 10) {
      setError("Add a name, a 555 phone number, and an email.");
      return;
    }
    onSubmit(`My name is ${name.trim()}, email ${email.trim()}, phone ${phone.trim()}. You can use these details for the showing.`);
  }
  return (
    <div className={cardClass} data-testid="card-lead">
      <h3 className="text-[14px] font-semibold leading-5">Leave contact details for the team</h3>
      <label className="mt-2 block text-[12px] font-medium">
        Name
        <input className="mt-1 h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3" value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label className="mt-2 block text-[12px] font-medium">
        Phone
        <input className="mt-1 h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="555-010-0140" />
      </label>
      <label className="mt-2 block text-[12px] font-medium">
        Email
        <input className="mt-1 h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="maya.chen@example.com" />
      </label>
      <label className="mt-3 flex items-start gap-2 text-[12.5px]">
        <input type="checkbox" className="mt-1" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
        The desk may keep this synthetic contact on the demo ticket. Nothing is emailed.
      </label>
      {error && (
        <p className="mt-2 text-[12px] text-[var(--danger)]" role="alert">
          {error}
        </p>
      )}
      <button type="button" className="mt-3 min-h-11 rounded-[var(--radius-control)] bg-[var(--accent)] px-3 text-[13px] font-medium text-[var(--accent-foreground)]" onClick={submit}>
        Save for the team
      </button>
    </div>
  );
}

export function QualifyForm({ onSubmit }: { onSubmit: (prompt: string) => void }) {
  const [pre, setPre] = useState("Already approved");
  const [when, setWhen] = useState("30 days");
  const [why, setWhy] = useState("Relocating for work");
  function submit() {
    const approval =
      pre === "Paying cash" ? "I'm paying cash" : pre === "In process" ? "My pre-approval is in process" : pre === "Not yet" ? "I'm not pre-approved" : "Yes, I'm pre-approved";
    const timeline = when === "30 days" ? "I want to move within 30 days" : when === "90 days" ? "I want to move within 90 days" : when === "6 months" ? "I'm looking over 6 months" : "I'm just browsing";
    onSubmit(`${approval}. ${why} and ${timeline}.`);
  }
  return (
    <form
      className={cardClass}
      data-testid="card-form"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <h3 className="text-[14px] font-semibold leading-5">Qualify this search</h3>
      <p className="mt-1 text-[12px] text-[var(--muted-foreground)]">Budget, timeline, and pre-approval. Hot, warm, or cold stays a quiet score.</p>
      <ChipRow label="Pre-approval" value={pre} options={["Already approved", "In process", "Paying cash", "Not yet"]} onChange={setPre} />
      <ChipRow label="Timeline" value={when} options={["30 days", "90 days", "6 months", "Browsing"]} onChange={setWhen} />
      <ChipRow label="Why now" value={why} options={["Relocating for work", "First-time buyer", "Just browsing"]} onChange={setWhy} />
      <button type="submit" className="mt-3 min-h-11 rounded-[var(--radius-control)] bg-[var(--accent)] px-3 text-[13px] font-medium text-[var(--accent-foreground)]">
        Score this lead
      </button>
    </form>
  );
}

function ChipRow({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <fieldset className="mt-3">
      <legend className="text-[12px] font-medium">{label}</legend>
      <div className="mt-1 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={option === value}
            className={cn(
              "min-h-9 rounded-full border px-3 text-[13px]",
              option === value ? "border-transparent bg-[var(--accent-soft)] text-[var(--foreground)]" : "border-[var(--border)]",
            )}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function QuoteCard({ card }: { card: Extract<DeskCard, { kind: "quote" }> }) {
  return (
    <div className={cardClass} data-testid="card-quote">
      <h3 className="text-[14px] font-semibold leading-5">{card.title}</h3>
      <dl className="mt-2 space-y-1 text-[13px]">
        {card.rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-3">
            <dt>{row.label}</dt>
            <dd className="font-mono tabular-nums">{row.amount}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-2 flex justify-between border-t border-[var(--border)] pt-2 text-[18px] font-semibold">
        <span>High</span>
        <span className="font-mono tabular-nums">{card.total}</span>
      </div>
      <p className="mt-2 text-[11.5px] text-[var(--muted-foreground)]">{card.note}</p>
    </div>
  );
}

export function ConfirmCard({ card }: { card: Extract<DeskCard, { kind: "confirm" }> }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(card.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }
  const ics = `data:text/calendar;charset=utf-8,${encodeURIComponent(
    `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${card.startsAt.replace(/[-:]/g, "").replace(".000", "")}\nSUMMARY:Showing at ${card.where}\nLOCATION:${card.where}\nEND:VEVENT\nEND:VCALENDAR`,
  )}`;
  return (
    <div className={cardClass} data-testid="card-confirm">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-full bg-[color-mix(in_srgb,var(--success)_16%,var(--surface))] text-[var(--success)]">
          <Check className="size-4" strokeWidth={1.75} />
        </span>
        <h3 className="text-[14px] font-semibold leading-5">You&apos;re booked</h3>
      </div>
      <dl className="mt-3 space-y-1 text-[13px]">
        <Row label="Code" value={card.code} mono action={<button type="button" className="grid size-8 place-items-center" aria-label="Copy confirmation code" onClick={() => void copy()}>{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" strokeWidth={1.75} />}</button>} />
        <Row label="When" value={card.when} />
        <Row label="Where" value={card.where} />
        <Row label="Who" value={card.who} />
      </dl>
      <a className="mt-3 inline-flex min-h-11 items-center rounded-[var(--radius-control)] border border-[var(--border)] px-3 text-[13px] font-medium" href={ics} download="showing.ics">
        Add to calendar
      </a>
    </div>
  );
}

function Row({ label, value, mono, action }: { label: string; value: string; mono?: boolean; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[var(--muted-foreground)]">{label}</dt>
      <dd className={cn("flex items-center gap-1 text-right", mono && "font-mono text-[13px]")}>{value}{action}</dd>
    </div>
  );
}

export function RefusalCard() {
  return (
    <div className={cardClass} data-testid="card-refusal">
      <h3 className="text-[14px] font-semibold leading-5">We don&apos;t steer</h3>
      <p className="mt-1 text-[13.5px] leading-[22px] text-[var(--foreground)]">
        Summit Ridge will not screen homes by who lives nearby, and it will not rank school quality. Say the price, size, type, and area you want.
      </p>
    </div>
  );
}

export function HandoffCard({ ticketId }: { ticketId: string }) {
  return (
    <div className={cn(cardClass, "border-[var(--info)]")} data-testid="card-timeline">
      <p className="text-[11.5px] font-medium tracking-wide text-[var(--info)] uppercase">Handoff</p>
      <h3 className="mt-1 text-[14px] font-semibold leading-5">Connecting you with the Summit Ridge desk</h3>
      <p className="mt-1 text-[13px] leading-5 text-[var(--muted-foreground)]">
        In this demo, the ticket appears in /admin. A specialist usually replies in a few minutes.
      </p>
      <p className="mt-2 font-mono text-[13px]">{ticketId}</p>
    </div>
  );
}

export function CitationRow({ citations }: { citations: Citation[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11.5px] text-[var(--muted-foreground)]">Sources</span>
      {citations.slice(0, 3).map((citation) => {
        const open = openId === citation.id;
        return (
          <span key={citation.id} className="relative">
            <button
              type="button"
              data-testid="citation-chip"
              className="min-h-8 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 text-[12px] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
              aria-expanded={open}
              onMouseEnter={() => setOpenId(citation.id)}
              onMouseLeave={() => setOpenId((current) => (current === citation.id ? null : current))}
              onFocus={() => setOpenId(citation.id)}
              onBlur={() => setOpenId((current) => (current === citation.id ? null : current))}
              onKeyDown={(event) => {
                if (event.key === "Escape") setOpenId(null);
              }}
              onClick={() => setOpenId((current) => (current === citation.id ? null : citation.id))}
            >
              {citation.title}
            </button>
            {open && (
              <div data-testid="citation-preview" role="dialog" aria-label={citation.title} className="absolute bottom-full left-0 z-10 mb-2 w-64 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-card)]">
                <p className="text-[14px] font-semibold leading-5">{citation.title}</p>
                <p className="mt-1 line-clamp-3 text-[13px] leading-5">{citation.excerpt}</p>
                <a className="mt-2 inline-block text-[13px] text-[var(--accent)] underline" href={`/kb/${citation.id}`} target="_blank" rel="noreferrer">
                  Open source <span className="sr-only">(opens in a new tab)</span>
                </a>
              </div>
            )}
          </span>
        );
      })}
    </div>
  );
}
