-- JOYBOY TOURNAMENTS - migration finale sécurité / promos / anti-absence / capacité / bracket
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Capacités libres
ALTER TABLE public.tournaments DROP CONSTRAINT IF EXISTS tournaments_max_players_check;
ALTER TABLE public.tournaments DROP CONSTRAINT IF EXISTS tournaments_max_players_check1;
ALTER TABLE public.tournaments DROP CONSTRAINT IF EXISTS tournaments_format_check;
ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_max_players_valid CHECK (max_players >= 2 AND max_players <= 128);

-- Prix réellement appliqués à une inscription
ALTER TABLE public.tournament_players ADD COLUMN IF NOT EXISTS original_entry_fee INT;
ALTER TABLE public.tournament_players ADD COLUMN IF NOT EXISTS discount_amount INT NOT NULL DEFAULT 0;
ALTER TABLE public.tournament_players ADD COLUMN IF NOT EXISTS final_entry_fee INT;
ALTER TABLE public.tournament_players ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE SET NULL;
ALTER TABLE public.tournament_players ADD COLUMN IF NOT EXISTS promo_code TEXT;
ALTER TABLE public.tournament_players ADD COLUMN IF NOT EXISTS payment_proof_path TEXT;

-- Promotions complètes
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS show_banner BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS tournament_ids UUID[] NOT NULL DEFAULT '{}';
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.promo_codes DROP CONSTRAINT IF EXISTS promo_codes_discount_value_check;
ALTER TABLE public.promo_codes ADD CONSTRAINT promo_codes_discount_value_check CHECK (discount_value >= 0 AND (discount_type <> 'percent' OR discount_value <= 100));

