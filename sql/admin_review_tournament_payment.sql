-- JOYBOY TOURNAMENTS
-- Validation/refus d'une preuve de paiement tournoi + notification automatique au joueur

ALTER TABLE public.tournament_players
  ADD COLUMN IF NOT EXISTS payment_review_reason TEXT;

CREATE OR REPLACE FUNCTION public.admin_review_tournament_payment(
  p_registration UUID,
  p_decision TEXT,
  p_refusal_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.tournament_players;
  t public.tournaments;
  v_reason TEXT;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  IF p_decision NOT IN ('VALIDE', 'REFUSE') THEN
    RAISE EXCEPTION 'INVALID_DECISION';
  END IF;

  SELECT * INTO r
  FROM public.tournament_players
  WHERE id = p_registration
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'REGISTRATION_NOT_FOUND';
  END IF;

  SELECT * INTO t
  FROM public.tournaments
  WHERE id = r.tournament_id;

  v_reason := NULLIF(trim(COALESCE(p_refusal_reason, '')), '');

  IF p_decision = 'VALIDE' THEN
    UPDATE public.tournament_players
    SET is_paid = TRUE,
        status = 'INSCRIT',
        payment_review_reason = NULL
    WHERE id = r.id;

    INSERT INTO public.notifications
      (user_id, type, title, message, link, related_id, related_type)
    VALUES
      (
        r.player_id,
        'PAIEMENT_VALIDE',
        '✅ Paiement validé',
        'Ta preuve de paiement pour le tournoi « ' || COALESCE(t.title, 'JOYBOY TOURNAMENTS') || ' » a été validée. Tu es officiellement inscrit !',
        '/tournaments/' || r.tournament_id::text,
        r.tournament_id,
        'tournament'
      );
  ELSE
    UPDATE public.tournament_players
    SET is_paid = FALSE,
        status = 'EN_ATTENTE_PAIEMENT',
        payment_review_reason = COALESCE(v_reason, 'Preuve de paiement non conforme ou illisible.')
    WHERE id = r.id;

    INSERT INTO public.notifications
      (user_id, type, title, message, link, related_id, related_type)
    VALUES
      (
        r.player_id,
        'PAIEMENT_REFUSE',
        '❌ Paiement refusé',
        'Ta preuve de paiement pour le tournoi « ' || COALESCE(t.title, 'JOYBOY TOURNAMENTS') || ' » a été refusée.' ||
          CASE WHEN v_reason IS NOT NULL THEN ' Motif : ' || v_reason ELSE ' Vérifie ta capture et renvoie une preuve correcte.' END,
        '/tournaments/' || r.tournament_id::text || '/payment',
        r.tournament_id,
        'tournament'
      );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_review_tournament_payment(UUID, TEXT, TEXT) TO authenticated;
