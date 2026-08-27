
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Swords, Users, Zap, Crown, Flame, Wallet, CheckCircle2, HelpCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const supabase = createClient();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [playersCount, setPlayersCount] = useState(347);
  const [topPlayers, setTopPlayers] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: tours } = await supabase.from("tournaments").select("*").eq("status","OUVERT").order("start_date",{ascending:true}).limit(3);
      if (tours && tours.length>0) setTournaments(tours);
      const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      if (count && count>0) setPlayersCount(count);
      const { data: players } = await supabase.from("profiles").select("id, username, display_name, wins, avatar_url, role").order("wins",{ascending:false}).limit(4);
      if (players) setTopPlayers(players);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      {/* HERO - ANCIEN DESIGN RESTAURE */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#7C3AED]/20 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#7C3AED]/20 blur-[120px] rounded-full" />
        <div className="absolute top-40 right-20 w-[400px] h-[400px] bg-[#06B6D4]/15 blur-[100px] rounded-full" />
        <div className="relative mx-auto max-w-7xl px-6 py-12 md:py-20">
          <div className="flex flex-col items-start gap-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-[11px] font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300">{playersCount} JOUEURS EN LIGNE</span>
            </div>
            
            <h1 className="font-black leading-[0.9] tracking-[-0.05em] text-[48px] md:text-[84px]">
              <span className="block">REJOINS</span>
              <span className="block bg-gradient-to-r from-[#A855F7] to-[#06B6D4] bg-clip-text text-transparent">L&apos;ARÈNE.</span>
            </h1>
            
            <p className="max-w-xl text-[16px] md:text-[18px] leading-relaxed text-zinc-400">
              Abidjan joue ici. Défie les meilleurs, grimpe le classement et encaisse tes gains via Wave en moins de 24h.
            </p>

            <div className="grid grid-cols-3 gap-6 mt-4">
              <div className="text-center md:text-left">
                <p className="text-3xl font-black text-white flex items-center gap-2"><Trophy className="h-6 w-6 text-violet-500" />{tournaments.length || 3}</p>
                <p className="text-[11px] font-bold tracking-widest text-zinc-500 mt-1 uppercase">Tournois<br/>Chaque semaine</p>
              </div>
              <div className="text-center md:text-left border-x border-zinc-800 px-6">
                <p className="text-3xl font-black text-white flex items-center gap-2"><Swords className="h-6 w-6 text-cyan-400" />1V1</p>
                <p className="text-[11px] font-bold tracking-widest text-zinc-500 mt-1 uppercase">Défis<br/>directs</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-3xl font-black text-white flex items-center gap-2"><Wallet className="h-6 w-6 text-emerald-400" />Wave</p>
                <p className="text-[11px] font-bold tracking-widest text-zinc-500 mt-1 uppercase">Gains<br/>01 51 42 99 18</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <Link href="/tournaments" className="h-[48px] rounded-full bg-white text-black px-8 flex items-center gap-2 text-[13px] font-black hover:bg-zinc-200">VOIR LES TOURNOIS <Trophy className="h-4 w-4" /></Link>
              <Link href="/1v1" className="h-[48px] rounded-full border border-zinc-800 bg-[#15151E] px-8 flex items-center gap-2 text-[13px] font-black hover:border-white/20">DÉFIER EN 1V1 <Swords className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* TOURNOIS REELS */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex items-center justify-between">
          <h2 className="text-[22px] font-black flex items-center gap-2"><Trophy className="h-6 w-6 text-violet-500" /> Tournois ouverts (vrai)</h2>
          <Link href="/tournaments" className="text-xs text-zinc-500">Voir tout →</Link>
        </div>
        {tournaments.length===0 ? (
          <div className="mt-6 rounded-2xl border border-zinc-800 bg-[#101015] p-8 text-center text-zinc-500">Aucun tournoi ouvert pour le moment - crée-en dans /admin/tournaments/create</div>
        ) : (
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            {tournaments.map(t=>(
              <div key={t.id} className="rounded-[20px] border border-zinc-800 bg-[#15151E] p-5">
                <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-[#101015] border border-zinc-800">{t.game}</span>
                <h3 className="mt-3 font-black">{t.title}</h3>
                <p className="text-xs text-zinc-500 mt-1">{t.max_players} joueurs • {t.entry_fee} FCFA • Gains {t.prize_distribution?.["1"] || 0}F</p>
                <Link href={`/tournaments/${t.id}`} className="mt-4 block h-10 rounded-xl bg-white text-black flex items-center justify-center text-xs font-black">VOIR</Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* JOUEURS */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-[22px] font-black flex items-center gap-2"><Flame className="h-6 w-6 text-orange-400" /> Top joueurs (vrai data)</h2>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {(topPlayers.length>0 ? topPlayers : [{id:"1", username:"Aucun", display_name:"Aucun joueur", wins:0}]).map((p:any)=>(
            <Link key={p.id} href={p.username ? `/profile/${p.username}` : "#"} className="rounded-2xl border border-zinc-800 bg-[#15151E] p-4">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center font-black text-xs">{(p.display_name||p.username||"J")[0]}</div>
              <p className="mt-2 font-bold text-sm">{p.display_name||p.username}</p>
              <p className="text-[11px] text-zinc-500">{p.wins||0} victoires</p>
            </Link>
          ))}
        </div>
      </section>

      {/* COMMENT CA MARCHE + FAQ - ANCIEN DESIGN */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-[28px] font-black text-center">Comment ça marche ?</h2>
        <div className="mt-8 grid md:grid-cols-4 gap-4">
          {[
            {step:"01", title:"Inscris-toi", desc:"Crée ton compte avec ton pseudo."},
            {step:"02", title:"Paie sur Wave", desc:"01 51 42 99 18 et upload capture."},
            {step:"03", title:"Affronte", desc:"Bracket 10 joueurs réel."},
            {step:"04", title:"Encaisse", desc:"Gagne et récupère ton djai sur Wave"},
          ].map(s=>(
            <div key={s.step} className="rounded-2xl border border-zinc-800 bg-[#101015] p-6"><p className="text-3xl font-black bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent">{s.step}</p><h3 className="mt-2 font-black text-sm">{s.title}</h3><p className="mt-2 text-xs text-zinc-500">{s.desc}</p></div>
          ))}
        </div>
      </section>
    </div>
  );
}
