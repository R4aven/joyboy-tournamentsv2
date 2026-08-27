
-- Table promos / events / codes promos pour JOYBOY
CREATE TABLE IF NOT EXISTS public.promos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'PROMO' CHECK (type IN ('PROMO','EVENT','CODE','SOLDES','TOURNOI','INFO')),
  title TEXT NOT NULL, -- ex: On casse les prix
  subtitle TEXT, -- ex: SOLDES DES VACANCES
  badge_text TEXT, -- ex: Jusqu'à 70%
  cta_text TEXT DEFAULT 'J''achète maintenant →',
  cta_link TEXT DEFAULT '/tournaments',
  background_color TEXT DEFAULT '#E30613',
  text_color TEXT DEFAULT '#FFFFFF',
  image_url TEXT,
  code TEXT, -- code promo si type CODE
  discount_percent INT,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promos_active ON public.promos(is_active, display_order);
ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "promos_public_read" ON public.promos;
CREATE POLICY "promos_public_read" ON public.promos FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "promos_admin_all" ON public.promos;
CREATE POLICY "promos_admin_all" ON public.promos FOR ALL USING (public.is_staff() OR auth.uid() IS NOT NULL);

-- Exemple d'insertion (soldes comme ton image)
INSERT INTO public.promos (type, title, subtitle, badge_text, cta_text, cta_link, background_color, is_active, display_order) VALUES
('SOLDES', 'On casse les prix', 'SOLDES DES VACANCES', 'Jusqu''à 70%', 'J''achète maintenant →', '/tournaments', '#E30613', true, 1),
('PROMO', 'Tournoi spécial ce weekend', 'EVENT ABIDJAN', '-20% inscription', 'S''inscrire →', '/tournaments', '#7C3AED', true, 2),
('CODE', 'Code: JOYBOY20', 'CODE PROMO', '-20% avec JOYBOY20', 'Utiliser →', '/tournaments', '#059669', true, 3)
ON CONFLICT DO NOTHING;
