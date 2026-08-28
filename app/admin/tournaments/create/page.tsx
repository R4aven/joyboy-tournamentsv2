"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Trophy, Calendar, Clock3, Users, Banknote, FileText, Gamepad2, AlertCircle } from "lucide-react";

const JEUX = ["eFootball 2025", "EA FC Mobile", "EA FC 25", "PES Mobile", "Call of Duty Mobile", "Free Fire", "Autre"];

export default function CreateTournamentPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    jeu: "eFootball 2025",
    description: "",
    date: "",
    heure: "",
    places: 10,
    prix_inscription: 1000,
    gains_champion: 7000,
    gains_finaliste: 2000,
    gains_troisieme: 1000,
    reglement: "• Respect, pas de triche.\n• Capture obligatoire.\n• Retard 10 min = forfait.\n• Decision admin finale.\n• Wave 01 51 42 99 18",
  });

  const handleChange = (k: string, v: any) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom || !form.date || !form.heure) {
      toast.error("Remplis nom, date et heure");
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const startDate = new Date(`${form.date}T${form.heure}:00`).toISOString();
      
      const payload: any = {
        title: form.nom,
        game: form.jeu,
        description: form.description || form.nom,
        start_date: startDate,
        max_players: Number(form.places),
        entry_fee: Number(form.prix_inscription),
        status: "OUVERT",
        rules: form.reglement,
        format: "ELIMINATION_DIRECTE",
        prize_distribution: {
          "1": Number(form.gains_champion),
          "2": Number(form.gains_finaliste),
          "3": Number(form.gains_troisieme),
        },
        wave_number: "01 51 42 99 18",
        created_by: user?.id || null,
      };

      const { data, error } = await supabase.from("tournaments").insert([payload]).select().single();
      if (error) throw error;

      try {
        const { data: profiles } = await supabase.from("profiles").select("id").limit(500);
        if (profiles?.length) {
          const notifs = profiles.map((p: any) => ({
            user_id: p.id,
            type: "TOURNOI_OUVERT",
            title: `Nouveau tournoi: ${form.nom}`,
            message: `${form.nom} sur ${form.jeu}. ${form.places} places, ${form.prix_inscription} FCFA.`,
            link: `/tournaments/${data.id}`,
            related_id: data.id,
            related_type: "tournament",
          }));
          await supabase.from("notifications").insert(notifs);
        }
      } catch {}

      toast.success("Tournoi créé !");
      router.push("/admin/tournaments");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message ?? "Erreur creation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black flex items-center gap-3"><span className="rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 p-2"><Trophy className="h-6 w-6 text-white" /></span>Créer un tournoi</h1>
        <p className="text-zinc-400 mt-2 text-sm">Crée un tournoi avec une capacité libre de 2 à 128 joueurs.</p>
      </div>
      <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-800 bg-[#101015] p-6 lg:p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-2"><label className="text-xs font-bold uppercase text-zinc-400">Nom du tournoi</label><input value={form.nom} onChange={(e) => handleChange("nom", e.target.value)} placeholder="Ex: JOYBOY CUP #12" className="mt-2 w-full rounded-xl bg-[#0E0E14] border border-zinc-800 px-4 py-3 text-sm" /></div>
          <div><label className="text-xs font-bold uppercase text-zinc-400">Jeu</label><select value={form.jeu} onChange={(e) => handleChange("jeu", e.target.value)} className="mt-2 w-full rounded-xl bg-[#0E0E14] border border-zinc-800 px-4 py-3 text-sm">{JEUX.map((j) => (<option key={j} value={j}>{j}</option>))}</select></div>
          <div><label className="text-xs font-bold uppercase text-zinc-400">Places</label><input type="number" min={2} max={128} value={form.places} onChange={(e) => handleChange("places", e.target.value)} className="mt-2 w-full rounded-xl bg-[#0E0E14] border border-zinc-800 px-4 py-3 text-sm" /></div>
          <div className="lg:col-span-2"><label className="text-xs font-bold uppercase text-zinc-400">Description</label><textarea value={form.description} onChange={(e) => handleChange("description", e.target.value)} rows={3} className="mt-2 w-full rounded-xl bg-[#0E0E14] border border-zinc-800 px-4 py-3 text-sm" /></div>
          <div><label className="text-xs font-bold uppercase text-zinc-400">Date</label><input type="date" value={form.date} onChange={(e) => handleChange("date", e.target.value)} className="mt-2 w-full rounded-xl bg-[#0E0E14] border border-zinc-800 px-4 py-3 text-sm" /></div>
          <div><label className="text-xs font-bold uppercase text-zinc-400">Heure (Abidjan)</label><input type="time" value={form.heure} onChange={(e) => handleChange("heure", e.target.value)} className="mt-2 w-full rounded-xl bg-[#0E0E14] border border-zinc-800 px-4 py-3 text-sm" /></div>
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl bg-[#0E0E14] border border-zinc-800 p-4">
            <h4 className="md:col-span-3 font-bold text-sm">Finances & Gains</h4>
            <div><label className="text-[11px] uppercase text-zinc-500">Inscription</label><input type="number" value={form.prix_inscription} onChange={(e) => handleChange("prix_inscription", e.target.value)} className="mt-1 w-full rounded-lg bg-[#15151E] border border-zinc-800 px-3 py-2.5 text-sm" /></div>
            <div><label className="text-[11px] uppercase text-amber-400">Champion</label><input type="number" value={form.gains_champion} onChange={(e) => handleChange("gains_champion", e.target.value)} className="mt-1 w-full rounded-lg bg-[#15151E] border border-zinc-800 px-3 py-2.5 text-sm" /></div>
            <div><label className="text-[11px] uppercase text-zinc-400">Finaliste</label><input type="number" value={form.gains_finaliste} onChange={(e) => handleChange("gains_finaliste", e.target.value)} className="mt-1 w-full rounded-lg bg-[#15151E] border border-zinc-800 px-3 py-2.5 text-sm" /></div>
            <div><label className="text-[11px] uppercase text-orange-300">3eme</label><input type="number" value={form.gains_troisieme} onChange={(e) => handleChange("gains_troisieme", e.target.value)} className="mt-1 w-full rounded-lg bg-[#15151E] border border-zinc-800 px-3 py-2.5 text-sm" /></div>
          </div>
          <div className="lg:col-span-2"><label className="text-xs font-bold uppercase text-zinc-400">Règlement</label><textarea value={form.reglement} onChange={(e) => handleChange("reglement", e.target.value)} rows={5} className="mt-2 w-full rounded-xl bg-[#0E0E14] border border-zinc-800 px-4 py-3 text-sm font-mono" /></div>
        </div>
        <div className="flex gap-3"><button disabled={loading} type="submit" className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-8 py-3 text-sm font-black text-white disabled:opacity-50">{loading ? "Création..." : "Créer le tournoi"}</button><button type="button" onClick={() => router.back()} className="rounded-xl bg-[#15151E] border border-zinc-800 px-6 py-3 text-sm font-bold">Annuler</button></div>
      </form>
    </div>
  );
}
