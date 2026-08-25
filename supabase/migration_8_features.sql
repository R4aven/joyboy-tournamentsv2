-- 🇨🇮 JOYBOY TOURNAMENTS - 8 NOUVELLES FONCTIONNALITÉS
-- Anti-absence, Countdown, Signalement, Chat privé, Hall of Fame, Règlement, Revanche, Stats, Rappels
-- Respecte architecture existante, étend au lieu de dupliquer

-- ==========================
-- 1-2. ANTI-ABSENCE + COUNTDOWN
-- ==========================
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS available_from TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS window_start TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS window_end TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 minutes';
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS expired_handled_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS absence_reports JSONB DEFAULT '[]'::jsonb;

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
  reporter_id = auth.uid() OR reported_player_id = auth.uid() OR public.is_match_participant_secure(match_id) OR public.is_staff()
);
DROP POLICY IF EXISTS "absence_reports_insert" ON public.match_absence_reports;
CREATE POLICY "absence_reports_insert" ON public.match_absence_reports FOR INSERT WITH CHECK (
  reporter_id = auth.uid() AND public.is_match_participant_secure(match_id)
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
  reporter_id = auth.uid() OR public.is_match_participant_secure(match_id) OR public.is_staff()
);
DROP POLICY IF EXISTS "problem_reports_insert" ON public.match_problem_reports;
CREATE POLICY "problem_reports_insert" ON public.match_problem_reports FOR INSERT WITH CHECK (
  reporter_id = auth.uid() AND public.is_match_participant_secure(match_id)
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
  public.is_match_participant_secure(match_id) OR public.is_staff()
);
DROP POLICY IF EXISTS "match_messages_insert" ON public.match_messages;
CREATE POLICY "match_messages_insert" ON public.match_messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND public.is_match_participant_secure(match_id)
);
DROP POLICY IF EXISTS "match_messages_update_own" ON public.match_messages;
CREATE POLICY "match_messages_update_own" ON public.match_messages FOR UPDATE USING (
  sender_id = auth.uid() OR public.is_staff()
);

-- Spam protection function
CREATE OR REPLACE FUNCTION public.check_message_spam(p_match_id UUID, p_sender_id UUID) RETURNS BOOLEAN AS $$
DECLARE
  msg_count INT;
BEGIN
  SELECT COUNT(*) INTO msg_count FROM public.match_messages
  WHERE match_id = p_match_id AND sender_id = p_sender_id
  AND created_at > NOW() - INTERVAL '1 minute';
  RETURN msg_count < 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notif nouveau message
CREATE OR REPLACE FUNCTION public.notify_new_message() RETURNS TRIGGER AS $$
DECLARE
  opponent_id UUID;
BEGIN
  SELECT CASE WHEN player_a_id = NEW.sender_id THEN player_b_id ELSE player_a_id END INTO opponent_id
  FROM public.matches WHERE id = NEW.match_id;
  IF opponent_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, match_id)
    VALUES (opponent_id, 'NOUVEAU_MESSAGE', '💬 Nouveau message', 'Ton adversaire t''a envoyé un message dans le salon privé.', NEW.match_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_message_insert_notify ON public.match_messages;
CREATE TRIGGER on_message_insert_notify AFTER INSERT ON public.match_messages FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

-- ==========================
-- 5. HALL OF FAME (utilise tournaments + profiles existants, pas nouvelle table nécessaire mais on crée vue)
-- ==========================
CREATE OR REPLACE VIEW public.hall_of_fame AS
SELECT 
  t.id as tournament_id,
  t.title as tournament_name,
  t.game,
  t.created_at as tournament_date,
  t.max_players as player_count,
  t.champion_id,
  p1.username as champion_username,
  p1.avatar_url as champion_avatar,
  t.status,
  (SELECT json_agg(json_build_object('position', tp.position, 'username', p.username, 'user_id', p.user_id) ORDER BY tp.position) FROM public.tournament_players tp JOIN public.profiles p ON p.id = tp.user_id WHERE tp.tournament_id = t.id AND tp.position <= 3) as podium
FROM public.tournaments t
LEFT JOIN public.profiles p1 ON p1.id = t.champion_id
WHERE t.status = 'TERMINE' AND t.champion_id IS NOT NULL
ORDER BY t.created_at DESC;

-- ==========================
-- 6. RÈGLEMENT OBLIGATOIRE
-- ==========================
CREATE TABLE IF NOT EXISTS public.tournament_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version TEXT NOT NULL DEFAULT 'v1.0',
  title TEXT NOT NULL DEFAULT 'Règlement JOYBOY TOURNAMENTS',
  content TEXT NOT NULL,
  game TEXT, -- null = général, ou spécifique jeu
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
  UNIQUE(player_id, rule_id),
  UNIQUE(player_id, tournament_id, rule_id)
);

