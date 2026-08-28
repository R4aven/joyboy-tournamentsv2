/**
 * JOYBOY - Logique 1V1 Direct REEL
 * Sans mode démo.
 *
 * Table principale : challenges_1v1
 *
 * IMPORTANT :
 * - preuve_challenger_url / preuve_challenged_url = preuve envoyée
 * - paiement_challenger / paiement_challenged = paiement accepté par l'admin
 */

export const JOYBOY_CONFIG = {
  prix1v1: 500,
  wave: "01 51 42 99 18",
  waveNom: "JOYBOY TOURNAMENTS",
  whatsapp: "07 48 23 52 26",
  whatsappLink: "https://wa.me/2250748235226",
};

export type StatutDefi =
  | "EN_ATTENTE"
  | "ACCEPTE"
  | "PAIEMENT_EN_COURS"
  | "PAIEMENT_PARTIEL"
  | "CONFIRME"
  | "EN_COURS"
  | "RESULTAT_EN_ATTENTE"
  | "TERMINE"
  | "CONTESTE"
  | "REFUSE"
  | "ANNULE";

export type PlayerStats = {
  id: string;
  pseudo: string;
  username: string;
  avatar_url: string | null;
  matchs: number;
  victoires: number;
  defaites: number;
  taux_victoire: number;
  tournois_remportes: number;
  victoires_1v1: number;
  palmares: string[];
  bio?: string;
  ville?: string;
  display_name?: string;
  created_at?: string;
  level?: number;
  tournaments_played?: number;
  challenges_played?: number;
  best_streak?: number;
};

export type Challenge1v1 = {
  id: string;
  challenger_id: string;
  challenged_id: string;

  challenger?: PlayerStats;
  challenged?: PlayerStats;

  statut: StatutDefi;

  date_match: string | null;
  heure_match: string | null;
  reglement: string;

  created_at: string;
  updated_at: string;

  paiement_challenger: boolean;
  paiement_challenged: boolean;

  preuve_challenger_url: string | null;
  preuve_challenged_url: string | null;

  paiement_confirme_admin: boolean;

  declaration_challenger: string | null;
  declaration_challenged: string | null;

  gagnant_id: string | null;
  contestation_raison: string | null;
};

export const STATUT_LABELS: Record<
  StatutDefi,
  {
    label: string;
    color: string;
    bg: string;
  }
> = {
  EN_ATTENTE: {
    label: "En attente",
    color: "text-amber-300",
    bg: "bg-amber-500/10 border-amber-500/20",
  },

  ACCEPTE: {
    label: "Accepté",
    color: "text-cyan-300",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },

  PAIEMENT_EN_COURS: {
    label: "Paiement en cours",
    color: "text-violet-300",
    bg: "bg-violet-500/10 border-violet-500/20",
  },

  PAIEMENT_PARTIEL: {
    label: "Paiement partiel",
    color: "text-orange-300",
    bg: "bg-orange-500/10 border-orange-500/20",
  },

  CONFIRME: {
    label: "Confirmé",
    color: "text-emerald-300",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },

  EN_COURS: {
    label: "Match en cours",
    color: "text-cyan-300",
    bg: "bg-cyan-500/20 border-cyan-500/30",
  },

  RESULTAT_EN_ATTENTE: {
    label: "Résultat en attente",
    color: "text-yellow-300",
    bg: "bg-yellow-500/10 border-yellow-500/20",
  },

  TERMINE: {
    label: "Terminé",
    color: "text-zinc-300",
    bg: "bg-zinc-500/10 border-zinc-500/20",
  },

  CONTESTE: {
    label: "Contesté",
    color: "text-red-300",
    bg: "bg-red-500/15 border-red-500/30",
  },

  REFUSE: {
    label: "Refusé",
    color: "text-zinc-400",
    bg: "bg-zinc-500/10 border-zinc-500/10",
  },

  ANNULE: {
    label: "Annulé",
    color: "text-zinc-500",
    bg: "bg-zinc-500/5 border-zinc-500/10",
  },
};

