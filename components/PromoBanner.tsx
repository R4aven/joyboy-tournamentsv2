"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Promo = {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  badge_text: string | null;
  cta_text: string | null;
  cta_link: string | null;
  background_color: string | null;
  image_url: string | null;
  code: string | null;
  discount_percent: number | null;
  is_active: boolean;
  display_order: number | null;
};

export default function PromoBanner() {
  const supabase = createClient();

  const [promos, setPromos] = useState<Promo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const { data, error } = await supabase
        .from("promos")
        .select(
          "id,type,title,subtitle,badge_text,cta_text,cta_link,background_color,image_url,code,discount_percent,is_active,display_order"
        )
        .eq("is_active", true)
        .order("display_order", {
          ascending: true,
          nullsFirst: false,
        })
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "[PROMO BANNER] load:",
          error
        );
        return;
      }

      if (!mounted) return;

      const activePromos = (data || []) as Promo[];

      setPromos(activePromos);

      setCurrentIndex((previous) => {
        if (activePromos.length === 0) {
          return 0;
        }

        return Math.min(
          previous,
          activePromos.length - 1
        );
      });
    };

    load();

    const channel = supabase
      .channel("promo-banner-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "promos",
        },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  /*
   * Défilement automatique toutes les 4 secondes.
   * Rien ne défile s'il n'y a qu'une seule bannière.
   */
  useEffect(() => {
    if (promos.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setCurrentIndex((index) => {
        return (index + 1) % promos.length;
      });
    }, 4000);

    return () => {
      window.clearInterval(timer);
    };
  }, [promos.length]);

  if (promos.length === 0) {
    return null;
  }

  const promo =
    promos[currentIndex] || promos[0];

  const background =
    promo.background_color || "#E30613";

  const hasCode = !!promo.code;

  return (
    <div
      className="w-full border-b border-white/10 text-white overflow-hidden"
      style={{
        backgroundColor: background,
      }}
    >
      <div
        className="relative"
        style={
          promo.image_url
            ? {
                backgroundImage: `linear-gradient(90deg, ${background}F2 0%, ${background}CC 55%, ${background}80 100%), url("${promo.image_url}")`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <div className="mx-auto max-w-7xl px-4 py-2.5 sm:py-3">
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-center">
            {promo.badge_text && (
              <span className="rounded-full bg-black/20 border border-white/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                {promo.badge_text}
              </span>
            )}

            <div className="min-w-0">
              <div className="text-sm sm:text-base font-black leading-tight">
                {promo.title}
              </div>

              {promo.subtitle && (
                <div className="text-[10px] sm:text-[11px] text-white/75 leading-tight mt-0.5">
                  {promo.subtitle}
                </div>
              )}
            </div>

            {promo.discount_percent !== null &&
              promo.discount_percent !== undefined && (
                <span className="rounded-full bg-white text-black px-2.5 py-1 text-[10px] sm:text-xs font-black">
                  -{promo.discount_percent}%
                </span>
              )}

            {hasCode && (
              <span className="rounded-lg bg-black/20 border border-white/15 px-2.5 py-1.5 text-[10px] sm:text-xs font-mono font-black">
                {promo.code}
              </span>
            )}

            {hasCode && (
              <button
                type="button"
                onClick={() => {
                  if (!promo.code) return;

                  navigator.clipboard
                    ?.writeText(promo.code)
                    .catch(() => {});
                }}
                className="rounded-lg bg-white text-black px-3 py-1.5 text-[10px] sm:text-xs font-black hover:bg-zinc-100 transition"
              >
                Copier
              </button>
            )}

            {promo.cta_link && (
              <Link
                href={promo.cta_link}
                className="rounded-lg border border-white/20 bg-black/15 px-3 py-1.5 text-[10px] sm:text-xs font-black hover:bg-black/25 transition"
              >
                {promo.cta_text || "Voir →"}
              </Link>
            )}
          </div>

          {promos.length > 1 && (
            <div className="mt-2 flex justify-center gap-1.5">
              {promos.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Afficher la bannière ${index + 1}`}
                  onClick={() =>
                    setCurrentIndex(index)
                  }
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentIndex
                      ? "w-6 bg-white"
                      : "w-1.5 bg-white/35"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}