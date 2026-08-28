
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Trophy, Users, Wallet, Clock, Upload, Image as ImageIcon, Tag, Check, X } from "lucide-react";
import { createSafeStoragePath, validateImageFile } from "@/lib/storage/safePath";
import PublicBracket from "@/components/tournaments/PublicBracket";

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
  const [promoCode, setPromoCode] = useState("");
  const [promo, setPromo] = useState<any>(null);
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [price, setPrice] = useState({ original: 0, discount: 0, final: 0 });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("tournaments").select("*").eq("id", id).single();
      if (data) { setT(data); setPrice({ original: Number(data.entry_fee || 0), discount: 0, final: Number(data.entry_fee || 0) }); }
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

  const applyPromo = async () => {
    if (!id || !promoCode.trim()) return;
    setPromoLoading(true); setPromoError(""); setPromo(null);
    try {
      const { data, error } = await supabase.rpc("validate_promo_code", { p_code: promoCode.trim(), p_tournament: id });
      if (error) throw error;
      const result = Array.isArray(data) ? data[0] : data;
      if (!result?.valid) {
        const messages: Record<string,string> = { INVALID: "Code promo invalide", EXPIRED: "Ce code promo a expiré", EXHAUSTED: "Ce code promo n'est plus disponible", TOURNAMENT: "Ce code promo n'est pas valable pour ce tournoi", INACTIVE: "Ce code promo est désactivé", NOT_STARTED: "Cette promotion n'est pas encore active" };
        setPromoError(messages[result?.error_code] || "Code promo invalide");
        setPrice({ original: Number(t.entry_fee), discount: 0, final: Number(t.entry_fee) });
        return;
      }
      const original = Number(t.entry_fee || 0);
      const discount = result.discount_type === "percent" ? Math.min(original, Math.round(original * Number(result.discount_value) / 100)) : Math.min(original, Math.max(0, Number(result.discount_value)));
      setPromo(result); setPrice({ original, discount, final: original - discount });
    } catch (e) { console.error(e); setPromoError("Impossible de vérifier le code promo."); }
    finally { setPromoLoading(false); }
  };

  const handleRegister = async () => {
    if (!user) { toast.error("Connecte-toi d'abord"); return; }
    if (isRegistered) { toast("Déjà inscrit"); return; }
    if (!proofFile) { toast.error("Upload la capture Wave (obligatoire)"); return; }
    const validation = validateImageFile(proofFile);
    if (validation) { toast.error(validation); return; }
    if (players.length >= Number(t.max_players)) { toast.error("Ce tournoi est complet."); return; }
    setRegistering(true);
    try {
      const safePath = createSafeStoragePath("proofs", user.id, proofFile, "payment");
      const { error: uploadError } = await supabase.storage.from("tournament_proofs").upload(safePath, proofFile, { cacheControl: "3600", upsert: false, contentType: proofFile.type });
      if (uploadError) throw uploadError;
      const { data: registration, error } = await supabase.rpc("register_tournament_with_promo", { p_tournament: id, p_player: user.id, p_code: promo?.code || promoCode.trim() || null });
      if (error) {
        await supabase.storage.from("tournament_proofs").remove([safePath]);
        throw error;
      }
      const row = Array.isArray(registration) ? registration[0] : registration;
      const { error: proofUpdateError } = await supabase.from("tournament_players").update({ payment_proof_path: safePath, payment_proof_url: null }).eq("id", row.registration_id).eq("player_id", user.id);
      if (proofUpdateError) throw proofUpdateError;
      toast.success(`Inscription enregistrée — ${Number(row.final_price).toLocaleString("fr-FR")} FCFA à payer.`);
      setIsRegistered(true);
      setPlayers(prev => [...prev, { id: row.registration_id, player_id: user.id, is_paid: false, status: "EN_ATTENTE_PAIEMENT", profiles: { username: user.user_metadata?.username || "toi" } }]);
    } catch (e:any) {
      console.error("Tournament registration failed", e);
      const msg = String(e?.message || "");
      if (msg.includes("ALREADY_REGISTERED") || msg.includes("duplicate")) toast.error("Tu es déjà inscrit à ce tournoi.");
      else if (msg.includes("TOURNAMENT_FULL")) toast.error("Ce tournoi est complet.");
      else if (msg.includes("PROMO")) toast.error("Le code promo n'est plus disponible. Vérifie-le puis réessaie.");
      else toast.error("Impossible de finaliser l'inscription. Réessaie.");
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
                <p className="mt-2 text-xs text-zinc-500">Prix normal : {Number(t.entry_fee).toLocaleString("fr-FR")} FCFA. Le paiement doit correspondre au montant final affiché.</p>
                <div className="mt-4 rounded-xl border border-zinc-800 bg-[#0E0E14] p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400"><Tag className="h-4 w-4 text-violet-400" /> Code promo</div>
                  <div className="flex gap-2"><input value={promoCode} onChange={e=>{setPromoCode(e.target.value.toUpperCase()); setPromoError("");}} placeholder="Ex : PROMO50" className="flex-1 rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2.5 text-sm uppercase" /><button type="button" onClick={applyPromo} disabled={promoLoading || !promoCode.trim()} className="rounded-xl bg-white text-black px-4 py-2.5 text-xs font-black">{promoLoading ? "Vérification..." : "APPLIQUER"}</button></div>
                  {promoError && <p className="text-xs text-red-400 flex items-center gap-1"><X className="h-3 w-3" /> {promoError}</p>}
                  {promo && <p className="text-xs text-emerald-300 flex items-center gap-1"><Check className="h-3 w-3" /> Code {promo.code} appliqué</p>}
                  <div className="border-t border-zinc-800 pt-3 text-sm space-y-1"><div className="flex justify-between"><span className="text-zinc-500">Prix initial</span><span>{price.original.toLocaleString("fr-FR")} FCFA</span></div><div className="flex justify-between"><span className="text-zinc-500">Réduction</span><span className="text-emerald-400">-{price.discount.toLocaleString("fr-FR")} FCFA{promo?.discount_type === "percent" ? ` (-${promo.discount_value}%)` : ""}</span></div><div className="flex justify-between text-base font-black"><span>Total à payer</span><span>{price.final.toLocaleString("fr-FR")} FCFA</span></div></div>
                </div>
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
          <h3 className="font-bold">Bracket public</h3>
          <p className="mt-1 text-xs text-zinc-500">Les visiteurs voient uniquement les joueurs, scores et vainqueurs.</p>
          <div className="mt-5"><PublicBracket tournamentId={id}/></div>
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
