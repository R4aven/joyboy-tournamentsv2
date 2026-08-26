import * as React from "react"
import { cn } from "@/lib/utils"
import { Avatar } from "./avatar"
import { Badge } from "./badge"
import { Trophy, Crown } from "lucide-react"

export type Participant = {
  id: string
  username: string
  avatarUrl?: string | null
  city?: string
  seed?: number
}

export type BracketMatchStatus = "a_venir" | "en_cours" | "termine" | "forfait"

export type BracketMatch = {
  id: string
  roundIndex: number
  roundName: string
  position: number
  playerA?: Participant | null
  playerB?: Participant | null
  scoreA?: number | null
  scoreB?: number | null
  winnerId?: string | null
  status: BracketMatchStatus
  nextMatchId?: string | null
}

export type BracketRound = {
  index: number
  name: string
  shortName: string
  matches: BracketMatch[]
}

interface BracketProps {
  participants: Participant[]
  matches?: BracketMatch[]
  onMatchClick?: (m: BracketMatch) => void
  className?: string
  title?: string
}

const ROUND_LABELS_10 = [
  { name: "Barrages", short: "Barrages", desc: "10 → 8 joueurs" },
  { name: "Quarts de finale", short: "Quarts", desc: "8 → 4" },
  { name: "Demi-finales", short: "Demis", desc: "4 → 2" },
  { name: "Finale", short: "Finale", desc: "1 champion" },
]

