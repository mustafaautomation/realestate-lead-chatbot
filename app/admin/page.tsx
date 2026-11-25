import type { Metadata } from "next";
import { AdminDesk } from "@/components/admin-desk";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Desk" };

export default function AdminPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <p className="text-sm tracking-[0.14em] text-[var(--muted-foreground)] uppercase">Demo desk</p>
        <h1 className="font-heading text-4xl">Lead pipeline</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Hot, warm, and cold leads, the showing calendar, and the transcript with the fields the desk extracted. Nothing here is a real CRM.
        </p>
        <div className="mt-6">
          <AdminDesk />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
