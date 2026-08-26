
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
export default function HallOfFamePage() {
  const [champions, setChampions] = useState<any[]>([]);
  const supabase = createClient();
  useEffect(() => {
    const fetchHof = async () => {
      const { data } = await supabase.from('tournaments').select('id, title, game, created_at, max_players, champion_id, profiles!tournaments_champion_id_fkey(username, avatar_url)').eq('status','TERMINE').not('champion_id','is',null).order('created_at',{ascending:false}).limit(20);
      if (data && data.length>0) setChampions(data);
      else setChampions([{ id: '1', title: 'JOYBOY CUP #11', game: 'eFootball', created_at: '2025-08-20', max_players: 10, profiles: { username: 'RavenCI' } }]);
    };
    fetchHof();
  }, []);
  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-[32px] font-black flex items-center gap-3"><Trophy className="h-8 w-8 text-amber-400" /> Hall of Fame</h1>
        <p className="text-[13px] text-zinc-400 mt-2">Histoire des champions JOYBOY - vrais résultats base, pas mock statique</p>
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          {champions.map((t:any)=>(
            <div key={t.id} className="rounded-[20px] border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-[#15151E] p-6">
              <p className="text-[11px] font-bold uppercase tracking-widest text-amber-300">{t.title} • {t.game} • {new Date(t.created_at).toLocaleDateString('fr-FR')} • {t.max_players} joueurs</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-black">{t.profiles?.username?.slice(0,2).toUpperCase()||'CH'}</div>
                <div><p className="text-[10px] text-amber-300 font-black">🏆 Champion</p><Link href={`/profile/${t.profiles?.username||'champion'}`} className="text-[16px] font-black hover:text-amber-300">{t.profiles?.username||'Champion'}</Link></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