function generateFromParticipants(participants: Participant[], existing?: BracketMatch[]): BracketRound[] {
  const sorted = [...participants].sort((a, b) => (a.seed || 999) - (b.seed || 999))
  const count = sorted.length
  const mapExisting = new Map((existing || []).map((m) => [m.id, m]))

  // 10 players logic
  if (count >= 9) {
    // Barrages: slots 6-9
    const barrageA = sorted.slice(6, 10) // 4 players
    const direct = sorted.slice(0, 6)

    const barrageMatches: BracketMatch[] = [
      {
        id: "barrage-0",
        roundIndex: 0,
        roundName: "Barrages",
        position: 0,
        playerA: barrageA[0] || null,
        playerB: barrageA[3] || null,
        status: (mapExisting.get("barrage-0")?.status as any) || (barrageA[0] && barrageA[3] ? "a_venir" : "a_venir"),
        winnerId: mapExisting.get("barrage-0")?.winnerId || null,
        scoreA: mapExisting.get("barrage-0")?.scoreA ?? null,
        scoreB: mapExisting.get("barrage-0")?.scoreB ?? null,
        nextMatchId: "quart-0",
      },
      {
        id: "barrage-1",
        roundIndex: 0,
        roundName: "Barrages",
        position: 1,
        playerA: barrageA[1] || null,
        playerB: barrageA[2] || null,
        status: (mapExisting.get("barrage-1")?.status as any) || "a_venir",
        winnerId: mapExisting.get("barrage-1")?.winnerId || null,
        scoreA: mapExisting.get("barrage-1")?.scoreA ?? null,
        scoreB: mapExisting.get("barrage-1")?.scoreB ?? null,
        nextMatchId: "quart-1",
      },
    ]

    const winnerBarrage0 = barrageMatches[0].winnerId
      ? sorted.find((p) => p.id === barrageMatches[0].winnerId) || barrageA[0]
      : undefined
    const winnerBarrage1 = barrageMatches[1].winnerId
      ? sorted.find((p) => p.id === barrageMatches[1].winnerId) || barrageA[1]
      : undefined

    const quartMatches: BracketMatch[] = [
      {
        id: "quart-0",
        roundIndex: 1,
        roundName: "Quarts de finale",
        position: 0,
        playerA: direct[0] || null,
        playerB: winnerBarrage0 ? { ...winnerBarrage0, username: winnerBarrage0.username } : barrageA[0] || null,
        status: mapExisting.get("quart-0")?.status || "a_venir",
        winnerId: mapExisting.get("quart-0")?.winnerId || null,
        scoreA: mapExisting.get("quart-0")?.scoreA ?? null,
        scoreB: mapExisting.get("quart-0")?.scoreB ?? null,
        nextMatchId: "demi-0",
      },
      {
        id: "quart-1",
        roundIndex: 1,
        roundName: "Quarts de finale",
        position: 1,
        playerA: direct[1] || null,
        playerB: winnerBarrage1 ? { ...winnerBarrage1, username: winnerBarrage1.username } : barrageA[1] || null,
        status: mapExisting.get("quart-1")?.status || "a_venir",
        winnerId: mapExisting.get("quart-1")?.winnerId || null,
        scoreA: mapExisting.get("quart-1")?.scoreA ?? null,
        scoreB: mapExisting.get("quart-1")?.scoreB ?? null,
        nextMatchId: "demi-0",
      },
      {
        id: "quart-2",
        roundIndex: 1,
        roundName: "Quarts de finale",
        position: 2,
        playerA: direct[2] || null,
        playerB: direct[5] || null,
        status: mapExisting.get("quart-2")?.status || "a_venir",
        winnerId: mapExisting.get("quart-2")?.winnerId || null,
        scoreA: mapExisting.get("quart-2")?.scoreA ?? null,
        scoreB: mapExisting.get("quart-2")?.scoreB ?? null,
        nextMatchId: "demi-1",
      },
      {
        id: "quart-3",
        roundIndex: 1,
        roundName: "Quarts de finale",
        position: 3,
        playerA: direct[3] || null,
        playerB: direct[4] || null,
        status: mapExisting.get("quart-3")?.status || "a_venir",
        winnerId: mapExisting.get("quart-3")?.winnerId || null,
        scoreA: mapExisting.get("quart-3")?.scoreA ?? null,
        scoreB: mapExisting.get("quart-3")?.scoreB ?? null,
        nextMatchId: "demi-1",
      },
    ]

    const demiMatches: BracketMatch[] = [
      {
        id: "demi-0",
        roundIndex: 2,
        roundName: "Demi-finales",
        position: 0,
        playerA: null,
        playerB: null,
        status: mapExisting.get("demi-0")?.status || "a_venir",
        winnerId: mapExisting.get("demi-0")?.winnerId || null,
        scoreA: mapExisting.get("demi-0")?.scoreA ?? null,
        scoreB: mapExisting.get("demi-0")?.scoreB ?? null,
        nextMatchId: "finale",
      },
      {
        id: "demi-1",
        roundIndex: 2,
        roundName: "Demi-finales",
        position: 1,
        playerA: null,
        playerB: null,
        status: mapExisting.get("demi-1")?.status || "a_venir",
        winnerId: mapExisting.get("demi-1")?.winnerId || null,
        scoreA: mapExisting.get("demi-1")?.scoreA ?? null,
        scoreB: mapExisting.get("demi-1")?.scoreB ?? null,
        nextMatchId: "finale",
      },
    ]

    // Try to resolve demi players from quart winners if provided
    quartMatches.forEach((qm) => {
      const linked = mapExisting.get(qm.id)
      if (linked?.winnerId) {
        const winner = sorted.find((p) => p.id === linked.winnerId) || (qm.playerA as Participant)
        if (qm.nextMatchId) {
          const dm = demiMatches.find((d) => d.id === qm.nextMatchId)
          if (dm) {
            if (!dm.playerA) dm.playerA = winner || null
            else if (!dm.playerB) dm.playerB = winner || null
          }
        }
      }
    })

    const finale: BracketMatch[] = [
      {
        id: "finale",
        roundIndex: 3,
        roundName: "Finale",
        position: 0,
        playerA: null,
        playerB: null,
        status: mapExisting.get("finale")?.status || "a_venir",
        winnerId: mapExisting.get("finale")?.winnerId || null,
        scoreA: mapExisting.get("finale")?.scoreA ?? null,
        scoreB: mapExisting.get("finale")?.scoreB ?? null,
      },
    ]

    demiMatches.forEach((dm) => {
      const linked = mapExisting.get(dm.id)
      if (linked?.winnerId) {
        const winner = sorted.find((p) => p.id === linked.winnerId)
        const f = finale[0]
        if (f) {
          if (!f.playerA) f.playerA = winner || null
          else if (!f.playerB) f.playerB = winner || null
        }
      }
    })

    // Merge existing overrides for player fields if needed
    const all = [...barrageMatches, ...quartMatches, ...demiMatches, ...finale]
    all.forEach((m) => {
      const ex = mapExisting.get(m.id)
      if (ex) {
        if (ex.playerA !== undefined) m.playerA = (ex.playerA as any) || m.playerA
        if (ex.playerB !== undefined) m.playerB = (ex.playerB as any) || m.playerB
      }
    })

    return [
      { index: 0, name: "Barrages", shortName: "Barrages", matches: barrageMatches },
      { index: 1, name: "Quarts de finale", shortName: "Quarts", matches: quartMatches },
      { index: 2, name: "Demi-finales", shortName: "Demis", matches: demiMatches },
      { index: 3, name: "Finale", shortName: "Finale", matches: finale },
    ]
  }

  // Fallback for 8 players: no barrages
  if (count === 8) {
    const quarts: BracketMatch[] = Array.from({ length: 4 }).map((_, i) => ({
      id: `quart-${i}`,
      roundIndex: 0,
      roundName: "Quarts de finale",
      position: i,
      playerA: sorted[i * 2] || null,
      playerB: sorted[i * 2 + 1] || null,
      status: mapExisting.get(`quart-${i}`)?.status || "a_venir",
      winnerId: mapExisting.get(`quart-${i}`)?.winnerId || null,
      scoreA: mapExisting.get(`quart-${i}`)?.scoreA ?? null,
      scoreB: mapExisting.get(`quart-${i}`)?.scoreB ?? null,
      nextMatchId: `demi-${Math.floor(i / 2)}`,
    }))
    const demis: BracketMatch[] = Array.from({ length: 2 }).map((_, i) => ({
      id: `demi-${i}`,
      roundIndex: 1,
      roundName: "Demi-finales",
      position: i,
      playerA: null,
      playerB: null,
      status: mapExisting.get(`demi-${i}`)?.status || "a_venir",
      winnerId: mapExisting.get(`demi-${i}`)?.winnerId || null,
      scoreA: mapExisting.get(`demi-${i}`)?.scoreA ?? null,
      scoreB: mapExisting.get(`demi-${i}`)?.scoreB ?? null,
      nextMatchId: "finale",
    }))
    const finale: BracketMatch[] = [
      {
        id: "finale",
        roundIndex: 2,
        roundName: "Finale",
        position: 0,
        playerA: null,
        playerB: null,
        status: mapExisting.get("finale")?.status || "a_venir",
        winnerId: null,
      },
    ]
    return [
      { index: 0, name: "Quarts de finale", shortName: "Quarts", matches: quarts },
      { index: 1, name: "Demi-finales", shortName: "Demis", matches: demis },
      { index: 2, name: "Finale", shortName: "Finale", matches: finale },
    ]
  }

  // Generic small bracket
  return [
    {
      index: 0,
      name: "Participants",
      shortName: "Joueurs",
      matches: [
        {
          id: "list",
          roundIndex: 0,
          roundName: "Participants",
          position: 0,
          playerA: sorted[0] || null,
          playerB: sorted[1] || null,
          status: "a_venir",
        },
      ],
    },
  ]
}

