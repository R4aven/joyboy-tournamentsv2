"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  username?: string;
  pseudo?: string;
  efootball_pseudo?: string;
  email?: string;
  role?: string;
  wins?: number;
  losses?: number;
  [key: string]: any;
};

type AuthState = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
};

export function useAuth() {
  const supabase = createClient();
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    isAuthenticated: false,
  });

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (error) {
        console.error("fetchProfile error", error.message);
        return null;
      }
      return data as Profile | null;
    } catch (e: any) {
      console.error("fetchProfile crash", e?.message);
      return null;
    }
  }, [supabase]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setState({ user: session.user, session, profile, loading: false, isAuthenticated: true });
        } else {
          setState({ user: null, session: null, profile: null, loading: false, isAuthenticated: false });
        }
      } catch (e) {
        if (mounted) setState({ user: null, session: null, profile: null, loading: false, isAuthenticated: false });
      }
    };
    init();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setState({ user: session.user, session, profile, loading: false, isAuthenticated: true });
        }
      } else if (event === "SIGNED_OUT") {
        setState({ user: null, session: null, profile: null, loading: false, isAuthenticated: false });
      }
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, [fetchProfile, supabase]);

  return { ...state, supabase, refreshProfile: async () => {
    if (!state.user) return;
    const p = await fetchProfile(state.user.id);
    setState(prev => ({ ...prev, profile: p }));
  }};
}
