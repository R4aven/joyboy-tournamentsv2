export type TournamentStatus = "OUVERT" | "COMPLET" | "EN_COURS" | "TERMINE" | "ANNULE"
export type MatchStatus = "A_VENIR" | "EN_COURS" | "TERMINE" | "FORFAIT"

export interface Tournament {
  id: string
  nom: string
  jeu: string
  description: string
  prix_inscription: number
  gain_vainqueur: number
  gain_finaliste: number
  gain_demi?: number
  max_participants: number
  participants_actuels: number
  date_debut: string
  date_fin?: string
  statut: TournamentStatus
  image_url?: string
  regles: string[]
  created_at: string
}

export interface Participant {
  id: string
  tournament_id: string
  user_id: string
  pseudo: string
  avatar_url?: string
  statut_paiement: "EN_ATTENTE" | "VALIDE" | "REFUSE"
  date_inscription: string
  est_qualifie?: boolean
}

export interface BracketMatch {
  id: string
  tournament_id: string
  round: "PRELIMINAIRE" | "QUART" | "DEMI" | "FINALE"
  round_number: number // 0 = prelim, 1 = quart, 2 = demi, 3 = finale
  position: number // position in round
  joueur1_id: string | null
  joueur1_pseudo: string | null
  joueur2_id: string | null
  joueur2_pseudo: string | null
  vainqueur_id: string | null
  score_j1?: number
  score_j2?: number
  statut: MatchStatus
  next_match_id?: string | null // id du match suivant où le vainqueur va
  next_match_slot?: 1 | 2 // slot dans le match suivant
}

export interface Bracket {
  id: string
  tournament_id: string
  matches: BracketMatch[]
  generated_at: string
}

export interface PaymentProof {
  id: string
  tournament_id: string
  user_id: string
  montant: number
  fichier_url: string
  statut: "EN_ATTENTE" | "VALIDE" | "REFUSE"
  created_at: string
}