function PlayerRow({
  player,
  score,
  isWinner,
  isLoser,
  placeholder,
}: {
  player?: Participant | null
  score?: number | null
  isWinner?: boolean
  isLoser?: boolean
  placeholder?: string
}) {
  if (!player) {
    return (
      <div className="flex items-center gap-2.5 py-2.5 px-3 opacity-60">
        <div className="h-7 w-7 rounded-full bg-[#1A1A23] border border-dashed border-[#2A2A3A]" />
        <span className="text-[13px] text-zinc-500 italic">{placeholder || "En attente..."}</span>
      </div>
    )
  }
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 py-2.5 px-3 transition-colors",
        isWinner && "bg-[#7C3AED]/10",
        isLoser && "opacity-60"
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Avatar src={player.avatarUrl} alt={player.username} fallback={player.username} size="sm" glow={!!isWinner} className="shrink-0" />
        <span className={cn("text-[13px] truncate font-medium", isWinner ? "text-white font-semibold" : "text-zinc-200")}>{player.username}</span>
        {isWinner && <Crown className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {score !== null && score !== undefined && (
          <span
            className={cn(
              "min-w-[24px] text-center text-[13px] font-bold rounded-md px-1.5 py-0.5",
              isWinner ? "bg-[#7C3AED] text-white shadow-[0_0_10px_rgba(124,58,237,0.4)]" : "bg-[#1E1E2A] text-zinc-300 border border-[#2A2A3A]"
            )}
          >
            {score}
          </span>
        )}
      </div>
    </div>
  )
}

