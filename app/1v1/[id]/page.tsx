"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Swords, Calendar, Clock, Wallet, Trophy, AlertTriangle, CheckCircle, Flame, Crown, MapPin, FileText, MessageCircle, Flag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { STATUT_LABELS, formatMatchDate, E-TOURNOIS CI_CONFIG, REGLEMENT_1V1_DEFAULT } from "@/lib/1v1/challengeLogic";
import type { Challenge1v1, PlayerStats } from "@/lib/1v1/challengeLogic";
import { confirmMatchLogic, submitResultLogic } from "@/lib/1v1/challengeLogic";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

function PlayerBig({ player, isMe, isWinner }: { player?: PlayerStats; isMe?: boolean; isWinner?: boolean }) {
  if (!player) return <div className="h-40 rounded-2xl bg-zinc-900 animate-pulse" />;
  return (
    <div className={cn("relative rounded-[22px] border p-5 bg-[#15151E]", isWinner ? "border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)]" : "border-[#22222F]")}>
      {isWinner && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-bold text-black flex items-center gap-1">
          <Trophy className="h-3 w-3" /> VAINQUEUR
        </div>
      )}
      <div className="flex flex-col items-center text-center">
        <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-2 border-[#2A2A38] bg-[#101015]">
          {player.avatar_url ? (
            <img src={player.avatar_url} alt={player.pseudo} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#7C3AED]/40 to-[#06B6D4]/30 flex items-center justify-center text-2xl font-black text-white">
              {player.pseudo[0]?.toUpperCase()}
            </div>
          )}
          {player.tournois_remportes > 0 && (
            <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-yellow-400 border-2 border-[#15151E] flex items-center justify-center">
              <Crown className="h-3 w-3 text-black" />
            </div>
          )}
        </div>
        <h3 className="mt-3 font-bold text-white flex items-center gap-2">
          {player.pseudo} {isMe && <span className="rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/20 px-2 py-0.5 text-[10px] text-[#A855F7]">Toi</span>}
        </h3>
        <p className="text-xs text-zinc-500">@{player.username} {player.ville ? `• ${player.ville}` : ""}</p>

        <div className="mt-4 grid w-full grid-cols-3 gap-2">
          <div className="rounded-xl bg-[#08080B] border border-[#22222F] py-2">
            <div className="text-[10px] text-zinc-500">MATCHS</div>
            <div className="font-bold text-white">{player.matchs}</div>
          </div>
          <div className="rounded-xl bg-[#08080B] border border-emerald-500/20 py-2">
            <div className="text-[10px] text-zinc-500">VIC</div>
            <div className="font-bold text-emerald-300">{player.victoires}</div>
          </div>
          <div className="rounded-xl bg-[#08080B] border border-[#22222F] py-2">
            <div className="text-[10px] text-zinc-500">TAUX</div>
            <div className="font-bold text-[#06B6D4]">{player.taux_victoire}%</div>
          </div>
        </div>

        <div className="mt-3 w-full space-y-1.5 text-left">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-500">Tournois remportés</span>
            <span className="font-semibold text-white flex items-center gap-1">{player.tournois_remportes} <Trophy className="h-3 w-3 text-yellow-400" /></span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-500">Victoires 1V1</span>
            <span className="font-semibold text-[#06B6D4] flex items-center gap-1">{player.victoires_1v1} <Flame className="h-3 w-3" /></span>
          </div>
          {player.palmares.length > 0 && (
            <div className="pt-2">
              <div className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1">Palmarès</div>
              <div className="flex flex-wrap gap-1.5">
                {player.palmares.slice(0, 3).map((p, i) => (
                  <span key={i} className="rounded-full bg-[#08080B] border border-[#22222F] px-2.5 py-1 text-[10px] text-zinc-400">{p}</span>
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
  const id = params?.id as string;
  const supabase = createClient();

  const [match, setMatch] = useState<Challenge1v1 | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("me");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
            challenger:profiles!challenger_id(id, username, avatar_url, matches_played, wins, losses, tournaments_won, wins_1v1, palmares, city),
            challenged:profiles!challenged_id(id, username, avatar_url, matches_played, wins, losses, tournaments_won, wins_1v1, palmares, city)
          `)
          .eq("id", id)
          .single();

        if (!error && data) {
          const c: any = data;
          const mapP = (p: any): PlayerStats | undefined => p ? ({
            id: p.id,
            pseudo: p.username,
            username: p.username,
            avatar_url: p.avatar_url,
            matchs: p.matches_played || 0,
            victoires: p.wins || 0,
            defaites: p.losses || 0,
            taux_victoire: p.matches_played ? Math.round((p.wins || 0) / p.matches_played * 100) : 0,
            tournois_remportes: p.tournaments_won || 0,
            victoires_1v1: p.wins_1v1 || 0,
            palmares: Array.isArray(p.palmares) ? p.palmares : [],
            ville: p.city,
          }) : undefined;

          setMatch({
            ...c,
            challenger: mapP(c.challenger),
            challenged: mapP(c.challenged),
          });
        } else {
          // MOCK
          setMatch({
            id,
            challenger_id: "m3",
            challenged_id: "me",
            challenger: { id: "m3", pseudo: "ZoroBabi", username: "zorobabi", avatar_url: null, matchs: 65, victoires: 45, defaites: 20, taux_victoire: 69, tournois_remportes: 5, victoires_1v1: 33, palmares: ["2x Champion E-TOURNOIS CI", "Roi du 1V1"], ville: "Cocody" },
            challenged: { id: "me", pseudo: "Toi", username: "toi", avatar_url: null, matchs: 20, victoires: 12, defaites: 8, taux_victoire: 60, tournois_remportes: 1, victoires_1v1: 6, palmares: ["Top 8 Tournoi Yop"], ville: "Abidjan" },
            statut: "CONFIRME",
            date_match: new Date().toISOString(),
            heure_match: "20:30",
            reglement: REGLEMENT_1V1_DEFAULT,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            paiement_challenger: true,
            paiement_challenged: true,
            preuve_challenger_url: null,
            preuve_challenged_url: null,
            paiement_confirme_admin: true,
            declaration_challenger: null,
            declaration_challenged: null,
            gagnant_id: null,
            contestation_raison: null,
          });
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleConfirmMatch = async () => {
    setActionLoading("confirm");
    try {
      await confirmMatchLogic(supabase, id, currentUserId);
      toast.success("Match lancé ! Que le meilleur gagne 🔥");
      setMatch((prev) => prev ? { ...prev, statut: "EN_COURS" } : prev);
    } catch (e: any) {
      if (e.message?.includes("relation")) {
        toast.success("Match lancé (démo) !");
        setMatch((prev) => prev ? { ...prev, statut: "EN_COURS" } : prev);
      } else {
        toast.error(e.message);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclareWinner = async (gagnantId: string) => {
    setActionLoading(`result-${gagnantId}`);
    try {
      const updated = await submitResultLogic(supabase, { challengeId: id, declarantId: currentUserId, gagnantId });
      toast.success(updated.statut === "TERMINE" ? "Victoire confirmée ! GG" : updated.statut === "CONTESTE" ? "Déclarations différentes - contesté, staff va trancher" : "Résultat envoyé, en attente de l'autre joueur");
      setMatch(updated);
    } catch (e: any) {
      if (e.message?.includes("relation")) {
        toast.success("Résultat envoyé (démo)");
        // Simulation logique contesté
        if (match) {
          const isChallenger = match.challenger_id === currentUserId;
          const otherDecl = isChallenger ? match.declaration_challenged : match.declaration_challenger;
          if (otherDecl && otherDecl !== gagnantId) {
            setMatch({ ...match, statut: "CONTESTE", contestation_raison: "Déclarations différentes", ...(isChallenger ? { declaration_challenger: gagnantId } : { declaration_challenged: gagnantId }) });
          } else if (otherDecl && otherDecl === gagnantId) {
            setMatch({ ...match, statut: "TERMINE", gagnant_id: gagnantId, ...(isChallenger ? { declaration_challenger: gagnantId } : { declaration_challenged: gagnantId }) });
          } else {
            setMatch({ ...match, statut: "RESULTAT_EN_ATTENTE", ...(isChallenger ? { declaration_challenger: gagnantId } : { declaration_challenged: gagnantId }) });
          }
        }
      } else {
        toast.error(e.message);
      }
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || !match) {
    return (
      <div className="min-h-screen bg-[#08080B] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statut = STATUT_LABELS[match.statut];
  const isChallenger = match.challenger_id === currentUserId;
  const myDeclaration = isChallenger ? match.declaration_challenger : match.declaration_challenged;
  const opponentDeclaration = isChallenger ? match.declaration_challenged : match.declaration_challenger;

  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      <div className="sticky top-0 z-20 border-b border-[#22222F] bg-[#08080B]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/1v1/challenges" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition">
            <ArrowLeft className="h-4 w-4" /> Retour défis
          </Link>
          <div className={cn("rounded-full border px-3 py-1 text-xs font-semibold", statut.bg, statut.color)}>{statut.label}</div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 lg:py-8">
        {/* Titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#101015] border border-[#22222F] px-4 py-1.5 text-xs text-zinc-400">
            <Swords className="h-3.5 w-3.5 text-[#A855F7]" /> Match 1V1 Direct • 500 FCFA par joueur • ID {match.id.slice(0, 8)}
          </div>
          <h1 className="mt-4 text-2xl lg:text-4xl font-black tracking-tight">
            {match.challenger?.pseudo} <span className="text-[#06B6D4]">VS</span> {match.challenged?.pseudo}
          </h1>
          <p className="mt-2 text-sm text-zinc-400">{formatMatchDate(match.date_match, match.heure_match)} • Abidjan 🇨🇮</p>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          {/* Joueurs */}
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <PlayerBig player={match.challenger} isMe={match.challenger_id === currentUserId} isWinner={match.gagnant_id === match.challenger_id} />
              <PlayerBig player={match.challenged} isMe={match.challenged_id === currentUserId} isWinner={match.gagnant_id === match.challenged_id} />
            </div>

            {/* Timeline / paiements */}
            <div className="rounded-[20px] border border-[#22222F] bg-[#15151E] p-5">
              <h3 className="font-semibold flex items-center gap-2"><Wallet className="h-4 w-4 text-[#06B6D4]" /> Paiements Wave</h3>
              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                <div className={cn("rounded-xl border p-3 flex items-center justify-between", match.paiement_challenger ? "bg-emerald-500/10 border-emerald-500/20" : "bg-[#08080B] border-[#22222F]")}>
                  <span className="text-sm">{match.challenger?.pseudo}</span>
                  {match.paiement_challenger ? <CheckCircle className="h-5 w-5 text-emerald-400" /> : <span className="text-xs text-zinc-500">En attente</span>}
                </div>
                <div className={cn("rounded-xl border p-3 flex items-center justify-between", match.paiement_challenged ? "bg-emerald-500/10 border-emerald-500/20" : "bg-[#08080B] border-[#22222F]")}>
                  <span className="text-sm">{match.challenged?.pseudo}</span>
                  {match.paiement_challenged ? <CheckCircle className="h-5 w-5 text-emerald-400" /> : <span className="text-xs text-zinc-500">En attente</span>}
                </div>
              </div>
              <p className="mt-3 text-xs text-zinc-500">Wave unique E-TOURNOIS CI: <span className="font-semibold text-white">{E-TOURNOIS CI_CONFIG.wave}</span> - 500 FCFA chacun. Chaque joueur doit uploader sa preuve.</p>
              {["ACCEPTE", "PAIEMENT_EN_COURS", "PAIEMENT_PARTIEL"].includes(match.statut) && (
                <Link href={`/1v1/${match.id}/payment`} className="mt-4 inline-flex w-full justify-center rounded-full bg-white text-black py-2.5 text-sm font-bold hover:bg-zinc-100 transition">Aller au paiement</Link>
              )}
            </div>

            {/* Déclaration résultat */}
            {(["CONFIRME", "EN_COURS", "RESULTAT_EN_ATTENTE"].includes(match.statut) || match.statut === "CONTESTE") && (
              <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-5">
                <h3 className="font-semibold flex items-center gap-2"><Flag className="h-4 w-4 text-[#A855F7]" /> Déclarer le résultat</h3>
                <p className="text-xs text-zinc-500 mt-1">Honest game, dis la vérité. Si vos déclarations correspondent pas, ça passe en CONTESTÉ et le staff E-TOURNOIS CI tranche.</p>

                {myDeclaration && (
                  <div className="mt-3 rounded-xl bg-[#08080B] border border-[#22222F] p-3 text-xs text-zinc-400">
                    Tu as déclaré : <span className="text-white font-semibold">{myDeclaration === match.challenger_id ? match.challenger?.pseudo : match.challenged?.pseudo} gagnant</span>
                    {opponentDeclaration ? ` • L'adversaire a déclaré aussi.` : " • En attente de l'adversaire."}
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    disabled={!!actionLoading || !!myDeclaration}
                    onClick={() => handleDeclareWinner(match.challenger_id)}
                    className="rounded-full border border-[#22222F] bg-[#15151E] py-3 text-sm font-semibold hover:border-[#7C3AED]/40 disabled:opacity-50 transition"
                  >
                    {actionLoading === `result-${match.challenger_id}` ? "..." : `${match.challenger?.pseudo} a gagné`}
                  </button>
                  <button
                    disabled={!!actionLoading || !!myDeclaration}
                    onClick={() => handleDeclareWinner(match.challenged_id)}
                    className="rounded-full border border-[#22222F] bg-[#15151E] py-3 text-sm font-semibold hover:border-[#7C3AED]/40 disabled:opacity-50 transition"
                  >
                    {actionLoading === `result-${match.challenged_id}` ? "..." : `${match.challenged?.pseudo} a gagné`}
                  </button>
                </div>

                {match.statut === "CONTESTE" && (
                  <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 flex gap-2 text-xs text-red-200/80">
                    <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                    <div>{match.contestation_raison || "Déclarations différentes - contacte le staff sur WhatsApp"}<br /><a href={E-TOURNOIS CI_CONFIG.whatsappLink} target="_blank" className="underline">WhatsApp {E-TOURNOIS CI_CONFIG.whatsapp}</a></div>
                  </div>
                )}
              </div>
            )}

            {match.statut === "TERMINE" && match.gagnant_id && (
              <div className="rounded-[20px] border border-emerald-500/20 bg-emerald-500/10 p-6 text-center">
                <Trophy className="h-10 w-10 text-yellow-400 mx-auto mb-3" />
                <h3 className="text-xl font-black">Match terminé !</h3>
                <p className="mt-1 text-sm text-zinc-300">Vainqueur : <span className="font-bold text-white">{match.gagnant_id === match.challenger_id ? match.challenger?.pseudo : match.challenged?.pseudo}</span> 🏆</p>
                <p className="text-xs text-zinc-500 mt-1">GG aux deux joueurs, respect 🇨🇮</p>
              </div>
            )}
          </div>

          {/* Sidebar infos */}
          <div className="space-y-4">
            <div className="rounded-[20px] border border-[#22222F] bg-[#15151E] p-5">
              <h4 className="text-sm font-semibold flex items-center gap-2"><Calendar className="h-4 w-4 text-zinc-500" /> Détails match</h4>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-zinc-500">Date</span><span className="text-white">{match.date_match ? new Date(match.date_match).toLocaleDateString("fr-CI") : "À définir"}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Heure</span><span className="text-white flex items-center gap-1"><Clock className="h-3 w-3" />{match.heure_match || "--:--"}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Mise</span><span className="text-white">500 FCFA x2</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Wave</span><span className="text-white font-mono">{E-TOURNOIS CI_CONFIG.wave}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Statut</span><span className={cn("rounded-full px-2 py-0.5 text-xs border", STATUT_LABELS[match.statut].bg, STATUT_LABELS[match.statut].color)}>{STATUT_LABELS[match.statut].label}</span></div>
              </div>
            </div>

            <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-5">
              <h4 className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-zinc-500" /> Règlement 1V1</h4>
              <pre className="mt-3 whitespace-pre-wrap text-[11px] leading-relaxed text-zinc-400 font-sans">{match.reglement || REGLEMENT_1V1_DEFAULT}</pre>
            </div>

            <div className="rounded-[20px] border border-[#7C3AED]/20 bg-[#7C3AED]/5 p-5">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2"><MessageCircle className="h-4 w-4 text-[#A855F7]" /> Support E-TOURNOIS CI</h4>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">Un souci ? Connexion, litige, paiement ? On gère tout sur WhatsApp, réponse rapide.</p>
              <a href={E-TOURNOIS CI_CONFIG.whatsappLink} target="_blank" className="mt-3 inline-flex w-full justify-center rounded-full bg-white text-black py-2.5 text-sm font-bold hover:bg-zinc-100 transition">WhatsApp {E-TOURNOIS CI_CONFIG.whatsapp}</a>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-500"><MapPin className="h-3 w-3" /> Abidjan, Côte d'Ivoire 🇨🇮</div>
            </div>

            {match.statut === "CONFIRME" && (
              <button onClick={handleConfirmMatch} disabled={!!actionLoading} className="w-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:opacity-90 disabled:opacity-50 transition">
                {actionLoading === "confirm" ? "…" : "Confirmer & lancer le match"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
