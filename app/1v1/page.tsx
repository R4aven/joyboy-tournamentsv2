"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Swords, Users, Trophy, Flame, Search, Crown, Zap, Eye, Loader2, Gamepad2, Sparkles, TrendingDown } from "lucide-react";
import PlayerSearch from "@/components/1v1/PlayerSearch";
import { createClient } from "@/lib/supabase/client";
import { createChallengeLogic, JOYBOY_CONFIG } from "@/lib/1v1/challengeLogic";
import type { PlayerStats } from "@/lib/1v1/challengeLogic";
import { getPlayerPalmares } from "@/lib/1v1/challengeLogic";
import { toast } from "sonner";

type ProfilePublic = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  wins: number;
  losses: number;
  tournaments_played: number;
  tournaments_won: number;
  challenges_played: number;
  challenges_won: number;
  level: number;
  current_streak: number;
  best_streak: number;
  created_at: string;
  is_banned: boolean;
};

function mapToStats(row: ProfilePublic): PlayerStats {
  const w = row.wins ?? 0;
  const l = row.losses ?? 0;
  const total = w + l;
  const taux = total ? Math.round((w / total) * 100) : 0;
  return {
    id: row.id,
    pseudo: row.display_name || row.username,
    username: row.username,
    avatar_url: row.avatar_url,
    matchs: total,
    victoires: w,
    defaites: l,
    taux_victoire: taux,
    tournois_remportes: row.tournaments_won ?? 0,
    victoires_1v1: row.challenges_won ?? 0,
    palmares: [],
    ville: undefined,
    bio: row.bio || undefined,
    display_name: row.display_name,
    created_at: row.created_at,
    level: row.level,
    tournaments_played: row.tournaments_played,
    challenges_played: row.challenges_played,
    best_streak: row.best_streak,
  } as any;
}

