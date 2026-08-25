-- 🇨🇮 JOYBOY TOURNAMENTS - SALON EFOOTBALL PRIVÉ SÉCURISÉ
-- Chaque rencontre JOYBOY doit utiliser un salon eFootball privé réservé exclusivement aux deux joueurs concernés.
-- Les informations de connexion ne doivent jamais être visibles publiquement.

-- ==========================
-- TABLE match_salons - INFOS PRIVÉES SÉPARÉES
-- ==========================
CREATE TABLE IF NOT EXISTS public.match_salons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  salon_id TEXT NOT NULL, -- ID salon eFootball réel (ex: 883472)
  salon_code TEXT, -- code optionnel
  salon_instructions TEXT NOT NULL, -- ex: Rejoins en amical, cherche RavenCI
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(match_id)
);

CREATE INDEX IF NOT EXISTS idx_match_salons_match ON public.match_salons(match_id);
CREATE INDEX IF NOT EXISTS idx_match_salons_created_by ON public.match_salons(created_by);

DROP TRIGGER IF EXISTS set_updated_at_match_salons ON public.match_salons;
CREATE TRIGGER set_updated_at_match_salons BEFORE UPDATE ON public.match_salons FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==========================
-- RLS STRICTE - SEULEMENT 2 JOUEURS + ADMIN
-- ==========================
ALTER TABLE public.match_salons ENABLE ROW LEVEL SECURITY;

-- Helper: est participant du match ?
CREATE OR REPLACE FUNCTION public.is_match_participant_secure(p_match_id UUID) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.matches
    WHERE id = p_match_id
    AND (player_a_id = auth.uid() OR player_b_id = auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Policy SELECT: seulement participants + staff
DROP POLICY IF EXISTS "match_salons_select_participant_or_staff" ON public.match_salons;
CREATE POLICY "match_salons_select_participant_or_staff" ON public.match_salons FOR SELECT USING (
  public.is_match_participant_secure(match_id) OR public.is_staff()
);

-- Policy INSERT: participants + staff
DROP POLICY IF EXISTS "match_salons_insert_participant_or_staff" ON public.match_salons;
CREATE POLICY "match_salons_insert_participant_or_staff" ON public.match_salons FOR INSERT WITH CHECK (
  public.is_match_participant_secure(match_id) OR public.is_staff()
);

-- Policy UPDATE: participants + staff
DROP POLICY IF EXISTS "match_salons_update_participant_or_staff" ON public.match_salons;
CREATE POLICY "match_salons_update_participant_or_staff" ON public.match_salons FOR UPDATE USING (
  public.is_match_participant_secure(match_id) OR public.is_staff()
) WITH CHECK (
  public.is_match_participant_secure(match_id) OR public.is_staff()
);

-- Policy DELETE: staff only
DROP POLICY IF EXISTS "match_salons_delete_staff" ON public.match_salons;
CREATE POLICY "match_salons_delete_staff" ON public.match_salons FOR DELETE USING (public.is_staff());

-- ==========================
-- FONCTION SÉCURISÉE get_salon_for_match
-- ==========================
CREATE OR REPLACE FUNCTION public.get_salon_for_match(p_match_id UUID)
RETURNS TABLE (
  id UUID,
  match_id UUID,
  salon_id TEXT,
  salon_code TEXT,
  salon_instructions TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Vérifie autorisation
  IF NOT (public.is_match_participant_secure(p_match_id) OR public.is_staff()) THEN
    RETURN; -- retourne vide, pas d'accès
  END IF;
  
  RETURN QUERY
  SELECT ms.id, ms.match_id, ms.salon_id, ms.salon_code, ms.salon_instructions, ms.created_by, ms.created_at
  FROM public.match_salons ms
  WHERE ms.match_id = p_match_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==========================
-- CORRECTION matches table - RETIRER COLONNES PRIVÉES PUBLIQUES
-- ==========================
-- On garde matches table publique pour liste, mais salon info maintenant dans match_salons
-- Si colonnes salon_id etc existent dans matches, on les rend nullable et on ne les utilise plus pour affichage public
-- La sécurité est assurée par match_salons

-- Vue publique sans infos salon
CREATE OR REPLACE VIEW public.matches_public AS
SELECT 
  id, tournament_id, type, status, status_detail, bracket_round, scheduled_at,
  player_a_id, player_b_id,
  player_a_connected, player_b_connected, match_started_at,
  final_score_a, final_score_b, winner_id, loser_id, is_contested, contested_reason,
  validated_by_admin, validated_at, created_at, updated_at
FROM public.matches;

-- RLS pour matches reste: tout le monde peut voir liste (sans salon privé)
-- Salon privé uniquement via match_salons

-- ==========================
-- COMMENTAIRE SÉCURITÉ
-- ==========================
COMMENT ON TABLE public.match_salons IS '🔒 SALON EFOOTBALL PRIVÉ - Réservé exclusivement aux 2 joueurs concernés + admin. Chaque rencontre JOYBOY utilise un salon privé. Infos connexion jamais visibles publiquement. Pourquoi privé ? Pour éviter perturbation par autre joueur.';