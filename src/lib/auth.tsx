"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./supabase/client";

export type Profile = {
  id: string;
  username: string | null;
  phone: string | null;
  email: string | null;
  role: "student" | "admin";
  university: string | null;
  major: string | null;
  cohort: string | null;
  onboarded: boolean;
  disabled: boolean;
};

type AuthCtx = {
  loading: boolean;
  user: User | null;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (data: {
    username: string;
    phone: string;
    email: string;
    password: string;
  }) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  loginDemo: () => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);
export const DEMO_EMAIL = "layla.m@coded.edu.kw";
export const DEMO_PASSWORD = "password123";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useRef(createClient()).current;
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = useCallback(
    async (uid: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();
      setProfile((data as Profile) ?? null);
    },
    [supabase]
  );

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      const u = data.session?.user ?? null;
      setUser(u);
      if (u) await loadProfile(u.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) await loadProfile(u.id);
      else setProfile(null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, loadProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) return { error: error.message };
      return {};
    },
    [supabase]
  );

  const signUp = useCallback(
    async (d: { username: string; phone: string; email: string; password: string }) => {
      const { data, error } = await supabase.auth.signUp({
        email: d.email.trim().toLowerCase(),
        password: d.password,
        options: { data: { username: d.username, phone: d.phone, role: "student" } },
      });
      if (error) return { error: error.message };
      // If email confirmation is off, a session is returned immediately.
      if (!data.session) {
        // Try an immediate sign-in (works when confirmation is disabled).
        const r = await supabase.auth.signInWithPassword({
          email: d.email.trim().toLowerCase(),
          password: d.password,
        });
        if (r.error) return { error: "CONFIRM_EMAIL" };
      }
      return {};
    },
    [supabase]
  );

  const loginDemo = useCallback(
    () => signIn(DEMO_EMAIL, DEMO_PASSWORD),
    [signIn]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, [supabase]);

  return (
    <Ctx.Provider
      value={{ loading, user, profile, signIn, signUp, signOut, loginDemo, refreshProfile }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
