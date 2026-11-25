"use client";
import { useEffect, useState } from "react";
import { listChecks, deleteCheck, photoUrl, SavedCheck } from "@/lib/history";

export default function HistoryPanel({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<SavedCheck[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => listChecks().then(setItems).catch(e => setError(e.message));
  useEffect(() => { load(); }, []);

  return (
    <aside role="dialog" aria-label="My history" style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(420px, 100%)", background: "var(--bg-card)", borderLeft: "1px solid var(--border-dim)", zIndex: 60, overflowY: "auto", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>My history</h2>
        <button onClick={onClose} aria-label="Close history" style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: 22, cursor: "pointer" }}>×</button>
      </div>
      {error && <p role="alert" style={{ color: "#F59E0B", fontSize: 13 }}>{error}</p>}
      {!items && !error && <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading...</p>}
      {items?.length === 0 && <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>No saved checks yet. After a symptom check, press "Save to my history".</p>}
      {items?.map(c => <Item key={c.id} c={c} onDeleted={load} />)}
    </aside>
  );
}

function Item({ c, onDeleted }: { c: SavedCheck; onDeleted: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => { if (c.photo_path) photoUrl(c.photo_path).then(setUrl); }, [c.photo_path]);
  return (
    <div style={{ padding: 14, borderRadius: 12, border: "1px solid var(--border-dim)", marginBottom: 12, background: "var(--bg-surface)" }}>
      <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{new Date(c.created_at).toLocaleString()}</div>
      <div style={{ fontSize: 13, marginTop: 6, color: "var(--text-secondary)" }}>Symptoms: {c.symptoms.map(s => s.replace(/_/g, " ")).join(", ")}</div>
      <ol style={{ fontSize: 14, marginTop: 8, paddingLeft: 18 }}>
        {c.top_results.map((r, i) => <li key={i}>{r.name} <span style={{ color: "var(--text-muted)" }}>({r.score}%, {r.confidence})</span></li>)}
      </ol>
      {c.note && <p style={{ fontSize: 13, marginTop: 8, fontStyle: "italic", color: "var(--text-secondary)" }}>“{c.note}”</p>}
      {url && <img src={url} alt="Photo attached to this check" style={{ marginTop: 10, maxWidth: "100%", borderRadius: 8 }} />}
      <button onClick={async () => { if (confirm("Delete this check and its photo?")) { await deleteCheck(c); onDeleted(); } }}
        style={{ marginTop: 10, background: "none", border: "none", color: "#EF4444", fontSize: 12, cursor: "pointer" }}>Delete</button>
    </div>
  );
}
