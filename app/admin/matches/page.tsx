
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Gamepad2, Trophy, AlertTriangle } from "lucide-react";

type Match = {
  id: string;
  tournament_id?: string;
  duel_id?: string;
  joueur1_id: string;
  joueur2_id: string;
  resultat_j1?: string;
  resultat_j2?: string;
  capture_j1?: string;
  capture_j2?: string;
  statut: string;
  vainqueur_id?: string;
  created_at: string;
  profiles_j1?: { pseudo: string };
  profiles_j2?: { pseudo: string };
  tournaments?: { nom: string };
};

export default function AdminMatchesPage() {
  const supabase = createClient();
  const [matches, setMatches] = useState<Match[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);

  const fetchMatches = async () => {
    setLoading(true);
    let query = supabase
      .from("matches")
      .select("*, profiles_j1:profiles!matches_joueur1_id_fkey(pseudo), profiles_j2:profiles!matches_joueur2_id_fkey(pseudo), tournaments(nom)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (filter !== "ALL") query = query.eq("statut", filter);
    const { data } = await query;
    if (data) setMatches(data as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchMatches();
    const ch = supabase.channel("matches-admin").on("postgres_changes", { event: "*", schema: "public", table: "matches" }, fetchMatches).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [filter]);

  const decideWinner = async (match: Match, winnerId: string | null, status: string) => {
    try {
      const { error } = await supabase
        .from("matches")
        .update({ vainqueur_id: winnerId, statut: status })
        .eq("id", match.id);
      if (error) throw error;

      const loserId = winnerId === match.joueur1_id ? match.joueur2_id : match.joueur1_id;
      if (winnerId && status === "VALIDE") {
        await supabase.from("notifications").insert([
          {
            user_id: winnerId,
            type: "1V1",
            title: "Victoire validee",
            message: `Ta victoire contre ${match.joueur1_id === winnerId ? match.profiles_j2?.pseudo : match.profiles_j1?.pseudo} a ete validee par l'admin.`,
            link: "/duels",
          },
          {
            user_id: loserId,
            type: "1V1",
            title: "Match termine",
            message: `Le match contre ${match.profiles_j1?.pseudo} est termine. Resultat enregistre.`,
            link: "/duels",
          },
        ]);
      }

      toast.success(status === "LITIGE" ? "Match marque en litige" : "Gagnant decide");
      fetchMatches();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black flex items-center gap-3"><Gamepad2 className="h-7 w-7 text-joy-cyan" /> Gestion Matchs</h1>
        <p className="text-sm text-zinc-400 mt-1">Valide les resultats, vois les 2 captures cote a cote, decide vite.</p>
      </div>

      <div className="flex gap-2 p-1 rounded-xl bg-joy-card border border-joy-border w-fit">
        {(["ALL", "EN_ATTENTE", "VALIDE", "LITIGE"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${filter === f ? "bg-joy-violet text-white" : "text-zinc-400"}`}>{f}</button>
        ))}
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-20 text-zinc-500">Chargement...</div>
        ) : matches.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">Aucun match {filter}</div>
        ) : (
          matches.map((m) => (
            <div key={m.id} className="card-premium rounded-2xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-joy flex items-center justify-center font-black">{m.tournaments?.nom?.[0] ?? "M"}</div>
                  <div>
                    <p className="font-bold text-sm">{m.tournaments?.nom ?? (m.tournament_id ? `Tournoi ${m.tournament_id.slice(0,6)}` : "Duel 1V1")}</p>
                    <p className="text-xs text-zinc-400">#{m.id.slice(0,8)} - {new Date(m.created_at).toLocaleDateString("fr-CI")}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${m.statut === "VALIDE" ? "bg-emerald-500/20 text-emerald-400" : m.statut === "LITIGE" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>{m.statut}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl bg-[#0E0E14] border border-joy-border p-4">
                  <p className="text-xs text-zinc-500 uppercase font-bold">Joueur 1: {m.profiles_j1?.pseudo ?? "J1"}</p>
                  <p className="mt-2 font-bold text-lg">{m.resultat_j1 ?? "Pas encore"}</p>
                  {m.capture_j1 ? (
                    <button onClick={() => setPreview(m.capture_j1!)} className="mt-3 block w-full rounded-lg overflow-hidden border border-joy-border">
                      <img src={m.capture_j1} alt="capture j1" className="w-full h-32 object-cover" />
                    </button>
                  ) : <p className="text-xs text-zinc-500 mt-2">Pas de capture</p>}
                  <button onClick={() => decideWinner(m, m.joueur1_id, "VALIDE")} className="mt-3 w-full rounded-xl bg-joy-violet py-2 text-xs font-bold flex items-center justify-center gap-2"><Trophy className="h-4 w-4" /> Donner victoire J1</button>
                </div>

                <div className="rounded-xl bg-[#0E0E14] border border-joy-border p-4">
                  <p className="text-xs text-zinc-500 uppercase font-bold">Joueur 2: {m.profiles_j2?.pseudo ?? "J2"}</p>
                  <p className="mt-2 font-bold text-lg">{m.resultat_j2 ?? "Pas encore"}</p>
                  {m.capture_j2 ? (
                    <button onClick={() => setPreview(m.capture_j2!)} className="mt-3 block w-full rounded-lg overflow-hidden border border-joy-border">
                      <img src={m.capture_j2} alt="capture j2" className="w-full h-32 object-cover" />
                    </button>
                  ) : <p className="text-xs text-zinc-500 mt-2">Pas de capture</p>}
                  <button onClick={() => decideWinner(m, m.joueur2_id, "VALIDE")} className="mt-3 w-full rounded-xl bg-joy-cyan text-black py-2 text-xs font-bold flex items-center justify-center gap-2"><Trophy className="h-4 w-4" /> Donner victoire J2</button>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button onClick={() => decideWinner(m, null, "LITIGE")} className="rounded-xl bg-red-500/20 border border-red-500/30 px-4 py-2 text-xs font-bold text-red-400 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Marquer Litige</button>
                <button onClick={() => decideWinner(m, null, "EN_ATTENTE")} className="rounded-xl bg-joy-card border border-joy-border px-4 py-2 text-xs font-bold">Reset</button>
              </div>
            </div>
          ))
        )}
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <img src={preview} alt="preview" className="max-w-2xl w-full rounded-2xl border border-joy-border" />
        </div>
      )}
    </div>
  );
}
