
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Swords, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function OneVOnePage() {
  const supabase = createClient();
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("profiles").select("id, username, display_name, avatar_url, wins, losses, city").order("wins",{ascending:false}).limit(50);
      if (data) setPlayers(data);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = players.filter(p => !q || (p.display_name||p.username||"").toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-black flex items-center gap-3"><Swords className="h-8 w-8 text-violet-500" /> Duels 1V1</h1>
        <div className="mt-6 relative w-72"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" /><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher joueur..." className="pl-10 pr-4 py-2.5 rounded-xl bg-[#15151E] border border-zinc-800 text-sm w-full" /></div>
        {loading ? <p className="mt-8 text-zinc-500">Chargement...</p> : filtered.length===0 ? <div className="mt-8 rounded-2xl border border-zinc-800 bg-[#101015] p-8 text-center text-zinc-500">Aucun joueur trouvé</div> : (
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {filtered.map(p=>(
              <div key={p.id} className="rounded-2xl border border-zinc-800 bg-[#101015] p-5">
                <div className="flex items-center gap-3"><div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center font-black">{(p.display_name||p.username||"?")[0]}</div><div><p className="font-bold">{p.display_name||p.username}</p><p className="text-xs text-zinc-500">{p.city||"Abidjan"} • {p.wins||0}V</p></div></div>
                <Link href={`/profile/${p.username}`} className="mt-4 block rounded-xl bg-[#15151E] border border-zinc-800 py-2 text-center text-xs font-bold">Voir profil</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
