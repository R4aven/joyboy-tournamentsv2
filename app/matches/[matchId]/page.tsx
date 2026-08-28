"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MatchCountdown } from "@/components/matches/MatchCountdown";
import { MatchChat } from "@/components/matches/MatchChat";
import { AbsenceReportButton } from "@/components/matches/AbsenceReportButton";
import { Trophy, Gamepad2, Lock, Check, Upload, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { createSafeStoragePath, validateImageFile } from "@/lib/storage/safePath";

export default function MatchPage() {
  const { matchId } = useParams() as { matchId: string };
  const { user } = useAuth() as any;
  const supabase = createClient();
  const [match, setMatch] = useState<any>(null);
  const [salon, setSalon] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ salon_id: "", salon_code: "", salon_instructions: "" });
  const [creating, setCreating] = useState(false);
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [proof, setProof] = useState<File | null>(null);
  const [declaring, setDeclaring] = useState(false);

  const load = async () => {
    const { data: m, error } = await supabase
      .from("matches")
      .select("*,player1:player1_id(id,username,display_name,avatar_url,role),player2:player2_id(id,username,display_name,avatar_url,role)")
      .eq("id", matchId)
      .single();
    if (error || !m) { setLoading(false); return; }
    setMatch(m);
    const { data: s } = await supabase.from("match_salons").select("*").eq("match_id", matchId).maybeSingle();
    setSalon(s);
    const { data: r } = await supabase.from("match_absence_reports").select("*").eq("match_id", matchId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    setReport(r || null);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase.channel(`match-live-${matchId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches", filter: `id=eq.${matchId}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "match_salons", filter: `match_id=eq.${matchId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [matchId]);

  if (loading) return <div className="min-h-screen bg-[#08080B] text-white p-10">Chargement...</div>;
  if (!match) return <div className="min-h-screen bg-[#08080B] text-white p-10">Match introuvable.</div>;

  const participant = !!user && (user.id === match.player1_id || user.id === match.player2_id);
  const opponentId = user?.id === match.player1_id ? match.player2_id : match.player1_id;

  const createSalon = async () => {
    if (!participant || !form.salon_id.trim() || !form.salon_instructions.trim()) return toast.error("Renseigne l'identifiant et les instructions du salon.");
    setCreating(true);
    try {
      const { error } = await supabase.from("match_salons").insert({ match_id: matchId, salon_id: form.salon_id.trim(), salon_code: form.salon_code.trim() || null, salon_instructions: form.salon_instructions.trim(), created_by: user.id });
      if (error) throw error;
      await supabase.from("matches").update({ status: "EN_COURS", status_detail: "Salon privé créé" }).eq("id", matchId);
      toast.success("Salon enregistré.");
      load();
    } catch { toast.error("Impossible d'enregistrer le salon."); }
    finally { setCreating(false); }
  };

  const declare = async () => {
    if (!participant || !proof) return toast.error("Ajoute la capture du résultat.");
    const validation = validateImageFile(proof);
    if (validation) return toast.error(validation);
    if (score1 === score2) return toast.error("Un match doit avoir un vainqueur.");
    setDeclaring(true);
    try {
      const path = createSafeStoragePath("results", user.id, proof, "match");
      const { error: uploadError } = await supabase.storage.from("tournament_proofs").upload(path, proof, { upsert: false, contentType: proof.type });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("tournament_proofs").getPublicUrl(path);
      const { data: result, error } = await supabase.rpc("submit_match_result", { p_match: matchId, p_score1: score1, p_score2: score2, p_proof_url: urlData.publicUrl });
      if (error) throw error;
      toast.success(result === "CONFIRMED" ? "Résultat confirmé." : result === "CONTESTED" ? "Les déclarations sont différentes. L'administration va arbitrer." : "Résultat envoyé, en attente de l'adversaire.");
      load();
    } catch (e:any) { console.error("Result submission failed", e); toast.error("Impossible d'envoyer le résultat."); }
    finally { setDeclaring(false); }
  };

  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/matches" className="text-xs text-zinc-500">← Mes matchs</Link>
        <div className="mt-5 rounded-2xl border border-zinc-800 bg-[#101015] p-6">
          <div className="flex flex-wrap justify-between gap-3">
            <div><p className="text-xs text-zinc-500 uppercase">{match.type || "1V1"} • {match.round_name || "Match"}</p><h1 className="text-2xl font-black mt-1">{match.player1?.username || "Joueur"} <span className="text-zinc-600">vs</span> {match.player2?.username || "Adversaire"}</h1></div>
            <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-3 py-1 text-xs font-bold">{match.status}</span>
          </div>
          {match.no_show_deadline && <div className="mt-5"><MatchCountdown windowEnd={match.no_show_deadline} windowStart={match.window_start} /></div>}
          {participant && opponentId && <div className="mt-3"><AbsenceReportButton matchId={matchId} reportedPlayerId={opponentId} reporterId={user.id} /></div>}
        </div>

        <div className="mt-5 rounded-2xl border border-violet-500/20 bg-[#101015] p-5">
          <div className="flex items-center gap-2 font-black"><Lock className="h-4 w-4 text-violet-400" />Salon eFootball privé</div>
          {salon ? (
            <div className="mt-4 space-y-3"><div><p className="text-[10px] text-zinc-500">SALON</p><p className="font-black">{salon.salon_id}</p></div>{salon.salon_code && <div><p className="text-[10px] text-zinc-500">CODE</p><p className="font-bold">{salon.salon_code}</p></div>}<div><p className="text-[10px] text-zinc-500">INSTRUCTIONS</p><p className="text-sm text-zinc-300 whitespace-pre-wrap">{salon.salon_instructions}</p></div><div className="text-xs text-emerald-300 flex items-center gap-2"><Check className="h-4 w-4" />Salon enregistré</div></div>
          ) : participant ? (
            <div className="mt-4 space-y-3"><input value={form.salon_id} onChange={e=>setForm({...form,salon_id:e.target.value})} placeholder="Identifiant du salon" className="w-full rounded-xl bg-[#15151E] border border-zinc-800 p-3 text-sm"/><input value={form.salon_code} onChange={e=>setForm({...form,salon_code:e.target.value})} placeholder="Code (facultatif)" className="w-full rounded-xl bg-[#15151E] border border-zinc-800 p-3 text-sm"/><textarea value={form.salon_instructions} onChange={e=>setForm({...form,salon_instructions:e.target.value})} placeholder="Instructions pour l'adversaire" className="w-full rounded-xl bg-[#15151E] border border-zinc-800 p-3 text-sm" rows={3}/><button onClick={createSalon} disabled={creating} className="rounded-xl bg-white text-black px-5 py-3 text-xs font-black flex items-center gap-2"><Gamepad2 className="h-4 w-4" />{creating?"Enregistrement...":"Enregistrer le salon"}</button></div>
          ) : <p className="mt-3 text-sm text-zinc-500">Informations privées.</p>}
        </div>

        {participant && <>
          <div className="mt-5"><MatchChat matchId={matchId} currentUserId={user.id} /></div>
          <div className="mt-5 rounded-2xl border border-zinc-800 bg-[#101015] p-5">
            <h2 className="font-black flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-400" />Déclarer le résultat</h2>
            {match.status === "TERMINE" ? <p className="mt-3 text-sm text-emerald-300">Match terminé : {match.final_score_a} - {match.final_score_b}.</p> : match.status === "CONTESTATION" ? <p className="mt-3 text-sm text-red-300 flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Les déclarations sont différentes. L'administration doit arbitrer.</p> : <div className="mt-4 space-y-3"><div className="grid grid-cols-2 gap-3"><input type="number" min="0" max="20" value={score1} onChange={e=>setScore1(Number(e.target.value))} className="rounded-xl bg-[#15151E] border border-zinc-800 p-3 text-center font-black"/><input type="number" min="0" max="20" value={score2} onChange={e=>setScore2(Number(e.target.value))} className="rounded-xl bg-[#15151E] border border-zinc-800 p-3 text-center font-black"/></div><label className="flex items-center gap-2 rounded-xl border border-dashed border-zinc-700 p-4 cursor-pointer text-xs text-zinc-400"><Upload className="h-4 w-4" />Capture du résultat<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e=>setProof(e.target.files?.[0] || null)} />{proof && <span className="text-white truncate">{proof.name}</span>}</label><button onClick={declare} disabled={declaring} className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 py-3 text-xs font-black">{declaring?"Envoi...":"Envoyer le résultat"}</button></div>}
          </div>
        </>}
        {report && <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-200">Signalement d'absence : {report.status}</div>}
      </div>
    </div>
  );
}
