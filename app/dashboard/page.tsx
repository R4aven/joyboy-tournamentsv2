"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Trophy, Swords, Target, Crown, TrendingUp, 
  Gift, Calendar, Flame, Users, BarChart3,
  Clock, ArrowRight, Award, Zap, Shield,
  Wallet, History, Medal, Plus
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRealtime } from "@/hooks/useRealtime";

type DashboardStats = {
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  tournamentsPlayed: number;
  tournamentsWon: number;
  duelsWon: number;
  totalEarnings: number;
};

type MatchItem = {
  id: string;
  opponent: string;
  result: "win" | "loss" | "pending";
  score: string;
  date: string;
  game: string;
};

type TournamentItem = {
  id: string;
  name: string;
  status: "upcoming" | "live" | "finished";
  position?: number;
  participants: number;
  date: string;
};

type ChallengeItem = {
  id: string;
  opponent: string;
  stake: number;
  status: "pending" | "accepted" | "finished";
  result?: "win" | "loss";
  date: string;
};

type PaymentItem = {
  id: string;
  amount: number;
  type: "gain" | "mise" | "tournoi";
  status: "pending" | "paid" | "failed";
  date: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const { notifications } = useRealtime();
  const supabase = createClient();

  const [stats, setStats] = useState<DashboardStats>({
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    tournamentsPlayed: 0,
    tournamentsWon: 0,
    duelsWon: 0,
    totalEarnings: 0,
  });

  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [tournaments, setTournaments] = useState<TournamentItem[]>([]);
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!user || !profile) return;
      setLoading(true);
      try {
        // Stats depuis profile
        const mp = (profile.wins ?? 0) + (profile.losses ?? 0);
        const wr = mp > 0 ? Math.round((profile.wins / mp) * 100) : 0;
        setStats({
          matchesPlayed: mp,
          wins: profile.wins ?? 0,
          losses: profile.losses ?? 0,
          winRate: wr,
          tournamentsPlayed: profile.tournaments_played ?? 0,
          tournamentsWon: profile.tournaments_won ?? 0,
          duelsWon: profile.duels_won ?? 0,
          totalEarnings: profile.total_earnings ?? 0,
        });

        // Matchs réels
        try {
          const { data: mData } = await supabase
            .from("matches")
            .select("id, player1_id, player2_id, winner_id, status, score_p1, score_p2, created_at")
            .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
            .order("created_at", { ascending: false })
            .limit(8);

          if (mData) {
            const mapped: MatchItem[] = await Promise.all(
              mData.map(async (m: any) => {
                const oppId = m.player1_id === user.id ? m.player2_id : m.player1_id;
                let oppName = "Adversaire";
                try {
                  const { data: opp } = await supabase.from("profiles").select("username").eq("id", oppId).maybeSingle();
                  if (opp) oppName = opp.username;
                } catch {}
                const isWin = m.winner_id === user.id;
                return {
                  id: m.id,
                  opponent: oppName,
                  result: !m.winner_id ? "pending" : isWin ? "win" : "loss",
                  score: `${m.score_p1 ?? 0} - ${m.score_p2 ?? 0}`,
                  date: m.created_at,
                  game: "FIFA",
                };
              })
            );
            setMatches(mapped);
          }
        } catch {}

        // Tournois
        try {
          const { data: tData } = await supabase
            .from("tournament_participants")
            .select("id, position, created_at, tournaments(id, name, status)")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(6);

          if (tData) {
            setTournaments(
              tData.map((t: any) => ({
                id: t.id,
                name: t.tournaments?.name ?? "JOYBOY CUP",
                status: t.tournaments?.status ?? "finished",
                position: t.position,
                participants: 32,
                date: t.created_at,
              }))
            );
          }
        } catch {}

        // Défis 1V1
        try {
          const { data: cData } = await supabase
            .from("challenges")
            .select("*")
            .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
            .order("created_at", { ascending: false })
            .limit(6);

          if (cData) {
            const mapped: ChallengeItem[] = await Promise.all(
              cData.map(async (c: any) => {
                const otherId = c.challenger_id === user.id ? c.opponent_id : c.challenger_id;
                let oppName = "Joueur";
                try {
                  const { data: opp } = await supabase.from("profiles").select("username").eq("id", otherId).maybeSingle();
                  if (opp) oppName = opp.username;
                } catch {}
                return {
                  id: c.id,
                  opponent: oppName,
                  stake: c.stake ?? 1000,
                  status: c.status ?? "pending",
                  result: c.winner_id ? (c.winner_id === user.id ? "win" : "loss") : undefined,
                  date: c.created_at,
                };
              })
            );
            setChallenges(mapped);
          }
        } catch {}

        // Paiements / gains
        try {
          const { data: pData } = await supabase
            .from("payments")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(8);

          if (pData) {
            setPayments(
              pData.map((p: any) => ({
                id: p.id,
                amount: p.amount,
                type: p.type ?? "gain",
                status: p.status ?? "paid",
                date: p.created_at,
              }))
            );
          } else {
            // fallback vide mais on garde la structure
            setPayments([]);
          }
        } catch {
          setPayments([]);
        }

      } catch (e) {
        console.error(e);
        toast.error("Erreur chargement dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user, profile, supabase]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#22222F] border-t-[#7C3AED]" />
          <p className="mt-4 text-[13px] text-zinc-500">Chargement de ton arène...</p>
        </div>
      </div>
    );
  }

  const gainFormatted = new Intl.NumberFormat("fr-CI").format(stats.totalEarnings);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#15151E] border border-[#22222F] px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold tracking-widest text-zinc-400">CONNECTÉ • ABIDJAN</span>
          </div>
          <h1 className="mt-4 text-[30px] lg:text-[38px] font-black tracking-tighter leading-none text-white">
            Bonjour <span className="bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] bg-clip-text text-transparent">{profile?.username ?? user?.email?.split("@")[0]}</span> 👋
          </h1>
          <p className="mt-2 text-[14px] text-zinc-400">Prêt à enchaîner les victoires ? Ton arène t&apos;attend, champion. 🇨🇮</p>
        </div>

        <div className="flex gap-2">
          <Link href="/1v1" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#15151E] border border-[#22222F] px-5 text-[13px] font-bold text-white hover:border-[#7C3AED]/40 transition-colors">
            <Swords className="h-4 w-4" /> Nouveau défi
          </Link>
          <Link href="/tournois" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-5 text-[13px] font-bold text-white shadow-[0_0_20px_rgba(124,58,237,0.35)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-all">
            <Trophy className="h-4 w-4" /> Tournoi
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-5 relative overflow-hidden group hover:border-[#7C3AED]/30 transition-colors">
          <div className="absolute top-0 right-0 h-24 w-24 bg-[#7C3AED]/10 blur-[20px] rounded-full" />
          <div className="relative flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-[#15151E] border border-[#22222F] flex items-center justify-center"><Target className="h-5 w-5 text-zinc-400" /></div>
            <span className="rounded-full bg-[#15151E] border border-[#22222F] px-2.5 py-1 text-[10px] font-bold tracking-widest text-zinc-500">MATCHS</span>
          </div>
          <p className="mt-4 text-[28px] font-black tracking-tight text-white">{stats.matchesPlayed}</p>
          <p className="text-[12px] text-zinc-500"><span className="font-bold text-emerald-400">{stats.wins}V</span> • <span className="text-zinc-600">{stats.losses}D</span> • Taux {stats.winRate}%</p>
          <div className="mt-3 h-1.5 w-full rounded-full bg-[#15151E] overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4]" style={{ width: `${stats.winRate}%` }} /></div>
        </div>

        <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-5 relative overflow-hidden group hover:border-[#06B6D4]/30 transition-colors">
          <div className="absolute top-0 right-0 h-24 w-24 bg-[#06B6D4]/10 blur-[20px] rounded-full" />
          <div className="relative flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-[#15151E] border border-[#22222F] flex items-center justify-center"><Trophy className="h-5 w-5 text-amber-400" /></div>
            <span className="rounded-full bg-[#15151E] border border-[#22222F] px-2.5 py-1 text-[10px] font-bold tracking-widest text-zinc-500">TOURNOIS</span>
          </div>
          <p className="mt-4 text-[28px] font-black tracking-tight text-white">{stats.tournamentsPlayed}</p>
          <p className="text-[12px] text-zinc-500"><span className="font-bold text-amber-400">{stats.tournamentsWon} gagnés</span> • {stats.tournamentsPlayed - stats.tournamentsWon} participations</p>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-zinc-500"><Crown className="h-3.5 w-3.5 text-amber-400" /> Objectif prochain podium</div>
        </div>

        <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-5 relative overflow-hidden group hover:border-[#7C3AED]/30 transition-colors">
          <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/10 blur-[20px] rounded-full" />
          <div className="relative flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-[#15151E] border border-[#22222F] flex items-center justify-center"><Swords className="h-5 w-5 text-[#7C3AED]" /></div>
            <span className="rounded-full bg-[#15151E] border border-[#22222F] px-2.5 py-1 text-[10px] font-bold tracking-widest text-zinc-500">DUELS 1V1</span>
          </div>
          <p className="mt-4 text-[28px] font-black tracking-tight text-white">{stats.duelsWon}</p>
          <p className="text-[12px] text-zinc-500">Victoires en 1V1 • Le plus chaud d&apos;Abidjan ?</p>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-zinc-500"><Flame className="h-3.5 w-3.5 text-[#7C3AED]" /> Enchaîne 3 défis pour bonus</div>
        </div>

        <div className="rounded-[20px] border border-[#7C3AED]/30 bg-gradient-to-br from-[#7C3AED]/20 to-[#06B6D4]/10 p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-32 w-32 bg-[#7C3AED]/20 blur-[24px] rounded-full" />
          <div className="relative flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center"><Gift className="h-5 w-5 text-white" /></div>
            <span className="rounded-full bg-white text-black px-2.5 py-1 text-[10px] font-bold tracking-widest">WAVE</span>
          </div>
          <p className="mt-4 text-[24px] font-black tracking-tight text-white">{gainFormatted} <span className="text-[12px] font-bold text-zinc-300">FCFA</span></p>
          <p className="text-[11px] text-zinc-300">Gains totaux • Wave 01 51 42 99 18</p>
          <Link href="#gains" className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-white hover:gap-1.5 transition-all">Détails <ArrowRight className="h-3 w-3" /></Link>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-6">
        {/* Colonne gauche */}
        <div className="space-y-6">
          {/* Mes matchs */}
          <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[15px] font-black text-white"><Target className="h-4 w-4 text-[#7C3AED]" /> Mes matchs</h2>
              <Link href="/matchs" className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white">Voir tout</Link>
            </div>

            <div className="mt-5 space-y-2">
              {matches.length === 0 ? (
                <div className="rounded-xl bg-[#0F0F14] border border-[#22222F]/60 p-6 text-center">
                  <p className="text-[24px]">🎮</p>
                  <p className="mt-2 text-[13px] font-bold text-white">Aucun match encore</p>
                  <p className="mt-1 text-[12px] text-zinc-500">Lance ton premier défi 1V1 ou rejoins un tournoi pour commencer.</p>
                  <Link href="/1v1" className="mt-4 inline-flex h-9 items-center justify-center rounded-xl bg-white px-4 text-[12px] font-bold text-black">Défier un joueur</Link>
                </div>
              ) : matches.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-xl bg-[#0F0F14] border border-[#22222F]/60 px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-[11px] font-black ${m.result === "win" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : m.result === "loss" ? "bg-red-500/10 text-zinc-500 border border-[#22222F]" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>{m.result === "win" ? "V" : m.result === "loss" ? "D" : "•"}</div>
                    <div>
                      <p className="text-[13px] font-semibold text-white">vs @{m.opponent}</p>
                      <p className="text-[11px] text-zinc-500">{new Date(m.date).toLocaleDateString("fr-FR")} • {m.game} • {m.score}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${m.result === "win" ? "bg-emerald-500/15 text-emerald-400" : m.result === "loss" ? "bg-[#1A1A1A] text-zinc-400" : "bg-amber-500/15 text-amber-400"}`}>{m.result === "win" ? "Victoire" : m.result === "loss" ? "Défaite" : "En attente"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mes tournois */}
          <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[15px] font-black text-white"><Trophy className="h-4 w-4 text-amber-400" /> Mes tournois</h2>
              <Link href="/tournois" className="inline-flex h-8 items-center justify-center rounded-full bg-[#15151E] border border-[#22222F] px-3 text-[11px] font-bold text-zinc-300 hover:text-white">Explorer</Link>
            </div>

            <div className="mt-5 grid gap-3">
              {tournaments.length === 0 ? (
                <div className="rounded-xl bg-[#0F0F14] border border-dashed border-[#22222F] p-6 text-center">
                  <Trophy className="mx-auto h-6 w-6 text-zinc-600" />
                  <p className="mt-2 text-[13px] font-bold text-white">Pas encore de tournoi</p>
                  <p className="text-[12px] text-zinc-500">Les tournois JOYBOY arrivent chaque week-end. Inscris-toi tôt !</p>
                </div>
              ) : tournaments.map((t) => (
                <div key={t.id} className="rounded-xl bg-[#0F0F14] border border-[#22222F]/60 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-[#7C3AED]/20 border border-amber-500/20 flex items-center justify-center"><Medal className="h-5 w-5 text-amber-400" /></div>
                    <div>
                      <p className="text-[13px] font-bold text-white">{t.name}</p>
                      <p className="text-[11px] text-zinc-500">{new Date(t.date).toLocaleDateString("fr-FR")} • {t.participants} joueurs • <span className={t.status==="live" ? "text-emerald-400 font-bold" : "text-zinc-500"}>{t.status==="live" ? "En cours" : t.status==="upcoming" ? "À venir" : "Terminé"}</span></p>
                    </div>
                  </div>
                  <div className="text-right">
                    {t.position ? <p className={`text-[12px] font-black ${t.position===1 ? "text-amber-400" : "text-white"}`}>#{t.position}</p> : <p className="text-[11px] text-zinc-500">Inscrit</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mes défis 1V1 */}
          <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[15px] font-black text-white"><Swords className="h-4 w-4 text-[#7C3AED]" /> Mes défis 1V1</h2>
              <Link href="/defis/create" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-black hover:bg-zinc-100"><Plus className="h-4 w-4" /></Link>
            </div>

            <div className="mt-5 space-y-2">
              {challenges.length === 0 ? (
                <div className="rounded-xl bg-[#0F0F14] border border-[#22222F]/60 p-5">
                  <p className="text-[13px] font-bold text-white">Aucun défi actif</p>
                  <p className="mt-1 text-[12px] text-zinc-500">Défie un joueur de ton niveau. Mise minimum 500 FCFA via Wave. Gagnant prend tout.</p>
                  <div className="mt-3 rounded-lg bg-[#7C3AED]/10 border border-[#7C3AED]/20 p-2.5 text-[11px] text-[#A855F7]">💡 Astuce : commence par 1000 FCFA pour tester l&apos;arène sans te ruiner.</div>
                </div>
              ) : challenges.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl bg-[#0F0F14] border border-[#22222F]/60 px-4 py-3.5">
                  <div>
                    <p className="text-[13px] font-bold text-white">vs @{c.opponent} • {c.stake.toLocaleString("fr-FR")} FCFA</p>
                    <p className="text-[11px] text-zinc-500">{new Date(c.date).toLocaleDateString("fr-FR")} • {c.status === "pending" ? "En attente" : c.status === "accepted" ? "Accepté" : c.result === "win" ? "Gagné" : "Perdu"}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${c.status==="pending" ? "bg-amber-500/15 text-amber-400" : c.result==="win" ? "bg-emerald-500/15 text-emerald-400" : c.result==="loss" ? "bg-zinc-800 text-zinc-400" : "bg-[#7C3AED]/15 text-[#A855F7]"}`}>{c.status==="pending" ? "Attend" : c.result==="win" ? "Gagné" : c.result==="loss" ? "Perdu" : c.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Colonne droite */}
        <div className="space-y-6">
          {/* Mon palmarès */}
          <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-6">
            <h3 className="flex items-center gap-2 text-[14px] font-black text-white"><Award className="h-4 w-4 text-amber-400" /> Mon palmarès</h3>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#0F0F14] border border-[#22222F]/60 p-4 text-center">
                <Trophy className="mx-auto h-5 w-5 text-amber-400" />
                <p className="mt-2 text-[20px] font-black text-white">{stats.tournamentsWon}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Tournois gagnés</p>
              </div>
              <div className="rounded-xl bg-[#0F0F14] border border-[#22222F]/60 p-4 text-center">
                <Swords className="mx-auto h-5 w-5 text-[#7C3AED]" />
                <p className="mt-2 text-[20px] font-black text-white">{stats.duelsWon}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Duels 1V1</p>
              </div>
              <div className="rounded-xl bg-[#0F0F14] border border-[#22222F]/60 p-4 text-center">
                <Target className="mx-auto h-5 w-5 text-emerald-400" />
                <p className="mt-2 text-[20px] font-black text-white">{stats.wins}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Victoires</p>
              </div>
              <div className="rounded-xl bg-[#0F0F14] border border-[#22222F]/60 p-4 text-center">
                <TrendingUp className="mx-auto h-5 w-5 text-[#06B6D4]" />
                <p className="mt-2 text-[20px] font-black text-white">{stats.winRate}%</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Taux</p>
              </div>
            </div>
            <Link href={`/profile/${profile?.username ?? ""}`} className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#15151E] border border-[#22222F] text-[12px] font-bold text-zinc-300 hover:text-white transition-colors">
              <BarChart3 className="h-4 w-4" /> Voir mon profil public
            </Link>
          </div>

          {/* Mes gains */}
          <div id="gains" className="rounded-[20px] border border-[#7C3AED]/30 bg-gradient-to-br from-[#7C3AED]/15 to-[#06B6D4]/10 p-6">
            <h3 className="flex items-center gap-2 text-[14px] font-black text-white"><Wallet className="h-4 w-4" /> Mes gains</h3>
            <p className="mt-3 text-[28px] font-black text-white">{gainFormatted} <span className="text-[14px] text-zinc-300">FCFA</span></p>
            <p className="text-[11px] text-zinc-400">Cumulé • Paiements Wave : <span className="font-bold text-white">01 51 42 99 18</span></p>

            <div className="mt-5 space-y-2 max-h-[260px] overflow-auto pr-1">
              {payments.length === 0 ? (
                <div className="rounded-xl bg-black/20 border border-white/10 p-4 text-center">
                  <p className="text-[12px] text-zinc-300">Pas encore de gains. Gagne ton premier match pour débloquer les paiements Wave.</p>
                </div>
              ) : payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl bg-black/20 border border-white/10 px-3 py-2.5">
                  <div>
                    <p className="text-[12px] font-bold text-white">{p.type === "gain" ? "Gain match" : p.type === "tournoi" ? "Gain tournoi" : "Mise"} • {p.amount.toLocaleString("fr-FR")} FCFA</p>
                    <p className="text-[10px] text-zinc-400">{new Date(p.date).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${p.status==="paid" ? "bg-emerald-500/20 text-emerald-300" : p.status==="pending" ? "bg-amber-500/20 text-amber-300" : "bg-red-500/20 text-red-300"}`}>{p.status==="paid" ? "Payé" : p.status==="pending" ? "En attente" : "Échec"}</span>
                </div>
              ))}
            </div>

            <p className="mt-4 rounded-xl bg-black/30 border border-white/10 p-3 text-[11px] leading-relaxed text-zinc-400">
              Tous les gains sont versés via Wave uniquement au <span className="font-bold text-white">01 51 42 99 18</span>. Support WhatsApp <span className="font-bold text-white">07 48 23 52 26</span>. Pas de frais cachés, paiement sous 24h après validation.
            </p>
          </div>

          {/* Paiements / notifications */}
          <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-6">
            <h3 className="flex items-center gap-2 text-[14px] font-black text-white"><History className="h-4 w-4 text-zinc-400" /> Activité récente</h3>
            <div className="mt-4 space-y-2">
              {notifications.length === 0 ? (
                <p className="rounded-xl bg-[#0F0F14] border border-[#22222F]/60 p-4 text-[12px] text-zinc-500">Aucune notification. On te prévient ici quand on te défie ou qu&apos;un tournoi commence.</p>
              ) : notifications.slice(0, 6).map((n) => (
                <div key={n.id} className="rounded-xl bg-[#0F0F14] border border-[#22222F]/60 p-3 flex gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${n.type==="challenge" ? "bg-[#7C3AED]/15 text-[#7C3AED]" : n.type==="tournament" ? "bg-amber-500/15 text-amber-400" : "bg-[#15151E] text-zinc-400"}`}>
                    {n.type==="challenge" ? <Swords className="h-4 w-4" /> : n.type==="tournament" ? <Trophy className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-bold text-white truncate">{n.title}</p>
                    <p className="text-[11px] text-zinc-500 line-clamp-2">{n.message}</p>
                    <p className="mt-1 text-[10px] text-zinc-600">{new Date(n.created_at).toLocaleString("fr-FR")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-5">
            <h4 className="text-[12px] font-black uppercase tracking-widest text-zinc-500">Support JOYBOY</h4>
            <p className="mt-2 text-[12px] leading-relaxed text-zinc-400">Un souci avec un match, un paiement Wave ou un adversaire ? On est là.</p>
            <div className="mt-3 space-y-2 text-[12px]">
              <div className="flex items-center gap-2 rounded-xl bg-[#0F0F14] border border-[#22222F]/60 p-3"><div className="h-8 w-8 rounded-full bg-[#06B6D4]/15 flex items-center justify-center"><Wallet className="h-4 w-4 text-[#06B6D4]" /></div><div><p className="font-bold text-white">Wave</p><p className="text-zinc-400">01 51 42 99 18</p></div></div>
              <div className="flex items-center gap-2 rounded-xl bg-[#0F0F14] border border-[#22222F]/60 p-3"><div className="h-8 w-8 rounded-full bg-[#7C3AED]/15 flex items-center justify-center"><Shield className="h-4 w-4 text-[#7C3AED]" /></div><div><p className="font-bold text-white">WhatsApp</p><p className="text-zinc-400">07 48 23 52 26</p></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
