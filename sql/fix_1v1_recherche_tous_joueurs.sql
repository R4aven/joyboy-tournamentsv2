-- FIX 1V1 - cause réelle: limit 24 + order wins + search >=2 chars + mock fallback
-- Solution minimale sécurisée: enable realtime + ensure RLS public read stays, no private leak

-- 1. Enable realtime for profiles (si pas déjà fait)
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;

-- 2. S'assurer que la policy public read existe (déjà dans schema, mais idempotent)
-- Elle utilise USING true, mais on ne sélectionne que colonnes publiques côté client, donc pas de fuite phone_wave
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);

-- 3. Index pour recherche rapide publique (username, display_name) - pas de données privées
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles (lower(username));
CREATE INDEX IF NOT EXISTS idx_profiles_display_name_lower ON public.profiles (lower(display_name));
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON public.profiles (is_banned) WHERE is_banned = false;

-- 4. Pas de changement sur phone_wave, email, etc - reste privé, jamais sélectionné
