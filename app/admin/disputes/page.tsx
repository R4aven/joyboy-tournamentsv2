
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { AlertTriangle, Trophy, MessageSquare, Clock } from "lucide-react";

type Match = {
  id: string;
  joueur1_id: string;
  joueur2_id: string;
  resultat_j1?: string;
  resultat_j2?: string;
  capture_j1?: string;
  capture_j2?: string;
  statut: string;
  dispute_raison?: string;
  created_at: string;
  profiles_j1?: { pseudo: string };
  profiles_j2?: { pseudo: string };
  tournaments?: { nom: string };
};

export default function DisputesPage() {
  const supabase = createClient();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);

  const fetchDisputes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("matches")
      .select("*, profiles_j1:profiles!matches_joueur1_id_fkey(pseudo), profiles_j2:profiles!matches_joueur2_id_fkey(pseudo), tournaments(nom)")
      .eq("statut", "LITIGE")
      .order("created_at", { ascending: false });
    if (data) setMatches(data as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchDisputes();
    const ch = supabase.channel("disputes-admin").on("postgres_changes", { event: "*", schema: "public", table: "matches" }, fetchDisputes).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const resolve = async (m: Match, winnerId: string | null) => {
    try {
      const finalStatus = winnerId ? "VALIDE" : "ANNULE";
      await supabase.from("matches").update({ vainqueur_id: winnerId, statut: finalStatus, dispute_raison: null }).eq("id", m.id);

      const msgWin = winnerId === m.joueur1_id ? m.profiles_j1?.pseudo : m.profiles_j2?.pseudo;
      await supabase.from("notifications").insert([
        {
          user_id: m.joueur1_id,
          type: "1V1",
          title: winnerId ? (winnerId === m.joueur1_id ? "Litige gagne" : "Litige perdu") : "Match annule",
          message: winnerId ? `Litige resolu: victoire attribuee a ${msgWin}.` : "Match annule apres litige.",
          link: "/duels",
        },
        {
          user_id: m.joueur2_id,
          type: "1V1",
          title: winnerId ? (winnerId === m.joueur2_id ? "Litige gagne" : "Litige perdu") : "Match annule",
          message: winnerId ? `Litige resolu: victoire attribuee a ${msgWin}.` : "Match annule apres litige.",
          link: "/duels",
        },
      ]);

      toast.success("Litige resolu, notifications envoyees");
      fetchDisputes();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black flex items-center gap-3"><AlertTriangle className="h-7 w-7 text-red-400" /> Litiges</h1>
        <p className="text-sm text-zinc-400 mt-1">Quand les deux joueurs ne sont pas d'accord. Compare les captures, decide en tant qu'admin.</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-zinc-500">Chargement litiges...</div>
      ) : matches.length === 0 ? (
        <div className="card-premium rounded-2xl p-12 text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-4">
            <Trophy className="h-8 w-8 text-emerald-400" />
          </div>
          <h3 className="font-bold text-lg">Aucun litige ouvert</h3>
          <p className="text-sm text-zinc-400 mt-1">Tout est propre, les gars respectent.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {matches.map((m) => (
            <div key={m.id} className="card-premium rounded-2xl overflow-hidden border border-red-500/20">
              <div className="bg-red-500/10 px-6 py-3 flex items-center justify-between border-b border-red-500/20">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <span className="font-bold text-sm">Litige #{m.id.slice(0,8)} - {m.tournaments?.nom ?? "Duel 1V1"}</span>
                </div>
                <span className="text-[11px] flex items-center gap-1 text-zinc-400"><Clock className="h-3 w-3" /> {new Date(m.created_at).toLocaleString("fr-CI")}</span>
              </div>

              <div className="p-6 space-y-4">
                {m.dispute_raison && (
                  <div className="rounded-xl bg-[#0E0E14] border border-joy-border p-3 flex gap-2">
                    <MessageSquare className="h-4 w-4 text-zinc-500 mt-0.5" />
                    <p className="text-xs text-zinc-300">Raison litige: {m.dispute_raison}</p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-[#0E0E14] border border-joy-border p-4">
                    <p className="text-xs font-bold uppercase text-zinc-500">{m.profiles_j1?.pseudo ?? "Joueur 1"} dit:</p>
                    <div className="mt-3 rounded-lg bg-joy-card border border-joy-border p-3">
                      <p className="font-mono font-bold text-lg">{m.resultat_j1 ?? "Aucun score declare"}</p>
                    </div>
                    {m.capture_j1 ? (
                      <button onClick={() => setPreview(m.capture_j1!)} className="mt-3 w-full rounded-xl overflow-hidden border border-joy-border hover:border-joy-violet">
                        <img src={m.capture_j1} alt="J1 capture" className="w-full h-48 object-cover" />
                      </button>
                    ) : (
                      <div className="mt-3 rounded-xl border border-dashed border-joy-border p-8 text-center text-xs text-zinc-500">Pas de capture J1</div>
                    )}
                  </div>

                  <div className="rounded-xl bg-[#0E0E14] border border-joy-border p-4">
                    <p className="text-xs font-bold uppercase text-zinc-500">{m.profiles_j2?.pseudo ?? "Joueur 2"} dit:</p>
                    <div className="mt-3 rounded-lg bg-joy-card border border-joy-border p-3">
                      <p className="font-mono font-bold text-lg">{m.resultat_j2 ?? "Aucun score declare"}</p>
                    </div>
                    {m.capture_j2 ? (
                      <button onClick={() => setPreview(m.capture_j2!)} className="mt-3 w-full rounded-xl overflow-hidden border border-joy-border hover:border-joy-violet">
                        <img src={m.capture_j2} alt="J2 capture" className="w-full h-48 object-cover" />
                      </button>
                    ) : (
                      <div className="mt-3 rounded-xl border border-dashed border-joy-border p-8 text-center text-xs text-zinc-500">Pas de capture J2</div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button onClick={() => resolve(m, m.joueur1_id)} className="rounded-xl bg-gradient-joy px-6 py-2.5 text-sm font-bold flex items-center gap-2"><Trophy className="h-4 w-4" /> Victoire {m.profiles_j1?.pseudo}</button>
                  <button onClick={() => resolve(m, m.joueur2_id)} className="rounded-xl bg-joy-cyan text-black px-6 py-2.5 text-sm font-bold flex items-center gap-2"><Trophy className="h-4 w-4" /> Victoire {m.profiles_j2?.pseudo}</button>
                  <button onClick={() => resolve(m, null)} className="rounded-xl bg-joy-card border border-joy-border px-6 py-2.5 text-sm font-bold">Annuler le match</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <img src={preview} alt="preview litige" className="max-w-3xl w-full rounded-2xl border border-joy-border" />
        </div>
      )}
    </div>
  );
}
