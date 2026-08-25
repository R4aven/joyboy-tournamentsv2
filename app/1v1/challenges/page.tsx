"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Swords, Clock, Check, X } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Challenge = {
  id: string;
  challenger_id: string;
  opponent_id: string;
  stake: number;
  status: string;
  created_at: string;
  challenger_username?: string;
  opponent_username?: string;
};

export default function ChallengesPage() {
  const supabase = createClient();
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"recus"|"envoyes"|"tous">("tous");

  useEffect(() => {
    const fetchCh = async () => {
      if (!user) return;
      setLoading(true);
      const { data } = await supabase.from("challenges").select("*").or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`).order("created_at", { ascending: false }).limit(50);
      if (data) {
        const enriched = await Promise.all(data.map(async (c: any) => {
          let chName = "Joueur", opName = "Joueur";
          try {
            const { data: ch } = await supabase.from("profiles").select("username").eq("id", c.challenger_id).maybeSingle();
            const { data: op } = await supabase.from("profiles").select("username").eq("id", c.opponent_id).maybeSingle();
            if (ch) chName = ch.username;
            if (op) opName = op.username;
          } catch {}
          return { ...c, challenger_username: chName, opponent_username: opName };
        }));
        // Filtre anti-fake
        const real = enriched.filter(c => !c.id.startsWith("ch-") && !c.challenger_id.startsWith("m") && !c.opponent_id.startsWith("m"));
        setChallenges(real.length ? real : enriched.filter(c => !c.id.startsWith("ch-")));
      }
      setLoading(false);
    };
    fetchCh();
  }, [supabase, user]);

  const filtered = challenges.filter(c => {
    if (tab==="recus") return c.opponent_id===user?.id;
    if (tab==="envoyes") return c.challenger_id===user?.id;
    return true;
  });

  const acceptChallenge = async (id: string) => {
    const { error } = await supabase.from("challenges").update({ status: "accepted" }).eq("id", id);
    if (!error) { toast.success("Défi accepté !"); setChallenges(challenges.map(c=> c.id===id ? {...c, status:"accepted"}:c)); }
  };

  if (loading) return <div className="min-h-screen bg-[#08080B] text-white flex items-center justify-center">Chargement...</div>;

  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-[26px] font-black flex items-center gap-3"><Swords className="h-6 w-6 text-[#7C3AED]" /> Mes défis 1V1</h1>
        <p className="text-[13px] text-zinc-400 mt-1">Uniquement les vrais défis • Faux supprimés</p>

        <div className="mt-6 flex gap-2">
          {["tous","recus","envoyes"].map(t=>(
            <button key={t} onClick={()=>setTab(t as any)} className={`rounded-full px-4 py-2 text-[11px] font-black border ${tab===t ? "bg-white text-black border-white" : "bg-[#15151E] border-[#22222F] text-zinc-400"}`}>{t.toUpperCase()}</button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {filtered.length===0 ? (
            <div className="rounded-2xl border border-[#22222F] bg-[#101015] p-10 text-center">
              <p className="font-bold">Aucun défi</p>
              <p className="text-xs text-zinc-500 mt-1">Va sur /1v1 pour défier un vrai joueur</p>
              <Link href="/1v1" className="mt-4 inline-flex h-9 items-center justify-center rounded-xl bg-white px-4 text-xs font-bold text-black">Défier un joueur</Link>
            </div>
          ) : filtered.map(c=>(
            <div key={c.id} className="rounded-2xl border border-[#22222F] bg-[#15151E] p-4 flex items-center justify-between">
              <div>
                <p className="text-[14px] font-bold">{c.challenger_id===user?.id ? `Tu as défié @${c.opponent_username}` : `@${c.challenger_username} t'a défié`}</p>
                <p className="text-[11px] text-zinc-500 mt-1">{c.stake} FCFA • {new Date(c.created_at).toLocaleDateString("fr-FR")} • {c.status}</p>
              </div>
              <div className="flex gap-2">
                {c.opponent_id===user?.id && c.status==="pending" && (
                  <>
                    <button onClick={()=>acceptChallenge(c.id)} className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300"><Check className="h-4 w-4" /></button>
                    <button className="h-9 w-9 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-300"><X className="h-4 w-4" /></button>
                  </>
                )}
                <Link href={`/1v1/${c.id}`} className="h-9 px-3 rounded-xl bg-[#101015] border border-[#22222F] flex items-center justify-center text-[11px]">Voir</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
