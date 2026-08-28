"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function PromoBanner(){
 const supabase=createClient(); const [promo,setPromo]=useState<any>(null);
 useEffect(()=>{const load=async()=>{const {data}=await supabase.from("promo_codes").select("id,code,discount_type,discount_value,max_uses,used_count,active,starts_at,expires_at,show_banner,tournament_ids").eq("active",true).eq("show_banner",true).order("created_at",{ascending:false}).limit(20); const now=Date.now(); const p=(data||[]).find((x:any)=>(!x.starts_at||new Date(x.starts_at).getTime()<=now)&&(!x.expires_at||new Date(x.expires_at).getTime()>now)&&(!x.max_uses||x.max_uses<=0||x.used_count<x.max_uses)); setPromo(p||null)}; load(); const ch=supabase.channel("promo-banner-final").on("postgres_changes",{event:"*",schema:"public",table:"promo_codes"},load).subscribe(); return()=>{supabase.removeChannel(ch)}} ,[]);
 if(!promo)return null; const discount=promo.discount_type==="percent"?`-${promo.discount_value}%`:`-${promo.discount_value} FCFA`;
 return <div className="w-full border-b border-violet-500/20 bg-gradient-to-r from-violet-700/80 via-[#11111A] to-cyan-700/70 text-white"><div className="mx-auto max-w-7xl px-4 py-3 flex flex-wrap items-center justify-center gap-3 text-center"><span className="text-xs font-black uppercase tracking-widest">🔥 PROMOTION JOYBOY</span><span className="text-sm font-bold">{discount} sur l'inscription</span><span className="rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-black">Code : {promo.code}</span><button onClick={()=>navigator.clipboard?.writeText(promo.code)} className="rounded-lg bg-white text-black px-3 py-1.5 text-xs font-black">Copier le code</button><Link href="/tournaments" className="text-xs font-black underline underline-offset-4">Participer</Link></div></div>
}
