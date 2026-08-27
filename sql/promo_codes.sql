
-- Table codes promo geree par admin
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_value INT NOT NULL,
  max_uses INT DEFAULT 100,
  used_count INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.promo_code_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  tournament_id UUID,
  discount_applied INT,
  original_price INT,
  final_price INT,
  used_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(promo_code_id, user_id, tournament_id)
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS promo_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS promo_discount INT DEFAULT 0;

-- RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "promo_codes_public_read" ON public.promo_codes;
CREATE POLICY "promo_codes_public_read" ON public.promo_codes FOR SELECT USING (true);
DROP POLICY IF EXISTS "promo_codes_admin_all" ON public.promo_codes;
CREATE POLICY "promo_codes_admin_all" ON public.promo_codes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.promo_code_usages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "promo_usages_all" ON public.promo_code_usages;
CREATE POLICY "promo_usages_all" ON public.promo_code_usages FOR ALL USING (true) WITH CHECK (true);

-- Exemple codes
INSERT INTO public.promo_codes (code, discount_type, discount_value, max_uses, description, active) VALUES 
('JOYBOY10', 'percent', 10, 100, '10% de reduction bienvenue', true),
('WELCOME500', 'fixed', 500, 50, '500F offert inscription', true),
('ABIDJAN20', 'percent', 20, 30, '20% Abidjan', true)
ON CONFLICT (code) DO NOTHING;
