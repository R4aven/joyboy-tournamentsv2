"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, Users, Wallet, Crown, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Tournament = {
  id: string;
  title: string;
  game: string;
  description: string;
  status: string;
  entry_fee: number;
  max_players: number;
  start_date: string;
  created_at: string;
};

export default function TournamentsPage() {
  const supabase = createClient();
  const [filter, setFilter] = useState("TOUS");
  const [q, setQ] = useState("");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const { data } = await supabase.from("tournaments").select("id,title,game,description,status,entry_fee,max_players,start_date,created_at").order("created_at", { ascending: false }).limit(50);
      if (data) {
        setTournaments(data as any);
        // compte participants réels
        const { data: tp } = await supabase.from("tournament_players").select("tournament_id");
        if (tp) {
          const c: Record<string, number> = {};
          tp.forEach((r: any) => { c[r.tournament_id] = (c[r.tournament_id] || 0) + 1; });
          setCounts(c);
        }
      }
      setLoading(false);
    };
    fetchAll();
  }, [supabase]);

  const filtered = tournaments.filter(t => {
    if (filter !== "TOUS" && t.status !== filter) return false;
    if (q && !t.title.toLowerCase().includes(q.toLowerCase()) && !(t.game||"").toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-black tracking-tight flex items-center gap-3"><Trophy className="h-8 w-8 text-[#7C3AED]" /> Tournois RÉELS</h1>
            <p className="mt-2 text-[13px] text-zinc-400">{tournaments.length} tournois réels en base • Faux supprimés ✅</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher jeu, nom..." className="h-10 w-[220px] rounded-full border border-[#22222F] bg-[#15151E] pl-10 pr-4 text-[12px] outline-none" />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {["TOUS","OUVERT","COMPLET","EN_COURS","TERMINE"].map(s=>(
            <button key={s} onClick={()=>setFilter(s)} className={`rounded-full px-4 py-2 text-[11px] font-black border ${filter===s ? "bg-white text-black border-white" : "bg-[#15151E] border-[#22222F] text-zinc-400"}`}>{s}</button>
          ))}
        </div>

        {loading ? <div className="mt-20 text-center text-zinc-500">Chargement vrais tournois...</div> : (
          <div className="mt-8 grid md:grid-cols-3 gap-5">
            {filtered.map(t=>{
              const cnt = counts[t.id] || 0;
              const prize = (t.entry_fee || 1000) * cnt * 0.7;
              return (
              <div key={t.id} className="group rounded-[22px] border border-[#22222F] bg-[#15151E] p-5 hover:border-[#7C3AED]/40 transition">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#101015] border border-[#22222F] px-3 py-1 text-[10px] font-bold">{t.game}</span>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-black border ${t.status==='OUVERT'?'bg-emerald-500/10 text-emerald-300 border-emerald-500/20':'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>{t.status}</span>
                </div>
                <h3 className="mt-4 text-[18px] font-black leading-tight">{t.title}</h3>
                <p className="mt-1 text-[12px] text-zinc-500 line-clamp-2">{t.description}</p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-[#101015] border border-[#22222F]/60 p-2.5 text-center"><Users className="mx-auto h-4 w-4 text-zinc-500" /><p className="mt-1 text-[13px] font-bold">{cnt}/{t.max_players}</p></div>
                  <div className="rounded-xl bg-[#101015] border border-[#22222F]/60 p-2.5 text-center"><Wallet className="mx-auto h-4 w-4 text-zinc-500" /><p className="mt-1 text-[13px] font-bold">{t.entry_fee}F</p></div>
                  <div className="rounded-xl bg-[#101015] border border-[#22222F]/60 p-2.5 text-center"><Crown className="mx-auto h-4 w-4 text-amber-400" /><p className="mt-1 text-[13px] font-bold">{Math.round(prize)}F</p></div>
                </div>
                <Link href={`/tournaments/${t.id}`} className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-[12px] font-black">VOIR LE TOURNOI</Link>
              </div>
            )})}
          </div>
        )}
        {!loading && filtered.length===0 && <div className="mt-12 rounded-[20px] border border-[#22222F] bg-[#101015] p-12 text-center"><p className="font-bold">Aucun tournoi réel</p><p className="text-xs text-zinc-500 mt-1">Crée-en un dans /admin/tournaments/create</p></div>}
      </div>
    </div>
  );
}
