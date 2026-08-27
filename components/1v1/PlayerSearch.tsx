"use client";
import { useState, useMemo, useRef } from "react";
import { Search, Swords, Trophy, X, Loader2, Crown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { PlayerStats } from "@/lib/1v1/challengeLogic";

export default function PlayerSearch({
  players,
  onSelect,
  excludeUserId,
  autoFocus = true,
}: {
  players: PlayerStats[];
  onSelect: (player: PlayerStats) => void;
  excludeUserId?: string;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Recherche instantanée dès 1 caractère, insensible à la casse, public only
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];
    return players
      .filter((p) => p.id !== excludeUserId)
      .filter((p) => {
        return (
          p.pseudo.toLowerCase().includes(q) ||
          p.username.toLowerCase().includes(q) ||
          (p as any).display_name?.toLowerCase().includes(q)
        );
      })
      .slice(0, 8);
  }, [query, players, excludeUserId]);

  return (
    <div className="w-full relative">
      <div
        className={cn(
          "group relative flex items-center gap-3 rounded-2xl border bg-[#101015] px-4 py-3.5 transition-all",
          "border-[#22222F] hover:border-[#2E2E3F] focus-within:border-[#7C3AED]/60 focus-within:shadow-[0_0_25px_rgba(124,58,237,0.25)]"
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
          placeholder="Tape le pseudo... V, Ve, Ven, Venus"
          className="flex-1 bg-transparent text-[15px] text-white placeholder:text-zinc-500 outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="rounded-full bg-zinc-800 p-1 hover:bg-zinc-700 transition"
          >
            <X className="h-3.5 w-3.5 text-zinc-400" />
          </button>
        )}
      </div>

      {query.length >= 1 && (
        <div className="absolute left-0 right-0 top-[calc(100%+12px)] z-20 rounded-2xl border border-[#22222F] bg-[#101015]/95 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
            {results.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-500">
                Aucun joueur pour <span className="text-white">"{query}"</span> - essaie V, Ve, VENUS...
              </div>
            ) : (
              results.map((player) => (
                <button
                  key={player.id}
                  onClick={() => {
                    onSelect(player);
                    setQuery("");
                  }}
                  className="group w-full flex items-center gap-3 rounded-xl p-3 text-left hover:bg-[#15151E] border border-transparent hover:border-[#7C3AED]/20 transition-all"
                >
                  <div className="h-11 w-11 rounded-xl bg-[#15151E] border border-[#22222F] flex items-center justify-center overflow-hidden">
                    {player.avatar_url ? (
                      <img src={player.avatar_url} alt={player.pseudo} className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-bold text-white">{player.pseudo[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white truncate group-hover:text-[#A855F7]">{player.pseudo}</span>
                      {player.tournois_remportes > 0 && <Crown className="h-3.5 w-3.5 text-yellow-400" />}
                      {player.taux_victoire >= 70 && (
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300">{player.taux_victoire}%</span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-500">@{player.username} • {player.victoires}V/{player.defaites}D • {player.tournois_remportes}🏆</div>
                  </div>
                  <Swords className="h-4 w-4 text-zinc-600 group-hover:text-[#06B6D4]" />
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
