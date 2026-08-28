
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Users, Eye, Mail, Phone, MapPin, Calendar, Trophy, Wallet, Download, Filter } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type Profile = {
  id: string;
  username: string;
  display_name?: string;
  email?: string;
  avatar_url?: string | null;
  bio?: string;
  city?: string;
  efootball_pseudo?: string;
  whatsapp_number?: string;
  wave_number?: string;
  phone?: string;
  wins?: number;
  losses?: number;
  tournaments_played?: number;
  tournaments_won?: number;
  challenges_won?: number;
  total_earnings?: number;
  role?: string;
  created_at?: string;
  is_banned?: boolean;
};

export default function AdminUsersPage() {
  const supabase = createClient();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filtered, setFiltered] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Profile | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // Récupère TOUTES les infos soumises à l'inscription
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(1000);
      if (error) toast.error(error.message);
      else { setProfiles(data as Profile[]); setFiltered(data as Profile[]); }
      setLoading(false);
    };
    load();
    // Realtime pour voir nouveau joueur direct
    const ch = supabase.channel("admin-users").on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, (payload: any) => {
      const p = payload.new as Profile;
      setProfiles(prev => [p, ...prev]);
      setFiltered(prev => [p, ...prev]);
      toast.success(`Nouveau joueur inscrit: @${p.username}`);
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    if (!query) { setFiltered(profiles); return; }
    const q = query.toLowerCase();
    setFiltered(profiles.filter(p => 
      p.username?.toLowerCase().includes(q) ||
      p.display_name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q) ||
      p.efootball_pseudo?.toLowerCase().includes(q) ||
      p.whatsapp_number?.includes(q) ||
      p.wave_number?.includes(q)
    ));
  }, [query, profiles]);

  const exportCSV = () => {
    const headers = ["id","username","display_name","email","bio","city","efootball_pseudo","whatsapp_number","wave_number","wins","losses","tournaments_played","tournaments_won","total_earnings","role","created_at"];
    const rows = filtered.map(p => headers.map(h => `"${(p as any)[h]||""}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `joyboy_users_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  if (loading) return <div className="p-10 flex justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-violet-600" /></div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-black flex items-center gap-3"><Users className="h-7 w-7 text-violet-500" /> Utilisateurs - Toutes infos inscription ({profiles.length})</h1>
        <button onClick={exportCSV} className="rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2 text-sm flex items-center gap-2"><Download className="h-4 w-4" /> Export CSV</button>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-[#101015] px-4 py-3">
        <Search className="h-5 w-5 text-zinc-500" />
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cherche dès 1 lettre: pseudo, email, ville, whatsapp, wave..." className="flex-1 bg-transparent text-sm outline-none" />
        <span className="text-xs text-zinc-500">{filtered.length}/{profiles.length}</span>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-[#101015] overflow-hidden">
        <div className="overflow-auto max-h-[70vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#15151E] border-b border-zinc-800 text-xs uppercase text-zinc-500">
              <tr>
                <th className="p-3 text-left">Joueur</th>
                <th className="p-3 text-left">Infos inscription</th>
                <th className="p-3 text-left">Contact</th>
                <th className="p-3 text-left">Stats</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filtered.map(p=>(
                <tr key={p.id} className="hover:bg-[#15151E]/50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center font-bold text-xs">
                        {p.avatar_url ? <img src={p.avatar_url} className="h-full w-full object-cover" /> : (p.username?.[0]||"?")}
                      </div>
                      <div>
                        <p className="font-bold">@{p.username}</p>
                        <p className="text-xs text-zinc-500">{p.display_name||"-"}</p>
                        <p className="text-[10px] text-zinc-600">{p.role||"JOUEUR"} {p.is_banned ? "🚫 Banni" : ""}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-xs max-w-[200px]">
                    <div className="space-y-1">
                      <p><span className="text-zinc-500">Bio:</span> {p.bio?.slice(0,80)||"-"}</p>
                      <p><span className="text-zinc-500">Ville:</span> {p.city||"-"}</p>
                      <p><span className="text-zinc-500">eFootball:</span> {p.efootball_pseudo||"-"}</p>
                      <p className="text-[11px] text-zinc-600 truncate">ID: {p.id.slice(0,8)}...</p>
                    </div>
                  </td>
                  <td className="p-3 text-xs">
                    <div className="space-y-1">
                      <p className="flex items-center gap-1"><Mail className="h-3 w-3" /> {p.email||"-"}</p>
                      <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> WhatsApp: {p.whatsapp_number||"-"}</p>
                      <p className="flex items-center gap-1"><Wallet className="h-3 w-3" /> Wave: {p.wave_number||"-"}</p>
                    </div>
                  </td>
                  <td className="p-3 text-xs">
                    <div><Trophy className="inline h-3 w-3 mr-1" />{p.wins||0}V / {p.losses||0}D</div>
                    <div>Tournois: {p.tournaments_played||0} joués, {p.tournaments_won||0} gagnés</div>
                    <div>Gains: {p.total_earnings||0} F</div>
                  </td>
                  <td className="p-3 text-xs text-zinc-500">{p.created_at ? new Date(p.created_at).toLocaleString() : "-"}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button onClick={()=>setSelected(p)} className="rounded-lg bg-[#15151E] border border-zinc-800 p-2"><Eye className="h-4 w-4" /></button>
                      <Link href={`/profile/${p.username}`} className="rounded-lg bg-violet-600 text-white px-3 py-2 text-xs">Profil</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-2xl border border-zinc-800 bg-[#101015] max-w-2xl w-full max-h-[90vh] overflow-auto p-6 space-y-4">
            <div className="flex justify-between"><h2 className="text-xl font-black">@{selected.username} - Toutes infos inscription</h2><button onClick={()=>setSelected(null)} className="rounded-full bg-[#15151E] border border-zinc-800 px-3 py-1 text-xs">Fermer</button></div>
            <div className="flex gap-4"><div className="h-20 w-20 rounded-full overflow-hidden bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-2xl font-black">{selected.avatar_url ? <img src={selected.avatar_url} className="h-full w-full object-cover" /> : selected.username[0]}</div><div><p className="font-bold text-lg">{selected.display_name}</p><p className="text-sm text-zinc-500">@{selected.username} • {selected.role}</p><p className="text-xs text-zinc-600 mt-1">Inscrit: {selected.created_at ? new Date(selected.created_at).toLocaleString() : "-"}</p></div></div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl bg-[#15151E] border border-zinc-800 p-3"><p className="text-xs uppercase text-zinc-500">Email</p><p>{selected.email||"-"}</p></div>
              <div className="rounded-xl bg-[#15151E] border border-zinc-800 p-3"><p className="text-xs uppercase text-zinc-500">Ville</p><p>{selected.city||"-"}</p></div>
              <div className="rounded-xl bg-[#15151E] border border-zinc-800 p-3"><p className="text-xs uppercase text-zinc-500">Bio</p><p>{selected.bio||"-"}</p></div>
              <div className="rounded-xl bg-[#15151E] border border-zinc-800 p-3"><p className="text-xs uppercase text-zinc-500">eFootball Pseudo</p><p>{selected.efootball_pseudo||"-"}</p></div>
              <div className="rounded-xl bg-[#15151E] border border-zinc-800 p-3"><p className="text-xs uppercase text-zinc-500">WhatsApp</p><p>{selected.whatsapp_number||"-"}</p></div>
              <div className="rounded-xl bg-[#15151E] border border-zinc-800 p-3"><p className="text-xs uppercase text-zinc-500">Wave</p><p>{selected.wave_number||"-"}</p></div>
              <div className="rounded-xl bg-[#15151E] border border-zinc-800 p-3"><p className="text-xs uppercase text-zinc-500">ID Complet</p><p className="text-xs break-all">{selected.id}</p></div>
              <div className="rounded-xl bg-[#15151E] border border-zinc-800 p-3"><p className="text-xs uppercase text-zinc-500">Stats</p><p>{selected.wins}V {selected.losses}D • {selected.tournaments_won} tournois gagnés • {selected.total_earnings} F</p></div>
            </div>
            <div className="flex gap-2"><Link href={`/profile/${selected.username}`} className="rounded-xl bg-white text-black px-4 py-2 text-sm font-bold">Voir profil public</Link><button onClick={()=>setSelected(null)} className="rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2 text-sm">Fermer</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
