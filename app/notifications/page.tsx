"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, Trophy, Swords, CreditCard, Star, User, CheckCheck, Trash2, Settings } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type Notif = {
  id: string;
  type: "TOURNOI" | "1V1" | "PAIEMENT" | "PALMARES" | "COMPTE" | string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
};

const TYPE_META: Record<string, { label: string; icon: any; color: string }> = {
  TOURNOI: { label: "Tournois", icon: Trophy, color: "text-amber-400 bg-amber-500/20" },
  "1V1": { label: "1V1", icon: Swords, color: "text-cyan-400 bg-cyan-500/20" },
  PAIEMENT: { label: "Paiements", icon: CreditCard, color: "text-emerald-400 bg-emerald-500/20" },
  PALMARES: { label: "Palmares", icon: Star, color: "text-violet-400 bg-violet-500/20" },
  COMPTE: { label: "Compte", icon: User, color: "text-zinc-400 bg-zinc-500/20" },
};

export default function NotificationsPage() {
  const supabase = createClient();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    let query = supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
    if (filter !== "ALL") query = query.eq("type", filter);
    const { data } = await query;
    if (data) setNotifs(data as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifs();
    const channel = supabase
      .channel("notifications-center")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        // @ts-ignore
        const n = payload.new as Notif;
        setNotifs((prev) => [n, ...prev]);
        toast.info(n.title);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line
  }, [filter]);

  const unread = notifs.filter((n) => !n.is_read).length;

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast.success("Tout marque comme lu");
  };

  const deleteNotif = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black flex items-center gap-3">
            <span className="relative">
              <Bell className="h-8 w-8" />
              {unread > 0 && <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{unread}</span>}
            </span>
            Notifications
          </h1>
          <div className="flex gap-2">
            <button onClick={markAllRead} className="rounded-xl bg-joy-card border border-joy-border px-4 py-2 text-xs font-bold flex items-center gap-2"><CheckCheck className="h-4 w-4" /> Tout lire</button>
            <Link href="/settings/notifications" className="rounded-xl bg-joy-card border border-joy-border p-2"><Settings className="h-4 w-4" /></Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 p-1 rounded-xl bg-joy-card border border-joy-border w-fit">
          <button onClick={() => setFilter("ALL")} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${filter === "ALL" ? "bg-joy-violet text-white" : "text-zinc-400"}`}>Toutes {unread > 0 && `(${unread} non lues)`}</button>
          {["TOURNOI", "1V1", "PAIEMENT", "PALMARES", "COMPTE"].map((t) => (
            <button key={t} onClick={() => setFilter(t)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${filter === t ? "bg-joy-violet text-white" : "text-zinc-400"}`}>{t}</button>
          ))}
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="py-20 text-center text-zinc-500">Chargement...</div>
          ) : notifs.length === 0 ? (
            <div className="card-premium rounded-2xl p-12 text-center">
              <Bell className="h-10 w-10 mx-auto text-zinc-600 mb-3" />
              <h3 className="font-bold">Aucune notification</h3>
              <p className="text-sm text-zinc-500 mt-1">Tu es a jour. Quand y'aura du nouveau, ca va drop ici.</p>
            </div>
          ) : (
            notifs.map((n) => {
              const meta = TYPE_META[n.type] ?? TYPE_META["COMPTE"];
              return (
                <div key={n.id} className={`card-premium rounded-2xl p-4 flex gap-4 ${!n.is_read ? "border-joy-violet/40" : ""}`}>
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${meta.color}`}>
                    <meta.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm">{n.title}</h4>
                      <span className="text-[10px] text-zinc-500 whitespace-nowrap">{new Date(n.created_at).toLocaleString("fr-CI", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{n.message}</p>
                    <div className="mt-3 flex gap-2">
                      {!n.is_read && <button onClick={() => markRead(n.id)} className="text-xs bg-joy-violet text-white px-3 py-1 rounded-full font-bold">Marquer lu</button>}
                      {n.link && <Link href={n.link} className="text-xs bg-joy-card border border-joy-border px-3 py-1 rounded-full font-bold">Voir</Link>}
                      <button onClick={() => deleteNotif(n.id)} className="text-xs text-zinc-500 hover:text-red-400 px-2 py-1 flex items-center gap-1"><Trash2 className="h-3 w-3" /> Supprimer</button>
                    </div>
                  </div>
                  {!n.is_read && <div className="h-2 w-2 rounded-full bg-joy-violet mt-2 animate-pulse shrink-0" />}
                </div>
              );
            })
          )}
        </div>

        <div className="rounded-xl bg-joy-card border border-joy-border p-4 text-xs text-zinc-500">
          Temps reel actif via Supabase Realtime. Wave: 01 51 42 99 18 • WhatsApp: 07 48 23 52 26
        </div>
      </div>
    </div>
  );
}
