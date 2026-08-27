
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Trophy, Users, Wallet, Clock, Upload, Image as ImageIcon } from "lucide-react";

export default function TournamentDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const supabase = createClient();
  const { user } = useAuth() as any;
  const [t, setT] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("tournaments").select("*").eq("id", id).single();
      if (data) setT(data);
      const { data: pls } = await supabase.from("tournament_players").select("*, profiles:player_id(username, display_name)").eq("tournament_id", id);
      if (pls) { setPlayers(pls); if (user) setIsRegistered(pls.some((p:any)=>p.player_id===user.id)); }
      setLoading(false);
    };
    if (id) load();
  }, [id, user]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5*1024*1024) { toast.error("Image trop lourde >5Mo"); return; }
    setProofFile(f);
    setProofPreview(URL.createObjectURL(f));
  };

  const handleRegister = async () => {
    if (!user) { toast.error("Connecte-toi d'abord"); return; }
    if (isRegistered) { toast("Déjà inscrit"); return; }
    if (!proofFile) { toast.error("Upload la capture Wave (obligatoire)"); return; }
    setRegistering(true);
    try {
      // 1. Upload capture Wave vers bucket tournament_proofs
      const fileName = `${id}/${user.id}_${Date.now()}_${proofFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from("tournament_proofs").upload(fileName, proofFile, { cacheControl: "3600", upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("tournament_proofs").getPublicUrl(fileName);
      const proofUrl = urlData.publicUrl;

      // 2. Insert inscription avec preuve
      const { error } = await supabase.from("tournament_players").insert({ 
        tournament_id: id, 
        player_id: user.id, 
        is_paid: false, 
        status: "EN_ATTENTE_PAIEMENT",
        payment_proof_url: proofUrl
      });
      if (error) throw error;
      toast.success("Inscrit ! Capture Wave envoyée - admin va valider dans /admin/tournaments/"+id);
      setIsRegistered(true);
    } catch (e:any) {
      console.error(e);
      if (e.message?.includes("duplicate") || e.message?.includes("UNIQUE")) toast.error("Déjà inscrit");
      else if (e.message?.includes("bucket") || e.message?.includes("not found")) toast.error("Bucket tournament_proofs manquant - exécute SQL MASTER_FIX_ALL.sql");
      else toast.error(e.message);
    } finally { setRegistering(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#08080B] p-10 text-zinc-500">Chargement...</div>;
  if (!t) return <div className="min-h-screen bg-[#08080B] p-10">Tournoi introuvable</div>;

  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link href="/tournaments" className="text-sm text-zinc-500">← Tous les tournois</Link>
        <h1 className="mt-4 text-3xl font-black flex items-center gap-3"><Trophy className="h-7 w-7 text-amber-400" /> {t.title}</h1>
        <p className="text-zinc-400 mt-2">{t.game} • {t.status} • {players.length}/{t.max_players} joueurs • {t.entry_fee} FCFA</p>

        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-[#101015] p-5"><p className="text-xs text-zinc-500 flex items-center gap-2"><Clock className="h-4 w-4" /> Date</p><p className="mt-1 font-bold">{t.start_date ? new Date(t.start_date).toLocaleString("fr-FR") : "-"}</p></div>
          <div className="rounded-2xl border border-zinc-800 bg-[#101015] p-5"><p className="text-xs text-zinc-500 flex items-center gap-2"><Wallet className="h-4 w-4" /> Frais</p><p className="mt-1 font-bold">{t.entry_fee} FCFA • Wave {t.wave_number}</p></div>
          <div className="rounded-2xl border border-zinc-800 bg-[#101015] p-5"><p className="text-xs text-zinc-500 flex items-center gap-2"><Users className="h-4 w-4" /> Gains</p><p className="mt-1 font-bold">1er: {t.prize_distribution?.["1"]}F</p></div>
        </div>

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-[#101015] p-6">
          <p className="text-sm whitespace-pre-wrap">{t.description}</p>
          <div className="mt-4 rounded-xl bg-[#0E0E14] border border-zinc-800 p-4"><p className="text-xs text-zinc-500">Règlement</p><p className="text-sm mt-1 whitespace-pre-wrap">{t.rules}</p></div>
          
          <div className="mt-6 border-t border-zinc-800 pt-6">
            <h3 className="font-bold flex items-center gap-2"><Upload className="h-5 w-5" /> Inscription avec preuve Wave</h3>
            {isRegistered ? (
              <div className="mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-300">✅ Tu es inscrit - capture envoyée, en attente validation admin</div>
            ) : (
              <>
                <p className="mt-2 text-xs text-zinc-500">Envoie {t.entry_fee} FCFA sur Wave {t.wave_number} puis upload la capture ici</p>
                <div className="mt-4">
                  <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-800 bg-[#0E0E14] p-6 cursor-pointer hover:border-violet-500/50">
                    <ImageIcon className="h-8 w-8 text-zinc-500" />
                    <span className="mt-2 text-xs text-zinc-400">{proofFile ? proofFile.name : "Clique pour choisir capture Wave (JPG/PNG max 5Mo)"}</span>
                    <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
                  </label>
                  {proofPreview && <img src={proofPreview} alt="preview" className="mt-4 max-h-64 rounded-xl border border-zinc-800" />}
                </div>
                <button onClick={handleRegister} disabled={registering || t.status!=="OUVERT" || !proofFile} className="mt-4 rounded-xl bg-white text-black px-8 py-3 text-sm font-black disabled:opacity-50">{registering ? "Upload en cours..." : t.status!=="OUVERT" ? "Inscriptions fermées" : "S'inscrire + Envoyer preuve"}</button>
              </>
            )}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-[#101015] p-6">
          <h3 className="font-bold">Joueurs inscrits ({players.length})</h3>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
            {players.map((p:any)=><div key={p.id} className="rounded-xl bg-[#15151E] border border-zinc-800 p-3 text-sm">@{p.profiles?.username} {p.is_paid ? "✅ Payé" : "⏳ Attente"}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}
