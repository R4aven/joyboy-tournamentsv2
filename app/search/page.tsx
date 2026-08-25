"use client";
import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Users, Trophy, Crown, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type Profile = {
  id: string;
  username: string;
  avatar_url?: string | null;
  wins?: number;
  tournaments_won?: number;
};

function SearchContent() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initial);
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  // Recherche LIVE comme Google
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      setLoading(true);
      try {
        // Cherche dans username (pas pseudo) + sans mock
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, wins, tournaments_won")
          .ilike("username", `%${query.trim()}%`)
          .not("username", "ilike", "mock-%")
                    .limit(10);

        if (error) {
          console.error(error);
          setResults([]);
        } else if (data) {
          // Si tu as encore des fakes avec id mock-, on filtre aussi par id
          const real = data.filter((p: any) => !p.id.startsWith("mock-"));
          setResults(real as Profile[]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 150); // 150ms = ultra rapide comme Google

    return () => clearTimeout(delay);
  }, [query, supabase]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-black flex items-center justify-center gap-3">
          <Search className="h-7 w-7 text-[#7C3AED]" /> Recherche Joueurs
        </h1>
        <p className="text-sm text-zinc-400 mt-2">Tape 2 lettres, les résultats sortent direct comme Google.</p>
      </div>

      {/* INPUT + DROPDOWN GOOGLE */}
      <div className="relative">
        <form onSubmit={onSubmit} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            placeholder="Tape joy pour trouver joyboy..."
            className="w-full rounded-2xl bg-[#15151E] border border-[#22222F] pl-12 pr-12 py-4 text-[14px] text-white outline-none focus:border-[#7C3AED]/60 focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
            autoFocus
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {loading && <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />}
          </div>
        </form>

        {/* DROPDOWN RESULTS - comme Google */}
        {focused && query.length >= 2 && (
          <div className="absolute z-50 mt-2 w-full rounded-2xl border border-[#22222F] bg-[#101015] shadow-[0_10px_40px_rgba(0,0,0,0.6)] overflow-hidden">
            {loading ? (
              <div className="p-4 text-center text-[13px] text-zinc-500">Recherche...</div>
            ) : results.length === 0 ? (
              <div className="p-6 text-center">
                <Users className="h-8 w-8 mx-auto text-zinc-600 mb-2" />
                <p className="text-[13px] font-bold text-zinc-300">Aucun joueur pour "{query}"</p>
                <p className="text-[11px] text-zinc-500 mt-1">Vérifie l'orthographe</p>
              </div>
            ) : (
              <div className="max-h-[360px] overflow-auto">
                {results.map((p) => (
                  <Link
                    key={p.id}
                    href={`/profile/${p.username}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#15151E] transition border-b border-[#22222F]/50 last:border-0 group"
                  >
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center font-black text-white text-[13px] shrink-0">
                      {p.avatar_url ? <img src={p.avatar_url} alt={p.username} className="h-full w-full rounded-xl object-cover" /> : p.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-white group-hover:text-[#A855F7] truncate">{p.username}</p>
                      <p className="text-[11px] text-zinc-500">{p.wins ?? 0} victoires • {p.tournaments_won ?? 0} titres</p>
                    </div>
                    <div className="text-[11px] text-zinc-500 group-hover:text-white">Voir →</div>
                  </Link>
                ))}
                <div className="p-2 text-center border-t border-[#22222F]/50">
                  <p className="text-[10px] text-zinc-600">{results.length} résultats pour "{query}"</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* LISTE PRINCIPALE EN DESSOUS AUSSI */}
      <div className="grid gap-3 pt-4">
        {results.length > 0 && !focused && (
          <>
            <p className="text-xs text-zinc-500">{results.length} résultats pour "{query}"</p>
            {results.map((p) => (
              <Link key={p.id} href={`/profile/${p.username}`} className="rounded-2xl border border-[#22222F] bg-[#101015] p-4 flex items-center gap-4 hover:border-[#7C3AED]/40 transition group">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center font-black text-white">{p.username[0].toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold flex items-center gap-2">{p.username}</p>
                  <span className="text-[11px] bg-[#15151E] border border-[#22222F] px-2 py-0.5 rounded-full text-zinc-400">{p.wins ?? 0} victoires</span>
                </div>
                <div className="text-xs text-zinc-500">Voir profil →</div>
              </Link>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      <Suspense fallback={<div className="py-20 text-center text-zinc-500">Chargement...</div>}>
        <SearchContent />
      </Suspense>
    </div>
  );
}
