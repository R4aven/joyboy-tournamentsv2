
"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
export function TournamentRulesAcceptance({ tournamentId, playerId, onAccepted }: { tournamentId: string, playerId: string, onAccepted: () => void }) {
  const [rule, setRule] = useState<any>(null);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  useEffect(() => {
    const fetchRule = async () => {
      const { data } = await supabase.from('tournament_rules').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).single();
      if (data) setRule(data);
      else setRule({ id: 'default', version: 'v1.0', title: 'Règlement E-TOURNOIS CI', content: 'Règlement officiel...' });
      const { data: existing } = await supabase.from('rule_acceptances').select('*').eq('player_id', playerId).eq('tournament_id', tournamentId).maybeSingle();
      if (existing) { setAccepted(true); onAccepted(); }
    };
    fetchRule();
  }, [tournamentId, playerId]);
  const handleAccept = async () => {
    if (!accepted) { toast.error("Tu dois accepter le règlement"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from('rule_acceptances').insert({ player_id: playerId, tournament_id: tournamentId, rule_id: rule.id, rule_version: rule.version });
      if (error) throw error;
      toast.success("Règlement accepté !");
      onAccepted();
    } catch (e: any) {
      if (e.message.includes('duplicate')) onAccepted();
      else toast.error(e.message);
    } finally { setLoading(false); }
  };
  if (!rule) return <div className="h-20 rounded-xl bg-[#15151E] animate-pulse" />;
  return (
    <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-6">
      <h3 className="font-black text-[14px]">📜 {rule.title} - {rule.version}</h3>
      <div className="mt-3 max-h-[200px] overflow-auto rounded-xl bg-[#08080B] border border-[#22222F] p-4 text-[12px] leading-relaxed whitespace-pre-wrap text-zinc-300">{rule.content}</div>
      <label className="mt-4 flex items-start gap-3 cursor-pointer"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)} className="mt-1 h-4 w-4 rounded" /><span className="text-[12px]"><span className="font-black">☑ J'ai lu et accepté le règlement {rule.version}</span> - Obligatoire</span></label>
      <button onClick={handleAccept} disabled={!accepted || loading} className="mt-4 h-12 w-full rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-white font-black disabled:opacity-40">PARTICIPER AU TOURNOI</button>
    </div>
  );
}
