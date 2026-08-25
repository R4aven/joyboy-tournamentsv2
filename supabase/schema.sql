
-- ============================================================================
-- 🇨🇮 JOYBOY TOURNAMENTS - SCHEMA COMPLET SUPABASE
-- ============================================================================
-- Stack: Postgres + Supabase + RLS stricte
-- Identité: 100% Ivoirienne, Paiement Wave unique: 01 51 42 99 18
-- WhatsApp support: 07 48 23 52 26
-- Thème: Dark premium #08080B, violet #7C3AED, cyan #06B6D4
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUMS
DO $$ BEGIN CREATE TYPE tournament_status AS ENUM ('OUVERT','COMPLET','EN_PREPARATION','EN_COURS','TERMINE','ANNULE'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE match_status AS ENUM ('A_VENIR','EN_COURS','RESULTAT_EN_ATTENTE','TERMINE','CONTESTE'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('EN_ATTENTE','VALIDE','REFUSE'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE challenge_status AS ENUM ('EN_ATTENTE','ACCEPTE','REFUSE','EN_COURS','TERMINE'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('JOUEUR','ADMIN','MODERATEUR'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE payout_status AS ENUM ('EN_ATTENTE','VALIDE','REFUSE','EN_COURS'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE notification_type AS ENUM ('TOURNOI_OUVERT','TOURNOI_COMPLET','TOURNOI_DEMARRE','TOURNOI_TERMINE','MATCH_A_VENIR','MATCH_RESULTAT','MATCH_CONTESTE','DEFI_RECU','DEFI_ACCEPTE','DEFI_REFUSE','DEFI_TERMINE','PAIEMENT_RECU','PAIEMENT_VALIDE','PAIEMENT_REFUSE','SUCCES_DEBLOQUE','SYSTEME','ADMIN'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- FONCTIONS UTILITAIRES
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$ BEGIN RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'); END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
CREATE OR REPLACE FUNCTION public.is_staff() RETURNS BOOLEAN AS $$ BEGIN RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN','MODERATEUR')); END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- TABLE: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL CHECK (char_length(username) >= 3 AND char_length(username) <= 20),
  display_name TEXT NOT NULL CHECK (char_length(display_name) >= 2),
  avatar_url TEXT,
  bio TEXT CHECK (char_length(bio) <= 200),
  phone_wave TEXT CHECK (phone_wave ~ '^[0-9 ]+$'),
  role user_role NOT NULL DEFAULT 'JOUEUR',
  wins INT NOT NULL DEFAULT 0,
  losses INT NOT NULL DEFAULT 0,
  draws INT NOT NULL DEFAULT 0,
  tournaments_played INT NOT NULL DEFAULT 0,
  tournaments_won INT NOT NULL DEFAULT 0,
  challenges_played INT NOT NULL DEFAULT 0,
  challenges_won INT NOT NULL DEFAULT 0,
  total_earnings INT NOT NULL DEFAULT 0,
  current_streak INT NOT NULL DEFAULT 0,
  best_streak INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  total_xp INT NOT NULL DEFAULT 0,
  favorite_game TEXT,
  platform TEXT,
  game_id TEXT,
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  banned_reason TEXT,
  banned_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN INSERT INTO public.profiles (id, username, display_name, avatar_url) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', 'joueur_' || substr(NEW.id::text,1,6)), COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', 'Nouveau Champion'), NEW.raw_user_meta_data->>'avatar_url') ON CONFLICT (id) DO NOTHING; INSERT INTO public.notification_preferences (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING; RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- TABLE: tournaments
CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL CHECK (char_length(title) >= 5),
  description TEXT NOT NULL,
  game TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'BRACKET_10' CHECK (format IN ('BRACKET_10','ELIMINATION_DIRECTE','DOUBLE_ELIMINATION','ROND')),
  max_players INT NOT NULL DEFAULT 10 CHECK (max_players IN (10, 8, 16, 32)),
  entry_fee INT NOT NULL DEFAULT 1000 CHECK (entry_fee >= 0),
  wave_number TEXT NOT NULL DEFAULT '01 51 42 99 18' CHECK (wave_number = '01 51 42 99 18'),
  status tournament_status NOT NULL DEFAULT 'OUVERT',
  rules TEXT NOT NULL DEFAULT 'Règles officielles Joyboy: Fair-play obligatoire. Connexion stable exigée. Tout match non joué dans les délais = forfait. Décisions admin finales. Zéro triche.',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  winner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  runner_up_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  third_place_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  bracket_data JSONB DEFAULT '{}'::jsonb,
  prize_distribution JSONB DEFAULT '{"1": 70, "2": 20, "3": 10}'::jsonb,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  cover_image_url TEXT,
  stream_url TEXT,
  location TEXT DEFAULT 'En ligne - Côte d''Ivoire',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_dates CHECK (end_date IS NULL OR end_date > start_date)
);
DROP TRIGGER IF EXISTS set_updated_at_tournaments ON public.tournaments;
CREATE TRIGGER set_updated_at_tournaments BEFORE UPDATE ON public.tournaments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_game ON public.tournaments(game);

-- TABLE: tournament_players
CREATE TABLE IF NOT EXISTS public.tournament_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seed INT CHECK (seed >= 1 AND seed <= 32),
  bracket_position INT CHECK (bracket_position >= 1 AND bracket_position <= 32),
  status TEXT NOT NULL DEFAULT 'INSCRIT' CHECK (status IN ('INSCRIT','ELIMINE','QUALIFIE','VAINQUEUR','FORFAIT','EN_ATTENTE_PAIEMENT')),
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  payment_id UUID,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tournament_id, player_id),
  UNIQUE(tournament_id, bracket_position)
);
CREATE INDEX IF NOT EXISTS idx_tournament_players_tournament ON public.tournament_players(tournament_id);

-- TABLE: matches
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  challenge_id UUID,
  round_number INT NOT NULL CHECK (round_number >= 1),
  round_name TEXT NOT NULL,
  match_number INT NOT NULL,
  player1_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  player2_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  winner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  loser_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status match_status NOT NULL DEFAULT 'A_VENIR',
  score_player1 INT CHECK (score_player1 >= 0),
  score_player2 INT CHECK (score_player2 >= 0),
  next_match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  next_match_slot TEXT CHECK (next_match_slot IN ('player1','player2')),
  prev_match1_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  prev_match2_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  is_contested BOOLEAN NOT NULL DEFAULT FALSE,
  contested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  contest_reason TEXT,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_players_different CHECK (player1_id IS NULL OR player2_id IS NULL OR player1_id != player2_id)
);
DROP TRIGGER IF EXISTS set_updated_at_matches ON public.matches;
CREATE TRIGGER set_updated_at_matches BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON public.matches(tournament_id);

-- TABLE: match_results
CREATE TABLE IF NOT EXISTS public.match_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score_player1 INT NOT NULL CHECK (score_player1 >= 0),
  score_player2 INT NOT NULL CHECK (score_player2 >= 0),
  winner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  proof_urls TEXT[] DEFAULT '{}',
  notes TEXT,
  is_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  confirmed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_conflict BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE: challenges (1v1 - 500F)
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenger_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  opponent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  game TEXT NOT NULL,
  status challenge_status NOT NULL DEFAULT 'EN_ATTENTE',
  stake INT NOT NULL DEFAULT 500 CHECK (stake = 500),
  wave_number TEXT NOT NULL DEFAULT '01 51 42 99 18',
  winner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  loser_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  message TEXT,
  response_message TEXT,
  is_ranked BOOLEAN NOT NULL DEFAULT TRUE,
  is_open BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  accepted_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  validated_by_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_challenger_not_opponent CHECK (opponent_id IS NULL OR challenger_id != opponent_id)
);
DROP TRIGGER IF EXISTS set_updated_at_challenges ON public.challenges;
CREATE TRIGGER set_updated_at_challenges BEFORE UPDATE ON public.challenges FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS fk_matches_challenge;
ALTER TABLE public.matches ADD CONSTRAINT fk_matches_challenge FOREIGN KEY (challenge_id) REFERENCES public.challenges(id) ON DELETE CASCADE;

-- TABLE: payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE SET NULL,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE SET NULL,
  amount INT NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL DEFAULT 'WAVE' CHECK (method = 'WAVE'),
  wave_number TEXT NOT NULL DEFAULT '01 51 42 99 18' CHECK (wave_number = '01 51 42 99 18'),
  phone_sender TEXT NOT NULL,
  transaction_id TEXT,
  status payment_status NOT NULL DEFAULT 'EN_ATTENTE',
  validated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  validated_at TIMESTAMPTZ,
  refusal_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_target CHECK (tournament_id IS NOT NULL OR challenge_id IS NOT NULL)
);
DROP TRIGGER IF EXISTS set_updated_at_payments ON public.payments;
CREATE TRIGGER set_updated_at_payments BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- TABLE: payment_proofs
CREATE TABLE IF NOT EXISTS public.payment_proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'image' CHECK (file_type IN ('image','pdf')),
  file_size INT,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL DEFAULT 'SYSTEME',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  related_id UUID,
  related_type TEXT CHECK (related_type IN ('tournament','match','challenge','payment','achievement','payout')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);

