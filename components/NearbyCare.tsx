"use client";

import { useState } from "react";
import { CareSite, findCare, EMERGENCY_NUMBERS } from "@/lib/nearbyCare";

type State =
  | { s: "idle" }
  | { s: "locating" }
  | { s: "loading" }
  | { s: "done"; sites: CareSite[]; at: { lat: number; lng: number } }
  | { s: "error"; msg: string };

const box: React.CSSProperties = {
  marginTop: "14px", padding: "12px 14px", borderRadius: "10px",
  background: "var(--bg-surface)", border: "1px solid var(--border-dim)",
};
const btn: React.CSSProperties = {
  padding: "8px 14px", fontSize: "12px", cursor: "pointer", borderRadius: "8px",
  background: "transparent", color: "var(--accent-teal)", border: "1px solid var(--border-accent)",
  fontFamily: "var(--font-mono)",
};

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Location is not supported by this browser. You can still search for a clinic by name on a map."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, (err) => {
      reject(new Error(err.code === err.PERMISSION_DENIED
        ? "Location permission was denied. Allow location in your browser settings and try again."
        : "Could not get your location. Try again, or check that GPS is on."));
    }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 5 * 60 * 1000 });
  });
}

export default function NearbyCare({ urgent }: { urgent: boolean }) {
  const [st, setSt] = useState<State>({ s: "idle" });

  const find = async () => {
    try {
      setSt({ s: "locating" });
      const pos = await getPosition();
      const at = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setSt({ s: "loading" });
      const sites = await findCare(at.lat, at.lng);
      setSt({ s: "done", sites: sites.slice(0, 8), at });
    } catch (e) {
      setSt({ s: "error", msg: e instanceof Error ? e.message : "Something went wrong." });
    }
  };

  return (
    <div style={{ marginTop: "16px" }}>
      <div style={{ fontSize: "11px", color: "var(--accent-teal)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", marginBottom: "8px" }}>
        SEE A DOCTOR
      </div>
      <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 8px" }}>
        {urgent
          ? "Based on what you described, please get medical care now."
          : "A doctor can confirm what is causing your symptoms and advise on next steps. Contact one if symptoms are severe, last more than a few days, or get worse."}
      </p>
      <p style={{ fontSize: "12px", color: "var(--text-primary)", margin: "0 0 10px" }}>
        Emergency: call <strong>{EMERGENCY_NUMBERS.general}</strong> (India, general) or <strong>{EMERGENCY_NUMBERS.ambulance}</strong> (ambulance). Outside India, use your local emergency number.
      </p>

      {(st.s === "idle" || st.s === "error") && (
        <button onClick={find} style={btn}>FIND HOSPITALS AND CLINICS NEAR ME</button>
      )}
      {st.s === "locating" && <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Getting your location...</div>}
      {st.s === "loading" && <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Searching nearby care...</div>}
      {st.s === "error" && <div role="alert" style={{ fontSize: "12px", color: "#F59E0B", marginTop: "8px" }}>{st.msg}</div>}

      {st.s === "done" && st.sites.length === 0 && (
        <div style={{ ...box, fontSize: "12px", color: "var(--text-secondary)" }}>
          No hospitals or clinics were found within 8 km. Call {EMERGENCY_NUMBERS.general} or search "hospital near me" in your maps app.
        </div>
      )}

      {st.s === "done" && st.sites.map(site => (
        <div key={site.id} style={box}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "baseline" }}>
            <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>{site.name}</strong>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
              {site.distanceKm < 1 ? `${Math.round(site.distanceKm * 1000)} m` : `${site.distanceKm.toFixed(1)} km`}
            </span>
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "capitalize", marginTop: "2px" }}>{site.kind}</div>
          {site.address && <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>{site.address}</div>}
          <div style={{ fontSize: "12px", marginTop: "6px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {site.phone
              ? <a href={`tel:${site.phone}`} style={{ color: "var(--accent-teal)" }}>Call {site.phone}</a>
              : <span style={{ color: "var(--text-muted)" }}>Phone not listed. Check the directions link or call 108 for an ambulance.</span>}
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${site.lat},${site.lng}`}
               target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-teal)" }}>Directions</a>
          </div>
        </div>
      ))}

      {st.s === "done" && (
        <div style={{ marginTop: "8px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={find} style={btn}>REFRESH</button>
          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
            Listings come from {st.sites.some(s => s.source === "google") ? "Google Places" : "OpenStreetMap"} and may be out of date. Confirm hours and phone before travelling.
          </span>
        </div>
      )}
    </div>
  );
}
