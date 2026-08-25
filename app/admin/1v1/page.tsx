
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Swords, Clock, Trophy } from "lucide-react";
export const dynamic = "force-dynamic";
export default async function Admin1v1Page() {
  const supabase = await createClient();
  const { data: duels } = await supabase.from("duels_1v1").select("*, profiles!duels_1v1_joueur1_id_fkey(pseudo), profiles2:profiles!duels_1v1_joueur2_id_fkey(pseudo)").order("created_at", { ascending: false }).limit(50);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black flex items-center gap-3"><Swords className="h-7 w-7 text-joy-cyan" /> Duels 1V1</h1>
      <div className="card-premium rounded-2xl p-6">
        {(duels ?? []).length === 0 ? (
          <p className="py-16 text-center text-zinc-500">Aucun duel 1V1 pour le moment.</p>
        ) : (
          <div className="grid gap-3">
            {duels!.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between rounded-xl bg-[#0E0E14] border border-joy-border p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-joy flex items-center justify-center"><Trophy className="h-5 w-5" /></div>
                  <div>
                    <p className="font-bold text-sm">{d.profiles?.pseudo} vs {d.profiles2?.pseudo ?? d.profiles?.pseudo}</p>
                    <p className="text-xs text-zinc-400">{d.mise} FCFA • {d.statut}</p>
                  </div>
                </div>
                <Link href="/admin/matches" className="text-xs bg-joy-card border border-joy-border px-3 py-1.5 rounded-lg">Voir matchs</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
