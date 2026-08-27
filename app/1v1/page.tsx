
"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Swords, Crown, Eye, Loader2, Gamepad2, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
type Profile = { id: string; username: string; display_name?: string; avatar_url?: string | null; bio?: string; city?: string; efootball_pseudo?: string; email?: string; whatsapp_number?: string; wave_number?: string; wins?: number; losses?: number; tournaments_won?: number; created_at?: string; };
export default function Page1v1Final() {
  const supabase = createClient();
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string|undefined>();
  const [defying, setDefying] = useState<string|null>(null);
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) toast.error(error.message);
      else if (data) setAllProfiles(data as Profile[]);
      setLoading(false);
    };
    load();
    const ch = supabase.channel("profiles-final").on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, (payload) => {
      const p = payload.new as Profile;
      setAllProfiles(prev => prev.find(x=>x.id===p.id) ? prev : [p, ...prev]);
      toast.success(`Nouveau @${p.username} ajoute`);
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);
  const filtered = useMemo(() => {
    if (!query || query.trim().length < 1) return allProfiles;
    const q = query.toLowerCase();
    return allProfiles.filter(p => (p.username||"").toLowerCase().includes(q) || (p.display_name||"").toLowerCase().includes(q) || (p.bio||"").toLowerCase().includes(q) || (p.city||"").toLowerCase().includes(q) || (p.efootball_pseudo||"").toLowerCase().includes(q) || (p.email||"").toLowerCase().includes(q) || (p.whatsapp_number||"").toLowerCase().includes(q) || (p.wave_number||"").toLowerCase().includes(q));
  }, [allProfiles, query]);
  const handleDefy = async (p: Profile) => {
    if (!currentUserId) { toast.error("Connecte-toi"); return; }
    setDefying(p.id);
    try {
      await supabase.from("challenges").insert({ challenger_id: currentUserId, opponent_id: p.id, stake: 500, status: "pending", game: "eFootball" });
      toast.success(`Defi envoye a @${p.username}`);
    } catch (e:any) { toast.error(e.message); } finally { setDefying(null); }
  };
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      <h1 className="text-3xl font-black flex items-center gap-3"><Swords className="h-7 w-7 text-violet-500" /> 1V1 - Tous joueurs visibles ({allProfiles.length})</h1>
      <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-[#101015] px-4 py-3"><Search className="h-5 w-5 text-zinc-500" /><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cherche pseudo, nom utilisateur, bio, ville, eFootball, email, whatsapp... des 1 lettre" className="flex-1 bg-transparent text-sm outline-none" />{query && <button onClick={()=>setQuery("")} className="text-xs bg-[#15151E] border border-zinc-800 px-3 py-1 rounded-full">Effacer</button>}</div>
      <p className="text-[11px] text-zinc-500">Meme sans recherche tous les inscrits apparaissent. Actualise auto a chaque nouveau joueur.</p>
      {loading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div> : <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{filtered.map(p=><div key={p.id} className="rounded-[22px] border border-zinc-800 bg-[#15151E] p-5"><div className="flex gap-3"><div className="h-12 w-12 rounded-full bg-violet-600 flex items-center justify-center font-bold">{p.avatar_url ? <img src={p.avatar_url} className="h-full w-full object-cover rounded-full" /> : p.username[0]}</div><div><p className="font-bold">@{p.username}</p><p className="text-xs text-zinc-500">{p.display_name} - {p.city}</p><p className="text-[11px] text-zinc-600">{p.bio?.slice(0,40)}</p></div></div><div className="mt-3 flex gap-2"><Link href={`/profile/${p.username}`} className="flex-1 rounded-full border border-zinc-800 bg-[#08080B] py-2 text-xs text-center">Profil</Link><button disabled={p.id===currentUserId || defying===p.id} onClick={()=>handleDefy(p)} className="flex-1 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 py-2 text-xs font-bold text-white disabled:opacity-50">{p.id===currentUserId ? "Toi" : "Defier"}</button></div></div>)}</div>}
    </div>
  );
}
