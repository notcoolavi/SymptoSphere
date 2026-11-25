"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { accountsEnabled } from "@/lib/supabase";
import AuthModal from "./AuthModal";

export default function Navbar({ onOpenHistory }: { onOpenHistory: () => void }) {
  const { user, loading, signOut } = useAuth();
  const [auth, setAuth] = useState<null | "login" | "signup">(null);

  const pill: React.CSSProperties = {
    padding: "7px 14px", borderRadius: 999, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 600,
  };

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 40, backdropFilter: "blur(10px)", background: "rgba(8,11,16,0.7)", borderBottom: "1px solid var(--border-dim)" }}>
      <nav aria-label="Main" style={{ maxWidth: 1100, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-primary)", textDecoration: "none" }}>
          <span aria-hidden style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#00D9A6,#4F8EF7)", display: "grid", placeItems: "center", color: "#041b14", fontWeight: 800 }}>S</span>
          <span style={{ fontWeight: 700, fontSize: 16 }}>SymptoSphere</span>
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {user && (
            <button onClick={onOpenHistory} style={{ ...pill, background: "transparent", color: "var(--text-primary)", border: "1px solid var(--border-dim)" }}>My history</button>
          )}
          {accountsEnabled && !loading && (user ? (
            <button onClick={() => signOut()} style={{ ...pill, background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border-dim)" }}>Log out</button>
          ) : (
            <>
              <button onClick={() => setAuth("login")} style={{ ...pill, background: "transparent", color: "var(--text-primary)", border: "1px solid var(--border-dim)" }}>Log in</button>
              <button onClick={() => setAuth("signup")} style={{ ...pill, background: "var(--accent-teal)", color: "#041b14", border: "none" }}>Sign up</button>
            </>
          ))}
        </div>
      </nav>
      {auth && <AuthModal mode={auth} onClose={() => setAuth(null)} />}
    </header>
  );
}
