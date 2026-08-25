"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Swords, Trophy, Crown, Gamepad2, Search } from "lucide-react";
import PlayerSearch from "@/components/1v1/PlayerSearch";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

type PlayerStats = {
  id: string;
  pseudo: string;
  username: string;
  avatar_url: string | null;
  matchs: number;
  victoires: number;
  defaites: number;
  taux_victoire: number;
  tournois_remportes: number;
  victoires_1v1: number;
  palmares: string[];
  ville?: string;
  bio?: string;
};

export default function OneVOnePage() {
  const supabase = createClient();
  const { user } = useAuth();
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [defyingId, setDefyingId] = useState<string | null>(null);

  const loadPlayers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, city, bio, matches_played, wins, losses, tournaments_won, wins_1v1")
      .neq("id", user?.id || "")
      .not("id", "ilike", "mock-%")
      .order("wins", { ascending: false })
      .limit(20);

    if (data) {
      const mapped: PlayerStats[] = data.map((row: any) => {
        const m = row.matches_played ?? 0;
        const w = row.wins ?? 0;
        const l = row.losses ?? Math.max(0, m - w);
        const taux = m ? Math.round((w / m) * 100) : 0;
        return {
          id: row.id,
          pseudo: row.username,
          username: row.username,
          avatar_url: row.avatar_url,
          matchs: m,
          victoires: w,
          defaites: l,
          taux_victoire: taux,
          tournois_remportes: row.tournaments_won ?? 0,
          victoires_1v1: row.wins_1v1 ?? 0,
          palmares: [],
          ville: row.city,
          bio: row.bio,
        };
      });
      setPlayers(mapped);
    }
    setLoading(false);
  }, [supabase, user?.id]);

  useEffect(() => { loadPlayers(); }, [loadPlayers]);

  const handleDefy = async (player: PlayerStats) => {
    if (!user) { toast.error("Connecte-toi"); return; }
    setDefyingId(player.id);
    try {
      const { error } = await supabase.from("challenges").insert({
        challenger_id: user.id,
        opponent_id: player.id,
        stake: 1000,
        status: "pending",
        game: "FIFA",
      });
      if (error) throw error;
      toast.success(`Défi envoyé à @${player.username} 🔥`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDefyingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-black flex items-center gap-3"><Swords className="h-8 w-8 text-[#7C3AED]" /> 1V1 - Défie un joueur</h1>
            <p className="text-[13px] text-zinc-400 mt-2">Vrais joueurs uniquement • Pas de faux profils</p>
          </div>
          <Link href="/1v1/challenges" className="rounded-full bg-white text-black px-5 py-2.5 text-[12px] font-bold">Mes défis →</Link>
        </div>

        <div className="mt-8">
          <PlayerSearch onSelect={handleDefy} excludeUserId={user?.id} />
        </div>

        <div className="mt-10">
          <h2 className="text-[14px] font-black uppercase tracking-widest text-zinc-500">Joueurs réels • Classement par victoires</h2>
          {loading ? <div className="mt-6 text-center text-zinc-500">Chargement...</div> : players.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-[#22222F] bg-[#101015] p-10 text-center">
              <p className="font-bold">Aucun joueur réel pour l'instant</p>
              <p className="text-xs text-zinc-500 mt-1">Invite tes amis à s'inscrire, ils apparaîtront ici.</p>
            </div>
          ) : (
            <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map(p => (
                <div key={p.id} className="rounded-[22px] border border-[#22222F] bg-[#15151E] p-5 hover:border-[#7C3AED]/40 transition">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#7C3AED]/40 to-[#06B6D4]/30 flex items-center justify-center font-black">{p.pseudo[0].toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate">{p.pseudo}</h3>
                      <p className="text-xs text-zinc-500">@{p.username}</p>
                      <div className="mt-2 flex gap-2">
                        <span className="text-[11px] bg-[#08080B] border border-[#22222F] px-2 py-0.5 rounded-full">{p.matchs} matchs</span>
                        <span className="text-[11px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">{p.victoires}V</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-[#08080B] border border-[#22222F] p-2 text-center"><p className="text-[10px] text-zinc-500">TAUX</p><p className="text-[13px] font-bold">{p.taux_victoire}%</p></div>
                    <div className="rounded-xl bg-[#08080B] border border-[#22222F] p-2 text-center"><p className="text-[10px] text-zinc-500">TITRES</p><p className="text-[13px] font-bold">{p.tournois_remportes}</p></div>
                    <div className="rounded-xl bg-[#08080B] border border-[#22222F] p-2 text-center"><p className="text-[10px] text-zinc-500">1V1</p><p className="text-[13px] font-bold">{p.victoires_1v1}</p></div>
                  </div>
                  <button onClick={() => handleDefy(p)} disabled={defyingId===p.id} className="mt-4 w-full h-11 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-[13px] font-bold disabled:opacity-50">
                    {defyingId===p.id ? "Envoi..." : `Défier @${p.username}`}
                  </button>
                  <Link href={`/profile/${p.username}`} className="mt-2 flex w-full h-9 items-center justify-center rounded-xl bg-[#101015] border border-[#22222F] text-[11px]">Voir profil</Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
