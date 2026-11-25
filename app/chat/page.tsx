import type { Metadata } from "next";
import { ChatPanel } from "@/components/chat-panel";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Chat" };

export default function ChatPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">
        <ChatPanel variant="page" />
      </main>
      <SiteFooter />
    </>
  );
}
