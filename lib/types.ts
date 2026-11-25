export type PropertyType = "house" | "condo" | "townhome";

export type Role = "buyer" | "seller" | "both" | "unknown";

export type PreApproval = "approved" | "in_process" | "cash" | "none" | "unknown";

export type Timeline = "30_days" | "90_days" | "6_months" | "browsing" | "unknown";

export type Tier = "hot" | "warm" | "cold";

export type Listing = {
  id: string;
  address: string;
  neighborhood: string;
  city: string;
  state: "CO";
  zip: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  type: PropertyType;
  yearBuilt: number;
  hoa: number | null;
  daysOnMarket: number;
  description: string;
  highlights: string[];
  openHouse?: string;
};

export type LeadFields = {
  name?: string;
  email?: string;
  phone?: string;
  role: Role;
  budget?: number;
  preApproval: PreApproval;
  timeline: Timeline;
  motivation?: string;
  beds?: number;
  sqft?: number;
  area?: string;
  address?: string;
  propertyType?: PropertyType;
  nurture: boolean;
};

export type Qualification = {
  score: number;
  tier: Tier;
  reasons: string[];
  missing: string[];
};

export type Citation = {
  id: string;
  title: string;
  excerpt: string;
};

export type ToolTrace = {
  name: string;
  args: Record<string, unknown>;
  summary: string;
};

export type GuardrailTrace = {
  blocked: boolean;
  category?: "steering" | "school_proxy" | "injection" | "off_topic";
};

export type HandoffReason = "request" | "frustration" | "low_confidence" | "sensitive";

export type Handoff = {
  id: string;
  conversationId: string;
  reason: HandoffReason;
  summary: string;
  status: "open";
  createdAt: string;
};

export type AuditEntry = {
  id: string;
  at: string;
  kind: string;
  detail: string;
};

export type ChannelThread = {
  key: string;
  conversationId: string;
};

export type ProcessedInbound = {
  id: string;
  conversationId: string;
  reply: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  listings?: Listing[];
  citations?: Citation[];
  toolCalls?: ToolTrace[];
  suggestions?: string[];
  guardrail?: GuardrailTrace;
  qualification?: Qualification;
};

export type Conversation = {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  messages: ChatMessage[];
  fields: LeadFields;
  qualifying: boolean;
  scored: boolean;
  lastListingIds: string[];
  preferredListingId?: string;
  leadId?: string;
};

export type Lead = {
  id: string;
  conversationId: string;
  fields: LeadFields;
  score: number;
  tier: Tier;
  reasons: string[];
  missing: string[];
  agentId?: string;
  crmId?: string;
  createdAt: string;
  updatedAt: string;
};

export type Showing = {
  id: string;
  listingId: string;
  slotId: string;
  slotLabel: string;
  startsAt: string;
  leadId: string;
  conversationId: string;
  agentId: string;
  name: string;
  email: string;
  phone?: string;
  status: "booked";
};

export type CrmRecord = {
  id: string;
  leadId: string;
  conversationId: string;
  name?: string;
  email?: string;
  phone?: string;
  tier: Tier;
  score: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type NurtureOptIn = {
  id: string;
  email: string;
  conversationId: string;
  topics: string[];
  createdAt: string;
};

export type StoreData = {
  conversations: Conversation[];
  leads: Lead[];
  showings: Showing[];
  crm: CrmRecord[];
  nurture: NurtureOptIn[];
  handoffs: Handoff[];
  audit: AuditEntry[];
  channelThreads: ChannelThread[];
  processedInbound: ProcessedInbound[];
};

export type SearchFilters = {
  budget?: number;
  beds?: number;
  area?: string;
  type?: PropertyType;
};

export function emptyFields(): LeadFields {
  return {
    role: "unknown",
    preApproval: "unknown",
    timeline: "unknown",
    nurture: false,
  };
}

export function emptyStore(): StoreData {
  return { conversations: [], leads: [], showings: [], crm: [], nurture: [], handoffs: [], audit: [], channelThreads: [], processedInbound: [] };
}

export function hydrateStore(data: Partial<StoreData>): StoreData {
  const empty = emptyStore();
  return { ...empty, ...data, handoffs: data.handoffs ?? [], audit: data.audit ?? [], channelThreads: data.channelThreads ?? [], processedInbound: data.processedInbound ?? [] };
}
