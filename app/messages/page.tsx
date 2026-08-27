
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

export default function MessagesPage() {
  const supabase = createClient();
  const { user } = useAuth() as any;
  const [convos, setConvos] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("direct_messages").select("*, sender: sender_id(id, username, display_name, avatar_url), receiver: receiver_id(id, username, display_name)").or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order("created_at",{ascending:false}).limit(100);
      // Group by other user
      const map: any = {};
      data?.forEach((m:any)=>{
        const other = m.sender_id===user.id ? m.receiver : m.sender;
        const otherId = m.sender_id===user.id ? m.receiver_id : m.sender_id;
        if (!map[otherId] || new Date(m.created_at) > new Date(map[otherId].last_at)) {
          map[otherId] = { other, last_msg: m.content, last_at: m.created_at, otherId };
        }
      });
      setConvos(Object.values(map));
    };
    load();
  }, [user]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-black flex items-center gap-2"><MessageCircle className="h-6 w-6 text-violet-500" /> Messages</h1>
      <div className="mt-6 space-y-3">
        {convos.length===0 ? <p className="text-zinc-500">Aucun message</p> : convos.map((c:any)=>(
          <Link key={c.otherId} href={`/profile/${c.other?.username}?chat=1`} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-[#101015] p-4 hover:border-violet-500/30">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center font-bold">{(c.other?.display_name||c.other?.username||"?")[0]}</div>
            <div className="flex-1"><p className="font-bold text-sm">@{c.other?.username}</p><p className="text-xs text-zinc-500 truncate">{c.last_msg}</p></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
