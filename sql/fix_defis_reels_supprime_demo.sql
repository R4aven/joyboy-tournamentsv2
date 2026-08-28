-- FIX DEFI REEL - supprime mode demo et faux defis

-- Table challenges_1v1 REELLE (si pas existante)
CREATE TABLE IF NOT EXISTS public.challenges_1v1 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenged_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  statut TEXT NOT NULL DEFAULT 'EN_ATTENTE' CHECK (statut IN ('EN_ATTENTE','ACCEPTE','PAIEMENT_EN_COURS','PAIEMENT_PARTIEL','CONFIRME','EN_COURS','RESULTAT_EN_ATTENTE','TERMINE','CONTESTE','REFUSE','ANNULE')),
  date_match DATE,
  heure_match TEXT,
  reglement TEXT,
  message TEXT,
  paiement_challenger BOOLEAN NOT NULL DEFAULT FALSE,
  paiement_challenged BOOLEAN NOT NULL DEFAULT FALSE,
  preuve_challenger_url TEXT,
  preuve_challenged_url TEXT,
  paiement_confirme_admin BOOLEAN NOT NULL DEFAULT FALSE,
  declaration_challenger UUID,
  declaration_challenged UUID,
  gagnant_id UUID REFERENCES public.profiles(id),
  contestation_raison TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_not_self CHECK (challenger_id != challenged_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_challenges_1v1_challenger ON public.challenges_1v1(challenger_id);
CREATE INDEX IF NOT EXISTS idx_challenges_1v1_challenged ON public.challenges_1v1(challenged_id);
CREATE INDEX IF NOT EXISTS idx_challenges_1v1_statut ON public.challenges_1v1(statut);
CREATE INDEX IF NOT EXISTS idx_challenges_1v1_created ON public.challenges_1v1(created_at DESC);

-- RLS
ALTER TABLE public.challenges_1v1 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "challenges_1v1_select_own" ON public.challenges_1v1;
CREATE POLICY "challenges_1v1_select_own" ON public.challenges_1v1 FOR SELECT USING (
  challenger_id = auth.uid() OR challenged_id = auth.uid() OR public.is_staff()
);

DROP POLICY IF EXISTS "challenges_1v1_insert_own" ON public.challenges_1v1;
CREATE POLICY "challenges_1v1_insert_own" ON public.challenges_1v1 FOR INSERT WITH CHECK (
  challenger_id = auth.uid()
);

DROP POLICY IF EXISTS "challenges_1v1_update_own" ON public.challenges_1v1;
CREATE POLICY "challenges_1v1_update_own" ON public.challenges_1v1 FOR UPDATE USING (
  challenger_id = auth.uid() OR challenged_id = auth.uid() OR public.is_staff()
) WITH CHECK (
  challenger_id = auth.uid() OR challenged_id = auth.uid() OR public.is_staff()
);

DROP POLICY IF EXISTS "challenges_1v1_delete_own" ON public.challenges_1v1;
CREATE POLICY "challenges_1v1_delete_own" ON public.challenges_1v1 FOR DELETE USING (
  (challenger_id = auth.uid() AND statut = 'EN_ATTENTE') OR public.is_staff()
);

-- Updated_at trigger
DROP TRIGGER IF EXISTS set_updated_at_challenges_1v1 ON public.challenges_1v1;
CREATE TRIGGER set_updated_at_challenges_1v1 BEFORE UPDATE ON public.challenges_1v1 FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Realtime safe
DO $$
BEGIN
  ALTER TABLE public.challenges_1v1 REPLICA IDENTITY FULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges_1v1;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