function MatchCard({ match, onClick }: { match: BracketMatch; onClick?: (m: BracketMatch) => void }) {
  const isFinished = match.status === "termine"
  const winnerA = match.winnerId && match.playerA && match.winnerId === match.playerA.id
  const winnerB = match.winnerId && match.playerB && match.winnerId === match.playerB.id

  return (
    <div
      onClick={() => onClick?.(match)}
      className={cn(
        "group relative w-[260px] rounded-[16px] overflow-hidden border bg-[#15151E] transition-all duration-300 cursor-pointer",
        "border-[#22222F] hover:border-[#7C3AED]/40 hover:-translate-y-[1px] hover:shadow-[0_8px_24px_-12px_rgba(124,58,237,0.3)]",
        isFinished && match.winnerId && "border-[#7C3AED]/30 shadow-[0_0_0_1px_rgba(124,58,237,0.15),0_0_20px_rgba(124,58,237,0.1)]",
        match.status === "en_cours" && "border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)] animate-pulse"
      )}
    >
      {/* top bar status */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.04] bg-[#1A1A23]/80">
        <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-500">{match.id.replace("-", " ")}</span>
        <Badge
          variant={
            match.status === "termine" ? "termine" : match.status === "en_cours" ? "en_cours" : match.status === "forfait" ? "danger" : "a_venir"
          }
          className="scale-90"
        >
          {match.status === "termine" ? "Terminé" : match.status === "en_cours" ? "En cours" : match.status === "forfait" ? "Forfait" : "À venir"}
        </Badge>
      </div>

      <PlayerRow
        player={match.playerA}
        score={match.scoreA}
        isWinner={!!winnerA}
        isLoser={isFinished && !winnerA}
        placeholder={match.roundIndex > 0 ? "Vainqueur précédent" : "Joueur A"}
      />
      <div className="mx-3 h-px bg-gradient-to-r from-transparent via-[#22222F] to-transparent" />
      <PlayerRow
        player={match.playerB}
        score={match.scoreB}
        isWinner={!!winnerB}
        isLoser={isFinished && !winnerB}
        placeholder={match.roundIndex > 0 ? "Vainqueur précédent" : "Joueur B"}
      />

      {/* glow */}
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(200px_at_50%_0%,rgba(124,58,237,0.12),transparent)]" />
    </div>
  )
}

