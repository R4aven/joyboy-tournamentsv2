"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, Trophy, Swords, CreditCard, Star, User, Save } from "lucide-react";
import { toast } from "sonner";

type Prefs = {
  tournoi: boolean;
  duel_1v1: boolean;
  paiement: boolean;
  palmares: boolean;
  compte: boolean;
};

const ITEMS = [
  { key: "tournoi", label: "Tournois", desc: "Nouveaux tournois, debut, resultats", icon: Trophy },
  { key: "duel_1v1", label: "Duels 1V1", desc: "Defis, resultats, litiges", icon: Swords },
  { key: "paiement", label: "Paiements", desc: "Validation Wave, gains", icon: CreditCard },
  { key: "palmares", label: "Palmares", desc: "Nouveaux trophees, titres", icon: Star },
  { key: "compte", label: "Compte", desc: "Securite, infos", icon: User },
] as const;

export default function NotificationSettingsPage() {
  const supabase = createClient();
  const [prefs, setPrefs] = useState<Prefs>({ tournoi: true, duel_1v1: true, paiement: true, palmares: true, compte: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("notification_preferences").select("*").eq("user_id", user.id).single();
      if (data) setPrefs(data as any);
      setLoading(false);
    };
    load();
  }, []);

  const toggle = (k: keyof Prefs) => setPrefs((p) => ({ ...p, [k]: !p[k] }));

  const save = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecte");
      await supabase.from("notification_preferences").upsert({ user_id: user.id, ...prefs });
      toast.success("Preferences enregistrees");
    } catch (e: any) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen bg-[#08080B] flex items-center justify-center text-zinc-500">Chargement...</div>;

  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        <h1 className="text-3xl font-black flex items-center gap-3"><Bell className="h-7 w-7 text-joy-violet" /> Preferences Notifications</h1>
        <p className="text-sm text-zinc-400">Choisis ce que tu veux recevoir. Tout est en temps reel via Supabase.</p>

        <div className="card-premium rounded-2xl divide-y divide-joy-border">
          {ITEMS.map((item) => (
            <div key={item.key} className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-joy-card border border-joy-border flex items-center justify-center"><item.icon className="h-5 w-5" /></div>
                <div>
                  <p className="font-bold text-sm">{item.label}</p>
                  <p className="text-xs text-zinc-500">{item.desc}</p>
                </div>
              </div>
              <button onClick={() => toggle(item.key as any)} className={`h-7 w-12 rounded-full p-1 transition ${prefs[item.key as keyof Prefs] ? "bg-joy-violet" : "bg-zinc-700"}`}>
                <div className={`h-5 w-5 rounded-full bg-white transition-transform ${prefs[item.key as keyof Prefs] ? "translate-x-5" : ""}`} />
              </button>
            </div>
          ))}
        </div>

        <button onClick={save} disabled={saving} className="w-full rounded-xl bg-gradient-joy py-3 text-sm font-bold flex items-center justify-center gap-2 glow-violet">
          <Save className="h-4 w-4" /> {saving ? "Enregistrement..." : "Enregistrer les preferences"}
        </button>

        <div className="rounded-xl bg-joy-card border border-joy-border p-4 text-xs text-zinc-500">
          Astuce: meme si tu desactives, les notifs paiement restent toujours actives pour ta securite Wave 01 51 42 99 18.
        </div>
      </div>
    </div>
  );
}
