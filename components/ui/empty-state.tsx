import * as React from "react"
import { Trophy, Users, Swords, Bell, Search, Gamepad2, Crown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

type EmptyVariant = "tournaments" | "players" | "matches" | "notifications" | "search" | "1v1" | "palmarès" | "generic"

interface EmptyStateProps {
  variant?: EmptyVariant
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: React.ReactNode
  className?: string
}

const presets: Record<EmptyVariant, { icon: React.ReactNode; title: string; description: string; action: string }> = {
  tournaments: {
    icon: <Trophy className="h-10 w-10" />,
    title: "Aucun tournoi pour le moment",
    description: "Les prochains clashs arrivent bientôt. Reste branche, champion ! La bataille ne fait que commencer en Cote d'Ivoire.",
    action: "Voir les tournois",
  },
  players: {
    icon: <Users className="h-10 w-10" />,
    title: "Aucun joueur trouve",
    description: "On n'a trouve personne avec ce filtre. Essaie un autre nom ou invite tes gars a rejoindre E-TOURNOIS CI.",
    action: "Effacer les filtres",
  },
  matches: {
    icon: <Swords className="h-10 w-10" />,
    title: "Pas encore de matchs",
    description: "Le bracket n'est pas encore genere. Des que les inscriptions ferment, ca va chauffer !",
    action: "Actualiser",
  },
  notifications: {
    icon: <Bell className="h-10 w-10" />,
    title: "Tu es a jour, boss !",
    description: "Aucune notification non lue. On te previent des qu'il y a un nouveau defi ou qu'un tournoi commence.",
    action: "Retour a l'accueil",
  },
  search: {
    icon: <Search className="h-10 w-10" />,
    title: "Aucun resultat",
    description: "On a fouille partout mais on n'a rien trouve. Essaie avec un autre mot-cle, plus simple.",
    action: "Reessayer",
  },
  "1v1": {
    icon: <Gamepad2 className="h-10 w-10" />,
    title: "Aucun duel 1V1 actif",
    description: "Personne ne t'a defie pour l'instant. Lance un 1V1 et montre qui est le vrai E-TOURNOIS CI du quartier.",
    action: "Lancer un 1V1",
  },
  "palmarès": {
    icon: <Crown className="h-10 w-10" />,
    title: "Palmares vide",
    description: "Pas encore de victoire enregistree. Le prochain trophee peut etre le tien, il faut juste t'inscrire.",
    action: "Participer a un tournoi",
  },
  generic: {
    icon: <Trophy className="h-10 w-10" />,
    title: "Rien a afficher",
    description: "Il n'y a rien ici pour l'instant. Reviens plus tard, on prepare du lourd.",
    action: "Retour",
  },
}

export function EmptyState({ variant = "generic", title, description, actionLabel, onAction, icon, className }: EmptyStateProps) {
  const preset = presets[variant]
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center rounded-[24px] border border-[#22222F] bg-[radial-gradient(120%_120%_at_50%_0%,rgba(124,58,237,0.10)_0%,transparent_60%),#15151E] px-8 py-14 text-center overflow-hidden",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
        className
      )}
    >
      <div className="pointer-events-none absolute -top-24 h-48 w-48 rounded-full bg-[#7C3AED]/20 blur-[60px]" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-[#06B6D4]/10 blur-[80px]" />

      <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-[20px] bg-[#1E1E2A] border border-[#2A2A3A] text-zinc-400 shadow-[0_0_20px_rgba(124,58,237,0.15)]">
        <div className="absolute inset-0 rounded-[20px] bg-gradient-to-br from-[#7C3AED]/15 to-[#06B6D4]/10" />
        <div className="relative">{icon || preset.icon}</div>
      </div>

      <h3 className="relative text-[18px] font-semibold tracking-tight text-white">{title || preset.title}</h3>
      <p className="relative mt-2 max-w-[380px] text-[13.5px] leading-relaxed text-zinc-400">
        {description || preset.description}
      </p>

      {(onAction || actionLabel) && (
        <div className="relative mt-6">
          <Button variant="secondary" size="md" onClick={onAction}>
            {actionLabel || preset.action}
          </Button>
        </div>
      )}
    </div>
  )
}
