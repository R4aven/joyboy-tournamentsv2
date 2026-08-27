
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Trophy, Plus, Users, Calendar, Banknote } from "lucide-react";
export const dynamic = "force-dynamic";
export default async function AdminTournamentsPage() {
  const supabase = await createClient();
  const { data: tournaments } = await supabase.from("tournaments").select("*").order("created_at", { ascending: false });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-3xl font-black flex items-center gap-3"><Trophy className="h-7 w-7 text-amber-400" /> Tournois</h1><Link href="/admin/tournaments/create" className="rounded-xl bg-white text-black px-5 py-2.5 text-sm font-bold flex items-center gap-2"><Plus className="h-4 w-4" /> Nouveau</Link></div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(tournaments ?? []).map((t:any)=>(
          <div key={t.id} className="rounded-2xl border border-zinc-800 bg-[#101015] p-5">
            <h3 className="font-bold">{t.title}</h3><p className="text-xs text-zinc-500">{t.game} • {t.status}</p>
            <div className="mt-3 flex gap-2 text-[11px] text-zinc-400"><span className="bg-[#15151E] border border-zinc-800 rounded-full px-2.5 py-1">{t.max_players} places</span><span className="bg-[#15151E] border border-zinc-800 rounded-full px-2.5 py-1">{t.entry_fee} FCFA</span></div>
            <div className="mt-4 flex gap-2"><Link href={`/admin/tournaments/${t.id}`} className="flex-1 rounded-xl bg-white text-black py-2 text-xs font-bold text-center">Gérer</Link><Link href={`/tournaments/${t.id}`} className="rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2 text-xs">Voir public</Link></div>
          </div>
        ))}
      </div>
    </div>
  );
}
