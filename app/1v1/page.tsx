
"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Swords, Search, Flame, Trophy, Clock, Filter } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type SortMode = "RECENT" | "BOOST_1V1" | "BOOST_TOURNOI" | "ALPHA";

export default function OneVOnePage() {
  const supabase = createClient();
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortMode>("RECENT");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // Vrai data seulement, pas de faux, tous les profiles
      const { data } = await supabase.from("profiles").select("id, username, display_name, avatar_url, wins, losses, tournaments_won, challenges_won, city, created_at, level").order("created_at", {ascending:false}).limit(100);
      if (data) setPlayers(data);
      setLoading(false);
    };
    load();
  }, []);

  // Effet Google: filtrage instantané sans bouton
  const filtered = useMemo(() => {
    let list = [...players];
    if (q) {
      const lower = q.toLowerCase();
      list = list.filter(p => (p.username||"").toLowerCase().includes(lower) || (p.display_name||"").toLowerCase().includes(lower));
    }
    if (sort==="RECENT") list.sort((a,b)=> new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (sort==="BOOST_1V1") list.sort((a,b)=> (b.challenges_won||0) - (a.challenges_won||0) || (b.wins||0)-(a.wins||0));
    if (sort==="BOOST_TOURNOI") list.sort((a,b)=> (b.tournaments_won||0) - (a.tournaments_won||0) || (b.wins||0)-(a.wins||0));
    if (sort==="ALPHA") list.sort((a,b)=> (a.username||"").localeCompare(b.username||""));
    return list;
  }, [players, q, sort]);

  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-black flex items-center gap-3"><Swords className="h-8 w-8 text-violet-500" /> Duels 1V1 - Vrais joueurs seulement</h1>
        
        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher joueur... (effet Google instantané)" className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#15151E] border border-zinc-800 text-sm focus:border-violet-600 focus:outline-none transition" />
            {q && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500">{filtered.length} résultats</span>}
          </div>
          <div className="flex gap-2 overflow-auto">
            <button onClick={()=>setSort("RECENT")} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold border flex items-center gap-1.5 ${sort==="RECENT" ? "bg-white text-black border-white" : "bg-[#15151E] border-zinc-800 text-zinc-400"}`}><Clock className="h-3.5 w-3.5" /> Récents</button>
            <button onClick={()=>setSort("BOOST_1V1")} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold border flex items-center gap-1.5 ${sort==="BOOST_1V1" ? "bg-white text-black border-white" : "bg-[#15151E] border-zinc-800 text-zinc-400"}`}><Flame className="h-3.5 w-3.5" /> Booster 1V1</button>
            <button onClick={()=>setSort("BOOST_TOURNOI")} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold border flex items-center gap-1.5 ${sort==="BOOST_TOURNOI" ? "bg-white text-black border-white" : "bg-[#15151E] border-zinc-800 text-zinc-400"}`}><Trophy className="h-3.5 w-3.5" /> Booster Tournois</button>
          </div>
        </div>

        {loading ? <p className="mt-8 text-zinc-500">Chargement vrais joueurs...</p> : filtered.length===0 ? <div className="mt-8 rounded-2xl border border-zinc-800 bg-[#101015] p-8 text-center text-zinc-500">Aucun joueur trouvé pour &quot;{q}&quot;</div> : (
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {filtered.map(p=>(
              <div key={p.id} className="group rounded-2xl border border-zinc-800 bg-[#101015] p-5 hover:border-violet-500/30 transition">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl overflow-hidden bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center font-black">{p.avatar_url ? <img src={p.avatar_url} className="h-full w-full object-cover" /> : (p.display_name||p.username||"?")[0]}</div>
                  <div className="flex-1 min-w-0"><p className="font-bold truncate">@{p.username}</p><p className="text-xs text-zinc-500 truncate">{p.display_name} • {p.city||"Abidjan"}</p></div>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-[#15151E] border border-zinc-800">Niv {p.level||1}</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-[#15151E] p-2"><p className="text-xs text-zinc-500">Victoires</p><p className="font-bold text-sm">{p.wins||0}</p></div>
                  <div className="rounded-xl bg-[#15151E] p-2"><p className="text-xs text-zinc-500">1V1</p><p className="font-bold text-sm text-orange-400">{p.challenges_won||0}</p></div>
                  <div className="rounded-xl bg-[#15151E] p-2"><p className="text-xs text-zinc-500">Tournois</p><p className="font-bold text-sm text-amber-400">{p.tournaments_won||0}</p></div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link href={`/profile/${p.username}`} className="rounded-xl bg-[#15151E] border border-zinc-800 py-2.5 text-center text-xs font-bold hover:bg-[#1A1A25]">Voir profil</Link>
                  <Link href={`/profile/${p.username}?chat=1`} className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 py-2.5 text-center text-xs font-bold text-white">Chatter</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
