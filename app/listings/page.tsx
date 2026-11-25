import type { Metadata } from "next";
import { ListingBrowser } from "@/components/listing-browser";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Listings" };

export default function ListingsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <h1 className="font-heading text-4xl">Catalog</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Forty synthetic Denver-area homes. Filters match the chat tool: budget, bedrooms, area, and type.
        </p>
        <div className="mt-6">
          <ListingBrowser />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
