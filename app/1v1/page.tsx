
"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Swords, Trophy, Flame, Crown, Eye, Loader2, Gamepad2 } from "lucide-react";
import PlayerSearch from "@/components/1v1/PlayerSearch";
import { createClient } from "@/lib/supabase/client";
import type { PlayerStats } from "@/lib/1v1/challengeLogic";
import { toast } from "sonner";

type Row = { id: string; username: string; display_name?: string; avatar_url: string | null; city?: string; bio?: string; wins?: number; losses?: number; tournaments_won?: number; wins_1v1?: number; created_at?: string; };

function mapRow(row: Row): PlayerStats {
  const w = row.wins||0; const l = row.losses||0;
  return { id: row.id, pseudo: row.display_name || row.username, username: row.username, avatar_url: row.avatar_url, matchs: w+l, victoires: w, defaites: l, taux_victoire: w+l>0 ? Math.round((w/(w+l))*100) : 0, tournois_remportes: row.tournaments_won||0, victoires_1v1: row.wins_1v1||0, palmares: [], ville: row.city, bio: row.bio, created_at: row.created_at } as any;
}

function PlayerCard({ player, currentUserId, onDefy, defyingId }: { player: PlayerStats; currentUserId?: string; onDefy: (p: PlayerStats)=>void; defyingId: string|null }) {
  const isMe = player.id===currentUserId;
  return (
    <div className="rounded-[22px] border border-[#22222F] bg-[#15151E] p-[1px]">
      <div className="rounded-[21px] bg-gradient-to-b from-[#1C1C27] to-[#15151E] p-5">
        <div className="flex gap-4">
          <div className="h-14 w-14 rounded-2xl overflow-hidden bg-[#101015] border border-zinc-800 flex items-center justify-center">{player.avatar_url ? <img src={player.avatar_url} className="h-full w-full object-cover" /> : <span className="font-black">{player.pseudo[0]}</span>}</div>
          <div className="flex-1"><h3 className="font-bold">{player.pseudo}</h3><p className="text-xs text-zinc-500">@{player.username} • {player.bio?.slice(0,40)||"Joueur JOYBOY"}</p><div className="mt-2 flex gap-2"><span className="rounded-full bg-[#08080B] border border-zinc-800 px-2 py-1 text-[11px]">{player.matchs} matchs</span><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-300">{player.victoires}V</span></div></div>
        </div>
        <div className="mt-4 flex gap-2"><Link href={`/profile/${player.username}`} className="flex-1 rounded-full border border-zinc-800 bg-[#08080B] py-2.5 text-xs text-center"><Eye className="inline h-3 w-3 mr-1" /> Profil</Link><button disabled={isMe || defyingId===player.id} onClick={()=>onDefy(player)} className="flex-1 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 py-2.5 text-xs font-bold text-white disabled:opacity-50">{isMe ? "Toi" : "Défier"}</button></div>
      </div>
    </div>
  );
}

export default function Page1v1() {
  const supabase = createClient();
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string|undefined>();
  const [defyingId, setDefyingId] = useState<string|null>(null);
  const [q, setQ] = useState("");

  const fetchPlayers = useCallback(async (search?: string) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
    let query = supabase.from("profiles").select("id, username, display_name, avatar_url, city, bio, wins, losses, tournaments_won, wins_1v1, created_at").order("created_at",{ascending:false}).limit(50);
    if (search && search.length>=1) query = supabase.from("profiles").select("id, username, display_name, avatar_url, city, bio, wins, losses, tournaments_won, wins_1v1, created_at").or(`username.ilike.%${search}%,display_name.ilike.%${search}%`).order("created_at",{ascending:false}).limit(30);
    const { data } = await query;
    if (data) setPlayers((data as Row[]).map(mapRow));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPlayers();
    const ch = supabase.channel("profiles-1v1").on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, (payload) => {
      const row = payload.new as Row;
      setPlayers(prev => prev.find(p=>p.id===row.id) ? prev : [mapRow(row), ...prev]);
      toast.success(`Nouveau joueur @${row.username} visible direct en 1V1`);
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchPlayers]);

  const handleDefy = async (player: PlayerStats) => {
    if (!currentUserId) { toast.error("Connecte-toi"); return; }
    setDefyingId(player.id);
    try {
      await supabase.from("challenges").insert({ challenger_id: currentUserId, opponent_id: player.id, stake: 500, status: "pending", game: "eFootball" });
      await supabase.from("notifications").insert({ user_id: player.id, type: "1V1", title: "Défi 1V1", message: "On t'a défié", link: "/1v1/challenges" });
      toast.success("Défi envoyé");
    } catch (e:any) { toast.error(e.message); }
    finally { setDefyingId(null); }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      <h1 className="text-3xl font-black flex items-center gap-2"><Swords className="h-7 w-7 text-violet-500" /> 1V1 - Joueurs inscrits visibles direct</h1>
      <PlayerSearch onSelect={p=>setPlayers(prev=> prev.find(x=>x.id===p.id) ? prev : [p, ...prev])} />
      <div className="flex gap-2"><input value={q} onChange={e=>{ setQ(e.target.value); fetchPlayers(e.target.value); }} placeholder="Recherche live des 1 lettre - ex: a, b, r..." className="flex-1 rounded-xl bg-[#101015] border border-zinc-800 px-4 py-2.5 text-sm" /><button onClick={()=>fetchPlayers()} className="rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2.5 text-sm">Refresh</button></div>
      {loading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div> : <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{players.map(p=><PlayerCard key={p.id} player={p} currentUserId={currentUserId} onDefy={handleDefy} defyingId={defyingId} />)}</div>}
    </div>
  );
}
