
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Swords, Users, Zap, Crown, Flame, CheckCircle2, HelpCircle, Star, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const supabase = createClient();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [topPlayers, setTopPlayers] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: tours } = await supabase.from("tournaments").select("id, title, game, max_players, entry_fee, prize_distribution, status, start_date").eq("status", "OUVERT").order("start_date", {ascending: true}).limit(3);
      if (tours) setTournaments(tours);
      const { data: players } = await supabase.from("profiles").select("id, pseudo, username, wins, trophies, avatar_url, titles").order("wins", {ascending: false}).limit(4);
      if (players) setTopPlayers(players);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#7C3AED]/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 text-center">
          <h1 className="text-5xl font-black">JOYBOY TOURNAMENTS</h1>
          <p className="mt-3 text-zinc-400">eFootball CI - Wave 01 51 42 99 18</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/tournaments" className="rounded-xl bg-white text-black px-6 py-3 font-bold">Voir tournois</Link>
            <Link href="/1v1" className="rounded-xl bg-[#15151E] border border-zinc-800 px-6 py-3 font-bold">Duels 1V1</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <h2 className="text-2xl font-black flex items-center gap-2"><Trophy className="h-6 w-6 text-violet-500" /> Tournois ouverts (vrai data)</h2>
        {tournaments.length===0 ? <p className="mt-4 text-zinc-500">Aucun tournoi ouvert - crée-en dans /admin/tournaments/create</p> : (
          <div className="mt-4 grid md:grid-cols-3 gap-4">
            {tournaments.map(t=>(
              <div key={t.id} className="rounded-2xl border border-zinc-800 bg-[#101015] p-5">
                <p className="text-xs text-zinc-500">{t.game}</p>
                <h3 className="font-bold mt-1">{t.title}</h3>
                <p className="text-xs text-zinc-500 mt-2">{t.max_players} joueurs • {t.entry_fee} FCFA</p>
                <Link href={`/tournaments/${t.id}`} className="mt-3 inline-block rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold">Voir</Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <h2 className="text-2xl font-black flex items-center gap-2"><Crown className="h-6 w-6 text-amber-400" /> Top joueurs (vrai data)</h2>
        {topPlayers.length===0 ? <p className="mt-4 text-zinc-500">Aucun joueur encore</p> : (
          <div className="mt-4 grid md:grid-cols-4 gap-4">
            {topPlayers.map(p=>(
              <div key={p.id} className="rounded-2xl border border-zinc-800 bg-[#101015] p-4 text-center">
                <div className="h-12 w-12 mx-auto rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center font-black">{(p.pseudo||p.username||"?")[0]}</div>
                <p className="mt-2 font-bold">{p.pseudo||p.username}</p>
                <p className="text-xs text-zinc-500">{p.wins||0} victoires</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
