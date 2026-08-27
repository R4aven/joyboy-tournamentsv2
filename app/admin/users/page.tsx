
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<any[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("profiles").select("id, username, display_name, avatar_url, bio, role, wins, losses, created_at").order("created_at", {ascending:false}).limit(100);
      if (data) setUsers(data);
    };
    load();
  }, []);

  const filtered = users.filter(u => !q || (u.username||"").toLowerCase().includes(q.toLowerCase()) || (u.display_name||"").toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <h1 className="text-2xl font-black">Utilisateurs (vrai schema: username, pas pseudo)</h1>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher username..." className="mt-4 w-72 rounded-xl bg-[#101015] border border-zinc-800 px-4 py-2 text-sm" />
      <div className="mt-6 grid gap-3">
        {filtered.map(u=>(
          <div key={u.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-[#101015] p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center font-bold text-xs">{(u.display_name||u.username||"?")[0]}</div>
              <div><p className="font-bold text-sm">{u.display_name||u.username}</p><p className="text-xs text-zinc-500">@{u.username} • {u.role} • {u.wins||0}V • {u.bio?.slice(0,30)||"pas de bio"}</p></div>
            </div>
            <Link href={`/profile/${u.username}`} className="rounded-xl bg-[#15151E] border border-zinc-800 px-3 py-1.5 text-xs font-bold">Voir</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
