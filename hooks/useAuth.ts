"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let profileChannel: any = null;

    const loadProfile = async (userId: string) => {
      const { data } = await supabase.from("profiles").select("id, username, display_name, avatar_url, bio, role, wins, losses, level").eq("id", userId).maybeSingle();
      if (active && data) setProfile(data);
    };

    const init = async () => {
      const { data: { user: initialUser } } = await supabase.auth.getUser();
      if (!active) return;
      setUser(initialUser);
      if (initialUser) await loadProfile(initialUser.id);
      setLoading(false);

      profileChannel = supabase.channel(`profile-sync-${initialUser?.id || "anonymous"}`).on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        (payload: any) => {
          if (initialUser && payload.new?.id === initialUser.id) setProfile((current: any) => ({ ...(current || {}), ...payload.new }));
        }
      ).subscribe();
    };

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      if (!active) return;
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (nextUser) await loadProfile(nextUser.id); else setProfile(null);
    });

    init();
    return () => {
      active = false;
      listener.subscription.unsubscribe();
      if (profileChannel) supabase.removeChannel(profileChannel);
    };
  }, []);

  return { user, profile, loading, supabase };
}
