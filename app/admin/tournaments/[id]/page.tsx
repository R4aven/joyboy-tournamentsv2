
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Trophy, Users, Trash2, ArrowLeft, Check, Image as ImageIcon, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function AdminTournamentManagePage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const supabase = createClient();
  const [t, setT] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("tournaments").select("*").eq("id", id).single();
      if (data) { setT(data); setStatus(data.status); }
      const { data: pls } = await supabase.from("tournament_players").select("*, profiles:player_id(id, username, display_name, avatar_url)").eq("tournament_id", id).order("created_at", {ascending:false});
      if (pls) setPlayers(pls);
      setLoading(false);
    };
    if (id) load();
  }, [id]);

  const updateStatus = async () => {
    const { error } = await supabase.from("tournaments").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Statut mis à jour");
  };

  const deleteTournament = async () => {
    if (!confirm("Supprimer ce tournoi ?")) return;
    const { error } = await supabase.from("tournaments").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Supprimé"); router.push("/admin/tournaments"); }
  };

  const validatePayment = async (tpId: string) => {
    const { error } = await supabase.from("tournament_players").update({ is_paid: true, status: "INSCRIT" }).eq("id", tpId);
    if (error) toast.error(error.message); else { toast.success("Paiement validé ✅"); setPlayers(players.map(p=> p.id===tpId ? {...p, is_paid:true, status:"INSCRIT"} : p)); }
  };

  if (loading) return <div className="p-8 text-zinc-500">Chargement...</div>;
  if (!t) return <div className="p-8">Tournoi introuvable - <Link href="/admin/tournaments" className="underline">Retour</Link></div>;

  return (
    <div className="max-w-5xl space-y-6">
      <Link href="/admin/tournaments" className="flex items-center gap-2 text-sm text-zinc-500"><ArrowLeft className="h-4 w-4" /> Retour tournois</Link>
      <div className="flex justify-between">
        <h1 className="text-2xl font-black flex items-center gap-3"><Trophy className="h-6 w-6 text-amber-400" /> Gérer: {t.title}</h1>
        <button onClick={deleteTournament} className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2 text-xs text-red-400 flex items-center gap-2"><Trash2 className="h-4 w-4" /> Supprimer</button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-800 bg-[#101015] p-5"><p className="text-xs text-zinc-500">Jeu</p><p className="font-bold">{t.game}</p></div>
        <div className="rounded-2xl border border-zinc-800 bg-[#101015] p-5"><p className="text-xs text-zinc-500">Places</p><p className="font-bold">{players.length} / {t.max_players}</p></div>
        <div className="rounded-2xl border border-zinc-800 bg-[#101015] p-5">
          <p className="text-xs text-zinc-500">Statut</p>
          <div className="mt-2 flex gap-2">
            <select value={status} onChange={e=>setStatus(e.target.value)} className="rounded-xl bg-[#15151E] border border-zinc-800 px-3 py-2 text-sm">
              <option>OUVERT</option><option>COMPLET</option><option>EN_COURS</option><option>TERMINE</option><option>ANNULE</option>
            </select>
            <button onClick={updateStatus} className="rounded-xl bg-white text-black px-4 py-2 text-xs font-bold">Sauver</button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-[#101015] p-5">
        <h2 className="font-bold flex items-center gap-2"><Users className="h-5 w-5" /> Joueurs inscrits ({players.length}) - avec preuve Wave</h2>
        {players.length===0 ? <p className="mt-4 text-sm text-zinc-500">Aucun inscrit pour le moment</p> : (
          <div className="mt-4 space-y-3">
            {players.map((tp:any)=>(
              <div key={tp.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl bg-[#15151E] border border-zinc-800 p-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center font-bold text-xs">{(tp.profiles?.display_name||tp.profiles?.username||"?")[0]}</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">@{tp.profiles?.username}</p>
                    <p className="text-xs text-zinc-500">{tp.profiles?.display_name} • {tp.is_paid ? "✅ Payé validé" : "⏳ En attente paiement"} • {tp.status}</p>
                    {tp.payment_proof_url && <a href={tp.payment_proof_url} target="_blank" className="mt-1 inline-flex items-center gap-1 text-xs text-cyan-400 underline"><ImageIcon className="h-3 w-3" /> Voir capture Wave <ExternalLink className="h-3 w-3" /></a>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {tp.payment_proof_url && <img src={tp.payment_proof_url} alt="proof" className="h-20 w-20 rounded-xl object-cover border border-zinc-800 cursor-pointer" onClick={()=>window.open(tp.payment_proof_url, "_blank")} />}
                  <div className="flex flex-col gap-2">
                    {!tp.is_paid && <button onClick={()=>validatePayment(tp.id)} className="rounded-xl bg-emerald-500 text-black px-4 py-2 text-xs font-black flex items-center gap-1"><Check className="h-3 w-3" /> Valider paiement</button>}
                    <Link href={`/profile/${tp.profiles?.username}`} className="rounded-xl bg-[#101015] border border-zinc-800 px-4 py-1.5 text-xs text-center">Voir profil</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
