
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Check,
  Upload,
  Wallet,
  ShieldCheck,
  AlertTriangle,
  MessageCircle,
  Clock,
  Eye,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  JOYBOY_CONFIG,
  submitPaymentProofLogic,
} from "@/lib/1v1/challengeLogic";
import type { Challenge1v1 } from "@/lib/1v1/challengeLogic";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();

  const id = String(params?.id || "");
  const supabase = createClient();

  const [match, setMatch] = useState<Challenge1v1 | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("me");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadMatch() {
      setLoading(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const uid = user?.id || "me";

        if (!mounted) return;

        setCurrentUserId(uid);

        const result = await supabase
          .from("challenges_1v1")
          .select(
            "*, challenger:profiles!challenger_id(id, username, avatar_url), challenged:profiles!challenged_id(id, username, avatar_url)"
          )
          .eq("id", id)
          .single();

        if (!mounted) return;

        const data = result.data;
        const error = result.error;

        if (!error && data) {
          const challenge = data as Challenge1v1;

          setMatch(challenge);

          const raw = data as any;
          const isChallenger = raw.challenger_id === uid;

          const proof = isChallenger
            ? raw.preuve_challenger_url
            : raw.preuve_challenged_url;

          if (proof) {
            setPreview(proof);
          }
        } else {
          const demoMatch = {
            id: id,
            challenger_id: "m3",
            challenged_id: "me",

            challenger: {
              id: "m3",
              pseudo: "ZoroBabi",
              username: "zorobabi",
              avatar_url: null,
              matchs: 65,
              victoires: 45,
              defaites: 20,
              taux_victoire: 69,
              tournois_remportes: 5,
              victoires_1v1: 33,
              palmares: [],
            },

            challenged: {
              id: "me",
              pseudo: "Toi",
              username: "toi",
              avatar_url: null,
              matchs: 20,
              victoires: 12,
              defaites: 8,
              taux_victoire: 60,
              tournois_remportes: 1,
              victoires_1v1: 6,
              palmares: [],
            },

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
          } as Challenge1v1;

          setMatch(demoMatch);
        }
      } catch (error) {
        console.error("Erreur chargement match:", error);

        if (mounted) {
          toast.error("Impossible de charger le match.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadMatch();

    return () => {
      mounted = false;
    };
  }, [id, supabase]);

  const copyWave = async () => {
    try {
      await navigator.clipboard.writeText(JOYBOY_CONFIG.wave);

      setCopied(true);
      toast.success("Numéro Wave copié !");

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Erreur copie:", error);
      toast.error("Impossible de copier le numéro.");
    }
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    const allowedTypes = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);

    if (!allowedTypes.has(selectedFile.type)) {
      toast.error("Format invalide. Utilise JPG, PNG ou WEBP.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("Fichier trop lourd (maximum 5 Mo).");
      event.target.value = "";
      return;
    }

    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    const objectUrl = URL.createObjectURL(selectedFile);

    setFile(selectedFile);
    setPreview(objectUrl);
  };

  const clearSelectedFile = () => {
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setPreview(null);
    setFile(null);
  };

  const handleUploadProof = async () => {
    if (!file || !match) {
      toast.error("Choisis d'abord ta preuve.");
      return;
    }

    if (!currentUserId || currentUserId === "me") {
      toast.error("Tu dois être connecté pour envoyer une preuve.");
      return;
    }

    const isChallenger =
      match.challenger_id === currentUserId;

    const myPaid = isChallenger
      ? match.paiement_challenger
      : match.paiement_challenged;

    if (myPaid) {
      toast.info("Ta preuve a déjà été envoyée.");
      return;
    }

    setUploading(true);

    try {
      const storageModule = await import(
        "@/lib/storage/safePath"
      );

      const validation =
        storageModule.validateImageFile(file);

      if (validation) {
        toast.error(validation);
        return;
      }

      const fileName =
        storageModule.createSafeStoragePath(
          "proofs",
          currentUserId,
          file,
          "match"
        );

      console.log("[1V1] Upload preuve:", fileName);

      const uploadResult = await supabase.storage
        .from("payment_proofs")
        .upload(fileName, file, {
          upsert: false,
          contentType: file.type,
          cacheControl: "3600",
        });

      if (uploadResult.error) {
        console.error(
          "[1V1] Erreur upload Supabase:",
          uploadResult.error
        );

        throw new Error(
          uploadResult.error.message ||
            "Impossible d'envoyer la preuve."
        );
      }

      const publicResult = supabase.storage
        .from("payment_proofs")
        .getPublicUrl(fileName);

      const publicUrl = publicResult.data?.publicUrl;

      if (!publicUrl) {
        throw new Error(
          "Impossible de récupérer l'URL de la preuve."
        );
      }

      console.log(
        "[1V1] Preuve uploadée:",
        publicUrl
      );

      try {
        const updated =
          await submitPaymentProofLogic(
            supabase,
            match.id,
            currentUserId,
            publicUrl
          );

        setMatch(updated);

        if (preview?.startsWith("blob:")) {
          URL.revokeObjectURL(preview);
        }

        setPreview(publicUrl);
        setFile(null);

        toast.success(
          "Preuve envoyée ! En attente de l'adversaire."
        );

        if (updated.statut === "CONFIRME") {
          window.setTimeout(() => {
            router.push("/1v1/" + match.id);
          }, 800);
        }
      } catch (error: any) {
        console.error(
          "[1V1] Erreur enregistrement preuve:",
          error
        );

        const message =
          error?.message?.toLowerCase?.() || "";

        if (
          message.includes("relation") ||
          message.includes("does not exist") ||
          message.includes("could not find")
        ) {
          const challengerPaid = isChallenger
            ? true
            : match.paiement_challenger;

          const challengedPaid = isChallenger
            ? match.paiement_challenged
            : true;

          const demoMatch = {
            ...match,

            paiement_challenger:
              challengerPaid,

            paiement_challenged:
              challengedPaid,

            preuve_challenger_url:
              isChallenger
                ? publicUrl
                : match.preuve_challenger_url,

            preuve_challenged_url:
              isChallenger
                ? match.preuve_challenged_url
                : publicUrl,

            statut:
              challengerPaid &&
              challengedPaid
                ? "CONFIRME"
                : "PAIEMENT_EN_COURS",
          } as Challenge1v1;

          setMatch(demoMatch);

          if (preview?.startsWith("blob:")) {
            URL.revokeObjectURL(preview);
          }

          setPreview(publicUrl);
          setFile(null);

          toast.success("Preuve envoyée.");

          if (
            challengerPaid &&
            challengedPaid
          ) {
            window.setTimeout(() => {
              router.push("/1v1/" + match.id);
            }, 800);
          }

          return;
        }

        throw error;
      }
    } catch (error: any) {
      console.error(
        "[1V1] Erreur upload preuve:",
        error
      );

      toast.error(
        error?.message ||
          "Erreur lors de l'envoi de la preuve."
      );
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

  const isChallenger =
    match.challenger_id === currentUserId;

  const myPaid = isChallenger
    ? match.paiement_challenger
    : match.paiement_challenged;

  const myProofUrl = isChallenger
    ? match.preuve_challenger_url
    : match.preuve_challenged_url;

  const bothPaid =
    match.paiement_challenger &&
    match.paiement_challenged;

  const displayedPreview =
    preview || myProofUrl || null;

  const matchUrl = "/1v1/" + match.id;
  const challengesUrl = "/1v1/challenges";

  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      <div className="sticky top-0 z-20 border-b border-[#22222F] bg-[#08080B]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link
            href={matchUrl}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour match
          </Link>

          <Link
            href={challengesUrl}
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            Mes défis
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 lg:py-8">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-4 py-1.5 text-xs text-[#A855F7]">
            <Wallet className="h-3.5 w-3.5" />
            Paiement sécurisé Wave · 500 FCFA par joueur
          </div>

          <h1 className="mt-4 text-2xl lg:text-3xl font-black">
            Valide ton match 1V1
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            Match{" "}
            <span className="text-white font-semibold">
              #{match.id.slice(0, 8)}
            </span>{" "}
            · {match.challenger?.pseudo} VS{" "}
            {match.challenged?.pseudo} · Chaque joueur paie
            500 F et upload sa preuve.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="space-y-5">
            <div className="rounded-[22px] border border-[#22222F] bg-[#15151E] p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  Étape 1 - Paie via Wave
                </h3>

                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-300">
                  Wave uniquement
                </span>
              </div>

              <div className="mt-5 rounded-2xl bg-[#08080B] border border-[#22222F] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-500">
                      Numéro JOYBOY TOURNAMENTS
                    </div>

                    <div className="mt-1 text-2xl font-black tracking-wider font-mono text-white">
                      {JOYBOY_CONFIG.wave}
                    </div>

                    <div className="text-xs text-zinc-500">
                      Nom: {JOYBOY_CONFIG.waveNom}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={copyWave}
                    className={cn(
                      "h-11 w-11 rounded-xl border flex items-center justify-center transition",
                      copied
                        ? "bg-emerald-500 border-emerald-500 text-black"
                        : "bg-[#15151E] border-[#22222F] text-zinc-400 hover:text-white hover:border-zinc-600"
                    )}
                  >
                    {copied ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#15151E] border border-[#22222F] px-3 py-2.5">
                  <div className="h-8 w-8 rounded-full bg-[#7C3AED]/20 flex items-center justify-center text-[#A855F7] font-bold text-xs">
                    500
                  </div>

                  <div className="text-sm">
                    <div className="font-semibold text-white">
                      Montant : 500 FCFA
                    </div>

                    <div className="text-xs text-zinc-500">
                      Pas plus, pas moins. 500 F pile par joueur.
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-xs text-zinc-400 leading-relaxed">
                <p>
                  · Ouvre Wave, envoie{" "}
                  <span className="text-white font-semibold">
                    500 FCFA
                  </span>{" "}
                  au{" "}
                  <span className="text-white font-mono">
                    {JOYBOY_CONFIG.wave}
                  </span>
                </p>

                <p>
                  · Mets en motif :{" "}
                  <span className="rounded bg-[#22222F] px-1.5 py-0.5 text-white font-mono">
                    {"1V1 " + match.id.slice(0, 6) + " + ton pseudo"}
                  </span>
                </p>

                <p>
                  · Fais un screen de la confirmation Wave
                  avec l'heure, le montant et le numéro bien
                  visibles.
                </p>
              </div>
            </div>

            <div className="rounded-[22px] border border-[#22222F] bg-[#15151E] p-6">
              <h3 className="font-semibold flex items-center gap-2">
                <Upload className="h-5 w-5 text-[#06B6D4]" />
                Étape 2 - Upload ta preuve
              </h3>

              <p className="mt-1 text-xs text-zinc-500">
                Chaque joueur doit uploader sa propre preuve.
                Sans preuve, pas de validation.
              </p>

              <div className="mt-5">
                {!displayedPreview ? (
                  <label className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#22222F] bg-[#08080B] py-10 px-4 cursor-pointer hover:border-[#7C3AED]/40 hover:bg-[#101015] transition">
                    <div className="h-12 w-12 rounded-2xl bg-[#15151E] border border-[#22222F] flex items-center justify-center group-hover:border-[#7C3AED]/20 transition">
                      <Upload className="h-6 w-6 text-zinc-500 group-hover:text-[#A855F7]" />
                    </div>

                    <div className="mt-3 text-sm font-semibold text-white">
                      Clique pour choisir ton screen Wave
                    </div>

                    <div className="mt-1 text-xs text-zinc-500 text-center">
                      PNG, JPG ou WEBP · max 5 Mo · Le screen
                      doit montrer 500 F, {JOYBOY_CONFIG.wave}
                      et l'heure
                    </div>

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={myPaid || uploading}
                      onChange={handleFileChange}
                    />
                  </label>
                ) : (
                  <div className="rounded-2xl border border-[#22222F] bg-[#08080B] p-3">
                    <div className="relative overflow-hidden rounded-xl bg-black">
                      <img
                        src={displayedPreview}
                        alt="Preuve de paiement Wave"
                        className="max-h-[360px] w-full object-contain"
                      />

                      {!myPaid && !uploading && (
                        <button
                          type="button"
                          onClick={clearSelectedFile}
                          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/70 backdrop-blur border border-white/10 flex items-center justify-center text-white hover:bg-black transition"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="text-xs text-zinc-500 flex items-center gap-2">
                        <Eye className="h-3.5 w-3.5" />

                        {file?.name ||
                          (myPaid
                            ? "Preuve déjà envoyée"
                            : "Preuve sélectionnée")}

                        {file
                          ? " · " +
                            (file.size / 1024).toFixed(0) +
                            " Ko"
                          : ""}
                      </div>

                      {!myPaid && !uploading && (
                        <label className="text-xs text-zinc-400 hover:text-white underline cursor-pointer">
                          Changer
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  disabled={!file || uploading || myPaid}
                  onClick={handleUploadProof}
                  className="mt-5 w-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] py-3.5 text-sm font-bold text-white shadow-[0_0_25px_rgba(124,58,237,0.35)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Envoi en cours...
                    </>
                  ) : myPaid ? (
                    <>
                      <Check className="h-4 w-4" />
                      Preuve déjà envoyée
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Envoyer ma preuve (500 F)
                    </>
                  )}
                </button>

                {myPaid && (
                  <div className="mt-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5 flex items-center gap-2 text-xs text-emerald-200">
                    <Check className="h-4 w-4 text-emerald-400" />

                    Ta preuve a bien été reçue. En attente de
                    l'adversaire et de la validation du staff
                    JOYBOY.
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
                  <div className="font-semibold text-white">
                    Les deux joueurs ont payé !
                  </div>

                  <div className="text-xs text-emerald-200/70">
                    Match confirmé, vous pouvez lancer. Bonne
                    game !
                  </div>
                </div>

                <Link
                  href={matchUrl}
                  className="ml-auto rounded-full bg-white text-black px-4 py-2 text-xs font-bold hover:bg-zinc-100 transition"
                >
                  Voir match
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-[20px] border border-[#22222F] bg-[#15151E] p-5">
              <h4 className="text-sm font-semibold">
                Récap match
              </h4>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-zinc-500">
                    VS
                  </span>

                  <span className="text-white font-semibold text-right">
                    {match.challenger?.pseudo} vs{" "}
                    {match.challenged?.pseudo}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">
                    Mise totale
                  </span>

                  <span className="text-white">
                    1 000 FCFA
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">
                    Ta part
                  </span>

                  <span className="text-emerald-300 font-bold">
                    500 FCFA
                  </span>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between rounded-xl bg-[#08080B] border border-[#22222F] px-3 py-2.5 text-xs">
                  <span className="text-zinc-400">
                    {match.challenger?.pseudo}
                  </span>

                  {match.paiement_challenger ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Payé
                    </span>
                  ) : (
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      En attente
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#08080B] border border-[#22222F] px-3 py-2.5 text-xs">
                  <span className="text-zinc-400">
                    {match.challenged?.pseudo}
                  </span>

                  {match.paiement_challenged ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Payé
                    </span>
                  ) : (
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      En attente
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[20px] border border-amber-500/20 bg-amber-500/5 p-5">
              <h4 className="text-sm font-semibold text-amber-200 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Important
              </h4>

              <ul className="mt-3 space-y-2 text-[11px] leading-relaxed text-amber-100/70 list-disc list-inside">
                <li>
                  Chaque joueur DOIT uploader sa propre preuve,
                  sinon le match ne sera pas confirmé.
                </li>

                <li>
                  Le screen doit montrer : montant 500 F,
                  numéro {JOYBOY_CONFIG.wave}, heure et
                  référence Wave.
                </li>

                <li>
                  Pas de remboursement si tu annules après
                  paiement sauf accord de l'adversaire.
                </li>

                <li>
                  Preuve fake = ban direct + signalement.
                  On ne rigole pas avec ça ici.
                </li>
              </ul>
            </div>

            <div className="rounded-[20px] border border-[#7C3AED]/20 bg-[#7C3AED]/5 p-5">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-[#A855F7]" />
                Besoin d'aide ?
              </h4>

              <p className="mt-2 text-xs text-zinc-400">
                Un souci Wave, tu ne trouves pas le numéro,
                preuve refusée ? Écris au staff JOYBOY, on
                répond vite.
              </p>

              <a
                href={JOYBOY_CONFIG.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-white text-black py-2.5 text-sm font-bold hover:bg-zinc-100 transition"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp {JOYBOY_CONFIG.whatsapp}
              </a>

              <p className="mt-2 text-[10px] text-zinc-500 text-center">
                Réponse en moyenne sous 10 min · Abidjan 🇨🇮
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}