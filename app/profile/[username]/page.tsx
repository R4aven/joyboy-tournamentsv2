"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Trophy, Swords, Target, Crown, Zap, 
  Calendar, TrendingUp, Shield, Award,
  Lock, Mail, MessageCircle, Share2,
  ArrowLeft, Flame, Users, BarChart3,
  Gift, Clock, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type ProfileData = {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  wins: number;
  losses: number;
  tournaments_played: number;
  tournaments_won: number;
  duels_won: number;
  total_earnings: number;
  created_at: string;
  is_private?: boolean;
};

type Match = {
  id: string;
  player1_id: string;
  player2_id: string;
  winner_id: string | null;
  status: string;
  score_p1?: number;
  score_p2?: number;
  tournament_id?: string | null;
  created_at: string;
  opponent_username?: string;
};

type TournamentEntry = {
  id: string;
  tournament_id: string;
  tournaments?: { name: string; game: string; status: string };
  position?: number | null;
  created_at: string;
};

type TrophyItem = {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  earned_at: string;
};

export default function ProfilePage() {
  const params = useParams();
  const usernameParam = (params?.username as string) ?? "";
  const router = useRouter();
  const { user, profile: myProfile } = useAuth();
  const supabase = createClient();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<TournamentEntry[]>([]);
  const [trophies, setTrophies] = useState<TrophyItem[]>([]);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challengeStake, setChallengeStake] = useState("1000");
  const [challenging, setChallenging] = useState(false);
  const [activeTab, setActiveTab] = useState<"apercu" | "matchs" | "tournois" | "palmares">("apercu");

  const isOwnProfile = myProfile?.username?.toLowerCase() === usernameParam.toLowerCase() || user?.id === profile?.id;

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        // Profil par username insensitive
        const { data: prof, error: profError } = await supabase
          .from("profiles")
          .select("*")
          .ilike("username", usernameParam)
          .maybeSingle();

        if (profError) throw profError;
        if (!prof) {
          setProfile(null);
          setLoading(false);
          return;
        }

        setProfile(prof as ProfileData);

        // Si privé et pas owner, on s'arrête aux infos de base
        const isPrivate = (prof as any).is_private;
        const isOwner = user?.id === prof.id;
        const shouldFetchDetails = !isPrivate || isOwner;

        if (!shouldFetchDetails) {
          setLoading(false);
          return;
        }

        // Matchs
        try {
          const { data: matchData } = await supabase
            .from("matches")
            .select("*")
            .or(`player1_id.eq.${prof.id},player2_id.eq.${prof.id}`)
            .order("created_at", { ascending: false })
            .limit(20);

          if (matchData) {
            // Enrichir avec usernames adverses
            const enriched: Match[] = [];
            for (const m of matchData) {
              const oppId = m.player1_id === prof.id ? m.player2_id : m.player1_id;
              let oppName = "Adversaire";
              try {
                const { data: opp } = await supabase.from("profiles").select("username").eq("id", oppId).maybeSingle();
                if (opp) oppName = opp.username;
              } catch {}
              enriched.push({ ...m, opponent_username: oppName });
            }
            setMatches(enriched);
          }
        } catch {}

        // Tournois
        try {
          const { data: tourData } = await supabase
            .from("tournament_participants")
            .select("id, tournament_id, position, created_at, tournaments(name, game, status)")
            .eq("user_id", prof.id)
            .order("created_at", { ascending: false })
            .limit(15);

          if (tourData) setTournaments(tourData as any);
        } catch {}

        // Trophées / achievements
        try {
          const { data: trophyData } = await supabase
            .from("achievements")
            .select("*")
            .eq("user_id", prof.id)
            .order("earned_at", { ascending: false });

          if (trophyData) setTrophies(trophyData as TrophyItem[]);
        } catch {
          // fallback trophies basés sur stats
          const fallback: TrophyItem[] = [];
          if (prof.wins >= 1) fallback.push({ id: "1", name: "Première victoire", description: "A remporté son premier match", icon: "🥇", rarity: "common", earned_at: prof.created_at });
          if (prof.wins >= 10) fallback.push({ id: "2", name: "Vétéran", description: "10 victoires", icon: "⚔️", rarity: "rare", earned_at: prof.created_at });
          if (prof.tournaments_won >= 1) fallback.push({ id: "3", name: "Champion", description: "Gagné un tournoi", icon: "🏆", rarity: "epic", earned_at: prof.created_at });
          if (prof.total_earnings >= 50000) fallback.push({ id: "4", name: "Bank", description: "50k FCFA de gains", icon: "💰", rarity: "legendary", earned_at: prof.created_at });
          setTrophies(fallback);
        }

      } catch (e) {
        console.error(e);
        toast.error("Impossible de charger ce profil");
      } finally {
        setLoading(false);
      }
    };

    if (usernameParam) fetchAll();
  }, [usernameParam, user?.id, supabase]);

  const handleChallenge = async () => {
    if (!user || !myProfile) {
      toast.error("Connecte-toi d'abord pour défier");
      router.push("/login");
      return;
    }
    if (isOwnProfile) return;
    if (!profile) return;

    setChallenging(true);
    try {
      const { error } = await supabase.from("challenges").insert({
        challenger_id: user.id,
        opponent_id: profile.id,
        stake: parseInt(challengeStake, 10) || 1000,
        status: "pending",
        game: "FIFA",
      });
      if (error) throw error;
      toast.success(`Défi envoyé à @${profile.username} ! Il a 24h pour accepter 🔥`);

      // Notif pour l'adversaire
      try {
        await supabase.from("notifications").insert({
          user_id: profile.id,
          type: "challenge",
          title: `Nouveau défi de @${myProfile.username}`,
          message: `${myProfile.username} te défie pour ${challengeStake} FCFA. Accepte vite !`,
          is_read: false,
        });
      } catch {}

      setShowChallengeModal(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message ?? "Erreur lors du défi");
    } finally {
      setChallenging(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#22222F] border-t-[#7C3AED]" />
          <p className="mt-4 text-[13px] text-zinc-500">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="rounded-[24px] border border-[#22222F] bg-[#101015] p-10">
          <p className="text-[48px]">🕵️</p>
          <h1 className="mt-4 text-[22px] font-black text-white">Joueur introuvable</h1>
          <p className="mt-2 text-[14px] text-zinc-400">Aucun joueur avec le pseudo @{usernameParam}. Vérifie l&apos;orthographe.</p>
          <Link href="/classement" className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-white px-6 text-[14px] font-bold text-black hover:bg-zinc-100">Voir le classement</Link>
        </div>
      </div>
    );
  }

  const totalMatches = (profile.wins ?? 0) + (profile.losses ?? 0) || matches.length;
  const winRate = totalMatches > 0 ? Math.round(((profile.wins ?? 0) / totalMatches) * 100) : 0;
  const gainsFormatted = new Intl.NumberFormat("fr-CI").format(profile.total_earnings ?? 0);

  if (profile.is_private && !isOwnProfile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <div className="rounded-[24px] border border-[#22222F] bg-[#101015] p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#15151E] border border-[#22222F]">
            <Lock className="h-6 w-6 text-zinc-400" />
          </div>
          <h1 className="mt-4 text-[20px] font-black text-white">@{profile.username} • Profil privé</h1>
          <p className="mt-2 text-[13px] text-zinc-500">Ce joueur a mis son profil en privé. Seuls les stats publiques sont visibles.</p>
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-[#15151E] border border-[#22222F] p-4">
              <p className="text-[20px] font-black text-white">{profile.wins ?? 0}</p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Victoires</p>
            </div>
            <div className="rounded-2xl bg-[#15151E] border border-[#22222F] p-4">
              <p className="text-[20px] font-black text-white">{totalMatches}</p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Matchs</p>
            </div>
            <div className="rounded-2xl bg-[#15151E] border border-[#22222F] p-4">
              <p className="text-[20px] font-black text-white">{winRate}%</p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Taux</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-10">
      <Link href="/classement" className="inline-flex items-center gap-2 text-[13px] font-semibold text-zinc-400 hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" /> Retour au classement
      </Link>

      {/* Header profil */}
      <div className="mt-6 rounded-[28px] border border-[#22222F] bg-gradient-to-b from-[#15151E] to-[#101015] p-6 lg:p-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 h-[300px] w-[500px] bg-gradient-to-bl from-[#7C3AED]/20 to-transparent blur-[40px] pointer-events-none" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-5">
            <div className="relative">
              <div className="h-[84px] w-[84px] rounded-[20px] bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] p-[2px]">
                <div className="flex h-full w-full items-center justify-center rounded-[18px] bg-[#0A0A0F] text-[32px] font-black text-white">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.username} className="h-full w-full rounded-[18px] object-cover" />
                  ) : (
                    profile.username[0]?.toUpperCase()
                  )}
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 border-2 border-[#15151E] text-[11px]">🇨🇮</div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[26px] font-black tracking-tight text-white">@{profile.username}</h1>
                {profile.tournaments_won > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-[#7C3AED]/15 border border-[#7C3AED]/30 px-2.5 py-1 text-[11px] font-bold text-[#A855F7]"><Crown className="h-3 w-3" /> Champion</span>}
                {winRate >= 70 && totalMatches >= 10 && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-400"><Flame className="h-3 w-3" /> En feu</span>}
                {isOwnProfile && <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-black">C&apos;est toi</span>}
              </div>

              <p className="max-w-[520px] text-[13px] leading-relaxed text-zinc-400">
                {profile.bio || `Joueur E-TOURNOIS CI depuis ${new Date(profile.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}. Abidjan représente. 🧢`}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#15151E] border border-[#22222F] px-3 py-1.5 text-[11px] text-zinc-400"><Calendar className="h-3 w-3" /> Depuis {new Date(profile.created_at).getFullYear()}</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#15151E] border border-[#22222F] px-3 py-1.5 text-[11px] text-zinc-400"><Users className="h-3 w-3" /> {totalMatches} matchs joués</span>
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Lien copié !"); }} className="inline-flex items-center gap-1.5 rounded-full bg-[#15151E] border border-[#22222F] px-3 py-1.5 text-[11px] font-semibold text-zinc-300 hover:text-white transition-colors">
                  <Share2 className="h-3 w-3" /> Partager
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            {!isOwnProfile ? (
              <>
                <button onClick={() => setShowChallengeModal(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-5 text-[13px] font-bold text-white shadow-[0_0_20px_rgba(124,58,237,0.35)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-all">
                  <Swords className="h-4 w-4" /> Défier {profile.username}
                </button>
                <a href={`https://wa.me/2250748235226?text=Yo%20${profile.username}%20on%20fait%20un%201V1%20?`} target="_blank" className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#15151E] border border-[#22222F] text-zinc-300 hover:text-white transition-colors">
                  <MessageCircle className="h-4 w-4" />
                </a>
              </>
            ) : (
              <Link href="/dashboard" className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-[13px] font-bold text-black hover:bg-zinc-100">Modifier profil</Link>
            )}
          </div>
        </div>

        {/* Stats principales */}
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-6">
          {[
            { label: "Matchs joués", value: totalMatches, icon: Target, accent: "text-zinc-400" },
            { label: "Victoires", value: profile.wins ?? 0, icon: Trophy, accent: "text-emerald-400" },
            { label: "Défaites", value: profile.losses ?? 0, icon: Shield, accent: "text-zinc-500" },
            { label: "Taux victoire", value: `${winRate}%`, icon: TrendingUp, accent: "text-[#7C3AED]" },
            { label: "Tournois gagnés", value: `${profile.tournaments_won ?? 0}/${profile.tournaments_played ?? 0}`, icon: Crown, accent: "text-[#06B6D4]" },
            { label: "Victoires 1V1", value: profile.duels_won ?? 0, icon: Swords, accent: "text-amber-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-[#0F0F14] border border-[#22222F]/80 p-4">
              <div className="flex items-center justify-between">
                <s.icon className={`h-4 w-4 ${s.accent}`} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{s.label}</span>
              </div>
              <p className="mt-3 text-[22px] font-black tracking-tight text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Gains - visible owner ou si pas privé */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-[#7C3AED]/20 to-[#06B6D4]/10 border border-[#7C3AED]/30 p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#A855F7]">Gains totaux Wave</p>
              <p className="mt-1 text-[20px] font-black text-white">{gainsFormatted} FCFA</p>
              <p className="text-[11px] text-zinc-400">Versé via Wave 01 51 42 99 18</p>
            </div>
            <Gift className="h-8 w-8 text-[#7C3AED]/60" />
          </div>
          <div className="lg:col-span-2 rounded-2xl bg-[#0F0F14] border border-[#22222F]/80 p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-[#15151E] border border-[#22222F] flex items-center justify-center"><BarChart3 className="h-5 w-5 text-[#06B6D4]" /></div>
            <div className="flex-1">
              <p className="text-[13px] font-bold text-white">Palmarès en chiffres</p>
              <p className="text-[12px] text-zinc-400">
                {profile.wins} victoires • {profile.tournaments_won} tournois gagnés sur {profile.tournaments_played} joués • {profile.duels_won} défis 1V1 remportés • Joueur {winRate >= 60 ? "dominant" : winRate >= 50 ? "solide" : "prometteur"} à Abidjan
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1.5 overflow-x-auto rounded-full bg-[#101015] border border-[#22222F] p-1.5 w-fit">
        {[
          { id: "apercu", label: "Aperçu" },
          { id: "matchs", label: `Matchs (${matches.length})` },
          { id: "tournois", label: `Tournois (${tournaments.length})` },
          { id: "palmares", label: `Palmarès` },
        ].map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`rounded-full px-4 py-2 text-[12px] font-bold transition-all whitespace-nowrap ${activeTab === t.id ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}>{t.label}</button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1.6fr_0.9fr] gap-6">
        <div className="space-y-6">
          {activeTab === "apercu" && (
            <>
              <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-6">
                <h3 className="flex items-center gap-2 text-[14px] font-black text-white"><Clock className="h-4 w-4 text-[#7C3AED]" /> Historique récent</h3>
                <div className="mt-4 space-y-2">
                  {matches.length === 0 ? (
                    <p className="rounded-xl bg-[#0F0F14] border border-[#22222F]/60 p-4 text-[13px] text-zinc-500">Aucun match récent. Ce joueur n&apos;a pas encore combattu ou les matchs sont privés.</p>
                  ) : matches.slice(0, 6).map((m) => {
                    const isWin = m.winner_id === profile.id;
                    return (
                      <div key={m.id} className="flex items-center justify-between rounded-xl bg-[#0F0F14] border border-[#22222F]/60 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-black ${isWin ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/10 text-zinc-500"}`}>{isWin ? "W" : "L"}</div>
                          <div>
                            <p className="text-[13px] font-semibold text-white">vs @{m.opponent_username}</p>
                            <p className="text-[11px] text-zinc-500">{new Date(m.created_at).toLocaleDateString("fr-FR")} • {m.status}</p>
                          </div>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${isWin ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-800 text-zinc-400"}`}>{isWin ? "Victoire" : "Défaite"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-6">
                <h3 className="flex items-center gap-2 text-[14px] font-black text-white"><Trophy className="h-4 w-4 text-[#06B6D4]" /> Tournois récents</h3>
                <div className="mt-4 space-y-2">
                  {tournaments.length === 0 ? (
                    <p className="rounded-xl bg-[#0F0F14] border border-[#22222F]/60 p-4 text-[13px] text-zinc-500">Pas encore participé à un tournoi. Bientôt dans l&apos;arène ?</p>
                  ) : tournaments.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-center justify-between rounded-xl bg-[#0F0F14] border border-[#22222F]/60 px-4 py-3">
                      <div>
                        <p className="text-[13px] font-semibold text-white">{(t.tournaments as any)?.name ?? "Tournoi E-TOURNOIS CI"}</p>
                        <p className="text-[11px] text-zinc-500">{(t.tournaments as any)?.game ?? "FIFA"} • {(t.tournaments as any)?.status ?? "terminé"}</p>
                      </div>
                      <span className="rounded-full bg-[#15151E] border border-[#22222F] px-2.5 py-1 text-[11px] font-bold text-zinc-300">{t.position ? `#${t.position}` : "Participant"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "matchs" && (
            <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-6">
              <h3 className="text-[16px] font-black text-white">Tous les matchs — @{profile.username}</h3>
              <div className="mt-5 space-y-2">
                {matches.map((m) => {
                  const isWin = m.winner_id === profile.id;
                  return (
                    <div key={m.id} className="flex items-center justify-between rounded-xl bg-[#0F0F14] border border-[#22222F]/60 px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-black text-[12px] ${isWin ? "bg-emerald-500/15 text-emerald-400" : "bg-[#15151E] text-zinc-500"}`}>{isWin ? "V" : "D"}</div>
                        <div>
                          <p className="text-[13px] font-bold text-white">Contre @{m.opponent_username}</p>
                          <p className="text-[11px] text-zinc-500">{new Date(m.created_at).toLocaleString("fr-FR")}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-[13px] font-black ${isWin ? "text-emerald-400" : "text-zinc-400"}`}>{m.score_p1 ?? 0} - {m.score_p2 ?? 0}</p>
                        <p className="text-[11px] text-zinc-500">{isWin ? "Victoire" : "Défaite"}</p>
                      </div>
                    </div>
                  );
                })}
                {matches.length === 0 && <p className="text-[13px] text-zinc-500">Aucun match enregistré.</p>}
              </div>
            </div>
          )}

          {activeTab === "tournois" && (
            <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-6">
              <h3 className="text-[16px] font-black text-white">Tournois joués</h3>
              <p className="mt-1 text-[13px] text-zinc-400">{profile.tournaments_played} tournois • {profile.tournaments_won} remportés</p>
              <div className="mt-5 grid gap-3">
                {tournaments.map((t) => (
                  <div key={t.id} className="rounded-xl bg-[#0F0F14] border border-[#22222F]/60 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#7C3AED]/20 to-[#06B6D4]/20 border border-[#7C3AED]/20 flex items-center justify-center"><Trophy className="h-5 w-5 text-[#7C3AED]" /></div>
                      <div>
                        <p className="text-[14px] font-bold text-white">{(t.tournaments as any)?.name ?? "E-TOURNOIS CI CUP"}</p>
                        <p className="text-[12px] text-zinc-500">{(t.tournaments as any)?.game ?? "FIFA"} • {new Date(t.created_at).toLocaleDateString("fr-FR")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] font-bold text-white">{t.position ? `Fin #${t.position}` : "Participant"}</p>
                      {t.position === 1 && <p className="text-[11px] font-bold text-amber-400">🏆 Champion</p>}
                    </div>
                  </div>
                ))}
                {tournaments.length === 0 && <p className="text-[13px] text-zinc-500">Pas de tournoi pour l&apos;instant.</p>}
              </div>
            </div>
          )}

          {activeTab === "palmares" && (
            <div className="space-y-4">
              <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-6">
                <h3 className="text-[16px] font-black text-white flex items-center gap-2"><Award className="h-5 w-5 text-amber-400" /> Palmarès complet</h3>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-[#0F0F14] border border-[#22222F]/60 p-5 text-center">
                    <p className="text-[28px] font-black text-white">{profile.tournaments_won}</p>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Tournois gagnés</p>
                  </div>
                  <div className="rounded-2xl bg-[#0F0F14] border border-[#22222F]/60 p-5 text-center">
                    <p className="text-[28px] font-black text-[#7C3AED]">{profile.duels_won}</p>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Duels 1V1</p>
                  </div>
                  <div className="rounded-2xl bg-[#0F0F14] border border-[#22222F]/60 p-5 text-center">
                    <p className="text-[28px] font-black text-emerald-400">{profile.wins}</p>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Victoires totales</p>
                  </div>
                  <div className="rounded-2xl bg-[#0F0F14] border border-[#22222F]/60 p-5 text-center">
                    <p className="text-[18px] font-black text-white">{gainsFormatted} F</p>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Gains Wave</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-6">
                <h4 className="text-[13px] font-black uppercase tracking-widest text-zinc-500">Trophées</h4>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {trophies.length === 0 && <p className="text-[13px] text-zinc-500">Aucun trophée encore. Le premier combat forge la légende.</p>}
                  {trophies.map((tr) => (
                    <div key={tr.id} className={`rounded-xl border p-4 flex gap-3 ${tr.rarity === "legendary" ? "bg-amber-500/10 border-amber-500/20" : tr.rarity === "epic" ? "bg-[#7C3AED]/10 border-[#7C3AED]/20" : tr.rarity === "rare" ? "bg-[#06B6D4]/10 border-[#06B6D4]/20" : "bg-[#15151E] border-[#22222F]"}`}>
                      <span className="text-[24px]">{tr.icon}</span>
                      <div>
                        <p className="text-[13px] font-bold text-white">{tr.name}</p>
                        <p className="text-[11px] text-zinc-400">{tr.description}</p>
                        <p className="mt-1 text-[10px] text-zinc-600">{new Date(tr.earned_at).toLocaleDateString("fr-FR")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* sidebar */}
        <div className="space-y-4">
          <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-5">
            <h4 className="text-[12px] font-black uppercase tracking-widest text-zinc-500">Performance</h4>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-zinc-400">Taux victoire</span>
                <span className="text-[13px] font-bold text-white">{winRate}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#15151E] overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4]" style={{ width: `${winRate}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="rounded-xl bg-[#0F0F14] border border-[#22222F]/60 p-3 text-center">
                  <p className="text-[11px] text-zinc-500">V</p>
                  <p className="text-[16px] font-black text-emerald-400">{profile.wins}</p>
                </div>
                <div className="rounded-xl bg-[#0F0F14] border border-[#22222F]/60 p-3 text-center">
                  <p className="text-[11px] text-zinc-500">D</p>
                  <p className="text-[16px] font-black text-zinc-400">{profile.losses}</p>
                </div>
                <div className="rounded-xl bg-[#0F0F14] border border-[#22222F]/60 p-3 text-center">
                  <p className="text-[11px] text-zinc-500">1V1</p>
                  <p className="text-[16px] font-black text-[#7C3AED]">{profile.duels_won}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[20px] border border-[#7C3AED]/30 bg-gradient-to-br from-[#7C3AED]/10 to-[#06B6D4]/10 p-5">
            <h4 className="flex items-center gap-2 text-[13px] font-black text-white"><Gift className="h-4 w-4 text-[#7C3AED]" /> Gains Wave</h4>
            <p className="mt-3 text-[26px] font-black text-white">{gainsFormatted} <span className="text-[14px] font-bold text-zinc-400">FCFA</span></p>
            <p className="mt-1 text-[11px] text-zinc-400">Total cumulé depuis l&apos;inscription. Paiements via Wave au <span className="font-bold text-white">01 51 42 99 18</span></p>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-zinc-500"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Versements sous 24h après validation</div>
          </div>

          <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-5">
            <h4 className="text-[12px] font-black uppercase tracking-widest text-zinc-500">Besoin d&apos;aide ?</h4>
            <p className="mt-2 text-[12px] leading-relaxed text-zinc-400">Contacte l&apos;équipe E-TOURNOIS CI sur WhatsApp, on répond vite. On est à Abidjan, on connaît le game.</p>
            <a href="https://wa.me/2250748235226" target="_blank" className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#15151E] border border-[#22222F] text-[13px] font-bold text-white hover:border-[#7C3AED]/40 transition-colors">
              <MessageCircle className="h-4 w-4" /> WhatsApp 07 48 23 52 26
            </a>
          </div>
        </div>
      </div>

      {/* Modal défi */}
      {showChallengeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-[420px] rounded-[20px] border border-[#22222F] bg-[#101015] p-6 shadow-2xl">
            <h3 className="text-[18px] font-black text-white">Défier @{profile.username}</h3>
            <p className="mt-1 text-[13px] text-zinc-400">Lance un défi 1V1. Mise via Wave, gagnant prend tout (moins frais plateforme).</p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Mise (FCFA)</label>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {["1000","2000","5000"].map((v) => (
                    <button key={v} onClick={() => setChallengeStake(v)} className={`h-11 rounded-xl border text-[13px] font-bold transition-colors ${challengeStake===v ? "bg-white text-black border-white" : "bg-[#15151E] border-[#22222F] text-zinc-400 hover:text-white"}`}>{v} F</button>
                  ))}
                </div>
                <input type="number" min={500} step={500} value={challengeStake} onChange={(e)=>setChallengeStake(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#22222F] bg-[#15151E] px-4 text-[14px] text-white outline-none focus:border-[#7C3AED]/50" />
                <p className="mt-1 text-[11px] text-zinc-500">Mise minimale 500 FCFA • Paiement Wave 01 51 42 99 18</p>
              </div>

              <div className="flex gap-2">
                <button onClick={()=>setShowChallengeModal(false)} className="flex-1 h-11 rounded-xl bg-[#15151E] border border-[#22222F] text-[13px] font-bold text-zinc-300 hover:text-white transition-colors">Annuler</button>
                <button onClick={handleChallenge} disabled={challenging} className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-[13px] font-bold text-white disabled:opacity-50 transition-all">
                  {challenging ? "Envoi..." : `Défier 🔥`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
