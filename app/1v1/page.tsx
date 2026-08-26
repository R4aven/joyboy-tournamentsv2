"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Swords, Users, Trophy, Flame, Search, Crown, Zap, Eye, Loader2, Gamepad2, Filter } from "lucide-react";
import PlayerSearch from "@/components/1v1/PlayerSearch";
import { createClient } from "@/lib/supabase/client";
import { createChallengeLogic, E-TOURNOIS CI_CONFIG } from "@/lib/1v1/challengeLogic";
import type { PlayerStats } from "@/lib/1v1/challengeLogic";
import { getPlayerPalmares } from "@/lib/1v1/challengeLogic";
import { toast } from "sonner";

type PlayerRow = {
  id: string;
  username: string;
  avatar_url: string | null;
  city?: string;
  bio?: string;
  matches_played?: number;
  wins?: number;
  losses?: number;
  tournaments_won?: number;
  wins_1v1?: number;
  palmares?: any;
};

function mapRow(row: PlayerRow): PlayerStats {
  const m = row.matches_played ?? 0;
  const w = row.wins ?? 0;
  const l = row.losses ?? Math.max(0, m - w);
  const taux = m ? Math.round((w / m) * 100) : 0;
  let palm: string[] = [];
  if (Array.isArray(row.palmares)) palm = row.palmares;
  else if (typeof row.palmares === "string" && row.palmares) {
    try { palm = JSON.parse(row.palmares); } catch { palm = [row.palmares]; }
  }
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
    palmares: palm,
    ville: row.city,
    bio: row.bio,
  };
}

const MOCK_JOUEURS: PlayerStats[] = [
  { id: "m1", pseudo: "ShanksCI", username: "shanksci", avatar_url: null, matchs: 42, victoires: 31, defaites: 11, taux_victoire: 74, tournois_remportes: 3, victoires_1v1: 18, palmares: ["Champion Abidjan #3", "Top 8 E-TOURNOIS CI Cup"], ville: "Abidjan" },
  { id: "m2", pseudo: "Nami225", username: "nami225", avatar_url: null, matchs: 28, victoires: 19, defaites: 9, taux_victoire: 68, tournois_remportes: 1, victoires_1v1: 12, palmares: ["Vainqueur Femmes Gaming 2025"], ville: "Yopougon" },
  { id: "m3", pseudo: "ZoroBabi", username: "zorobabi", avatar_url: null, matchs: 65, victoires: 45, defaites: 20, taux_victoire: 69, tournois_remportes: 5, victoires_1v1: 33, palmares: ["2x Champion E-TOURNOIS CI", "Roi du 1V1 d'Abidjan"], ville: "Cocody" },
  { id: "m4", pseudo: "LuffyD", username: "luffyd", avatar_url: null, matchs: 12, victoires: 7, defaites: 5, taux_victoire: 58, tournois_remportes: 0, victoires_1v1: 4, palmares: [], ville: "Marcory" },
  { id: "m5", pseudo: "SanjiCook", username: "sanjicook", avatar_url: null, matchs: 34, victoires: 22, defaites: 12, taux_victoire: 65, tournois_remportes: 2, victoires_1v1: 15, palmares: ["Finaliste E-TOURNOIS CI Winter"], ville: "Abidjan" },
  { id: "m6", pseudo: "RobinCI", username: "robinci", avatar_url: null, matchs: 51, victoires: 38, defaites: 13, taux_victoire: 75, tournois_remportes: 4, victoires_1v1: 26, palmares: ["Championne Côte d'Ivoire 2024"], ville: "Angré" },
];

