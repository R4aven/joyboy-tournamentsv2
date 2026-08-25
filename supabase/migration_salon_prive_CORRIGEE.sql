-- 🇨🇮 JOYBOY - SALON PRIVÉ SÉCURISÉ - VERSION CORRIGÉE COMPATIBLE player1_id/player2_id

CREATE TABLE IF NOT EXISTS public.match_salons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  salon_id TEXT NOT NULL,
  salon_code TEXT,
  salon_instructions TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(match_id)
);

CREATE INDEX IF NOT EXISTS idx_match_salons_match ON public.match_salons(match_id);
ALTER TABLE public.match_salons ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "match_salons_select" ON public.match_salons;
CREATE POLICY "match_salons_select" ON public.match_salons FOR SELECT USING (
  public.is_match_participant_secure(match_id) OR public.is_staff()
);
DROP POLICY IF EXISTS "match_salons_insert" ON public.match_salons;
CREATE POLICY "match_salons_insert" ON public.match_salons FOR INSERT WITH CHECK (
  public.is_match_participant_secure(match_id) OR public.is_staff()
);
DROP POLICY IF EXISTS "match_salons_update" ON public.match_salons;
CREATE POLICY "match_salons_update" ON public.match_salons FOR UPDATE USING (
  public.is_match_participant_secure(match_id) OR public.is_staff()
);
DROP POLICY IF EXISTS "match_salons_delete" ON public.match_salons;
CREATE POLICY "match_salons_delete" ON public.match_salons FOR DELETE USING (public.is_staff());

CREATE OR REPLACE FUNCTION public.get_salon_for_match(p_match_id UUID)
RETURNS TABLE (id UUID, match_id UUID, salon_id TEXT, salon_code TEXT, salon_instructions TEXT, created_by UUID, created_at TIMESTAMPTZ) AS $$
BEGIN
  IF NOT (public.is_match_participant_secure(p_match_id) OR public.is_staff()) THEN
    RETURN;
  END IF;
  RETURN QUERY SELECT ms.id, ms.match_id, ms.salon_id, ms.salon_code, ms.salon_instructions, ms.created_by, ms.created_at FROM public.match_salons ms WHERE ms.match_id = p_match_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;