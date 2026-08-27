
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Promo = {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  badge_text?: string;
  cta_text?: string;
  cta_link?: string;
  background_color?: string;
  text_color?: string;
  image_url?: string;
};

export default function PromoBanner() {
  const supabase = createClient();
  const [promos, setPromos] = useState<Promo[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("promos").select("*").eq("is_active", true).order("display_order",{ascending:true}).order("created_at",{ascending:false}).limit(10);
      if (data) setPromos(data);
    };
    load();
    // Realtime
    const channel = supabase.channel("promos-banner").on("postgres_changes",{event:"*", schema:"public", table:"promos"}, load).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (promos.length <= 1) return;
    const interval = setInterval(() => setCurrent((c) => (c + 1) % promos.length), 4000);
    return () => clearInterval(interval);
  }, [promos.length]);

  if (promos.length === 0) return null;

  const promo = promos[current];

  return (
    <div className="relative w-full h-[52px] overflow-hidden flex items-center text-white transition-all duration-500" style={{ backgroundColor: promo.background_color || "#E30613", color: promo.text_color || "#fff" }}>
      {/* Background pattern like your image */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_50%)]" />
      
      <div className="relative mx-auto max-w-7xl w-full px-4 md:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 md:gap-6 min-w-0">
          {promo.subtitle && <span className="hidden md:flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase opacity-90 whitespace-nowrap"><span className="h-1.5 w-1.5 rounded-full bg-white" />{promo.subtitle}</span>}
          <h2 className="font-black text-[15px] md:text-[18px] leading-none tracking-tight truncate">{promo.title}</h2>
          {promo.badge_text && <span className="hidden md:inline-flex bg-white text-[11px] font-black px-3 py-1 rounded-full whitespace-nowrap" style={{ color: promo.background_color || "#E30613" }}>{promo.badge_text}</span>}
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          {promo.cta_text && (
            <Link href={promo.cta_link || "/tournaments"} className="text-[11px] md:text-[12px] font-bold underline underline-offset-4 hover:opacity-80 whitespace-nowrap">
              {promo.cta_text}
            </Link>
          )}
          {promo.image_url && <img src={promo.image_url} alt="" className="hidden md:block h-[52px] w-auto object-contain ml-2" />}
        </div>
      </div>

      {/* Dots if multiple promos - auto scroll like in your image */}
      {promos.length > 1 && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1.5">
          {promos.map((_, i) => (
            <button key={i} onClick={()=>setCurrent(i)} className={`h-1.5 rounded-full transition-all ${i===current ? "w-6 bg-white" : "w-1.5 bg-white/40"}`} />
          ))}
        </div>
      )}
    </div>
  );
}
