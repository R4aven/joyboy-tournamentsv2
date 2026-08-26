
/**
 * 🇨🇮 E-TOURNOIS CI - Types Match Salon eFootball
 * IMPORTANT: E-TOURNOIS CI organise seulement. Pas d'API eFootball. Les joueurs jouent réellement sur eFootball.
 */

export type MatchType = "TOURNOI" | "1V1";
export type UserRole = "JOUEUR" | "ADMIN" | "MODERATEUR";

// Les 9 statuts obligatoires - ordre chronologique réel d'un match
export type MatchStatus =
  | "PROGRAMME" // MATCH PROGRAMMÉ - créé, en attente
  | "EN_ATTENTE_ADVERSAIRE" // EN ATTENTE DE L'ADVERSAIRE
  | "SALON_CREE" // SALON CRÉÉ - infos connexion renseignées
  | "JOUEURS_CONNECTES" // JOUEURS CONNECTÉS - les 2 ont cliqué JE SUIS CONNECTÉ
  | "MATCH_EN_COURS" // MATCH EN COURS - parti lancé sur eFootball
  | "RESULTAT_EN_ATTENTE" // RÉSULTAT EN ATTENTE - un joueur a déclaré
  | "RESULTAT_CONFIRME" // RÉSULTAT CONFIRMÉ - double déclaration concordante
  | "CONTESTATION" // CONTESTATION - déclarations différentes → admin
  | "TERMINE"; // TERMINÉ - validé admin + bracket maj

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  PROGRAMME: "MATCH PROGRAMMÉ",
  EN_ATTENTE_ADVERSAIRE: "EN ATTENTE DE L'ADVERSAIRE",
  SALON_CREE: "SALON CRÉÉ",
  JOUEURS_CONNECTES: "JOUEURS CONNECTÉS",
  MATCH_EN_COURS: "MATCH EN COURS",
  RESULTAT_EN_ATTENTE: "RÉSULTAT EN ATTENTE",
  RESULTAT_CONFIRME: "RÉSULTAT CONFIRMÉ",
  CONTESTATION: "CONTESTATION",
  TERMINE: "TERMINÉ",
};

export const MATCH_STATUS_COLORS: Record<MatchStatus, { bg: string; text: string; border: string; dot: string }> = {
  PROGRAMME: { bg: "bg-zinc-800/50", text: "text-zinc-300", border: "border-zinc-700", dot: "bg-zinc-400" },
  EN_ATTENTE_ADVERSAIRE: { bg: "bg-amber-500/10", text: "text-amber-300", border: "border-amber-500/20", dot: "bg-amber-400" },
  SALON_CREE: { bg: "bg-violet-500/10", text: "text-violet-300", border: "border-violet-500/20", dot: "bg-violet-400" },
  JOUEURS_CONNECTES: { bg: "bg-cyan-500/10", text: "text-cyan-300", border: "border-cyan-500/20", dot: "bg-cyan-400" },
  MATCH_EN_COURS: { bg: "bg-blue-500/15", text: "text-blue-300", border: "border-blue-500/30", dot: "bg-blue-400 animate-pulse" },
  RESULTAT_EN_ATTENTE: { bg: "bg-orange-500/10", text: "text-orange-300", border: "border-orange-500/20", dot: "bg-orange-400 animate-pulse" },
  RESULTAT_CONFIRME: { bg: "bg-emerald-500/10", text: "text-emerald-300", border: "border-emerald-500/20", dot: "bg-emerald-400" },
  CONTESTATION: { bg: "bg-red-500/15", text: "text-red-300", border: "border-red-500/30", dot: "bg-red-400 animate-pulse" },
  TERMINE: { bg: "bg-emerald-500/15", text: "text-zinc-100", border: "border-emerald-500/30", dot: "bg-emerald-400" },
};

export const MATCH_STATUS_ORDER: MatchStatus[] = [
  "PROGRAMME",
  "EN_ATTENTE_ADVERSAIRE",
  "SALON_CREE",
  "JOUEURS_CONNECTES",
  "MATCH_EN_COURS",
  "RESULTAT_EN_ATTENTE",
  "RESULTAT_CONFIRME",
  "TERMINE",
];

