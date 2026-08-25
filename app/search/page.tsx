"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Users, Trophy, Flame, Crown } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type Profile = {
  id: string;
  pseudo: string;
  avatar_url?: string;
  trophies?: number;
  titres?: number;
  victoires?: number;
};

export default function SearchPage() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initial);
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!query.trim() || query.length < 2) { setResults([]); return; }
      setLoading(true);
      const { data } = await supabase.from("profiles").select("*").ilike("pseudo", `%${query}%`).limit(20);
      if (data) setResults(data as any);
      setLoading(false);
    }, 300);
    return () => clearTimeout(delay);
  }, [query]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-black flex items-center justify-center gap-3"><Search className="h-7 w-7 text-joy-violet" /> Recherche Joueurs</h1>
          <p className="text-sm text-zinc-400 mt-2">Trouve un pseudo vite fait. Tape 2 lettres minimum.</p>
        </div>

        <form onSubmit={onSubmit} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pseudo du joueur (ex: Kolo, Drogba...)"
            className="w-full rounded-2xl bg-joy-card border border-joy-border pl-12 pr-4 py-4 text-sm outline-none focus:border-joy-violet focus:ring-2 focus:ring-joy-violet/20"
            autoFocus
          />
        </form>

        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">{results.length} resultats {query && `pour "${query}"`}</p>
          <Link href="/palmares" className="text-xs text-joy-violet hover:text-white">Voir palmares complet →</Link>
        </div>

        <div className="grid gap-3">
          {loading ? (
            <div className="py-20 text-center text-zinc-500">Recherche en cours...</div>
          ) : results.length === 0 ? (
            query.length >= 2 ? (
              <div className="card-premium rounded-2xl p-10 text-center">
                <Users className="h-10 w-10 mx-auto text-zinc-600 mb-3" />
                <p className="font-bold">Aucun joueur trouve pour "{query}"</p>
                <p className="text-xs text-zinc-500 mt-1">Verifie l'orthographe ou va sur le palmares.</p>
              </div>
            ) : (
              <div className="card-premium rounded-2xl p-10 text-center text-zinc-500 text-sm">Commence a taper un pseudo. Recherche rapide et 100% en direct.</div>
            )
          ) : (
            results.map((p) => (
              <Link key={p.id} href={`/profile/${p.id}`} className="card-premium rounded-2xl p-4 flex items-center gap-4 hover:border-joy-violet/40 transition group">
                <div className="h-12 w-12 rounded-xl bg-gradient-joy flex items-center justify-center font-black group-hover:scale-105 transition">{p.pseudo[0].toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold flex items-center gap-2">{p.pseudo} { (p.titres ?? 0) > 2 && <Crown className="h-4 w-4 text-amber-400" />}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[11px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Trophy className="h-3 w-3" /> {p.trophies ?? 0} troph.</span>
                    <span className="text-[11px] bg-joy-card border border-joy-border px-2 py-0.5 rounded-full">{p.victoires ?? 0} victoires</span>
                  </div>
                </div>
                <div className="text-xs text-zinc-500">Voir profil →</div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
