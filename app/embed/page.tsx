import type { Metadata } from "next";
import { ChatPanel } from "@/components/chat-panel";

export const metadata: Metadata = { title: "Embed" };

export default function EmbedPage() {
  return <ChatPanel variant="embed" />;
}
