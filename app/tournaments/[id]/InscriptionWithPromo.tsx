
"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import PromoCodeInput from "@/components/promo/PromoCodeInput";
import { validatePromoCode, calculateDiscountedPrice } from "@/lib/promo/promoLogic";
import { toast } from "sonner";

export default function TournamentInscription({ tournamentId, price }: { tournamentId: string; price: number }) {
  const supabase = createClient();
  const [promo, setPromo] = useState<any>(null);
  const [finalPrice, setFinalPrice] = useState(price);
  const [discount, setDiscount] = useState(0);
  const [userPromo, setUserPromo] = useState<string>("");

  useEffect(() => {
    const loadUserPromo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("promo_code").eq("id", user.id).maybeSingle();
      if (data?.promo_code) {
        setUserPromo(data.promo_code);
        const { valid, promo: p } = await validatePromoCode(supabase, data.promo_code);
        if (valid && p) {
          const { finalPrice: fp, discount: d } = calculateDiscountedPrice(price, p);
          setPromo(p); setFinalPrice(fp); setDiscount(d);
        }
      }
    };
    loadUserPromo();
  }, [price]);

  const handleValid = (p: any, fp: number, d: number) => { setPromo(p); setFinalPrice(fp); setDiscount(d); };

  const handleInscription = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Connecte-toi"); return; }
    // Inscription avec prix reduit
    const { error } = await supabase.from("tournament_participants").insert({ tournament_id: tournamentId, user_id: user.id, price_paid: finalPrice, promo_code_used: promo?.code||null, discount_applied: discount });
    if (error) toast.error(error.message);
    else {
      if (promo) {
        await supabase.from("promo_codes").update({ used_count: (promo.used_count||0)+1 }).eq("id", promo.id);
        await supabase.from("promo_code_usages").insert({ promo_code_id: promo.id, user_id: user.id, tournament_id: tournamentId, discount_applied: discount, original_price: price, final_price: finalPrice });
      }
      toast.success(`Inscrit avec prix ${finalPrice}F (reduction ${discount}F) ✅`);
    }
  };

  return (
    <div className="space-y-4">
      <PromoCodeInput originalPrice={price} onValidPromo={handleValid} initialCode={userPromo} />
      <div className="rounded-xl bg-[#101015] border border-zinc-800 p-4 flex items-center justify-between">
        <div><p className="text-xs text-zinc-500">Prix final</p><p className="text-lg font-black">{finalPrice}F {discount>0 && <span className="text-sm text-emerald-400">(-{discount}F)</span>}</p></div>
        <button onClick={handleInscription} className="rounded-xl bg-white text-black px-6 py-2.5 text-sm font-bold">S'inscrire {finalPrice}F</button>
      </div>
    </div>
  );
}
