import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingArt } from "@/components/listing-art";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { money } from "@/lib/format";
import { LISTINGS, listingById } from "@/lib/listings";

export function generateStaticParams() {
  return LISTINGS.map((listing) => ({ id: listing.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const listing = listingById(id);
  return { title: listing ? listing.address : "Listing" };
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = listingById(id);
  if (!listing) notFound();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-4 py-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="h-72">
            <ListingArt id={listing.id} neighborhood={listing.neighborhood} label={listing.address} />
          </div>
          <div className="space-y-3 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{listing.id}</Badge>
              <Badge variant="outline">{listing.type}</Badge>
              {listing.openHouse && <Badge>Open house {listing.openHouse}</Badge>}
            </div>
            <h1 className="font-heading text-4xl">{listing.address}</h1>
            <p className="text-muted-foreground">
              {listing.neighborhood}, {listing.city}, {listing.state} {listing.zip}
            </p>
            <p className="font-heading text-3xl text-primary">{money(listing.price)}</p>
            <p>
              {listing.beds} bd · {listing.baths} ba · {listing.sqft.toLocaleString()} sqft · built {listing.yearBuilt}
            </p>
            <p>{listing.hoa ? `HOA ${money(listing.hoa)} / month` : "No HOA"} · {listing.daysOnMarket} days in this catalog</p>
            <p className="max-w-2xl text-muted-foreground">{listing.description}</p>
            <ul className="flex flex-wrap gap-2">
              {listing.highlights.map((item) => (
                <li key={item}>
                  <Badge variant="outline">{item}</Badge>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <aside className="space-y-4">
          <div className="rounded-2xl border bg-card p-5">
            <h2 className="font-heading text-2xl">Ask the desk</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The chat can pull this listing, score you, and hold a showing. Paste the id {listing.id}.
            </p>
            <Link className={`${buttonVariants()} mt-4`} href="/chat">
              Open chat
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">Synthetic listing. Not on the MLS. Not an offer to sell.</p>
        </aside>
      </main>
      <SiteFooter />
    </>
  );
}
