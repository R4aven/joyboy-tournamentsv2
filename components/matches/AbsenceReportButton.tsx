"use client";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function AbsenceReportButton({ matchId, reportedPlayerId, reporterId }: { matchId: string, reportedPlayerId: string, reporterId: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleReport = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('match_absence_reports').insert({
        match_id: matchId,
        reporter_id: reporterId,
        reported_player_id: reportedPlayerId,
        reason: 'Adversaire absent',
        status: 'PENDING'
      });
      if (error) throw error;
      const { error: matchError } = await supabase.from("matches").update({ absence_status: "PENDING", status_detail: "Absence signalée, vérification administrative requise" }).eq("id", matchId);
      if (matchError) throw matchError;
      await supabase.from("notifications").insert({ user_id: reportedPlayerId, type: "ADMIN", title: "🚨 Signalement d'absence", message: "Ton adversaire a signalé une absence. L'administration va vérifier le délai et le contexte.", link: `/matches/${matchId}`, related_id: matchId, related_type: "match" });
      toast.success("Signalement envoyé. L'administration va vérifier.");
      setShowConfirm(false);
    } catch (e: any) {
      toast.error(e.message || "Erreur signalement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={()=>setShowConfirm(true)} className="h-11 w-full rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[12px] font-black flex items-center justify-center gap-2 hover:bg-amber-500/15">
        🚨 SIGNALER UN ADVERSAIRE ABSENT
      </button>
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="rounded-[20px] border border-[#22222F] bg-[#15151E] p-6 max-w-md w-full">
            <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-400" /><h3 className="font-black">Confirmer absence ?</h3></div>
            <p className="mt-3 text-[13px] text-zinc-400">Êtes-vous certain que votre adversaire est absent ? Un signalement abusif peut entraîner une sanction.</p>
            <div className="mt-5 flex gap-2">
              <button onClick={()=>setShowConfirm(false)} className="flex-1 h-11 rounded-xl border border-[#22222F] bg-[#101015] text-[12px] font-bold">Annuler</button>
              <button onClick={handleReport} disabled={loading} className="flex-1 h-11 rounded-xl bg-amber-500 text-black text-[12px] font-black">{loading ? "Envoi..." : "Oui, signaler"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}