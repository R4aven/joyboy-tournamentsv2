
/**
 * 🇨🇮 E-TOURNOIS CI - Logique métier Match Salon eFootball
 * VRAIE LOGIQUE, pas de simulation. E-TOURNOIS CI organise seulement.
 */
import type {
  SalonInfo,
  ResultDeclaration,
  EfootballMatch,
  MatchStatus,
  DeclarationMatchResult,
  CanViewSalon,
  PlayerMatchProfile,
} from "./types";
import { MATCH_STATUS_ORDER } from "./types";

// Vérifie si user peut voir infos salon (PRIVÉ 2 joueurs + admin)
export function canViewSalonInfo(
  match: EfootballMatch,
  userId: string | null | undefined,
  userRole: string | null | undefined
): CanViewSalon {
  if (!userId) return { canView: false, reason: "FORBIDDEN", isCreator: false };
  const isAdmin = userRole === "ADMIN" || userRole === "MODERATEUR";
  if (isAdmin) {
    return {
      canView: true,
      reason: "ADMIN",
      isCreator: match.salon_info?.createdBy === userId,
    };
  }
  if (match.player_a.id === userId) {
    return { canView: true, reason: "PLAYER_A", isCreator: match.salon_info?.createdBy === userId };
  }
  if (match.player_b && match.player_b.id === userId) {
    return { canView: true, reason: "PLAYER_B", isCreator: match.salon_info?.createdBy === userId };
  }
  return { canView: false, reason: "FORBIDDEN", isCreator: false };
}

// Qui peut créer le salon ? Le 1er joueur qui clique ou A par défaut
export function canCreateSalon(match: EfootballMatch, userId: string): boolean {
  if (match.salon_info) return false; // déjà créé
  if (!match.player_b) return false; // pas d'adversaire
  return match.player_a.id === userId || match.player_b.id === userId;
}

