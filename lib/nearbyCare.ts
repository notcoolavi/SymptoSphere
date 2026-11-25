/**
 * Finds hospitals, clinics and doctors near the user.
 * Primary: OpenStreetMap Overpass (free, no key).
 * Optional: Google Places (New) if NEXT_PUBLIC_GOOGLE_PLACES_KEY is set.
 * Phone numbers come from the source; many OSM entries have none, so the UI says so.
 */
export interface CareSite {
  id: string;
  name: string;
  kind: "hospital" | "clinic" | "doctor" | "emergency";
  lat: number;
  lng: number;
  distanceKm: number;
  address?: string;
  phone?: string;
  source: "osm" | "google";
}

export const EMERGENCY_NUMBERS = { general: "112", ambulance: "108" }; // India defaults; shown with a country note

export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat), dLng = toRad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function normalizePhone(raw?: string): string | undefined {
  if (!raw) return undefined;
  const first = raw.split(/[;,/]/)[0].trim();
  const cleaned = first.replace(/[^\d+]/g, "");
  return cleaned.length >= 7 ? cleaned : undefined;
}

function osmAddress(t: Record<string, string>): string | undefined {
  const parts = [t["addr:housenumber"], t["addr:street"], t["addr:suburb"] || t["addr:neighbourhood"], t["addr:city"], t["addr:postcode"]].filter(Boolean);
  return parts.length ? parts.join(", ") : undefined;
}

/** Parses an Overpass JSON response. Exported for testing. */
export function parseOverpass(json: any, fromLat: number, fromLng: number): CareSite[] {
  const els: any[] = Array.isArray(json?.elements) ? json.elements : [];
  const sites: CareSite[] = [];
  for (const el of els) {
    const t = el.tags || {};
    const lat = el.lat ?? el.center?.lat, lng = el.lon ?? el.center?.lon;
    if (typeof lat !== "number" || typeof lng !== "number") continue;
    const amenity = t.amenity, healthcare = t.healthcare;
    const kind: CareSite["kind"] | null =
      amenity === "hospital" ? "hospital" :
      amenity === "clinic" || healthcare === "clinic" ? "clinic" :
      amenity === "doctors" || healthcare === "doctor" ? "doctor" : null;
    if (!kind) continue;
    const name = t.name || t["name:en"];
    if (!name) continue;
    sites.push({
      id: `osm-${el.type}-${el.id}`, name, kind, lat, lng,
      distanceKm: haversineKm(fromLat, fromLng, lat, lng),
      address: osmAddress(t),
      phone: normalizePhone(t.phone || t["contact:phone"]),
      source: "osm",
    });
  }
  return dedupe(sites).sort((a, b) => a.distanceKm - b.distanceKm);
}

function dedupe(sites: CareSite[]): CareSite[] {
  const seen = new Set<string>();
  return sites.filter(s => {
    const key = `${s.name.toLowerCase()}|${s.lat.toFixed(4)}|${s.lng.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function withTimeout<T>(p: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try { return await p(ctrl.signal); } finally { clearTimeout(timer); }
}

export async function fetchOsmCare(lat: number, lng: number, radiusM = 8000): Promise<CareSite[]> {
  const q = `[out:json][timeout:20];(
    node["amenity"~"^(hospital|clinic|doctors)$"](around:${radiusM},${lat},${lng});
    way["amenity"~"^(hospital|clinic|doctors)$"](around:${radiusM},${lat},${lng});
    node["healthcare"~"^(hospital|clinic|doctor)$"](around:${radiusM},${lat},${lng});
  );out center tags 60;`;
  const res = await withTimeout(signal => fetch("https://overpass-api.de/api/interpreter", {
    method: "POST", body: "data=" + encodeURIComponent(q), signal,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  }), 25000);
  if (!res.ok) throw new Error(`Map service unavailable (${res.status})`);
  return parseOverpass(await res.json(), lat, lng);
}

export async function fetchGoogleCare(lat: number, lng: number, key: string, radiusM = 8000): Promise<CareSite[]> {
  const res = await withTimeout(signal => fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST", signal,
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.location,places.types",
    },
    body: JSON.stringify({
      includedTypes: ["hospital", "doctor"],
      maxResultCount: 20,
      locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: radiusM } },
    }),
  }), 15000);
  if (!res.ok) throw new Error(`Google Places error (${res.status})`);
  const json = await res.json();
  return (json.places || []).map((p: any): CareSite => ({
    id: `g-${p.id}`,
    name: p.displayName?.text ?? "Unnamed",
    kind: (p.types || []).includes("hospital") ? "hospital" : "doctor",
    lat: p.location.latitude, lng: p.location.longitude,
    distanceKm: haversineKm(lat, lng, p.location.latitude, p.location.longitude),
    address: p.formattedAddress,
    phone: normalizePhone(p.nationalPhoneNumber),
    source: "google",
  })).sort((a: CareSite, b: CareSite) => a.distanceKm - b.distanceKm);
}

/** Uses Google when a key is configured and it succeeds; otherwise falls back to OpenStreetMap. */
export async function findCare(lat: number, lng: number): Promise<CareSite[]> {
  const key = process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY;
  if (key) {
    try {
      const g = await fetchGoogleCare(lat, lng, key);
      if (g.length) return g;
    } catch { /* fall back */ }
  }
  return fetchOsmCare(lat, lng);
}
