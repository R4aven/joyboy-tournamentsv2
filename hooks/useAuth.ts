"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  wins: number;
  losses: number;
  tournaments_played: number;
  tournaments_won: number;
  duels_won: number;
  total_earnings: number;
  is_private?: boolean;
  created_at?: string;
  wave_number?: string | null;
  whatsapp_number?: string | null;
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
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Erreur récupération profil:", error);
        return null;
      }
      return data as Profile | null;
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (!state.user) return;
    const profile = await fetchProfile(state.user.id);
    setState((prev) => ({ ...prev, profile }));
  }, [state.user, fetchProfile]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          if (!mounted) return;
          setState({
            user: session.user,
            session,
            profile,
            loading: false,
            isAuthenticated: true,
          });
        } else {
          setState({
            user: null,
            session: null,
            profile: null,
            loading: false,
            isAuthenticated: false,
          });
        }
      } catch (e) {
        console.error("init auth error", e);
        if (mounted) {
          setState({
            user: null,
            session: null,
            profile: null,
            loading: false,
            isAuthenticated: false,
          });
        }
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setState({
            user: session.user,
            session,
            profile,
            loading: false,
            isAuthenticated: true,
          });
        }
      } else if (event === "SIGNED_OUT") {
        setState({
          user: null,
          session: null,
          profile: null,
          loading: false,
          isAuthenticated: false,
        });
      } else if (event === "USER_UPDATED") {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setState((prev) => ({
            ...prev,
            user: session.user,
            session,
            profile: profile ?? prev.profile,
            isAuthenticated: true,
          }));
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, supabase]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setState({
      user: null,
      session: null,
      profile: null,
      loading: false,
      isAuthenticated: false,
    });
  }, [supabase]);

  return {
    ...state,
    signOut,
    refreshProfile,
    supabase,
  };
}
