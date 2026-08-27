
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='profiles') THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles; END IF; END $$;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Abidjan';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS efootball_pseudo TEXT;
