"use client";

import { useMemo, useState } from "react";
import { ListingCard } from "@/components/listing-card";
import { Input } from "@/components/ui/input";
import { NEIGHBORHOODS } from "@/lib/neighborhoods";
import { searchListings } from "@/lib/search";
import type { PropertyType } from "@/lib/types";

export function ListingBrowser() {
  const [area, setArea] = useState("all");
  const [beds, setBeds] = useState("all");
  const [type, setType] = useState("all");
  const [budget, setBudget] = useState("");

  const listings = useMemo(() => {
    const parsedBudget = Number(budget.replace(/[^0-9]/g, ""));
    return searchListings({
      area: area === "all" ? undefined : area,
      beds: beds === "all" ? undefined : Number(beds),
      type: type === "all" ? undefined : (type as PropertyType),
      budget: parsedBudget > 0 ? parsedBudget : undefined,
    });
  }, [area, beds, type, budget]);

  return (
    <div className="space-y-4">
      <form className="grid gap-2 sm:grid-cols-4" onSubmit={(event) => event.preventDefault()}>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Area</span>
          <select className="h-10 w-full rounded-lg border bg-card px-2" value={area} onChange={(event) => setArea(event.target.value)}>
            <option value="all">All areas</option>
            {NEIGHBORHOODS.map((item) => (
              <option key={item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Bedrooms</span>
          <select className="h-10 w-full rounded-lg border bg-card px-2" value={beds} onChange={(event) => setBeds(event.target.value)}>
            <option value="all">Any</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Type</span>
          <select className="h-10 w-full rounded-lg border bg-card px-2" value={type} onChange={(event) => setType(event.target.value)}>
            <option value="all">Any</option>
            <option value="house">House</option>
            <option value="condo">Condo</option>
            <option value="townhome">Townhome</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Max price</span>
          <Input value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="650000" className="h-10" inputMode="numeric" />
        </label>
      </form>
      <p className="text-sm text-muted-foreground">{listings.length} homes in the demo catalog.</p>
      {listings.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-8 text-sm">Nothing in the catalog matches those filters. Raise the price or clear a bedroom count.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