-- TABLE: notification_preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  tournament_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  match_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  challenge_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  payment_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  achievement_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  admin_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  marketing_notifications BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS set_updated_at_notif_prefs ON public.notification_preferences;
CREATE TRIGGER set_updated_at_notif_prefs BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- TABLE: achievements
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'trophy',
  category TEXT NOT NULL CHECK (category IN ('DEBUTANT','COMPETITEUR','VETERAN','LEGENDE','SPECIAL','DEFI','SOCIAL')) DEFAULT 'DEBUTANT',
  rarity TEXT NOT NULL CHECK (rarity IN ('COMMUN','RARE','EPIQUE','LEGENDAIRE')) DEFAULT 'COMMUN',
  condition_type TEXT NOT NULL CHECK (condition_type IN ('tournaments_played','tournaments_won','wins','challenges_won','streak','earnings','first_win','participation','level')),
  condition_value INT NOT NULL DEFAULT 1,
  xp_reward INT NOT NULL DEFAULT 100,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO public.achievements (code, name, description, icon, category, rarity, condition_type, condition_value, xp_reward) VALUES
('BIENVENUE', 'Akwaba Champion !', 'Bienvenue dans l''arene Joyboy, le terrain des vrais boss 225', 'door-open', 'DEBUTANT', 'COMMUN', 'participation', 1, 50),
('PREMIER_MATCH', 'Premier sang', 'Joue ton premier match officiel', 'swords', 'DEBUTANT', 'COMMUN', 'wins', 0, 100),
('PREMIERE_VICTOIRE', 'Premiere victoire', 'Gagne ton premier match, tu es lance !', 'trophy', 'DEBUTANT', 'COMMUN', 'wins', 1, 150),
('PREMIER_TOURNOI', 'Bapteme de feu', 'Participe a ton premier tournoi', 'flame', 'DEBUTANT', 'RARE', 'tournaments_played', 1, 200),
('5_VICTOIRES', 'En feu', '5 victoires au compteur, chaud comme garba chaud !', 'flame', 'COMPETITEUR', 'RARE', 'wins', 5, 300),
('10_VICTOIRES', 'Dangereux', '10 victoires - On commence a parler de toi a Yopougon', 'zap', 'COMPETITEUR', 'RARE', 'wins', 10, 500),
('CHAMPION_TOURNOI', 'Champion 225', 'Remporte un tournoi Joyboy', 'crown', 'VETERAN', 'EPIQUE', 'tournaments_won', 1, 1000),
('STREAK_3', 'En serie', '3 victoires d''affilee', 'trending-up', 'COMPETITEUR', 'RARE', 'streak', 3, 400),
('STREAK_5', 'Intouchable', '5 victoires d''affilee', 'flame', 'VETERAN', 'EPIQUE', 'streak', 5, 800),
('STREAK_10', 'Legende vivante', '10 victoires d''affilee - Tu es une legende a Abidjan', 'star', 'LEGENDE', 'LEGENDAIRE', 'streak', 10, 2000),
('DEFI_1V1_5', 'Duelliste', 'Gagne 5 duels 1v1 (500F)', 'swords', 'DEFI', 'RARE', 'challenges_won', 5, 350),
('DEFI_1V1_20', 'Maitre du 1v1', '20 duels 1v1 gagnes', 'shield', 'DEFI', 'EPIQUE', 'challenges_won', 20, 1200),
('CAGNOTTE_10K', 'Petit jeton', '10 000 FCFA de gains cumules', 'banknote', 'COMPETITEUR', 'RARE', 'earnings', 10000, 300),
('CAGNOTTE_50K', 'Boss du quartier', '50 000 FCFA de gains', 'wallet', 'VETERAN', 'EPIQUE', 'earnings', 50000, 1000)
ON CONFLICT (code) DO NOTHING;

