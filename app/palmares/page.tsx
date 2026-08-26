"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trophy, Crown, Medal, Award, Flame, Star, Swords, Filter, Search } from "lucide-react";
import Link from "next/link";

type Player = {
  id: string;
  pseudo: string;
  avatar_url?: string;
  trophies: number;
  titres: number;
  victoires?: number;
  victoires_1v1?: number;
  victoires_tournoi?: number;
  finales?: number;
  top3?: number;
  meilleur_streak?: number;
  jeu_fav?: string;
};

const SORTS = [
  { id: "trophies", label: "Trophees" },
  { id: "titres", label: "Titres" },
  { id: "victoires", label: "Victoires" },
];

export default function PalmaresPage() {
  const supabase = createClient();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"trophies" | "titres" | "victoires">("trophies");
  const [search, setSearch] = useState("");
  const [jeuFilter, setJeuFilter] = useState("ALL");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      let query = supabase.from("profiles").select("*").order(sortBy === "trophies" ? "trophies" : sortBy === "titres" ? "titres" : "victoires", { ascending: false }).limit(100);
      if (jeuFilter !== "ALL") query = query.eq("jeu_fav", jeuFilter);
      const { data } = await query;
      if (data) setPlayers(data as any);
      setLoading(false);
    };
    fetchData();
  }, [sortBy, jeuFilter]);

  const filtered = players.filter((p) => !search || p.pseudo.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-joy-violet/20 border border-joy-violet/30 px-4 py-1 text-xs font-bold text-joy-violet">PALMARES E-TOURNOIS CI - ABIDJAN CI</div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            Hall of <span className="text-gradient">Fame</span>
          </h1>
          <p className="text-zinc-400 text-sm max-w-xl mx-auto">
            Classement officiel des boss. Trophees, titres, victoires. Pas de ELO, que du concret. Wave: 01 51 42 99 18
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <div className="flex gap-1 p-1 rounded-xl bg-joy-card border border-joy-border">
            {SORTS.map((s) => (
              <button key={s.id} onClick={() => setSortBy(s.id as any)} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${sortBy === s.id ? "bg-joy-violet text-white" : "text-zinc-400 hover:text-white"}`}>{s.label}</button>
            ))}
          </div>
          <div className="flex gap-1 p-1 rounded-xl bg-joy-card border border-joy-border">
            {["ALL", "eFootball 2025", "EA FC Mobile", "EA FC 25"].map((j) => (
              <button key={j} onClick={() => setJeuFilter(j)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${jeuFilter === j ? "bg-joy-cyan text-black" : "text-zinc-400"}`}>{j === "ALL" ? "Tous jeux" : j}</button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pseudo..." className="pl-9 pr-4 py-2 rounded-xl bg-joy-card border border-joy-border text-sm w-60 outline-none focus:border-joy-violet" />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-zinc-500">Chargement palmares...</div>
        ) : (
          <>
            {/* Top 3 podium */}
            {filtered.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto items-end">
                {[
                  { player: filtered[1], rank: 2, height: "h-24", color: "from-zinc-400 to-zinc-600" },
                  { player: filtered[0], rank: 1, height: "h-32", color: "from-amber-400 to-yellow-600" },
                  { player: filtered[2], rank: 3, height: "h-20", color: "from-orange-400 to-amber-700" },
                ].map(({ player, rank, height, color }) => (
                  <div key={player.id} className="text-center">
                    <div className="relative mx-auto">
                      <div className={`mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center font-black text-xl shadow-glow`}>
                        {rank === 1 ? <Crown className="h-8 w-8 text-white" /> : rank}
                      </div>
                      <div className={`mx-auto mt-3 rounded-t-xl bg-joy-card border border-joy-border w-full ${height} flex flex-col justify-end p-3`}>
                        <p className="font-bold text-sm truncate">{player.pseudo}</p>
                        <p className="text-xs text-amber-400 font-bold">{sortBy === "trophies" ? `${player.trophies} troph.` : sortBy === "titres" ? `${player.titres} titres` : `${player.victoires ?? 0} V`}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* List cartes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p, idx) => (
                <Link key={p.id} href={`/profile/${p.id}`} className="card-premium rounded-2xl p-5 hover:border-joy-violet/40 transition group">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="h-14 w-14 rounded-xl bg-gradient-joy flex items-center justify-center font-black text-lg group-hover:scale-105 transition">
                        {p.pseudo[0].toUpperCase()}
                      </div>
                      <div className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-joy-black border border-joy-border flex items-center justify-center text-[10px] font-bold">
                        #{idx + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate flex items-center gap-2">
                        {p.pseudo}
                        {idx === 0 && <Crown className="h-4 w-4 text-amber-400" />}
                      </p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[11px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Trophy className="h-3 w-3" /> {p.trophies ?? 0}</span>
                        <span className="text-[11px] bg-joy-violet/20 text-violet-300 px-2 py-0.5 rounded-full font-bold">{p.titres ?? 0} titres</span>
                        <span className="text-[11px] bg-joy-card border border-joy-border px-2 py-0.5 rounded-full">{p.victoires ?? 0} V</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-[#0E0E14] border border-joy-border p-2">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold">Finales</p>
                      <p className="font-bold text-sm">{p.finales ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-[#0E0E14] border border-joy-border p-2">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold">Top3</p>
                      <p className="font-bold text-sm">{p.top3 ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-[#0E0E14] border border-joy-border p-2">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold flex items-center justify-center gap-1"><Flame className="h-3 w-3" /> Streak</p>
                      <p className="font-bold text-sm">{p.meilleur_streak ?? 0}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
