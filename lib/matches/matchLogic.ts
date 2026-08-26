
/**
 * JOYBOY - Logique metier Match Salon eFootball
 * Fix build Netlify : ternary casse + winnerId narrowing
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

export function canCreateSalon(match: EfootballMatch, userId: string): boolean {
  if (match.salon_info) return false;
  if (!match.player_b) return false;
  return match.player_a.id === userId || match.player_b.id === userId;
}

export function createSalonInfo(input: {
  salonId: string;
  code?: string;
  instructions: string;
  createdBy: string;
}): { salon: SalonInfo; nextStatus: MatchStatus } {
  if (!input.salonId || input.salonId.trim().length < 2) {
    throw new Error("ID Salon eFootball obligatoire");
  }
  if (!input.instructions || input.instructions.trim().length < 5) {
    throw new Error("Instructions obligatoires");
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
  if (!match.salon_info) throw new Error("Salon non cree");
  const isA = match.player_a.id === playerId;
  const isB = match.player_b?.id === playerId;
  if (!isA && !isB) throw new Error("Tu n'es pas joueur de ce match");
  const player_a_connected = isA ? true : match.player_a_connected;
  const player_b_connected = isB ? true : match.player_b_connected;
  let nextStatus: MatchStatus = match.status;
  if (player_a_connected && player_b_connected) {
    nextStatus = "JOUEURS_CONNECTES";
  }
  return {
    player_a_connected,
    player_b_connected,
    status: nextStatus,
    status_detail: player_a_connected && player_b_connected ? "Les 2 joueurs connectes, pret a lancer !" : undefined,
  };
}

export function startMatch(match: EfootballMatch, triggeredBy: string): Partial<EfootballMatch> {
  if (!match.salon_info) throw new Error("Salon non cree");
  if (!match.player_a_connected || !match.player_b_connected) {
    throw new Error("Les 2 joueurs doivent etre connectes");
  }
  const isPlayer = match.player_a.id === triggeredBy || match.player_b?.id === triggeredBy;
  if (!isPlayer) throw new Error("Non autorise");
  return {
    status: "MATCH_EN_COURS" as MatchStatus,
    match_started_at: new Date().toISOString(),
    status_detail: "Match en cours sur eFootball",
  };
}

export function declareResult(
  match: EfootballMatch,
  declaration: Omit<ResultDeclaration, "declaredAt" | "playerUsername"> & { playerUsername: string }
): { updatedDeclarations: ResultDeclaration[]; nextStatus: MatchStatus; autoConfirm?: boolean } {
  if (match.status !== "MATCH_EN_COURS" && match.status !== "RESULTAT_EN_ATTENTE") {
    throw new Error(`Statut invalide: ${match.status}`);
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
  const check = checkDeclarationsMatch(updated[0], updated[1]);
  if (check.match === true) {
    return { updatedDeclarations: updated, nextStatus: "RESULTAT_CONFIRME", autoConfirm: true };
  } else if (check.match === false) {
    return { updatedDeclarations: updated, nextStatus: "CONTESTATION" };
  }
  return { updatedDeclarations: updated, nextStatus: "RESULTAT_EN_ATTENTE" };
}

export function checkDeclarationsMatch(decA: ResultDeclaration, decB: ResultDeclaration): DeclarationMatchResult {
  if (decA.scoreA === decB.scoreA && decA.scoreB === decB.scoreB) {
    const winnerTag = decA.scoreA > decA.scoreB ? "__PLAYER_A__" : decA.scoreA < decA.scoreB ? "__PLAYER_B__" : "DRAW";
    return { match: true, winnerId: winnerTag };
  }
  return { match: false, reason: `Declarations differentes: ${decA.scoreA}-${decA.scoreB} vs ${decB.scoreA}-${decB.scoreB}` };
}

export function checkDeclarationsMatchWithMatch(match: EfootballMatch, declarations: ResultDeclaration[]): DeclarationMatchResult {
  if (declarations.length < 2) return { match: null, reason: "WAITING_SECOND" };
  const [d1, d2] = declarations;
  if (d1.scoreA === d2.scoreA && d1.scoreB === d2.scoreB) {
    if (d1.scoreA > d1.scoreB) return { match: true, winnerId: match.player_a.id };
    if (d1.scoreA < d1.scoreB) return { match: true, winnerId: match.player_b ? match.player_b.id : d2.playerId };
    return { match: true, winnerId: "DRAW" };
  }
  return { match: false, reason: `Score A: ${d1.scoreA}-${d1.scoreB} != Score B: ${d2.scoreA}-${d2.scoreB}` };
}

export function confirmResult(
  match: EfootballMatch,
  adminId?: string | null
): Partial<EfootballMatch> & { shouldUpdateBracket: boolean; shouldUpdateStats: boolean } {
  if (match.result_declarations.length < 2 && !adminId) {
    throw new Error("Deux declarations requises ou validation admin");
  }
  let winnerId: string | null = null;
  let finalA: number;
  let finalB: number;

  if (match.result_declarations.length >= 2) {
    const check = checkDeclarationsMatchWithMatch(match, match.result_declarations);
    if (check.match !== true && !adminId) {
      throw new Error("Declarations non concordantes");
    }
    finalA = match.result_declarations[0].scoreA;
    finalB = match.result_declarations[0].scoreB;
    if (check.match === true) {
      winnerId = check.winnerId;
      if (check.winnerId === "DRAW") {
        winnerId = null;
      }
    } else {
      winnerId = null;
    }
  } else {
    finalA = match.result_declarations[0].scoreA;
    finalB = match.result_declarations[0].scoreB;
    if (finalA > finalB) winnerId = match.player_a.id;
    else if (finalB > finalA) winnerId = match.player_b?.id || null;
  }

  if (finalA! > finalB!) winnerId = match.player_a.id;
  else if (finalB! > finalA!) winnerId = match.player_b?.id || null;
  else winnerId = null;

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
    updated_at: new Date().toISOString(),
    shouldUpdateBracket: true,
    shouldUpdateStats: true,
  } as any;
}

export function contestMatch(match: EfootballMatch, reason: string, byUserId: string): Partial<EfootballMatch> {
  return {
    status: "CONTESTATION" as MatchStatus,
    is_contested: true,
    contested_reason: reason,
    status_detail: `Contestation par ${byUserId}: ${reason}`,
    updated_at: new Date().toISOString(),
  };
}
