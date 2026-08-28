"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
Swords,
Trophy,
Check,
X,
Eye,
RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type PlayerType = "challenger" | "challenged";

export default function Admin1v1Page() {
const supabase = createClient();

const [duels, setDuels] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
const [actionLoading, setActionLoading] = useState<string | null>(null);

const load = async () => {
setLoading(true);

try {
  const { data, error } = await supabase
    .from("challenges_1v1")
    .select(`
      *,
      challenger:challenger_id(
        id,
        username,
        display_name,
        avatar_url
      ),
      challenged:challenged_id(
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[ADMIN 1V1] load:", error);
    toast.error(error.message || "Impossible de charger les duels.");
    return;
  }

  setDuels(data || []);
} catch (error: any) {
  console.error("[ADMIN 1V1] load exception:", error);
  toast.error(error?.message || "Impossible de charger les duels.");
} finally {
  setLoading(false);
}

};

useEffect(() => {
load();

const channel = supabase
  .channel("admin-1v1")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "challenges_1v1",
    },
    () => {
      load();
    }
  )
  .subscribe();

return () => {
  supabase.removeChannel(channel);
};

}, []);

const updatePayment = async (
id: string,
player: PlayerType,
accepted: boolean
) => {
const key = id + '-' + player + '-' + (accepted ? 'accept' : 'refuse');

setActionLoading(key);

try {
  const duel = duels.find((d) => d.id === id);

  if (!duel) {
    throw new Error("Duel introuvable.");
  }

  const paymentField =
    player === "challenger"
      ? "paiement_challenger"
      : "paiement_challenged";

  const proofField =
    player === "challenger"
      ? "preuve_challenger_url"
      : "preuve_challenged_url";

  const currentPayment = !!duel[paymentField];

  if (accepted && currentPayment) {
    toast.info("Ce paiement est déjà accepté.");
    return;
  }

  if (!accepted && !currentPayment) {
    toast.info("Ce paiement est déjà refusé ou en attente.");
    return;
  }

  const updatePayload: any = {
    [paymentField]: accepted,
  };

  /*
   * Si l'admin refuse le paiement :
   * on supprime également la preuve enregistrée.
   */
  if (!accepted) {
    updatePayload[proofField] = null;
  }

  /*
   * Le statut est calculé indépendamment pour les deux joueurs.
   *
   * J1 accepté + J2 accepté
   *      => CONFIRME
   *
   * J1 accepté + J2 non accepté
   *      => PAIEMENT_PARTIEL
   *
   * J1 non accepté + J2 accepté
   *      => PAIEMENT_PARTIEL
   *
   * aucun accepté
   *      => PAIEMENT_EN_COURS
   */
  const nextChallengerPayment =
    player === "challenger"
      ? accepted
      : !!duel.paiement_challenger;

  const nextChallengedPayment =
    player === "challenged"
      ? accepted
      : !!duel.paiement_challenged;

  if (nextChallengerPayment && nextChallengedPayment) {
    updatePayload.statut = "CONFIRME";
    updatePayload.paiement_confirme_admin = true;
  } else if (nextChallengerPayment || nextChallengedPayment) {
    updatePayload.statut = "PAIEMENT_PARTIEL";
    updatePayload.paiement_confirme_admin = false;
  } else {
    updatePayload.statut = "PAIEMENT_EN_COURS";
    updatePayload.paiement_confirme_admin = false;
  }

  const { error } = await supabase
    .from("challenges_1v1")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    console.error("[ADMIN 1V1] update payment:", error);
    throw error;
  }

  if (accepted) {
    toast.success(
      player === "challenger"
        ? `Paiement de ${
            duel.challenger?.display_name ||
            duel.challenger?.username ||
            "Joueur 1"
          } accepté.`
        : `Paiement de ${
            duel.challenged?.display_name ||
            duel.challenged?.username ||
            "Joueur 2"
          } accepté.`
    );
  } else {
    toast.success(
      player === "challenger"
        ? `Paiement de ${
            duel.challenger?.display_name ||
            duel.challenger?.username ||
            "Joueur 1"
          } refusé.`
        : `Paiement de ${
            duel.challenged?.display_name ||
            duel.challenged?.username ||
            "Joueur 2"
          } refusé.`
    );
  }

  await load();
} catch (error: any) {
  console.error("[ADMIN 1V1] payment action:", error);
  toast.error(
    error?.message || "Impossible de modifier le paiement."
  );
} finally {
  setActionLoading(null);
}

};

const playerName = (duel: any, player: PlayerType) => {
const p =
player === "challenger"
? duel.challenger
: duel.challenged;

return (
  p?.display_name ||
  p?.username ||
  (player === "challenger" ? "Joueur 1" : "Joueur 2")
);

};

const playerPayment = (duel: any, player: PlayerType) => {
return player === "challenger"
? !!duel.paiement_challenger
: !!duel.paiement_challenged;
};

const playerProof = (duel: any, player: PlayerType) => {
return player === "challenger"
? duel.preuve_challenger_url
: duel.preuve_challenged_url;
};

return (
<div className="space-y-6">
<div className="flex flex-wrap items-center justify-between gap-3">
<h1 className="text-3xl font-black flex items-center gap-3">
<Swords className="h-7 w-7 text-cyan-400" />
Duels 1V1
</h1>

    <button
      onClick={load}
      disabled={loading}
      className="rounded-xl border border-zinc-800 bg-[#101015] px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-900 disabled:opacity-50 flex items-center gap-2"
    >
      <RefreshCw
        className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
      />
      Actualiser
    </button>
  </div>

  {loading && duels.length === 0 ? (
    <div className="rounded-2xl border border-zinc-800 bg-[#101015] p-10 text-center">
      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-cyan-400" />
      <p className="mt-3 text-sm text-zinc-500">
        Chargement des duels...
      </p>
    </div>
  ) : (
    <div className="space-y-4">
      {duels.map((d) => {
        const challengerPaid = playerPayment(d, "challenger");
        const challengedPaid = playerPayment(d, "challenged");

        const challengerProof = playerProof(d, "challenger");
        const challengedProof = playerProof(d, "challenged");

        const bothAccepted =
          challengerPaid && challengedPaid;

        return (
          <div
            key={d.id}
            className="rounded-2xl border border-zinc-800 bg-[#101015] p-5 space-y-5"
          >
            {/* HEADER DUEL */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-black text-lg">
                  {playerName(d, "challenger")}
                  <span className="text-zinc-600 mx-2">
                    VS
                  </span>
                  {playerName(d, "challenged")}
                </p>

                <p className="text-xs text-zinc-500 mt-1">
                  ID : {d.id}
                </p>

                <p className="text-xs text-zinc-500 mt-1">
                  Statut :{" "}
                  <span className="text-white font-semibold">
                    {d.statut}
                  </span>
                </p>
              </div>

              {bothAccepted && (
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                  LES 2 PAIEMENTS SONT ACCEPTÉS
                </span>
              )}
            </div>

            {/* PAIEMENTS INDIVIDUELS */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* JOUEUR 1 */}
              <div
                className={`rounded-2xl border p-4 ${
                  challengerPaid
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-zinc-800 bg-[#0b0b0f]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">
                      {playerName(d, "challenger")}
                    </p>

                    <p className="text-xs text-zinc-500 mt-1">
                      Joueur 1 — 500 FCFA
                    </p>
                  </div>

                  {challengerPaid ? (
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 text-[10px] font-bold text-emerald-300">
                      ACCEPTÉ
                    </span>
                  ) : (
                    <span className="rounded-full bg-orange-500/10 border border-orange-500/20 px-2 py-1 text-[10px] font-bold text-orange-300">
                      EN ATTENTE
                    </span>
                  )}
                </div>

                {challengerProof ? (
                  <a
                    href={challengerProof}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-bold text-white hover:bg-zinc-800"
                  >
                    <Eye className="h-4 w-4" />
                    Voir la preuve
                  </a>
                ) : (
                  <p className="mt-4 text-xs text-zinc-600">
                    Aucune preuve disponible.
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      updatePayment(
                        d.id,
                        "challenger",
                        true
                      )
                    }
                    disabled={
                      !!actionLoading ||
                      challengerPaid
                    }
                    className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-black hover:bg-emerald-400 disabled:opacity-40 flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />

                    {actionLoading ===
                    `${d.id}-challenger-accept`
                      ? "..."
                      : "Accepter"}
                  </button>

                  <button
                    onClick={() =>
                      updatePayment(
                        d.id,
                        "challenger",
                        false
                      )
                    }
                    disabled={
                      !!actionLoading ||
                      !challengerPaid
                    }
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-black text-red-300 hover:bg-red-500/20 disabled:opacity-40 flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />

                    {actionLoading ===
                    `${d.id}-challenger-refuse`
                      ? "..."
                      : "Refuser"}
                  </button>
                </div>
              </div>

              {/* JOUEUR 2 */}
              <div
                className={`rounded-2xl border p-4 ${
                  challengedPaid
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-zinc-800 bg-[#0b0b0f]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">
                      {playerName(d, "challenged")}
                    </p>

                    <p className="text-xs text-zinc-500 mt-1">
                      Joueur 2 — 500 FCFA
                    </p>
                  </div>

                  {challengedPaid ? (
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 text-[10px] font-bold text-emerald-300">
                      ACCEPTÉ
                    </span>
                  ) : (
                    <span className="rounded-full bg-orange-500/10 border border-orange-500/20 px-2 py-1 text-[10px] font-bold text-orange-300">
                      EN ATTENTE
                    </span>
                  )}
                </div>

                {challengedProof ? (
                  <a
                    href={challengedProof}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-bold text-white hover:bg-zinc-800"
                  >
                    <Eye className="h-4 w-4" />
                    Voir la preuve
                  </a>
                ) : (
                  <p className="mt-4 text-xs text-zinc-600">
                    Aucune preuve disponible.
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      updatePayment(
                        d.id,
                        "challenged",
                        true
                      )
                    }
                    disabled={
                      !!actionLoading ||
                      challengedPaid
                    }
                    className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-black hover:bg-emerald-400 disabled:opacity-40 flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />

                    {actionLoading ===
                    `${d.id}-challenged-accept`
                      ? "..."
                      : "Accepter"}
                  </button>

                  <button
                    onClick={() =>
                      updatePayment(
                        d.id,
                        "challenged",
                        false
                      )
                    }
                    disabled={
                      !!actionLoading ||
                      !challengedPaid
                    }
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-black text-red-300 hover:bg-red-500/20 disabled:opacity-40 flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />

                    {actionLoading ===
                    `${d.id}-challenged-refuse`
                      ? "..."
                      : "Refuser"}
                  </button>
                </div>
              </div>
            </div>

            {/* RESULTAT DES PAIEMENTS */}
            <div className="border-t border-zinc-800 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-zinc-500">
                  Paiement J1 :{" "}
                  <span
                    className={
                      challengerPaid
                        ? "text-emerald-400 font-bold"
                        : "text-orange-400 font-bold"
                    }
                  >
                    {challengerPaid
                      ? "ACCEPTÉ"
                      : "EN ATTENTE / REFUSÉ"}
                  </span>
                  {"  •  "}
                  Paiement J2 :{" "}
                  <span
                    className={
                      challengedPaid
                        ? "text-emerald-400 font-bold"
                        : "text-orange-400 font-bold"
                    }
                  >
                    {challengedPaid
                      ? "ACCEPTÉ"
                      : "EN ATTENTE / REFUSÉ"}
                  </span>
                </div>

                {d.match_id && bothAccepted && (
                  <Link
                    href={`/1v1/${d.id}`}
                    className="rounded-xl bg-white text-black px-4 py-2 text-xs font-black flex items-center gap-2 hover:bg-zinc-200"
                  >
                    <Trophy className="h-4 w-4" />
                    Ouvrir le match
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {duels.length === 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-[#101015] p-10 text-center">
          <Swords className="h-8 w-8 mx-auto text-zinc-700" />
          <p className="text-zinc-500 mt-3">
            Aucun duel 1V1.
          </p>
        </div>
      )}
    </div>
  )}
</div>

);
}
