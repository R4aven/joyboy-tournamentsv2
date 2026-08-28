
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  Users,
  Trash2,
  ArrowLeft,
  Check,
  X,
  Image as ImageIcon,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function AdminTournamentManagePage() {
  const params = useParams();
  const router = useRouter();

  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "";

  const supabase = createClient();

  const [t, setT] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [generating, setGenerating] = useState(false);
  const [lastBracketError, setLastBracketError] = useState<string | null>(
    null
  );

  const load = async () => {
    if (!id) return;

    setLoading(true);

    try {
      const { data: tournament, error: tournamentError } = await supabase
        .from("tournaments")
        .select("*")
        .eq("id", id)
        .single();

      if (tournamentError) {
        throw tournamentError;
      }

      setT(tournament);
      setStatus(tournament.status || "");

      const {
        data: pls,
        error: playersError,
      } = await supabase
        .from("tournament_players")
        .select(
          "*, profiles:player_id(id, username, display_name, avatar_url)"
        )
        .eq("tournament_id", id)
        .order("created_at", { ascending: false });

      if (playersError) {
        throw playersError;
      }

      const withSigned = await Promise.all(
        (pls || []).map(async (p: any) => {
          if (!p.payment_proof_path) {
            return p;
          }

          const { data: signed } = await supabase.storage
            .from("tournament_proofs")
            .createSignedUrl(
              p.payment_proof_path,
              3600
            );

          return {
            ...p,
            payment_proof_url:
              signed?.signedUrl ||
              p.payment_proof_url ||
              null,
          };
        })
      );

      setPlayers(withSigned);
    } catch (error: any) {
      console.error(
        "[ADMIN TOURNAMENT] Erreur chargement:",
        error
      );

      toast.error(
        error?.message ||
          "Impossible de charger le tournoi."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const updateStatus = async () => {
    try {
      const { error } = await supabase
        .from("tournaments")
        .update({ status })
        .eq("id", id);

      if (error) {
        throw error;
      }

      toast.success("Statut mis à jour.");
      await load();
    } catch (error: any) {
      console.error(
        "[ADMIN TOURNAMENT] status:",
        error
      );

      toast.error(
        error?.message ||
          "Impossible de mettre à jour le statut."
      );
    }
  };

  const deleteTournament = async () => {
    if (!confirm("Supprimer ce tournoi ?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("tournaments")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      toast.success("Tournoi supprimé.");
      router.push("/admin/tournaments");
    } catch (error: any) {
      console.error(
        "[ADMIN TOURNAMENT] delete:",
        error
      );

      toast.error(
        error?.message ||
          "Impossible de supprimer le tournoi."
      );
    }
  };

  const generateBracket = async () => {
    if (!id) {
      toast.error("ID du tournoi introuvable.");
      return;
    }

    setGenerating(true);
    setLastBracketError(null);

    try {
      console.log(
        "[BRACKET] Génération du tournoi:",
        id
      );

      /*
       * La génération reste confiée à la fonction SQL.
       * On affiche maintenant l'erreur exacte retournée
       * par Supabase au lieu de la masquer.
       */
      const {
        data,
        error,
      } = await supabase.rpc(
        "generate_tournament_bracket",
        {
          p_tournament: id,
        }
      );

      if (error) {
        console.error(
          "[BRACKET] RPC ERROR:",
          error
        );

        const details = [
          error.message,
          error.code
            ? `code=${error.code}`
            : "",
          error.details
            ? `details=${error.details}`
            : "",
          error.hint
            ? `hint=${error.hint}`
            : "",
        ]
          .filter(Boolean)
          .join(" | ");

        setLastBracketError(
          details ||
            "Erreur Supabase inconnue."
        );

        throw new Error(
          details ||
            "Erreur lors de la génération du bracket."
        );
      }

      console.log(
        "[BRACKET] RPC OK:",
        data
      );

      toast.success(
        "Bracket généré à partir des joueurs payés."
      );

      await load();
    } catch (error: any) {
      console.error(
        "[BRACKET] ERREUR COMPLETE:",
        error
      );

      const message =
        error?.message ||
        "Erreur inconnue lors de la génération du bracket.";

      /*
       * Gestion de quelques erreurs SQL connues.
       */
      if (
        message
          .toLowerCase()
          .includes("not_enough")
      ) {
        toast.error(
          "Il faut au moins 2 joueurs payés."
        );
      } else {
        toast.error(
          `Bracket : ${message}`
        );
      }
    } finally {
      setGenerating(false);
    }
  };

  const reviewPayment = async (
    tpId: string,
    decision: "VALIDE" | "REFUSE"
  ) => {
    let refusalReason = "";

    if (decision === "REFUSE") {
      refusalReason =
        window
          .prompt(
            "Pourquoi refuses-tu cette preuve ?",
            "Preuve de paiement non conforme ou illisible."
          )
          ?.trim() ||
        "Preuve de paiement non conforme ou illisible.";
    }

    try {
      const {
        error,
      } = await supabase.rpc(
        "admin_review_tournament_payment",
        {
          p_registration: tpId,
          p_decision: decision,
          p_refusal_reason:
            decision === "REFUSE"
              ? refusalReason
              : null,
        }
      );

      if (error) {
        throw error;
      }

      if (decision === "VALIDE") {
        toast.success(
          "Paiement validé — notification envoyée au joueur."
        );
      } else {
        toast.success(
          "Paiement refusé — notification envoyée au joueur."
        );
      }

      await load();
    } catch (error: any) {
      console.error(
        "[ADMIN TOURNAMENT] payment review:",
        error
      );

      toast.error(
        error?.message ||
          "Impossible d'enregistrer la décision."
      );
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-zinc-500 flex items-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Chargement...
      </div>
    );
  }

  if (!t) {
    return (
      <div className="p-8 text-white">
        <p>Tournoi introuvable.</p>

        <Link
          href="/admin/tournaments"
          className="mt-3 inline-block underline text-zinc-400"
        >
          Retour
        </Link>
      </div>
    );
  }

  const paidPlayers = players.filter(
    (player) =>
      !!player.is_paid
  ).length;

  return (
    <div className="max-w-5xl space-y-6">
      <Link
        href="/admin/tournaments"
        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour tournois
      </Link>

      <div className="flex justify-between items-center gap-3">
        <h1 className="text-2xl font-black flex items-center gap-3">
          <Trophy className="h-6 w-6 text-amber-400" />
          Gérer : {t.title}
        </h1>

        <button
          type="button"
          onClick={deleteTournament}
          className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2 text-xs text-red-400 flex items-center gap-2 hover:bg-red-500/20"
        >
          <Trash2 className="h-4 w-4" />
          Supprimer
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-800 bg-[#101015] p-5">
          <p className="text-xs text-zinc-500">
            Jeu
          </p>

          <p className="font-bold">
            {t.game}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-[#101015] p-5">
          <p className="text-xs text-zinc-500">
            Places
          </p>

          <p className="font-bold">
            {players.length} / {t.max_players}
          </p>

          <p className="mt-1 text-xs text-emerald-400">
            {paidPlayers} joueur(s) payé(s)
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-[#101015] p-5">
          <p className="text-xs text-zinc-500">
            Statut
          </p>

          <div className="mt-2 flex gap-2">
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value)
              }
              className="rounded-xl bg-[#15151E] border border-zinc-800 px-3 py-2 text-sm"
            >
              <option>OUVERT</option>
              <option>COMPLET</option>
              <option>EN_COURS</option>
              <option>TERMINE</option>
              <option>ANNULE</option>
            </select>

            <button
              type="button"
              onClick={updateStatus}
              className="rounded-xl bg-white text-black px-4 py-2 text-xs font-bold"
            >
              Sauver
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-bold">
              Bracket du tournoi
            </p>

            <p className="text-xs text-zinc-500 mt-1">
              Génération automatique à partir des
              joueurs dont le paiement est validé.
            </p>
          </div>

          <button
            type="button"
            onClick={generateBracket}
            disabled={generating || paidPlayers < 2}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-2.5 text-xs font-black disabled:opacity-40"
          >
            {generating
              ? "Génération..."
              : "Générer / actualiser le bracket"}
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
          <Users className="h-4 w-4" />
          Joueurs payés disponibles :
          <span className="font-bold text-white">
            {paidPlayers}
          </span>
        </div>

        {paidPlayers < 2 && (
          <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            Il faut au moins 2 joueurs avec un paiement
            validé avant de générer le bracket.
          </div>
        )}

        {lastBracketError && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-xs font-black text-red-300">
              ERREUR SUPABASE — BRACKET
            </p>

            <pre className="mt-2 whitespace-pre-wrap break-words text-[11px] leading-relaxed text-red-200/80">
              {lastBracketError}
            </pre>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-[#101015] p-5">
        <h2 className="font-bold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Joueurs inscrits ({players.length})
        </h2>

        {players.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">
            Aucun inscrit pour le moment.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {players.map(
              (tp: any) => (
                <div
                  key={tp.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl bg-[#15151E] border border-zinc-800 p-4"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center font-bold text-xs overflow-hidden">
                      {tp.profiles?.avatar_url ? (
                        <img
                          src={
                            tp.profiles
                              .avatar_url
                          }
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        (
                          tp.profiles
                            ?.display_name ||
                          tp.profiles
                            ?.username ||
                          "?"
                        )[0]
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-bold">
                        @
                        {tp.profiles
                          ?.username ||
                          "joueur"}
                      </p>

                      <p className="text-xs text-zinc-500">
                        {tp.profiles
                          ?.display_name ||
                          ""}{" "}
                        •{" "}
                        {tp.is_paid
                          ? "✅ Paiement validé"
                          : "⏳ Paiement en attente"}{" "}
                        •{" "}
                        {tp.status}
                      </p>

                      {tp.payment_proof_url && (
                        <a
                          href={
                            tp.payment_proof_url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs text-cyan-400 underline"
                        >
                          <ImageIcon className="h-3 w-3" />
                          Voir capture Wave
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {tp.payment_proof_url && (
                      <img
                        src={
                          tp.payment_proof_url
                        }
                        alt="proof"
                        className="h-20 w-20 rounded-xl object-cover border border-zinc-800 cursor-pointer"
                        onClick={() =>
                          window.open(
                            tp.payment_proof_url,
                            "_blank"
                          )
                        }
                      />
                    )}

                    <div className="flex flex-col gap-2 min-w-[180px]">
                      {!tp.is_paid &&
                        tp.payment_proof_url && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                reviewPayment(
                                  tp.id,
                                  "VALIDE"
                                )
                              }
                              className="rounded-xl bg-emerald-500 text-black px-3 py-2 text-xs font-black flex items-center justify-center gap-1 hover:bg-emerald-400"
                            >
                              <Check className="h-3 w-3" />
                              Valider
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                reviewPayment(
                                  tp.id,
                                  "REFUSE"
                                )
                              }
                              className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 px-3 py-2 text-xs font-black flex items-center justify-center gap-1 hover:bg-red-500/20"
                            >
                              <X className="h-3 w-3" />
                              Refuser
                            </button>
                          </div>
                        )}

                      <Link
                        href={`/profile/${
                          tp.profiles
                            ?.username ||
                          ""
                        }`}
                        className="rounded-xl bg-[#101015] border border-zinc-800 px-4 py-1.5 text-xs text-center hover:bg-zinc-900"
                      >
                        Voir profil
                      </Link>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}