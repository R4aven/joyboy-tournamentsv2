
-- FIX ERROR: invalid input value for enum notification_type: "TOURNOI", "1V1", "PAIEMENT", "COMPTE", etc.
-- L'enum d'origine n'autorise que: TOURNOI_OUVERT, DEFI_RECU, PAIEMENT_RECU, etc.
-- On convertit la colonne en TEXT pour être permissif, et on ajoute les anciennes valeurs à l'enum au cas où

-- 1. Convertir en TEXT pour débloquer tout de suite (recommandé)
ALTER TABLE public.notifications ALTER COLUMN type TYPE TEXT;

-- 2. Optionnel: ajouter les anciennes valeurs manquantes à l'enum si tu veux garder l'enum plus tard
DO $$
BEGIN
  -- Essaie d'ajouter les valeurs qui manquaient
  BEGIN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'TOURNOI';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS '1V1';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'PAIEMENT';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'PALMARES';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'COMPTE';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'PROMO';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'SOLDES';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- 3. Vérif
SELECT DISTINCT type FROM public.notifications LIMIT 20;