-- TABLE: player_achievements
CREATE TABLE IF NOT EXISTS public.player_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  progress INT NOT NULL DEFAULT 0,
  is_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  unlocked_at TIMESTAMPTZ,
  is_seen BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(player_id, achievement_id)
);

-- TABLE: payouts
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  winner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE SET NULL,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE SET NULL,
  amount INT NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL DEFAULT 'WAVE' CHECK (method = 'WAVE'),
  destination_phone TEXT NOT NULL,
  status payout_status NOT NULL DEFAULT 'EN_ATTENTE',
  transaction_id TEXT,
  proof_url TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS set_updated_at_payouts ON public.payouts;
CREATE TRIGGER set_updated_at_payouts BEFORE UPDATE ON public.payouts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- TABLE: admin_actions
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('VALIDATE_PAYMENT','REFUSE_PAYMENT','CREATE_TOURNAMENT','UPDATE_TOURNAMENT','CANCEL_TOURNAMENT','BAN_USER','UNBAN_USER','RESOLVE_MATCH','VALIDATE_PAYOUT','CREATE_ACHIEVEMENT','DELETE_MATCH_RESULT','UPDATE_CHALLENGE','OTHER')),
  target_type TEXT NOT NULL CHECK (target_type IN ('payment','tournament','user','match','payout','achievement','challenge','notification','other')),
  target_id UUID,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================
-- FONCTION BRACKET 10 JOUEURS
-- ================================
CREATE OR REPLACE FUNCTION public.generate_bracket_10_joueurs(p_tournament_id UUID) RETURNS JSONB AS $$
DECLARE
  v_players UUID[];
  v_count INT;
  v_tournament_status tournament_status;
  v_barrage1_id UUID; v_barrage2_id UUID;
  v_quart1_id UUID; v_quart2_id UUID; v_quart3_id UUID; v_quart4_id UUID;
  v_demi1_id UUID; v_demi2_id UUID; v_finale_id UUID;
  v_result JSONB;
