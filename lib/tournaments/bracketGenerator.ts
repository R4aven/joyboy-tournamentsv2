// 🇨🇮 JOYBOY TOURNAMENTS - BRACKET 10 JOUEURS RÉEL
// 10 joueurs → phase préliminaire 2 matchs (7v10, 8v9) → 8 joueurs → quarts (4) → demis (2) → finale (1) = 9 matchs
// Aucun joueur en double, déterministe, injection auto vainqueur

export type BracketMatch = {
  id: string;
  tournament_id: string;
  round: 'PRELIMINAIRE' | 'QUARTS' | 'DEMIS' | 'FINALE';
  position: number;
  player_a_id: string | null;
  player_b_id: string | null;
  winner_id: string | null;
  next_match_id: string | null;
  next_match_slot: 'A' | 'B' | null;
  status: string;
};

export function generateBracket10Real(players: { id: string, username: string }[], tournamentId: string) {
  if (players.length !== 10) throw new Error('Bracket 10 nécessite exactement 10 joueurs');
  
  // Classement: 1-10 (1 = tête de série)
  const sorted = [...players]; // déjà trié par admin ou aléatoire
  
  // Structure:
  // Préliminaire: M1: 7v10, M2: 8v9
  // Quarts: Q1: 1 vs vainqueur M1, Q2: 4 vs 5, Q3: 2 vs vainqueur M2, Q4: 3 vs 6
  // Demis: D1: Q1 vs Q2, D2: Q3 vs Q4
  // Finale: F1: D1 vs D2
  
  const matches: any[] = [];
  
  // Préliminaires
  const prelim1 = { id: `prelim1_${tournamentId}`, tournament_id: tournamentId, round: 'PRELIMINAIRE', position: 1, player_a_id: sorted[6].id, player_b_id: sorted[9].id, player_a_username: sorted[6].username, player_b_username: sorted[9].username, next_match_id: `quart1_${tournamentId}`, next_match_slot: 'B', status: 'PROGRAMME' };
  const prelim2 = { id: `prelim2_${tournamentId}`, tournament_id: tournamentId, round: 'PRELIMINAIRE', position: 2, player_a_id: sorted[7].id, player_b_id: sorted[8].id, player_a_username: sorted[7].username, player_b_username: sorted[8].username, next_match_id: `quart3_${tournamentId}`, next_match_slot: 'B', status: 'PROGRAMME' };
  matches.push(prelim1, prelim2);
  
  // Quarts
  const quart1 = { id: `quart1_${tournamentId}`, tournament_id: tournamentId, round: 'QUARTS', position: 3, player_a_id: sorted[0].id, player_b_id: null, player_a_username: sorted[0].username, player_b_username: 'Vainqueur M1 (7v10)', next_match_id: `demi1_${tournamentId}`, next_match_slot: 'A', status: 'EN_ATTENTE_ADVERSAIRE' };
  const quart2 = { id: `quart2_${tournamentId}`, tournament_id: tournamentId, round: 'QUARTS', position: 4, player_a_id: sorted[3].id, player_b_id: sorted[4].id, player_a_username: sorted[3].username, player_b_username: sorted[4].username, next_match_id: `demi1_${tournamentId}`, next_match_slot: 'B', status: 'PROGRAMME' };
  const quart3 = { id: `quart3_${tournamentId}`, tournament_id: tournamentId, round: 'QUARTS', position: 5, player_a_id: sorted[1].id, player_b_id: null, player_a_username: sorted[1].username, player_b_username: 'Vainqueur M2 (8v9)', next_match_id: `demi2_${tournamentId}`, next_match_slot: 'A', status: 'EN_ATTENTE_ADVERSAIRE' };
  const quart4 = { id: `quart4_${tournamentId}`, tournament_id: tournamentId, round: 'QUARTS', position: 6, player_a_id: sorted[2].id, player_b_id: sorted[5].id, player_a_username: sorted[2].username, player_b_username: sorted[5].username, next_match_id: `demi2_${tournamentId}`, next_match_slot: 'B', status: 'PROGRAMME' };
  matches.push(quart1, quart2, quart3, quart4);
  
  // Demis
  const demi1 = { id: `demi1_${tournamentId}`, tournament_id: tournamentId, round: 'DEMIS', position: 7, player_a_id: null, player_b_id: null, player_a_username: 'Vainqueur Q1', player_b_username: 'Vainqueur Q2', next_match_id: `finale_${tournamentId}`, next_match_slot: 'A', status: 'PROGRAMME' };
  const demi2 = { id: `demi2_${tournamentId}`, tournament_id: tournamentId, round: 'DEMIS', position: 8, player_a_id: null, player_b_id: null, player_a_username: 'Vainqueur Q3', player_b_username: 'Vainqueur Q4', next_match_id: `finale_${tournamentId}`, next_match_slot: 'B', status: 'PROGRAMME' };
  matches.push(demi1, demi2);
  
  // Finale
  const finale = { id: `finale_${tournamentId}`, tournament_id: tournamentId, round: 'FINALE', position: 9, player_a_id: null, player_b_id: null, player_a_username: 'Vainqueur D1', player_b_username: 'Vainqueur D2', next_match_id: null, next_match_slot: null, status: 'PROGRAMME' };
  matches.push(finale);
  
  return matches; // 9 matchs
}

