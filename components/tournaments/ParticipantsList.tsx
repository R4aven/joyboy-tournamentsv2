"use client"
import { Participant } from "@/lib/tournaments/types"
import { cn } from "@/lib/utils"
import { Crown, Check, Clock, X } from "lucide-react"

interface Props {
  participants: Participant[]
  maxParticipants: number
  currentUserId?: string
}

export function ParticipantsList({ participants, maxParticipants, currentUserId }: Props) {
  const sorted = [...participants].sort((a,b) => new Date(a.date_inscription).getTime() - new Date(b.date_inscription).getTime())

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white">Participants ({participants.length}/{maxParticipants})</h3>
        <div className="h-2 w-32 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-400" style={{ width: `${(participants.length / maxParticipants)*100}%` }} />
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
          <p className="text-zinc-400">Aucun participant pour l&apos;instant. Sois le premier à rejoindre ! 🔥</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {sorted.map((p, idx) => {
            const isMe = p.user_id === currentUserId
            const isLeader = idx === 0
            return (
              <div key={p.id} className={cn(
                "group flex items-center gap-3 rounded-xl border p-3 transition-all",
                isMe ? "border-violet-500/50 bg-violet-500/10" : "border-white/[0.06] bg-white/[0.03] hover:border-white/10"
              )}>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 font-black text-xs text-white">
                  {idx + 1}
                </div>
                <div className="relative h-10 w-10 overflow-hidden rounded-full bg-zinc-800">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt={p.pseudo} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-600 to-cyan-600 font-bold text-white">
                      {p.pseudo.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {isLeader && (
                    <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-black">
                      <Crown className="h-3 w-3" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("truncate font-semibold text-sm", isMe ? "text-violet-300" : "text-white")}>
                      {p.pseudo} {isMe && "(toi)"}
                    </span>
                    {p.statut_paiement === "VALIDE" && <Check className="h-4 w-4 text-emerald-400" />}
                    {p.statut_paiement === "EN_ATTENTE" && <Clock className="h-4 w-4 text-amber-400" />}
                    {p.statut_paiement === "REFUSE" && <X className="h-4 w-4 text-red-400" />}
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Inscrit le {new Date(p.date_inscription).toLocaleDateString("fr-FR")}
                  </div>
                </div>
                <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold",
                  p.statut_paiement === "VALIDE" ? "bg-emerald-500/15 text-emerald-400" :
                  p.statut_paiement === "EN_ATTENTE" ? "bg-amber-500/15 text-amber-400" :
                  "bg-red-500/15 text-red-400"
                )}>
                  {p.statut_paiement}
                </span>
              </div>
            )
          })}
          {Array.from({ length: Math.max(0, maxParticipants - participants.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="flex items-center gap-3 rounded-xl border border-dashed border-white/10 bg-transparent p-3 opacity-60">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-xs text-zinc-500">
                {participants.length + i + 1}
              </div>
              <div className="h-10 w-10 rounded-full bg-white/[0.02] border border-dashed border-white/10" />
              <span className="text-sm text-zinc-600">Place disponible</span>
              <span className="ml-auto text-[10px] text-zinc-600">EN ATTENTE</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
