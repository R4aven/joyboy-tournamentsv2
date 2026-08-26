/**
 * E-TOURNOIS CI - Types TypeScript Supabase
 * Wave officiel: 01 51 42 99 18 | WhatsApp: 07 48 23 52 26
 * Update: CHAMPS OBLIGATOIRES INSCRIPTION - whatsapp_number, efootball_pseudo, wave_number
 */

export type TournamentStatus = 'OUVERT' | 'COMPLET' | 'EN_PREPARATION' | 'EN_COURS' | 'TERMINE' | 'ANNULE'
export type MatchStatus = 'A_VENIR' | 'EN_COURS' | 'RESULTAT_EN_ATTENTE' | 'TERMINE' | 'CONTESTE'
export type PaymentStatus = 'EN_ATTENTE' | 'VALIDE' | 'REFUSE'
export type ChallengeStatus = 'EN_ATTENTE' | 'ACCEPTE' | 'REFUSE' | 'EN_COURS' | 'TERMINE'
export type UserRole = 'JOUEUR' | 'ADMIN' | 'MODERATEUR'
export type PayoutStatus = 'EN_ATTENTE' | 'VALIDE' | 'REFUSE' | 'EN_COURS'
export type NotificationType = 
  | 'TOURNOI_OUVERT' | 'TOURNOI_COMPLET' | 'TOURNOI_DEMARRE' | 'TOURNOI_TERMINE'
  | 'MATCH_A_VENIR' | 'MATCH_RESULTAT' | 'MATCH_CONTESTE'
  | 'DEFI_RECU' | 'DEFI_ACCEPTE' | 'DEFI_REFUSE' | 'DEFI_TERMINE'
  | 'PAIEMENT_RECU' | 'PAIEMENT_VALIDE' | 'PAIEMENT_REFUSE'
  | 'SUCCES_DEBLOQUE' | 'SYSTEME' | 'ADMIN'

export type AchievementCategory = 'DEBUTANT' | 'COMPETITEUR' | 'VETERAN' | 'LEGENDE' | 'SPECIAL' | 'DEFI' | 'SOCIAL'
export type AchievementRarity = 'COMMUN' | 'RARE' | 'EPIQUE' | 'LEGENDAIRE'
export type TournamentFormat = 'BRACKET_10' | 'ELIMINATION_DIRECTE' | 'DOUBLE_ELIMINATION' | 'ROND'
export type TournamentPlayerStatus = 'INSCRIT' | 'ELIMINE' | 'QUALIFIE' | 'VAINQUEUR' | 'FORFAIT' | 'EN_ATTENTE_PAIEMENT'
export type AdminActionType = 'VALIDATE_PAYMENT' | 'REFUSE_PAYMENT' | 'CREATE_TOURNAMENT' | 'UPDATE_TOURNAMENT' | 'CANCEL_TOURNAMENT' | 'BAN_USER' | 'UNBAN_USER' | 'RESOLVE_MATCH' | 'VALIDATE_PAYOUT' | 'CREATE_ACHIEVEMENT' | 'DELETE_MATCH_RESULT' | 'UPDATE_CHALLENGE' | 'OTHER'

export interface Profile {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  phone_wave: string | null
  // CHAMPS OBLIGATOIRES INSCRIPTION
  whatsapp_number: string | null
  efootball_pseudo: string | null
  wave_number: string | null
  role: UserRole
  wins: number
  losses: number
  draws: number
  tournaments_played: number
  tournaments_won: number
  challenges_played: number
  challenges_won: number
  total_earnings: number
  current_streak: number
  best_streak: number
  level: number
  total_xp: number
  favorite_game: string | null
  platform: string | null
  game_id: string | null
  is_banned: boolean
  banned_reason: string | null
  banned_until: string | null
  created_at: string
  updated_at: string
  last_seen_at: string | null
}

