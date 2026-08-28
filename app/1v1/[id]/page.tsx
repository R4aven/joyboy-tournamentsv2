"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Swords,
  Calendar,
  Clock,
  Wallet,
  Trophy,
  AlertTriangle,
  CheckCircle,
  Flame,
  Crown,
  MapPin,
  FileText,
  MessageCircle,
  Flag,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

import {
  STATUT_LABELS,
  formatMatchDate,
  JOYBOY_CONFIG,
  REGLEMENT_1V1_DEFAULT,
  confirmMatchLogic,
  submitResultLogic,
} from "@/lib/1v1/challengeLogic";

import type {
  Challenge1v1,
  PlayerStats,
} from "@/lib/1v1/challengeLogic";

import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

function PlayerBig({
  player,
  isMe,
  isWinner,
}: {
  player?: PlayerStats;
  isMe?: boolean;
  isWinner?: boolean;
}) {
  if (!player) {
    return (
      <div className="h-40 rounded-2xl bg-zinc-900 animate-pulse" />
    );
  }

  return (
    <div
      className={cn(
        "relative rounded-[22px] border p-5 bg-[#15151E]",
        isWinner
          ? "border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
          : "border-[#22222F]"
      )}
    >
      {isWinner && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-bold text-black flex items-center gap-1">
          <Trophy className="h-3 w-3" />
          VAINQUEUR
        </div>
      )}

      <div className="flex flex-col items-center text-center">
        <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-2 border-[#2A2A38] bg-[#101015]">
          {player.avatar_url ? (
            <img
              src={player.avatar_url}
              alt={player.pseudo}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#7C3AED]/40 to-[#06B6D4]/30 flex items-center justify-center text-2xl font-black text-white">
              {player.pseudo?.[0]?.toUpperCase() || "?"}
            </div>
          )}

          {player.tournois_remportes > 0 && (
            <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-yellow-400 border-2 border-[#15151E] flex items-center justify-center">
              <Crown className="h-3 w-3 text-black" />
            </div>
          )}
        </div>

        <h3 className="mt-3 font-bold text-white flex items-center gap-2">
          {player.pseudo}

          {isMe && (
            <span className="rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/20 px-2 py-0.5 text-[10px] text-[#A855F7]">
              Toi
            </span>
          )}
        </h3>

        <p className="text-xs text-zinc-500">
          @{player.username}
          {player.ville ? ` • ${player.ville}` : ""}
        </p>

        <div className="mt-4 grid w-full grid-cols-3 gap-2">
          <div className="rounded-xl bg-[#08080B] border border-[#22222F] py-2">
            <div className="text-[10px] text-zinc-500">
              MATCHS
            </div>
            <div className="font-bold text-white">
              {player.matchs}
            </div>
          </div>

          <div className="rounded-xl bg-[#08080B] border border-emerald-500/20 py-2">
            <div className="text-[10px] text-zinc-500">
              VIC
            </div>
            <div className="font-bold text-emerald-300">
              {player.victoires}
            </div>
          </div>

          <div className="rounded-xl bg-[#08080B] border border-[#22222F] py-2">
            <div className="text-[10px] text-zinc-500">
              TAUX
            </div>
            <div className="font-bold text-[#06B6D4]">
              {player.taux_victoire}%
            </div>
          </div>
        </div>

        <div className="mt-3 w-full space-y-1.5 text-left">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-500">
              Tournois remportés
            </span>

            <span className="font-semibold text-white flex items-center gap-1">
              {player.tournois_remportes}
              <Trophy className="h-3 w-3 text-yellow-400" />
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-500">
              Victoires 1V1
            </span>

            <span className="font-semibold text-[#06B6D4] flex items-center gap-1">
              {player.victoires_1v1}
              <Flame className="h-3 w-3" />
            </span>
          </div>

          {player.palmares.length > 0 && (
            <div className="pt-2">
              <div className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1">
                Palmarès
              </div>

              <div className="flex flex-wrap gap-1.5">
                {player.palmares
                  .slice(0, 3)
                  .map((p, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-[#08080B] border border-[#22222F] px-2.5 py-1 text-[10px] text-zinc-400"
                    >
                      {p}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MatchPage() {
  const params = useParams();

  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "";

  const supabase = createClient();

  const [match, setMatch] =
    useState<Challenge1v1 | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [currentUserId, setCurrentUserId] =
    useState("");

  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadMatch() {
      if (!id) {
        if (mounted) {
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (mounted) {
            setCurrentUserId("");
            setMatch(null);

            toast.error(
              "Tu dois être connecté pour accéder à ce duel."
            );
          }

          return;
        }

        if (mounted) {
          setCurrentUserId(user.id);
        }

        /*
         * IMPORTANT :
         * On ne demande ici que des colonnes
         * qui existent réellement dans profiles.
         */
        const {
          data,
          error,
        } = await supabase
          .from("challenges_1v1")
          .select(`
            *,
            challenger:profiles!challenger_id(
              id,
              username,
              display_name,
              avatar_url
            ),
            challenged:profiles!challenged_id(
              id,
              username,
              display_name,
              avatar_url
            )
          `)
          .eq("id", id)
          .single();

        if (error) {
          console.error(
            "[1V1] Erreur chargement duel:",
            error
          );

          throw new Error(
            error.message ||
              "Impossible de charger le duel."
          );
        }

        if (!data) {
          throw new Error(
            "Duel introuvable."
          );
        }

        const raw = data as any;

        const mapPlayer = (
          p: any
        ): PlayerStats | undefined => {
          if (!p) {
            return undefined;
          }

          const username =
            p.username || "";

          const displayName =
            p.display_name ||
            username ||
            "Joueur";

          return {
            id: p.id,

            /*
             * Le nom affiché est display_name.
             */
            pseudo: displayName,

            username:

              username || displayName,

            avatar_url:
              p.avatar_url || null,

            /*
             * Les colonnes statistiques ne sont pas
             * demandées ici puisqu'elles peuvent ne pas
             * exister dans profiles.
             */
            matchs: 0,
            victoires: 0,
            defaites: 0,
            taux_victoire: 0,
            tournois_remportes: 0,
            victoires_1v1: 0,
            palmares: [],

            display_name:
              p.display_name ||
              undefined,
          };
        };

        const realMatch: Challenge1v1 = {
          ...raw,

          challenger:
            mapPlayer(
              raw.challenger
            ),

          challenged:
            mapPlayer(
              raw.challenged
            ),
        };

        if (mounted) {
          setMatch(realMatch);
        }
      } catch (error: any) {
        console.error(
          "[1V1] Erreur:",
          error
        );

        if (mounted) {
          setMatch(null);

          toast.error(
            error?.message ||
              "Impossible de charger le duel."
          );
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
  }, [id]);

  const handleConfirmMatch =
    async () => {
      if (!id || !match) {
        toast.error(
          "Duel introuvable."
        );
        return;
      }

      /*
       * Vérification locale avant l'appel Supabase.
       */
      if (
        !match.paiement_challenger ||
        !match.paiement_challenged
      ) {
        toast.error(
          "Les deux paiements doivent être acceptés par l'administration."
        );
        return;
      }

      setActionLoading("confirm");

      try {
        const updated =
          await confirmMatchLogic(
            supabase,
            match.id
          );

        setMatch(updated);

        toast.success(
          "Match lancé ! Que le meilleur gagne 🔥"
        );
      } catch (error: any) {
        console.error(
          "[1V1] Erreur lancement match:",
          error
        );

        toast.error(
          error?.message ||
            "Impossible de lancer le match."
        );
      } finally {
        setActionLoading(null);
      }
    };

  const handleDeclareWinner =
    async (
      gagnantId: string
    ) => {
      if (!match) {
        return;
      }

      if (!currentUserId) {
        toast.error(
          "Tu dois être connecté."
        );
        return;
      }

      /*
       * Vérifie que l'utilisateur connecté
       * a bien un UUID Supabase.
       */
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      if (
        !uuidRegex.test(
          currentUserId
        )
      ) {
        toast.error(
          "Session utilisateur invalide. Reconnecte-toi."
        );
        return;
      }

      /*
       * Le gagnant doit également être un UUID.
       */
      if (
        !uuidRegex.test(
          gagnantId
        )
      ) {
        toast.error(
          "Identifiant du joueur invalide."
        );
        return;
      }

      /*
       * Impossible de déclarer quelqu'un
       * qui ne participe pas au duel.
       */
      if (
        gagnantId !==
          match.challenger_id &&
        gagnantId !==
          match.challenged_id
      ) {
        toast.error(
          "Ce joueur ne fait pas partie du duel."
        );
        return;
      }

      setActionLoading(
        `result-${gagnantId}`
      );

      try {
        const updated =
          await submitResultLogic(
            supabase,
            {
              challengeId:
                match.id,

              declarantId:
                currentUserId,

              gagnantId,
            }
          );

        setMatch(updated);

        if (
          updated.statut ===
          "TERMINE"
        ) {
          toast.success(
            "Victoire confirmée ! GG 🏆"
          );
        } else if (
          updated.statut ===
          "CONTESTE"
        ) {
          toast.error(
            "Les déclarations sont différentes. Le staff doit trancher."
          );
        } else {
          toast.success(
            "Résultat envoyé, en attente de l'autre joueur."
          );
        }
      } catch (error: any) {
        console.error(
          "[1V1] Erreur résultat:",
          error
        );

        toast.error(
          error?.message ||
            "Impossible d'enregistrer le résultat."
        );
      } finally {
        setActionLoading(null);
      }
    };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080B] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-[#08080B] text-white flex items-center justify-center px-4">
        <div className="text-center">
          <AlertTriangle className="h-10 w-10 text-red-400 mx-auto" />

          <h1 className="mt-4 text-xl font-bold">
            Duel introuvable
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Impossible de charger ce duel.
          </p>

          <Link
            href="/1v1/challenges"
            className="mt-5 inline-flex rounded-full bg-white text-black px-5 py-2.5 text-sm font-bold"
          >
            Retour aux défis
          </Link>
        </div>
      </div>
    );
  }

  const statut =
    STATUT_LABELS[
      match.statut
    ];

  const isChallenger =
    match.challenger_id ===
    currentUserId;

  const myDeclaration =
    isChallenger
      ? match.declaration_challenger
      : match.declaration_challenged;

  const opponentDeclaration =
    isChallenger
      ? match.declaration_challenged
      : match.declaration_challenger;

  const challengerName =
    match.challenger?.pseudo ||
    match.challenger?.username ||
    "Joueur 1";

  const challengedName =
    match.challenged?.pseudo ||
    match.challenged?.username ||
    "Joueur 2";

  const bothPaid =
    match.paiement_challenger &&
    match.paiement_challenged;

  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      <div className="sticky top-0 z-20 border-b border-[#22222F] bg-[#08080B]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link
            href="/1v1/challenges"
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour défis
          </Link>

          <div
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold",
              statut.bg,
              statut.color
            )}
          >
            {statut.label}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 lg:py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#101015] border border-[#22222F] px-4 py-1.5 text-xs text-zinc-400">
            <Swords className="h-3.5 w-3.5 text-[#A855F7]" />

            Match 1V1 Direct • 500 FCFA par joueur • ID{" "}
            {match.id.slice(0, 8)}
          </div>

          <h1 className="mt-4 text-2xl lg:text-4xl font-black tracking-tight">
            {challengerName}

            <span className="text-[#06B6D4]">
              {" "}VS{" "}
            </span>

            {challengedName}
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            {formatMatchDate(
              match.date_match,
              match.heure_match
            )}{" "}
            • Abidjan 🇨🇮
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <PlayerBig
                player={match.challenger}
                isMe={
                  match.challenger_id ===
                  currentUserId
                }
                isWinner={
                  match.gagnant_id ===
                  match.challenger_id
                }
              />

              <PlayerBig
                player={match.challenged}
                isMe={
                  match.challenged_id ===
                  currentUserId
                }
                isWinner={
                  match.gagnant_id ===
                  match.challenged_id
                }
              />
            </div>

            <div className="rounded-[20px] border border-[#22222F] bg-[#15151E] p-5">
              <h3 className="font-semibold flex items-center gap-2">
                <Wallet className="h-4 w-4 text-[#06B6D4]" />
                Paiements Wave
              </h3>

              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                <div
                  className={cn(
                    "rounded-xl border p-3 flex items-center justify-between",
                    match.paiement_challenger
                      ? "bg-emerald-500/10 border-emerald-500/20"
                      : "bg-[#08080B] border-[#22222F]"
                  )}
                >
                  <span className="text-sm">
                    {challengerName}
                  </span>

                  {match.paiement_challenger ? (
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <span className="text-xs text-zinc-500">
                      En attente
                    </span>
                  )}
                </div>

                <div
                  className={cn(
                    "rounded-xl border p-3 flex items-center justify-between",
                    match.paiement_challenged
                      ? "bg-emerald-500/10 border-emerald-500/20"
                      : "bg-[#08080B] border-[#22222F]"
                  )}
                >
                  <span className="text-sm">
                    {challengedName}
                  </span>

                  {match.paiement_challenged ? (
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <span className="text-xs text-zinc-500">
                      En attente
                    </span>
                  )}
                </div>
              </div>

              <p className="mt-3 text-xs text-zinc-500">
                Wave JOYBOY TOURNAMENTS :{" "}
                <span className="font-semibold text-white">
                  {JOYBOY_CONFIG.wave}
                </span>{" "}
                - 500 FCFA chacun.
              </p>

              {[
                "ACCEPTE",
                "PAIEMENT_EN_COURS",
                "PAIEMENT_PARTIEL",
              ].includes(
                match.statut
              ) && (
                <Link
                  href={`/1v1/${match.id}/payment`}
                  className="mt-4 inline-flex w-full justify-center rounded-full bg-white text-black py-2.5 text-sm font-bold hover:bg-zinc-100 transition"
                >
                  Aller au paiement
                </Link>
              )}
            </div>

            {(
              [
                "CONFIRME",
                "EN_COURS",
                "RESULTAT_EN_ATTENTE",
              ].includes(
                match.statut
              ) ||
              match.statut ===
                "CONTESTE"
            ) && (
              <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-5">
                <h3 className="font-semibold flex items-center gap-2">
                  <Flag className="h-4 w-4 text-[#A855F7]" />
                  Déclarer le résultat
                </h3>

                <p className="text-xs text-zinc-500 mt-1">
                  Les deux joueurs doivent déclarer le même gagnant.
                </p>

                {myDeclaration && (
                  <div className="mt-3 rounded-xl bg-[#08080B] border border-[#22222F] p-3 text-xs text-zinc-400">
                    Tu as déclaré :{" "}
                    <span className="text-white font-semibold">
                      {myDeclaration ===
                      match.challenger_id
                        ? challengerName
                        : challengedName}{" "}
                      gagnant
                    </span>

                    {opponentDeclaration
                      ? " • L'adversaire a également déclaré."
                      : " • En attente de l'adversaire."}
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={
                      !!actionLoading ||
                      !!myDeclaration
                    }
                    onClick={() =>
                      handleDeclareWinner(
                        match.challenger_id
                      )
                    }
                    className="rounded-full border border-[#22222F] bg-[#15151E] py-3 text-sm font-semibold hover:border-[#7C3AED]/40 disabled:opacity-50 transition"
                  >
                    {actionLoading ===
                    `result-${match.challenger_id}`
                      ? "..."
                      : `${challengerName} a gagné`}
                  </button>

                  <button
                    type="button"
                    disabled={
                      !!actionLoading ||
                      !!myDeclaration
                    }
                    onClick={() =>
                      handleDeclareWinner(
                        match.challenged_id
                      )
                    }
                    className="rounded-full border border-[#22222F] bg-[#15151E] py-3 text-sm font-semibold hover:border-[#7C3AED]/40 disabled:opacity-50 transition"
                  >
                    {actionLoading ===
                    `result-${match.challenged_id}`
                      ? "..."
                      : `${challengedName} a gagné`}
                  </button>
                </div>

                {match.statut ===
                  "CONTESTE" && (
                  <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 flex gap-2 text-xs text-red-200/80">
                    <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />

                    <div>
                      {match.contestation_raison ||
                        "Déclarations différentes - contacte le staff."}

                      <br />

                      <a
                        href={
                          JOYBOY_CONFIG.whatsappLink
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        WhatsApp{" "}
                        {JOYBOY_CONFIG.whatsapp}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {match.statut ===
              "TERMINE" &&
              match.gagnant_id && (
                <div className="rounded-[20px] border border-emerald-500/20 bg-emerald-500/10 p-6 text-center">
                  <Trophy className="h-10 w-10 text-yellow-400 mx-auto mb-3" />

                  <h3 className="text-xl font-black">
                    Match terminé !
                  </h3>

                  <p className="mt-1 text-sm text-zinc-300">
                    Vainqueur :{" "}
                    <span className="font-bold text-white">
                      {match.gagnant_id ===
                      match.challenger_id
                        ? challengerName
                        : challengedName}
                    </span>{" "}
                    🏆
                  </p>

                  <p className="text-xs text-zinc-500 mt-1">
                    GG aux deux joueurs, respect 🇨🇮🇨🇮
                  </p>
                </div>
              )}
          </div>

          <div className="space-y-4">
            <div className="rounded-[20px] border border-[#22222F] bg-[#15151E] p-5">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-zinc-500" />
                Détails match
              </h4>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">
                    Date
                  </span>

                  <span className="text-white">
                    {match.date_match
                      ? new Date(
                          match.date_match
                        ).toLocaleDateString(
                          "fr-CI"
                        )
                      : "À définir"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-500">
                    Heure
                  </span>

                  <span className="text-white flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {match.heure_match ||
                      "--:--"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-500">
                    Mise
                  </span>

                  <span className="text-white">
                    500 FCFA x2
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-500">
                    Wave
                  </span>

                  <span className="text-white font-mono">
                    {JOYBOY_CONFIG.wave}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-500">
                    Statut
                  </span>

                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs border",
                      statut.bg,
                      statut.color
                    )}
                  >
                    {statut.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-5">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-zinc-500" />
                Règlement 1V1
              </h4>

              <pre className="mt-3 whitespace-pre-wrap text-[11px] leading-relaxed text-zinc-400 font-sans">
                {match.reglement ||
                  REGLEMENT_1V1_DEFAULT}
              </pre>
            </div>

            <div className="rounded-[20px] border border-[#7C3AED]/20 bg-[#7C3AED]/5 p-5">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-[#A855F7]" />
                Support JOYBOY
              </h4>

              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Un souci ? Connexion, litige,
                paiement ? On gère tout sur
                WhatsApp.
              </p>

              <a
                href={
                  JOYBOY_CONFIG.whatsappLink
                }
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex w-full justify-center rounded-full bg-white text-black py-2.5 text-sm font-bold hover:bg-zinc-100 transition"
              >
                WhatsApp{" "}
                {JOYBOY_CONFIG.whatsapp}
              </a>

              <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-500">
                <MapPin className="h-3 w-3" />
                Abidjan, Côte d'Ivoire 🇨🇮
              </div>
            </div>

            {match.statut ===
              "CONFIRME" && (
              <button
                type="button"
                onClick={
                  handleConfirmMatch
                }
                disabled={
                  !!actionLoading ||
                  !bothPaid
                }
                className="w-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:opacity-90 disabled:opacity-50 transition"
              >
                {actionLoading ===
                "confirm"
                  ? "Lancement..."
                  : "Confirmer & lancer le match"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}