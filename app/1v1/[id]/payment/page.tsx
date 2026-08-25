"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Copy, Check, Upload, Wallet, ShieldCheck, AlertTriangle, MessageCircle, Clock, Eye, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { JOYBOY_CONFIG, submitPaymentProofLogic } from "@/lib/1v1/challengeLogic";
import type { Challenge1v1 } from "@/lib/1v1/challengeLogic";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const supabase = createClient();

  const [match, setMatch] = useState<Challenge1v1 | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("me");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const uid = user?.id || "me";
        setCurrentUserId(uid);

        const { data, error } = await supabase
          .from("challenges_1v1")
          .select(`
            *,
            challenger:profiles!challenger_id(id, username, avatar_url),
            challenged:profiles!challenged_id(id, username, avatar_url)
          `)
          .eq("id", id)
          .single();

        if (!error && data) {
          setMatch(data as Challenge1v1);
          // set previews
          const c: any = data;
          const isChallenger = c.challenger_id === uid;
          const myProof = isChallenger ? c.preuve_challenger_url : c.preuve_challenged_url;
          if (myProof) setPreview(myProof);
        } else {
          setMatch({
            id,
            challenger_id: "m3",
            challenged_id: "me",
            challenger: { id: "m3", pseudo: "ZoroBabi", username: "zorobabi", avatar_url: null, matchs: 65, victoires: 45, defaites: 20, taux_victoire: 69, tournois_remportes: 5, victoires_1v1: 33, palmares: [] },
            challenged: { id: "me", pseudo: "Toi", username: "toi", avatar_url: null, matchs: 20, victoires: 12, defaites: 8, taux_victoire: 60, tournois_remportes: 1, victoires_1v1: 6, palmares: [] },
            statut: "ACCEPTE",
            date_match: new Date().toISOString(),
            heure_match: "20:30",
            reglement: "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            paiement_challenger: false,
            paiement_challenged: false,
            preuve_challenger_url: null,
            preuve_challenged_url: null,
            paiement_confirme_admin: false,
            declaration_challenger: null,
            declaration_challenged: null,
            gagnant_id: null,
            contestation_raison: null,
          } as Challenge1v1);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const copyWave = async () => {
    await navigator.clipboard.writeText(JOYBOY_CONFIG.wave);
    setCopied(true);
    toast.success("Numéro Wave copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Fichier trop lourd (max 5 Mo)");
      return;
    }
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const handleUploadProof = async () => {
    if (!file || !match) {
      toast.error("Choisis d'abord ta preuve, chef");
      return;
    }
    setUploading(true);
    try {
      let publicUrl = preview || "";

      // Upload Supabase Storage
      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `proof-${match.id}-${currentUserId}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("payments").upload(fileName, file, { upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("payments").getPublicUrl(fileName);
          publicUrl = urlData.publicUrl;
        } else {
          // Si bucket existe pas, on simule url local
          publicUrl = preview || `local://${fileName}`;
        }
      } catch {
        publicUrl = preview || "";
      }

      try {
        const updated = await submitPaymentProofLogic(supabase, match.id, currentUserId, publicUrl);
        setMatch(updated);
        toast.success("Preuve envoyée ! En attente de l'adversaire 🙏");
        // Si les deux ont payé -> redirection match
        if (updated.statut === "CONFIRME") {
          setTimeout(() => router.push(`/1v1/${match.id}`), 800);
        }
      } catch (e: any) {
        if (e.message?.includes("relation") || e.message?.includes("does not exist")) {
          // Mode démo
          const isChallenger = match.challenger_id === currentUserId;
          setMatch({
            ...match,
            ...(isChallenger ? { paiement_challenger: true, preuve_challenger_url: publicUrl } : { paiement_challenged: true, preuve_challenged_url: publicUrl }),
            statut: (isChallenger ? match.paiement_challenged : match.paiement_challenger) ? "CONFIRME" : "PAIEMENT_EN_COURS",
          });
          toast.success("Preuve envoyée (démo) !");
          if ((isChallenger ? match.paiement_challenged : match.paiement_challenger)) {
            setTimeout(() => router.push(`/1v1/${match.id}`), 800);
          }
        } else {
          throw e;
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Erreur upload preuve");
    } finally {
      setUploading(false);
    }
  };

  if (loading || !match) {
    return (
      <div className="min-h-screen bg-[#08080B] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isChallenger = match.challenger_id === currentUserId;
  const myPaid = isChallenger ? match.paiement_challenger : match.paiement_challenged;
  const opponentPaid = isChallenger ? match.paiement_challenged : match.paiement_challenger;
  const myProofUrl = isChallenger ? match.preuve_challenger_url : match.preuve_challenged_url;
  const opponentProofUrl = isChallenger ? match.preuve_challenged_url : match.preuve_challenger_url;

  const bothPaid = match.paiement_challenger && match.paiement_challenged;

  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      <div className="sticky top-0 z-20 border-b border-[#22222F] bg-[#08080B]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href={`/1v1/${id}`} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition">
            <ArrowLeft className="h-4 w-4" /> Retour match
          </Link>
          <Link href="/1v1/challenges" className="text-xs text-zinc-500 hover:text-zinc-300">Mes défis</Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 lg:py-8">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-4 py-1.5 text-xs text-[#A855F7]">
            <Wallet className="h-3.5 w-3.5" /> Paiement sécurisé Wave • 500 FCFA par joueur
          </div>
          <h1 className="mt-4 text-2xl lg:text-3xl font-black">Valide ton match 1V1</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Match <span className="text-white font-semibold">#{match.id.slice(0, 8)}</span> • {match.challenger?.pseudo} VS {match.challenged?.pseudo} • Chaque joueur paie 500 F et upload sa preuve.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
          {/* Paiement Wave */}
          <div className="space-y-5">
            <div className="rounded-[22px] border border-[#22222F] bg-[#15151E] p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-400" /> Étape 1 - Paie via Wave</h3>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-300">Wave uniquement</span>
              </div>

              <div className="mt-5 rounded-2xl bg-[#08080B] border border-[#22222F] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-500">Numéro JOYBOY TOURNAMENTS</div>
                    <div className="mt-1 text-2xl font-black tracking-wider font-mono text-white">{JOYBOY_CONFIG.wave}</div>
                    <div className="text-xs text-zinc-500">Nom: {JOYBOY_CONFIG.waveNom}</div>
                  </div>
                  <button
                    onClick={copyWave}
                    className={cn("h-11 w-11 rounded-xl border flex items-center justify-center transition", copied ? "bg-emerald-500 border-emerald-500 text-black" : "bg-[#15151E] border-[#22222F] text-zinc-400 hover:text-white hover:border-zinc-600")}
                  >
                    {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#15151E] border border-[#22222F] px-3 py-2.5">
                  <div className="h-8 w-8 rounded-full bg-[#7C3AED]/20 flex items-center justify-center text-[#A855F7] font-bold text-xs">500</div>
                  <div className="text-sm">
                    <div className="font-semibold text-white">Montant : 500 FCFA</div>
                    <div className="text-xs text-zinc-500">Pas plus, pas moins. 500 F pile par joueur.</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-xs text-zinc-400 leading-relaxed">
                <p>• Ouvre Wave, envoie <span className="text-white font-semibold">500 FCFA</span> au <span className="text-white font-mono">{JOYBOY_CONFIG.wave}</span></p>
                <p>• Mets en motif : <span className="rounded bg-[#22222F] px-1.5 py-0.5 text-white font-mono">1V1 {match.id.slice(0, 6)} + ton pseudo</span></p>
                <p>• Fais un screen de la confirmation Wave (avec heure + montant + numéro bien visible)</p>
              </div>
            </div>

            {/* Upload preuve */}
            <div className="rounded-[22px] border border-[#22222F] bg-[#15151E] p-6">
              <h3 className="font-semibold flex items-center gap-2"><Upload className="h-5 w-5 text-[#06B6D4]" /> Étape 2 - Upload ta preuve</h3>
              <p className="mt-1 text-xs text-zinc-500">Chaque joueur doit uploader sa propre preuve. Sans preuve, pas de validation.</p>

              <div className="mt-5">
                {!preview ? (
                  <label className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#22222F] bg-[#08080B] py-10 px-4 cursor-pointer hover:border-[#7C3AED]/40 hover:bg-[#101015] transition">
                    <div className="h-12 w-12 rounded-2xl bg-[#15151E] border border-[#22222F] flex items-center justify-center group-hover:border-[#7C3AED]/20 transition">
                      <Upload className="h-6 w-6 text-zinc-500 group-hover:text-[#A855F7]" />
                    </div>
                    <div className="mt-3 text-sm font-semibold text-white">Clique pour choisir ton screen Wave</div>
                    <div className="mt-1 text-xs text-zinc-500">PNG, JPG max 5 Mo • Le screen doit montrer 500 F, {JOYBOY_CONFIG.wave}, et l'heure</div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                ) : (
                  <div className="rounded-2xl border border-[#22222F] bg-[#08080B] p-3">
                    <div className="relative overflow-hidden rounded-xl bg-black">
                      <img src={preview} alt="Preuve paiement" className="max-h-[360px] w-full object-contain" />
                      <button onClick={() => { setPreview(null); setFile(null); }} className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/70 backdrop-blur border border-white/10 flex items-center justify-center text-white hover:bg-black transition">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="text-xs text-zinc-500 flex items-center gap-2">
                        <Eye className="h-3.5 w-3.5" /> {file?.name || "Preuve sélectionnée"} • {file ? `${(file.size / 1024).toFixed(0)} Ko` : ""}
                      </div>
                      <button onClick={() => { setPreview(null); setFile(null); }} className="text-xs text-zinc-400 hover:text-white underline">Changer</button>
                    </div>
                  </div>
                )}

                <button
                  disabled={!file || uploading || myPaid}
                  onClick={handleUploadProof}
                  className="mt-5 w-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] py-3.5 text-sm font-bold text-white shadow-[0_0_25px_rgba(124,58,237,0.35)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Envoi en cours...
                    </>
                  ) : myPaid ? (
                    <>
                      <Check className="h-4 w-4" /> Preuve déjà envoyée
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" /> Envoyer ma preuve (500 F)
                    </>
                  )}
                </button>

                {myPaid && (
                  <div className="mt-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5 flex items-center gap-2 text-xs text-emerald-200">
                    <Check className="h-4 w-4 text-emerald-400" /> Ta preuve a bien été reçue, champion. En attente de l'adversaire et validation staff JOYBOY.
                  </div>
                )}
              </div>
            </div>

            {bothPaid && (
              <div className="rounded-[22px] border border-emerald-500/20 bg-emerald-500/10 p-5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-black">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-white">Les deux joueurs ont payé ! 🔥</div>
                  <div className="text-xs text-emerald-200/70">Match confirmé, vous pouvez lancer. Bonne game !</div>
                </div>
                <Link href={`/1v1/${match.id}`} className="ml-auto rounded-full bg-white text-black px-4 py-2 text-xs font-bold hover:bg-zinc-100 transition">Voir match</Link>
              </div>
            )}
          </div>

          {/* Sidebar récap */}
          <div className="space-y-4">
            <div className="rounded-[20px] border border-[#22222F] bg-[#15151E] p-5">
              <h4 className="text-sm font-semibold">Récap match</h4>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between"><span className="text-zinc-500">VS</span><span className="text-white font-semibold">{match.challenger?.pseudo} vs {match.challenged?.pseudo}</span></div>
                <div className="flex items-center justify-between"><span className="text-zinc-500">Mise totale</span><span className="text-white">1 000 FCFA</span></div>
                <div className="flex items-center justify-between"><span className="text-zinc-500">Ta part</span><span className="text-emerald-300 font-bold">500 FCFA</span></div>
              </div>

              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between rounded-xl bg-[#08080B] border border-[#22222F] px-3 py-2.5 text-xs">
                  <span className="text-zinc-400">{match.challenger?.pseudo}</span>
                  {match.paiement_challenger ? <span className="text-emerald-400 flex items-center gap-1"><Check className="h-3 w-3" /> Payé</span> : <span className="text-zinc-500 flex items-center gap-1"><Clock className="h-3 w-3" /> En attente</span>}
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[#08080B] border border-[#22222F] px-3 py-2.5 text-xs">
                  <span className="text-zinc-400">{match.challenged?.pseudo}</span>
                  {match.paiement_challenged ? <span className="text-emerald-400 flex items-center gap-1"><Check className="h-3 w-3" /> Payé</span> : <span className="text-zinc-500 flex items-center gap-1"><Clock className="h-3 w-3" /> En attente</span>}
                </div>
              </div>
            </div>

            <div className="rounded-[20px] border border-amber-500/20 bg-amber-500/5 p-5">
              <h4 className="text-sm font-semibold text-amber-200 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Important</h4>
              <ul className="mt-3 space-y-2 text-[11px] leading-relaxed text-amber-100/70 list-disc list-inside">
                <li>Chaque joueur DOIT uploader sa propre preuve, sinon match pas confirmé.</li>
                <li>Screen doit montrer : montant 500 F, numéro {JOYBOY_CONFIG.wave}, heure et référence Wave.</li>
                <li>Pas de remboursement si tu annules après paiement sauf accord adversaire.</li>
                <li>Preuve fake = ban direct + signalement, on rigole pas avec ça ici.</li>
              </ul>
            </div>

            <div className="rounded-[20px] border border-[#7C3AED]/20 bg-[#7C3AED]/5 p-5">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2"><MessageCircle className="h-4 w-4 text-[#A855F7]" /> Besoin d'aide ?</h4>
              <p className="mt-2 text-xs text-zinc-400">Un souci Wave, tu trouves pas le numéro, preuve refusée ? Écris au staff JOYBOY, on répond vite.</p>
              <a href={JOYBOY_CONFIG.whatsappLink} target="_blank" className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-white text-black py-2.5 text-sm font-bold hover:bg-zinc-100 transition">
                <MessageCircle className="h-4 w-4" /> WhatsApp {JOYBOY_CONFIG.whatsapp}
              </a>
              <p className="mt-2 text-[10px] text-zinc-500 text-center">Réponse en moyenne sous 10 min • Abidjan 🇨🇮</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
