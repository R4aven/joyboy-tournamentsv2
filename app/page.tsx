"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, Users, Wallet, Crown, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Tournament = {
  id: string;
  name: string;
  game: string;
  participants_count?: number;
  max_players?: number;
  entry_fee?: number;
  prize_pool?: number;
  start_date?: string;
  status: string;
  description?: string;
};

export default function TournamentsPage() {
  const supabase = createClient();
  const [filter, setFilter] = useState("TOUS");
  const [q, setQ] = useState("");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchT = async () => {
      setLoading(true);
      const { data } = await supabase.from("tournaments").select("*").order("created_at", { ascending: false }).limit(50);
      if (data) setTournaments(data as any);
      setLoading(false);
    };
    fetchT();
  }, [supabase]);

  const filtered = tournaments.filter(t => {
    if (filter !== "TOUS" && t.status !== filter) return false;
    if (q && !t.name.toLowerCase().includes(q.toLowerCase()) && !(t.game || "").toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-black tracking-tight flex items-center gap-3"><Trophy className="h-8 w-8 text-[#7C3AED]" /> Tournois</h1>
            <p className="mt-2 text-[13px] text-zinc-400">{tournaments.length} tournois réels • Paiement Wave 01 51 42 99 18</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher jeu, nom..." className="h-10 w-[220px] rounded-full border border-[#22222F] bg-[#15151E] pl-10 pr-4 text-[12px] outline-none placeholder:text-zinc-600 focus:border-[#7C3AED]/50" />
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {["TOUS","OUVERT","COMPLET","EN_COURS","TERMINE"].map(s=>(
            <button key={s} onClick={()=>setFilter(s)} className={`rounded-full px-4 py-2 text-[11px] font-black tracking-widest border transition ${filter===s ? "bg-white text-black border-white" : "bg-[#15151E] border-[#22222F] text-zinc-400 hover:text-white"}`}>{s}</button>
          ))}
        </div>

        {loading ? (
          <div className="mt-20 text-center text-zinc-500">Chargement des vrais tournois...</div>
        ) : (
          <div className="mt-8 grid md:grid-cols-3 gap-5">
            {filtered.map(t=>(
              <div key={t.id} className="group rounded-[22px] border border-[#22222F] bg-[#15151E] p-5 hover:border-[#7C3AED]/40 transition-all">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#101015] border border-[#22222F] px-3 py-1 text-[10px] font-bold">{t.game || "FC 26"}</span>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-black border ${t.status==='OUVERT'?'bg-emerald-500/10 text-emerald-300 border-emerald-500/20': t.status==='COMPLET'?'bg-amber-500/10 text-amber-300 border-amber-500/20':'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>{t.status}</span>
                </div>
                <h3 className="mt-4 text-[18px] font-black leading-tight">{t.name}</h3>
                <p className="mt-1 text-[12px] text-zinc-500 line-clamp-2">{t.description || "Tournoi JOYBOY officiel"}</p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-[#101015] border border-[#22222F]/60 p-2.5 text-center"><Users className="mx-auto h-4 w-4 text-zinc-500" /><p className="mt-1 text-[13px] font-bold">{t.participants_count ?? 0}/{t.max_players ?? 10}</p><p className="text-[10px] text-zinc-500">Joueurs</p></div>
                  <div className="rounded-xl bg-[#101015] border border-[#22222F]/60 p-2.5 text-center"><Wallet className="mx-auto h-4 w-4 text-zinc-500" /><p className="mt-1 text-[13px] font-bold">{t.entry_fee ?? 1000}F</p><p className="text-[10px] text-zinc-500">Entrée</p></div>
                  <div className="rounded-xl bg-[#101015] border border-[#22222F]/60 p-2.5 text-center"><Crown className="mx-auto h-4 w-4 text-amber-400" /><p className="mt-1 text-[13px] font-bold">{t.prize_pool ?? 7000}F</p><p className="text-[10px] text-zinc-500">Gains</p></div>
                </div>
                <Link href={`/tournaments/${t.id}`} className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-[12px] font-black tracking-wide hover:opacity-90 transition">VOIR LE TOURNOI</Link>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length===0 && <div className="mt-12 rounded-[20px] border border-[#22222F] bg-[#101015] p-12 text-center"><p className="text-[14px] font-bold">Aucun tournoi trouvé</p><p className="mt-2 text-[12px] text-zinc-500">Crée ton premier tournoi dans /admin/tournaments/create</p></div>}
      </div>
    </div>
  );
}
