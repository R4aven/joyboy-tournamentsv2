"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type BannerItem = {
  id: string;
  source: "promo" | "code";
  title: string;
  subtitle?: string | null;
  badge_text?: string | null;
  cta_text?: string | null;
  cta_link?: string | null;
  background_color: string;
  text_color: string;
  image_url?: string | null;
  code?: string | null;
  discount_percent?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
};

function isCurrentlyActive(
  startsAt?: string | null,
  endsAt?: string | null
) {
  const now = Date.now();

  const startOk =
    !startsAt ||
    new Date(startsAt).getTime() <= now;

  const endOk =
    !endsAt ||
    new Date(endsAt).getTime() > now;

  return startOk && endOk;
}

export default function PromoBanner() {
  const supabase = createClient();

  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const loadBanners = async () => {
    try {
      /* --------------------------------------------------
       * 1. BANNIERES PERSONNALISEES
       * Table : promos
       * -------------------------------------------------- */
      const { data: promoData, error: promoError } =
        await supabase
          .from("promos")
          .select(
            "id,type,title,subtitle,badge_text,cta_text,cta_link,background_color,text_color,image_url,code,discount_percent,is_active,display_order,starts_at,ends_at,created_at"
          )
          .eq("is_active", true)
          .order("display_order", {
            ascending: true,
            nullsFirst: false,
          })
          .order("created_at", {
            ascending: false,
          });

      if (promoError) {
        console.error(
          "[PROMO BANNER] erreur promos:",
          promoError
        );
      }

      /* --------------------------------------------------
       * 2. CODES PROMO REELS
       * Table : promo_codes
       * -------------------------------------------------- */
      const {
        data: codeData,
        error: codeError,
      } = await supabase
        .from("promo_codes")
        .select(
          "id,code,discount_type,discount_value,max_uses,used_count,active,starts_at,expires_at,show_banner"
        )
        .eq("active", true)
        .eq("show_banner", true)
        .order("created_at", {
          ascending: false,
        })
        .limit(50);

      if (codeError) {
        console.error(
          "[PROMO BANNER] erreur promo_codes:",
          codeError
        );
      }

      const customBanners: BannerItem[] =
        (promoData || [])
          .filter((p: any) =>
            isCurrentlyActive(
              p.starts_at,
              p.ends_at
            )
          )
          .map((p: any) => ({
            id: `promo-${p.id}`,
            source: "promo",
            title:
              p.title ||
              "Promotion",
            subtitle:
              p.subtitle || null,
            badge_text:
              p.badge_text || null,
            cta_text:
              p.cta_text || null,
            cta_link:
              p.cta_link || null,
            background_color:
              p.background_color ||
              "#7C3AED",
            text_color:
              p.text_color ||
              "#FFFFFF",
            image_url:
              p.image_url || null,
            code:
              p.code || null,
            discount_percent:
              p.discount_percent ??
              null,
            starts_at:
              p.starts_at || null,
            ends_at:
              p.ends_at || null,
          }));

      const codeBanners: BannerItem[] =
        (codeData || [])
          .filter((c: any) => {
            const availableUses =
              !c.max_uses ||
              c.max_uses <= 0 ||
              Number(c.used_count || 0) <
                Number(c.max_uses);

            return (
              availableUses &&
              isCurrentlyActive(
                c.starts_at,
                c.expires_at
              )
            );
          })
          .map((c: any) => ({
            id: `code-${c.id}`,
            source: "code",
            title:
              "Offre spéciale",
            subtitle:
              "Profite de cette réduction sur ton inscription",
            badge_text:
              "PROMOTION",
            cta_text:
              "Voir les tournois →",
            cta_link:
              "/tournaments",
            background_color:
              "#7C3AED",
            text_color:
              "#FFFFFF",
            image_url:
              null,
            code:
              c.code,
            discount_percent:
              c.discount_type === "percent"
                ? Number(c.discount_value)
                : null,
          }));

      /*
       * Les bannières personnalisées sont prioritaires.
       * Les codes réels viennent ensuite.
       */
      const combined = [
        ...customBanners,
        ...codeBanners,
      ];

      if (!combined.length) {
        setBanners([]);
        setCurrentIndex(0);
        return;
      }

      setBanners(combined);

      setCurrentIndex((previous) =>
        Math.min(
          previous,
          combined.length - 1
        )
      );
    } catch (error) {
      console.error(
        "[PROMO BANNER] erreur générale:",
        error
      );
    }
  };

  useEffect(() => {
    loadBanners();

    const promosChannel = supabase
      .channel("promo-banner-promos")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "promos",
        },
        () => {
          loadBanners();
        }
      )
      .subscribe();

    const codesChannel = supabase
      .channel("promo-banner-codes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "promo_codes",
        },
        () => {
          loadBanners();
        }
      )
      .subscribe();

    const refreshTimer =
      window.setInterval(() => {
        loadBanners();
      }, 30000);

    return () => {
      supabase.removeChannel(
        promosChannel
      );

      supabase.removeChannel(
        codesChannel
      );

      window.clearInterval(
        refreshTimer
      );
    };
  }, []);

  /* --------------------------------------------------
   * DEFILEMENT AUTOMATIQUE : 4 SECONDES
   * -------------------------------------------------- */
  useEffect(() => {
    if (banners.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setCurrentIndex((index) =>
        (index + 1) % banners.length
      );
    }, 4000);

    return () => {
      window.clearInterval(timer);
    };
  }, [banners.length]);

  if (!banners.length) {
    return null;
  }

  const banner =
    banners[currentIndex] ||
    banners[0];

  const background =
    banner.background_color ||
    "#7C3AED";

  const textColor =
    banner.text_color ||
    "#FFFFFF";

  const discountLabel =
    banner.discount_percent !==
      null &&
    banner.discount_percent !==
      undefined
      ? `-${banner.discount_percent}%`
      : null;

  const copyCode = async () => {
    if (!banner.code) return;

    try {
      await navigator.clipboard.writeText(
        banner.code
      );
    } catch (error) {
      console.error(
        "[PROMO BANNER] copie impossible:",
        error
      );
    }
  };

  return (
    <div
      className="w-full border-b border-white/10 overflow-hidden"
      style={{
        color: textColor,
        backgroundColor:
          background,
      }}
    >
      <div
        className="relative"
        style={
          banner.image_url
            ? {
                backgroundImage:
                  `linear-gradient(90deg, ${background}F2 0%, ${background}CC 55%, ${background}80 100%), url("${banner.image_url}")`,
                backgroundSize:
                  "cover",
                backgroundPosition:
                  "center",
              }
            : undefined
        }
      >
        <div className="mx-auto max-w-7xl px-4 py-2.5 sm:py-3">
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-center">
            {banner.badge_text && (
              <span className="rounded-full bg-black/20 border border-white/20 px-2.5 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
                {banner.badge_text}
              </span>
            )}

            <div className="min-w-0">
              <div className="text-sm sm:text-base font-black leading-tight">
                {banner.title}
              </div>

              {banner.subtitle && (
                <div className="text-[10px] sm:text-[11px] opacity-75 leading-tight mt-0.5">
                  {banner.subtitle}
                </div>
              )}
            </div>

            {discountLabel && (
              <span className="rounded-full bg-white text-black px-2.5 py-1 text-[10px] sm:text-xs font-black">
                {discountLabel}
              </span>
            )}

            {banner.code && (
              <span className="rounded-lg bg-black/20 border border-white/20 px-2.5 py-1.5 text-[10px] sm:text-xs font-mono font-black">
                {banner.code}
              </span>
            )}

            {banner.code && (
              <button
                type="button"
                onClick={copyCode}
                className="rounded-lg bg-white text-black px-3 py-1.5 text-[10px] sm:text-xs font-black hover:bg-zinc-100 transition"
              >
                Copier
              </button>
            )}

            {banner.cta_link && (
              <Link
                href={banner.cta_link}
                className="rounded-lg border border-white/25 bg-black/10 px-3 py-1.5 text-[10px] sm:text-xs font-black hover:bg-black/20 transition"
              >
                {banner.cta_text ||
                  "Voir →"}
              </Link>
            )}
          </div>

          {banners.length > 1 && (
            <div className="mt-2 flex justify-center gap-1.5">
              {banners.map(
                (item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={`Afficher la bannière ${
                      index + 1
                    }`}
                    onClick={() =>
                      setCurrentIndex(
                        index
                      )
                    }
                    className={
                      index ===
                      currentIndex
                        ? "h-1.5 w-6 rounded-full bg-white transition-all"
                        : "h-1.5 w-1.5 rounded-full bg-white/35 transition-all"
                    }
                  />
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}