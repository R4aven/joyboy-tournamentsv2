
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, Send, Users, Search, User } from "lucide-react";
import { toast } from "sonner";

// Enum valide en DB: TOURNOI_OUVERT, DEFI_RECU, PAIEMENT_RECU, etc. On mappe les anciens labels vers les bons
const TYPE_OPTIONS = [
  { value: "TOURNOI_OUVERT", label: "TOURNOI", link: "/tournaments" },
  { value: "DEFI_RECU", label: "1V1", link: "/1v1" },
  { value: "PAIEMENT_RECU", label: "PAIEMENT", link: "/dashboard" },
  { value: "SUCCES_DEBLOQUE", label: "PALMARES", link: "/palmares" },
  { value: "SYSTEME", label: "COMPTE", link: "/profile" },
  { value: "ADMIN", label: "ADMIN / INFO", link: "/notifications" },
  { value: "SYSTEME", label: "PROMO / SOLDES", link: "/tournaments" },
];

export default function AdminNotificationsPage() {
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("TOURNOI_OUVERT");
  const [mode, setMode] = useState<"ALL" | "SINGLE">("ALL");
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const loadPlayers = async () => {
      const { data } = await supabase.from("profiles").select("id, username, display_name, avatar_url, city, wins").order("username").limit(200);
      if (data) setPlayers(data);
    };
    loadPlayers();
  }, []);

  const filteredPlayers = players.filter(p => !search || (p.username||"").toLowerCase().includes(search.toLowerCase()) || (p.display_name||"").toLowerCase().includes(search.toLowerCase()));

  const getLinkForType = (t: string) => {
    const found = TYPE_OPTIONS.find(o => o.value === t);
    return found?.link || "/notifications";
  };

  const sendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return toast.error("Remplis titre et message");
    setLoading(true);
    try {
      if (mode === "ALL") {
        const { data: profiles } = await supabase.from("profiles").select("id").limit(1000);
        if (!profiles?.length) throw new Error("Aucun utilisateur");
        const notifs = profiles.map((p) => ({ user_id: p.id, type, title, message, link: getLinkForType(type) }));
        const { error } = await supabase.from("notifications").insert(notifs);
        if (error) throw error;
        toast.success(`Notifs envoyées à ${profiles.length} joueurs`);
      } else {
        if (!selectedPlayer) return toast.error("Choisis un joueur");
        const { error } = await supabase.from("notifications").insert({ user_id: selectedPlayer.id, type, title, message, link: getLinkForType(type) });
        if (error) throw error;
        toast.success(`Notif envoyée à @${selectedPlayer.username}`);
      }
      setTitle(""); setMessage(""); setSelectedPlayer(null); setSearch("");
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes("invalid input value for enum")) {
        toast.error(`Type invalide. Utilise SQL fix pour convertir en TEXT ou choisis un type valide. Erreur: ${e.message}`);
      } else toast.error(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-3xl font-black flex items-center gap-3"><Bell className="h-7 w-7 text-violet-500" /> Notifications Admin</h1>
      
      <div className="flex gap-2">
        <button onClick={()=>setMode("ALL")} className={`rounded-xl px-5 py-2.5 text-sm font-bold border ${mode==="ALL" ? "bg-white text-black border-white" : "bg-[#15151E] border-zinc-800 text-zinc-400"}`}>Envoyer à tous</button>
        <button onClick={()=>setMode("SINGLE")} className={`rounded-xl px-5 py-2.5 text-sm font-bold border ${mode==="SINGLE" ? "bg-white text-black border-white" : "bg-[#15151E] border-zinc-800 text-zinc-400"}`}>Envoyer à un joueur</button>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-[#101015] p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Send className="h-4 w-4" /> {mode==="ALL" ? "Broadcast à tous les joueurs" : "Envoi ciblé à un joueur"}</h3>
        
        {mode==="SINGLE" && (
          <div className="mb-6 relative">
            <label className="text-xs font-bold uppercase text-zinc-500">Choisir le joueur *</label>
            <div className="mt-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input value={search} onChange={(e)=>{ setSearch(e.target.value); setShowDropdown(true); }} onFocus={()=>setShowDropdown(true)} placeholder="Rechercher pseudo... ex: RavenCI" className="w-full rounded-xl bg-[#0E0E14] border border-zinc-800 pl-10 pr-4 py-2.5 text-sm" />
            </div>
            {selectedPlayer && (
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-[#15151E] border border-violet-500/30 p-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center font-bold">{(selectedPlayer.display_name||selectedPlayer.username)[0]}</div>
                <div><p className="font-bold text-sm">@{selectedPlayer.username}</p><p className="text-xs text-zinc-500">{selectedPlayer.display_name} • {selectedPlayer.wins||0}V</p></div>
                <button onClick={()=>setSelectedPlayer(null)} className="ml-auto text-xs text-red-400">Retirer</button>
              </div>
            )}
            {showDropdown && search && (
              <div className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-zinc-800 bg-[#15151E] shadow-xl">
                {filteredPlayers.length===0 ? <p className="p-4 text-sm text-zinc-500">Aucun joueur trouvé</p> : filteredPlayers.slice(0,20).map(p=>(
                  <button key={p.id} onClick={()=>{ setSelectedPlayer(p); setSearch(p.username); setShowDropdown(false); }} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#0E0E14] border-b border-zinc-800/50 last:border-0">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-xs font-bold">{(p.display_name||p.username)[0]}</div>
                    <div><p className="text-sm font-bold">@{p.username}</p><p className="text-xs text-zinc-500">{p.display_name}</p></div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <form onSubmit={sendBroadcast} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-zinc-500">Type (enum valide)</label>
              <select value={type} onChange={(e)=>setType(e.target.value)} className="mt-2 w-full rounded-xl bg-[#0E0E14] border border-zinc-800 px-4 py-2.5 text-sm">
                {TYPE_OPTIONS.map(o=><option key={o.value+o.label} value={o.value}>{o.label} → {o.value}</option>)}
              </select>
              <p className="text-[10px] text-zinc-500 mt-1">Ancien bug: TOURNOI, 1V1, PAIEMENT n'existent pas en DB. Maintenant mappé vers TOURNOI_OUVERT, DEFI_RECU, PAIEMENT_RECU</p>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-zinc-500">Titre</label>
              <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Ex: Nouveau tournoi dispo" className="mt-2 w-full rounded-xl bg-[#0E0E14] border border-zinc-800 px-4 py-2.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-zinc-500">Message</label>
            <textarea value={message} onChange={(e)=>setMessage(e.target.value)} rows={4} placeholder="Message..." className="mt-2 w-full rounded-xl bg-[#0E0E14] border border-zinc-800 px-4 py-2.5 text-sm resize-none" />
          </div>
          <button disabled={loading} className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50">{loading ? "Envoi..." : mode==="ALL" ? "Envoyer à tous" : `Envoyer à @${selectedPlayer?.username || "joueur"}`}</button>
        </form>
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-200">
        <p className="font-bold">Si tu as encore l'erreur enum, exécute SQL fix_notifications_enum.sql</p>
        <p>Il convertit notifications.type en TEXT pour accepter TOURNOI, 1V1, PAIEMENT, etc.</p>
      </div>
    </div>
  );
}
