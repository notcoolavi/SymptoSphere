"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!supabase);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  const value: AuthState = {
    user,
    loading,
    // Each method returns an error message, or null on success.
    signIn: async (email, password) => {
      if (!supabase) return "Accounts are not set up yet.";
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? friendly(error.message) : null;
    },
    signUp: async (email, password) => {
      if (!supabase) return "Accounts are not set up yet.";
      const { error } = await supabase.auth.signUp({ email, password });
      return error ? friendly(error.message) : null;
    },
    signOut: async () => { await supabase?.auth.signOut(); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function friendly(msg: string): string {
  if (/invalid login/i.test(msg)) return "Email or password is incorrect.";
  if (/already registered/i.test(msg)) return "An account with this email already exists. Try logging in.";
  if (/password/i.test(msg) && /6/.test(msg)) return "Password must be at least 6 characters.";
  if (/rate limit/i.test(msg)) return "Too many attempts. Please wait a few minutes.";
  return "Something went wrong. Please try again.";
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
