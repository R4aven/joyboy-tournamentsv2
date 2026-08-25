
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Trophy, Plus, Users, Calendar, Banknote, Edit } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminTournamentsPage() {
  const supabase = await createClient();
  const { data: tournaments } = await supabase.from("tournaments").select("*").order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black flex items-center gap-3"><Trophy className="h-7 w-7 text-amber-400" /> Tournois</h1>
        <Link href="/admin/tournaments/create" className="rounded-xl bg-gradient-joy px-5 py-2.5 text-sm font-bold flex items-center gap-2"><Plus className="h-4 w-4" /> Nouveau tournoi</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(tournaments ?? []).map((t: any) => (
          <div key={t.id} className="card-premium rounded-2xl p-5 hover:border-joy-violet/40 transition">
            <div className="flex items-start justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-joy flex items-center justify-center font-black">{t.jeu?.[0]}</div>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${t.statut === "OUVERT" ? "bg-emerald-500/20 text-emerald-400" : t.statut === "EN_COURS" ? "bg-amber-500/20 text-amber-400" : "bg-zinc-700 text-zinc-300"}`}>{t.statut}</span>
            </div>
            <h3 className="font-bold">{t.nom}</h3>
            <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{t.description ?? "Pas de description"}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1 bg-joy-card border border-joy-border rounded-full px-2.5 py-1"><Users className="h-3 w-3" /> {t.places} places</span>
              <span className="flex items-center gap-1 bg-joy-card border border-joy-border rounded-full px-2.5 py-1"><Calendar className="h-3 w-3" /> {t.date} {t.heure}</span>
              <span className="flex items-center gap-1 bg-joy-card border border-joy-border rounded-full px-2.5 py-1"><Banknote className="h-3 w-3" /> {t.prix_inscription} FCFA</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2 text-center"><p className="text-amber-400 font-bold">{t.gains_champion} FCFA</p><p className="text-zinc-500">Champion</p></div>
              <div className="rounded-lg bg-joy-card border border-joy-border p-2 text-center"><p className="font-bold">{t.gains_finaliste} FCFA</p><p className="text-zinc-500">Finaliste</p></div>
              <div className="rounded-lg bg-joy-card border border-joy-border p-2 text-center"><p className="font-bold">{t.gains_troisieme} FCFA</p><p className="text-zinc-500">3eme</p></div>
            </div>
            <div className="mt-4 flex gap-2">
              <Link href={`/admin/tournaments/${t.id}`} className="flex-1 rounded-xl bg-joy-card border border-joy-border py-2 text-xs font-bold text-center hover:border-joy-violet">Gerer</Link>
              <Link href={`/tournaments/${t.id}`} className="rounded-xl bg-joy-card border border-joy-border p-2"><Edit className="h-4 w-4" /></Link>
            </div>
          </div>
        ))}
        {(!tournaments || tournaments.length === 0) && (
          <div className="col-span-3 py-20 text-center text-zinc-500">Aucun tournoi, cree ton premier.</div>
        )}
      </div>
    </div>
  );
}
