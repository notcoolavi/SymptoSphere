"use client";
import { useState } from "react";
import { AuthProvider } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HistoryPanel from "@/components/HistoryPanel";
import ChatInterface from "@/components/ChatInterface";

export default function Home() {
  const [historyOpen, setHistoryOpen] = useState(false);
  return (
    <AuthProvider>
      <Navbar onOpenHistory={() => setHistoryOpen(true)} />
      <main className="min-h-screen">
        <Hero />
        <div id="check" style={{ scrollMarginTop: 80 }}>
          <ChatInterface />
        </div>
      </main>
      {historyOpen && <HistoryPanel onClose={() => setHistoryOpen(false)} />}
    </AuthProvider>
  );
}
