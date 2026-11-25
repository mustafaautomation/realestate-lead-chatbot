import Link from "next/link";
import { ChatPanel } from "@/components/chat-panel";
import { ListingCard } from "@/components/listing-card";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { LISTINGS } from "@/lib/listings";

export default function HomePage() {
  const sample = LISTINGS.filter((listing) => listing.neighborhood === "Highlands" && listing.beds === 3 && listing.price <= 650000).slice(0, 3);
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-4 py-10">
        <section className="grid items-start gap-8 lg:grid-cols-[1fr_minmax(0,460px)]">
          <div className="space-y-5">
            <p className="text-sm tracking-[0.16em] text-accent-foreground uppercase">Denver · Fictional brokerage</p>
            <h1 className="max-w-xl font-heading text-4xl leading-tight sm:text-5xl">Qualify the buyer before anyone gets in a car.</h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Summit Ridge keeps 40 demo listings, a short set of brokerage notes, and a desk that will search, score, and book. It will not steer, and it will not rank schools.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link className={buttonVariants({ size: "lg" })} href="/chat">
                Open the full chat
              </Link>
              <Link className={buttonVariants({ size: "lg", variant: "outline" })} href="/listings">
                Browse the catalog
              </Link>
            </div>
            <dl className="grid max-w-lg grid-cols-3 gap-3 pt-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Catalog</dt>
                <dd className="font-heading text-2xl">40</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Tools</dt>
                <dd className="font-heading text-2xl">8</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Tiers</dt>
                <dd className="font-heading text-2xl">3</dd>
              </div>
            </dl>
          </div>
          <ChatPanel />
        </section>
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-heading text-3xl">Highlands, 3 bedrooms, under $650k</h2>
            <Link href="/listings" className="text-sm underline">
              All listings
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {sample.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
        <section className="grid gap-6 md:grid-cols-3">
          <div>
            <h2 className="font-heading text-2xl">Search</h2>
            <p className="mt-2 text-sm text-muted-foreground">Price, bedrooms, area, and property type. The cards are the catalog, not a guess.</p>
          </div>
          <div>
            <h2 className="font-heading text-2xl">Score</h2>
            <p className="mt-2 text-sm text-muted-foreground">Budget, pre-approval, timeline, and motivation. Hot, warm, or cold, then an agent by area.</p>
          </div>
          <div>
            <h2 className="font-heading text-2xl">Book</h2>
            <p className="mt-2 text-sm text-muted-foreground">A showing lands on the desk calendar with the CRM note. Nobody is actually called.</p>
          </div>
        </section>
        <section className="space-y-4 rounded-2xl border bg-card p-5">
          <h2 className="font-heading text-3xl">Under the hood</h2>
          <p className="max-w-3xl text-sm text-muted-foreground">
            The same core answers the website widget, WhatsApp, and Messenger. With no API key it stays on a deterministic desk so the demo and CI never depend on a model. Groq is first when `GROQ_API_KEY` is set, then Gemini.
          </p>
          <div className="grid gap-3 text-sm md:grid-cols-4" aria-hidden>
            {["Visitor", "Guardrails", "RAG + tools", "Mock CRM"].map((step, index) => (
              <div key={step} className="rounded-xl border bg-background p-3">
                <p className="text-xs text-muted-foreground">0{index + 1}</p>
                <p className="font-heading text-lg">{step}</p>
              </div>
            ))}
          </div>
          <svg viewBox="0 0 760 120" className="hidden w-full md:block" role="img" aria-label="Architecture: channels into the desk, then retrieval, tools, and the admin inbox">
            <rect x="8" y="36" width="140" height="48" rx="10" fill="#234236" />
            <text x="78" y="65" textAnchor="middle" fill="#F6F1E7" fontSize="14">Widget / channels</text>
            <path d="M148 60 H190" stroke="#234236" strokeWidth="2" />
            <rect x="190" y="36" width="140" height="48" rx="10" fill="#E7D3B0" />
            <text x="260" y="65" textAnchor="middle" fill="#234236" fontSize="14">Demo engine</text>
            <path d="M330 60 H372" stroke="#234236" strokeWidth="2" />
            <rect x="372" y="20" width="150" height="36" rx="8" fill="#F7F1E6" stroke="#234236" />
            <text x="447" y="43" textAnchor="middle" fill="#234236" fontSize="13">KB retrieval</text>
            <rect x="372" y="64" width="150" height="36" rx="8" fill="#F7F1E6" stroke="#234236" />
            <text x="447" y="87" textAnchor="middle" fill="#234236" fontSize="13">Catalog tools</text>
            <path d="M522 60 H564" stroke="#234236" strokeWidth="2" />
            <rect x="564" y="36" width="180" height="48" rx="10" fill="#234236" />
            <text x="654" y="65" textAnchor="middle" fill="#F6F1E7" fontSize="14">Admin inbox</text>
          </svg>
        </section>
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="font-heading text-2xl">Fair housing</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            The desk refuses steering and refuses school quality when it is being used as a stand-in for who lives somewhere. Searches stay on price, size, type, and the area you named. The same rule is in the eval suite.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