BEGIN
  SELECT status INTO v_tournament_status FROM public.tournaments WHERE id = p_tournament_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tournoi % introuvable', p_tournament_id; END IF;
  IF v_tournament_status NOT IN ('COMPLET','EN_PREPARATION') THEN RAISE EXCEPTION 'Tournoi doit etre COMPLET ou EN_PREPARATION. Actuel: %', v_tournament_status; END IF;
  SELECT ARRAY_AGG(player_id ORDER BY seed NULLS LAST, joined_at ASC) INTO v_players FROM public.tournament_players WHERE tournament_id = p_tournament_id;
  v_count := array_length(v_players, 1);
  IF v_count IS NULL OR v_count != 10 THEN RAISE EXCEPTION 'Bracket 10 joueurs: exactement 10 participants requis. Actuel: %', COALESCE(v_count,0); END IF;
  DELETE FROM public.matches WHERE tournament_id = p_tournament_id;
  -- BARRAGES
  INSERT INTO public.matches (tournament_id, round_number, round_name, match_number, player1_id, player2_id, status) VALUES (p_tournament_id, 1, 'BARRAGE', 1, v_players[7], v_players[10], 'A_VENIR') RETURNING id INTO v_barrage1_id;
  INSERT INTO public.matches (tournament_id, round_number, round_name, match_number, player1_id, player2_id, status) VALUES (p_tournament_id, 1, 'BARRAGE', 2, v_players[8], v_players[9], 'A_VENIR') RETURNING id INTO v_barrage2_id;
  -- QUARTS
  INSERT INTO public.matches (tournament_id, round_number, round_name, match_number, player1_id, player2_id, prev_match1_id, status) VALUES (p_tournament_id, 2, 'QUART_FINALE', 1, v_players[1], NULL, v_barrage1_id, 'A_VENIR') RETURNING id INTO v_quart1_id;
  INSERT INTO public.matches (tournament_id, round_number, round_name, match_number, player1_id, player2_id, status) VALUES (p_tournament_id, 2, 'QUART_FINALE', 2, v_players[4], v_players[5], 'A_VENIR') RETURNING id INTO v_quart2_id;
  INSERT INTO public.matches (tournament_id, round_number, round_name, match_number, player1_id, player2_id, status) VALUES (p_tournament_id, 2, 'QUART_FINALE', 3, v_players[3], v_players[6], 'A_VENIR') RETURNING id INTO v_quart3_id;
  INSERT INTO public.matches (tournament_id, round_number, round_name, match_number, player1_id, player2_id, prev_match1_id, status) VALUES (p_tournament_id, 2, 'QUART_FINALE', 4, v_players[2], NULL, v_barrage2_id, 'A_VENIR') RETURNING id INTO v_quart4_id;
  UPDATE public.matches SET next_match_id = v_quart1_id, next_match_slot = 'player2' WHERE id = v_barrage1_id;
  UPDATE public.matches SET next_match_id = v_quart4_id, next_match_slot = 'player2' WHERE id = v_barrage2_id;
  -- DEMIS
  INSERT INTO public.matches (tournament_id, round_number, round_name, match_number, prev_match1_id, prev_match2_id, status) VALUES (p_tournament_id, 3, 'DEMI_FINALE', 1, v_quart1_id, v_quart2_id, 'A_VENIR') RETURNING id INTO v_demi1_id;
  INSERT INTO public.matches (tournament_id, round_number, round_name, match_number, prev_match1_id, prev_match2_id, status) VALUES (p_tournament_id, 3, 'DEMI_FINALE', 2, v_quart3_id, v_quart4_id, 'A_VENIR') RETURNING id INTO v_demi2_id;
  UPDATE public.matches SET next_match_id = v_demi1_id, next_match_slot = 'player1' WHERE id = v_quart1_id;
  UPDATE public.matches SET next_match_id = v_demi1_id, next_match_slot = 'player2' WHERE id = v_quart2_id;
  UPDATE public.matches SET next_match_id = v_demi2_id, next_match_slot = 'player1' WHERE id = v_quart3_id;
  UPDATE public.matches SET next_match_id = v_demi2_id, next_match_slot = 'player2' WHERE id = v_quart4_id;
  -- FINALE
  INSERT INTO public.matches (tournament_id, round_number, round_name, match_number, prev_match1_id, prev_match2_id, status) VALUES (p_tournament_id, 4, 'FINALE', 1, v_demi1_id, v_demi2_id, 'A_VENIR') RETURNING id INTO v_finale_id;
  UPDATE public.matches SET next_match_id = v_finale_id, next_match_slot = 'player1' WHERE id = v_demi1_id;
  UPDATE public.matches SET next_match_id = v_finale_id, next_match_slot = 'player2' WHERE id = v_demi2_id;
  UPDATE public.tournaments SET status = 'EN_PREPARATION', bracket_data = jsonb_build_object('generated_at', NOW(), 'format', 'BRACKET_10', 'total_matches', 9, 'barrages', 2, 'quarts', 4, 'demis', 2, 'finale', 1, 'players', v_players) WHERE id = p_tournament_id;
  v_result := jsonb_build_object('success', true, 'tournament_id', p_tournament_id, 'matches_created', 9, 'barrage1', v_barrage1_id, 'barrage2', v_barrage2_id, 'quarts', jsonb_build_array(v_quart1_id, v_quart2_id, v_quart3_id, v_quart4_id), 'demis', jsonb_build_array(v_demi1_id, v_demi2_id), 'finale', v_finale_id);
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ================================
-- FONCTION MAJ STATS APRES VICTOIRE
-- ================================
CREATE OR REPLACE FUNCTION public.maj_stats_et_palmares_apres_victoire() RETURNS TRIGGER AS $$
DECLARE v_winner_id UUID; v_loser_id UUID; v_tournament_id UUID; v_challenge_id UUID;
BEGIN
  IF (TG_OP = 'UPDATE' AND NEW.status = 'TERMINE' AND (OLD.status IS DISTINCT FROM 'TERMINE')) OR (TG_OP = 'UPDATE' AND NEW.winner_id IS NOT NULL AND OLD.winner_id IS DISTINCT FROM NEW.winner_id) THEN
    v_winner_id := NEW.winner_id; v_loser_id := NEW.loser_id; v_tournament_id := NEW.tournament_id; v_challenge_id := NEW.challenge_id;
    IF v_winner_id IS NULL THEN RETURN NEW; END IF;
    IF v_loser_id IS NULL THEN IF NEW.player1_id = v_winner_id THEN v_loser_id := NEW.player2_id; ELSE v_loser_id := NEW.player1_id; END IF; NEW.loser_id := v_loser_id; END IF;
    IF v_tournament_id IS NOT NULL THEN UPDATE public.profiles SET wins = wins + 1, current_streak = current_streak + 1, best_streak = GREATEST(best_streak, current_streak + 1), total_xp = total_xp + 50, level = GREATEST(1, (total_xp + 50) / 1000 + 1) WHERE id = v_winner_id;
    ELSE UPDATE public.profiles SET wins = wins + 1, challenges_won = challenges_won + 1, challenges_played = challenges_played + 1, current_streak = current_streak + 1, best_streak = GREATEST(best_streak, current_streak + 1), total_xp = total_xp + 30, level = GREATEST(1, (total_xp + 30) / 1000 + 1) WHERE id = v_winner_id; END IF;
    IF v_loser_id IS NOT NULL THEN IF v_tournament_id IS NOT NULL THEN UPDATE public.profiles SET losses = losses + 1, current_streak = 0, total_xp = total_xp + 10 WHERE id = v_loser_id; ELSE UPDATE public.profiles SET losses = losses + 1, challenges_played = challenges_played + 1, current_streak = 0, total_xp = total_xp + 10 WHERE id = v_loser_id; END IF; END IF;
    -- Propagation bracket
    IF NEW.next_match_id IS NOT NULL THEN
      IF NEW.next_match_slot = 'player1' THEN UPDATE public.matches SET player1_id = v_winner_id WHERE id = NEW.next_match_id AND player1_id IS NULL;
      ELSE UPDATE public.matches SET player2_id = v_winner_id WHERE id = NEW.next_match_id AND player2_id IS NULL; END IF;
      UPDATE public.matches SET player1_id = COALESCE(player1_id, v_winner_id) WHERE id = NEW.next_match_id AND player1_id IS NULL;
      UPDATE public.matches SET player2_id = COALESCE(player2_id, v_winner_id) WHERE id = NEW.next_match_id AND player2_id IS NULL AND player1_id IS DISTINCT FROM v_winner_id;
      UPDATE public.matches SET status = 'A_VENIR', scheduled_at = COALESCE(scheduled_at, NOW() + INTERVAL '30 minutes') WHERE id = NEW.next_match_id AND player1_id IS NOT NULL AND player2_id IS NOT NULL;
    END IF;
    -- Finale
    IF NEW.round_name = 'FINALE' AND v_tournament_id IS NOT NULL THEN
      UPDATE public.tournaments SET winner_id = v_winner_id, runner_up_id = v_loser_id, status = 'TERMINE', end_date = NOW() WHERE id = v_tournament_id;
      UPDATE public.profiles SET tournaments_won = tournaments_won + 1, tournaments_played = tournaments_played + 1, total_xp = total_xp + 500 WHERE id = v_winner_id;
      UPDATE public.profiles SET tournaments_played = tournaments_played + 1 WHERE id IN (SELECT player_id FROM public.tournament_players WHERE tournament_id = v_tournament_id AND player_id != v_winner_id);
      UPDATE public.tournament_players SET status = 'VAINQUEUR' WHERE tournament_id = v_tournament_id AND player_id = v_winner_id;
      UPDATE public.tournament_players SET status = 'ELIMINE' WHERE tournament_id = v_tournament_id AND player_id != v_winner_id AND status != 'FORFAIT';
      INSERT INTO public.notifications (user_id, type, title, message, link, related_id, related_type) SELECT player_id, 'TOURNOI_TERMINE', 'Tournoi termine !', 'Champion: ' || (SELECT display_name FROM public.profiles WHERE id = v_winner_id), '/tournois/' || v_tournament_id::text, v_tournament_id, 'tournament' FROM public.tournament_players WHERE tournament_id = v_tournament_id;
    END IF;
    IF v_challenge_id IS NOT NULL THEN UPDATE public.challenges SET winner_id = v_winner_id, loser_id = v_loser_id, status = 'TERMINE', finished_at = NOW() WHERE id = v_challenge_id; END IF;
    INSERT INTO public.notifications (user_id, type, title, message, link, related_id, related_type) VALUES (v_winner_id, 'MATCH_RESULTAT', 'Victoire ! 🔥', 'Bravo champion !', CASE WHEN v_tournament_id IS NOT NULL THEN '/tournois/' || v_tournament_id::text ELSE '/defis/' || COALESCE(v_challenge_id::text,'') END, NEW.id, 'match') ON CONFLICT DO NOTHING;
    PERFORM public.check_and_unlock_achievements(v_winner_id);
    IF v_loser_id IS NOT NULL THEN PERFORM public.check_and_unlock_achievements(v_loser_id); END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
