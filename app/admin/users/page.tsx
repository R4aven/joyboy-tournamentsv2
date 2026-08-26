"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { 
  Users, 
  Search, 
  Shield, 
  Ban, 
  Crown, 
  Phone, 
  Gamepad2, 
  Wallet,
  Eye,
  CheckCircle2,
  AlertCircle,
  Copy
} from "lucide-react";
import Link from "next/link";

type AdminProfile = {
  id: string;
  username?: string;
  pseudo?: string;
  display_name?: string;
  email?: string;
  avatar_url?: string;
  role: string;
  whatsapp_number?: string | null;
  efootball_pseudo?: string | null;
  wave_number?: string | null;
  telephone?: string;
  phone_wave?: string | null;
  total_earnings?: number;
  created_at: string;
  wins?: number;
  victoires?: number;
  is_banned?: boolean;
};

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<AdminProfile[]>([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<"ALL" | "JOUEUR" | "ADMIN" | "MODERATEUR">("ALL");
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(250);
      
      if (filterRole !== "ALL") query = query.eq("role", filterRole);
      
      const { data, error } = await query;
      if (error) throw error;
      if (data) setUsers(data as any);
    } catch (e: any) {
      toast.error(e.message ?? "Erreur chargement users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filterRole]);

  const handleRole = async (u: AdminProfile, newRole: string) => {
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", u.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Rôle de ${u.username || u.pseudo} changé en ${newRole}`);
      fetchUsers();
    }
  };

  const handleBan = async (u: AdminProfile) => {
    const { error } = await supabase.from("profiles").update({ is_banned: !u.is_banned }).eq("id", u.id);
    if (error) toast.error(error.message);
    else {
      toast.success(u.is_banned ? "Utilisateur débanni" : "Utilisateur suspendu");
      fetchUsers();
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copié: ${text}`);
  };

  const displayName = (u: AdminProfile) => u.username || u.pseudo || u.display_name || u.id.slice(0,8);

  const filtered = users.filter((u) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (u.username || u.pseudo || "").toLowerCase().includes(s) ||
      (u.display_name || "").toLowerCase().includes(s) ||
      (u.email || "").toLowerCase().includes(s) ||
      (u.whatsapp_number || "").toLowerCase().includes(s) ||
      (u.efootball_pseudo || "").toLowerCase().includes(s) ||
      (u.wave_number || "").toLowerCase().includes(s) ||
      (u.phone_wave || "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6 p-6 bg-[#08080B] min-h-screen">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[28px] font-black flex items-center gap-3 text-white">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center">
            <Users className="h-5 w-5 text-white" />
          </div>
          Utilisateurs <span className="text-[14px] font-bold px-3 py-1 rounded-full bg-[#15151E] border border-[#22222F] text-zinc-400">{filtered.length}/{users.length} comptes</span>
        </h1>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Recherche pseudo, WhatsApp, eFootball, Wave, email..."
              className="pl-9 pr-4 py-2.5 rounded-xl bg-[#15151E] border border-[#22222F] text-[13px] w-[360px] outline-none focus:border-[#7C3AED]/50 text-white placeholder:text-zinc-600"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 p-1 rounded-xl bg-[#15151E] border border-[#22222F] w-fit">
        {(["ALL", "JOUEUR", "ADMIN", "MODERATEUR"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setFilterRole(r as any)}
            className={`px-4 py-1.5 rounded-lg text-[11px] font-black tracking-widest transition ${filterRole === r ? "bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-white shadow-lg" : "text-zinc-400 hover:text-white"}`}
          >
            {r === "ALL" ? "TOUS" : r}
          </button>
        ))}
      </div>

      {/* Stats admin */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-[#22222F] bg-[#15151E] p-4">
          <p className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold">Contacts complets</p>
          <p className="mt-1 text-[22px] font-black text-white">{users.filter(u=>u.whatsapp_number && u.efootball_pseudo && u.wave_number).length}</p>
          <p className="text-[11px] text-emerald-400">Reçu admin ✓</p>
        </div>
        <div className="rounded-2xl border border-[#22222F] bg-[#15151E] p-4">
          <p className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold">WhatsApp manquant</p>
          <p className="mt-1 text-[22px] font-black text-white">{users.filter(u=>!u.whatsapp_number).length}</p>
          <p className="text-[11px] text-amber-400">À relancer</p>
        </div>
        <div className="rounded-2xl border border-[#22222F] bg-[#15151E] p-4">
          <p className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold">eFootball manquant</p>
          <p className="mt-1 text-[22px] font-black text-white">{users.filter(u=>!u.efootball_pseudo).length}</p>
          <p className="text-[11px] text-violet-400">Anti-triche</p>
        </div>
        <div className="rounded-2xl border border-[#22222F] bg-[#15151E] p-4">
          <p className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold">Wave perso manquant</p>
          <p className="mt-1 text-[22px] font-black text-white">{users.filter(u=>!u.wave_number).length}</p>
          <p className="text-[11px] text-cyan-400">Paiement djai</p>
        </div>
      </div>

      <div className="rounded-[20px] border border-[#22222F] bg-[#101015] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[#0E0E14] text-[10px] uppercase tracking-widest text-zinc-500 border-b border-[#22222F]">
              <tr>
                <th className="px-4 py-3 text-left">Joueur (pseudo JOYBOY)</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left flex items-center gap-1"><Phone className="h-3 w-3 text-emerald-400" /> WhatsApp</th>
                <th className="px-4 py-3 text-left"><span className="flex items-center gap-1"><Gamepad2 className="h-3 w-3 text-violet-400" /> eFootball</span></th>
                <th className="px-4 py-3 text-left"><span className="flex items-center gap-1"><Wallet className="h-3 w-3 text-cyan-400" /> Wave perso</span></th>
                <th className="px-4 py-3 text-left">Gains</th>
                <th className="px-4 py-3 text-left">Inscrit</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="py-16 text-center text-zinc-500">Chargement des champions...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center text-zinc-500">Aucun utilisateur trouvé pour &quot;{search}&quot;</td></tr>
              ) : (
                filtered.map((u) => {
                  const name = displayName(u);
                  const isComplete = !!(u.whatsapp_number && u.efootball_pseudo && u.wave_number);
                  return (
                  <tr key={u.id} className="border-t border-[#15151E] hover:bg-[#15151E]/60 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center font-black text-[11px] text-white shrink-0">
                          {name.slice(0,2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white flex items-center gap-1.5 truncate">{name} {u.role === "ADMIN" && <Crown className="h-3 w-3 text-amber-400" />}{isComplete && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}</p>
                          <p className="text-[11px] text-zinc-500 flex items-center gap-1"><span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${u.role==="ADMIN"?"bg-amber-500/20 text-amber-400 border border-amber-500/20":u.role==="MODERATEUR"?"bg-violet-500/15 text-violet-300 border border-violet-500/20":"bg-[#22222F] text-zinc-400"}`}>{u.role}</span> {u.is_banned && <span className="px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/15 text-[9px]">SUSPENDU</span>}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-zinc-300 max-w-[170px] truncate">{(u as any).email || u.id.slice(0,12)+"..."}</td>
                    
                    {/* WHATSAPP */}
                    <td className="px-4 py-3">
                      {u.whatsapp_number ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[12px] text-emerald-300">{u.whatsapp_number}</span>
                          <button onClick={()=>copyToClipboard(u.whatsapp_number!, "WhatsApp")} className="h-6 w-6 rounded-lg bg-[#15151E] border border-[#22222F] flex items-center justify-center hover:border-emerald-500/30"><Copy className="h-3 w-3 text-zinc-400" /></button>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-[9px] font-black text-emerald-300 tracking-widest">Reçu admin</span>
                        </div>
                      ) : (
                        <span className="px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-300 flex items-center gap-1 w-fit"><AlertCircle className="h-3 w-3" /> Manquant</span>
                      )}
                    </td>

                    {/* eFootball */}
                    <td className="px-4 py-3">
                      {u.efootball_pseudo ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-bold text-violet-300">{u.efootball_pseudo}</span>
                          <span className="px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/20 text-[9px] font-black text-violet-300 tracking-widest">Reçu admin</span>
                        </div>
                      ) : (
                        <span className="px-2 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] font-bold text-zinc-500">Manquant</span>
                      )}
                    </td>

                    {/* Wave perso */}
                    <td className="px-4 py-3">
                      {u.wave_number ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[12px] text-cyan-300">{u.wave_number}</span>
                          <button onClick={()=>copyToClipboard(u.wave_number!, "Wave perso")} className="h-6 w-6 rounded-lg bg-[#15151E] border border-[#22222F] flex items-center justify-center hover:border-cyan-500/30"><Copy className="h-3 w-3 text-zinc-400" /></button>
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/20 text-[9px] font-black text-cyan-300 tracking-widest">Reçu admin</span>
                        </div>
                      ) : (
                        <span className="px-2 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] font-bold text-zinc-500">Manquant</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-[12px] font-bold text-white">{u.total_earnings ?? 0} F</td>
                    <td className="px-4 py-3 text-[11px] text-zinc-500">{new Date(u.created_at).toLocaleDateString("fr-CI")}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Link href={`/profile/${name}`} className="h-8 px-2.5 rounded-lg bg-[#15151E] border border-[#22222F] text-[11px] font-bold text-zinc-300 hover:text-white hover:border-white/10 flex items-center gap-1"><Eye className="h-3 w-3" /> Voir</Link>
                        {u.role !== "ADMIN" ? (
                          <button onClick={() => handleRole(u, "ADMIN")} className="h-8 px-2.5 rounded-lg bg-amber-500/15 border border-amber-500/20 text-amber-300 text-[11px] font-bold flex items-center gap-1 hover:bg-amber-500/20"><Shield className="h-3 w-3" /> Admin</button>
                        ) : (
                          <button onClick={() => handleRole(u, "JOUEUR")} className="h-8 px-2.5 rounded-lg bg-[#15151E] border border-[#22222F] text-[11px] font-bold hover:bg-white/5">Retirer admin</button>
                        )}
                        <button onClick={() => handleBan(u)} className={`h-8 px-2.5 rounded-lg text-[11px] font-bold border ${u.is_banned ? "bg-emerald-500/15 border-emerald-500/20 text-emerald-300" : "bg-red-500/10 border-red-500/20 text-red-300 hover:bg-red-500/15"}`}><Ban className="h-3 w-3 inline mr-1" />{u.is_banned ? "Débannir" : "Suspendre"}</button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-[#22222F] bg-[#15151E] p-4 flex gap-3">
        <Shield className="h-4 w-4 text-[#7C3AED] mt-0.5" />
        <p className="text-[11px] leading-relaxed text-zinc-400">Filtre recherche : pseudo JOYBOY, email, <span className="text-emerald-400 font-bold">WhatsApp</span>, <span className="text-violet-400 font-bold">eFootball</span>, <span className="text-cyan-400 font-bold">Wave perso</span>. Tout est reçu côté admin pour payer les djai via Wave. 🇨🇮</p>
      </div>
    </div>
  );
}
