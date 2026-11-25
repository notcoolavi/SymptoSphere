"use client";
import { useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { accountsEnabled } from "@/lib/supabase";
import { saveCheck, validatePhoto, SavedResult } from "@/lib/history";

/** Shown under results. Saves the check to the user's history, optionally with a photo and note. */
export default function SaveCheck({ symptoms, results }: { symptoms: string[]; results: SavedResult[] }) {
  const { user } = useAuth();
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<{ kind: "ok" | "err" | "busy"; msg: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!accountsEnabled) return null;

  const pick = (f: File | undefined) => {
    if (!f) return;
    const err = validatePhoto(f);
    if (err) { setStatus({ kind: "err", msg: err }); return; }
    setPhoto(f);
    setPreview(URL.createObjectURL(f));
    setStatus(null);
  };

  const save = async () => {
    if (!user) { setStatus({ kind: "err", msg: "Log in or sign up to save this check." }); return; }
    setStatus({ kind: "busy", msg: "Saving..." });
    try {
      await saveCheck(user.id, symptoms, results, note, photo);
      setStatus({ kind: "ok", msg: "Saved to your history." });
      setPhoto(null); setPreview(null); setNote("");
    } catch (e) {
      setStatus({ kind: "err", msg: e instanceof Error ? e.message : "Could not save." });
    }
  };

  const btn: React.CSSProperties = { padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: "var(--font-mono)", background: "transparent", color: "var(--accent-teal)", border: "1px solid var(--border-accent)" };

  return (
    <div style={{ marginTop: 16, padding: 14, borderRadius: 12, border: "1px solid var(--border-dim)", background: "var(--bg-surface)" }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Add a photo or note (optional)</div>
      <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 10 }}>
        A photo can help you show a doctor what you're seeing. SymptoSphere does not identify conditions from photos. Only you can see what you save.
      </p>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e => pick(e.target.files?.[0])} />
        <button type="button" style={btn} onClick={() => fileRef.current?.click()}>{photo ? "CHANGE PHOTO" : "UPLOAD PHOTO"}</button>
        {preview && <img src={preview} alt="Selected photo preview" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8 }} />}
      </div>
      <textarea value={note} onChange={e => setNote(e.target.value.slice(0, 1000))} placeholder="Notes, e.g. when it started, what makes it better or worse"
        aria-label="Notes" rows={2}
        style={{ width: "100%", marginTop: 10, padding: 10, borderRadius: 8, background: "var(--bg-deep)", color: "var(--text-primary)", border: "1px solid var(--border-dim)", fontSize: 13, fontFamily: "var(--font-display)" }} />
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
        <button type="button" onClick={save} disabled={status?.kind === "busy"} style={{ ...btn, background: "var(--accent-teal)", color: "#041b14", border: "none", fontWeight: 700 }}>
          {user ? "SAVE TO MY HISTORY" : "LOG IN TO SAVE"}
        </button>
        {status && <span role="status" style={{ fontSize: 12, color: status.kind === "err" ? "#F59E0B" : status.kind === "ok" ? "var(--accent-teal)" : "var(--text-muted)" }}>{status.msg}</span>}
      </div>
    </div>
  );
}
