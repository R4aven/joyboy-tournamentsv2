-- 🇨🇮 JOYBOY TOURNAMENTS - 8 NOUVELLES FONCTIONNALITÉS - VERSION CORRIGÉE COMPATIBLE SCHEMA EXISTANT
-- Fix erreur: column type does not exist - ajoute colonnes manquantes si besoin

-- ==========================
-- 1-2. ANTI-ABSENCE + COUNTDOWN - Ajout colonnes compatibles avec ancien schéma matches (player1_id/player2_id)
-- ==========================
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS available_from TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS window_start TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS window_end TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 minutes';
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS expired_handled_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS absence_reports JSONB DEFAULT '[]'::jsonb;
-- Colonnes pour compatibilité nouveau code (player_a_id/player_b_id) + type etc
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS player_a_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS player_b_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'TOURNOI';
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS status_detail TEXT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS bracket_round TEXT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS player_a_connected BOOLEAN DEFAULT FALSE;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS player_b_connected BOOLEAN DEFAULT FALSE;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS match_started_at TIMESTAMPTZ;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS final_score_a INT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS final_score_b INT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS result_declarations JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS is_contested BOOLEAN DEFAULT FALSE;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS contested_reason TEXT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS validated_by_admin UUID REFERENCES public.profiles(id);
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ;

-- Synchroniser player_a_id avec player1_id si existe
DO $$
BEGIN
  UPDATE public.matches SET player_a_id = player1_id WHERE player_a_id IS NULL AND player1_id IS NOT NULL;
  UPDATE public.matches SET player_b_id = player2_id WHERE player_b_id IS NULL AND player2_id IS NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.match_absence_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL DEFAULT 'Adversaire absent',
  details TEXT,
  evidence_url TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at TIMESTAMPTZ,
  decided_by UUID REFERENCES public.profiles(id),
  decision_note TEXT,
  admin_history JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_absence_reports_match ON public.match_absence_reports(match_id);
CREATE INDEX IF NOT EXISTS idx_absence_reports_status ON public.match_absence_reports(status);
ALTER TABLE public.match_absence_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "absence_reports_select" ON public.match_absence_reports;
CREATE POLICY "absence_reports_select" ON public.match_absence_reports FOR SELECT USING (
  reporter_id = auth.uid() OR reported_player_id = auth.uid() OR public.is_staff()
);
DROP POLICY IF EXISTS "absence_reports_insert" ON public.match_absence_reports;
CREATE POLICY "absence_reports_insert" ON public.match_absence_reports FOR INSERT WITH CHECK (
  reporter_id = auth.uid()
);
DROP POLICY IF EXISTS "absence_reports_update_admin" ON public.match_absence_reports;
CREATE POLICY "absence_reports_update_admin" ON public.match_absence_reports FOR UPDATE USING (public.is_staff());

-- ==========================
-- 3. SIGNALER UN PROBLÈME
-- ==========================
CREATE TABLE IF NOT EXISTS public.match_problem_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('Adversaire absent','Problème de connexion','Résultat incorrect','Comportement incorrect','Problème avec le salon','Problème technique','Autre')),
  description TEXT NOT NULL CHECK (char_length(description) >= 10),
  evidence_url TEXT,
  evidence_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','OPEN','INVESTIGATING','RESOLVED','REJECTED')),
  admin_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_problem_reports_match ON public.match_problem_reports(match_id);
CREATE INDEX IF NOT EXISTS idx_problem_reports_status ON public.match_problem_reports(status);
ALTER TABLE public.match_problem_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "problem_reports_select" ON public.match_problem_reports;
CREATE POLICY "problem_reports_select" ON public.match_problem_reports FOR SELECT USING (
  reporter_id = auth.uid() OR public.is_staff()
);
DROP POLICY IF EXISTS "problem_reports_insert" ON public.match_problem_reports;
CREATE POLICY "problem_reports_insert" ON public.match_problem_reports FOR INSERT WITH CHECK (
  reporter_id = auth.uid()
);
DROP POLICY IF EXISTS "problem_reports_update_admin" ON public.match_problem_reports;
CREATE POLICY "problem_reports_update_admin" ON public.match_problem_reports FOR UPDATE USING (public.is_staff());