DROP TRIGGER IF EXISTS trg_maj_stats_apres_victoire ON public.matches;
CREATE TRIGGER trg_maj_stats_apres_victoire AFTER UPDATE OF status, winner_id ON public.matches FOR EACH ROW EXECUTE FUNCTION public.maj_stats_et_palmares_apres_victoire();

-- FONCTION achievements
CREATE OR REPLACE FUNCTION public.check_and_unlock_achievements(p_player_id UUID) RETURNS VOID AS $$
DECLARE v_profile RECORD; v_ach RECORD;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_player_id; IF NOT FOUND THEN RETURN; END IF;
  FOR v_ach IN SELECT * FROM public.achievements LOOP
    IF EXISTS (SELECT 1 FROM public.player_achievements WHERE player_id = p_player_id AND achievement_id = v_ach.id AND is_unlocked = TRUE) THEN CONTINUE; END IF;
    IF ((v_ach.condition_type = 'tournaments_played' AND v_profile.tournaments_played >= v_ach.condition_value) OR (v_ach.condition_type = 'tournaments_won' AND v_profile.tournaments_won >= v_ach.condition_value) OR (v_ach.condition_type = 'wins' AND v_profile.wins >= v_ach.condition_value) OR (v_ach.condition_type = 'challenges_won' AND v_profile.challenges_won >= v_ach.condition_value) OR (v_ach.condition_type = 'streak' AND v_profile.current_streak >= v_ach.condition_value) OR (v_ach.condition_type = 'earnings' AND v_profile.total_earnings >= v_ach.condition_value) OR (v_ach.condition_type = 'participation' AND (v_profile.tournaments_played + v_profile.challenges_played) >= v_ach.condition_value) OR (v_ach.condition_type = 'level' AND v_profile.level >= v_ach.condition_value)) THEN
      INSERT INTO public.player_achievements (player_id, achievement_id, is_unlocked, unlocked_at, progress) VALUES (p_player_id, v_ach.id, TRUE, NOW(), v_ach.condition_value) ON CONFLICT (player_id, achievement_id) DO UPDATE SET is_unlocked = TRUE, unlocked_at = NOW(), progress = v_ach.condition_value;
      UPDATE public.profiles SET total_xp = total_xp + v_ach.xp_reward WHERE id = p_player_id;
      INSERT INTO public.notifications (user_id, type, title, message, link, related_id, related_type, metadata) VALUES (p_player_id, 'SUCCES_DEBLOQUE', 'Succes debloque: ' || v_ach.name, v_ach.description, '/profil/' || p_player_id::text, v_ach.id, 'achievement', jsonb_build_object('rarity', v_ach.rarity, 'xp', v_ach.xp_reward));
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Payment validation
CREATE OR REPLACE FUNCTION public.handle_payment_validation() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'VALIDE' AND (OLD.status IS DISTINCT FROM 'VALIDE') THEN NEW.validated_at = NOW();
    IF NEW.tournament_id IS NOT NULL THEN UPDATE public.tournament_players SET is_paid = TRUE, status = 'INSCRIT' WHERE tournament_id = NEW.tournament_id AND player_id = NEW.user_id;
      UPDATE public.tournaments SET status = 'COMPLET' WHERE id = NEW.tournament_id AND status = 'OUVERT' AND (SELECT COUNT(*) FROM public.tournament_players WHERE tournament_id = NEW.tournament_id AND is_paid = TRUE) >= max_players;
      INSERT INTO public.notifications (user_id, type, title, message, link, related_id, related_type) VALUES (NEW.user_id, 'PAIEMENT_VALIDE', 'Paiement valide', 'Paiement Wave ' || NEW.amount || ' FCFA valide. Tu es inscrit !', '/tournois/' || NEW.tournament_id::text, NEW.id, 'payment');
    END IF;
    IF NEW.challenge_id IS NOT NULL THEN INSERT INTO public.notifications (user_id, type, title, message, link, related_id, related_type) VALUES (NEW.user_id, 'PAIEMENT_VALIDE', 'Paiement defi valide', 'Paiement 500F valide pour ton defi 1v1', '/defis/' || NEW.challenge_id::text, NEW.id, 'payment'); END IF;
  ELSIF NEW.status = 'REFUSE' THEN INSERT INTO public.notifications (user_id, type, title, message, link, related_id, related_type) VALUES (NEW.user_id, 'PAIEMENT_REFUSE', 'Paiement refuse', COALESCE(NEW.refusal_reason, 'Paiement refuse. Verifie ta capture Wave et contact WhatsApp 07 48 23 52 26'), '/support', NEW.id, 'payment'); END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
