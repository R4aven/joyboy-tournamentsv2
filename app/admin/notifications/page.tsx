
"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, Send, Users, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Profile = { id: string; username: string; display_name?: string; avatar_url?: string | null };

export default function AdminNotificationsPage() {
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("TOURNOI");
  const [loading, setLoading] = useState(false);
  const [singleUser, setSingleUser] = useState<Profile | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [allCount, setAllCount] = useState(0);
  const timer = useRef<any>(null);

  useEffect(() => {
    supabase.from("profiles").select("*", { count: "exact", head: true }).then(({count})=> count && setAllCount(count));
    const ch = supabase.channel("profiles-admin").on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, (payload) => {
      const p = payload.new as Profile;
      toast.success(`Nouveau @${p.username} - dropdown mis a jour`);
      if (query && p.username.toLowerCase().includes(query.toLowerCase())) setResults(prev => [p, ...prev].slice(0,10));
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [query]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!query || query.trim().length < 1) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase.from("profiles").select("id, username, display_name, avatar_url").or(`username.ilike.%${query}%,display_name.ilike.%${query}%`).limit(10);
      if (data) setResults(data as Profile[]);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer.current);
  }, [query]);

  const sendSingle = async () => {
    if (!singleUser) return toast.error("Choisis joueur");
    if (!title || !message) return toast.error("Titre/message requis");
    setLoading(true);
    const { error } = await supabase.from("notifications").insert({ user_id: singleUser.id, type, title, message, link: "/notifications" });
    setLoading(false);
    if (error) toast.error(error.message); else toast.success(`Envoye a @${singleUser.username}`);
  };

  const sendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return toast.error("Remplis");
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("id").limit(2000);
    const notifs = profiles?.map(p=>({ user_id: p.id, type, title, message, link: "/notifications" }));
    const { error } = await supabase.from("notifications").insert(notifs as any);
    setLoading(false);
    if (error) toast.error(error.message); else { toast.success(`Envoye a ${profiles?.length}`); setTitle(""); setMessage(""); }
  };

  return (
    <div className="max-w-3xl space-y-8 p-6">
      <h1 className="text-3xl font-black flex items-center gap-2"><Bell className="h-7 w-7 text-violet-500" /> Notifications Admin - Dropdown temps reel ({allCount} joueurs)</h1>
      <div className="rounded-2xl border border-zinc-800 bg-[#101015] p-6">
        <h3 className="font-bold mb-2 flex items-center gap-2"><Users className="h-4 w-4" /> Envoi a 1 joueur - menu deroulant actualise a chaque inscription</h3>
        <p className="text-xs text-zinc-500 mb-4">Tape 1 lettre, resultats sortent direct</p>
        <div className="relative">
          <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-[#15151E] px-4 py-2.5"><Search className="h-4 w-4" /><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cherche des 1 lettre..." className="flex-1 bg-transparent text-sm outline-none" />{searching && <Loader2 className="h-4 w-4 animate-spin" />}</div>
          {results.length>0 && <div className="absolute z-20 mt-2 w-full rounded-xl border border-zinc-800 bg-[#1C1C27] shadow-xl max-h-64 overflow-auto">{results.map(p=><button key={p.id} onClick={()=>{ setSingleUser(p); setQuery(p.username); setResults([]); }} className="w-full flex gap-3 p-3 hover:bg-[#15151E] text-left"><div className="h-8 w-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold">{p.avatar_url ? <img src={p.avatar_url} className="h-full w-full object-cover rounded-full" /> : p.username[0]}</div><div><p className="text-sm font-bold">@{p.username}</p><p className="text-xs text-zinc-500">{p.display_name}</p></div></button>)}</div>}
        </div>
        {singleUser && <div className="mt-4 rounded-xl bg-violet-500/10 border border-violet-500/20 p-3 flex justify-between"><span className="text-sm font-bold">@{singleUser.username} selectionne</span><button onClick={()=>{setSingleUser(null); setQuery("");}} className="text-xs underline">Changer</button></div>}
        <div className="mt-4 grid grid-cols-2 gap-4"><div><label className="text-xs font-bold uppercase text-zinc-500">Type</label><select value={type} onChange={e=>setType(e.target.value)} className="mt-2 w-full rounded-xl bg-[#0E0E14] border border-zinc-800 px-4 py-2.5 text-sm"><option value="TOURNOI">TOURNOI</option><option value="1V1">1V1</option><option value="PAIEMENT">PAIEMENT</option></select></div><div><label className="text-xs font-bold uppercase text-zinc-500">Titre</label><input value={title} onChange={e=>setTitle(e.target.value)} className="mt-2 w-full rounded-xl bg-[#0E0E14] border border-zinc-800 px-4 py-2.5 text-sm" /></div></div>
        <div className="mt-4"><label className="text-xs font-bold uppercase text-zinc-500">Message</label><textarea value={message} onChange={e=>setMessage(e.target.value)} rows={3} className="mt-2 w-full rounded-xl bg-[#0E0E14] border border-zinc-800 px-4 py-2.5 text-sm" /></div>
        <button onClick={sendSingle} disabled={loading || !singleUser} className="mt-4 rounded-xl bg-white text-black px-6 py-2.5 text-sm font-bold disabled:opacity-50">Envoyer a 1 joueur</button>
      </div>
      <div className="rounded-2xl border border-zinc-800 bg-[#101015] p-6"><h3 className="font-bold mb-4 flex items-center gap-2"><Send className="h-4 w-4" /> Broadcast tous</h3><form onSubmit={sendBroadcast} className="space-y-4"><div className="grid grid-cols-2 gap-4"><div><label className="text-xs uppercase text-zinc-500">Type</label><select value={type} onChange={e=>setType(e.target.value)} className="mt-2 w-full rounded-xl bg-[#0E0E14] border border-zinc-800 px-4 py-2.5 text-sm"><option value="TOURNOI">TOURNOI</option><option value="1V1">1V1</option></select></div><div><label className="text-xs uppercase text-zinc-500">Titre</label><input value={title} onChange={e=>setTitle(e.target.value)} className="mt-2 w-full rounded-xl bg-[#0E0E14] border border-zinc-800 px-4 py-2.5 text-sm" /></div></div><textarea value={message} onChange={e=>setMessage(e.target.value)} rows={4} className="mt-2 w-full rounded-xl bg-[#0E0E14] border border-zinc-800 px-4 py-2.5 text-sm" /><button disabled={loading} className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-2.5 text-sm font-bold text-white">{loading ? "Envoi..." : "Envoyer a tous"}</button></form></div>
    </div>
  );
}
