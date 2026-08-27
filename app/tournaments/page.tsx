
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Users, Wallet, Crown, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function TournamentsPage() {
  const supabase = createClient();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [filter, setFilter] = useState("TOUS");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.from("tournaments").select("*").order("start_date", {ascending:true});
      if (data) setTournaments(data);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = tournaments.filter(t => {
    if (filter !== "TOUS" && t.status !== filter) return false;
    if (q && !t.title.toLowerCase().includes(q.toLowerCase()) && !t.game.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div><h1 className="text-[32px] font-black flex items-center gap-3"><Trophy className="h-8 w-8 text-[#7C3AED]" /> Tournois</h1></div>
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" /><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher..." className="h-10 w-[220px] rounded-full border border-[#22222F] bg-[#15151E] pl-10 pr-4 text-[12px]" /></div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {["TOUS","OUVERT","COMPLET","EN_COURS","TERMINE"].map(s=>(
            <button key={s} onClick={()=>setFilter(s)} className={`rounded-full px-4 py-2 text-[11px] font-black border ${filter===s ? "bg-white text-black border-white" : "bg-[#15151E] border-[#22222F] text-zinc-400"}`}>{s}</button>
          ))}
        </div>
        {loading ? <p className="mt-8 text-zinc-500">Chargement...</p> : filtered.length===0 ? <div className="mt-8 rounded-2xl border border-zinc-800 bg-[#101015] p-8 text-center text-zinc-500">Aucun tournoi trouvé</div> : (
          <div className="mt-8 grid md:grid-cols-3 gap-5">
            {filtered.map(t=>(
              <div key={t.id} className="rounded-[22px] border border-[#22222F] bg-[#15151E] p-5">
                <div className="flex items-center justify-between"><span className="rounded-full bg-[#101015] border border-[#22222F] px-3 py-1 text-[10px] font-bold">{t.game}</span><span className="rounded-full px-3 py-1 text-[10px] font-black bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">{t.status}</span></div>
                <h3 className="mt-4 text-[18px] font-black">{t.title}</h3>
                <p className="mt-1 text-[12px] text-zinc-500 line-clamp-2">{t.description}</p>
                <div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-xl bg-[#101015] border border-[#22222F]/60 p-2.5 text-center"><Users className="mx-auto h-4 w-4" /><p className="mt-1 text-[13px] font-bold">{t.max_players}</p></div><div className="rounded-xl bg-[#101015] border border-[#22222F]/60 p-2.5 text-center"><Wallet className="mx-auto h-4 w-4" /><p className="mt-1 text-[13px] font-bold">{t.entry_fee}F</p></div><div className="rounded-xl bg-[#101015] border border-[#22222F]/60 p-2.5 text-center"><Crown className="mx-auto h-4 w-4 text-amber-400" /><p className="mt-1 text-[13px] font-bold">{t.prize_distribution?.["1"] || 0}F</p></div></div>
                <Link href={`/tournaments/${t.id}`} className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-white text-black text-xs font-black">VOIR TOURNOI</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