DROP TRIGGER IF EXISTS set_updated_at_problem_reports ON public.match_problem_reports;
CREATE TRIGGER set_updated_at_problem_reports BEFORE UPDATE ON public.match_problem_reports FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==========================
-- 4. CHAT PRIVÉ
-- ==========================
CREATE TABLE IF NOT EXISTS public.match_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_match_messages_match_created ON public.match_messages(match_id, created_at);
ALTER TABLE public.match_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "match_messages_select" ON public.match_messages;
CREATE POLICY "match_messages_select" ON public.match_messages FOR SELECT USING (
  public.is_staff()
);
DROP POLICY IF EXISTS "match_messages_insert" ON public.match_messages;
CREATE POLICY "match_messages_insert" ON public.match_messages FOR INSERT WITH CHECK (
  sender_id = auth.uid()
);
DROP POLICY IF EXISTS "match_messages_update_own" ON public.match_messages;
CREATE POLICY "match_messages_update_own" ON public.match_messages FOR UPDATE USING (
  sender_id = auth.uid() OR public.is_staff()
);

-- Fonction helper is_match_participant_secure compatible avec player1_id/player2_id ET player_a_id/player_b_id
CREATE OR REPLACE FUNCTION public.is_match_participant_secure(p_match_id UUID) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.matches
    WHERE id = p_match_id
    AND (
      player1_id = auth.uid() OR player2_id = auth.uid() OR
      player_a_id = auth.uid() OR player_b_id = auth.uid()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recrée policies chat avec fonction
DROP POLICY IF EXISTS "match_messages_select" ON public.match_messages;
CREATE POLICY "match_messages_select" ON public.match_messages FOR SELECT USING (
  public.is_match_participant_secure(match_id) OR public.is_staff()
);
DROP POLICY IF EXISTS "match_messages_insert" ON public.match_messages;
CREATE POLICY "match_messages_insert" ON public.match_messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND public.is_match_participant_secure(match_id)
);

-- ==========================
-- 5. HALL OF FAME - vue compatible
-- ==========================
CREATE OR REPLACE VIEW public.hall_of_fame AS
SELECT 
  t.id as tournament_id,
  t.title as tournament_name,
  t.game,
  t.created_at as tournament_date,
  t.max_players as player_count,
  t.winner_id as champion_id,
  p1.username as champion_username,
  p1.avatar_url as champion_avatar,
  t.status
FROM public.tournaments t
LEFT JOIN public.profiles p1 ON p1.id = t.winner_id
WHERE t.winner_id IS NOT NULL
ORDER BY t.created_at DESC;

-- ==========================
-- 6. RÈGLEMENT OBLIGATOIRE
-- ==========================
CREATE TABLE IF NOT EXISTS public.tournament_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version TEXT NOT NULL DEFAULT 'v1.0',
  title TEXT NOT NULL DEFAULT 'Règlement JOYBOY TOURNAMENTS',
  content TEXT NOT NULL,
  game TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rule_acceptances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES public.tournament_rules(id) ON DELETE CASCADE,
  rule_version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  UNIQUE(player_id, rule_id)
);

CREATE INDEX IF NOT EXISTS idx_rule_acceptances_player ON public.rule_acceptances(player_id);
ALTER TABLE public.tournament_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tournament_rules_select_all" ON public.tournament_rules;
CREATE POLICY "tournament_rules_select_all" ON public.tournament_rules FOR SELECT USING (true);
DROP POLICY IF EXISTS "tournament_rules_admin" ON public.tournament_rules;
CREATE POLICY "tournament_rules_admin" ON public.tournament_rules FOR ALL USING (public.is_staff());

ALTER TABLE public.rule_acceptances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rule_acceptances_own" ON public.rule_acceptances;
CREATE POLICY "rule_acceptances_own" ON public.rule_acceptances FOR ALL USING (
  player_id = auth.uid() OR public.is_staff()
) WITH CHECK (
  player_id = auth.uid() OR public.is_staff()
);

