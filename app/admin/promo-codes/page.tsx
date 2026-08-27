
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tag, Plus, Trash2, Edit, Check, X, Gift } from "lucide-react";
import { toast } from "sonner";

type Promo = { id: string; code: string; discount_type: 'percent'|'fixed'; discount_value: number; max_uses: number; used_count: number; active: boolean; expires_at?: string; description?: string; created_at?: string; };

export default function AdminPromoCodesPage() {
  const supabase = createClient();
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ code: "", discount_type: "percent" as any, discount_value: 10, max_uses: 100, description: "", active: true });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false });
    if (data) setPromos(data as Promo[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.code) return toast.error("Code requis");
    const { error } = await supabase.from("promo_codes").insert({ code: form.code.toUpperCase().trim(), discount_type: form.discount_type, discount_value: form.discount_value, max_uses: form.max_uses, description: form.description, active: form.active });
    if (error) toast.error(error.message); else { toast.success("Code cree"); setForm({ code: "", discount_type: "percent", discount_value: 10, max_uses: 100, description: "", active: true }); load(); }
  };

  const toggleActive = async (p: Promo) => {
    await supabase.from("promo_codes").update({ active: !p.active }).eq("id", p.id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce code ?")) return;
    await supabase.from("promo_codes").delete().eq("id", id);
    load();
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-black flex items-center gap-3"><Tag className="h-7 w-7 text-violet-500" /> Codes Promo - Admin - Reduit prix tournois</h1>
      
      <div className="rounded-2xl border border-zinc-800 bg-[#101015] p-6 space-y-4">
        <h3 className="font-bold flex items-center gap-2"><Plus className="h-4 w-4" /> Creer nouveau code promo (mis dans admin, marche a l'inscription)</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div><label className="text-xs uppercase text-zinc-500">Code</label><input value={form.code} onChange={e=>setForm({...form, code: e.target.value.toUpperCase()})} placeholder="Ex: JOYBOY20" className="mt-1 w-full rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2.5 text-sm" /></div>
          <div><label className="text-xs uppercase text-zinc-500">Type</label><select value={form.discount_type} onChange={e=>setForm({...form, discount_type: e.target.value as any})} className="mt-1 w-full rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2.5 text-sm"><option value="percent">% Pourcent</option><option value="fixed">F Fixe</option></select></div>
          <div><label className="text-xs uppercase text-zinc-500">Valeur</label><input type="number" value={form.discount_value} onChange={e=>setForm({...form, discount_value: parseInt(e.target.value)||0})} className="mt-1 w-full rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2.5 text-sm" /></div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className="text-xs uppercase text-zinc-500">Max utilisations</label><input type="number" value={form.max_uses} onChange={e=>setForm({...form, max_uses: parseInt(e.target.value)||0})} className="mt-1 w-full rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2.5 text-sm" /></div>
          <div><label className="text-xs uppercase text-zinc-500">Description</label><input value={form.description} onChange={e=>setForm({...form, description: e.target.value})} placeholder="Ex: 20% bienvenue" className="mt-1 w-full rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2.5 text-sm" /></div>
        </div>
        <button onClick={create} className="rounded-xl bg-white text-black px-6 py-2.5 text-sm font-bold">Creer code promo</button>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-[#101015] overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between"><h3 className="font-bold">Codes existants ({promos.length})</h3><span className="text-xs text-zinc-500">Codes qui marchent - reduit prix tournois inscription</span></div>
        <div className="divide-y divide-zinc-800/50">
          {promos.map(p=>(
            <div key={p.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs ${p.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-500'}`}><Gift className="h-5 w-5" /></div>
                <div><p className="font-bold flex items-center gap-2">{p.code} {p.active ? <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">ACTIF</span> : <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded-full">INACTIF</span>}</p><p className="text-xs text-zinc-500">{p.description} • {p.discount_type==='percent' ? `${p.discount_value}%` : `${p.discount_value}F`} • {p.used_count}/{p.max_uses} utilises</p></div>
              </div>
              <div className="flex gap-2"><button onClick={()=>toggleActive(p)} className="rounded-lg bg-[#15151E] border border-zinc-800 p-2">{p.active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}</button><button onClick={()=>remove(p.id)} className="rounded-lg bg-red-500/10 border border-red-500/20 p-2 text-red-400"><Trash2 className="h-4 w-4" /></button></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
