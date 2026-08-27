
"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import PromoCodeInput from "@/components/promo/PromoCodeInput";
import { validatePromoCode } from "@/lib/promo/promoLogic";

export default function RegisterPage() {
  const supabase = createClient();
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "", city: "Abidjan", efootball_pseudo: "", promo_code: "" });
  const [promoValid, setPromoValid] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let promoToSave = null;
      let discount = 0;
      if (form.promo_code) {
        const { valid, promo } = await validatePromoCode(supabase, form.promo_code);
        if (valid && promo) { promoToSave = promo; discount = promo.discount_type==='percent' ? promo.discount_value : promo.discount_value; }
        else { toast.error("Code promo invalide, mais inscription continue sans code"); }
      }

      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { username: form.username, city: form.city, efootball_pseudo: form.efootball_pseudo, promo_code: form.promo_code } }
      });
      if (error) throw error;

      if (data.user) {
        // Sauve promo_code dans profiles
        await supabase.from("profiles").upsert({
          id: data.user.id,
          username: form.username,
          display_name: form.username,
          city: form.city,
          efootball_pseudo: form.efootball_pseudo,
          promo_code: promoToSave?.code || form.promo_code || null,
          promo_discount: discount,
          email: form.email
        });

        // Incremente used_count si promo valide
        if (promoToSave) {
          await supabase.from("promo_codes").update({ used_count: (promoToSave.used_count||0)+1 }).eq("id", promoToSave.id);
          await supabase.from("promo_code_usages").insert({ promo_code_id: promoToSave.id, user_id: data.user.id, discount_applied: discount });
        }
      }

      toast.success("Compte cree" + (promoToSave ? ` avec code ${promoToSave.code} - reduction tournois active ✅` : " ✅"));
      router.push("/login");
    } catch (e:any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#08080B] flex items-center justify-center p-4">
      <form onSubmit={handleRegister} className="w-full max-w-md rounded-[24px] border border-zinc-800 bg-[#101015] p-6 space-y-4">
        <h1 className="text-2xl font-black">Inscription JOYBOY</h1>
        <input value={form.username} onChange={e=>setForm({...form, username: e.target.value})} placeholder="Pseudo" className="w-full rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2.5 text-sm" required />
        <input value={form.email} onChange={e=>setForm({...form, email: e.target.value})} placeholder="Email" type="email" className="w-full rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2.5 text-sm" required />
        <input value={form.password} onChange={e=>setForm({...form, password: e.target.value})} placeholder="Mot de passe" type="password" className="w-full rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2.5 text-sm" required />
        <div className="grid grid-cols-2 gap-3"><input value={form.city} onChange={e=>setForm({...form, city: e.target.value})} placeholder="Ville" className="rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2.5 text-sm" /><input value={form.efootball_pseudo} onChange={e=>setForm({...form, efootball_pseudo: e.target.value})} placeholder="Pseudo eFootball" className="rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2.5 text-sm" /></div>
        
        {/* Code promo optionnel */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-zinc-500">Code promo (optionnel) - reduit prix tournois</label>
          <div className="flex gap-2">
            <input value={form.promo_code} onChange={e=>setForm({...form, promo_code: e.target.value.toUpperCase()})} placeholder="Ex: JOYBOY10 (optionnel)" className="flex-1 rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2.5 text-sm uppercase" />
          </div>
          {form.promo_code && <p className="text-[11px] text-zinc-500">Code mis dans admin qui marche - si valide, prix tournois reduit auto</p>}
        </div>

        {/* Composant verif visuelle */}
        {form.promo_code && <PromoCodeInput originalPrice={2000} onValidPromo={(promo, final, disc)=>{ setPromoValid(promo); setForm({...form, promo_code: promo.code}); }} initialCode={form.promo_code} />}

        <button disabled={loading} className="w-full rounded-xl bg-white text-black py-3 text-sm font-black">{loading ? "Creation..." : "Creer compte" + (promoValid ? ` avec -${promoValid.discount_value}${promoValid.discount_type==='percent' ? '%' : 'F'}` : "")}</button>
        <p className="text-[11px] text-zinc-600 text-center">Deja un compte ? <a href="/login" className="underline">Connexion</a></p>
      </form>
    </div>
  );
}
