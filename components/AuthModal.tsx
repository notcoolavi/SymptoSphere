"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

export default function AuthModal({ mode: initial, onClose }: { mode: "login" | "signup"; onClose: () => void }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState(initial);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setDone(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Please enter a valid email address.");
    if (password.length < 6) return setErr("Password must be at least 6 characters.");
    setBusy(true);
    const res = mode === "login" ? await signIn(email.trim(), password) : await signUp(email.trim(), password);
    setBusy(false);
    if (res) return setErr(res);
    if (mode === "signup") setDone("Account created. If email confirmation is on, check your inbox, then log in.");
    else onClose();
  };

  const input: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 10, marginTop: 6,
    background: "var(--bg-deep)", color: "var(--text-primary)", border: "1px solid var(--border-dim)",
    fontSize: 14, fontFamily: "var(--font-display)",
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={mode === "login" ? "Log in" : "Sign up"}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "grid", placeItems: "center", zIndex: 50, padding: 16 }}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 380, padding: 24, borderRadius: 16, background: "var(--bg-card)", border: "1px solid var(--border-dim)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 18, lineHeight: 1.5 }}>
          Save your checks and photos so you can review them later. Only you can see them.
        </p>

        <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)" }}>
          Email
          <input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} style={input} required />
        </label>
        <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginTop: 12 }}>
          Password
          <input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} style={input} required />
        </label>

        {err && <p role="alert" style={{ color: "#F59E0B", fontSize: 13, marginTop: 12 }}>{err}</p>}
        {done && <p style={{ color: "var(--accent-teal)", fontSize: 13, marginTop: 12 }}>{done}</p>}

        <button type="submit" disabled={busy} style={{
          width: "100%", marginTop: 18, padding: "11px", borderRadius: 10, border: "none", cursor: busy ? "wait" : "pointer",
          background: "var(--accent-teal)", color: "#041b14", fontWeight: 700, fontSize: 14,
        }}>{busy ? "Please wait..." : mode === "login" ? "Log in" : "Sign up"}</button>

        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 14, textAlign: "center" }}>
          {mode === "login" ? "New here? " : "Already have an account? "}
          <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(null); setDone(null); }}
            style={{ background: "none", border: "none", color: "var(--accent-teal)", cursor: "pointer", fontSize: 13 }}>
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </p>
        <button type="button" onClick={onClose} style={{ display: "block", margin: "10px auto 0", background: "none", border: "none", color: "var(--text-muted)", fontSize: 12, cursor: "pointer" }}>
          Continue without an account
        </button>
      </form>
    </div>
  );
}
