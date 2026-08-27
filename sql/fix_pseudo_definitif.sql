
-- Si tu veux vraiment garder compatibilité pseudo, exécute ça, sinon le code fix suffit
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pseudo TEXT;
UPDATE public.profiles SET pseudo = username WHERE pseudo IS NULL;
-- Mais idéal: ne plus utiliser pseudo, utiliser username + display_name
