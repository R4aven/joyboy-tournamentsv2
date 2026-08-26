"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trophy, Swords } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!authLoading) setLoading(false);
  }, [authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-800 border-t-violet-600" />
      </div>
    );
  }

  if (!user) return null;

  const displayName = (profile as any)?.pseudo || (profile as any)?.username || (profile as any)?.efootball_pseudo || user.email?.split("@")[0] || "Joueur";
  const wins = (profile as any)?.wins ?? 0;
  const losses = (profile as any)?.losses ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-black text-white">Salut {displayName} 👋</h1>
      <p className="text-zinc-400 mt-2">ID: {user.id.slice(0,8)} • Role: {(profile as any)?.role || "JOUEUR"} • {wins}V - {losses}D</p>
      
      <div className="mt-8 grid grid-cols-2 gap-4">
        <Link href="/tournaments" className="rounded-2xl bg-[#15151E] border border-zinc-800 p-6 hover:border-violet-500/50">
          <Trophy className="h-6 w-6 text-amber-400" />
          <p className="mt-3 font-bold text-white">Tournois</p>
        </Link>
        <Link href="/1v1" className="rounded-2xl bg-[#15151E] border border-zinc-800 p-6 hover:border-violet-500/50">
          <Swords className="h-6 w-6 text-cyan-400" />
          <p className="mt-3 font-bold text-white">1V1</p>
        </Link>
      </div>

      {(profile as any)?.role === "ADMIN" && (
        <Link href="/admin" className="mt-8 inline-flex rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-3 font-bold text-white">
          → Dashboard Admin
        </Link>
      )}
    </div>
  );
}
