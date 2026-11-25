import { z } from "zod";

const searchSchema = z.object({
  budget: z.number().positive().max(50_000_000).optional(),
  beds: z.number().int().min(0).max(12).optional(),
  area: z.string().min(1).max(80).optional(),
  type: z.enum(["house", "condo", "townhome"]).optional(),
});

const detailsSchema = z.object({
  listingId: z.string().regex(/^SR-\d{4}$/i),
});

const qualifySchema = z.object({}).strict();

const valueSchema = z.object({
  address: z.string().min(3).max(160).optional(),
  beds: z.number().int().min(0).max(12).optional(),
  sqft: z.number().positive().max(20000).optional(),
});

const scheduleSchema = z.object({
  listingId: z.string().regex(/^SR-\d{4}$/i).optional(),
  slotId: z.string().min(4).max(80).optional(),
  slotLabel: z.string().max(80).optional(),
  name: z.string().min(2).max(80).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
});

const assignSchema = z.object({
  area: z.string().max(80).nullable().optional(),
  valuation: z.boolean().optional(),
});

const crmSchema = z.object({
  note: z.string().max(2000).optional(),
  crmId: z.string().max(40).optional(),
});

const nurtureSchema = z.object({
  email: z.string().email().optional(),
  topics: z.array(z.string()).optional(),
});

const humanSchema = z.object({
  reason: z.enum(["request", "frustration", "low_confidence", "sensitive"]),
});

const SCHEMAS: Record<string, z.ZodType> = {
  search_listings: searchSchema,
  get_listing_details: detailsSchema,
  qualify_lead: qualifySchema,
  estimate_home_value: valueSchema,
  schedule_showing: scheduleSchema,
  assign_agent: assignSchema,
  create_crm_lead: crmSchema,
  nurture_opt_in: nurtureSchema,
  request_human: humanSchema,
};

export function validateToolArgs(name: string, args: Record<string, unknown>): { ok: true; data: Record<string, unknown> } | { ok: false; error: string } {
  const schema = SCHEMAS[name];
  if (!schema) return { ok: false, error: `Unknown tool ${name}.` };
  const compact = Object.fromEntries(Object.entries(args).filter(([, value]) => value !== undefined && value !== null));
  const parsed = schema.safeParse(compact);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: `Invalid ${name} arguments: ${issue?.path.join(".") || "input"} ${issue?.message ?? "rejected"}.` };
  }
  return { ok: true, data: parsed.data as Record<string, unknown> };
}
