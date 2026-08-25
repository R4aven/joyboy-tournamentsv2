"use client"
import { BracketMatch } from "@/lib/tournaments/types"
import { cn } from "@/lib/utils"

interface Props {
  matches: BracketMatch[]
}

export function BracketView({ matches }: Props) {
  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
        <p className="text-zinc-400">Bracket en attente des 10 joueurs...</p>
      </div>
    )
  }

  const prelim = matches.filter(m => m.round === "PRELIMINAIRE")
  const quarts = matches.filter(m => m.round === "QUART")
  const demis = matches.filter(m => m.round === "DEMI")
  const finale = matches.filter(m => m.round === "FINALE")

  const RoundColumn = ({ title, matches, highlight }: { title: string, matches: BracketMatch[], highlight?: boolean }) => (
    <div className="space-y-4 min-w-[220px]">
      <h4 className={cn("text-[11px] font-black tracking-widest uppercase text-center py-2 rounded-lg border",
        highlight ? "bg-amber-500/10 border-amber-500/20 text-amber-300" : "bg-white/[0.03] border-white/10 text-zinc-500"
      )}>{title}</h4>
      <div className="space-y-6">
        {matches.map(m => (
          <div key={m.id} className={cn(
            "rounded-xl border p-3 bg-[#15151E]",
            m.statut === "TERMINE" ? "border-emerald-500/20" : "border-white/10"
          )}>
            <div className="space-y-1.5">
              <BracketPlayer name={m.joueur1_pseudo} isWinner={m.vainqueur_id === m.joueur1_id} isLoser={!!m.vainqueur_id && m.vainqueur_id !== m.joueur1_id} score={m.score_j1} />
              <div className="h-px bg-white/10 mx-2" />
              <BracketPlayer name={m.joueur2_pseudo} isWinner={m.vainqueur_id === m.joueur2_id} isLoser={!!m.vainqueur_id && m.vainqueur_id !== m.joueur2_id} score={m.score_j2} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-max">
        {prelim.length > 0 && <RoundColumn title="Préliminaire (2)" matches={prelim} />}
        <RoundColumn title="Quarts (4)" matches={quarts} />
        <RoundColumn title="Demis (2)" matches={demis} />
        <RoundColumn title="Finale" matches={finale} highlight />
      </div>
    </div>
  )
}

function BracketPlayer({ name, isWinner, isLoser, score }: { name: string | null, isWinner?: boolean, isLoser?: boolean, score?: number }) {
  return (
    <div className={cn("flex items-center justify-between rounded-lg px-2.5 py-2 text-xs",
      isWinner ? "bg-emerald-500/20 text-white font-bold border border-emerald-500/30" :
      isLoser ? "bg-white/[0.02] text-zinc-600 line-through" :
      "bg-white/[0.04] text-zinc-300"
    )}>
      <span className="truncate">{name || "TBD"}</span>
      {score !== undefined && <span className="font-black ml-2">{score}</span>}
      {isWinner && <span className="ml-2">🏆</span>}
    </div>
  )
}