export async function advanceWinnerReal(supabase: any, matchId: string, winnerId: string) {
  // Trouve match actuel
  const { data: currentMatch } = await supabase.from('matches').select('*').eq('id', matchId).single();
  if (!currentMatch) throw new Error('Match non trouvé');
  
  // Maj match actuel
  await supabase.from('matches').update({
    winner_id: winnerId,
    loser_id: currentMatch.player_a_id === winnerId ? currentMatch.player_b_id : currentMatch.player_a_id,
    status: 'TERMINE',
    final_score_a: currentMatch.final_score_a,
    final_score_b: currentMatch.final_score_b,
    updated_at: new Date().toISOString()
  }).eq('id', matchId);
  
  // Si finale → champion
  if (!currentMatch.next_match_id) {
    // Tournoi terminé
    await supabase.from('tournaments').update({ status: 'TERMINE', champion_id: winnerId }).eq('id', currentMatch.tournament_id);
    await supabase.from('profiles').update({ tournaments_won: supabase.raw('tournaments_won + 1') }).eq('id', winnerId);
    // Notif champion
    await supabase.from('notifications').insert({
      user_id: winnerId,
      type: 'TOURNOI_VICTOIRE',
      title: '🏆 Champion !',
      message: 'Bravo champion ! Tu as remporté le tournoi. Ton djai est prêt sur Wave ! 🇨🇮'
    });
    return { isFinal: true, championId: winnerId };
  }
  
  // Injecte vainqueur dans prochain match
  const { data: nextMatch } = await supabase.from('matches').select('*').eq('id', currentMatch.next_match_id).single();
  if (!nextMatch) throw new Error('Prochain match non trouvé');
  
  const slot = currentMatch.next_match_slot; // A ou B
  if (slot === 'A') {
    await supabase.from('matches').update({ player_a_id: winnerId, status: nextMatch.player_b_id ? 'PROGRAMME' : 'EN_ATTENTE_ADVERSAIRE' }).eq('id', nextMatch.id);
  } else {
    await supabase.from('matches').update({ player_b_id: winnerId, status: nextMatch.player_a_id ? 'PROGRAMME' : 'EN_ATTENTE_ADVERSAIRE' }).eq('id', nextMatch.id);
  }
  
  // Maj stats
  const loserId = currentMatch.player_a_id === winnerId ? currentMatch.player_b_id : currentMatch.player_a_id;
  await supabase.from('profiles').update({ wins: supabase.raw('wins + 1') }).eq('id', winnerId);
  await supabase.from('profiles').update({ losses: supabase.raw('losses + 1') }).eq('id', loserId);
  
  // Notif prochain match
  await supabase.from('notifications').insert({
    user_id: winnerId,
    type: 'MATCH_QUALIFICATION',
    title: '⚔ Qualification !',
    message: `Tu avances au tour suivant ! Prochain match: ${nextMatch.round}`
  });
  
  return { isFinal: false, nextMatchId: nextMatch.id };
}