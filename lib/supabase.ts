import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** null when Supabase isn't configured. The app then runs as guest-only. */
export const supabase: SupabaseClient | null = url && anon ? createClient(url, anon) : null;
export const accountsEnabled = !!supabase;
