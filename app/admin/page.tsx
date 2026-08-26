import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Users,
  Trophy,
  CreditCard,
  AlertTriangle,
  Gamepad2,
  Banknote,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Flame,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: totalUsers },
    { count: activeTournaments },
    { count: totalTournaments },
    { count: pendingPayments },
    { count: openDisputes },
    { count: pendingMatches },
    { data: tournaments },
    { data: payments },
    { data: disputes },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("tournaments").select("*", { count: "exact", head: true }).eq("statut", "EN_COURS"),
    supabase.from("tournaments").select("*", { count: "exact", head: true }),
    supabase.from("payments").select("*", { count: "exact", head: true }).eq("statut", "EN_ATTENTE"),
    supabase.from("matches").select("*", { count: "exact", head: true }).eq("statut", "LITIGE"),
    supabase.from("matches").select("*", { count: "exact", head: true }).eq("statut", "EN_ATTENTE"),
    supabase.from("tournaments").select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("payments").select("*, profiles(pseudo)").eq("statut", "EN_ATTENTE").order("created_at", { ascending: false }).limit(5),
    supabase.from("matches").select("*, tournaments(nom)").eq("statut", "LITIGE").order("created_at", { ascending: false }).limit(5),
  ]);

  const stats = [
    {
      label: "Joueurs inscrits",
      value: totalUsers ?? 0,
      icon: Users,
      gradient: "from-violet-600 to-indigo-600",
      change: "+12% cette semaine",
    },
    {
      label: "Tournois actifs",
      value: activeTournaments ?? 0,
      sub: `/ ${totalTournaments ?? 0} total`,
      icon: Trophy,
      gradient: "from-amber-500 to-orange-600",
      change: "2 démarrent aujourd'hui",
    },
    {
      label: "Paiements en attente",
      value: pendingPayments ?? 0,
      icon: CreditCard,
      gradient: "from-emerald-500 to-teal-600",
      change: "Action requise",
      alert: (pendingPayments ?? 0) > 0,
    },
    {
      label: "Litiges ouverts",
      value: openDisputes ?? 0,
      icon: AlertTriangle,
      gradient: "from-red-500 to-rose-600",
      change: openDisputes ? "À traiter d'urgence" : "Aucun litige",
      alert: (openDisputes ?? 0) > 0,
    },
    {
      label: "Matchs en attente",
      value: pendingMatches ?? 0,
      icon: Gamepad2,
      gradient: "from-cyan-500 to-blue-600",
      change: "Validation résultats",
    },
    {
      label: "Gains distribués",
      value: "0",
      icon: Banknote,
      gradient: "from-joy-violet to-joy-cyan",
      change: "Ce mois",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <span className="text-gradient">Dashboard</span>
            <Flame className="h-7 w-7 text-orange-500" />
          </h1>
          <p className="text-zinc-400 mt-1">
            Bienvenue boss 🇨🇮 — tout se passe ici. Ablé est prêt, on gère.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/tournaments/create"
            className="rounded-xl bg-gradient-joy px-5 py-2.5 text-sm font-bold text-white glow-violet hover:opacity-90 transition"
          >
            + Nouveau tournoi
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="card-premium rounded-2xl p-5 relative overflow-hidden group hover:border-joy-violet/30 transition">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${s.gradient} opacity-10 blur-2xl group-hover:opacity-20 transition`} />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold">{s.label}</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="text-4xl font-black text-white">{s.value}</p>
                  {s.sub && <span className="text-zinc-500 text-sm">{s.sub}</span>}
                </div>
                <p className={`mt-3 text-xs flex items-center gap-1 ${s.alert ? "text-amber-400" : "text-zinc-400"}`}>
                  {s.alert ? <Clock className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                  {s.change}
                </p>
              </div>
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg`}>
                <s.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card-premium rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" /> Tournois récents
            </h3>
            <Link href="/admin/tournaments" className="text-xs text-joy-violet hover:text-white">Voir tout →</Link>
          </div>
          <div className="space-y-3">
            {(tournaments ?? []).length === 0 ? (
              <div className="py-10 text-center text-zinc-500 text-sm">Aucun tournoi pour le moment. Crée ton premier banger 🎮</div>
            ) : (
              tournaments!.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between rounded-xl bg-[#0E0E14] border border-joy-border p-4 hover:border-joy-violet/30 transition">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-joy flex items-center justify-center font-black text-xs">
                      {t.jeu?.[0] ?? "T"}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{t.nom}</p>
                      <p className="text-xs text-zinc-400">{t.jeu} • {t.places ?? 10} places • {t.statut}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${t.statut === "EN_COURS" ? "bg-emerald-500/20 text-emerald-400" : t.statut === "TERMINE" ? "bg-zinc-700 text-zinc-300" : "bg-amber-500/20 text-amber-400"}`}>
                    {t.statut}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-premium rounded-2xl p-6">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-emerald-400" /> Paiements en attente
            </h3>
            <div className="space-y-3">
              {(payments ?? []).length === 0 ? (
                <p className="text-xs text-zinc-500 py-6 text-center">Aucun paiement en attente ✅</p>
              ) : (
                payments!.map((p: any) => (
                  <div key={p.id} className="rounded-xl bg-[#0E0E14] border border-joy-border p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">{p.profiles?.pseudo ?? "Joueur"}</p>
                      <p className="text-[11px] text-zinc-400">{p.type} • {p.montant} FCFA • {p.ref_transaction}</p>
                    </div>
                    <Link href="/admin/payments" className="text-[11px] bg-joy-violet px-3 py-1.5 rounded-lg font-bold">Traiter</Link>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card-premium rounded-2xl p-6 border border-red-900/30">
            <h3 className="font-bold flex items-center gap-2 mb-4 text-red-400">
              <AlertTriangle className="h-5 w-5" /> Litiges urgents
            </h3>
            <div className="space-y-3">
              {(disputes ?? []).length === 0 ? (
                <p className="text-xs text-zinc-500 py-4 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Aucun litige, tout est calme.</p>
              ) : (
                disputes!.map((d: any) => (
                  <div key={d.id} className="rounded-xl bg-red-500/5 border border-red-500/20 p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">Match #{d.id.slice(0,8)}</p>
                      <p className="text-[11px] text-zinc-400">{d.tournaments?.nom ?? "Tournoi"}</p>
                    </div>
                    <Link href="/admin/disputes" className="text-[11px] bg-red-500 px-3 py-1.5 rounded-lg font-bold text-white">Décider</Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-joy-card border border-joy-border p-4 flex flex-wrap gap-4 text-xs text-zinc-400">
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Supabase temps réel actif</span>
        <span>Wave: 01 51 42 99 18</span>
        <span>WhatsApp: 07 48 23 52 26</span>
        <span className="text-zinc-500">E-TOURNOIS CI • Abidjan 🇨🇮</span>
      </div>
    </div>
  );
}
