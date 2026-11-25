import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = { title: "Embed demo" };

export default function EmbedDemoPage() {
  return (
    <main className="min-h-screen bg-[#f4efe6] text-[#241c16]">
      <header className="border-b border-[#e4d8c4] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <p className="font-heading text-2xl">North Table Listings</p>
          <p className="text-sm text-[#6b5c4c]">Sample host site</p>
        </div>
      </header>
      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-10 md:grid-cols-2">
        <div>
          <p className="text-sm tracking-wide text-[#8a5a32] uppercase">Denver sample page</p>
          <h1 className="mt-2 font-heading text-4xl">Homes on the host site, chat in the corner.</h1>
          <p className="mt-3 text-[#4d4338]">
            This page is not the Summit Ridge app. It loads the widget with one script tag. Open the launcher, ask a question, and the iframe talks to the same desk.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-[#234236] p-4 text-sm text-[#f6f1e7]">
            {`<script src="/widget.js" data-brokerage="summit-ridge" data-title="Ask Summit Ridge"></script>`}
          </pre>
        </div>
        <article className="rounded-2xl border border-[#e4d8c4] bg-white p-5">
          <h2 className="font-heading text-2xl">2840 Boulder St</h2>
          <p className="mt-2 text-sm text-[#6b5c4c]">A pretend listing card on a host website.</p>
          <p className="mt-4 font-heading text-3xl">$599,000</p>
          <p className="mt-2">3 bedrooms · Highlands</p>
        </article>
      </section>
      <Script src="/widget.js" data-brokerage="summit-ridge" data-title="Ask Summit Ridge" strategy="afterInteractive" />
    </main>
  );
}
