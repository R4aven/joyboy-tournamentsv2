
"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
export default function PlayerSearch({ profiles, onSelect }: { profiles: any[]; onSelect: (p: any)=>void }) {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    if (!q || q.length<1) return [];
    const l = q.toLowerCase();
    return profiles.filter(p => (p.username||"").toLowerCase().includes(l) || (p.display_name||"").toLowerCase().includes(l) || (p.bio||"").toLowerCase().includes(l) || (p.city||"").toLowerCase().includes(l) || (p.efootball_pseudo||"").toLowerCase().includes(l)).slice(0,10);
  }, [q, profiles]);
  return <div className="relative"><div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-[#101015] px-3 py-2"><Search className="h-4 w-4" /><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Cherche pseudo..." className="flex-1 bg-transparent text-sm outline-none" /></div>{results.length>0 && <div className="absolute z-10 mt-2 w-full rounded-xl border border-zinc-800 bg-[#15151E] max-h-60 overflow-auto">{results.map(r=><button key={r.id} onClick={()=>{ onSelect(r); setQ(""); }} className="w-full text-left p-3 hover:bg-[#1C1C27] text-sm">@{r.username} - {r.display_name}</button>)}</div>}</div>;
}
