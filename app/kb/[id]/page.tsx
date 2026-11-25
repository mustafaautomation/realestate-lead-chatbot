import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { loadKbDocs } from "@/lib/kb";

export function generateStaticParams() {
  return loadKbDocs().map((doc) => ({ id: doc.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const doc = loadKbDocs().find((item) => item.id === id);
  return { title: doc?.title ?? "Note" };
}

export default async function KnowledgePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = loadKbDocs().find((item) => item.id === id);
  if (!doc) notFound();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <p className="text-[12px] tracking-wide text-[var(--muted-foreground)] uppercase">Brokerage note</p>
        <h1 className="font-display mt-2 text-4xl">{doc.title}</h1>
        <p className="mt-6 whitespace-pre-wrap text-[15px] leading-7">{doc.body}</p>
      </main>
      <SiteFooter />
    </>
  );
}
