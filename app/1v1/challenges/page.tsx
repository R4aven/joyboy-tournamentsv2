"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Swords, Inbox, Send, Loader2, ArrowLeft, Zap, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { acceptChallengeLogic, refuseChallengeLogic } from "@/lib/1v1/challengeLogic";
import type { Challenge1v1 } from "@/lib/1v1/challengeLogic";
import ChallengeCard from "@/components/1v1/ChallengeCard";
import { toast } from "sonner";

type Tab = "recus" | "envoyes" | "tous";

export default function ChallengesPage() {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("recus");
  const [challenges, setChallenges] = useState<Challenge1v1[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id;
      if (!uid) { setChallenges([]); setLoading(false); return; }
      setCurrentUserId(uid);

      const { data, error } = await supabase
        .from("challenges_1v1")
        .select(`
          *,
          challenger:profiles!challenges_1v1_challenger_id_fkey(id, username, display_name, avatar_url, wins, losses, tournaments_won, challenges_won),
          challenged:profiles!challenges_1v1_challenged_id_fkey(id, username, display_name, avatar_url, wins, losses, tournaments_won, challenges_won)
        `)
        .or(`challenger_id.eq.${uid},challenged_id.eq.${uid}`)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      if (data) {
        const mapped = (data as any[]).map((c) => {
          const ch = c.challenger;
          const ch2 = c.challenged;
          return {
            ...c,
            challenger: ch ? { id: ch.id, pseudo: ch.display_name || ch.username, username: ch.username, avatar_url: ch.avatar_url, matchs: (ch.wins||0)+(ch.losses||0), victoires: ch.wins||0, defaites: ch.losses||0, taux_victoire: ch.wins ? Math.round(ch.wins/((ch.wins+ch.losses)||1)*100) : 0, tournois_remportes: ch.tournaments_won||0, victoires_1v1: ch.challenges_won||0, palmares: [] } : undefined,
            challenged: ch2 ? { id: ch2.id, pseudo: ch2.display_name || ch2.username, username: ch2.username, avatar_url: ch2.avatar_url, matchs: (ch2.wins||0)+(ch2.losses||0), victoires: ch2.wins||0, defaites: ch2.losses||0, taux_victoire: ch2.wins ? Math.round(ch2.wins/((ch2.wins+ch2.losses)||1)*100) : 0, tournois_remportes: ch2.tournaments_won||0, victoires_1v1: ch2.challenges_won||0, palmares: [] } : undefined,
          } as Challenge1v1;
        });
        setChallenges(mapped);
      } else {
        setChallenges([]);
      }
    } catch (e:any) {
      console.error(e);
      toast.error(e.message || "Erreur chargement défis");
      setChallenges([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchChallenges(); }, [fetchChallenges]);

  // Realtime défis
  useEffect(() => {
    if (!currentUserId) return;
    const ch = supabase.channel("challenges-1v1-realtime").on("postgres_changes", { event: "*", schema: "public", table: "challenges_1v1", filter: `challenger_id=eq.${currentUserId}` }, () => fetchChallenges()).on("postgres_changes", { event: "*", schema: "public", table: "challenges_1v1", filter: `challenged_id=eq.${currentUserId}` }, () => fetchChallenges()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [currentUserId]);

  const handleAccept = async (id: string) => {
    setActionLoading(`accept-${id}`);
    try { await acceptChallengeLogic(supabase, id, currentUserId); toast.success("Défi accepté ! Passe au paiement 🔥"); fetchChallenges(); }
    catch (e:any) { toast.error(e.message); }
    finally { setActionLoading(null); }
  };

  const handleRefuse = async (id: string) => {
    setActionLoading(`refuse-${id}`);
    try { await refuseChallengeLogic(supabase, id, currentUserId); toast.success("Défi refusé."); fetchChallenges(); }
    catch (e:any) { toast.error(e.message); }
    finally { setActionLoading(null); }
  };

  const filtered = challenges.filter((c) => {
    if (tab === "recus") return c.challenged_id === currentUserId;
    if (tab === "envoyes") return c.challenger_id === currentUserId;
    return true;
  });

  const recusCount = challenges.filter((c) => c.challenged_id === currentUserId && c.statut === "EN_ATTENTE").length;

  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      <div className="sticky top-0 z-30 border-b border-[#22222F] bg-[#08080B]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/1v1" className="h-9 w-9 rounded-xl border border-[#22222F] bg-[#15151E] flex items-center justify-center hover:border-zinc-600 transition"><ArrowLeft className="h-4 w-4" /></Link>
            <div><h1 className="text-lg font-black flex items-center gap-2"><Swords className="h-5 w-5 text-[#A855F7]" /> MES DÉFIS</h1><p className="text-[11px] text-zinc-500 -mt-1">Tes combats 1V1 réels, sans fake</p></div>
          </div>
          <Link href="/1v1" className="rounded-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-4 py-2 text-xs font-bold text-white shadow-[0_0_15px_rgba(124,58,237,0.35)] flex items-center gap-2"><Zap className="h-3.5 w-3.5" /> Nouveau défi</Link>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
        <div className="flex items-center gap-2 rounded-full bg-[#101015] border border-[#22222F] p-1 w-fit mb-6">
          {[{ id: "recus", label: "Reçus", icon: Inbox, count: recusCount }, { id: "envoyes", label: "Envoyés", icon: Send, count: challenges.filter((c) => c.challenger_id === currentUserId).length }, { id: "tous", label: "Tous", icon: Swords, count: challenges.length }].map((t:any) => (
            <button key={t.id} onClick={() => setTab(t.id as Tab)} className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition ${tab === t.id ? "bg-white text-black shadow" : "text-zinc-400 hover:text-white"}`}><t.icon className="h-4 w-4" />{t.label}{t.count > 0 && <span className={`rounded-full px-2 py-0.5 text-[11px] ${tab === t.id ? "bg-black text-white" : "bg-[#22222F] text-zinc-400"}`}>{t.count}</span>}</button>
          ))}
        </div>
        {loading ? <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="rounded-[20px] border border-[#22222F] bg-[#15151E] p-5 animate-pulse h-40" />)}</div> : filtered.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-[#22222F] bg-[#101015] py-20 text-center"><div className="mx-auto h-12 w-12 rounded-2xl bg-[#15151E] border border-[#22222F] flex items-center justify-center mb-4"><Swords className="h-6 w-6 text-zinc-600" /></div><p className="font-semibold text-white">Aucun défi {tab === "recus" ? "reçu" : tab === "envoyes" ? "envoyé" : ""} pour l'instant</p><p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">Va sur la page 1V1 pour défier quelqu'un. 500 FCFA, Wave 01 51 42 99 18, réel.</p><Link href="/1v1" className="mt-6 inline-flex rounded-full bg-white text-black px-6 py-2.5 text-sm font-bold hover:bg-zinc-100 transition">Trouver un adversaire</Link></div>
        ) : <div className="grid gap-4">{filtered.map((c) => <ChallengeCard key={c.id} challenge={c} currentUserId={currentUserId} variant={c.challenged_id === currentUserId ? "recu" : "envoye"} onAccept={handleAccept} onRefuse={handleRefuse} onPay={(id) => (window.location.href = `/1v1/${id}/payment`)} loadingAction={actionLoading} />)}</div>}
        <div className="mt-8 rounded-2xl border border-[#22222F] bg-[#101015] p-4 flex gap-3"><AlertCircle className="h-5 w-5 text-[#06B6D4] shrink-0" /><div className="text-xs leading-relaxed text-zinc-400"><span className="font-semibold text-white">Comment ça marche ?</span> 1) Tu défies → 2) Il accepte → 3) Vous payez chacun 500 F via Wave au <span className="text-white">01 51 42 99 18</span> → 4) Match confirmé → 5) Vous jouez et déclarez le gagnant. Si désaccord → CONTESTÉ → staff JOYBOY tranche WhatsApp <span className="text-white">07 48 23 52 26</span>.</div></div>
      </div>
    </div>
  );
}
