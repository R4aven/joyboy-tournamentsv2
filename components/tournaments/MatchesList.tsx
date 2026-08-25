"use client"
import { BracketMatch } from "@/lib/tournaments/types"
import { cn } from "@/lib/utils"
import { Trophy, Clock, Play, CheckCircle2 } from "lucide-react"

interface Props {
  matches: BracketMatch[]
  onAdvance?: (matchId: string, winnerId: string) => void
  isAdmin?: boolean
}

const roundLabels: Record<string, string> = {
  PRELIMINAIRE: "Phase Préliminaire",
  QUART: "Quarts de finale",
  DEMI: "Demi-finales",
  FINALE: "Finale"
}

const roundOrder = ["PRELIMINAIRE", "QUART", "DEMI", "FINALE"]

export function MatchesList({ matches, onAdvance, isAdmin }: Props) {
  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
        <Trophy className="mx-auto h-10 w-10 text-zinc-600 mb-3" />
        <p className="text-zinc-400">Le bracket sera généré automatiquement quand 10 joueurs auront rejoint.</p>
        <p className="text-xs text-zinc-600 mt-1">Patience, ça chauffe déjà 🔥</p>
      </div>
    )
  }

  const grouped = roundOrder.map(r => ({
    round: r,
    label: roundLabels[r],
    matches: matches.filter(m => m.round === r).sort((a,b) => a.position - b.position)
  })).filter(g => g.matches.length > 0)

  return (
    <div className="space-y-8">
      {grouped.map(group => (
        <div key={group.round} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <h3 className="font-black tracking-wider text-sm text-zinc-300 uppercase">{group.label}</h3>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {group.matches.map(match => {
              const hasWinner = !!match.vainqueur_id
              const isWaitingPlayers = !match.joueur1_id || !match.joueur2_id
              
              return (
                <div key={match.id} className={cn(
                  "relative overflow-hidden rounded-xl border p-4 transition-all",
                  hasWinner ? "border-emerald-500/20 bg-emerald-500/[0.05]" :
                  isWaitingPlayers ? "border-white/5 bg-white/[0.02]" :
                  "border-violet-500/20 bg-violet-500/[0.05] shadow-[0_0_20px_rgba(124,58,237,0.08)]"
                )}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold tracking-wider text-zinc-500">MATCH #{match.position + 1} • {match.round}</span>
                    <span className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold",
                      match.statut === "TERMINE" ? "bg-emerald-500/15 text-emerald-400" :
                      match.statut === "EN_COURS" ? "bg-violet-500/15 text-violet-300" :
                      match.statut === "FORFAIT" ? "bg-red-500/15 text-red-300" :
                      "bg-zinc-700/50 text-zinc-400"
                    )}>
                      {match.statut === "TERMINE" && <CheckCircle2 className="h-3 w-3" />}
                      {match.statut === "EN_COURS" && <Play className="h-3 w-3" />}
                      {match.statut === "A_VENIR" && <Clock className="h-3 w-3" />}
                      {match.statut}
                    </span>
                  </div>

                  <div className={cn("flex items-center justify-between rounded-lg p-2.5 mb-2",
                    match.vainqueur_id === match.joueur1_id ? "bg-emerald-500/20 border border-emerald-500/30" : "bg-white/[0.03] border border-white/[0.05]")}>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-xs font-black text-white">
                        {match.joueur1_pseudo ? match.joueur1_pseudo[0].toUpperCase() : "?"}
                      </div>
                      <span className={cn("text-sm font-semibold", match.joueur1_id ? "text-white" : "text-zinc-600 italic")}>
                        {match.joueur1_pseudo || "En attente..."}
                      </span>
                    </div>
                    {match.score_j1 !== undefined && (
                      <span className="font-black text-white">{match.score_j1}</span>
                    )}
                    {match.vainqueur_id === match.joueur1_id && <Trophy className="h-4 w-4 text-amber-400" />}
                  </div>

                  <div className="flex justify-center -my-1">
                    <span className="text-[10px] font-bold text-zinc-600 bg-[#15151E] px-2 rounded-full border border-white/5">VS</span>
                  </div>

                  <div className={cn("flex items-center justify-between rounded-lg p-2.5 mt-2",
                    match.vainqueur_id === match.joueur2_id ? "bg-emerald-500/20 border border-emerald-500/30" : "bg-white/[0.03] border border-white/[0.05]")}>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-xs font-black text-white">
                        {match.joueur2_pseudo ? match.joueur2_pseudo[0].toUpperCase() : "?"}
                      </div>
                      <span className={cn("text-sm font-semibold", match.joueur2_id ? "text-white" : "text-zinc-600 italic")}>
                        {match.joueur2_pseudo || "En attente..."}
                      </span>
                    </div>
                    {match.score_j2 !== undefined && (
                      <span className="font-black text-white">{match.score_j2}</span>
                    )}
                    {match.vainqueur_id === match.joueur2_id && <Trophy className="h-4 w-4 text-amber-400" />}
                  </div>

                  {isAdmin && !hasWinner && match.joueur1_id && match.joueur2_id && onAdvance && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => onAdvance(match.id, match.joueur1_id!)}
                        className="flex-1 rounded-lg bg-white/10 py-2 text-xs font-bold text-white hover:bg-white/15"
                      >
                        {match.joueur1_pseudo} gagne
                      </button>
                      <button
                        onClick={() => onAdvance(match.id, match.joueur2_id!)}
                        className="flex-1 rounded-lg bg-white/10 py-2 text-xs font-bold text-white hover:bg-white/15"
                      >
                        {match.joueur2_pseudo} gagne
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
