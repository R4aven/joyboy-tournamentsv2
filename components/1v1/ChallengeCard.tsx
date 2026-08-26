"use client";

import { Calendar, Clock, Swords, Check, X, AlertTriangle, Trophy, Hourglass, Wallet, Eye } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { Challenge1v1, PlayerStats } from "@/lib/1v1/challengeLogic";
import { STATUT_LABELS, formatMatchDate } from "@/lib/1v1/challengeLogic";

type Props = {
  challenge: Challenge1v1;
  currentUserId?: string;
  variant?: "recu" | "envoye";
  onAccept?: (id: string) => Promise<void> | void;
  onRefuse?: (id: string) => Promise<void> | void;
  onPay?: (id: string) => void;
  loadingAction?: string | null;
};

function Avatar({ player, size = 48 }: { player?: PlayerStats; size?: number }) {
  if (!player) return <div style={{ width: size, height: size }} className="rounded-xl bg-zinc-800 animate-pulse" />;
  return (
    <div
      style={{ width: size, height: size }}
      className="relative shrink-0 overflow-hidden rounded-xl border border-[#22222F] bg-[#15151E]"
    >
      {player.avatar_url ? (
        <img src={player.avatar_url} alt={player.pseudo} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-[#7C3AED]/30 to-[#06B6D4]/20 flex items-center justify-center font-bold text-white">
          {player.pseudo[0]?.toUpperCase()}
        </div>
      )}
      {player.tournois_remportes > 0 && (
        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-yellow-500 border-2 border-[#15151E] flex items-center justify-center">
          <Trophy className="h-3 w-3 text-black" />
        </div>
      )}
    </div>
  );
}

export default function ChallengeCard({ challenge, currentUserId, variant, onAccept, onRefuse, onPay, loadingAction }: Props) {
  const statutMeta = STATUT_LABELS[challenge.statut] || STATUT_LABELS.EN_ATTENTE;
  const isChallenger = currentUserId === challenge.challenger_id;
  const adversaire = isChallenger ? challenge.challenged : challenge.challenger;
  const me = isChallenger ? challenge.challenger : challenge.challenged;

  const iHavePaid = isChallenger ? challenge.paiement_challenger : challenge.paiement_challenged;
  const opponentPaid = isChallenger ? challenge.paiement_challenged : challenge.paiement_challenger;

  return (
    <div className="group relative overflow-hidden rounded-[20px] border border-[#22222F] bg-gradient-to-b from-[#15151E] to-[#101015] p-[1px]">
      <div className="rounded-[19px] bg-[#15151E] overflow-hidden">
        {/* Header statut */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#22222F] bg-[#101015]/60">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#7C3AED]/20 to-[#06B6D4]/20 border border-[#7C3AED]/20 flex items-center justify-center">
              <Swords className="h-4 w-4 text-[#A855F7]" />
            </div>
            <div>
              <div className="text-xs text-zinc-500">Défi 1V1 • {new Date(challenge.created_at).toLocaleDateString("fr-CI")}</div>
              <div className="text-[13px] font-semibold text-white flex items-center gap-2">
                {variant === "recu" ? "Défi reçu" : variant === "envoye" ? "Défi envoyé" : "Match 1V1"}
                <span className="h-1 w-1 rounded-full bg-zinc-700" />
                <span className="text-zinc-400 font-normal">500 FCFA</span>
              </div>
            </div>
          </div>

          <div className={cn("rounded-full border px-3 py-1 text-[11px] font-semibold", statutMeta.bg, statutMeta.color)}>
            {statutMeta.label}
          </div>
        </div>

        {/* Corps VS */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            {/* Joueur A */}
            <div className="flex flex-1 items-center gap-3">
              <Avatar player={challenge.challenger} size={44} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[13px] font-semibold text-white">
                    {challenge.challenger?.pseudo || "Joueur A"}
                  </span>
                  {currentUserId === challenge.challenger_id && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/20">Toi</span>
                  )}
                </div>
                <div className="text-[11px] text-zinc-500">
                  {challenge.challenger ? `${challenge.challenger.victoires}V - ${challenge.challenger.defaites}D • ${challenge.challenger.taux_victoire}%` : ""}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="rounded-full bg-[#08080B] border border-[#22222F] px-2.5 py-1 text-[10px] font-bold tracking-wider text-[#06B6D4]">VS</div>
              <div className="mt-1 h-px w-8 bg-gradient-to-r from-transparent via-[#22222F] to-transparent" />
            </div>

            {/* Joueur B */}
            <div className="flex flex-1 items-center justify-end gap-3">
              <div className="min-w-0 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  {currentUserId === challenge.challenged_id && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/20">Toi</span>
                  )}
                  <span className="truncate text-[13px] font-semibold text-white">
                    {challenge.challenged?.pseudo || "Joueur B"}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500">
                  {challenge.challenged ? `${challenge.challenged.victoires}V - ${challenge.challenged.defaites}D • ${challenge.challenged.taux_victoire}%` : ""}
                </div>
              </div>
              <Avatar player={challenge.challenged} size={44} />
            </div>
          </div>

          {/* Infos match */}
          {(challenge.date_match || challenge.heure_match) && (
            <div className="mt-4 flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-[#08080B] border border-[#22222F] px-3 py-1.5 text-[11px] text-zinc-400">
                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                {formatMatchDate(challenge.date_match, challenge.heure_match)}
              </div>
              {challenge.heure_match && (
                <div className="flex items-center gap-1.5 rounded-full bg-[#08080B] border border-[#22222F] px-3 py-1.5 text-[11px] text-zinc-400">
                  <Clock className="h-3.5 w-3.5 text-zinc-500" />
                  {challenge.heure_match}
                </div>
              )}
            </div>
          )}

          {/* Paiement indicateurs */}
          {(["ACCEPTE", "PAIEMENT_EN_COURS", "PAIEMENT_PARTIEL", "CONFIRME", "EN_COURS", "RESULTAT_EN_ATTENTE", "TERMINE", "CONTESTE"].includes(challenge.statut)) && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className={cn("rounded-xl border px-3 py-2 flex items-center justify-between", challenge.paiement_challenger ? "bg-emerald-500/10 border-emerald-500/20" : "bg-zinc-900/50 border-zinc-800")}>
                <span className="text-[11px] text-zinc-400 truncate">{challenge.challenger?.pseudo}</span>
                {challenge.paiement_challenger ? <Check className="h-4 w-4 text-emerald-400" /> : <Hourglass className="h-4 w-4 text-zinc-600" />}
              </div>
              <div className={cn("rounded-xl border px-3 py-2 flex items-center justify-between", challenge.paiement_challenged ? "bg-emerald-500/10 border-emerald-500/20" : "bg-zinc-900/50 border-zinc-800")}>
                <span className="text-[11px] text-zinc-400 truncate">{challenge.challenged?.pseudo}</span>
                {challenge.paiement_challenged ? <Check className="h-4 w-4 text-emerald-400" /> : <Hourglass className="h-4 w-4 text-zinc-600" />}
              </div>
            </div>
          )}

          {/* Contestation alerte */}
          {challenge.statut === "CONTESTE" && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 flex gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed text-red-200/80">
                <span className="font-semibold text-red-300">Match contesté :</span> {challenge.contestation_raison || "Déclarations différentes."} L'équipe JOYBOY va trancher sur WhatsApp.
                <br />
                <a href="https://wa.me/2250748235226" target="_blank" className="underline decoration-red-400/30 underline-offset-2 hover:text-red-200">
                  Contacter 07 48 23 52 26
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-[#22222F] bg-[#101015] px-4 py-3 flex items-center gap-2">
          <Link
            href={`/1v1/${challenge.id}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#22222F] bg-[#08080B] px-4 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-white transition"
          >
            <Eye className="h-3.5 w-3.5" />
            Détails
          </Link>

          <div className="ml-auto flex items-center gap-2">
            {challenge.statut === "EN_ATTENTE" && variant === "recu" && (
              <>
                <button
                  disabled={!!loadingAction}
                  onClick={() => onRefuse?.(challenge.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-50 transition"
                >
                  <X className="h-3.5 w-3.5" />
                  {loadingAction === `refuse-${challenge.id}` ? "..." : "Refuser"}
                </button>
                <button
                  disabled={!!loadingAction}
                  onClick={() => onAccept?.(challenge.id)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-5 py-2 text-xs font-semibold text-white shadow-[0_0_15px_rgba(124,58,237,0.35)] hover:opacity-90 disabled:opacity-50 transition"
                >
                  <Check className="h-3.5 w-3.5" />
                  {loadingAction === `accept-${challenge.id}` ? "..." : "Accepter"}
                </button>
              </>
            )}

            {["ACCEPTE", "PAIEMENT_EN_COURS", "PAIEMENT_PARTIEL"].includes(challenge.statut) && (
              <button
                onClick={() => onPay?.(challenge.id)}
                className="inline-flex items-center gap-1.5 rounded-full bg-white text-black px-4 py-2 text-xs font-semibold hover:bg-zinc-100 transition"
              >
                <Wallet className="h-3.5 w-3.5" />
                {iHavePaid ? "Voir paiement" : "Payer 500 F"}
              </button>
            )}

            {challenge.statut === "CONFIRME" && (
              <Link
                href={`/1v1/${challenge.id}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 text-black px-4 py-2 text-xs font-bold hover:bg-emerald-400 transition"
              >
                <Swords className="h-3.5 w-3.5" />
                Lancer le match
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