function PlayerCard({ player, currentUserId, onDefy, defyingId }: { player: PlayerStats; currentUserId?: string; onDefy: (p: PlayerStats) => void; defyingId: string | null }) {
  const isMe = player.id === currentUserId;
  return (
    <div className="group relative rounded-[22px] border border-[#22222F] bg-[#15151E] p-[1px] hover:border-[#7C3AED]/40 transition-all duration-300">
      <div className="rounded-[21px] bg-gradient-to-b from-[#1C1C27] to-[#15151E] p-5 h-full flex flex-col">
        {/* Top */}
        <div className="flex items-start gap-4">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-[#2A2A38] bg-[#101015]">
            {player.avatar_url ? (
              <img src={player.avatar_url} alt={player.pseudo} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-[#7C3AED]/40 to-[#06B6D4]/30 flex items-center justify-center text-lg font-black text-white">
                {player.pseudo[0]?.toUpperCase()}
              </div>
            )}
            {player.tournois_remportes > 0 && (
              <div className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-yellow-400 border-2 border-[#15151E] flex items-center justify-center">
                <Crown className="h-3 w-3 text-black" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-bold text-white group-hover:text-[#A855F7] transition">{player.pseudo}</h3>
              {player.taux_victoire >= 70 && (
                <span className="shrink-0 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">HOT {player.taux_victoire}%</span>
              )}
            </div>
            <p className="text-xs text-zinc-500">@{player.username} • {player.ville || "Abidjan"}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full bg-[#08080B] border border-[#22222F] px-2.5 py-1 text-[11px] text-zinc-400 flex items-center gap-1">
                <Gamepad2 className="h-3 w-3" /> {player.matchs} matchs
              </span>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] text-emerald-300">{player.victoires}V</span>
              <span className="rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-1 text-[11px] text-red-300">{player.defaites}D</span>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-[#08080B] border border-[#22222F] p-2.5 text-center">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">Taux</div>
            <div className="text-sm font-bold text-white">{player.taux_victoire}%</div>
          </div>
          <div className="rounded-xl bg-[#08080B] border border-[#22222F] p-2.5 text-center">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">Tournois</div>
            <div className="text-sm font-bold text-[#A855F7] flex items-center justify-center gap-1">{player.tournois_remportes}<Trophy className="h-3 w-3" /></div>
          </div>
          <div className="rounded-xl bg-[#08080B] border border-[#22222F] p-2.5 text-center">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">Vic 1V1</div>
            <div className="text-sm font-bold text-[#06B6D4] flex items-center justify-center gap-1">{player.victoires_1v1}<Flame className="h-3 w-3" /></div>
          </div>
        </div>

        {/* Palmarès */}
        <div className="mt-3 min-h-[28px]">
          <p className="text-[11px] leading-relaxed text-zinc-400 line-clamp-2">
            {getPlayerPalmares(player) ? <><span className="text-zinc-600">Palmarès:</span> {getPlayerPalmares(player)}</> : <span className="text-zinc-600 italic">Nouveau sur la scène, prêt à tout casser</span>}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <Link
            href={`/profil/${player.username}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-[#22222F] bg-[#08080B] px-4 py-2.5 text-xs font-medium text-zinc-300 hover:border-zinc-600 hover:text-white transition"
          >
            <Eye className="h-3.5 w-3.5" /> Voir profil
          </Link>
          <button
            disabled={isMe || defyingId === player.id}
            onClick={() => onDefy(player)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-4 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(124,58,237,0.35)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {defyingId === player.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Swords className="h-3.5 w-3.5" />}
            {isMe ? "C'est toi" : defyingId === player.id ? "En cours..." : "Défier"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Page1v1() {
  const supabase = createClient();
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [defyingId, setDefyingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"tous" | "top" | "dispo">("tous");

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, city, bio, matches_played, wins, losses, tournaments_won, wins_1v1, palmares")
        .limit(24)
        .order("wins", { ascending: false });

      if (!error && data && data.length > 0) {
        setPlayers((data as PlayerRow[]).map(mapRow));
      } else {
        // mode démo
        setPlayers(MOCK_JOUEURS);
      }
    } catch {
      setPlayers(MOCK_JOUEURS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const handleSelectFromSearch = (player: PlayerStats) => {
    // Ajoute en tête si pas déjà là
    setPlayers((prev) => {
      if (prev.find((p) => p.id === player.id)) return prev;
      return [player, ...prev];
    });
    // Option: scroll vers sa card ou direct défi
    toast.success(`${player.pseudo} trouvé ! Tu peux le défier maintenant.`);
  };

  const handleDefy = async (player: PlayerStats) => {
    if (!currentUserId) {
      toast.error("Connecte-toi d'abord pour défier, champion.");
      return;
    }
    if (player.id === currentUserId) {
      toast.error("Tu peux pas te défier toi-même 😅");
      return;
    }
    setDefyingId(player.id);
    try {
      const challenge = await createChallengeLogic(supabase, {
        challengerId: currentUserId,
        challengedId: player.id,
      });
      toast.success(`Défi envoyé à ${player.pseudo} ! 🔥`);
      // Redirige vers liste défis
      window.location.href = `/1v1/challenges?new=${challenge.id}`;
    } catch (e: any) {
      // Mode démo sans table
      if (e.message?.includes("relation") || e.message?.includes("does not exist") || e.message?.includes("challenges_1v1")) {
        toast.success(`Défi envoyé à ${player.pseudo} ! (mode démo) 🎮
Passe en prod quand Supabase sera setup.`);
        setTimeout(() => {
          window.location.href = `/1v1/challenges`;
        }, 800);
      } else {
        toast.error(e.message || "Erreur envoi défi");
      }
    } finally {
      setDefyingId(null);
    }
  };

  const filtered = players.filter((p) => {
    if (filter === "top") return p.taux_victoire >= 65 || p.tournois_remportes > 0;
    if (filter === "dispo") return p.matchs < 40; // dispo fictif
    return true;
  });

  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-[#22222F] bg-[#08080B]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)]">
              <Swords className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">1V1 DIRECT</h1>
              <p className="text-[11px] text-zinc-500 -mt-1">Défie qui tu veux, 500 FCFA, on règle ça maintenant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/1v1/challenges" className="rounded-full border border-[#22222F] bg-[#15151E] px-4 py-2 text-xs font-medium hover:border-[#7C3AED]/30 transition flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-[#06B6D4]" />
              Mes défis
            </Link>
            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-[#101015] border border-[#22222F] px-3 py-1.5 text-[11px] text-zinc-400">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              {players.length} joueurs connectés
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Hero search */}
        <div className="rounded-[24px] border border-[#22222F] bg-gradient-to-b from-[#15151E] to-[#101015] p-6 lg:p-8 mb-8 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#7C3AED]/20 blur-[80px]" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#06B6D4]/10 blur-[80px]" />

          <div className="relative">
            <div className="max-w-3xl">
              <h2 className="text-2xl lg:text-3xl font-black tracking-tight">
                Qui tu veux affronter,{" "}
                <span className="bg-gradient-to-r from-[#A855F7] to-[#06B6D4] bg-clip-text text-transparent">patron ?</span>
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                Tape le pseudo de ton adversaire, on lui envoie le défi direct. 500 FCFA par joueur via Wave uniquement : <span className="text-white font-semibold">{E-TOURNOIS CI_CONFIG.wave}</span>. Pas de blabla, que du jeu 🇨🇮
              </p>
            </div>

            <div className="mt-6 max-w-2xl">
              <PlayerSearch onSelect={handleSelectFromSearch} excludeUserId={currentUserId} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
              <span className="text-zinc-600">Recherche rapide:</span>
              {["ShanksCI", "ZoroBabi", "Nami"].map((pseudo) => (
                <button
                  key={pseudo}
                  onClick={() => {
                    const p = MOCK_JOUEURS.find((x) => x.pseudo.toLowerCase().includes(pseudo.toLowerCase()));
                    if (p) handleSelectFromSearch(p);
                  }}
                  className="rounded-full border border-[#22222F] bg-[#08080B] px-3 py-1 text-zinc-400 hover:text-white hover:border-[#7C3AED]/30 transition"
                >
                  {pseudo}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filtres + liste */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-[#15151E] border border-[#22222F] flex items-center justify-center">
              <Users className="h-4 w-4 text-zinc-400" />
            </div>
            <h3 className="font-semibold">Joueurs disponibles</h3>
            <span className="rounded-full bg-[#22222F] px-2.5 py-0.5 text-xs text-zinc-400">{filtered.length}</span>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-[#101015] border border-[#22222F] p-1">
            {[
              { id: "tous", label: "Tous" },
              { id: "top", label: "Top joueurs" },
              { id: "dispo", label: "Dispo" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                  filter === f.id ? "bg-white text-black" : "text-zinc-400 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-[22px] border border-[#22222F] bg-[#15151E] p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-zinc-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-zinc-800 rounded" />
                    <div className="h-3 w-32 bg-zinc-800 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[22px] border border-[#22222F] bg-[#15151E] py-16 text-center">
            <Search className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400">Aucun joueur pour ce filtre. Essaye un autre.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {filtered.map((player) => (
              <PlayerCard key={player.id} player={player} currentUserId={currentUserId} onDefy={handleDefy} defyingId={defyingId} />
            ))}
          </div>
        )}

        {/* Footer info Wave */}
        <div className="mt-10 rounded-2xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="h-9 w-9 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/20 flex items-center justify-center">
              <Trophy className="h-4 w-4 text-[#A855F7]" />
            </div>
            <div>
              <div className="font-semibold text-white">Paiement Wave uniquement - 500 FCFA par joueur</div>
              <div className="text-xs text-zinc-400">Numéro E-TOURNOIS CI: {E-TOURNOIS CI_CONFIG.wave} • Preuve obligatoire • Support WhatsApp {E-TOURNOIS CI_CONFIG.whatsapp}</div>
            </div>
          </div>
          <a href={E-TOURNOIS CI_CONFIG.whatsappLink} target="_blank" className="rounded-full bg-white text-black px-4 py-2 text-xs font-bold hover:bg-zinc-100 transition">
            Besoin d'aide ? WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
