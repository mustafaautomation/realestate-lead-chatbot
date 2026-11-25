import Link from "next/link";
import { ListingArt } from "@/components/listing-art";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { money } from "@/lib/format";
import type { Listing } from "@/lib/types";

export function ListingCard({ listing, compact = false }: { listing: Listing; compact?: boolean }) {
  return (
    <Card className="h-full gap-0 overflow-hidden py-0">
      <div className={compact ? "h-28" : "h-40"}>
        <ListingArt id={listing.id} neighborhood={listing.neighborhood} label={listing.address} />
      </div>
      <CardHeader className="pt-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="font-heading text-base">
            <Link href={`/listings/${listing.id}`} className="hover:underline">
              {listing.address}
            </Link>
          </CardTitle>
          <Badge variant="secondary">{listing.id}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {listing.neighborhood}, {listing.city}
        </p>
      </CardHeader>
      <CardContent className="pb-4">
        <p className="font-heading text-xl text-primary">{money(listing.price)}</p>
        <p className="mt-1 text-sm">
          {listing.beds} bd · {listing.baths} ba · {listing.sqft.toLocaleString()} sqft · {listing.type}
        </p>
        {!compact && <p className="mt-2 text-sm text-muted-foreground">{listing.description}</p>}
        {listing.openHouse && (
          <p className="mt-2 text-xs tracking-wide text-brass uppercase">Open house {listing.openHouse}</p>
        )}
      </CardContent>
    </Card>
  );
}
