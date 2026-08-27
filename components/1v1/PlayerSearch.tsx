
"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Loader2 } from "lucide-react";
import type { PlayerStats } from "@/lib/1v1/challengeLogic";

type Row = { id: string; username: string; display_name?: string; avatar_url: string | null; city?: string; bio?: string; wins?: number; losses?: number; tournaments_won?: number; wins_1v1?: number; };

function map(row: Row): PlayerStats {
  return {
    id: row.id,
    pseudo: row.display_name || row.username,
    username: row.username,
    avatar_url: row.avatar_url,
    matchs: (row.wins||0)+(row.losses||0),
    victoires: row.wins||0,
    defaites: row.losses||0,
    taux_victoire: (row.wins||0)+(row.losses||0) >0 ? Math.round(((row.wins||0)/((row.wins||0)+(row.losses||0)))*100) : 0,
    tournois_remportes: row.tournaments_won||0,
    victoires_1v1: row.wins_1v1||0,
    palmares: [],
    ville: row.city,
    bio: row.bio,
  } as any;
}

export default function PlayerSearch({ onSelect }: { onSelect: (p: PlayerStats)=>void }) {
  const supabase = createClient();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<any>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!q || q.trim().length < 1) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await supabase.from("profiles").select("id, username, display_name, avatar_url, city, bio, wins, losses, tournaments_won, wins_1v1").or(`username.ilike.%${q}%,display_name.ilike.%${q}%`).limit(10);
        setResults((data as Row[]||[]).map(map));
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer.current);
  }, [q]);

  return (
    <div className="relative">
      <div className="flex items-center gap-3 rounded-2xl border border-[#22222F] bg-[#101015] px-4 py-3">
        <Search className="h-5 w-5 text-zinc-500" />
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Cherche joueur des 1 lettre - ex: a, r..." className="flex-1 bg-transparent text-sm outline-none" />
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>
      {results.length > 0 && (
        <div className="absolute z-20 mt-2 w-full rounded-2xl border border-zinc-800 bg-[#15151E] shadow-xl max-h-80 overflow-auto">
          {results.map(r=>(
            <button key={r.id} onClick={()=>{ onSelect(r); setQ(""); setResults([]); }} className="w-full flex items-center gap-3 p-3 hover:bg-[#1C1C27] text-left">
              <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center font-bold text-xs">
                {r.avatar_url ? <img src={r.avatar_url} className="h-full w-full object-cover" /> : (r.pseudo?.[0]||"?")}
              </div>
              <div className="flex-1 min-w-0"><p className="text-sm font-bold truncate">{r.pseudo} @{r.username}</p><p className="text-[11px] text-zinc-500 truncate">{r.bio?.slice(0,50)||"Joueur"} • {r.victoires}V</p></div>
              <span className="text-[10px] bg-white text-black px-2 py-1 rounded-full font-bold">Voir</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
