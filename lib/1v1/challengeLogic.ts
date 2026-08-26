/**
 * 🇨🇮 JOYBOY TOURNAMENTS - Logique 1V1 Direct
 * Gestion complète du workflow défi -> paiement -> match -> résultat
 * Wave unique: 01 51 42 99 18 | WhatsApp: 07 48 23 52 26
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
};

export type Challenge1v1 = {
  id: string;
  challenger_id: string;
  challenged_id: string;
  challenger?: PlayerStats;
  challenged?: PlayerStats;
  statut: StatutDefi;
  date_match: string | null; // ISO date
  heure_match: string | null; // HH:mm
  reglement: string;
  created_at: string;
  updated_at: string;
  paiement_challenger: boolean;
  paiement_challenged: boolean;
  preuve_challenger_url: string | null;
  preuve_challenged_url: string | null;
  paiement_confirme_admin: boolean;
  // Résultats
  declaration_challenger: string | null; // id du gagnant déclaré par challenger
  declaration_challenged: string | null; // id du gagnant déclaré par challenged
  gagnant_id: string | null;
  contestation_raison: string | null;
};

export const STATUT_LABELS: Record<StatutDefi, { label: string; color: string; bg: string }> = {
  EN_ATTENTE: { label: "En attente", color: "text-amber-300", bg: "bg-amber-500/10 border-amber-500/20" },
  ACCEPTE: { label: "Accepté", color: "text-cyan-300", bg: "bg-cyan-500/10 border-cyan-500/20" },
  PAIEMENT_EN_COURS: { label: "Paiement en cours", color: "text-violet-300", bg: "bg-violet-500/10 border-violet-500/20" },
  PAIEMENT_PARTIEL: { label: "Paiement partiel", color: "text-orange-300", bg: "bg-orange-500/10 border-orange-500/20" },
  CONFIRME: { label: "Confirmé", color: "text-emerald-300", bg: "bg-emerald-500/10 border-emerald-500/20" },
  EN_COURS: { label: "Match en cours", color: "text-cyan-300", bg: "bg-cyan-500/20 border-cyan-500/30" },
  RESULTAT_EN_ATTENTE: { label: "Résultat en attente", color: "text-yellow-300", bg: "bg-yellow-500/10 border-yellow-500/20" },
  TERMINE: { label: "Terminé", color: "text-zinc-300", bg: "bg-zinc-500/10 border-zinc-500/20" },
  CONTESTE: { label: "Contesté", color: "text-red-300", bg: "bg-red-500/15 border-red-500/30" },
  REFUSE: { label: "Refusé", color: "text-zinc-400", bg: "bg-zinc-500/10 border-zinc-500/10" },
  ANNULE: { label: "Annulé", color: "text-zinc-500", bg: "bg-zinc-500/5 border-zinc-500/10" },
};

export const REGLEMENT_1V1_DEFAULT = `
1. Match en FT3 (premier à 3 victoires) sauf accord contraire entre joueurs.
2. Connexion stable obligatoire. En cas de déco, rejouer le round sauf si 2 décos = défaite.
3. Personnages/Decks autorisés tous sauf bug exploit avéré.
4. Pause abusive = avertissement, récidive = défaite du round.
5. Preuve de résultat par screen (optionnel mais conseillé).
6. Respect total - trash talk marrant oui, insulte gamin non. On est là pour kiffer.
7. Heure respectée : 15 min de retard max, sinon forfait.
8. Litige : équipe JOYBOY tranche via WhatsApp au 07 48 23 52 26.
`.trim();

// --- HELPERS ---

export function calculerTaux(victoires: number, matchs: number): number {
  if (matchs === 0) return 0;
  return Math.round((victoires / matchs) * 100);
}

export function peutEnvoyerResultat(challenge: Challenge1v1): boolean {
  return ["CONFIRME", "EN_COURS", "RESULTAT_EN_ATTENTE"].includes(challenge.statut);
}

// --- LOGIQUE CREATION DEFI ---

export type CreateChallengeInput = {
  challengerId: string;
  challengedId: string;
  dateMatch?: string;
  heureMatch?: string;
  message?: string;
};

export function validerCreationDefi(input: CreateChallengeInput): { valide: boolean; erreur?: string } {
  if (!input.challengerId || !input.challengedId) {
    return { valide: false, erreur: "Joueurs manquants, chef." };
  }
  if (input.challengerId === input.challengedId) {
    return { valide: false, erreur: "Tu peux pas te défier toi-même, champion 😅" };
  }
  return { valide: true };
}

export async function createChallengeLogic(supabase: any, input: CreateChallengeInput) {
  const validation = validerCreationDefi(input);
  if (!validation.valide) throw new Error(validation.erreur);

  // Vérifie si un défi en cours existe déjà entre les deux
  const { data: existant } = await supabase
    .from("challenges_1v1")
    .select("id")
    .or(
      `and(challenger_id.eq.${input.challengerId},challenged_id.eq.${input.challengedId}),and(challenger_id.eq.${input.challengedId},challenged_id.eq.${input.challengerId})`
    )
    .in("statut", ["EN_ATTENTE", "ACCEPTE", "PAIEMENT_EN_COURS", "PAIEMENT_PARTIEL", "CONFIRME", "EN_COURS"])
    .limit(1);

  if (existant && existant.length > 0) {
    throw new Error("Un défi est déjà en cours entre vous deux, finissez ça d'abord !");
  }

  const { data, error } = await supabase
    .from("challenges_1v1")
    .insert({
      challenger_id: input.challengerId,
      challenged_id: input.challengedId,
      statut: "EN_ATTENTE",
      date_match: input.dateMatch || null,
      heure_match: input.heureMatch || null,
      reglement: REGLEMENT_1V1_DEFAULT,
      paiement_challenger: false,
      paiement_challenged: false,
      paiement_confirme_admin: false,
      message: input.message || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Challenge1v1;
}

// --- ACCEPTATION / REFUS ---

export async function acceptChallengeLogic(supabase: any, challengeId: string, userId: string) {
  // Vérifie que c'est bien le challenged
  const { data: challenge, error: fetchError } = await supabase
    .from("challenges_1v1")
    .select("*")
    .eq("id", challengeId)
    .single();

  if (fetchError || !challenge) throw new Error("Défi introuvable");
  if (challenge.challenged_id !== userId) throw new Error("C'est pas toi qu'on a défié, frère");
  if (challenge.statut !== "EN_ATTENTE") throw new Error("Ce défi n'est plus en attente");

  const { data, error } = await supabase
    .from("challenges_1v1")
    .update({ statut: "ACCEPTE", updated_at: new Date().toISOString() })
    .eq("id", challengeId)
    .select()
    .single();

  if (error) throw error;
  return data as Challenge1v1;
}

export async function refuseChallengeLogic(supabase: any, challengeId: string, userId: string) {
  const { data: challenge } = await supabase
    .from("challenges_1v1")
    .select("challenged_id, statut")
    .eq("id", challengeId)
    .single();

  if (!challenge) throw new Error("Défi introuvable");
  if (challenge.challenged_id !== userId) throw new Error("Non autorisé");
  if (challenge.statut !== "EN_ATTENTE") throw new Error("Déjà traité");

  const { error } = await supabase
    .from("challenges_1v1")
    .update({ statut: "REFUSE", updated_at: new Date().toISOString() })
    .eq("id", challengeId);

  if (error) throw error;
  return true;
}

// --- PAIEMENT ---

export async function submitPaymentProofLogic(
  supabase: any,
  challengeId: string,
  userId: string,
  preuveUrl: string
) {
  const { data: challenge } = await supabase
    .from("challenges_1v1")
    .select("*")
    .eq("id", challengeId)
    .single();

  if (!challenge) throw new Error("Match introuvable");
  if (![challenge.challenger_id, challenge.challenged_id].includes(userId))
    throw new Error("Tu fais pas partie de ce match");

  const isChallenger = challenge.challenger_id === userId;
  const updatePayload: any = {
    updated_at: new Date().toISOString(),
  };

  if (isChallenger) {
    updatePayload.preuve_challenger_url = preuveUrl;
    updatePayload.paiement_challenger = true;
  } else {
    updatePayload.preuve_challenged_url = preuveUrl;
    updatePayload.paiement_challenged = true;
  }

  // Logique statut paiement
  const otherPaid = isChallenger ? challenge.paiement_challenged : challenge.paiement_challenger;
  if (otherPaid) {
    // Les deux ont payé -> CONFIRME (en attente validation admin mais on passe à confirmé direct, admin confirmera après)
    updatePayload.statut = "CONFIRME";
  } else {
    updatePayload.statut = "PAIEMENT_EN_COURS";
  }

  // Si déjà en paiement partiel et l'autre paie -> confirme
  if (challenge.statut === "PAIEMENT_PARTIEL" && !otherPaid) {
    // reste en cours
    updatePayload.statut = "PAIEMENT_EN_COURS";
  }

  const { data, error } = await supabase
    .from("challenges_1v1")
    .update(updatePayload)
    .eq("id", challengeId)
    .select()
    .single();

  if (error) throw error;
  return data as Challenge1v1;
}

export async function confirmPaymentAdminLogic(supabase: any, challengeId: string) {
  const { data, error } = await supabase
    .from("challenges_1v1")
    .update({
      paiement_confirme_admin: true,
      statut: "CONFIRME",
      updated_at: new Date().toISOString(),
    })
    .eq("id", challengeId)
    .select()
    .single();

  if (error) throw error;
  return data as Challenge1v1;
}

// --- CONFIRMATION MATCH (lancer le match) ---

export async function confirmMatchLogic(supabase: any, challengeId: string, userId: string) {
  const { data: challenge } = await supabase
    .from("challenges_1v1")
    .select("*")
    .eq("id", challengeId)
    .single();

  if (!challenge) throw new Error("Match introuvable");
  if (challenge.statut !== "CONFIRME") throw new Error("Match pas encore confirmé (paiement)");
  // Les deux joueurs peuvent confirmer, on passe en EN_COURS au premier confirm

  const { data, error } = await supabase
    .from("challenges_1v1")
    .update({ statut: "EN_COURS", updated_at: new Date().toISOString() })
    .eq("id", challengeId)
    .select()
    .single();

  if (error) throw error;
  return data as Challenge1v1;
}

// --- RESULTATS ---

export type ResultSubmission = {
  challengeId: string;
  declarantId: string;
  gagnantId: string;
};

export async function submitResultLogic(supabase: any, input: ResultSubmission) {
  const { data: challenge } = await supabase
    .from("challenges_1v1")
    .select("*")
    .eq("id", input.challengeId)
    .single();

  if (!challenge) throw new Error("Match introuvable");
  if (![challenge.challenger_id, challenge.challenged_id].includes(input.declarantId))
    throw new Error("Tu fais pas partie du match");
  if (![challenge.challenger_id, challenge.challenged_id].includes(input.gagnantId))
    throw new Error("Gagnant invalide");

  if (!peutEnvoyerResultat(challenge)) {
    throw new Error("Tu peux pas envoyer le résultat maintenant. Statut: " + challenge.statut);
  }

  const isChallenger = challenge.challenger_id === input.declarantId;
  const update: any = { updated_at: new Date().toISOString() };

  if (isChallenger) {
    update.declaration_challenger = input.gagnantId;
  } else {
    update.declaration_challenged = input.gagnantId;
  }

  // Détermine si on a les deux déclarations
  const otherDeclaration = isChallenger ? challenge.declaration_challenged : challenge.declaration_challenger;
  const currentDeclarations = {
    challenger: isChallenger ? input.gagnantId : challenge.declaration_challenger,
    challenged: !isChallenger ? input.gagnantId : challenge.declaration_challenged,
  };

  if (currentDeclarations.challenger && currentDeclarations.challenged) {
    // Les deux ont déclaré
    if (currentDeclarations.challenger === currentDeclarations.challenged) {
      // MATCH -> TERMINE
      update.statut = "TERMINE";
      update.gagnant_id = currentDeclarations.challenger;
    } else {
      // MISMATCH -> CONTESTE
      update.statut = "CONTESTE";
      update.contestation_raison = `Déclarations différentes: challenger dit ${currentDeclarations.challenger} gagne, challenged dit ${currentDeclarations.challenged} gagne`;
    }
  } else {
    update.statut = "RESULTAT_EN_ATTENTE";
  }

  const { data, error } = await supabase
    .from("challenges_1v1")
    .update(update)
    .eq("id", input.challengeId)
    .select()
    .single();

  if (error) throw error;
  return data as Challenge1v1;
}

// --- VALIDATION AUTO DES RESULTATS (si declarations correspondent) ---

export function validerSiDeclarationsCorrespondent(
  declarationA: string | null,
  declarationB: string | null
): { valide: boolean; gagnant: string | null; raison: string } {
  if (!declarationA || !declarationB) {
    return { valide: false, gagnant: null, raison: "En attente de la 2e déclaration" };
  }
  if (declarationA === declarationB) {
    return { valide: true, gagnant: declarationA, raison: "Déclarations concordantes ✅" };
  }
  return {
    valide: false,
    gagnant: null,
    raison: "CONTESTE - déclarations différentes, staff JOYBOY va trancher",
  };
}

// --- UTILS UI ---

export function formatMatchDate(date: string | null, heure: string | null): string {
  if (!date) return "Date à définir entre joueurs";
  try {
    const d = new Date(date);
    const dateStr = d.toLocaleDateString("fr-CI", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return heure ? `${dateStr} à ${heure}` : dateStr;
  } catch {
    return date;
  }
}

export function getPlayerPalmares(player: PlayerStats): string {
  const parts: string[] = [];
  if (player.tournois_remportes > 0) parts.push(`${player.tournois_remportes}🏆 tournoi${player.tournois_remportes > 1 ? "s" : ""}`);
  if (player.victoires_1v1 > 0) parts.push(`${player.victoires_1v1} victoires 1V1`);
  if (player.palmares.length > 0) parts.push(...player.palmares.slice(0, 2));
  return parts.length ? parts.join(" • ") : "Nouveau challenger";
}