export function Bracket({ participants, matches, onMatchClick, className, title = "Arbre du tournoi" }: BracketProps) {
  const rounds = React.useMemo(() => generateFromParticipants(participants, matches), [participants, matches])

  const containerRef = React.useRef<HTMLDivElement>(null)

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold tracking-tight text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#7C3AED]" />
            {title}
          </h2>
          <p className="text-[13px] text-zinc-400 mt-1">
            {participants.length} joueurs inscrits • Format élimination directe •{" "}
            <span className="text-[#A78BFA]">{rounds.map((r) => r.name).join(" → ")}</span>
          </p>
        </div>
        <Badge variant="violet" dot>
          En direct
        </Badge>
      </div>

      {/* scroll wrapper */}
      <div ref={containerRef} className="relative w-full overflow-x-auto pb-8 scrollbar-thin -mx-1 px-1">
        <div className="flex gap-6 min-w-max relative">
          {/* SVG connectors */}
          <svg className="pointer-events-none absolute left-0 top-0 h-full w-full" style={{ minWidth: rounds.length * 300 }}>
            {/* This SVG is decorative; actual lines via CSS for robustness */}
          </svg>

          {rounds.map((round, roundIdx) => (
            <div key={round.index} className="relative flex flex-col min-w-[280px]">
              {/* Round header */}
              <div className="sticky left-0 mb-4 px-1">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-[#1E1E2A] border border-[#2A2A3A] flex items-center justify-center text-[11px] font-bold text-zinc-400">
                    {round.index + 1}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-white tracking-tight">{round.name}</p>
                    <p className="text-[11px] text-zinc-500">{round.matches.length} matchs</p>
                  </div>
                </div>
                <div className="mt-3 h-px w-full bg-gradient-to-r from-[#7C3AED]/30 via-[#06B6D4]/20 to-transparent" />
              </div>

              {/* Matches column with even spacing to center vs next round */}
              <div
                className={cn(
                  "flex flex-col",
                  // dynamic gap to visually connect to next round
                  round.index === 0 && "gap-6",
                  round.index === 1 && "gap-14 justify-center pt-6",
                  round.index === 2 && "gap-36 justify-center pt-16",
                  round.index === 3 && "justify-center pt-[160px]"
                )}
              >
                {round.matches.map((m) => (
                  <div key={m.id} className="relative">
                    <MatchCard match={m} onClick={onMatchClick} />

                    {/* Connector to next round */}
                    {roundIdx < rounds.length - 1 && (
                      <>
                        <div className="absolute top-1/2 -right-3 h-px w-3 bg-[#2A2A3A] hidden lg:block" />
                        {/* For barrages -> quarts, we need elbow */}
                        {round.index < 2 && (
                          <div className="absolute top-1/2 -right-6 h-[56px] w-3 border-r border-t border-[#2A2A3A] rounded-tr-lg hidden lg:block -translate-y-1/2" />
                        )}
                      </>
                    )}
                    {/* left connector */}
                    {round.index > 0 && (
                      <div className="absolute top-1/2 -left-3 h-px w-3 bg-[#2A2A3A] hidden lg:block" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Trophy final column visual */}
          <div className="flex flex-col justify-center min-w-[160px] pl-6">
            <div className="rounded-[20px] bg-[radial-gradient(120%_120%_at_50%_0%,rgba(124,58,237,0.18)_0%,transparent_60%),#15151E] border border-[#7C3AED]/20 p-5 text-center shadow-[0_0_30px_rgba(124,58,237,0.15)]">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] shadow-[0_0_20px_rgba(124,58,237,0.4)]">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <p className="text-[13px] font-semibold text-white">Champion</p>
              <p className="text-[11px] text-zinc-400 mt-1">Qui soulèvera le trophée E-TOURNOIS CI ?</p>
              {rounds[rounds.length - 1]?.matches[0]?.winnerId && participants.find((p) => p.id === rounds[rounds.length - 1].matches[0].winnerId) && (
                <div className="mt-4">
                  <Avatar
                    src={participants.find((p) => p.id === rounds[rounds.length - 1].matches[0].winnerId)?.avatarUrl}
                    alt={participants.find((p) => p.id === rounds[rounds.length - 1].matches[0].winnerId)?.username}
                    fallback={participants.find((p) => p.id === rounds[rounds.length - 1].matches[0].winnerId)?.username}
                    size="lg"
                    glow
                    className="mx-auto"
                  />
                  <p className="mt-2 text-[14px] font-bold text-white">
                    {participants.find((p) => p.id === rounds[rounds.length - 1].matches[0].winnerId)?.username}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile legend */}
      <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#7C3AED]" /> Gagnant
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> En cours
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Terminé
        </span>
        <span className="ml-auto">Fais défiler ↔ pour voir tout l'arbre</span>
      </div>
    </div>
  )
}
