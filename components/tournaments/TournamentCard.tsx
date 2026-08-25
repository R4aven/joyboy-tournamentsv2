"use client"
import { Tournament } from "@/lib/tournaments/types"
import { formatPrice, cn } from "@/lib/utils"
import { Users, Trophy, Calendar, Gamepad2, Flame, Clock } from "lucide-react"
import Link from "next/link"

const statusStyles: Record<string, string> = {
  OUVERT: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]",
  COMPLET: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  EN_COURS: "bg-violet-500/10 text-violet-400 border-violet-500/20 shadow-[0_0_15px_rgba(124,58,237,0.2)] animate-pulse",
  TERMINE: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  ANNULE: "bg-red-500/10 text-red-400 border-red-500/20",
}

const statusLabels: Record<string, string> = {
  OUVERT: "OUVERT",
  COMPLET: "COMPLET",
  EN_COURS: "EN COURS",
  TERMINE: "TERMINÉ",
  ANNULE: "ANNULÉ",
}

interface Props {
  tournament: Tournament
  featured?: boolean
}

export function TournamentCard({ tournament, featured }: Props) {
  const progress = Math.min((tournament.participants_actuels / tournament.max_participants) * 100, 100)
  
  return (
    <Link href={`/tournaments/${tournament.id}`} className="group block">
      <div className={cn(
        "relative overflow-hidden rounded-[20px] p-[1px] transition-all duration-500",
        featured ? "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 shadow-[0_0_40px_rgba(124,58,237,0.25)]" : "bg-[#22222F] group-hover:bg-[#2a2a3a]"
      )}>
        <div className="relative rounded-[19px] bg-[#12121A] overflow-hidden h-full">
          <div className="relative h-[140px] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/40 via-[#12121A]/60 to-cyan-600/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#12121A] via-transparent to-transparent" />
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-4 left-4 w-20 h-20 rounded-full bg-violet-500 blur-[30px]" />
              <div className="absolute bottom-2 right-8 w-16 h-16 rounded-full bg-cyan-400 blur-[25px]" />
            </div>
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 text-xs font-bold text-white">
                <Gamepad2 className="h-3.5 w-3.5" /> {tournament.jeu}
              </span>
              {featured && (
                <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2.5 py-1 text-[10px] font-black text-black">
                  <Flame className="h-3 w-3" /> POPULAIRE
                </span>
              )}
            </div>
            <div className="absolute top-4 right-4">
              <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold tracking-wider", statusStyles[tournament.statut])}>
                {statusLabels[tournament.statut]}
              </span>
            </div>
            <div className="absolute bottom-3 left-4 right-4">
              <h3 className="font-black text-[18px] leading-tight text-white line-clamp-2 group-hover:text-gradient transition-all">
                {tournament.nom}
              </h3>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-2.5">
                <div className="flex items-center gap-1 text-[10px] text-zinc-500 uppercase tracking-wider font-semibold"><Users className="h-3 w-3" /> Joueurs</div>
                <div className="mt-1 font-bold text-sm text-white">{tournament.participants_actuels}/{tournament.max_participants}</div>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-2.5">
                <div className="flex items-center gap-1 text-[10px] text-zinc-500 uppercase tracking-wider font-semibold"><Trophy className="h-3 w-3" /> Gain</div>
                <div className="mt-1 font-bold text-sm text-emerald-400">{formatPrice(tournament.gain_vainqueur)}</div>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-2.5">
                <div className="flex items-center gap-1 text-[10px] text-zinc-500 uppercase tracking-wider font-semibold"><Calendar className="h-3 w-3" /> Date</div>
                <div className="mt-1 font-bold text-[12px] text-white">
                  {new Date(tournament.date_debut).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-500 font-medium">Remplissage</span>
                <span className="text-zinc-300 font-bold">{tournament.participants_actuels} / {tournament.max_participants} places</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-400 transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Clock className="h-3.5 w-3.5" />
                <span>Inscription: {formatPrice(tournament.prix_inscription)}</span>
              </div>
              <span className="text-xs font-bold text-white group-hover:text-violet-400 transition-colors flex items-center gap-1">
                Voir détails <span className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
