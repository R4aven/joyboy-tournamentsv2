
-- 🇨🇮 JOYBOY TOURNAMENTS - Migration Salon eFootball
-- IMPORTANT: JOYBOY organise seulement, pas d\'API eFootball. Les joueurs jouent réellement.
-- Infos salon PRIVÉES: visibles uniquement par les 2 joueurs + admin (RLS stricte)

-- ==========================
-- EXTENSION DES ENUMS (si besoin)
-- ==========================
DO $$
BEGIN
  -- Ajout des nouveaux statuts match si pas déjà existants via ALTER TYPE
  -- On crée un nouveau type pour le salon si besoin
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'match_salon_status') THEN
    CREATE TYPE match_salon_status AS ENUM (
      'PROGRAMME',
      'EN_ATTENTE_ADVERSAIRE',
      'SALON_CREE',
      'JOUEURS_CONNECTES',
      'MATCH_EN_COURS',
      'RESULTAT_EN_ATTENTE',
      'RESULTAT_CONFIRME',
      'CONTESTATION',
      'TERMINE'
    );
  END IF;
END $$;

-- ==========================
-- TABLE matches (peut être challenges ou matches existants)
-- On étend la table matches existante ou crée si elle n\'existe pas
-- ==========================
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT '1V1' CHECK (type IN ('TOURNOI','1V1')),
  status TEXT NOT NULL DEFAULT 'PROGRAMME' CHECK (status IN ('PROGRAMME','EN_ATTENTE_ADVERSAIRE','SALON_CREE','JOUEURS_CONNECTES','MATCH_EN_COURS','RESULTAT_EN_ATTENTE','RESULTAT_CONFIRME','CONTESTATION','TERMINE','A_VENIR','EN_COURS','RESULTAT_EN_ATTENTE','TERMINE','CONTESTE')),
  status_detail TEXT,
  bracket_round TEXT, -- QUARTS, DEMI, FINALE etc
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  player_a_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  player_b_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  -- Salon eFootball PRIVÉ - colonnes détaillées
  salon_id TEXT, -- ID salon/salle eFootball (ex: RavenCI_225)
  salon_code TEXT, -- code optionnel
  salon_instructions TEXT, -- ex: Rejoins en amical, cherche RavenCI
  salon_created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  salon_created_at TIMESTAMPTZ,
  salon_updated_at TIMESTAMPTZ,
  -- Connexion
  player_a_connected BOOLEAN NOT NULL DEFAULT FALSE,
  player_b_connected BOOLEAN NOT NULL DEFAULT FALSE,
  match_started_at TIMESTAMPTZ,
  -- Résultats
  result_declarations JSONB NOT NULL DEFAULT '[]'::jsonb, -- tableau de ResultDeclaration
  final_score_a INT,
  final_score_b INT,
  winner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  loser_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_contested BOOLEAN NOT NULL DEFAULT FALSE,
  contested_reason TEXT,
  validated_by_admin UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON public.matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_players ON public.matches(player_a_id, player_b_id);
CREATE INDEX IF NOT EXISTS idx_matches_salon_created_by ON public.matches(salon_created_by);
CREATE INDEX IF NOT EXISTS idx_matches_scheduled ON public.matches(scheduled_at);

