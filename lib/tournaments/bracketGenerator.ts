export type BracketMatch = {
  id: string; tournament_id: string; round: string; round_number: number; position: number;
  player_a_id: string|null; player_b_id: string|null; winner_id: string|null;
  next_match_id: string|null; next_match_slot: "A"|"B"|null; status: string;
  player_a_username?: string|null; player_b_username?: string|null;
};

/** Générateur générique côté application. La génération officielle en production est faite par le RPC Supabase. */
export function generateSingleEliminationBracket(players:{id:string;username:string}[], tournamentId:string): BracketMatch[]{
  if(players.length<2) return [];
  const slots=2**Math.ceil(Math.log2(players.length));
  const rounds=Math.log2(slots); const result:BracketMatch[]=[];
  for(let r=1;r<=rounds;r++){
    const count=slots/(2**r);
    for(let m=1;m<=count;m++) result.push({id:`${tournamentId}-${r}-${m}`,tournament_id:tournamentId,round_number:r,round:r===rounds?"FINALE":r===rounds-1?"DEMIS":r===rounds-2?"QUARTS":`TOUR_${r}`,position:m,player_a_id:null,player_b_id:null,winner_id:null,next_match_id:r<rounds?`${tournamentId}-${r+1}-${Math.ceil(m/2)}`:null,next_match_slot:r<rounds?(m%2?"A":"B"):null,status:"A_VENIR"});
  }
  const first=result.filter(m=>m.round_number===1);
  players.forEach((p,i)=>{const m=first[Math.floor(i/2)];if(!m)return;if(i%2===0){m.player_a_id=p.id;m.player_a_username=p.username}else{m.player_b_id=p.id;m.player_b_username=p.username}});
  for(const m of first){if(m.player_a_id&&!m.player_b_id){m.winner_id=m.player_a_id;m.status="TERMINE"}else if(!m.player_a_id&&m.player_b_id){m.winner_id=m.player_b_id;m.status="TERMINE"}else if(m.player_a_id&&m.player_b_id)m.status="A_VENIR"}
  return result;
}

export function generateBracket10Real(players:{id:string;username:string}[], tournamentId:string){if(players.length!==10)throw new Error("Bracket 10 nécessite exactement 10 joueurs");return generateSingleEliminationBracket(players,tournamentId);}

export async function advanceWinnerReal(supabase:any,matchId:string,winnerId:string){
 const{data,error}=await supabase.from("matches").select("*").eq("id",matchId).single();if(error||!data)throw new Error("Match non trouvé");
 const loser=data.player1_id===winnerId?data.player2_id:data.player1_id;
 const{error:updateError}=await supabase.from("matches").update({winner_id:winnerId,loser_id:loser,status:"TERMINE",finished_at:new Date().toISOString()}).eq("id",matchId);if(updateError)throw updateError;
 if(data.next_match_id){const patch=data.next_match_slot==="player1"?{player1_id:winnerId}:{player2_id:winnerId};await supabase.from("matches").update(patch).eq("id",data.next_match_id)}else if(data.tournament_id){await supabase.from("tournaments").update({status:"TERMINE",winner_id:winnerId,end_date:new Date().toISOString()}).eq("id",data.tournament_id)}
 return {isFinal:!data.next_match_id,nextMatchId:data.next_match_id||null,championId:!data.next_match_id?winnerId:null};
}
