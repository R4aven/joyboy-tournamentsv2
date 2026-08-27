
export type PromoCode = { id: string; code: string; discount_type: 'percent'|'fixed'; discount_value: number; max_uses: number; used_count: number; active: boolean; expires_at?: string; };

export function calculateDiscountedPrice(originalPrice: number, promo: PromoCode): { finalPrice: number; discount: number } {
  if (!promo.active) return { finalPrice: originalPrice, discount: 0 };
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) return { finalPrice: originalPrice, discount: 0 };
  if (promo.used_count >= promo.max_uses) return { finalPrice: originalPrice, discount: 0 };
  let discount = 0;
  if (promo.discount_type === 'percent') {
    discount = Math.round((originalPrice * promo.discount_value) / 100);
  } else {
    discount = promo.discount_value;
  }
  const finalPrice = Math.max(0, originalPrice - discount);
  return { finalPrice, discount };
}

export async function validatePromoCode(supabase: any, code: string): Promise<{ valid: boolean; promo?: PromoCode; error?: string }> {
  if (!code || code.trim().length < 2) return { valid: false, error: "Code vide" };
  const { data, error } = await supabase.from("promo_codes").select("*").ilike("code", code.trim()).eq("active", true).maybeSingle();
  if (error) return { valid: false, error: error.message };
  if (!data) return { valid: false, error: "Code invalide ou expire" };
  const promo = data as PromoCode;
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) return { valid: false, error: "Code expire" };
  if (promo.used_count >= promo.max_uses) return { valid: false, error: "Code epuise" };
  return { valid: true, promo };
}