INSERT INTO public.tournament_rules (version, title, content, is_active) VALUES 
('v1.0', 'Règlement Général JOYBOY TOURNAMENTS 🇨🇮', 
'📜 RÈGLEMENT OFFICIEL JOYBOY TOURNAMENTS

1. FAIR-PLAY OBLIGATOIRE - Tout comportement antisportif = disqualification
2. CONNEXION - Connexion stable exigée. Déconnexion = forfait si pas retour sous 5 min
3. SALON PRIVÉ - Chaque rencontre utilise un salon eFootball privé réservé aux 2 joueurs. Infos jamais publiques
4. RÉSULTAT - Score + capture obligatoire. Double confirmation.
5. RETARD - 10 min retard = forfait. Signaler absence via bouton
6. PAIEMENT - Wave uniquement 01 51 42 99 18
7. GAINS - Encaisse ton djai sur Wave ! Versé sous 24h
8. COMPORTEMENT - Insultes, triche = bannissement
9. DÉCISIONS ADMIN - Finales
10. SUPPORT - WhatsApp 07 48 23 52 26

En acceptant, tu t''engages à respecter ces règles.', true)
ON CONFLICT DO NOTHING;

-- ==========================
-- 7. REVANCHE 1V1
-- ==========================
CREATE TABLE IF NOT EXISTS public.rematch_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  opponent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','ACCEPTED','REFUSED','CANCELLED','EXPIRED')),
  message TEXT DEFAULT 'Veut une revanche !',
  new_match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX IF NOT EXISTS idx_rematch_original ON public.rematch_requests(original_match_id);
ALTER TABLE public.rematch_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rematch_select_participant" ON public.rematch_requests;
CREATE POLICY "rematch_select_participant" ON public.rematch_requests FOR SELECT USING (
  requester_id = auth.uid() OR opponent_id = auth.uid() OR public.is_staff()
);
DROP POLICY IF EXISTS "rematch_insert" ON public.rematch_requests;
CREATE POLICY "rematch_insert" ON public.rematch_requests FOR INSERT WITH CHECK (
  requester_id = auth.uid()
);
DROP POLICY IF EXISTS "rematch_update" ON public.rematch_requests;
CREATE POLICY "rematch_update" ON public.rematch_requests FOR UPDATE USING (
  opponent_id = auth.uid() OR public.is_staff() OR requester_id = auth.uid()
);

-- ==========================
-- 8. STATISTIQUES + RAPPELS - sans vue qui plante
-- ==========================
CREATE OR REPLACE VIEW public.player_detailed_stats AS
SELECT 
  p.id,
  p.username,
  p.avatar_url,
  p.wins,
  p.losses,
  CASE WHEN (p.wins + p.losses) > 0 THEN ROUND((p.wins::DECIMAL / (p.wins + p.losses) * 100), 1) ELSE 0 END as win_rate,
  p.tournaments_played,
  p.tournaments_won,
  p.challenges_played,
  p.challenges_won,
  p.total_earnings,
  p.current_streak,
  p.best_streak,
  (SELECT COUNT(*) FROM public.matches WHERE (player1_id = p.id OR player2_id = p.id) AND status = 'TERMINE') as matches_jouees
FROM public.profiles p;

CREATE TABLE IF NOT EXISTS public.match_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('30_MIN_BEFORE','10_MIN_BEFORE','EXPIRES_SOON','MATCH_AVAILABLE')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  is_sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(match_id, user_id, reminder_type, scheduled_for)
);

ALTER TABLE public.match_reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reminders_own" ON public.match_reminders;
CREATE POLICY "reminders_own" ON public.match_reminders FOR ALL USING (
  user_id = auth.uid() OR public.is_staff()
);

-- Fonction envoi rappels
CREATE OR REPLACE FUNCTION public.send_due_reminders() RETURNS INT AS $$
DECLARE
  r RECORD;
  sent_count INT := 0;
BEGIN
  FOR r IN SELECT * FROM public.match_reminders WHERE is_sent = false AND scheduled_for <= NOW() LOOP
    INSERT INTO public.notifications (user_id, type, title, message, match_id)
    VALUES (
      r.user_id,
      'RAPPEL_MATCH',
      CASE r.reminder_type
        WHEN '30_MIN_BEFORE' THEN '⏰ Ton match commence dans 30 minutes'
        WHEN '10_MIN_BEFORE' THEN '⚠ Ton match commence dans 10 minutes'
        WHEN 'EXPIRES_SOON' THEN '🚨 Ton match expire bientôt !'
        ELSE '🔔 Rappel match'
      END,
      'Rappel pour ton match',
      r.match_id
    );
    UPDATE public.match_reminders SET is_sent = true, sent_at = NOW() WHERE id = r.id;
    sent_count := sent_count + 1;
  END LOOP;
  RETURN sent_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;