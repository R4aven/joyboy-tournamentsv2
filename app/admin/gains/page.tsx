
import { createClient } from "@/lib/supabase/server";
import { Banknote, Trophy, Wallet, CheckCircle } from "lucide-react";
export const dynamic = "force-dynamic";
export default async function AdminGainsPage() {
  const supabase = await createClient();
  const { data: gains } = await supabase.from("gains").select("*, profiles(pseudo)").order("created_at", { ascending: false }).limit(100);
  const total = (gains ?? []).reduce((acc: number, g: any) => acc + (g.montant || 0), 0);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black flex items-center gap-3"><Banknote className="h-7 w-7 text-emerald-400" /> Gains distribues</h1>
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm"><span className="text-zinc-400">Total:</span> <span className="font-black text-emerald-400">{total} FCFA</span></div>
      </div>
      <div className="card-premium rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0E0E14] text-[11px] uppercase text-zinc-500"><tr><th className="px-4 py-3 text-left">Joueur</th><th className="px-4 py-3 text-left">Montant</th><th className="px-4 py-3 text-left">Raison</th><th className="px-4 py-3 text-left">Statut</th><th className="px-4 py-3 text-left">Date</th></tr></thead>
            <tbody>
              {(!gains || gains.length===0) ? (
                <tr><td colSpan={5} className="py-20 text-center text-zinc-500">Aucun gain distribue. Wave: 01 51 42 99 18</td></tr>
              ) : (
                gains.map((g: any) => (
                  <tr key={g.id} className="border-t border-joy-border">
                    <td className="px-4 py-3 font-bold">{g.profiles?.pseudo}</td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">{g.montant} FCFA</td>
                    <td className="px-4 py-3 text-xs">{g.raison}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${g.statut==="PAYE" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>{g.statut}</span></td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{new Date(g.created_at).toLocaleDateString("fr-CI")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="rounded-xl bg-joy-card border border-joy-border p-4 text-xs text-zinc-400">
        Paiements via Wave uniquement: 01 51 42 99 18 • WhatsApp support: 07 48 23 52 26 • Tous les gains sont traces et notifies.
      </div>
    </div>
  );
}