DROP TRIGGER IF EXISTS trg_payment_validation ON public.payments;
CREATE TRIGGER trg_payment_validation BEFORE UPDATE OF status ON public.payments FOR EACH ROW EXECUTE FUNCTION public.handle_payment_validation();

-- RLS ENABLE
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles; CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles; CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles; CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles; CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "tournaments_select_all" ON public.tournaments; CREATE POLICY "tournaments_select_all" ON public.tournaments FOR SELECT USING (true);
DROP POLICY IF EXISTS "tournaments_staff_insert" ON public.tournaments; CREATE POLICY "tournaments_staff_insert" ON public.tournaments FOR INSERT WITH CHECK (public.is_staff());
DROP POLICY IF EXISTS "tournaments_staff_update" ON public.tournaments; CREATE POLICY "tournaments_staff_update" ON public.tournaments FOR UPDATE USING (public.is_staff()) WITH CHECK (public.is_staff());
DROP POLICY IF EXISTS "tournaments_admin_delete" ON public.tournaments; CREATE POLICY "tournaments_admin_delete" ON public.tournaments FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "tp_select_all" ON public.tournament_players; CREATE POLICY "tp_select_all" ON public.tournament_players FOR SELECT USING (true);
DROP POLICY IF EXISTS "tp_insert_own" ON public.tournament_players; CREATE POLICY "tp_insert_own" ON public.tournament_players FOR INSERT WITH CHECK (player_id = auth.uid());
DROP POLICY IF EXISTS "tp_insert_staff" ON public.tournament_players; CREATE POLICY "tp_insert_staff" ON public.tournament_players FOR INSERT WITH CHECK (public.is_staff());
DROP POLICY IF EXISTS "tp_delete_own_or_staff" ON public.tournament_players; CREATE POLICY "tp_delete_own_or_staff" ON public.tournament_players FOR DELETE USING (player_id = auth.uid() OR public.is_staff());
DROP POLICY IF EXISTS "tp_update_own_or_staff" ON public.tournament_players; CREATE POLICY "tp_update_own_or_staff" ON public.tournament_players FOR UPDATE USING (player_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "matches_select_all" ON public.matches; CREATE POLICY "matches_select_all" ON public.matches FOR SELECT USING (true);
DROP POLICY IF EXISTS "matches_staff_all" ON public.matches; CREATE POLICY "matches_staff_all" ON public.matches FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());
DROP POLICY IF EXISTS "matches_player_contest" ON public.matches; CREATE POLICY "matches_player_contest" ON public.matches FOR UPDATE USING ((player1_id = auth.uid() OR player2_id = auth.uid())) WITH CHECK ((player1_id = auth.uid() OR player2_id = auth.uid()));

