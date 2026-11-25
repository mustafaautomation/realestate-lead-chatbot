"use client";

import { ChatWidget } from "@/components/chat/chat-widget";

export default function EmbedPage() {
  return (
    <ChatWidget
      variant="embed"
      onClose={() => window.parent.postMessage({ type: "summit-ridge:close" }, "*")}
    />
  );
}
