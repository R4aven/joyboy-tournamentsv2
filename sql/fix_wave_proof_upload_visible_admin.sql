
-- Colonne preuve Wave
ALTER TABLE public.tournament_players ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;
ALTER TABLE public.tournament_players ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ;
ALTER TABLE public.tournament_players ADD COLUMN IF NOT EXISTS payment_verified_by UUID REFERENCES public.profiles(id);

-- Bucket pour preuves tournois
INSERT INTO storage.buckets (id, name, public) VALUES ('tournament_proofs', 'tournament_proofs', true) ON CONFLICT (id) DO NOTHING;
-- Policies bucket
DROP POLICY IF EXISTS "tournament_proofs_public_read" ON storage.objects;
CREATE POLICY "tournament_proofs_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'tournament_proofs');
DROP POLICY IF EXISTS "tournament_proofs_auth_upload" ON storage.objects;
CREATE POLICY "tournament_proofs_auth_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tournament_proofs' AND auth.role() = 'authenticated');
DROP POLICY IF EXISTS "tournament_proofs_auth_delete" ON storage.objects;
CREATE POLICY "tournament_proofs_auth_delete" ON storage.objects FOR DELETE USING (bucket_id = 'tournament_proofs' AND auth.role() = 'authenticated');

-- Vérif
SELECT column_name FROM information_schema.columns WHERE table_name='tournament_players' AND column_name LIKE '%proof%';