export const REGLEMENT_1V1_DEFAULT = `
1. Match en FT3 (premier à 3 victoires) sauf accord contraire.
2. Connexion stable obligatoire. Déco = rejouer round sauf 2 décos = défaite.
3. Pause abusive = avertissement.
4. Preuve de résultat par screen conseillé.
5. Respect total - trash talk ok, insulte non.
6. Heure respectée : 15 min retard max sinon forfait.
7. Litige : équipe JOYBOY tranche via WhatsApp 07 48 23 52 26.
`.trim();

export function calculerTaux(
  victoires: number,
  matchs: number
): number {
  if (matchs === 0) return 0;

  return Math.round(
    (victoires / matchs) * 100
  );
}

export function peutEnvoyerResultat(
  challenge: Challenge1v1
): boolean {
  return [
    "CONFIRME",
    "EN_COURS",
    "RESULTAT_EN_ATTENTE",
  ].includes(challenge.statut);
}

export type CreateChallengeInput = {
  challengerId: string;
  challengedId: string;
  dateMatch?: string;
  heureMatch?: string;
  message?: string;
};

export function validerCreationDefi(
  input: CreateChallengeInput
): {
  valide: boolean;
  erreur?: string;
} {
  if (
    !input.challengerId ||
    !input.challengedId
  ) {
    return {
      valide: false,
      erreur: "Joueurs manquants.",
    };
  }

  if (
    input.challengerId ===
    input.challengedId
  ) {
    return {
      valide: false,
      erreur:
        "Tu peux pas te défier toi-même 😅",
    };
  }

  return {
    valide: true,
  };
}

/**
 * Créer un défi réel.
 *
 * Après création :
 * - insertion dans challenges_1v1
 * - notification automatique du joueur défié
 */
