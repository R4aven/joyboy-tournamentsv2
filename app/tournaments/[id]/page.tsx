"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Trophy, Users, Wallet, Calendar, Clock, Shield, FileText, Crown, Swords } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Tournament = {
  id: string;
  name: string;
  game: string;
  description: string;
  status: string;
  entry_fee: number;
  prize_pool: number;
  max_players: number;
  start_date: string;
  created_at: string;
};

type Participant = {
  id: string;
  user_id: string;
  username?: string;
  status?: string;
};

const tabs = [
  { id: "infos", label: "Informations", icon: FileText },
  { id: "participants", label: "Participants", icon: Users },
  { id: "bracket", label: "Bracket", icon: Trophy },
  { id: "matchs", label: "Matchs", icon: Swords },
  { id: "reglement", label: "Règlement", icon: Shield },
  { id: "gains", label: "Gains", icon: Crown },
];

export default function TournamentDetailReal() {
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();
  const [tab, setTab] = useState("infos");
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: t } = await supabase.from("tournaments").select("*").eq("id", id).maybeSingle();
      if (t) setTournament(t as Tournament);

      const { data: p } = await supabase.from("tournament_participants").select("id, user_id, status, profiles(username)").eq("tournament_id", id);
      if (p) {
        const mapped = p.map((x: any) => ({
          id: x.id,
          user_id: x.user_id,
          username: x.profiles?.username || "Joueur",
          status: x.status || "Validé",
        }));
        setParticipants(mapped);
      }
      setLoading(false);
    };
    if (id) fetchData();
  }, [id, supabase]);

  if (loading) return <div className="min-h-screen bg-[#08080B] text-white flex items-center justify-center">Chargement vrai tournoi...</div>;
  if (!tournament) return <div className="min-h-screen bg-[#08080B] text-white flex items-center justify-center"><div className="text-center"><p className="font-bold">Tournoi introuvable</p><p className="text-xs text-zinc-500">ID {id} n'existe pas dans Supabase. Crée-le dans /admin</p><Link href="/tournaments" className="mt-4 inline-flex h-9 px-4 rounded-xl bg-white text-black text-xs font-bold">Retour</Link></div></div>;

  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Link href="/tournaments" className="text-[12px] text-zinc-500 hover:text-white">← Retour tournois réels</Link>
        <div className="mt-4 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[#15151E] border border-[#22222F] px-3 py-1 text-[11px] font-bold">{tournament.game}</span>
              <span className="rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 px-3 py-1 text-[11px] font-black">{tournament.status}</span>
            </div>
            <h1 className="mt-3 text-[32px] font-black tracking-tight">{tournament.name}</h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-zinc-400">{tournament.description || "Tournoi officiel JOYBOY"}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full bg-[#101015] border border-[#22222F] px-3 py-1.5 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {new Date(tournament.start_date || tournament.created_at).toLocaleDateString("fr-FR")}</span>
              <span className="rounded-full bg-[#101015] border border-[#22222F] px-3 py-1.5 flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {participants.length}/{tournament.max_players || 10}</span>
              <span className="rounded-full bg-[#101015] border border-[#22222F] px-3 py-1.5 flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> {tournament.entry_fee || 1000} FCFA</span>
            </div>
          </div>
          <div className="shrink-0 rounded-[20px] border border-[#22222F] bg-[#15151E] p-5 w-full md:w-[320px]">
            <p className="text-[12px] font-black uppercase tracking-widest text-zinc-500">Rejoindre - VRAI TOURNOI</p>
            <p className="mt-3 text-[13px] text-zinc-300">Paiement Wave uniquement. Ta place est confirmée après validation admin.</p>
            <Link href={`/tournaments/${id}/payment`} className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-[13px] font-black tracking-wide">PARTICIPER • {tournament.entry_fee || 1000} FCFA</Link>
            <p className="mt-3 text-center text-[11px] text-zinc-500">Wave : <span className="font-bold text-white">01 51 42 99 18</span></p>
          </div>
        </div>

        <div className="mt-8 flex gap-2 overflow-x-auto border-b border-[#22222F] pb-px">
          {tabs.map(tb=>{
            const Icon = tb.icon;
            return <button key={tb.id} onClick={()=>setTab(tb.id)} className={`shrink-0 flex items-center gap-2 border-b-2 px-4 py-3 text-[12px] font-bold transition ${tab===tb.id ? 'border-[#7C3AED] text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}><Icon className="h-4 w-4" />{tb.label}</button>
          })}
        </div>

        <div className="mt-6">
          {tab==='infos' && (
            <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-6">
              <h3 className="text-[14px] font-black">Infos réelles depuis Supabase</h3>
              <p className="mt-3 text-[13px] text-zinc-400">Ce tournoi existe vraiment dans ta table tournaments. Pas de mock JOYBOY CUP #12.</p>
              <div className="mt-4 grid md:grid-cols-3 gap-3 text-[12px]">
                <div className="rounded-xl bg-[#15151E] border border-[#22222F] p-3"><p className="text-zinc-500">Jeu</p><p className="font-bold mt-1">{tournament.game}</p></div>
                <div className="rounded-xl bg-[#15151E] border border-[#22222F] p-3"><p className="text-zinc-500">Entrée</p><p className="font-bold mt-1">{tournament.entry_fee} FCFA</p></div>
                <div className="rounded-xl bg-[#15151E] border border-[#22222F] p-3"><p className="text-zinc-500">Prize</p><p className="font-bold mt-1">{tournament.prize_pool} FCFA</p></div>
              </div>
            </div>
          )}
          {tab==='participants' && (
            <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-6">
              <h3 className="text-[14px] font-black">Joueurs réels inscrits ({participants.length}/{tournament.max_players || 10})</h3>
              {participants.length===0 ? <p className="mt-4 text-[13px] text-zinc-500">Aucun participant réel encore. Sois le premier !</p> : (
                <div className="mt-4 grid md:grid-cols-2 gap-3">
                  {participants.map((p,i)=>(
                    <div key={p.id} className="flex items-center justify-between rounded-xl border border-[#22222F] bg-[#15151E] p-4">
                      <div className="flex items-center gap-3"><span className="text-[11px] font-bold text-zinc-500">{i+1}.</span><div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center text-[11px] font-black">{p.username?.[0].toUpperCase()}</div><Link href={`/profile/${p.username}`} className="text-[13px] font-bold hover:text-[#A855F7]">{p.username}</Link></div>
                      <span className="rounded-full px-3 py-1 text-[10px] font-bold bg-emerald-500/15 text-emerald-300">{p.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {tab==='bracket' && <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-6"><h3 className="text-[14px] font-black">Bracket réel</h3><p className="mt-3 text-[13px] text-zinc-400">Le bracket sera généré automatiquement quand le tournoi sera complet avec de vrais joueurs.</p></div>}
          {tab==='matchs' && <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-6"><h3 className="text-[14px] font-black">Matchs</h3><p className="mt-3 text-[13px] text-zinc-500">Aucun match réel encore.</p></div>}
          {tab==='reglement' && <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-6"><h3 className="text-[14px] font-black">Règlement officiel</h3><p className="mt-3 text-[13px] text-zinc-400">Fair-play obligatoire. Capture obligatoire. Paiement Wave 01 51 42 99 18. Gains sous 24h.</p></div>}
          {tab==='gains' && <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-6"><h3 className="text-[14px] font-black">Gains</h3><p className="mt-3 text-[13px]">Champion: {Math.round((tournament.prize_pool || 7000)*0.7)} FCFA, Finaliste: {Math.round((tournament.prize_pool || 7000)*0.2)} FCFA, 3e: {Math.round((tournament.prize_pool || 7000)*0.1)} FCFA</p></div>}
        </div>
      </div>
    </div>
  );
}
