
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
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
          const { data } = await supabase.from("profiles").select("id, username, display_name, avatar_url, bio, role, wins, losses, level").eq("id", user.id).maybeSingle();
          if (data) setProfile(data);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    getUser();
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase.from("profiles").select("id, username, display_name, avatar_url, bio, role, wins, losses, level").eq("id", session.user.id).maybeSingle();
        if (data) setProfile(data);
      } else setProfile(null);
    });
    return () => { listener.subscription.unsubscribe(); };
  }, []);
  return { user, profile, loading, supabase };
}