DROP POLICY IF EXISTS "mr_select_participant_or_staff" ON public.match_results; CREATE POLICY "mr_select_participant_or_staff" ON public.match_results FOR SELECT USING (public.is_staff() OR submitted_by = auth.uid() OR EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND (m.player1_id = auth.uid() OR m.player2_id = auth.uid())));
DROP POLICY IF EXISTS "mr_insert_participant" ON public.match_results; CREATE POLICY "mr_insert_participant" ON public.match_results FOR INSERT WITH CHECK (submitted_by = auth.uid() AND EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND (m.player1_id = auth.uid() OR m.player2_id = auth.uid())));
DROP POLICY IF EXISTS "mr_staff_all" ON public.match_results; CREATE POLICY "mr_staff_all" ON public.match_results FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "challenges_select" ON public.challenges; CREATE POLICY "challenges_select" ON public.challenges FOR SELECT USING (public.is_staff() OR challenger_id = auth.uid() OR opponent_id = auth.uid() OR is_open = true OR status IN ('EN_ATTENTE','ACCEPTE','EN_COURS','TERMINE'));
DROP POLICY IF EXISTS "challenges_insert_auth" ON public.challenges; CREATE POLICY "challenges_insert_auth" ON public.challenges FOR INSERT WITH CHECK (challenger_id = auth.uid());
DROP POLICY IF EXISTS "challenges_update" ON public.challenges; CREATE POLICY "challenges_update" ON public.challenges FOR UPDATE USING (public.is_staff() OR challenger_id = auth.uid() OR opponent_id = auth.uid()) WITH CHECK (public.is_staff() OR challenger_id = auth.uid() OR opponent_id = auth.uid());
DROP POLICY IF EXISTS "challenges_delete" ON public.challenges; CREATE POLICY "challenges_delete" ON public.challenges FOR DELETE USING ((challenger_id = auth.uid() AND status = 'EN_ATTENTE') OR public.is_staff());

DROP POLICY IF EXISTS "payments_select_own_or_staff" ON public.payments; CREATE POLICY "payments_select_own_or_staff" ON public.payments FOR SELECT USING (user_id = auth.uid() OR public.is_staff());
DROP POLICY IF EXISTS "payments_insert_own" ON public.payments; CREATE POLICY "payments_insert_own" ON public.payments FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "payments_update" ON public.payments; CREATE POLICY "payments_update" ON public.payments FOR UPDATE USING (public.is_staff() OR (user_id = auth.uid() AND status = 'EN_ATTENTE')) WITH CHECK (public.is_staff() OR (user_id = auth.uid() AND status = 'EN_ATTENTE'));
DROP POLICY IF EXISTS "payments_delete_staff" ON public.payments; CREATE POLICY "payments_delete_staff" ON public.payments FOR DELETE USING (public.is_staff());

