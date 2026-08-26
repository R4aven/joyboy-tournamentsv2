"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, Trophy, Swords, CreditCard, Star, User, Save } from "lucide-react";
import { toast } from "sonner";

type Prefs = {
  tournament_notifications: boolean;
  challenge_notifications: boolean;
  match_notifications: boolean;
  payment_notifications: boolean;
  achievement_notifications: boolean;
  admin_notifications: boolean;
};

const ITEMS = [
  { key: "tournament_notifications", label: "Tournois", desc: "Nouveaux tournois, début, résultats", icon: Trophy },
  { key: "challenge_notifications", label: "Duels 1V1", desc: "Défis, résultats, litiges", icon: Swords },
  { key: "payment_notifications", label: "Paiements", desc: "Validation Wave, gains - toujours actif", icon: CreditCard },
  { key: "achievement_notifications", label: "Palmarès", desc: "Nouveaux trophées, titres", icon: Star },
  { key: "admin_notifications", label: "Compte", desc: "Sécurité, infos système", icon: User },
] as const;

export default function NotificationSettingsPage() {
  const supabase = createClient();
  const [prefs, setPrefs] = useState<Prefs>({ 
    tournament_notifications: true, 
    challenge_notifications: true, 
    match_notifications: true,
    payment_notifications: true, 
    achievement_notifications: true, 
    admin_notifications: true 
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        const { data, error } = await supabase
          .from("notification_preferences")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (error) {
          console.error("load prefs error", error.message);
          // si table n'existe pas, on garde défaut true
        }
        if (data) {
          setPrefs({
            tournament_notifications: (data as any).tournament_notifications ?? true,
            challenge_notifications: (data as any).challenge_notifications ?? (data as any).duel_1v1 ?? true,
            match_notifications: (data as any).match_notifications ?? true,
            payment_notifications: (data as any).payment_notifications ?? (data as any).paiement ?? true,
            achievement_notifications: (data as any).achievement_notifications ?? (data as any).palmares ?? true,
            admin_notifications: (data as any).admin_notifications ?? (data as any).compte ?? true,
          });
        }
      } catch (e: any) {
        console.error("load crash", e?.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggle = (k: keyof Prefs) => setPrefs((p) => ({ ...p, [k]: !p[k] }));

  const save = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");
      
      // upsert avec les vraies colonnes
      const { error } = await supabase.from("notification_preferences").upsert({ 
        user_id: user.id,
        tournament_notifications: prefs.tournament_notifications,
        challenge_notifications: prefs.challenge_notifications,
        match_notifications: prefs.match_notifications,
        payment_notifications: prefs.payment_notifications,
        achievement_notifications: prefs.achievement_notifications,
        admin_notifications: prefs.admin_notifications,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });
      
      if (error) throw error;
      toast.success("Préférences enregistrées ✅");
    } catch (e: any) {
      console.error("save error", e);
      toast.error(e.message || "Erreur sauvegarde - vérifie que la table existe");
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen bg-[#08080B] flex items-center justify-center text-zinc-500">Chargement...</div>;

  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        <h1 className="text-3xl font-black flex items-center gap-3"><Bell className="h-7 w-7 text-violet-500" /> Préférences Notifications</h1>
        <p className="text-sm text-zinc-400">Choisis ce que tu veux recevoir. Temps réel via Supabase.</p>

        <div className="rounded-2xl border border-zinc-800 divide-y divide-zinc-800 bg-[#101015]">
          {ITEMS.map((item) => (
            <div key={item.key} className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-[#15151E] border border-zinc-800 flex items-center justify-center"><item.icon className="h-5 w-5" /></div>
                <div>
                  <p className="font-bold text-sm">{item.label}</p>
                  <p className="text-xs text-zinc-500">{item.desc}</p>
                </div>
              </div>
              <button onClick={() => toggle(item.key as any)} className={`h-7 w-12 rounded-full p-1 transition ${prefs[item.key as keyof Prefs] ? "bg-violet-600" : "bg-zinc-700"}`}>
                <div className={`h-5 w-5 rounded-full bg-white transition-transform ${prefs[item.key as keyof Prefs] ? "translate-x-5" : ""}`} />
              </button>
            </div>
          ))}
        </div>

        <button onClick={save} disabled={saving} className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 py-3 text-sm font-bold flex items-center justify-center gap-2">
          <Save className="h-4 w-4" /> {saving ? "Enregistrement..." : "Enregistrer les préférences"}
        </button>

        <div className="rounded-xl bg-[#15151E] border border-zinc-800 p-4 text-xs text-zinc-500">
          Astuce: les notifs paiement restent toujours actives pour ta sécurité Wave <span className="font-bold text-white">01 51 42 99 18</span>.
        </div>
      </div>
    </div>
  );
}
