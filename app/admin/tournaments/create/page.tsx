
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
    reglement: "• Respect, pas de triche.\n• Capture d'écran obligatoire après chaque match.\n• Retard de 10 min = forfait.\n• Décision de l'admin finale, c'est gboro même.\n• Wave 01 51 42 99 18 uniquement.",
  });

  const handleChange = (k: string, v: any) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom || !form.date || !form.heure) {
      toast.error("Remplis le nom, la date et l'heure, champion.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tournaments")
        .insert([
          {
            nom: form.nom,
            jeu: form.jeu,
            description: form.description,
            date: form.date,
            heure: form.heure,
            places: Number(form.places),
            prix_inscription: Number(form.prix_inscription),
            gains_champion: Number(form.gains_champion),
            gains_finaliste: Number(form.gains_finaliste),
            gains_troisieme: Number(form.gains_troisieme),
            reglement: form.reglement,
            statut: "OUVERT",
          },
        ])
        .select()
        .single();
      if (error) throw error;

      const { data: profiles } = await supabase.from("profiles").select("id").limit(500);
      if (profiles?.length) {
        const notifs = profiles.map((p) => ({
          user_id: p.id,
          type: "TOURNOI",
          title: `Nouveau tournoi: ${form.nom}`,
          message: `Y'a nouveau tournoi qui vient de drop: ${form.nom} sur ${form.jeu}. ${form.places} places, inscription ${form.prix_inscription} FCFA. Faut s'inscrire vite!`,
          link: `/tournaments/${data.id}`,
        }));
        await supabase.from("notifications").insert(notifs);
      }

      toast.success("Tournoi cree! Les gars vont etre chaud");
      router.push("/admin/tournaments");
    } catch (err: any) {
      toast.error(err.message ?? "Erreur creation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black flex items-center gap-3">
          <span className="rounded-xl bg-gradient-joy p-2"><Trophy className="h-6 w-6 text-white" /></span>
          Creer un tournoi
        </h1>
        <p className="text-zinc-400 mt-2 text-sm">Configure ton tournoi comme un vrai banger ivoirien. Places = 10 par defaut.</p>
      </div>

      <form onSubmit={handleSubmit} className="card-premium rounded-2xl p-6 lg:p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2"><Trophy className="h-3 w-3" /> Nom du tournoi</label>
            <input
              value={form.nom}
              onChange={(e) => handleChange("nom", e.target.value)}
              placeholder="Ex: E-TOURNOIS CI CUP #12 - La Revanche"
              className="mt-2 w-full rounded-xl bg-[#0E0E14] border border-joy-border px-4 py-3 text-sm outline-none focus:border-joy-violet"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2"><Gamepad2 className="h-3 w-3" /> Jeu</label>
            <select
              value={form.jeu}
              onChange={(e) => handleChange("jeu", e.target.value)}
              className="mt-2 w-full rounded-xl bg-[#0E0E14] border border-joy-border px-4 py-3 text-sm outline-none focus:border-joy-violet"
            >
              {JEUX.map((j) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2"><Users className="h-3 w-3" /> Places (max joueurs)</label>
            <input
              type="number"
              min={2}
              max={64}
              value={form.places}
              onChange={(e) => handleChange("places", e.target.value)}
              className="mt-2 w-full rounded-xl bg-[#0E0E14] border border-joy-border px-4 py-3 text-sm outline-none focus:border-joy-violet"
            />
            <p className="text-[11px] text-zinc-500 mt-1">Par defaut 10, format classique E-TOURNOIS CI</p>
          </div>

          <div className="lg:col-span-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="De quoi s'agit-il? Style, ambiance..."
              rows={3}
              className="mt-2 w-full rounded-xl bg-[#0E0E14] border border-joy-border px-4 py-3 text-sm outline-none focus:border-joy-violet resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2"><Calendar className="h-3 w-3" /> Date</label>
            <input type="date" value={form.date} onChange={(e) => handleChange("date", e.target.value)} className="mt-2 w-full rounded-xl bg-[#0E0E14] border border-joy-border px-4 py-3 text-sm outline-none focus:border-joy-violet" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2"><Clock3 className="h-3 w-3" /> Heure (Abidjan)</label>
            <input type="time" value={form.heure} onChange={(e) => handleChange("heure", e.target.value)} className="mt-2 w-full rounded-xl bg-[#0E0E14] border border-joy-border px-4 py-3 text-sm outline-none focus:border-joy-violet" />
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl bg-[#0E0E14] border border-joy-border p-4">
            <h4 className="md:col-span-3 font-bold text-sm flex items-center gap-2"><Banknote className="h-4 w-4 text-emerald-400" /> Finances & Gains</h4>
            <div>
              <label className="text-[11px] uppercase font-bold text-zinc-500">Prix inscription (FCFA)</label>
              <input type="number" min={0} value={form.prix_inscription} onChange={(e) => handleChange("prix_inscription", e.target.value)} className="mt-1 w-full rounded-lg bg-[#15151E] border border-joy-border px-3 py-2.5 text-sm outline-none focus:border-joy-violet" />
            </div>
            <div>
              <label className="text-[11px] uppercase font-bold text-amber-400">Champion</label>
              <input type="number" min={0} value={form.gains_champion} onChange={(e) => handleChange("gains_champion", e.target.value)} className="mt-1 w-full rounded-lg bg-[#15151E] border border-amber-500/30 px-3 py-2.5 text-sm outline-none" />
            </div>
            <div>
              <label className="text-[11px] uppercase font-bold text-zinc-400">Finaliste</label>
              <input type="number" min={0} value={form.gains_finaliste} onChange={(e) => handleChange("gains_finaliste", e.target.value)} className="mt-1 w-full rounded-lg bg-[#15151E] border border-joy-border px-3 py-2.5 text-sm outline-none" />
            </div>
            <div>
              <label className="text-[11px] uppercase font-bold text-orange-300">3eme place</label>
              <input type="number" min={0} value={form.gains_troisieme} onChange={(e) => handleChange("gains_troisieme", e.target.value)} className="mt-1 w-full rounded-lg bg-[#15151E] border border-joy-border px-3 py-2.5 text-sm outline-none" />
            </div>
            <p className="md:col-span-3 text-[11px] text-zinc-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Gains payes via Wave: 01 51 42 99 18 - WhatsApp: 07 48 23 52 26</p>
          </div>

          <div className="lg:col-span-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2"><FileText className="h-3 w-3" /> Reglement</label>
            <textarea
              value={form.reglement}
              onChange={(e) => handleChange("reglement", e.target.value)}
              rows={6}
              className="mt-2 w-full rounded-xl bg-[#0E0E14] border border-joy-border px-4 py-3 text-sm outline-none focus:border-joy-violet font-mono"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button disabled={loading} type="submit" className="rounded-xl bg-gradient-joy px-8 py-3 text-sm font-black text-white glow-violet disabled:opacity-50">
            {loading ? "Creation..." : "Creer le tournoi"}
          </button>
          <button type="button" onClick={() => router.back()} className="rounded-xl bg-joy-card border border-joy-border px-6 py-3 text-sm font-bold">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