DROP POLICY IF EXISTS "proofs_select" ON public.payment_proofs; CREATE POLICY "proofs_select" ON public.payment_proofs FOR SELECT USING (public.is_staff() OR uploaded_by = auth.uid() OR EXISTS (SELECT 1 FROM public.payments p WHERE p.id = payment_id AND p.user_id = auth.uid()));
DROP POLICY IF EXISTS "proofs_insert_own" ON public.payment_proofs; CREATE POLICY "proofs_insert_own" ON public.payment_proofs FOR INSERT WITH CHECK (uploaded_by = auth.uid() AND EXISTS (SELECT 1 FROM public.payments p WHERE p.id = payment_id AND p.user_id = auth.uid() AND p.status = 'EN_ATTENTE'));
DROP POLICY IF EXISTS "proofs_staff_all" ON public.payment_proofs; CREATE POLICY "proofs_staff_all" ON public.payment_proofs FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "notif_select_own" ON public.notifications; CREATE POLICY "notif_select_own" ON public.notifications FOR SELECT USING (user_id = auth.uid() OR public.is_staff());
DROP POLICY IF EXISTS "notif_insert_staff" ON public.notifications; CREATE POLICY "notif_insert_staff" ON public.notifications FOR INSERT WITH CHECK (public.is_staff());
DROP POLICY IF EXISTS "notif_update_own" ON public.notifications; CREATE POLICY "notif_update_own" ON public.notifications FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "notif_delete_own" ON public.notifications; CREATE POLICY "notif_delete_own" ON public.notifications FOR DELETE USING (user_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "notif_pref_own" ON public.notification_preferences; CREATE POLICY "notif_pref_own" ON public.notification_preferences FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "notif_pref_staff_read" ON public.notification_preferences; CREATE POLICY "notif_pref_staff_read" ON public.notification_preferences FOR SELECT USING (public.is_staff());

DROP POLICY IF EXISTS "ach_select_all" ON public.achievements; CREATE POLICY "ach_select_all" ON public.achievements FOR SELECT USING (true);
DROP POLICY IF EXISTS "ach_staff_all" ON public.achievements; CREATE POLICY "ach_staff_all" ON public.achievements FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "pa_select_all" ON public.player_achievements; CREATE POLICY "pa_select_all" ON public.player_achievements FOR SELECT USING (true);
DROP POLICY IF EXISTS "pa_insert_staff" ON public.player_achievements; CREATE POLICY "pa_insert_staff" ON public.player_achievements FOR INSERT WITH CHECK (public.is_staff());
DROP POLICY IF EXISTS "pa_update_own_or_staff" ON public.player_achievements; CREATE POLICY "pa_update_own_or_staff" ON public.player_achievements FOR UPDATE USING (player_id = auth.uid() OR public.is_staff()) WITH CHECK (player_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "payouts_select_own_or_staff" ON public.payouts; CREATE POLICY "payouts_select_own_or_staff" ON public.payouts FOR SELECT USING (winner_id = auth.uid() OR public.is_staff());
DROP POLICY IF EXISTS "payouts_staff_all" ON public.payouts; CREATE POLICY "payouts_staff_all" ON public.payouts FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "admin_actions_staff_only" ON public.admin_actions; CREATE POLICY "admin_actions_staff_only" ON public.admin_actions FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff() AND admin_id = auth.uid());

-- Vues
CREATE OR REPLACE VIEW public.v_player_stats AS SELECT p.id, p.username, p.display_name, p.wins, p.losses, CASE WHEN (p.wins + p.losses) > 0 THEN ROUND(p.wins::decimal / (p.wins + p.losses) * 100, 1) ELSE 0 END as win_rate, p.tournaments_won, p.tournaments_played, p.challenges_won, p.current_streak, p.best_streak, p.total_earnings, p.level, COUNT(pa.id) FILTER (WHERE pa.is_unlocked = true) as achievements_unlocked FROM public.profiles p LEFT JOIN public.player_achievements pa ON pa.player_id = p.id GROUP BY p.id;
-- ============================
-- CHAMPS OBLIGATOIRES INSCRIPTION - JOYBOY PREMIUM UPDATE
-- ============================
-- CHAMPS OBLIGATOIRES INSCRIPTION : WhatsApp + eFootball + Wave perso pour payer djai
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS efootball_pseudo TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wave_number TEXT;

-- Commentaire explicite
COMMENT ON COLUMN public.profiles.whatsapp_number IS 'CHAMPS OBLIGATOIRES INSCRIPTION - Numéro WhatsApp perso pour contact admin';
COMMENT ON COLUMN public.profiles.efootball_pseudo IS 'CHAMPS OBLIGATOIRES INSCRIPTION - Pseudo eFootball / Konami ID obligatoire';
COMMENT ON COLUMN public.profiles.wave_number IS 'CHAMPS OBLIGATOIRES INSCRIPTION - Numéro Wave perso pour encaisser ton djai';

-- Index pour recherche admin par WhatsApp / eFootball / Wave
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp ON public.profiles(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_profiles_efootball ON public.profiles(efootball_pseudo);
CREATE INDEX IF NOT EXISTS idx_profiles_wave ON public.profiles(wave_number);

-- Mise à jour trigger handle_new_user pour recevoir les 3 champs obligatoires depuis auth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, username, display_name, avatar_url,
    whatsapp_number, efootball_pseudo, wave_number, phone_wave
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'joueur_' || substr(NEW.id::text,1,6)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', 'Nouveau Champion'),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'whatsapp_number',
    NEW.raw_user_meta_data->>'efootball_pseudo',
    NEW.raw_user_meta_data->>'wave_number',
    COALESCE(NEW.raw_user_meta_data->>'wave_number', NEW.raw_user_meta_data->>'whatsapp_number')
  )
  ON CONFLICT (id) DO UPDATE SET
    whatsapp_number = COALESCE(EXCLUDED.whatsapp_number, public.profiles.whatsapp_number),
    efootball_pseudo = COALESCE(EXCLUDED.efootball_pseudo, public.profiles.efootball_pseudo),
    wave_number = COALESCE(EXCLUDED.wave_number, public.profiles.wave_number),
    phone_wave = COALESCE(EXCLUDED.phone_wave, public.profiles.phone_wave, EXCLUDED.whatsapp_number),
    username = COALESCE(public.profiles.username, EXCLUDED.username),
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name);

  INSERT INTO public.notification_preferences (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Vue admin v_users_with_contacts : accès rapide à tous les contacts obligatoires
CREATE OR REPLACE VIEW public.v_users_with_contacts AS
SELECT
  p.id,
  p.username,
  p.display_name,
  p.avatar_url,
  p.whatsapp_number,
  p.efootball_pseudo,
  p.wave_number,
  p.phone_wave,
  p.role,
  p.is_banned,
  p.banned_reason,
  p.wins,
  p.losses,
  p.tournaments_played,
  p.tournaments_won,
  p.total_earnings,
  p.level,
  p.created_at,
  p.last_seen_at,
  (p.whatsapp_number IS NOT NULL AND p.efootball_pseudo IS NOT NULL AND p.wave_number IS NOT NULL) AS contacts_complete,
  CASE WHEN p.whatsapp_number IS NOT NULL THEN 'Reçu admin' ELSE 'Manquant' END AS whatsapp_status,
  CASE WHEN p.efootball_pseudo IS NOT NULL THEN 'Reçu admin' ELSE 'Manquant' END AS efootball_status,
  CASE WHEN p.wave_number IS NOT NULL THEN 'Reçu admin' ELSE 'Manquant' END AS wave_status
FROM public.profiles p
ORDER BY p.created_at DESC;

-- RLS pour la vue : autorise staff en lecture, sinon owner
-- Les vues héritent des policies de profiles (public read, staff all)

-- Fonction helper pour vérifier complétude inscription
CREATE OR REPLACE FUNCTION public.is_profile_contact_complete(p_profile_id UUID) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_profile_id
    AND whatsapp_number IS NOT NULL AND char_length(whatsapp_number) >= 8
    AND efootball_pseudo IS NOT NULL AND char_length(efootball_pseudo) >= 2
    AND wave_number IS NOT NULL AND char_length(wave_number) >= 8
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
