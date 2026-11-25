import fs from "node:fs";
import path from "node:path";
import { AGENTS } from "@/lib/agents";
import { LISTINGS } from "@/lib/listings";
import { seedStore } from "@/lib/seed";
import { hydrateStore, type StoreData } from "@/lib/types";

export function dataPath(): string {
  return process.env.DATA_PATH || path.join(process.cwd(), "data", "store.json");
}

export function loadStore(): StoreData {
  const file = dataPath();
  if (!fs.existsSync(/* turbopackIgnore: true */ file)) {
    const seeded = seedStore(new Date());
    saveStore(seeded);
    return seeded;
  }
  return hydrateStore(JSON.parse(fs.readFileSync(/* turbopackIgnore: true */ file, "utf8")) as StoreData);
}

export function saveStore(data: StoreData): void {
  const file = dataPath();
  fs.mkdirSync(/* turbopackIgnore: true */ path.dirname(file), { recursive: true });
  const temp = `${file}.tmp`;
  fs.writeFileSync(/* turbopackIgnore: true */ temp, JSON.stringify(data));
  fs.renameSync(/* turbopackIgnore: true */ temp, file);
}

export function resetStore(): StoreData {
  const seeded = seedStore(new Date());
  saveStore(seeded);
  return seeded;
}

export function snapshot(data: StoreData) {
  return {
    leads: data.leads,
    showings: data.showings,
    conversations: data.conversations,
    crm: data.crm,
    nurture: data.nurture,
    handoffs: data.handoffs,
    audit: data.audit,
    agents: AGENTS,
    listings: LISTINGS.map((listing) => ({
      id: listing.id,
      address: listing.address,
      neighborhood: listing.neighborhood,
      city: listing.city,
      price: listing.price,
      beds: listing.beds,
      baths: listing.baths,
      type: listing.type,
    })),
  };
}
