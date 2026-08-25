"use client";

import { useEffect, useState, useRef } from "react";
import { Search, Swords, Trophy, Flame, X, Loader2, User, Crown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import type { PlayerStats } from "@/lib/1v1/challengeLogic";
import { getPlayerPalmares } from "@/lib/1v1/challengeLogic";

type PlayerRow = {
  id: string;
  username: string;
  avatar_url: string | null;
  pseudo?: string;
  bio?: string;
  city?: string;
  // stats stockées en table profiles ou calculées
  matches_played?: number;
  wins?: number;
  losses?: number;
  tournaments_won?: number;
  wins_1v1?: number;
  palmares?: string[] | string;
};

function mapToPlayerStats(row: PlayerRow): PlayerStats {
  const matchs = row.matches_played ?? 0;
  const victoires = row.wins ?? 0;
  const defaites = row.losses ?? Math.max(0, matchs - victoires);
  const taux = matchs ? Math.round((victoires / matchs) * 100) : 0;
  let palmaresArr: string[] = [];
  if (Array.isArray(row.palmares)) palmaresArr = row.palmares;
  else if (typeof row.palmares === "string" && row.palmares) {
    try {
      palmaresArr = JSON.parse(row.palmares);
    } catch {
      palmaresArr = [row.palmares];
    }
  }
  return {
    id: row.id,
    pseudo: row.pseudo || row.username,
    username: row.username,
    avatar_url: row.avatar_url,
    matchs,
    victoires,
    defaites,
    taux_victoire: taux,
    tournois_remportes: row.tournaments_won ?? 0,
    victoires_1v1: row.wins_1v1 ?? 0,
    palmares: palmaresArr,
    ville: row.city,
    bio: row.bio,
  };
}

const MOCK_JOUEURS: PlayerStats[] = [
  {
    id: "mock-1",
    pseudo: "ShanksCI",
    username: "shanksci",
    avatar_url: null,
    matchs: 42,
    victoires: 31,
    defaites: 11,
    taux_victoire: 74,
    tournois_remportes: 3,
    victoires_1v1: 18,
    palmares: ["Champion Abidjan #3", "Top 8 JOYBOY Cup"],
    ville: "Abidjan",
  },
  {
    id: "mock-2",
    pseudo: "Nami225",
    username: "nami225",
    avatar_url: null,
    matchs: 28,
    victoires: 19,
    defaites: 9,
    taux_victoire: 68,
    tournois_remportes: 1,
    victoires_1v1: 12,
    palmares: ["Vainqueur Femmes Gaming 2025"],
    ville: "Yopougon",
  },
  {
    id: "mock-3",
    pseudo: "ZoroBabi",
    username: "zorobabi",
    avatar_url: null,
    matchs: 65,
    victoires: 45,
    defaites: 20,
    taux_victoire: 69,
    tournois_remportes: 5,
    victoires_1v1: 33,
    palmares: ["2x Champion JOYBOY", "Roi du 1V1 d'Abidjan"],
    ville: "Cocody",
  },
  {
    id: "mock-4",
    pseudo: "LuffyD",
    username: "luffyd",
    avatar_url: null,
    matchs: 12,
    victoires: 7,
    defaites: 5,
    taux_victoire: 58,
    tournois_remportes: 0,
    victoires_1v1: 4,
    palmares: [],
    ville: "Marcory",
  },
];

export default function PlayerSearch({
  onSelect,
  excludeUserId,
  autoFocus = true,
}: {
  onSelect: (player: PlayerStats) => void;
  excludeUserId?: string;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Debounce recherche
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    if (query.trim().length < 2) return;

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      setHasSearched(true);
      try {
        // Essaie Supabase
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, bio, city, matches_played, wins, losses, tournaments_won, wins_1v1, palmares")
          .ilike("username", `%${query.trim()}%`)
          .neq("id", excludeUserId || "")
          .limit(8);

        if (!error && data && data.length > 0) {
          const mapped = (data as PlayerRow[]).map(mapToPlayerStats);
          // On filtre les mocks si jamais
          const realOnly = mapped.filter(p => !p.id.startsWith("mock-") && !p.id.startsWith("m"));
          setResults(realOnly);
        } else {
          setResults([]);
        }
      } catch (e) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div className="w-full relative">
      {/* Input premium */}
      <div
        className={cn(
          "group relative flex items-center gap-3 rounded-2xl border bg-[#101015] px-4 py-3.5 transition-all",
          focused
            ? "border-[#7C3AED]/60 shadow-[0_0_25px_rgba(124,58,237,0.25)]"
            : "border-[#22222F] hover:border-[#2E2E3F]"
        )}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED]/20 to-[#06B6D4]/20 border border-[#7C3AED]/20">
          <Search className="h-4 w-4 text-[#A855F7]" />
        </div>
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Tape le pseudo de ton adversaire... ex: ShanksCI"
          className="flex-1 bg-transparent text-[15px] text-white placeholder:text-zinc-500 outline-none"
        />
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
        ) : query ? (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setHasSearched(false);
              inputRef.current?.focus();
            }}
            className="rounded-full bg-zinc-800 p-1 hover:bg-zinc-700 transition"
          >
            <X className="h-3.5 w-3.5 text-zinc-400" />
          </button>
        ) : null}
      </div>

      {/* Résultats dropdown premium */}
      {(results.length > 0 || (hasSearched && !loading)) && (
        <div className="absolute left-0 right-0 top-[calc(100%+12px)] z-20 rounded-2xl border border-[#22222F] bg-[#101015]/95 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="h-12 w-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
                  <User className="h-5 w-5 text-zinc-600" />
                </div>
                <p className="text-zinc-400 text-sm">Aucun joueur trouvé pour <span className="text-white font-medium">"{query}"</span></p>
                <p className="text-zinc-600 text-xs mt-1">Vérifie l'orthographe du pseudo</p>
              </div>
            ) : (
              results.map((player) => (
                <button
                  key={player.id}
                  onClick={() => onSelect(player)}
                  className="group w-full flex items-center gap-3 rounded-xl p-3 text-left hover:bg-[#15151E] border border-transparent hover:border-[#7C3AED]/20 transition-all"
                >
                  {/* Avatar */}
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#15151E] border border-[#22222F] group-hover:border-[#7C3AED]/30">
                    {player.avatar_url ? (
                      <img src={player.avatar_url} alt={player.pseudo} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-[#7C3AED]/30 to-[#06B6D4]/20 flex items-center justify-center text-white font-bold">
                        {player.pseudo[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-[#08080B] border border-[#22222F] flex items-center justify-center">
                      <Swords className="h-3 w-3 text-[#06B6D4]" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white truncate group-hover:text-[#A855F7] transition">
                        {player.pseudo}
                      </span>
                      {player.tournois_remportes > 0 && (
                        <Crown className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
                      )}
                      {player.taux_victoire >= 70 && (
                        <span className="shrink-0 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                          {player.taux_victoire}%
                        </span>
                      )}
                    </div>

                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Flame className="h-3 w-3" /> {player.matchs} matchs
                      </span>
                      <span className="h-1 w-1 rounded-full bg-zinc-700" />
                      <span>{player.victoires}V - {player.defaites}D</span>
                      {player.ville && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-zinc-700" />
                          <span>{player.ville}</span>
                        </>
                      )}
                    </div>

                    <div className="mt-1 line-clamp-1 text-[11px] text-zinc-400">
                      {getPlayerPalmares(player)}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <div className="h-8 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-3.5 py-1.5 text-xs font-semibold text-white opacity-90 group-hover:opacity-100 group-hover:shadow-[0_0_12px_rgba(124,58,237,0.4)] transition">
                      Défier
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {results.length > 0 && (
            <div className="border-t border-[#22222F] bg-[#08080B]/50 px-3 py-2 text-[11px] text-zinc-500 flex items-center gap-1.5">
              <Trophy className="h-3 w-3 text-[#7C3AED]" />
              Clique sur un joueur pour lui envoyer un défi 1V1 - 500 FCFA le match
            </div>
          )}
        </div>
      )}
    </div>
  );
}
