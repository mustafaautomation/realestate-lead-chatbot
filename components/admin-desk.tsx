"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { money } from "@/lib/format";
import type { Agent } from "@/lib/agents";
import type { AuditEntry, Conversation, CrmRecord, Handoff, Lead, NurtureOptIn, Showing, Tier } from "@/lib/types";

type SlimListing = { id: string; address: string; neighborhood: string; price: number };

type Snapshot = {
  leads: Lead[];
  showings: Showing[];
  conversations: Conversation[];
  crm: CrmRecord[];
  nurture: NurtureOptIn[];
  handoffs: Handoff[];
  audit: AuditEntry[];
  agents: Agent[];
  listings: SlimListing[];
};

export function AdminDesk() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [resumeNote, setResumeNote] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const response = await fetch("/api/admin", { cache: "no-store" });
      if (!response.ok) throw new Error("The desk could not load.");
      const payload = (await response.json()) as Snapshot;
      setData(payload);
      setSelected((current) => current ?? payload.conversations[0]?.id ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The desk could not load.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function reset() {
    setLoading(true);
    await fetch("/api/admin/reset", { method: "POST" });
    await load();
  }

  if (loading && !data) return <p className="text-sm text-muted-foreground">Opening the desk…</p>;
  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive" role="alert">{error}</p>
        <Button type="button" onClick={() => void load()}>Try again</Button>
      </div>
    );
  }
  if (!data) return null;

  const conversation = data.conversations.find((item) => item.id === selected) ?? data.conversations[0];
  const lead = data.leads.find((item) => item.conversationId === conversation?.id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{data.leads.length} leads · {data.showings.length} showings · {data.handoffs.length} handoffs · {data.nurture.length} nurture opt-ins</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void load()}>Refresh</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => void reset()}>Reset demo data</Button>
        </div>
      </div>
      <Tabs defaultValue="pipeline">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="showings">Showings</TabsTrigger>
          <TabsTrigger value="transcripts">Transcripts</TabsTrigger>
          <TabsTrigger value="handoffs">Handoffs</TabsTrigger>
        </TabsList>
        <TabsContent value="pipeline" className="pt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {(["hot", "warm", "cold"] as Tier[]).map((tier) => (
              <section key={tier} className="rounded-xl border bg-card p-3">
                <h2 className="mb-3 font-heading text-lg capitalize">{tier}</h2>
                <div className="space-y-2">
                  {data.leads.filter((item) => item.tier === tier).length === 0 && (
                    <p className="text-sm text-muted-foreground">No {tier} leads yet.</p>
                  )}
                  {data.leads.filter((item) => item.tier === tier).map((item) => {
                    const agent = data.agents.find((person) => person.id === item.agentId);
                    return (
                      <button key={item.id} type="button" className="w-full rounded-lg border bg-background p-3 text-left hover:bg-muted" onClick={() => setSelected(item.conversationId)}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{item.fields.name || "Web visitor"}</span>
                          <Badge variant="outline">{item.score}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.fields.role} · {item.fields.area || "No area"} · {item.fields.budget ? money(item.fields.budget) : "No budget"}
                        </p>
                        <p className="mt-1 text-xs">{agent ? agent.name : "Unassigned"} · {item.crmId || "No CRM id"}</p>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="showings" className="pt-4">
          {data.showings.length === 0 ? (
            <p className="rounded-xl border border-dashed px-4 py-8 text-sm">No showings on the calendar. Book one from the chat.</p>
          ) : (
            <ul className="space-y-2">
              {data.showings.map((showing) => {
                const listing = data.listings.find((item) => item.id === showing.listingId);
                const agent = data.agents.find((person) => person.id === showing.agentId);
                return (
                  <li key={showing.id} className="rounded-xl border bg-card p-3">
                    <p className="font-heading text-base">{showing.slotLabel}</p>
                    <p className="text-sm">{listing ? `${listing.address}, ${listing.neighborhood}` : showing.listingId} · {listing ? money(listing.price) : ""}</p>
                    <p className="text-sm text-muted-foreground">{showing.name} · {showing.email} · {agent?.name}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>
        <TabsContent value="transcripts" className="pt-4">
          <div className="grid gap-4 lg:grid-cols-[240px_1fr_260px]">
            <ul className="space-y-1">
              {data.conversations.map((item) => (
                <li key={item.id}>
                  <button type="button" className={`w-full rounded-lg px-3 py-2 text-left text-sm ${item.id === conversation?.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`} onClick={() => setSelected(item.id)}>
                    {item.title}
                  </button>
                </li>
              ))}
            </ul>
            <div className="max-h-[640px] space-y-3 overflow-y-auto rounded-xl border bg-card p-3">
              {conversation?.messages.map((message) => (
                <article key={message.id}>
                  <p className="text-xs tracking-wide text-muted-foreground uppercase">{message.role}</p>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">{message.toolCalls.map((call) => call.name).join(" · ")}</p>
                  )}
                </article>
              ))}
            </div>
            <aside className="rounded-xl border bg-card p-3 text-sm">
              <h2 className="font-heading text-base">Extracted fields</h2>
              {lead ? (
                <dl className="mt-2 space-y-1">
                  <Field label="Name" value={lead.fields.name} />
                  <Field label="Email" value={lead.fields.email} />
                  <Field label="Phone" value={lead.fields.phone} />
                  <Field label="Role" value={lead.fields.role} />
                  <Field label="Budget" value={lead.fields.budget ? money(lead.fields.budget) : undefined} />
                  <Field label="Pre-approval" value={lead.fields.preApproval} />
                  <Field label="Timeline" value={lead.fields.timeline} />
                  <Field label="Motivation" value={lead.fields.motivation} />
                  <Field label="Area" value={lead.fields.area} />
                  <Field label="Beds" value={lead.fields.beds?.toString()} />
                  <Field label="Tier" value={`${lead.tier} (${lead.score})`} />
                  <Field label="CRM" value={lead.crmId} />
                </dl>
              ) : (
                <p className="mt-2 text-muted-foreground">This transcript has no scored lead. Refusals stay here without a pipeline card.</p>
              )}
              {lead && <p className="mt-3 text-xs text-muted-foreground">{data.crm.find((item) => item.id === lead.crmId)?.notes}</p>}
            </aside>
          </div>
        </TabsContent>
        <TabsContent value="handoffs" className="pt-4">
          {resumeNote && <p className="mb-3 text-sm font-medium">{resumeNote}</p>}
          {data.handoffs.length === 0 ? (
            <p className="rounded-xl border border-dashed px-4 py-8 text-sm">No handoff tickets. Ask the chat for a person, or ask something the notes do not cover.</p>
          ) : (
            <ul className="space-y-2">
              {data.handoffs.map((ticket) => (
                <li key={ticket.id} className="rounded-xl border bg-card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-heading text-base">{ticket.id}</p>
                    <Badge variant="outline">{ticket.reason}</Badge>
                  </div>
                  <p className="mt-2 text-sm">{ticket.summary}</p>
                  <button type="button" className="mt-2 text-sm underline" onClick={() => setSelected(ticket.conversationId)}>
                    Open transcript
                  </button>
                  <button
                    type="button"
                    className="mt-2 ml-3 rounded-full bg-[var(--accent)] px-3 py-1 text-[13px] text-[var(--accent-foreground)]"
                    onClick={() => {
                      void fetch("/api/admin/resume", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ conversationId: ticket.conversationId }),
                      }).then(() => setResumeNote("Bot resumed"));
                    }}
                  >
                    Resume bot
                  </button>
                </li>
              ))}
            </ul>
          )}
          {data.audit.length > 0 && (
            <div className="mt-4">
              <h2 className="font-heading text-lg">Masked log</h2>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {data.audit.slice(-8).map((entry) => (
                  <li key={entry.id}>{entry.kind}: {entry.detail}</li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{value || "—"}</dd>
    </div>
  );
}
