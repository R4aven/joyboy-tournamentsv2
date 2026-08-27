
"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { validatePromoCode, calculateDiscountedPrice } from "@/lib/promo/promoLogic";
import { Tag, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PromoCodeInput({ originalPrice, onValidPromo, initialCode }: { originalPrice: number; onValidPromo: (promo: any, finalPrice: number, discount: number)=>void; initialCode?: string }) {
  const supabase = createClient();
  const [code, setCode] = useState(initialCode||"");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ finalPrice: number; discount: number; promo?: any } | null>(null);
  const [error, setError] = useState("");

  const check = async () => {
    if (!code.trim()) { setError("Entre un code"); return; }
    setLoading(true); setError(""); setResult(null);
    const { valid, promo, error: err } = await validatePromoCode(supabase, code);
    if (!valid || !promo) { setError(err||"Code invalide"); setLoading(false); return; }
    const { finalPrice, discount } = calculateDiscountedPrice(originalPrice, promo);
    setResult({ finalPrice, discount, promo });
    onValidPromo(promo, finalPrice, discount);
    toast.success(`Code ${promo.code} applique -${discount}F`);
    setLoading(false);
  };

  return (
    <div className="rounded-2xl border border-dashed border-zinc-700 bg-[#101015] p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-500"><Tag className="h-4 w-4" /> Code promo (optionnel)</div>
      <div className="flex gap-2">
        <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="Ex: JOYBOY10, WELCOME500" className="flex-1 rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2.5 text-sm uppercase" />
        <button onClick={check} disabled={loading} className="rounded-xl bg-white text-black px-5 py-2.5 text-sm font-bold flex items-center gap-2">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Verifier</button>
      </div>
      {error && <p className="text-xs text-red-400 flex items-center gap-1"><X className="h-3 w-3" /> {error}</p>}
      {result && <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs"><p className="text-emerald-300 font-bold">✅ Code {result.promo.code} valide !</p><p className="text-zinc-400 mt-1">Prix original: {originalPrice}F → Final: {result.finalPrice}F (-{result.discount}F) {result.promo.discount_type==='percent' ? `(${result.promo.discount_value}%)` : ""}</p></div>}
      <p className="text-[11px] text-zinc-600">Optionnel - si tu as un code promo mis dans admin, tu payes moins. Ex: JOYBOY10 = -10%</p>
    </div>
  );
}