export interface Tournament {
  id: string
  title: string
  description: string
  game: string
  format: TournamentFormat
  max_players: number
  entry_fee: number
  wave_number: string
  status: TournamentStatus
  rules: string
  start_date: string
  end_date: string | null
  winner_id: string | null
  runner_up_id: string | null
  third_place_id: string | null
  created_by: string | null
  bracket_data: any
  prize_distribution: any
  is_featured: boolean
  cover_image_url: string | null
  stream_url: string | null
  location: string | null
  created_at: string
  updated_at: string
}

export interface TournamentPlayer {
  id: string
  tournament_id: string
  player_id: string
  seed: number | null
  bracket_position: number | null
  status: TournamentPlayerStatus
  is_paid: boolean
  payment_id: string | null
  joined_at: string
  created_at: string
  player?: Profile
  tournament?: Tournament
}

export interface Match {
  id: string
  tournament_id: string | null
  challenge_id: string | null
  round_number: number
  round_name: string
  match_number: number
  player1_id: string | null
  player2_id: string | null
  winner_id: string | null
  loser_id: string | null
  status: MatchStatus
  score_player1: number | null
  score_player2: number | null
  next_match_id: string | null
  next_match_slot: 'player1' | 'player2' | null
  prev_match1_id: string | null
  prev_match2_id: string | null
  scheduled_at: string | null
  started_at: string | null
  finished_at: string | null
  is_contested: boolean
  contested_by: string | null
  contest_reason: string | null
  resolved_by: string | null
  created_at: string
  updated_at: string
  player1?: Profile | null
  player2?: Profile | null
  winner?: Profile | null
  tournament?: Tournament | null
}

export interface MatchResult {
  id: string
  match_id: string
  submitted_by: string
  score_player1: number
  score_player2: number
  winner_id: string
  proof_urls: string[]
  notes: string | null
  is_confirmed: boolean
  confirmed_by: string | null
  is_conflict: boolean
  created_at: string
}

export interface Challenge {
  id: string
  challenger_id: string
  opponent_id: string | null
  game: string
  status: ChallengeStatus
  stake: number
  wave_number: string
  winner_id: string | null
  loser_id: string | null
  match_id: string | null
  message: string | null
  response_message: string | null
  is_ranked: boolean
  is_open: boolean
  expires_at: string
  accepted_at: string | null
  started_at: string | null
  finished_at: string | null
  validated_by_admin: boolean
  created_at: string
  updated_at: string
  challenger?: Profile
  opponent?: Profile | null
}

export interface Payment {
  id: string
  user_id: string
  tournament_id: string | null
  challenge_id: string | null
  amount: number
  method: 'WAVE'
  wave_number: string
  phone_sender: string
  transaction_id: string | null
  status: PaymentStatus
  validated_by: string | null
  validated_at: string | null
  refusal_reason: string | null
  created_at: string
  updated_at: string
}

export interface PaymentProof {
  id: string
  payment_id: string
  file_url: string
  file_type: 'image' | 'pdf'
  file_size: number | null
  uploaded_by: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  link: string | null
  is_read: boolean
  related_id: string | null
  related_type: 'tournament' | 'match' | 'challenge' | 'payment' | 'achievement' | 'payout' | null
  metadata: any
  created_at: string
}

export interface NotificationPreferences {
  id: string
  user_id: string
  in_app_enabled: boolean
  tournament_notifications: boolean
  match_notifications: boolean
  challenge_notifications: boolean
  payment_notifications: boolean
  achievement_notifications: boolean
  admin_notifications: boolean
  marketing_notifications: boolean
  created_at: string
  updated_at: string
}

export interface Achievement {
  id: string
  code: string
  name: string
  description: string
  icon: string
  category: AchievementCategory
  rarity: AchievementRarity
  condition_type: 'tournaments_played' | 'tournaments_won' | 'wins' | 'challenges_won' | 'streak' | 'earnings' | 'first_win' | 'participation' | 'level'
  condition_value: number
  xp_reward: number
  is_hidden: boolean
  created_at: string
}

export interface PlayerAchievement {
  id: string
  player_id: string
  achievement_id: string
  progress: number
  is_unlocked: boolean
  unlocked_at: string | null
  is_seen: boolean
  created_at: string
  achievement?: Achievement
}

