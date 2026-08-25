"use client";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const MOTIFS = ["Adversaire absent","Problème de connexion","Résultat incorrect","Comportement incorrect","Problème avec le salon","Problème technique","Autre"];

export function ReportProblemButton({ matchId, reporterId }: { matchId: string, reporterId: string }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(MOTIFS[0]);
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState<File|null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async () => {
    if (desc.length < 10) { toast.error("Décris le problème (10 caractères min)"); return; }
    setLoading(true);
    try {
      let evidenceUrl = null;
      if (file) {
        const path = `${matchId}/${Date.now()}_${file.name}`;
        const { error: upErr } = await supabase.storage.from('match-problem-evidences').upload(path, file);
        if (upErr) throw upErr;
        const { data } = supabase.storage.from('match-problem-evidences').getPublicUrl(path);
        evidenceUrl = data.publicUrl;
      }
      const { error } = await supabase.from('match_problem_reports').insert({
        match_id: matchId,
        reporter_id: reporterId,
        type,
        description: desc,
        evidence_url: evidenceUrl,
        status: 'PENDING'
      });
      if (error) throw error;
      toast.success("Problème signalé - Admin va examiner 🚨");
      setOpen(false);
      setDesc("");
      setFile(null);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={()=>setOpen(true)} className="h-11 w-full rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-[12px] font-black">🚨 SIGNALER UN PROBLÈME</button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-[20px] border border-[#22222F] bg-[#15151E] p-6 max-w-lg w-full max-h-[90vh] overflow-auto">
            <h3 className="font-black">🚨 Signaler un problème</h3>
            <div className="mt-4 space-y-3">
              <div><label className="text-[11px] font-bold uppercase text-zinc-500">Motif</label><select value={type} onChange={e=>setType(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[#22222F] bg-[#101015] px-3 text-[13px]">{MOTIFS.map(m=><option key={m} value={m}>{m}</option>)}</select></div>
              <div><label className="text-[11px] font-bold uppercase text-zinc-500">Décris le problème</label><textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={4} placeholder="Décris précisément..." className="mt-1 w-full rounded-xl border border-[#22222F] bg-[#101015] p-3 text-[13px]" /></div>
              <div><label className="text-[11px] font-bold uppercase text-zinc-500">Capture preuve (optionnel)</label><input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0]||null)} className="mt-1 w-full text-[12px]" /></div>
              <div className="flex gap-2 pt-2"><button onClick={()=>setOpen(false)} className="flex-1 h-11 rounded-xl border border-[#22222F] bg-[#101015]">Annuler</button><button onClick={handleSubmit} disabled={loading} className="flex-1 h-11 rounded-xl bg-red-500 text-white font-black">{loading ? "..." : "Envoyer"}</button></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}