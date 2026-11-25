import { LISTINGS } from "@/lib/listings";
import { knownNeighborhoodNames, neighborhoodByName } from "@/lib/neighborhoods";
import type { Listing, SearchFilters } from "@/lib/types";

export function searchListings(filters: SearchFilters): Listing[] {
  const area = filters.area ? neighborhoodByName(filters.area)?.name : undefined;
  return LISTINGS.filter((listing) => {
    if (filters.budget !== undefined && listing.price > filters.budget) return false;
    if (filters.beds !== undefined && listing.beds !== filters.beds) return false;
    if (area && listing.neighborhood !== area) return false;
    if (filters.type && listing.type !== filters.type) return false;
    return true;
  }).sort((a, b) => a.price - b.price || a.address.localeCompare(b.address));
}

export function areaHelp(): string {
  return knownNeighborhoodNames().join(", ");
}