export async function createChallengeLogic(
  supabase: any,
  input: CreateChallengeInput
) {
  const validation =
    validerCreationDefi(input);

  if (!validation.valide) {
    throw new Error(
      validation.erreur ||
        "Création du défi invalide."
    );
  }

  const {
    data: existant,
    error: existingError,
  } = await supabase
    .from("challenges_1v1")
    .select("id, statut")
    .or(
      `and(challenger_id.eq.${input.challengerId},challenged_id.eq.${input.challengedId}),and(challenger_id.eq.${input.challengedId},challenged_id.eq.${input.challengerId})`
    )
    .in("statut", [
      "EN_ATTENTE",
      "ACCEPTE",
      "PAIEMENT_EN_COURS",
      "PAIEMENT_PARTIEL",
      "CONFIRME",
      "EN_COURS",
      "RESULTAT_EN_ATTENTE",
      "CONTESTE",
    ])
    .limit(1);

  if (existingError) {
    throw existingError;
  }

  if (
    existant &&
    existant.length > 0
  ) {
    throw new Error(
      "Un défi est déjà en cours entre vous deux !"
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("challenges_1v1")
    .insert({
      challenger_id:
        input.challengerId,

      challenged_id:
        input.challengedId,

      statut: "EN_ATTENTE",

      date_match:
        input.dateMatch || null,

      heure_match:
        input.heureMatch || null,

      reglement:
        REGLEMENT_1V1_DEFAULT,

      paiement_challenger:
        false,

      paiement_challenged:
        false,

      preuve_challenger_url:
        null,

      preuve_challenged_url:
        null,

      paiement_confirme_admin:
        false,

      declaration_challenger:
        null,

      declaration_challenged:
        null,

      gagnant_id:
        null,

      contestation_raison:
        null,

      message:
        input.message || null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(
      error.message
    );
  }

  if (!data) {
    throw new Error(
      "Le défi n'a pas pu être créé."
    );
  }

  /*
   * Notification du joueur défié.
   */
  const {
    error: notificationError,
  } = await supabase
    .from("notifications")
    .insert({
      user_id:
        input.challengedId,

      type: "DEFI_RECU",

      title:
        "⚔️ Nouveau défi 1V1",

      message:
        "Tu as reçu un nouveau défi 1V1. Ouvre-le pour accepter ou refuser.",

      link:
        `/1v1/${data.id}`,

      related_id:
        data.id,

      related_type:
        "challenge_1v1",

      is_read: false,
    });

  if (notificationError) {
    console.error(
      "[1V1] Notification défi:",
      notificationError
    );

    /*
     * On ne supprime pas le défi si
     * la notification échoue.
     */
  }

  return data as Challenge1v1;
}

/**
 * Accepter un défi.
 */
export async function acceptChallengeLogic(
  supabase: any,
  challengeId: string,
  userId: string
) {
  const {
    data: challenge,
    error: fetchError,
  } = await supabase
    .from("challenges_1v1")
    .select("*")
    .eq("id", challengeId)
    .single();

  if (
    fetchError ||
    !challenge
  ) {
    throw new Error(
      "Défi introuvable"
    );
  }

  if (
    challenge.challenged_id !==
    userId
  ) {
    throw new Error(
      "C'est pas toi qu'on a défié"
    );
  }

  if (
    challenge.statut !==
    "EN_ATTENTE"
  ) {
    throw new Error(
      "Ce défi n'est plus en attente"
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("challenges_1v1")
    .update({
      statut: "ACCEPTE",
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", challengeId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  /*
   * Notification au challenger.
   */
  const {
    error: notificationError,
  } = await supabase
    .from("notifications")
    .insert({
      user_id:
        challenge.challenger_id,

      type: "DEFI_ACCEPTE",

      title:
        "✅ Défi accepté",

      message:
        "Ton défi 1V1 a été accepté. Passe maintenant au paiement.",

      link:
        `/1v1/${challengeId}`,

      related_id:
        challengeId,

      related_type:
        "challenge_1v1",

      is_read: false,
    });

  if (notificationError) {
    console.error(
      "[1V1] Notification acceptation:",
      notificationError
    );
  }

  return data as Challenge1v1;
}

/**
 * Refuser un défi.
 */
export async function refuseChallengeLogic(
  supabase: any,
  challengeId: string,
  userId: string
) {
  const {
    data: challenge,
    error: fetchError,
  } = await supabase
    .from("challenges_1v1")
    .select(
      "challenger_id, challenged_id, statut"
    )
    .eq("id", challengeId)
    .single();

  if (
    fetchError ||
    !challenge
  ) {
    throw new Error(
      "Défi introuvable"
    );
  }

  if (
    challenge.challenged_id !==
    userId
  ) {
    throw new Error(
      "Non autorisé"
    );
  }

  if (
    challenge.statut !==
    "EN_ATTENTE"
  ) {
    throw new Error(
      "Déjà traité"
    );
  }

  const {
    error,
  } = await supabase
    .from("challenges_1v1")
    .update({
      statut: "REFUSE",
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", challengeId);

  if (error) {
    throw error;
  }

  /*
   * Notification au challenger.
   */
  const {
    error: notificationError,
  } = await supabase
    .from("notifications")
    .insert({
      user_id:
        challenge.challenger_id,

      type: "DEFI_REFUSE",

      title:
        "❌ Défi refusé",

      message:
        "Ton défi 1V1 a été refusé.",

      link:
        `/1v1/${challengeId}`,

      related_id:
        challengeId,

      related_type:
        "challenge_1v1",

      is_read: false,
    });

  if (notificationError) {
    console.error(
      "[1V1] Notification refus:",
      notificationError
    );
  }

  return true;
}

/**
 * Envoyer une preuve de paiement.
 *
 * IMPORTANT :
 * L'envoi de la preuve NE VALIDE PAS le paiement.
 *
 * Le joueur dépose :
 *   preuve_*_url
 *
 * Puis l'ADMIN décide :
 *   paiement_* = true
 */
export async function submitPaymentProofLogic(
  supabase: any,
  challengeId: string,
  userId: string,
  preuveUrl: string
) {
  if (
    !challengeId ||
    !userId ||
    !preuveUrl
  ) {
    throw new Error(
      "Données de preuve invalides."
    );
  }

  const {
    data: challenge,
    error: fetchError,
  } = await supabase
    .from("challenges_1v1")
    .select("*")
    .eq("id", challengeId)
    .single();

  if (
    fetchError ||
    !challenge
  ) {
    throw new Error(
      "Match introuvable"
    );
  }

  if (
    ![
      challenge.challenger_id,
      challenge.challenged_id,
    ].includes(userId)
  ) {
    throw new Error(
      "Tu fais pas partie de ce match"
    );
  }

  const isChallenger =
    challenge.challenger_id ===
    userId;

  const updatePayload: any = {
    updated_at:
      new Date().toISOString(),
  };

  if (isChallenger) {
    updatePayload.preuve_challenger_url =
      preuveUrl;
  } else {
    updatePayload.preuve_challenged_url =
      preuveUrl;
  }

  /*
   * Le statut se base sur la présence
   * des deux preuves, PAS sur l'acceptation admin.
   */
  const challengerHasProof =
    isChallenger
      ? true
      : !!challenge.preuve_challenger_url;

  const challengedHasProof =
    isChallenger
      ? !!challenge.preuve_challenged_url
      : true;

  if (
    challenge.paiement_challenger &&
    challenge.paiement_challenged
  ) {
    updatePayload.statut =
      "CONFIRME";
  } else if (
    challengerHasProof ||
    challengedHasProof
  ) {
    updatePayload.statut =
      "PAIEMENT_EN_COURS";
  } else {
    updatePayload.statut =
      "PAIEMENT_EN_COURS";
  }

  const {
    data,
    error,
  } = await supabase
    .from("challenges_1v1")
    .update(updatePayload)
    .eq("id", challengeId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  /*
   * Notification au joueur adverse
   * lorsqu'une preuve a été déposée.
   */
  const opponentId =
    isChallenger
      ? challenge.challenged_id
      : challenge.challenger_id;

  const {
    error: notificationError,
  } = await supabase
    .from("notifications")
    .insert({
      user_id: opponentId,

      type: "PAIEMENT_1V1",

      title:
        "💳 Preuve de paiement reçue",

      message:
        "Ton adversaire a envoyé sa preuve de paiement pour le duel 1V1.",

      link:
        `/1v1/${challengeId}`,

      related_id:
        challengeId,

      related_type:
        "challenge_1v1",

      is_read: false,
    });

  if (notificationError) {
    console.error(
      "[1V1] Notification paiement:",
      notificationError
    );
  }

  return data as Challenge1v1;
}

/**
 * Ancienne fonction conservée pour compatibilité.
 *
 * ATTENTION :
 * Le nouveau système admin utilise la validation
 * indépendante des deux paiements.
 */
export async function confirmPaymentAdminLogic(
  supabase: any,
  challengeId: string
) {
  const {
    data,
    error,
  } = await supabase.rpc(
    "confirm_1v1_payments",
    {
      p_challenge:
        challengeId,
    }
  );

  if (error) {
    throw error;
  }

  return {
    id: challengeId,
    match_id: data,
    statut: "CONFIRME",
  } as any;
}

/**
 * Lancer le match après validation des deux paiements.
 */
export async function confirmMatchLogic(
  supabase: any,
  challengeId: string
) {
  const {
    data: challenge,
    error: fetchError,
  } = await supabase
    .from("challenges_1v1")
    .select(
      "id, paiement_challenger, paiement_challenged, statut"
    )
    .eq("id", challengeId)
    .single();

  if (
    fetchError ||
    !challenge
  ) {
    throw new Error(
      "Match introuvable."
    );
  }

  if (
    !challenge.paiement_challenger ||
    !challenge.paiement_challenged
  ) {
    throw new Error(
      "Les deux paiements doivent être acceptés par l'administration."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("challenges_1v1")
    .update({
      statut: "EN_COURS",
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", challengeId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as Challenge1v1;
}

export type ResultSubmission = {
  challengeId: string;
  declarantId: string;
  gagnantId: string;
};

/**
 * Déclaration du résultat.
 *
 * Les deux joueurs doivent déclarer
 * le même gagnant pour terminer le match.
 */
export async function submitResultLogic(
  supabase: any,
  input: ResultSubmission
) {
  if (
    !input.challengeId ||
    !input.declarantId ||
    !input.gagnantId
  ) {
    throw new Error(
      "Informations de résultat manquantes."
    );
  }

  const {
    data: challenge,
    error: fetchError,
  } = await supabase
    .from("challenges_1v1")
    .select("*")
    .eq("id", input.challengeId)
    .single();

  if (
    fetchError ||
    !challenge
  ) {
    throw new Error(
      "Match introuvable"
    );
  }

  if (
    ![
      challenge.challenger_id,
      challenge.challenged_id,
    ].includes(input.declarantId)
  ) {
    throw new Error(
      "Pas partie du match"
    );
  }

  if (
    ![
      challenge.challenger_id,
      challenge.challenged_id,
    ].includes(input.gagnantId)
  ) {
    throw new Error(
      "Le gagnant doit être l'un des deux joueurs."
    );
  }

  /*
   * Vérification avant écriture :
   * un joueur ne peut déclarer qu'une fois.
   */
  const isChallenger =
    challenge.challenger_id ===
    input.declarantId;

  const existingDeclaration =
    isChallenger
      ? challenge.declaration_challenger
      : challenge.declaration_challenged;

  if (existingDeclaration) {
    throw new Error(
      "Tu as déjà déclaré le résultat."
    );
  }

  const update: any = {
    updated_at:
      new Date().toISOString(),
  };

  if (isChallenger) {
    update.declaration_challenger =
      input.gagnantId;
  } else {
    update.declaration_challenged =
      input.gagnantId;
  }

  const currentDeclarations = {
    challenger: isChallenger
      ? input.gagnantId
      : challenge.declaration_challenger,

    challenged: !isChallenger
      ? input.gagnantId
      : challenge.declaration_challenged,
  };

  if (
    currentDeclarations.challenger &&
    currentDeclarations.challenged
  ) {
    if (
      currentDeclarations.challenger ===
      currentDeclarations.challenged
    ) {
      update.statut =
        "TERMINE";

      update.gagnant_id =
        currentDeclarations.challenger;

      update.contestation_raison =
        null;
    } else {
      update.statut =
        "CONTESTE";

      update.contestation_raison =
        "Déclarations différentes";
    }
  } else {
    update.statut =
      "RESULTAT_EN_ATTENTE";
  }

  const {
    data,
    error,
  } = await supabase
    .from("challenges_1v1")
    .update(update)
    .eq("id", input.challengeId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as Challenge1v1;
}

export function formatMatchDate(
  date: string | null,
  heure: string | null
): string {
  if (!date) {
    return "Date à définir entre joueurs";
  }

  try {
    const d = new Date(date);

    return heure
      ? `${d.toLocaleDateString(
          "fr-CI"
        )} à ${heure}`
      : d.toLocaleDateString("fr-CI");
  } catch {
    return date || "";
  }
}

export function getPlayerPalmares(
  player: PlayerStats
): string {
  const parts: string[] = [];

  if (
    player.tournois_remportes >
    0
  ) {
    parts.push(
      `${player.tournois_remportes}🏆 tournoi${
        player.tournois_remportes > 1
          ? "s"
          : ""
      }`
    );
  }

  if (
    player.victoires_1v1 >
    0
  ) {
    parts.push(
      `${player.victoires_1v1} victoires 1V1`
    );
  }

  if (
    player.palmares &&
    player.palmares.length > 0
  ) {
    parts.push(
      ...player.palmares.slice(0, 2)
    );
  }

  return parts.length
    ? parts.join(" • ")
    : "";
}