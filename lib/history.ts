import { supabase } from "./supabase";

export interface SavedResult { name: string; score: number; confidence: string }
export interface SavedCheck {
  id: string;
  created_at: string;
  symptoms: string[];
  top_results: SavedResult[];
  note: string | null;
  photo_path: string | null;
}

export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;

/** Returns an error message, or null if the photo is acceptable. */
export function validatePhoto(file: File): string | null {
  if (!PHOTO_TYPES.includes(file.type)) return "Please choose a JPG, PNG or WebP image.";
  if (file.size > PHOTO_MAX_BYTES) return "Photo is larger than 5 MB. Please choose a smaller one.";
  return null;
}

export async function saveCheck(userId: string, symptoms: string[], results: SavedResult[], note?: string, photo?: File | null) {
  if (!supabase) throw new Error("Accounts are not set up.");
  let photo_path: string | null = null;
  if (photo) {
    const err = validatePhoto(photo);
    if (err) throw new Error(err);
    const ext = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
    photo_path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("symptom-photos").upload(photo_path, photo, { contentType: photo.type });
    if (error) throw new Error("Photo upload failed. Please try again.");
  }
  const { error } = await supabase.from("checks").insert({
    symptoms,
    top_results: results.map(r => ({ name: r.name, score: r.score, confidence: r.confidence })),
    note: note?.trim() || null,
    photo_path,
  });
  if (error) throw new Error("Could not save this check. Please try again.");
}

export async function listChecks(): Promise<SavedCheck[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("checks").select("*").order("created_at", { ascending: false }).limit(50);
  if (error) throw new Error("Could not load your history.");
  return (data ?? []) as SavedCheck[];
}

export async function photoUrl(path: string): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.storage.from("symptom-photos").createSignedUrl(path, 300);
  return data?.signedUrl ?? null;
}

export async function deleteCheck(c: SavedCheck) {
  if (!supabase) return;
  if (c.photo_path) await supabase.storage.from("symptom-photos").remove([c.photo_path]);
  await supabase.from("checks").delete().eq("id", c.id);
}
