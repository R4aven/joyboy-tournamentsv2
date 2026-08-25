
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, Send, Users } from "lucide-react";
import { toast } from "sonner";

export default function AdminNotificationsPage() {
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("TOURNOI");
  const [loading, setLoading] = useState(false);

  const sendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return toast.error("Remplis titre et message");
    setLoading(true);
    try {
      const { data: profiles } = await supabase.from("profiles").select("id").limit(1000);
      if (!profiles?.length) throw new Error("Aucun utilisateur");
      const notifs = profiles.map((p) => ({ user_id: p.id, type, title, message, link: type==="TOURNOI"?"/tournaments": type==="PALMARES"?"/palmares" : "/notifications" }));
      const { error } = await supabase.from("notifications").insert(notifs);
      if (error) throw error;
      toast.success(`Notifs envoyees a ${profiles.length} joueurs`);
      setTitle(""); setMessage("");
    } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-black flex items-center gap-3"><Bell className="h-7 w-7 text-joy-violet" /> Notifications Admin</h1>
      <div className="card-premium rounded-2xl p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Send className="h-4 w-4" /> Broadcast a tous les joueurs</h3>
        <form onSubmit={sendBroadcast} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-zinc-500">Type</label>
              <select value={type} onChange={(e)=>setType(e.target.value)} className="mt-2 w-full rounded-xl bg-[#0E0E14] border border-joy-border px-4 py-2.5 text-sm">
                <option value="TOURNOI">TOURNOI</option>
                <option value="1V1">1V1</option>
                <option value="PAIEMENT">PAIEMENT</option>
                <option value="PALMARES">PALMARES</option>
                <option value="COMPTE">COMPTE</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-zinc-500">Titre</label>
              <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Ex: Nouveau tournoi dispo" className="mt-2 w-full rounded-xl bg-[#0E0E14] border border-joy-border px-4 py-2.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-zinc-500">Message</label>
            <textarea value={message} onChange={(e)=>setMessage(e.target.value)} rows={4} placeholder="Message en mode ivoirien naturel..." className="mt-2 w-full rounded-xl bg-[#0E0E14] border border-joy-border px-4 py-2.5 text-sm resize-none" />
          </div>
          <button disabled={loading} className="rounded-xl bg-gradient-joy px-6 py-2.5 text-sm font-bold text-white">{loading ? "Envoi..." : "Envoyer a tous"}</button>
        </form>
      </div>
    </div>
  );
}