export interface Payout {
  id: string
  winner_id: string
  tournament_id: string | null
  challenge_id: string | null
  amount: number
  method: 'WAVE'
  destination_phone: string
  status: PayoutStatus
  transaction_id: string | null
  proof_url: string | null
  requested_at: string
  processed_at: string | null
  processed_by: string | null
  notes: string | null
  created_at: string
  updated_at: string
  winner?: Profile
}

export interface AdminAction {
  id: string
  admin_id: string
  action_type: AdminActionType
  target_type: 'payment' | 'tournament' | 'user' | 'match' | 'payout' | 'achievement' | 'challenge' | 'notification' | 'other'
  target_id: string | null
  description: string
  metadata: any
  ip_address: string | null
  created_at: string
}

export interface PlayerStatsView {
  id: string
  username: string
  display_name: string
  wins: number
  losses: number
  win_rate: number
  tournaments_won: number
  tournaments_played: number
  challenges_won: number
  current_streak: number
  best_streak: number
  total_earnings: number
  level: number
  achievements_unlocked: number
}

// Vue admin pour contacts obligatoires
export interface UserWithContactsView {
  id: string
  username: string
  display_name: string
  whatsapp_number: string | null
  efootball_pseudo: string | null
  wave_number: string | null
  phone_wave: string | null
  total_earnings: number
  role: UserRole
  is_banned: boolean
  created_at: string
  contacts_complete: boolean
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      tournaments: { Row: Tournament; Insert: Partial<Tournament>; Update: Partial<Tournament> }
      tournament_players: { Row: TournamentPlayer; Insert: Partial<TournamentPlayer>; Update: Partial<TournamentPlayer> }
      matches: { Row: Match; Insert: Partial<Match>; Update: Partial<Match> }
      match_results: { Row: MatchResult; Insert: Partial<MatchResult>; Update: Partial<MatchResult> }
      challenges: { Row: Challenge; Insert: Partial<Challenge>; Update: Partial<Challenge> }
      payments: { Row: Payment; Insert: Partial<Payment>; Update: Partial<Payment> }
      payment_proofs: { Row: PaymentProof; Insert: Partial<PaymentProof>; Update: Partial<PaymentProof> }
      notifications: { Row: Notification; Insert: Partial<Notification>; Update: Partial<Notification> }
      notification_preferences: { Row: NotificationPreferences; Insert: Partial<NotificationPreferences>; Update: Partial<NotificationPreferences> }
      achievements: { Row: Achievement; Insert: Partial<Achievement>; Update: Partial<Achievement> }
      player_achievements: { Row: PlayerAchievement; Insert: Partial<PlayerAchievement>; Update: Partial<PlayerAchievement> }
      payouts: { Row: Payout; Insert: Partial<Payout>; Update: Partial<Payout> }
      admin_actions: { Row: AdminAction; Insert: Partial<AdminAction>; Update: Partial<AdminAction> }
    }
    Views: { 
      v_player_stats: { Row: PlayerStatsView }
      v_users_with_contacts: { Row: UserWithContactsView }
    }
    Enums: {
      tournament_status: TournamentStatus
      match_status: MatchStatus
      payment_status: PaymentStatus
      challenge_status: ChallengeStatus
      user_role: UserRole
      payout_status: PayoutStatus
      notification_type: NotificationType
    }
    Functions: {
      generate_bracket_10_joueurs: { Args: { p_tournament_id: string }; Returns: any }
      is_admin: { Args: Record<string, never>; Returns: boolean }
      is_staff: { Args: Record<string, never>; Returns: boolean }
      check_and_unlock_achievements: { Args: { p_player_id: string }; Returns: void }
    }
  }
}

export const isTournamentFull = (t: Tournament, count: number) => count >= t.max_players
export const canJoinTournament = (t: Tournament, count: number) => t.status === 'OUVERT' && count < t.max_players
export const isMatchPlayable = (m: Match) => m.player1_id && m.player2_id && m.status === 'A_VENIR'
