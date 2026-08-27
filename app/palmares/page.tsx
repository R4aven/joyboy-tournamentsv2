
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trophy, Crown, Search } from "lucide-react";
import Link from "next/link";

export default function PalmaresPage() {
  const supabase = createClient();
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.from("profiles").select("id, username, display_name, avatar_url, wins, trophies").order("wins",{ascending:false}).limit(100);
      if (data) setPlayers(data);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = players.filter(p => !search || (p.display_name||p.username||"").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        <div className="text-center"><h1 className="text-4xl font-black">Hall of Fame</h1></div>
        <div className="flex justify-center"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..." className="pl-9 pr-4 py-2 rounded-xl bg-[#15151E] border border-zinc-800 text-sm w-60" /></div></div>
        {loading ? <p className="text-center text-zinc-500">Chargement...</p> : filtered.length===0 ? <div className="rounded-2xl border border-zinc-800 bg-[#101015] p-8 text-center text-zinc-500">Aucun joueur trouvé</div> : (
          <div className="grid md:grid-cols-3 gap-4">
            {filtered.map(p=>(
              <div key={p.id} className="rounded-2xl border border-zinc-800 bg-[#101015] p-5"><p className="font-bold">{p.display_name||p.username}</p><p className="text-xs text-zinc-500">{p.wins||0} victoires</p><Link href={`/profile/${p.username}`} className="mt-3 block rounded-xl bg-[#15151E] border border-zinc-800 py-2 text-center text-xs font-bold">Voir</Link></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
