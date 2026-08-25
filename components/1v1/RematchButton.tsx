
"use client";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
export function RematchButton({ originalMatchId, requesterId, opponentId }: { originalMatchId: string, requesterId: string, opponentId: string }) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const handleRematch = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('rematch_requests').insert({ original_match_id: originalMatchId, requester_id: requesterId, opponent_id: opponentId, status: 'PENDING' });
      if (error) throw error;
      toast.success("Demande de revanche envoyée ! 🔥");
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  };
  return <button onClick={handleRematch} disabled={loading} className="h-11 w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-black text-[12px]">🔥 REVANCHE ? ⚔ DEMANDER UNE REVANCHE</button>;
}
