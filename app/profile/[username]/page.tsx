
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function ProfilePage() {
  const params = useParams();
  const usernameParam = (params?.username as string) ?? "";
  const router = useRouter();
  const { user } = useAuth() as any;
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        if (!usernameParam) { setLoading(false); return; }
        // cherche par username, pseudo, ou efootball_pseudo
        let data = null;
        const tries = [
          () => supabase.from("profiles").select("*").ilike("username", usernameParam).maybeSingle(),
          () => supabase.from("profiles").select("*").ilike("pseudo", usernameParam).maybeSingle(),
          () => supabase.from("profiles").select("*").ilike("efootball_pseudo", usernameParam).maybeSingle(),
          () => supabase.from("profiles").select("*").eq("id", usernameParam).maybeSingle(),
        ];
        for (const fn of tries) {
          try {
            const { data: d } = await fn();
            if (d) { data = d; break; }
          } catch {}
        }
        if (!data) {
          setError("Profil introuvable");
        } else {
          setProfile(data);
        }
      } catch (e: any) {
        console.error(e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [usernameParam]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-zinc-500">Chargement...</div>;
  if (error || !profile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-zinc-400">Profil {usernameParam} introuvable</p>
        <Link href="/dashboard" className="rounded-xl bg-white text-black px-6 py-2 font-bold">Retour dashboard</Link>
      </div>
    );
  }

  const displayName = profile.pseudo || profile.username || profile.efootball_pseudo || "Joueur";
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-white">← Retour</Link>
      <div className="mt-6 rounded-2xl border border-zinc-800 bg-[#101015] p-6">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-xl font-black">{displayName[0]}</div>
        <h1 className="mt-4 text-2xl font-black text-white">{displayName}</h1>
        <p className="text-zinc-500 text-sm">{profile.role || "JOUEUR"} • {profile.wins || 0}V - {profile.losses || 0}D</p>
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-[#15151E] border border-zinc-800 p-3 text-center"><p className="text-lg font-black text-white">{profile.wins || 0}</p><p className="text-[10px] text-zinc-500">VICTOIRES</p></div>
          <div className="rounded-xl bg-[#15151E] border border-zinc-800 p-3 text-center"><p className="text-lg font-black text-white">{profile.tournaments_won || 0}</p><p className="text-[10px] text-zinc-500">TOURNOIS</p></div>
          <div className="rounded-xl bg-[#15151E] border border-zinc-800 p-3 text-center"><p className="text-lg font-black text-white">{profile.level || 1}</p><p className="text-[10px] text-zinc-500">LEVEL</p></div>
        </div>
      </div>
    </div>
  );
}