CREATE OR REPLACE FUNCTION public.is_promo_usable(p_promo public.promo_codes, p_tournament UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT p_promo.active
    AND (p_promo.starts_at IS NULL OR p_promo.starts_at <= NOW())
    AND (p_promo.expires_at IS NULL OR p_promo.expires_at > NOW())
    AND (p_promo.max_uses IS NULL OR p_promo.max_uses <= 0 OR p_promo.used_count < p_promo.max_uses)
    AND (cardinality(COALESCE(p_promo.tournament_ids, '{}')) = 0 OR p_tournament = ANY(p_promo.tournament_ids));
$$;

CREATE OR REPLACE FUNCTION public.validate_promo_code(p_code TEXT, p_tournament UUID)
RETURNS TABLE(valid BOOLEAN, promo_id UUID, code TEXT, discount_type TEXT, discount_value INT, error_code TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.promo_codes;
BEGIN
  SELECT * INTO p FROM public.promo_codes WHERE upper(code) = upper(trim(p_code)) LIMIT 1;
  IF NOT FOUND THEN RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::text, NULL::int, 'INVALID'; RETURN; END IF;
  IF NOT p.active THEN RETURN QUERY SELECT false,p.id,p.code,p.discount_type,p.discount_value,'INACTIVE'; RETURN; END IF;
  IF p.starts_at IS NOT NULL AND p.starts_at > NOW() THEN RETURN QUERY SELECT false,p.id,p.code,p.discount_type,p.discount_value,'NOT_STARTED'; RETURN; END IF;
  IF p.expires_at IS NOT NULL AND p.expires_at <= NOW() THEN RETURN QUERY SELECT false,p.id,p.code,p.discount_type,p.discount_value,'EXPIRED'; RETURN; END IF;
  IF p.max_uses IS NOT NULL AND p.max_uses > 0 AND p.used_count >= p.max_uses THEN RETURN QUERY SELECT false,p.id,p.code,p.discount_type,p.discount_value,'EXHAUSTED'; RETURN; END IF;
  IF cardinality(COALESCE(p.tournament_ids, '{}')) > 0 AND NOT p_tournament = ANY(p.tournament_ids) THEN RETURN QUERY SELECT false,p.id,p.code,p.discount_type,p.discount_value,'TOURNAMENT'; RETURN; END IF;
  RETURN QUERY SELECT true,p.id,p.code,p.discount_type,p.discount_value,NULL::text;
END; $$;

CREATE OR REPLACE FUNCTION public.register_tournament_with_promo(
  p_tournament UUID, p_player UUID, p_code TEXT DEFAULT NULL
) RETURNS TABLE(registration_id UUID, original_price INT, discount_amount INT, final_price INT, promo_id UUID, promo_code TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t public.tournaments; p public.promo_codes; r public.tournament_players; d INT := 0; final INT; code_clean TEXT := NULLIF(upper(trim(COALESCE(p_code,''))), '');
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_player THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  SELECT * INTO t FROM public.tournaments WHERE id = p_tournament FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'TOURNAMENT_NOT_FOUND'; END IF;
  IF t.status <> 'OUVERT' THEN RAISE EXCEPTION 'TOURNAMENT_CLOSED'; END IF;
  IF (SELECT COUNT(*) FROM public.tournament_players WHERE tournament_id=p_tournament AND status <> 'ANNULE') >= t.max_players THEN RAISE EXCEPTION 'TOURNAMENT_FULL'; END IF;
  IF EXISTS (SELECT 1 FROM public.tournament_players WHERE tournament_id=p_tournament AND player_id=p_player) THEN RAISE EXCEPTION 'ALREADY_REGISTERED'; END IF;
  IF code_clean IS NOT NULL THEN
    SELECT * INTO p FROM public.promo_codes WHERE upper(code)=code_clean FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'PROMO_INVALID'; END IF;
    IF NOT public.is_promo_usable(p,p_tournament) THEN RAISE EXCEPTION 'PROMO_UNAVAILABLE'; END IF;
    IF p.discount_type='percent' THEN d := LEAST(t.entry_fee, ROUND(t.entry_fee*p.discount_value/100.0)::int); ELSE d := LEAST(t.entry_fee, GREATEST(0,p.discount_value)); END IF;
  END IF;
  final := GREATEST(0,t.entry_fee-d);
  INSERT INTO public.tournament_players(tournament_id,player_id,status,is_paid,original_entry_fee,discount_amount,final_entry_fee,promo_code_id,promo_code)
  VALUES(p_tournament,p_player,'EN_ATTENTE_PAIEMENT',false,t.entry_fee,d,final,CASE WHEN p.id IS NULL THEN NULL ELSE p.id END,CASE WHEN p.id IS NULL THEN NULL ELSE p.code END)
  RETURNING * INTO r;
  IF p.id IS NOT NULL THEN
    UPDATE public.promo_codes SET used_count=used_count+1, updated_at=NOW() WHERE id=p.id;
    INSERT INTO public.promo_code_usages(promo_code_id,user_id,tournament_id,discount_applied,original_price,final_price)
    VALUES(p.id,p_player,p_tournament,d,t.entry_fee,final);
  END IF;
  RETURN QUERY SELECT r.id,t.entry_fee,d,final,p.id,p.code;
END; $$;

-- Bracket: stockage JSON + génération SQL simple pour tout nombre >=2
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS bracket_generated_at TIMESTAMPTZ;

-- Anti-absence serveur
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS no_show_deadline TIMESTAMPTZ;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS absence_status TEXT NOT NULL DEFAULT 'NONE' CHECK (absence_status IN ('NONE','PENDING','UNDER_REVIEW','APPROVED','REJECTED','EXTENDED','CANCELLED'));
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS absence_deadline_at TIMESTAMPTZ;

-- Notifications destinations structurées
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS related_id UUID;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS related_type TEXT;

-- RLS promos strictes
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "promo_codes_public_read" ON public.promo_codes;
DROP POLICY IF EXISTS "promo_codes_admin_all" ON public.promo_codes;
CREATE POLICY "promo_codes_public_read" ON public.promo_codes FOR SELECT USING (active = true);
CREATE POLICY "promo_codes_admin_all" ON public.promo_codes FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
ALTER TABLE public.promo_code_usages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "promo_usages_all" ON public.promo_code_usages;
CREATE POLICY "promo_usages_select_own_or_staff" ON public.promo_code_usages FOR SELECT USING (user_id=auth.uid() OR public.is_staff());


-- RLS match absence
ALTER TABLE public.match_absence_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "absence_reports_insert" ON public.match_absence_reports;
CREATE POLICY "absence_reports_insert" ON public.match_absence_reports FOR INSERT WITH CHECK (
  reporter_id=auth.uid() AND EXISTS (SELECT 1 FROM public.matches m WHERE m.id=match_id AND (m.player1_id=auth.uid() OR m.player2_id=auth.uid() OR m.player_a_id=auth.uid() OR m.player_b_id=auth.uid()))
);
DROP POLICY IF EXISTS "absence_reports_update_admin" ON public.match_absence_reports;
CREATE POLICY "absence_reports_update_admin" ON public.match_absence_reports FOR UPDATE USING (public.is_staff()) WITH CHECK (public.is_staff());

-- Storage sécurisé par dossier utilisateur
DROP POLICY IF EXISTS "avatars_auth_upload" ON storage.objects;
CREATE POLICY "avatars_auth_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id='avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "avatars_auth_update" ON storage.objects;
CREATE POLICY "avatars_auth_update" ON storage.objects FOR UPDATE USING (bucket_id='avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "avatars_auth_delete" ON storage.objects;
CREATE POLICY "avatars_auth_delete" ON storage.objects FOR DELETE USING (bucket_id='avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "tournament_proofs_auth_upload" ON storage.objects;
CREATE POLICY "tournament_proofs_auth_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id='tournament_proofs' AND auth.role()='authenticated' AND auth.uid()::text = (storage.foldername(name))[2]);
DROP POLICY IF EXISTS "tournament_proofs_auth_delete" ON storage.objects;
CREATE POLICY "tournament_proofs_auth_delete" ON storage.objects FOR DELETE USING (bucket_id='tournament_proofs' AND auth.uid()::text = (storage.foldername(name))[2]);

-- Index utiles
CREATE INDEX IF NOT EXISTS idx_tournament_players_promo ON public.tournament_players(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_matches_no_show_deadline ON public.matches(no_show_deadline) WHERE no_show_deadline IS NOT NULL;


-- Génération atomique d'un bracket simple élimination pour 2..128 joueurs payés.
CREATE OR REPLACE FUNCTION public.generate_tournament_bracket(p_tournament UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  t public.tournaments; n INT; slots INT := 1; rounds INT := 0; r INT; m INT; total INT; a UUID; b UUID; match_ids UUID[] := '{}'; ids UUID[]; mid UUID; next_id UUID; payload JSONB := '[]'::jsonb;
BEGIN
  IF NOT public.is_staff() THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  SELECT * INTO t FROM public.tournaments WHERE id=p_tournament FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'TOURNAMENT_NOT_FOUND'; END IF;
  SELECT array_agg(tp.player_id ORDER BY tp.seed NULLS LAST, tp.joined_at, tp.id), count(*) INTO ids,n FROM public.tournament_players tp WHERE tp.tournament_id=p_tournament AND tp.is_paid=true AND tp.status IN ('INSCRIT','QUALIFIE','VAINQUEUR');
  IF n IS NULL OR n < 2 THEN RAISE EXCEPTION 'NOT_ENOUGH_PLAYERS'; END IF;
  IF n > t.max_players THEN RAISE EXCEPTION 'TOO_MANY_PLAYERS'; END IF;
  WHILE slots < n LOOP slots := slots*2; rounds := rounds+1; END LOOP;
  DELETE FROM public.matches WHERE tournament_id=p_tournament;
  total := slots/2;
  -- première passe : tous les matchs avec IDs connus
  FOR r IN 1..rounds LOOP
    FOR m IN 1..(slots/(2^r)) LOOP
      INSERT INTO public.matches(tournament_id,round_number,round_name,match_number,status,type)
      VALUES(p_tournament,r,CASE WHEN r=rounds THEN 'FINALE' WHEN r=rounds-1 THEN 'DEMI-FINALE' WHEN r=rounds-2 THEN 'QUART-FINALE' ELSE 'TOUR '||r END,m,'A_VENIR','TOURNOI') RETURNING id INTO mid;
      match_ids := array_append(match_ids,mid);
    END LOOP;
  END LOOP;
  -- liens vers le tour suivant
  FOR r IN 1..rounds-1 LOOP
    FOR m IN 1..(slots/(2^r)) LOOP
      SELECT id INTO mid FROM public.matches WHERE tournament_id=p_tournament AND round_number=r AND match_number=m;
      SELECT id INTO next_id FROM public.matches WHERE tournament_id=p_tournament AND round_number=r+1 AND match_number=((m+1)/2);
      UPDATE public.matches SET next_match_id=next_id,next_match_slot=CASE WHEN mod(m,2)=1 THEN 'player1' ELSE 'player2' END WHERE id=mid;
    END LOOP;
  END LOOP;
  -- joueurs du premier tour + byes
  FOR m IN 1..(slots/2) LOOP
    a := CASE WHEN 2*m-1 <= n THEN ids[2*m-1] ELSE NULL END;
    b := CASE WHEN 2*m <= n THEN ids[2*m] ELSE NULL END;
    SELECT id INTO mid FROM public.matches WHERE tournament_id=p_tournament AND round_number=1 AND match_number=m;
    UPDATE public.matches SET player1_id=a,player2_id=b,status=CASE WHEN a IS NOT NULL AND b IS NOT NULL THEN 'A_VENIR' ELSE 'TERMINE' END,winner_id=CASE WHEN a IS NULL THEN b WHEN b IS NULL THEN a ELSE NULL END,finished_at=CASE WHEN (a IS NULL OR b IS NULL) THEN NOW() ELSE NULL END WHERE id=mid;
  END LOOP;
  -- propager les byes jusqu'à obtenir le premier tour jouable
  FOR r IN 1..rounds-1 LOOP
    FOR m IN 1..(slots/(2^(r+1))) LOOP
      DECLARE p1 UUID; p2 UUID; cur UUID; c1 UUID; c2 UUID;
      BEGIN
        SELECT id INTO cur FROM public.matches WHERE tournament_id=p_tournament AND round_number=r+1 AND match_number=m;
        SELECT winner_id INTO c1 FROM public.matches WHERE tournament_id=p_tournament AND round_number=r AND match_number=(m*2-1);
        SELECT winner_id INTO c2 FROM public.matches WHERE tournament_id=p_tournament AND round_number=r AND match_number=(m*2);
        UPDATE public.matches SET player1_id=COALESCE(player1_id,c1),player2_id=COALESCE(player2_id,c2),status=CASE WHEN COALESCE(player1_id,c1) IS NOT NULL AND COALESCE(player2_id,c2) IS NOT NULL THEN 'A_VENIR' WHEN COALESCE(player1_id,c1) IS NOT NULL OR COALESCE(player2_id,c2) IS NOT NULL THEN 'TERMINE' ELSE 'A_VENIR' END,winner_id=CASE WHEN COALESCE(player1_id,c1) IS NULL THEN COALESCE(player2_id,c2) WHEN COALESCE(player2_id,c2) IS NULL THEN COALESCE(player1_id,c1) ELSE winner_id END,finished_at=CASE WHEN ((COALESCE(player1_id,c1) IS NULL) <> (COALESCE(player2_id,c2) IS NULL)) THEN NOW() ELSE finished_at END WHERE id=cur;
      END;
    END LOOP;
  END LOOP;
  SELECT jsonb_agg(to_jsonb(x) ORDER BY round_number,match_number) INTO payload FROM (SELECT id,tournament_id,round_number,round_name,match_number,player1_id,player2_id,winner_id,status,next_match_id,next_match_slot FROM public.matches WHERE tournament_id=p_tournament ORDER BY round_number,match_number) x;
  UPDATE public.tournaments SET bracket_data=COALESCE(payload,'[]'::jsonb),bracket_generated_at=NOW() WHERE id=p_tournament;
  RETURN COALESCE(payload,'[]'::jsonb);
END; $$;

CREATE OR REPLACE FUNCTION public.resolve_match_result(p_match UUID,p_score1 INT,p_score2 INT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE m public.matches; winner UUID; loser UUID; nxt public.matches; slot TEXT;
BEGIN
  SELECT * INTO m FROM public.matches WHERE id=p_match FOR UPDATE;
  IF NOT FOUND OR m.player1_id IS NULL OR m.player2_id IS NULL THEN RAISE EXCEPTION 'MATCH_INVALID'; END IF;
  IF auth.uid() <> m.player1_id AND auth.uid() <> m.player2_id AND NOT public.is_staff() THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  IF p_score1 = p_score2 THEN RAISE EXCEPTION 'DRAW_NOT_ALLOWED'; END IF;
  winner := CASE WHEN p_score1>p_score2 THEN m.player1_id ELSE m.player2_id END; loser := CASE WHEN winner=m.player1_id THEN m.player2_id ELSE m.player1_id END;
  UPDATE public.matches SET score_player1=p_score1,score_player2=p_score2,winner_id=winner,loser_id=loser,status='TERMINE',finished_at=NOW() WHERE id=p_match;
  IF m.next_match_id IS NOT NULL THEN
    SELECT * INTO nxt FROM public.matches WHERE id=m.next_match_id FOR UPDATE;
    IF m.next_match_slot='player1' THEN UPDATE public.matches SET player1_id=winner WHERE id=nxt.id; ELSE UPDATE public.matches SET player2_id=winner WHERE id=nxt.id; END IF;
    UPDATE public.matches SET status=CASE WHEN player1_id IS NOT NULL AND player2_id IS NOT NULL THEN 'A_VENIR' ELSE status END WHERE id=nxt.id;
  ELSE
    UPDATE public.tournaments SET status='TERMINE',winner_id=winner,end_date=COALESCE(end_date,NOW()) WHERE id=m.tournament_id;
  END IF;
  RETURN true;
END; $$;

-- 1V1 : créer un vrai match seulement après confirmation des deux paiements.
CREATE UNIQUE INDEX IF NOT EXISTS uq_matches_challenge ON public.matches(challenge_id) WHERE challenge_id IS NOT NULL;
CREATE OR REPLACE FUNCTION public.confirm_1v1_payments(p_challenge UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.challenges_1v1; mid UUID; deadline TIMESTAMPTZ;
BEGIN
  IF NOT public.is_staff() THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  SELECT * INTO c FROM public.challenges_1v1 WHERE id=p_challenge FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'CHALLENGE_NOT_FOUND'; END IF;
  IF NOT (c.paiement_challenger AND c.paiement_challenged) THEN RAISE EXCEPTION 'BOTH_PAYMENTS_REQUIRED'; END IF;
  deadline := CASE WHEN c.date_match IS NOT NULL THEN (c.date_match::text || ' ' || COALESCE(c.heure_match,'00:00:00'))::timestamp AT TIME ZONE 'Africa/Abidjan' + INTERVAL '30 minutes' ELSE NOW()+INTERVAL '30 minutes' END;
  UPDATE public.challenges_1v1 SET paiement_confirme_admin=true,statut='CONFIRME',updated_at=NOW() WHERE id=p_challenge;
  SELECT id INTO mid FROM public.matches WHERE challenge_id=p_challenge LIMIT 1;
  IF mid IS NULL THEN
    INSERT INTO public.matches(challenge_id,type,round_number,round_name,match_number,player1_id,player2_id,status,scheduled_at,window_start,window_end,no_show_deadline,absence_deadline_at,status_detail)
    VALUES(p_challenge,'1V1',1,'1V1',1,c.challenger_id,c.challenged_id,'A_VENIR',deadline-INTERVAL '30 minutes',deadline-INTERVAL '30 minutes',deadline,deadline,deadline,'Match prêt après validation des deux paiements') RETURNING id INTO mid;
    INSERT INTO public.notifications(user_id,type,title,message,link,related_id,related_type) VALUES
      (c.challenger_id,'DEFI_ACCEPTE','🎮 Match 1V1 prêt','Les deux paiements sont validés. Ton salon de match est disponible.', '/matches/'||mid::text,mid,'match'),
      (c.challenged_id,'DEFI_ACCEPTE','🎮 Match 1V1 prêt','Les deux paiements sont validés. Ton salon de match est disponible.', '/matches/'||mid::text,mid,'match');
  END IF;
  RETURN mid;
END; $$;
ALTER TABLE public.challenges_1v1 ADD COLUMN IF NOT EXISTS match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_challenges_match ON public.challenges_1v1(match_id);
CREATE OR REPLACE FUNCTION public.confirm_1v1_payments(p_challenge UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.challenges_1v1; mid UUID; deadline TIMESTAMPTZ;
BEGIN
  IF NOT public.is_staff() THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  SELECT * INTO c FROM public.challenges_1v1 WHERE id=p_challenge FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'CHALLENGE_NOT_FOUND'; END IF;
  IF NOT (c.paiement_challenger AND c.paiement_challenged) THEN RAISE EXCEPTION 'BOTH_PAYMENTS_REQUIRED'; END IF;
  deadline := CASE WHEN c.date_match IS NOT NULL THEN (c.date_match::text || ' ' || COALESCE(c.heure_match,'00:00:00'))::timestamp AT TIME ZONE 'Africa/Abidjan' + INTERVAL '30 minutes' ELSE NOW()+INTERVAL '30 minutes' END;
  SELECT id INTO mid FROM public.matches WHERE challenge_id=p_challenge LIMIT 1;
  IF mid IS NULL THEN
    INSERT INTO public.matches(challenge_id,type,round_number,round_name,match_number,player1_id,player2_id,status,scheduled_at,window_start,window_end,no_show_deadline,absence_deadline_at,status_detail)
    VALUES(p_challenge,'1V1',1,'1V1',1,c.challenger_id,c.challenged_id,'A_VENIR',deadline-INTERVAL '30 minutes',deadline-INTERVAL '30 minutes',deadline,deadline,deadline,'Match prêt après validation des deux paiements') RETURNING id INTO mid;
    INSERT INTO public.notifications(user_id,type,title,message,link,related_id,related_type) VALUES
      (c.challenger_id,'DEFI_ACCEPTE','🎮 Match 1V1 prêt','Les deux paiements sont validés. Ton salon de match est disponible.', '/matches/'||mid::text,mid,'match'),
      (c.challenged_id,'DEFI_ACCEPTE','🎮 Match 1V1 prêt','Les deux paiements sont validés. Ton salon de match est disponible.', '/matches/'||mid::text,mid,'match');
  END IF;
  UPDATE public.challenges_1v1 SET paiement_confirme_admin=true,statut='CONFIRME',match_id=mid,updated_at=NOW() WHERE id=p_challenge;
  RETURN mid;
END; $$;

CREATE OR REPLACE FUNCTION public.sync_tournament_capacity() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c INT; cap INT; BEGIN SELECT max_players INTO cap FROM public.tournaments WHERE id=COALESCE(NEW.tournament_id,OLD.tournament_id); SELECT COUNT(*) INTO c FROM public.tournament_players WHERE tournament_id=COALESCE(NEW.tournament_id,OLD.tournament_id) AND status<>'ANNULE'; UPDATE public.tournaments SET status=CASE WHEN c>=cap THEN 'COMPLET' WHEN status='COMPLET' THEN 'OUVERT' ELSE status END WHERE id=COALESCE(NEW.tournament_id,OLD.tournament_id); IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF; END; $$;
DROP TRIGGER IF EXISTS trg_sync_tournament_capacity ON public.tournament_players;
CREATE TRIGGER trg_sync_tournament_capacity AFTER INSERT OR UPDATE OR DELETE ON public.tournament_players FOR EACH ROW EXECUTE FUNCTION public.sync_tournament_capacity();

-- Les preuves de paiement sont privées. L'admin les consulte via URL signée.
UPDATE storage.buckets SET public=false WHERE id='tournament_proofs';
DROP POLICY IF EXISTS "tournament_proofs_public_read" ON storage.objects;
CREATE POLICY "tournament_proofs_read_own_or_staff" ON storage.objects FOR SELECT USING (
  bucket_id='tournament_proofs' AND (public.is_staff() OR auth.uid()::text=(storage.foldername(name))[2])
);

-- Re-synchronise le JSON de bracket après chaque résultat validé.
CREATE OR REPLACE FUNCTION public.sync_bracket_json(p_tournament UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE payload JSONB;
BEGIN
  SELECT jsonb_agg(to_jsonb(x) ORDER BY round_number,match_number) INTO payload FROM (SELECT id,tournament_id,round_number,round_name,match_number,player1_id,player2_id,winner_id,score_player1,score_player2,status,next_match_id,next_match_slot FROM public.matches WHERE tournament_id=p_tournament AND type='TOURNOI') x;
  UPDATE public.tournaments SET bracket_data=COALESCE(payload,'[]'::jsonb),bracket_generated_at=NOW() WHERE id=p_tournament;
END; $$;
CREATE OR REPLACE FUNCTION public.sync_tournament_bracket_after_match() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN IF COALESCE(NEW.type,'')='TOURNOI' AND NEW.tournament_id IS NOT NULL THEN PERFORM public.sync_bracket_json(NEW.tournament_id); END IF; RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_sync_tournament_bracket ON public.matches;
CREATE TRIGGER trg_sync_tournament_bracket AFTER UPDATE OF player1_id,player2_id,winner_id,score_player1,score_player2,status ON public.matches FOR EACH ROW EXECUTE FUNCTION public.sync_tournament_bracket_after_match();

-- Empêche un joueur de modifier directement vainqueur / scores / statut final.
CREATE OR REPLACE FUNCTION public.guard_match_sensitive_updates() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_staff() THEN
    IF NEW.winner_id IS DISTINCT FROM OLD.winner_id OR NEW.loser_id IS DISTINCT FROM OLD.loser_id OR NEW.score_player1 IS DISTINCT FROM OLD.score_player1 OR NEW.score_player2 IS DISTINCT FROM OLD.score_player2 OR NEW.finished_at IS DISTINCT FROM OLD.finished_at OR NEW.is_contested IS DISTINCT FROM OLD.is_contested THEN
      RAISE EXCEPTION 'MATCH_RESULT_SERVER_ONLY';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_guard_match_sensitive_updates ON public.matches;
CREATE TRIGGER trg_guard_match_sensitive_updates BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.guard_match_sensitive_updates();

CREATE OR REPLACE FUNCTION public.submit_match_result(p_match UUID,p_score1 INT,p_score2 INT,p_proof_url TEXT DEFAULT NULL)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE m public.matches; decl JSONB; arr JSONB; confirmed BOOLEAN; win UUID; lose UUID;
BEGIN
  SELECT * INTO m FROM public.matches WHERE id=p_match FOR UPDATE;
  IF NOT FOUND OR auth.uid() IS NULL OR (auth.uid()<>m.player1_id AND auth.uid()<>m.player2_id AND NOT public.is_staff()) THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  IF p_score1<0 OR p_score2<0 OR p_score1=p_score2 THEN RAISE EXCEPTION 'INVALID_SCORE'; END IF;
  decl=jsonb_build_object('playerId',auth.uid(),'playerUsername',(SELECT username FROM public.profiles WHERE id=auth.uid()),'scoreA',p_score1,'scoreB',p_score2,'captureUrl',p_proof_url,'declaredAt',NOW());
  arr=(SELECT COALESCE(jsonb_agg(x), '[]'::jsonb) FROM jsonb_array_elements(COALESCE(m.result_declarations,'[]'::jsonb)) x WHERE x->>'playerId' <> auth.uid()::text);
  arr=arr || jsonb_build_array(decl); confirmed=jsonb_array_length(arr)>=2 AND (arr->0->>'scoreA')=(arr->1->>'scoreA') AND (arr->0->>'scoreB')=(arr->1->>'scoreB');
  IF confirmed THEN win=CASE WHEN p_score1>p_score2 THEN m.player1_id ELSE m.player2_id END; lose=CASE WHEN win=m.player1_id THEN m.player2_id ELSE m.player1_id END; END IF;
  UPDATE public.matches SET result_declarations=arr,status=CASE WHEN confirmed THEN 'TERMINE' ELSE CASE WHEN jsonb_array_length(arr)>=2 THEN 'CONTESTE' ELSE 'RESULTAT_EN_ATTENTE' END END,score_player1=CASE WHEN confirmed THEN p_score1 ELSE score_player1 END,score_player2=CASE WHEN confirmed THEN p_score2 ELSE score_player2 END,final_score_a=CASE WHEN confirmed THEN p_score1 ELSE NULL END,final_score_b=CASE WHEN confirmed THEN p_score2 ELSE NULL END,winner_id=CASE WHEN confirmed THEN win ELSE NULL END,loser_id=CASE WHEN confirmed THEN lose ELSE NULL END,finished_at=CASE WHEN confirmed THEN NOW() ELSE NULL END WHERE id=p_match;
  RETURN CASE WHEN confirmed THEN 'CONFIRMED' ELSE CASE WHEN jsonb_array_length(arr)>=2 THEN 'CONTESTED' ELSE 'WAITING' END END;
END; $$;
CREATE OR REPLACE FUNCTION public.guard_match_sensitive_updates() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_staff() AND current_setting('joyboy.server_operation', true) IS DISTINCT FROM 'true' THEN
    IF NEW.winner_id IS DISTINCT FROM OLD.winner_id OR NEW.loser_id IS DISTINCT FROM OLD.loser_id OR NEW.score_player1 IS DISTINCT FROM OLD.score_player1 OR NEW.score_player2 IS DISTINCT FROM OLD.score_player2 OR NEW.finished_at IS DISTINCT FROM OLD.finished_at OR NEW.is_contested IS DISTINCT FROM OLD.is_contested THEN
      RAISE EXCEPTION 'MATCH_RESULT_SERVER_ONLY';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE OR REPLACE FUNCTION public.submit_match_result(p_match UUID,p_score1 INT,p_score2 INT,p_proof_url TEXT DEFAULT NULL)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE m public.matches; decl JSONB; arr JSONB; confirmed BOOLEAN; win UUID; lose UUID;
BEGIN
  SELECT * INTO m FROM public.matches WHERE id=p_match FOR UPDATE;
  IF NOT FOUND OR auth.uid() IS NULL OR (auth.uid()<>m.player1_id AND auth.uid()<>m.player2_id AND NOT public.is_staff()) THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  IF p_score1<0 OR p_score2<0 OR p_score1=p_score2 THEN RAISE EXCEPTION 'INVALID_SCORE'; END IF;
  PERFORM set_config('joyboy.server_operation','true',true);
  decl=jsonb_build_object('playerId',auth.uid(),'playerUsername',(SELECT username FROM public.profiles WHERE id=auth.uid()),'scoreA',p_score1,'scoreB',p_score2,'captureUrl',p_proof_url,'declaredAt',NOW());
  arr=(SELECT COALESCE(jsonb_agg(x), '[]'::jsonb) FROM jsonb_array_elements(COALESCE(m.result_declarations,'[]'::jsonb)) x WHERE x->>'playerId' <> auth.uid()::text);
  arr=arr || jsonb_build_array(decl); confirmed=jsonb_array_length(arr)>=2 AND (arr->0->>'scoreA')=(arr->1->>'scoreA') AND (arr->0->>'scoreB')=(arr->1->>'scoreB');
  IF confirmed THEN win=CASE WHEN p_score1>p_score2 THEN m.player1_id ELSE m.player2_id END; lose=CASE WHEN win=m.player1_id THEN m.player2_id ELSE m.player1_id END; END IF;
  UPDATE public.matches SET result_declarations=arr,status=CASE WHEN confirmed THEN 'TERMINE' ELSE CASE WHEN jsonb_array_length(arr)>=2 THEN 'CONTESTE' ELSE 'RESULTAT_EN_ATTENTE' END END,score_player1=CASE WHEN confirmed THEN p_score1 ELSE score_player1 END,score_player2=CASE WHEN confirmed THEN p_score2 ELSE score_player2 END,final_score_a=CASE WHEN confirmed THEN p_score1 ELSE NULL END,final_score_b=CASE WHEN confirmed THEN p_score2 ELSE NULL END,winner_id=CASE WHEN confirmed THEN win ELSE NULL END,loser_id=CASE WHEN confirmed THEN lose ELSE NULL END,finished_at=CASE WHEN confirmed THEN NOW() ELSE NULL END WHERE id=p_match;
  RETURN CASE WHEN confirmed THEN 'CONFIRMED' ELSE CASE WHEN jsonb_array_length(arr)>=2 THEN 'CONTESTED' ELSE 'WAITING' END END;
END; $$;