// Salon eFootball - infos PRIVÉES (2 joueurs + admin uniquement)
export interface SalonInfo {
  salonId: string; // ID salon/salle eFootball ex: "RAV-123" ou Konami ID
  code: string; // code/infos connexion (optionnel)
  instructions: string; // ex: "Rejoins en amical, cherche RavenCI"
  createdBy: string; // user.id du créateur
  createdAt: string; // ISO timestamp
  updatedAt?: string;
}

// Déclaration de résultat par un joueur
export interface ResultDeclaration {
  playerId: string;
  playerUsername: string;
  scoreA: number; // score joueur A
  scoreB: number; // score joueur B
  isVictory: boolean; // ce joueur déclare Victoire ?
  captureUrl: string | null; // URL ou base64 preview (max 5Mo)
  captureFileName?: string;
  declaredAt: string; // ISO
  ipHash?: string; // optionnel sécurité
}

export interface PlayerMatchProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  efootball_pseudo: string; // OBLIGATOIRE
  whatsapp_number: string; // OBLIGATOIRE - masqué partiellement public
  wave_number?: string;
  wins: number;
  losses: number;
  tournaments_played: number;
  tournaments_won: number;
  draws?: number;
  current_streak?: number;
  best_streak?: number;
  level?: number;
  role: UserRole;
  titles?: string[]; // palmarès ex: ["Champion x3", "Invaincu 7 matchs"]
}

export interface EfootballMatch {
  id: string;
  type: MatchType;
  status: MatchStatus;
  status_detail?: string;
  tournament_id?: string | null;
  tournament_title?: string | null;
  bracket_round?: string | null; // ex: QUARTS, DEMI, FINALE
  scheduled_at: string; // ISO
  player_a: PlayerMatchProfile;
  player_b: PlayerMatchProfile | null; // null si EN_ATTENTE_ADVERSAIRE
  // Salon privé eFootball
  salon_info: SalonInfo | null;
  player_a_connected: boolean;
  player_b_connected: boolean;
  match_started_at?: string | null;
  // Résultats
  result_declarations: ResultDeclaration[]; // 0, 1 ou 2
  final_score_a?: number | null;
  final_score_b?: number | null;
  winner_id?: string | null;
  loser_id?: string | null;
  is_contested: boolean;
  contested_reason?: string;
  validated_by_admin?: string | null;
  validated_at?: string | null;
  created_at: string;
  updated_at: string;
}

// Props utils
export interface CanViewSalon {
  canView: boolean;
  reason: "PLAYER_A" | "PLAYER_B" | "ADMIN" | "FORBIDDEN";
  isCreator: boolean;
}

export type DeclarationMatchResult =
  | { match: true; winnerId: string }
  | { match: false; reason: string }
  | { match: null; reason: "WAITING_SECOND" }; // en attente 2e déclaration

export const EFOOTBALL_RULES = {
  mode: "Match amical",
  duration: "6 minutes",
  prolongation: "Pas de prolongation (sauf finale)",
  pause: "1 pause max / joueur",
  deconnect: "Déconnexion avant 70e = replay, après = forfait si adversaire menait",
  fairplay: "Trash talk interdit, respect obligatoire. Triche = ban",
  preuve: "Capture écran résultat obligatoire (écran fin de match KONAMI)",
} as const;

export const WHATSAPP_MASK = (num: string): string => {
  if (!num || num.length < 8) return "•••• •• •• ••";
  const clean = num.replace(/\s/g, "");
  // 07 48 23 52 26 -> 07 48 ** ** 26
  if (clean.length >= 10) {
    return `${clean.slice(0,2)} ${clean.slice(2,4)} ** ** ${clean.slice(-2)}`;
  }
  return `${clean.slice(0,2)} ** ** ${clean.slice(-2)}`;
};

export const CANONICAL_SCORES_MATCH = (decA: ResultDeclaration, decB: ResultDeclaration): boolean => {
  // A dit 3-1 et B dit 1-3 ? On normalise: scoreA est toujours joueur A, scoreB joueur B
  return decA.scoreA === decB.scoreA && decA.scoreB === decB.scoreB;
};