function PlayerCard({ player, currentUserId, onDefy, defyingId }: { player: PlayerStats; currentUserId?: string; onDefy: (p: PlayerStats) => void; defyingId: string | null }) {
  const isMe = player.id === currentUserId;
  return (
    <div className="group relative rounded-[22px] border border-[#22222F] bg-[#15151E] p-[1px] hover:border-[#7C3AED]/40 transition-all duration-300">
      <div className="rounded-[21px] bg-gradient-to-b from-[#1C1C27] to-[#15151E] p-5 h-full flex flex-col">
        <div className="flex items-start gap-4">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-[#2A2A38] bg-[#101015]">
            {player.avatar_url ? <img src={player.avatar_url} alt={player.pseudo} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gradient-to-br from-[#7C3AED]/40 to-[#06B6D4]/30 flex items-center justify-center text-lg font-black text-white">{player.pseudo[0]?.toUpperCase()}</div>}
            {player.tournois_remportes > 0 && <div className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-yellow-400 border-2 border-[#15151E] flex items-center justify-center"><Crown className="h-3 w-3 text-black" /></div>}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2"><h3 className="truncate font-bold text-white group-hover:text-[#A855F7] transition">{player.pseudo}</h3>{player.taux_victoire >= 70 && <span className="shrink-0 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">HOT {player.taux_victoire}%</span>}</div>
            <p className="text-xs text-zinc-500 truncate">@{player.username}</p>
            <div className="mt-2 flex items-center gap-2 flex-wrap"><span className="rounded-full bg-[#08080B] border border-[#22222F] px-2.5 py-1 text-[11px] text-zinc-400 flex items-center gap-1"><Gamepad2 className="h-3 w-3" /> {player.matchs} matchs</span><span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] text-emerald-300">{player.victoires}V</span><span className="rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-1 text-[11px] text-red-300">{player.defaites}D</span></div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-xl bg-[#08080B] border border-[#22222F] p-2.5 text-center"><div className="text-[10px] uppercase tracking-wider text-zinc-500">Taux</div><div className="text-sm font-bold text-white">{player.taux_victoire}%</div></div><div className="rounded-xl bg-[#08080B] border border-[#22222F] p-2.5 text-center"><div className="text-[10px] uppercase tracking-wider text-zinc-500">Tournois</div><div className="text-sm font-bold text-[#A855F7] flex items-center justify-center gap-1">{player.tournois_remportes}<Trophy className="h-3 w-3" /></div></div><div className="rounded-xl bg-[#08080B] border border-[#22222F] p-2.5 text-center"><div className="text-[10px] uppercase tracking-wider text-zinc-500">Vic 1V1</div><div className="text-sm font-bold text-[#06B6D4] flex items-center justify-center gap-1">{player.victoires_1v1}<Flame className="h-3 w-3" /></div></div></div>
        <div className="mt-3 min-h-[28px]"><p className="text-[11px] leading-relaxed text-zinc-400 line-clamp-2">{getPlayerPalmares(player) ? <><span className="text-zinc-600">Palmarès:</span> {getPlayerPalmares(player)}</> : <span className="text-zinc-600 italic">Nouveau sur la scène, prêt à tout casser</span>}</p></div>
        <div className="mt-4 flex gap-2"><Link href={`/profile/${player.username}`} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-[#22222F] bg-[#08080B] px-4 py-2.5 text-xs font-medium text-zinc-300 hover:border-zinc-600 hover:text-white transition"><Eye className="h-3.5 w-3.5" /> Voir profil</Link><button disabled={isMe || defyingId === player.id} onClick={() => onDefy(player)} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-4 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(124,58,237,0.35)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition">{defyingId === player.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Swords className="h-3.5 w-3.5" />}{isMe ? "C'est toi" : defyingId === player.id ? "En cours..." : "Défier"}</button></div>
      </div>
    </div>
  );
}

export default function Page1v1() {
  const supabase = createClient();
  const [allPlayers, setAllPlayers] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [defyingId, setDefyingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
      const { data, error } = await supabase.from("profiles").select("id, username, display_name, avatar_url, bio, wins, losses, tournaments_played, tournaments_won, challenges_played, challenges_won, level, current_streak, best_streak, created_at, is_banned").eq("is_banned", false).order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      if (data) setAllPlayers((data as ProfilePublic[]).map(mapToStats));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchPlayers();
    const channel = supabase.channel("profiles-1v1-realtime").on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, (payload: any) => {
      const row = payload.new as ProfilePublic;
      if (row.is_banned) return;
      const mapped = mapToStats(row);
      setAllPlayers((prev) => (prev.find((p) => p.id === mapped.id) ? prev : [mapped, ...prev]));
    }).on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, (payload: any) => {
      const row = payload.new as ProfilePublic;
      const mapped = mapToStats(row);
      setAllPlayers((prev) => prev.map((p) => (p.id === mapped.id ? { ...p, ...mapped } : p)));
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPlayers]);

  const filteredBySearch = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return allPlayers;
    return allPlayers.filter((p) => p.pseudo.toLowerCase().includes(q) || p.username.toLowerCase().includes(q) || (p as any).display_name?.toLowerCase().includes(q));
  }, [query, allPlayers]);

  const grouped = useMemo(() => {
    const list = filteredBySearch;
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const nouveaux = list.filter((p) => {
      const isZero = p.matchs === 0 && p.tournois_remportes === 0 && p.victoires_1v1 === 0;
      const createdAt = (p as any).created_at ? new Date((p as any).created_at).getTime() : 0;
      const isRecent = createdAt && now - createdAt < sevenDays;
      return isZero || isRecent;
    });
    const top = [...list].filter((p) => p.tournois_remportes > 0 || p.victoires > 0 || (p as any).level > 1).sort((a, b) => {
      if (b.tournois_remportes !== a.tournois_remportes) return b.tournois_remportes - a.tournois_remportes;
      if (b.victoires !== a.victoires) return b.victoires - a.victoires;
      if ((b as any).best_streak !== (a as any).best_streak) return (b as any).best_streak - (a as any).best_streak;
      if (b.victoires_1v1 !== a.victoires_1v1) return b.victoires_1v1 - a.victoires_1v1;
      return (b as any).level - (a as any).level;
    }).slice(0, 12);
    const perdants = [...list].filter((p) => p.defaites > 0).sort((a, b) => b.defaites - a.defaites || a.victoires - b.victoires).slice(0, 12);
    return { nouveaux, top, perdants };
  }, [filteredBySearch]);

  const handleSelectFromSearch = (player: PlayerStats) => {
    setQuery(player.pseudo);
    const el = document.getElementById(`player-${player.id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // FIX: envoie REEL, plus de mode démo
  const handleDefy = async (player: PlayerStats) => {
    if (!currentUserId) { toast.error("Connecte-toi d'abord pour défier, champion."); return; }
    if (player.id === currentUserId) { toast.error("Tu peux pas te défier toi-même 😅"); return; }
    setDefyingId(player.id);
    try {
      const challenge = await createChallengeLogic(supabase, { challengerId: currentUserId, challengedId: player.id });
      toast.success(`Défi envoyé à ${player.pseudo} ! 🔥`);
      window.location.href = `/1v1/challenges?new=${challenge.id}`;
    } catch (e: any) {
      toast.error(e.message || "Erreur envoi défi");
    } finally { setDefyingId(null); }
  };

  const isSearching = query.trim().length >= 1;

  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      <div className="sticky top-0 z-30 border-b border-[#22222F] bg-[#08080B]/80 backdrop-blur-xl"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)]"><Swords className="h-5 w-5 text-white" /></div><div><h1 className="text-lg font-black tracking-tight">1V1 DIRECT</h1><p className="text-[11px] text-zinc-500 -mt-1">Défie qui tu veux, 500 FCFA, on règle ça maintenant</p></div></div><div className="flex items-center gap-2"><Link href="/1v1/challenges" className="rounded-full border border-[#22222F] bg-[#15151E] px-4 py-2 text-xs font-medium hover:border-[#7C3AED]/30 transition flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-[#06B6D4]" />Mes défis</Link><div className="hidden sm:flex items-center gap-1.5 rounded-full bg-[#101015] border border-[#22222F] px-3 py-1.5 text-[11px] text-zinc-400"><div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />{allPlayers.length} joueurs</div></div></div></div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="rounded-[24px] border border-[#22222F] bg-gradient-to-b from-[#15151E] to-[#101015] p-6 lg:p-8 mb-8 relative overflow-hidden"><div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#7C3AED]/20 blur-[80px]" /><div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#06B6D4]/10 blur-[80px]" /><div className="relative"><div className="max-w-3xl"><h2 className="text-2xl lg:text-3xl font-black tracking-tight">Qui tu veux affronter, <span className="bg-gradient-to-r from-[#A855F7] to-[#06B6D4] bg-clip-text text-transparent">patron ?</span></h2><p className="mt-2 text-sm text-zinc-400">Tape le pseudo, V → Venus, tous trouvés. 500 FCFA par joueur via Wave : <span className="text-white font-semibold">{JOYBOY_CONFIG.wave}</span>.</p></div><div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl"><div className="relative"><div className="flex items-center gap-2 rounded-2xl border border-[#22222F] bg-[#08080B] px-4 py-3.5"><Search className="h-4 w-4 text-zinc-500" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Recherche instantanée: V, Ve, Ven, Venus..." className="flex-1 bg-transparent text-[15px] text-white placeholder:text-zinc-600 outline-none" />{query && <button onClick={() => setQuery("")} className="text-xs text-zinc-500 hover:text-white">Effacer</button>}</div></div><PlayerSearch players={allPlayers} onSelect={handleSelectFromSearch} excludeUserId={currentUserId} autoFocus={false} /></div><div className="mt-3 text-[11px] text-zinc-600">{isSearching ? `${filteredBySearch.length} résultat(s) pour "${query}"` : `${allPlayers.length} joueurs inscrits visibles, même 0 match`}</div></div></div>
        {loading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3,4,5,6].map((i)=><div key={i} className="rounded-[22px] border border-[#22222F] bg-[#15151E] p-5 animate-pulse"><div className="flex gap-4"><div className="h-14 w-14 rounded-2xl bg-zinc-800" /><div className="flex-1 space-y-2"><div className="h-4 w-24 bg-zinc-800 rounded" /><div className="h-3 w-32 bg-zinc-800 rounded" /></div></div></div>)}</div> : isSearching ? <div><div className="flex items-center gap-2 mb-4"><Search className="h-5 w-5 text-[#7C3AED]" /><h3 className="font-bold">Résultats pour "{query}" ({filteredBySearch.length})</h3></div>{filteredBySearch.length===0 ? <div className="rounded-[22px] border border-[#22222F] bg-[#15151E] py-16 text-center text-zinc-500">Aucun joueur pour "{query}".</div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{filteredBySearch.map((p)=><div id={`player-${p.id}`} key={p.id}><PlayerCard player={p} currentUserId={currentUserId} onDefy={handleDefy} defyingId={defyingId} /></div>)}</div>}</div> : <div className="space-y-10"><div><div className="flex items-center gap-2 mb-4"><Sparkles className="h-5 w-5 text-emerald-400" /><h3 className="font-black text-lg">🆕 NOUVEAUX JOUEURS</h3><span className="rounded-full bg-[#22222F] px-2.5 py-0.5 text-xs text-zinc-400">{grouped.nouveaux.length}</span></div>{grouped.nouveaux.length===0 ? <div className="rounded-2xl border border-[#22222F] bg-[#101015] p-6 text-center text-sm text-zinc-500">Pas de nouveaux</div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{grouped.nouveaux.map((p)=><div id={`player-${p.id}`} key={p.id}><PlayerCard player={p} currentUserId={currentUserId} onDefy={handleDefy} defyingId={defyingId} /></div>)}</div>}</div><div><div className="flex items-center gap-2 mb-4"><Trophy className="h-5 w-5 text-yellow-400" /><h3 className="font-black text-lg">🔥 TOP DU MOMENT</h3><span className="rounded-full bg-[#22222F] px-2.5 py-0.5 text-xs text-zinc-400">{grouped.top.length}</span></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{grouped.top.map((p)=><div id={`player-${p.id}`} key={p.id}><PlayerCard player={p} currentUserId={currentUserId} onDefy={handleDefy} defyingId={defyingId} /></div>)}</div></div><div><div className="flex items-center gap-2 mb-4"><TrendingDown className="h-5 w-5 text-red-400" /><h3 className="font-black text-lg">📉 PERDANTS DU MOMENT</h3><span className="rounded-full bg-[#22222F] px-2.5 py-0.5 text-xs text-zinc-400">{grouped.perdants.length}</span></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{grouped.perdants.map((p)=><div id={`player-${p.id}`} key={p.id}><PlayerCard player={p} currentUserId={currentUserId} onDefy={handleDefy} defyingId={defyingId} /></div>)}</div></div>{allPlayers.length>0 && <div><div className="flex items-center gap-2 mb-4"><Users className="h-5 w-5 text-[#7C3AED]" /><h3 className="font-black text-lg">TOUS LES JOUEURS ({allPlayers.length})</h3></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{allPlayers.map((p)=><div id={`player-${p.id}`} key={p.id}><PlayerCard player={p} currentUserId={currentUserId} onDefy={handleDefy} defyingId={defyingId} /></div>)}</div></div>}</div>}
      </div>
    </div>
  );
}