export function createSalonInfo(input: {
  salonId: string;
  code?: string;
  instructions: string;
  createdBy: string;
}): { salon: SalonInfo; nextStatus: MatchStatus } {
  if (!input.salonId || input.salonId.trim().length < 2) {
    throw new Error("ID Salon eFootball obligatoire (ex: KONAMI ID, nom de salle)");
  }
  if (!input.instructions || input.instructions.trim().length < 5) {
    throw new Error("Instructions obligatoires (ex: Rejoins en amical, cherche RavenCI)");
  }
  const salon: SalonInfo = {
    salonId: input.salonId.trim(),
    code: (input.code || "").trim(),
    instructions: input.instructions.trim(),
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return { salon, nextStatus: "SALON_CREE" as MatchStatus };
}

export function markPlayerConnected(match: EfootballMatch, playerId: string): Partial<EfootballMatch> {
  if (!match.salon_info) throw new Error("Salon non créé");
  const isA = match.player_a.id === playerId;
  const isB = match.player_b?.id === playerId;
  if (!isA && !isB) throw new Error("Tu n'es pas joueur de ce match");

  const player_a_connected = isA ? true : match.player_a_connected;
  const player_b_connected = isB ? true : match.player_b_connected;

  let nextStatus: MatchStatus = match.status;
  if (player_a_connected && player_b_connected) {
    nextStatus = "JOUEURS_CONNECTES";
  } else if (match.status === "SALON_CREE") {
    nextStatus = "SALON_CREE"; // reste tant que les 2 ne sont pas connectés
  }

  return {
    player_a_connected,
    player_b_connected,
    status: nextStatus,
    status_detail: player_a_connected && player_b_connected ? "Les 2 joueurs connectés, prêt à lancer !" : undefined,
  };
}

export function startMatch(match: EfootballMatch, triggeredBy: string): Partial<EfootballMatch> {
  if (!match.salon_info) throw new Error("Salon non créé");
  if (!match.player_a_connected || !match.player_b_connected) {
    throw new Error("Les 2 joueurs doivent être connectés");
  }
  const isPlayer = match.player_a.id === triggeredBy || match.player_b?.id === triggeredBy;
  if (!isPlayer) throw new Error("Non autorisé");
  return {
    status: "MATCH_EN_COURS" as MatchStatus,
    match_started_at: new Date().toISOString(),
    status_detail: "Match en cours sur eFootball - bonne chance !",
  };
}

export function declareResult(
  match: EfootballMatch,
  declaration: Omit<ResultDeclaration, "declaredAt" | "playerUsername"> & { playerUsername: string }
): { updatedDeclarations: ResultDeclaration[]; nextStatus: MatchStatus; autoConfirm?: boolean } {
  if (match.status !== "MATCH_EN_COURS" && match.status !== "RESULTAT_EN_ATTENTE") {
    throw new Error(`Statut invalide pour déclarer: ${match.status}`);
  }
  if (declaration.scoreA < 0 || declaration.scoreB < 0 || declaration.scoreA > 20 || declaration.scoreB > 20) {
    throw new Error("Score invalide");
  }
  const newDec: ResultDeclaration = {
    ...declaration,
    declaredAt: new Date().toISOString(),
  };

  const filtered = match.result_declarations.filter((d) => d.playerId !== declaration.playerId);
  const updated = [...filtered, newDec];

  if (updated.length === 1) {
    return { updatedDeclarations: updated, nextStatus: "RESULTAT_EN_ATTENTE" };
  }

  // 2 déclarations → check concordance
  const check = checkDeclarationsMatch(updated[0], updated[1]);
  if (check.match === true) {
    return { updatedDeclarations: updated, nextStatus: "RESULTAT_CONFIRME", autoConfirm: true };
  } else if (check.match === false) {
    return { updatedDeclarations: updated, nextStatus: "CONTESTATION" };
  }
  return { updatedDeclarations: updated, nextStatus: "RESULTAT_EN_ATTENTE" };
}

export function checkDeclarationsMatch(decA: ResultDeclaration, decB: ResultDeclaration): DeclarationMatchResult {
  // Les 2 doivent dire le même score A vs B (peu importe qui déclare victoire)
  if (decA.scoreA === decB.scoreA && decA.scoreB === decB.scoreB) {
    // cohérence de isVictory optionnelle mais logique : si A gagne 3-1, A isVictory true, B isVictory false
    const winnerId = decA.scoreA > decA.scoreB ? "PLAYER_A" : decA.scoreA < decA.scoreB ? "PLAYER_B" : "DRAW";
    // On retourne l'id réel du gagnant en cherchant dans les déclarations
    const realWinnerId = decA.scoreA > decA.scoreB ? decA.playerId && decA.scoreA > decA.scoreB ? (decA.scoreA > decA.scoreB ? (winnerId === "PLAYER_A" ? decA.scoreA > decA.scoreB ? "" : "") : "") : "" : "" : "";
    // Plus simple : on détermine winner via score
    let winnerPlayerId: string;
    if (decA.scoreA > decA.scoreB) {
      // Joueur A gagne - il faut trouver l'id de A dans le match, mais ici on a seulement decA.playerId
      // On assume que scoreA = joueur A, donc winner = player A réel
      winnerPlayerId = decA.playerId; // sera réinterprété côté confirmResult avec match
      // Hack propre : on retourne un identifiant logique qui sera mappé après
      // Ici on retourne simplement decA si A gagne, sinon decB etc - le confirm se fera avec le match
      winnerPlayerId = "__PLAYER_A__";
      if (decA.scoreA < decA.scoreB) winnerPlayerId = "__PLAYER_B__";
      // On va le mapper dans confirmResult
      if (decA.scoreA > decA.scoreB) winnerPlayerId = "__PLAYER_A__";
      else if (decA.scoreA < decA.scoreB) winnerPlayerId = "__PLAYER_B__";
      else winnerPlayerId = "__DRAW__";
    } else {
      if (decA.scoreA > decA.scoreB) winnerPlayerId = "__PLAYER_A__";
      else if (decA.scoreA < decA.scoreB) winnerPlayerId = "__PLAYER_B__";
      else winnerPlayerId = "__DRAW__";
    }
    // Réévaluation simple
    if (decA.scoreA === decB.scoreA && decA.scoreB === decB.scoreB) {
      const winnerTag = decA.scoreA > decA.scoreB ? "__PLAYER_A__" : decA.scoreA < decA.scoreB ? "__PLAYER_B__" : "__DRAW__";
      return { match: true, winnerId: winnerTag };
    }
    return { match: false, reason: "Scores incohérents" };
  }
  return { match: false, reason: `Déclarations différentes: ${decA.scoreA}-${decA.scoreB} vs ${decB.scoreA}-${decB.scoreB}` };
}

// Version qui a besoin du match pour mapper PLAYER_A/B vers vrai ID
export function checkDeclarationsMatchWithMatch(match: EfootballMatch, declarations: ResultDeclaration[]): DeclarationMatchResult {
  if (declarations.length < 2) return { match: null, reason: "WAITING_SECOND" };
  const [d1, d2] = declarations;
  if (d1.scoreA === d2.scoreA && d1.scoreB === d2.scoreB) {
    if (d1.scoreA > d1.scoreB) return { match: true, winnerId: match.player_a.id };
    if (d1.scoreA < d1.scoreB) return { match: true, winnerId: match.player_b ? match.player_b.id : d2.playerId };
    return { match: true, winnerId: "DRAW" };
  }
  return { match: false, reason: `Score A: ${d1.scoreA}-${d1.scoreB} ≠ Score B: ${d2.scoreA}-${d2.scoreB}` };
}

export function confirmResult(
  match: EfootballMatch,
  adminId?: string | null
): Partial<EfootballMatch> & { shouldUpdateBracket: boolean; shouldUpdateStats: boolean } {
  if (match.result_declarations.length < 2 && !adminId) {
    throw new Error("Deux déclarations requises ou validation admin");
  }
  let winnerId: string | null = null;
  let finalA: number;
  let finalB: number;

  if (match.result_declarations.length >= 2) {
    const check = checkDeclarationsMatchWithMatch(match, match.result_declarations);
    if (check.match !== true && !adminId) {
      throw new Error("Déclarations non concordantes - passage en contestation requis");
    }
    finalA = match.result_declarations[0].scoreA;
    finalB = match.result_declarations[0].scoreB;
    winnerId = check.match === true ? check.winnerId : null;
    if (check.winnerId === "DRAW") winnerId = null;
  } else {
    // Admin force à partir d'une seule déclaration
    finalA = match.result_declarations[0].scoreA;
    finalB = match.result_declarations[0].scoreB;
    if (finalA > finalB) winnerId = match.player_a.id;
    else if (finalB > finalA) winnerId = match.player_b?.id || null;
  }

  if (finalA! > finalB!) winnerId = match.player_a.id;
  else if (finalB! > finalA!) winnerId = match.player_b?.id || null;
  else winnerId = null; // match nul rare mais géré (eFootball peut faire nul en amical)

  const loserId = winnerId ? (winnerId === match.player_a.id ? match.player_b?.id || null : match.player_a.id) : null;

  return {
    status: "TERMINE" as MatchStatus,
    final_score_a: finalA!,
    final_score_b: finalB!,
    winner_id: winnerId,
    loser_id: loserId,
    is_contested: false,
    validated_by_admin: adminId || null,
    validated_at: new Date().toISOString(),
    status_detail: winnerId ? `Victoire ${winnerId === match.player_a.id ? match.player_a.username : match.player_b?.username}` : "Match nul",
    shouldUpdateBracket: true,
    shouldUpdateStats: true,
  };
}

export function contestMatch(match: EfootballMatch, reason: string, byPlayerId: string): Partial<EfootballMatch> {
  if (match.status === "CONTESTATION") throw new Error("Déjà en contestation");
  return {
    status: "CONTESTATION" as MatchStatus,
    is_contested: true,
    contested_reason: reason,
    status_detail: `Contestation par ${byPlayerId}: ${reason}`,
  };
}

export function adminResolveContestation(
  match: EfootballMatch,
  decision: { winnerId: string | null; scoreA: number; scoreB: number; adminId: string; note?: string }
): Partial<EfootballMatch> & { shouldUpdateBracket: boolean; shouldUpdateStats: boolean } {
  if (match.status !== "CONTESTATION") throw new Error("Pas en contestation");
  const loserId = decision.winnerId ? (decision.winnerId === match.player_a.id ? match.player_b?.id || null : match.player_a.id) : null;
  return {
    status: "TERMINE" as MatchStatus,
    final_score_a: decision.scoreA,
    final_score_b: decision.scoreB,
    winner_id: decision.winnerId,
    loser_id: loserId,
    is_contested: false,
    validated_by_admin: decision.adminId,
    validated_at: new Date().toISOString(),
    status_detail: decision.note || `Résolu par admin: ${decision.scoreA}-${decision.scoreB}`,
    shouldUpdateBracket: true,
    shouldUpdateStats: true,
  };
}

// Bracket / Tournoi update après victoire (logique réelle, pas simu eFootball)
export function updateBracketAfterWin(input: {
  match: EfootballMatch;
  tournamentId: string;
  winnerId: string;
}): { nextMatchId: string | null; shouldNotify: string[] } {
  // E-TOURNOIS CI organise seulement - ici on prépare la progression bracket, sans simuler eFootball
  // Retourne l'ID du prochain match où le winner doit être placé
  // Implémentation côté serveur: update bracket_data JSONB du tournament
  // Pour le mock, on retourne null = à implémenter avec Supabase
  return {
    nextMatchId: null, // à calculer depuis tournament.bracket_data
    shouldNotify: [input.winnerId, "ADMIN"], // notifier winner + admin
  };
}

export function getStatusProgress(status: MatchStatus): number {
  const idx = MATCH_STATUS_ORDER.indexOf(status);
  if (status === "CONTESTATION") return 6; // entre RESULTAT_CONFIRME et TERMINE visuellement
  if (status === "RESULTAT_EN_ATTENTE") return 5;
  if (status === "RESULTAT_CONFIRME") return 6;
  return idx >= 0 ? idx : 0;
}

export function formatTimeLeft(scheduledAt: string): { text: string; urgent: boolean; expired: boolean } {
  const now = new Date().getTime();
  const sch = new Date(scheduledAt).getTime();
  const diff = sch - now;
  if (diff <= 0) return { text: "C'est l'heure !", urgent: true, expired: true };
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return { text: `J-${days} · ${hours % 24}h ${mins % 60}min`, urgent: false, expired: false };
  if (hours > 0) return { text: `${hours}h ${mins % 60}min restant`, urgent: hours < 1, expired: false };
  return { text: `${mins} min restant`, urgent: mins < 15, expired: false };
}

export function generateMockMatch(matchId: string): EfootballMatch {
  const mockA: PlayerMatchProfile = {
    id: "player-a-uuid",
    username: "RavenCI",
    display_name: "Raven Côte d\'Ivoire",
    avatar_url: null,
    efootball_pseudo: "RavenCI_225",
    whatsapp_number: "07 48 23 52 26",
    wave_number: "07 48 23 52 26",
    wins: 47,
    losses: 12,
    tournaments_played: 8,
    tournaments_won: 3,
    draws: 2,
    current_streak: 5,
    best_streak: 9,
    level: 24,
    role: "JOUEUR",
    titles: ["Champion x3", "Invaincu 7 matchs", "Boss eFootball"],
  };
  const mockB: PlayerMatchProfile = {
    id: "player-b-uuid",
    username: "Kev_225",
    display_name: "Kevin Abidjan",
    avatar_url: null,
    efootball_pseudo: "KevPro_Abidjan",
    whatsapp_number: "01 51 42 99 18",
    wave_number: "01 51 42 99 18",
    wins: 39,
    losses: 18,
    tournaments_played: 6,
    tournaments_won: 1,
    draws: 3,
    current_streak: 2,
    best_streak: 6,
    level: 19,
    role: "JOUEUR",
    titles: ["Finaliste x2", "Roi du 1V1"],
  };
  const now = new Date();
  const scheduled = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  return {
    id: matchId,
    type: matchId.startsWith("t") ? "TOURNOI" : "1V1",
    status: "PROGRAMME" as MatchStatus,
    tournament_id: "tournoi-123",
    tournament_title: "E-TOURNOIS CI CUP #15 - eFootball",
    bracket_round: "QUARTS DE FINALE",
    scheduled_at: scheduled.toISOString(),
    player_a: mockA,
    player_b: mockB,
    salon_info: null,
    player_a_connected: false,
    player_b_connected: false,
    match_started_at: null,
    result_declarations: [],
    final_score_a: null,
    final_score_b: null,
    winner_id: null,
    loser_id: null,
    is_contested: false,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };
}
