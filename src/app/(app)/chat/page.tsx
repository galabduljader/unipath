"use client";

import { AdvisorChat } from "@/components/AdvisorChat";

export default function ChatPage() {
  return (
    <div style={{ maxWidth: 820, margin: "0 auto", height: "100%", minHeight: 540 }} className="fade-up">
      <AdvisorChat />
    </div>
  );
}
