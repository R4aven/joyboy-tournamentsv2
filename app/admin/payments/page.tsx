"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Check, X, Eye, CreditCard, Clock, Filter, Search } from "lucide-react";

type Payment = {
  id: string;
  user_id: string;
  montant: number;
  type: string;
  ref_transaction: string;
  capture_url: string | null;
  statut: "EN_ATTENTE" | "VALIDE" | "REFUSE";
  created_at: string;
  profiles?: { pseudo: string; avatar_url?: string };
  tournament_id?: string;
  duel_id?: string;
};

export default function AdminPaymentsPage() {
  const supabase = createClient();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState<"ALL" | "EN_ATTENTE" | "VALIDE" | "REFUSE">("EN_ATTENTE");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "TOURNOI" | "1V1">("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    let query = supabase
      .from("payments")
      .select("*, profiles(pseudo, avatar_url)")
      .order("created_at", { ascending: false });
    if (filter !== "ALL") query = query.eq("statut", filter);
    if (typeFilter !== "ALL") query = query.eq("type", typeFilter);
    const { data, error } = await query;
    if (!error && data) setPayments(data as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
    const channel = supabase
      .channel("payments-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => fetchPayments())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter, typeFilter]);

  const handleAction = async (payment: Payment, newStatus: "VALIDE" | "REFUSE") => {
    try {
      const { error } = await supabase.from("payments").update({ statut: newStatus }).eq("id", payment.id);
      if (error) throw error;

      // Notif auto
      await supabase.from("notifications").insert({
        user_id: payment.user_id,
        type: "PAIEMENT",
        title: newStatus === "VALIDE" ? "Paiement valide ✅" : "Paiement refuse ❌",
        message:
          newStatus === "VALIDE"
            ? `Ton paiement de ${payment.montant} FCFA pour ${payment.type} (ref: ${payment.ref_transaction}) a ete valide. Tu es inscrit, bonne chance champion!`
            : `Ton paiement de ${payment.montant} FCFA (ref: ${payment.ref_transaction}) a ete refuse. Verifie la capture ou contacte Wave 01 51 42 99 18 / WhatsApp 07 48 23 52 26.`,
        link: newStatus === "VALIDE" ? "/tournaments" : "/payments",
      });

      if (newStatus === "VALIDE" && payment.tournament_id) {
        // Ajouter joueur au tournoi si besoin
        await supabase.from("tournament_participants").upsert({
          tournament_id: payment.tournament_id,
          user_id: payment.user_id,
          statut: "CONFIRME",
        });
      }

      toast.success(newStatus === "VALIDE" ? "Paiement valide et notif envoyee" : "Paiement refuse");
      fetchPayments();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const filtered = payments.filter((p) => {
    if (!search) return true;
    return (
      p.profiles?.pseudo?.toLowerCase().includes(search.toLowerCase()) ||
      p.ref_transaction?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <span className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-white" />
            </span>
            Paiements
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Wave uniquement: 01 51 42 99 18 • Verifie les captures avant validation.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex gap-2 p-1 rounded-xl bg-joy-card border border-joy-border">
          {(["ALL", "EN_ATTENTE", "VALIDE", "REFUSE"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${filter === f ? "bg-joy-violet text-white" : "text-zinc-400 hover:text-white"}`}
            >
              {f === "ALL" ? "Tous" : f.replace("_", " ")}
            </button>
          ))}
        </div>
        <div className="flex gap-2 p-1 rounded-xl bg-joy-card border border-joy-border">
          {(["ALL", "TOURNOI", "1V1"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setTypeFilter(f as any)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${typeFilter === f ? "bg-joy-cyan text-black" : "text-zinc-400 hover:text-white"}`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pseudo ou ref..."
            className="pl-9 pr-4 py-2 rounded-xl bg-joy-card border border-joy-border text-sm outline-none focus:border-joy-violet w-64"
          />
        </div>
      </div>

      <div className="card-premium rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0E0E14] text-[11px] uppercase tracking-widest text-zinc-500">
              <tr>
                <th className="px-4 py-3 text-left">Joueur</th>
                <th className="px-4 py-3 text-left">Montant</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Ref Wave</th>
                <th className="px-4 py-3 text-left">Capture</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-zinc-500">Chargement...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-zinc-500">Aucun paiement {filter !== "ALL" ? `en ${filter.toLowerCase()}` : ""}</td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-t border-joy-border hover:bg-joy-card/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-joy flex items-center justify-center text-xs font-black">
                          {p.profiles?.pseudo?.[0]?.toUpperCase() ?? "J"}
                        </div>
                        <span className="font-bold">{p.profiles?.pseudo ?? "Inconnu"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold">{p.montant} FCFA</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${p.type === "TOURNOI" ? "bg-violet-500/20 text-violet-300" : "bg-cyan-500/20 text-cyan-300"}`}>
                        {p.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{p.ref_transaction}</td>
                    <td className="px-4 py-3">
                      {p.capture_url ? (
                        <button onClick={() => setPreview(p.capture_url)} className="h-10 w-16 rounded-lg overflow-hidden border border-joy-border hover:border-joy-violet transition">
                          <img src={p.capture_url} alt="capture" className="h-full w-full object-cover" />
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-500">Pas de capture</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{new Date(p.created_at).toLocaleString("fr-CI")}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          p.statut === "VALIDE"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : p.statut === "REFUSE"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {p.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {p.statut === "EN_ATTENTE" && (
                          <>
                            <button
                              onClick={() => handleAction(p, "VALIDE")}
                              className="h-8 w-8 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white flex items-center justify-center transition"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleAction(p, "REFUSE")}
                              className="h-8 w-8 rounded-lg bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white flex items-center justify-center transition"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="max-w-lg w-full rounded-2xl overflow-hidden bg-joy-card border border-joy-border p-2">
            <img src={preview} alt="capture paiement" className="w-full rounded-xl" />
            <button onClick={() => setPreview(null)} className="mt-3 w-full rounded-xl bg-joy-violet py-2.5 text-sm font-bold">Fermer</button>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-300 flex gap-2">
        <Clock className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          Verifie bien la reference Wave et que le montant correspond. Si doute, demande confirmation sur WhatsApp 07 48 23 52 26. Une fois valide, une notification auto part au joueur.
        </p>
      </div>
    </div>
  );
}