CREATE INDEX IF NOT EXISTS idx_rule_acceptances_player ON public.rule_acceptances(player_id);
CREATE INDEX IF NOT EXISTS idx_rule_acceptances_tournament ON public.rule_acceptances(tournament_id);

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

-- Règlement par défaut
INSERT INTO public.tournament_rules (version, title, content, is_active) VALUES 
('v1.0', 'Règlement Général JOYBOY TOURNAMENTS 🇨🇮', 
'📜 RÈGLEMENT OFFICIEL JOYBOY TOURNAMENTS

1. FAIR-PLAY OBLIGATOIRE - Tout comportement antisportif = disqualification immédiate
2. CONNEXION - Connexion stable exigée. Déconnexion = forfait si pas de retour sous 5 min
3. SALON PRIVÉ - Chaque rencontre utilise un salon eFootball privé réservé aux 2 joueurs. Infos connexion jamais publiques
4. RÉSULTAT - Score + capture obligatoire. Double confirmation. Si désaccord → contestation → admin
5. RETARD - 10 min de retard = forfait. Signaler absence via bouton dédié
6. PAIEMENT - Wave uniquement 01 51 42 99 18. Pas de Orange Money/MTN/PayPal
7. GAINS - Encaisse ton djai sur Wave ! Versé sous 24h après validation
8. COMPORTEMENT - Insultes, triche, hack = bannissement définitif
9. DÉCISIONS ADMIN - Finales et sans appel
10. WHATSAPP SUPPORT - 07 48 23 52 26 pour aide

En acceptant, tu t''engages à respecter ces règles. C''est géré, champion ! 🇨🇮', true)
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
CREATE INDEX IF NOT EXISTS idx_rematch_opponent_status ON public.rematch_requests(opponent_id, status);
ALTER TABLE public.rematch_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rematch_select_participant" ON public.rematch_requests;
CREATE POLICY "rematch_select_participant" ON public.rematch_requests FOR SELECT USING (
  requester_id = auth.uid() OR opponent_id = auth.uid() OR public.is_staff()
);
DROP POLICY IF EXISTS "rematch_insert" ON public.rematch_requests;
CREATE POLICY "rematch_insert" ON public.rematch_requests FOR INSERT WITH CHECK (
  requester_id = auth.uid()
);
DROP POLICY IF EXISTS "rematch_update_opponent_or_staff" ON public.rematch_requests;
CREATE POLICY "rematch_update_opponent_or_staff" ON public.rematch_requests FOR UPDATE USING (
  opponent_id = auth.uid() OR public.is_staff() OR requester_id = auth.uid()
);

-- Fonction création revanche
CREATE OR REPLACE FUNCTION public.create_rematch_from_request() RETURNS TRIGGER AS $$
DECLARE
  new_match UUID;
  orig_match RECORD;
BEGIN
  IF NEW.status = 'ACCEPTED' AND OLD.status = 'PENDING' THEN
    SELECT * INTO orig_match FROM public.matches WHERE id = NEW.original_match_id;
    INSERT INTO public.matches (tournament_id, type, status, player_a_id, player_b_id, window_start, window_end, bracket_round)
    VALUES (orig_match.tournament_id, '1V1', 'PROGRAMME', NEW.requester_id, NEW.opponent_id, NOW(), NOW() + INTERVAL '30 minutes', 'REVANCHE')
    RETURNING id INTO new_match;
    
    NEW.new_match_id := new_match;
    NEW.responded_at := NOW();
    
    INSERT INTO public.notifications (user_id, type, title, message, match_id)
    VALUES 
      (NEW.requester_id, 'REVANCHE_ACCEPTEE', '⚔ Revanche acceptée !', 'Ton adversaire a accepté la revanche. Nouveau match créé !', new_match),
      (NEW.opponent_id, 'REVANCHE_ACCEPTEE', '⚔ Revanche lancée !', 'Revanche créée, à toi de jouer champion !', new_match);
  ELSIF NEW.status = 'REFUSED' THEN
    NEW.responded_at := NOW();
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (NEW.requester_id, 'REVANCHE_REFUSEE', 'Revanche refusée', 'Ton adversaire a refusé la revanche. Respect, on se retrouve bientôt !');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_rematch_status_change ON public.rematch_requests;
CREATE TRIGGER on_rematch_status_change BEFORE UPDATE ON public.rematch_requests FOR EACH ROW EXECUTE FUNCTION public.create_rematch_from_request();

-- Notif nouvelle demande revanche
CREATE OR REPLACE FUNCTION public.notify_rematch_request() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, match_id)
  VALUES (NEW.opponent_id, 'REVANCHE_RECUE', '🔥 On veut une revanche !', NEW.requester_id || ' veut une revanche. Accepte ou refuse, champion !', NEW.original_match_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_rematch_request_insert ON public.rematch_requests;
CREATE TRIGGER on_rematch_request_insert AFTER INSERT ON public.rematch_requests FOR EACH ROW EXECUTE FUNCTION public.notify_rematch_request();

-- ==========================
-- 8. STATISTIQUES DÉTAILLÉES (vue matérialisée)
-- ==========================
CREATE OR REPLACE VIEW public.player_detailed_stats AS
SELECT 
  p.id,
  p.username,
  p.avatar_url,
  p.wins,
  p.losses,
  p.draws,
  CASE WHEN (p.wins + p.losses) > 0 THEN ROUND((p.wins::DECIMAL / (p.wins + p.losses) * 100), 1) ELSE 0 END as win_rate,
  p.tournaments_played,
  p.tournaments_won,
  p.challenges_played,
  p.challenges_won,
  p.total_earnings,
  p.current_streak,
  p.best_streak,
  p.level,
  p.total_xp,
  (SELECT COUNT(*) FROM public.matches WHERE (player_a_id = p.id OR player_b_id = p.id) AND status = 'TERMINE') as matches_jouees,
  (SELECT COUNT(*) FROM public.matches WHERE winner_id = p.id) as victoires_totales,
  (SELECT COUNT(*) FROM public.matches WHERE (player_a_id = p.id OR player_b_id = p.id) AND status = 'TERMINE' AND winner_id != p.id) as defaites_totales,
  (SELECT COUNT(*) FROM public.matches WHERE winner_id = p.id AND type = '1V1') as victoires_1v1,
  (SELECT COUNT(*) FROM public.matches WHERE (player_a_id = p.id OR player_b_id = p.id) AND type = 'TOURNOI') as matchs_tournoi,
  (SELECT COUNT(*) FROM public.tournaments WHERE champion_id = p.id) as tournois_gagnes_reels,
  (SELECT COUNT(*) FROM public.tournament_players WHERE user_id = p.id) as tournois_participes,
  (SELECT COUNT(*) FROM public.matches WHERE (player_a_id = p.id OR player_b_id = p.id) AND bracket_round = 'FINALE') as finales_jouees,
  (SELECT COUNT(*) FROM public.player_achievements WHERE player_id = p.id) as trophees_count
FROM public.profiles p;

-- ==========================
-- 9. RAPPELS AUTOMATIQUES
-- ==========================
CREATE TABLE IF NOT EXISTS public.match_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('30_MIN_BEFORE','10_MIN_BEFORE','EXPIRES_SOON','MATCH_AVAILABLE','ADVERSAIRE_ABSENT','LITIGE_CREE')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  is_sent BOOLEAN NOT NULL DEFAULT FALSE,
  notification_id UUID REFERENCES public.notifications(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(match_id, user_id, reminder_type, scheduled_for)
);

CREATE INDEX IF NOT EXISTS idx_reminders_scheduled ON public.match_reminders(scheduled_for, is_sent);
CREATE INDEX IF NOT EXISTS idx_reminders_match_user ON public.match_reminders(match_id, user_id);

ALTER TABLE public.match_reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reminders_own" ON public.match_reminders;
CREATE POLICY "reminders_own" ON public.match_reminders FOR ALL USING (
  user_id = auth.uid() OR public.is_staff()
);

-- Fonction création rappels auto quand match créé
CREATE OR REPLACE FUNCTION public.create_match_reminders() RETURNS TRIGGER AS $$
BEGIN
  -- 30 min avant
  INSERT INTO public.match_reminders (match_id, user_id, reminder_type, scheduled_for)
  VALUES 
    (NEW.id, NEW.player_a_id, '30_MIN_BEFORE', NEW.window_start - INTERVAL '30 minutes'),
    (NEW.id, NEW.player_b_id, '30_MIN_BEFORE', NEW.window_start - INTERVAL '30 minutes')
  ON CONFLICT DO NOTHING;
  
  -- 10 min avant
  INSERT INTO public.match_reminders (match_id, user_id, reminder_type, scheduled_for)
  VALUES 
    (NEW.id, NEW.player_a_id, '10_MIN_BEFORE', NEW.window_start - INTERVAL '10 minutes'),
    (NEW.id, NEW.player_b_id, '10_MIN_BEFORE', NEW.window_start - INTERVAL '10 minutes')
  ON CONFLICT DO NOTHING;
  
  -- Expire bientôt (5 min avant window_end)
  INSERT INTO public.match_reminders (match_id, user_id, reminder_type, scheduled_for)
  VALUES 
    (NEW.id, NEW.player_a_id, 'EXPIRES_SOON', NEW.window_end - INTERVAL '5 minutes'),
    (NEW.id, NEW.player_b_id, 'EXPIRES_SOON', NEW.window_end - INTERVAL '5 minutes')
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_match_create_reminders ON public.matches;
CREATE TRIGGER on_match_create_reminders AFTER INSERT ON public.matches FOR EACH ROW EXECUTE FUNCTION public.create_match_reminders();

-- Fonction envoi rappels (à appeler via cron ou edge function)
CREATE OR REPLACE FUNCTION public.send_due_reminders() RETURNS INT AS $$
DECLARE
  r RECORD;
  sent_count INT := 0;
  notif_id UUID;
BEGIN
  FOR r IN SELECT * FROM public.match_reminders WHERE is_sent = false AND scheduled_for <= NOW() LOOP
    INSERT INTO public.notifications (user_id, type, title, message, match_id)
    VALUES (
      r.user_id,
      CASE r.reminder_type
        WHEN '30_MIN_BEFORE' THEN 'MATCH_BIENTOT'
        WHEN '10_MIN_BEFORE' THEN 'MATCH_BIENTOT'
        WHEN 'EXPIRES_SOON' THEN 'MATCH_EXPIRE_BIENTOT'
        ELSE 'RAPPEL_MATCH'
      END,
      CASE r.reminder_type
        WHEN '30_MIN_BEFORE' THEN '⏰ Ton match commence dans 30 minutes'
        WHEN '10_MIN_BEFORE' THEN '⚠ Ton match commence dans 10 minutes'
        WHEN 'EXPIRES_SOON' THEN '🚨 Ton match expire bientôt !'
        ELSE '🔔 Rappel match'
      END,
      CASE r.reminder_type
        WHEN '30_MIN_BEFORE' THEN 'Ton match commence dans 30 min. Prépare-toi champion !'
        WHEN '10_MIN_BEFORE' THEN 'Plus que 10 min avant ton match. Rejoins le salon vite !'
        WHEN 'EXPIRES_SOON' THEN 'Ton match doit être joué avant ' || (SELECT window_end::TEXT FROM public.matches WHERE id = r.match_id) || '. Dépêche-toi !'
        ELSE 'Rappel pour ton match'
      END,
      r.match_id
    ) RETURNING id INTO notif_id;
    
    UPDATE public.match_reminders SET is_sent = true, sent_at = NOW(), notification_id = notif_id WHERE id = r.id;
    sent_count := sent_count + 1;
  END LOOP;
  RETURN sent_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;