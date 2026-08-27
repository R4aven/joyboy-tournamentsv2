
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  const supabase = createClient();
  const { user } = useAuth() as any;
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) { setLoading(false); return; }
      const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", {ascending: false}).limit(50);
      if (data) setNotifs(data);
      setLoading(false);
    };
    if (user) load();
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id);
    setNotifs(notifs.map(n=>({...n, is_read:true})));
  };

  if (loading) return <div className="min-h-screen bg-[#08080B] text-white p-10">Chargement...</div>;

  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black flex items-center gap-2"><Bell className="h-6 w-6" /> Notifications</h1>
          <button onClick={markAllRead} className="rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2 text-xs font-bold">Tout marquer lu</button>
        </div>
        {notifs.length===0 ? <p className="mt-8 text-zinc-500">Aucune notification - elles ne resteront plus grises, elles se marquent lues correctement</p> : (
          <div className="mt-6 space-y-3">
            {notifs.map(n=>(
              <div key={n.id} className={`rounded-2xl border p-4 ${n.is_read ? "border-zinc-800 bg-[#101015] opacity-60" : "border-violet-600/30 bg-violet-600/10"}`}>
                <p className="font-bold text-sm">{n.title}</p>
                <p className="text-xs text-zinc-400 mt-1">{n.message}</p>
                {n.link && <Link href={n.link} className="mt-2 inline-block text-xs text-violet-400">Voir</Link>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
