// lib/palmares/achievements.ts - Logique auto attribution trophées JOYBOY TOURNAMENTS
// 100% français, identité ivoirienne, pas de ELO

export type MatchResult = {
  id: string;
  joueur_id: string;
  adversaire_id: string;
  tournoi_id?: string;
  duel_id?: string;
  statut: "VALIDE" | "EN_ATTENTE" | "LITIGE" | "ANNULE";
  vainqueur_id?: string | null;
  placement_tournoi?: number; // 1 = champion, 2 = finaliste, 3 = 3eme
  created_at: string;
};

export type PlayerStats = {
  user_id: string;
  pseudo: string;
  victoires_1v1: number;
  victoires_tournoi: number;
  finales: number;
  top3: number;
  titres: number;
  trophies: number;
  streak_actuel: number;
  meilleur_streak: number;
};

export type TrophyDefinition = {
  id: string;
  nom: string;
  description: string;
  icone: string;
  couleur: string;
  rarete: "COMMUN" | "RARE" | "EPIQUE" | "LEGENDAIRE";
  condition: (stats: PlayerStats, historique: MatchResult[]) => boolean;
};

export const TROPHY_DEFINITIONS: TrophyDefinition[] = [
  {
    id: "CHAMPION",
    nom: "Champion",
    description: "Remporte un match officiel. C'est le debut de la legende.",
    icone: "Trophy",
    couleur: "#F59E0B",
    rarete: "COMMUN",
    condition: (s) => s.victoires_tournoi + s.victoires_1v1 >= 1,
  },
  {
    id: "VAINQUEUR_TOURNOI",
    nom: "Vainqueur de Tournoi",
    description: "Tu as souleve la coupe JOYBOY. Abidjan est fier de toi!",
    icone: "Crown",
    couleur: "#FACC15",
    rarete: "RARE",
    condition: (s) => s.titres >= 1,
  },
  {
    id: "FINALISTE",
    nom: "Finaliste",
    description: "Tu es alle en finale. La prochaine c'est pour toi.",
    icone: "Medal",
    couleur: "#94A3B8",
    rarete: "COMMUN",
    condition: (s) => s.finales >= 1,
  },
  {
    id: "TOP3",
    nom: "Podium",
    description: "Top 3 dans un tournoi JOYBOY. Respect.",
    icone: "Award",
    couleur: "#FB923C",
    rarete: "COMMUN",
    condition: (s) => s.top3 >= 1,
  },
  {
    id: "VICTOIRE_1V1",
    nom: "Tueur en 1V1",
    description: "5 victoires en duel 1V1. Tu fais mal.",
    icone: "Swords",
    couleur: "#06B6D4",
    rarete: "RARE",
    condition: (s) => s.victoires_1v1 >= 5,
  },
  {
    id: "SERIE_3",
    nom: "En Feu (x3)",
    description: "3 victoires daffilee. Serie en cours!",
    icone: "Flame",
    couleur: "#F97316",
    rarete: "RARE",
    condition: (s) => s.meilleur_streak >= 3,
  },
  {
    id: "SERIE_5",
    nom: "Imbattable (x5)",
    description: "5 victoires daffilee. Personne peut te toucher.",
    icone: "Flame",
    couleur: "#EF4444",
    rarete: "EPIQUE",
    condition: (s) => s.meilleur_streak >= 5,
  },
  {
    id: "SERIE_10",
    nom: "Demon (x10)",
    description: "10 victoires daffilee. Tu es le demon d'Abidjan.",
    icone: "Flame",
    couleur: "#7C3AED",
    rarete: "LEGENDAIRE",
    condition: (s) => s.meilleur_streak >= 10,
  },
  {
    id: "MULTI_CHAMPION",
    nom: "Multiple Champion",
    description: "3 titres de champion. Une dynastie JOYBOY.",
    icone: "Crown",
    couleur: "#A855F7",
    rarete: "LEGENDAIRE",
    condition: (s) => s.titres >= 3,
  },
  {
    id: "LEGENDE",
    nom: "Legende JOYBOY",
    description: "10 titres et 50 victoires. Tu es une legende vivante.",
    icone: "Star",
    couleur: "#06B6D4",
    rarete: "LEGENDAIRE",
    condition: (s) => s.titres >= 10 && (s.victoires_1v1 + s.victoires_tournoi) >= 50,
  },
];

export function computePlayerStats(userId: string, results: MatchResult[], pseudo: string = ""): PlayerStats {
  const sorted = [...results]
    .filter((r) => r.statut === "VALIDE")
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  let victoires_1v1 = 0;
  let victoires_tournoi = 0;
  let finales = 0;
  let top3 = 0;
  let titres = 0;
  let streak_actuel = 0;
  let meilleur_streak = 0;
  let current = 0;

  for (const r of sorted) {
    const isWinner = r.vainqueur_id === userId;
    const isParticipant = r.joueur_id === userId || r.adversaire_id === userId || r.vainqueur_id === userId;

    if (!isParticipant) continue;

    if (r.tournoi_id) {
      if (isWinner) victoires_tournoi++;
      if (r.placement_tournoi === 1 && isWinner) {
        titres++;
        finales++;
        top3++;
      } else if (r.placement_tournoi === 2) {
        finales++;
        top3++;
      } else if (r.placement_tournoi === 3) {
        top3++;
      }
    } else {
      if (isWinner) victoires_1v1++;
    }

    // streak
    if (isWinner) {
      current++;
      streak_actuel = current;
      meilleur_streak = Math.max(meilleur_streak, current);
    } else {
      current = 0;
      streak_actuel = 0;
    }
  }

  const trophies = titres * 10 + victoires_1v1 + victoires_tournoi * 2 + finales * 2 + top3;

  return {
    user_id: userId,
    pseudo,
    victoires_1v1,
    victoires_tournoi,
    finales,
    top3,
    titres,
    trophies,
    streak_actuel,
    meilleur_streak,
  };
}

export function getEarnedTrophies(stats: PlayerStats, historique: MatchResult[]) {
  return TROPHY_DEFINITIONS.filter((t) => t.condition(stats, historique));
}

export function checkNewAchievements(prevStats: PlayerStats, newStats: PlayerStats, historique: MatchResult[]) {
  const prevEarned = new Set(getEarnedTrophies(prevStats, historique).map((t) => t.id));
  const nowEarned = getEarnedTrophies(newStats, historique);
  return nowEarned.filter((t) => !prevEarned.has(t.id));
}

// Logique attribution automatique cote serveur
export async function attribuerTropheesAutomatiques(
  supabase: any,
  userId: string,
  allResults: MatchResult[]
) {
  const { data: profile } = await supabase.from("profiles").select("pseudo").eq("id", userId).single();
  const stats = computePlayerStats(userId, allResults, profile?.pseudo ?? "");
  const trophies = getEarnedTrophies(stats, allResults);

  // Upsert dans user_trophies
  for (const trophy of trophies) {
    await supabase.from("user_trophies").upsert(
      {
        user_id: userId,
        trophy_id: trophy.id,
        nom: trophy.nom,
        earned_at: new Date().toISOString(),
      },
      { onConflict: "user_id,trophy_id" }
    );
  }

  // Update profile stats
  await supabase.from("profiles").update({
    victoires: stats.victoires_1v1 + stats.victoires_tournoi,
    titres: stats.titres,
    trophies: stats.trophies,
    meilleur_streak: stats.meilleur_streak,
  }).eq("id", userId);

  return { stats, trophies };
}