-- Updated_at trigger
DROP TRIGGER IF EXISTS set_updated_at_matches ON public.matches;
CREATE TRIGGER set_updated_at_matches BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==========================
-- RLS STRICTE POUR SALON PRIVÉ
-- ==========================
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Helper: is participant ?
CREATE OR REPLACE FUNCTION public.is_match_participant(p_match_id UUID) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.matches
    WHERE id = p_match_id
    AND (player_a_id = auth.uid() OR player_b_id = auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Policy: tout le monde peut voir la liste des matches (sans infos salon sensibles)
DROP POLICY IF EXISTS "matches_select_all" ON public.matches;
CREATE POLICY "matches_select_all" ON public.matches FOR SELECT USING (true);

-- Mais pour update: seuls participants + admin peuvent modifier leur propre match
DROP POLICY IF EXISTS "matches_update_participant_or_staff" ON public.matches;
CREATE POLICY "matches_update_participant_or_staff" ON public.matches FOR UPDATE USING (
  player_a_id = auth.uid() OR player_b_id = auth.uid() OR public.is_staff()
) WITH CHECK (
  player_a_id = auth.uid() OR player_b_id = auth.uid() OR public.is_staff()
);

-- Insert: participants ou staff
DROP POLICY IF EXISTS "matches_insert_participant_or_staff" ON public.matches;
CREATE POLICY "matches_insert_participant_or_staff" ON public.matches FOR INSERT WITH CHECK (
  player_a_id = auth.uid() OR player_b_id = auth.uid() OR public.is_staff() OR auth.uid() IS NOT NULL
);

-- Delete: staff only
DROP POLICY IF EXISTS "matches_delete_staff" ON public.matches;
CREATE POLICY "matches_delete_staff" ON public.matches FOR DELETE USING (public.is_staff());

-- ==========================
-- VUE SÉCURISÉE POUR SALON PRIVÉ (filtrage applicatif aussi)
-- La vue expose salon seulement si viewer est participant ou admin
-- ==========================
CREATE OR REPLACE VIEW public.v_matches_with_salon_access AS
SELECT
  m.id,
  m.tournament_id,
  m.type,
  m.status,
  m.status_detail,
  m.bracket_round,
  m.scheduled_at,
  m.player_a_id,
  m.player_b_id,
  -- Salon visible uniquement si auth.uid() = participant ou staff, sinon NULL
  CASE WHEN (m.player_a_id = auth.uid() OR m.player_b_id = auth.uid() OR public.is_staff()) THEN m.salon_id ELSE NULL END AS salon_id,
  CASE WHEN (m.player_a_id = auth.uid() OR m.player_b_id = auth.uid() OR public.is_staff()) THEN m.salon_code ELSE NULL END AS salon_code,
  CASE WHEN (m.player_a_id = auth.uid() OR m.player_b_id = auth.uid() OR public.is_staff()) THEN m.salon_instructions ELSE NULL END AS salon_instructions,
  m.salon_created_by,
  m.salon_created_at,
  m.player_a_connected,
  m.player_b_connected,
  m.match_started_at,
  m.result_declarations,
  m.final_score_a,
  m.final_score_b,
  m.winner_id,
  m.loser_id,
  m.is_contested,
  m.contested_reason,
  m.validated_by_admin,
  m.validated_at,
  m.created_at,
  m.updated_at
FROM public.matches m;

-- ==========================
-- FONCTION RPC: création salon (sécurisée)
-- ==========================
CREATE OR REPLACE FUNCTION public.create_match_salon(
  p_match_id UUID,
  p_salon_id TEXT,
  p_salon_code TEXT DEFAULT '',
  p_instructions TEXT DEFAULT ''
) RETURNS JSONB AS $$
DECLARE
  v_match public.matches%ROWTYPE;
  v_is_participant BOOLEAN;
  v_is_staff BOOLEAN;
BEGIN
  SELECT * INTO v_match FROM public.matches WHERE id = p_match_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Match non trouvé'; END IF;

  v_is_staff := public.is_staff();
  v_is_participant := (v_match.player_a_id = auth.uid() OR v_match.player_b_id = auth.uid());

  IF NOT v_is_participant AND NOT v_is_staff THEN RAISE EXCEPTION 'Non autorisé: tu n\'es pas joueur de ce match'; END IF;
  IF v_match.salon_id IS NOT NULL THEN RAISE EXCEPTION 'Salon déjà créé'; END IF;
  IF length(p_salon_id) < 2 THEN RAISE EXCEPTION 'ID Salon obligatoire'; END IF;
  IF length(p_instructions) < 5 THEN RAISE EXCEPTION 'Instructions obligatoires'; END IF;

  UPDATE public.matches SET
    salon_id = p_salon_id,
    salon_code = p_salon_code,
    salon_instructions = p_instructions,
    salon_created_by = auth.uid(),
    salon_created_at = NOW(),
    status = 'SALON_CREE',
    status_detail = 'Salon créé par ' || auth.uid()::text,
    updated_at = NOW()
  WHERE id = p_match_id;

  RETURN jsonb_build_object('success', true, 'salon_id', p_salon_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==========================
-- FONCTION RPC: déclaration résultat
-- ==========================
CREATE OR REPLACE FUNCTION public.declare_match_result(
  p_match_id UUID,
  p_score_a INT,
  p_score_b INT,
  p_capture_url TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_match public.matches%ROWTYPE;
  v_decl JSONB;
  v_new_decls JSONB;
  v_is_participant BOOLEAN;
BEGIN
  SELECT * INTO v_match FROM public.matches WHERE id = p_match_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Match non trouvé'; END IF;
  v_is_participant := (v_match.player_a_id = auth.uid() OR v_match.player_b_id = auth.uid());
  IF NOT v_is_participant AND NOT public.is_staff() THEN RAISE EXCEPTION 'Non autorisé'; END IF;
  IF v_match.status NOT IN ('MATCH_EN_COURS','RESULTAT_EN_ATTENTE') THEN RAISE EXCEPTION 'Statut invalide pour déclarer: %', v_match.status; END IF;
  IF p_score_a < 0 OR p_score_b < 0 OR p_score_a > 20 OR p_score_b > 20 THEN RAISE EXCEPTION 'Score invalide'; END IF;

  v_decl := jsonb_build_object(
    'playerId', auth.uid(),
    'scoreA', p_score_a,
    'scoreB', p_score_b,
    'isVictory', CASE WHEN ( (auth.uid() = v_match.player_a_id AND p_score_a > p_score_b) OR (auth.uid() = v_match.player_b_id AND p_score_b > p_score_a) ) THEN true ELSE false END,
    'captureUrl', p_capture_url,
    'declaredAt', NOW()
  );

  -- Remove previous declaration from same player
  SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb) INTO v_new_decls FROM jsonb_array_elements(v_match.result_declarations) AS elem WHERE (elem->>'playerId')::uuid != auth.uid();
  v_new_decls := v_new_decls || jsonb_build_array(v_decl);

  -- Determine next status
  IF jsonb_array_length(v_new_decls) = 1 THEN
    UPDATE public.matches SET result_declarations = v_new_decls, status = 'RESULTAT_EN_ATTENTE', updated_at = NOW() WHERE id = p_match_id;
  ELSIF jsonb_array_length(v_new_decls) = 2 THEN
    -- Check concordance: both declarations same scores
    DECLARE
      d1 JSONB := v_new_decls->0;
      d2 JSONB := v_new_decls->1;
    BEGIN
      IF (d1->>'scoreA')::int = (d2->>'scoreA')::int AND (d1->>'scoreB')::int = (d2->>'scoreB')::int THEN
        -- auto confirm -> TERMINE
        UPDATE public.matches SET
          result_declarations = v_new_decls,
          status = 'TERMINE',
          final_score_a = (d1->>'scoreA')::int,
          final_score_b = (d1->>'scoreB')::int,
          winner_id = CASE WHEN (d1->>'scoreA')::int > (d1->>'scoreB')::int THEN v_match.player_a_id WHEN (d1->>'scoreB')::int > (d1->>'scoreA')::int THEN v_match.player_b_id ELSE NULL END,
          loser_id = CASE WHEN (d1->>'scoreA')::int > (d1->>'scoreB')::int THEN v_match.player_b_id WHEN (d1->>'scoreB')::int > (d1->>'scoreA')::int THEN v_match.player_a_id ELSE NULL END,
          is_contested = false,
          validated_at = NOW(),
          updated_at = NOW()
        WHERE id = p_match_id;
      ELSE
        UPDATE public.matches SET result_declarations = v_new_decls, status = 'CONTESTATION', is_contested = true, contested_reason = 'Déclarations différentes', updated_at = NOW() WHERE id = p_match_id;
      END IF;
    END;
  END IF;

  RETURN jsonb_build_object('success', true, 'declarations', v_new_decls);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==========================
-- STORAGE POUR CAPTURES (bucket match-captures)
-- ==========================
INSERT INTO storage.buckets (id, name, public) VALUES ('match-captures', 'match-captures', false) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "match_captures_select_participant_or_staff" ON storage.objects;
CREATE POLICY "match_captures_select_participant_or_staff" ON storage.objects FOR SELECT USING (
  bucket_id = 'match-captures' AND (public.is_staff() OR auth.uid() IS NOT NULL)
);

DROP POLICY IF EXISTS "match_captures_insert_auth" ON storage.objects;
CREATE POLICY "match_captures_insert_auth" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'match-captures' AND auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS "match_captures_delete_staff" ON storage.objects;
CREATE POLICY "match_captures_delete_staff" ON storage.objects FOR DELETE USING (
  bucket_id = 'match-captures' AND public.is_staff()
);

-- ==========================
-- COMMENTAIRES / DOC
-- ==========================
COMMENT ON COLUMN public.matches.salon_id IS 'PRIVÉ: ID salon eFootball visible uniquement par 2 joueurs + admin (RLS)';
COMMENT ON COLUMN public.matches.salon_code IS 'PRIVÉ: code connexion';
COMMENT ON COLUMN public.matches.salon_instructions IS 'PRIVÉ: instructions pour rejoindre';
COMMENT ON COLUMN public.matches.result_declarations IS 'JSONB tableau ResultDeclaration: {playerId, scoreA, scoreB, isVictory, captureUrl, declaredAt}';

-- Fin migration JOYBOY eFootball salon réel
