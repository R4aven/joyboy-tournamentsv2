
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2, Plus, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function AdminPromosPage() {
  const supabase = createClient();
  const [promos, setPromos] = useState<any[]>([]);
  const [form, setForm] = useState({ type:"PROMO", title:"", subtitle:"", badge_text:"", cta_text:"J'achète maintenant →", cta_link:"/tournaments", background_color:"#E30613", image_url:"", code:"", discount_percent:"" });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("promos").select("*").order("display_order").order("created_at",{ascending:false});
    if (data) setPromos(data);
    setLoading(false);
  };
  useEffect(()=>{ load(); },[]);

  const handleAdd = async () => {
    if (!form.title) { toast.error("Titre obligatoire"); return; }
    const { error } = await supabase.from("promos").insert({ ...form, discount_percent: form.discount_percent ? parseInt(form.discount_percent) : null, display_order: promos.length+1 });
    if (error) toast.error(error.message);
    else { toast.success("Promo ajoutée - visible en haut du site public en temps réel !"); setForm({ type:"PROMO", title:"", subtitle:"", badge_text:"", cta_text:"J'achète maintenant →", cta_link:"/tournaments", background_color:"#E30613", image_url:"", code:"", discount_percent:"" }); load(); }
  };

  const toggleActive = async (id:string, is_active:boolean) => {
    await supabase.from("promos").update({ is_active: !is_active }).eq("id", id);
    load();
  };
  const deletePromo = async (id:string) => {
    if (!confirm("Supprimer ?")) return;
    await supabase.from("promos").delete().eq("id", id);
    load();
  };

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-black">Bannières Promo / Événements / Codes</h1>
      <p className="text-sm text-zinc-400 mt-1">Comme ton image SOLDES, mais mince en haut du site. Si plusieurs, ça défile auto.</p>

      <div className="mt-6 rounded-2xl border border-zinc-800 bg-[#101015] p-5">
        <h2 className="font-bold text-sm flex items-center gap-2"><Plus className="h-4 w-4" /> Ajouter</h2>
        <div className="mt-4 grid md:grid-cols-2 gap-3">
          <select value={form.type} onChange={e=>setForm({...form, type:e.target.value})} className="rounded-xl bg-[#15151E] border border-zinc-800 px-3 py-2.5 text-sm">
            <option>PROMO</option><option>EVENT</option><option>CODE</option><option>SOLDES</option><option>TOURNOI</option><option>INFO</option>
          </select>
          <input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} placeholder="Titre ex: On casse les prix" className="rounded-xl bg-[#15151E] border border-zinc-800 px-3 py-2.5 text-sm" />
          <input value={form.subtitle} onChange={e=>setForm({...form, subtitle:e.target.value})} placeholder="Sous-titre ex: SOLDES DES VACANCES" className="rounded-xl bg-[#15151E] border border-zinc-800 px-3 py-2.5 text-sm" />
          <input value={form.badge_text} onChange={e=>setForm({...form, badge_text:e.target.value})} placeholder="Badge ex: Jusqu'à 70%" className="rounded-xl bg-[#15151E] border border-zinc-800 px-3 py-2.5 text-sm" />
          <input value={form.cta_text} onChange={e=>setForm({...form, cta_text:e.target.value})} placeholder="CTA ex: J'achète maintenant →" className="rounded-xl bg-[#15151E] border border-zinc-800 px-3 py-2.5 text-sm" />
          <input value={form.cta_link} onChange={e=>setForm({...form, cta_link:e.target.value})} placeholder="Lien ex: /tournaments" className="rounded-xl bg-[#15151E] border border-zinc-800 px-3 py-2.5 text-sm" />
          <div className="flex gap-2"><input type="color" value={form.background_color} onChange={e=>setForm({...form, background_color:e.target.value})} className="h-10 w-16 rounded-xl" /><input value={form.background_color} onChange={e=>setForm({...form, background_color:e.target.value})} className="flex-1 rounded-xl bg-[#15151E] border border-zinc-800 px-3 py-2.5 text-sm" /></div>
          <input value={form.image_url} onChange={e=>setForm({...form, image_url:e.target.value})} placeholder="Image URL (optionnel) - couple avec SOLDES" className="rounded-xl bg-[#15151E] border border-zinc-800 px-3 py-2.5 text-sm md:col-span-2" />
          <input value={form.code} onChange={e=>setForm({...form, code:e.target.value})} placeholder="Code promo ex: JOYBOY20 (si type CODE)" className="rounded-xl bg-[#15151E] border border-zinc-800 px-3 py-2.5 text-sm" />
          <input value={form.discount_percent} onChange={e=>setForm({...form, discount_percent:e.target.value})} placeholder="% réduction ex: 20" className="rounded-xl bg-[#15151E] border border-zinc-800 px-3 py-2.5 text-sm" />
        </div>
        <button onClick={handleAdd} className="mt-4 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-bold text-white">Ajouter bannière</button>
        <p className="mt-2 text-[11px] text-zinc-500">Couleur de ton image: #E30613 rouge. Hauteur: 52px mince en haut.</p>
      </div>

      <div className="mt-8">
        <h2 className="font-bold text-sm">Bannières actives ({promos.length}) - défile auto si plusieurs</h2>
        {loading ? <p className="mt-4 text-zinc-500">Chargement...</p> : promos.length===0 ? <p className="mt-4 text-zinc-500">Aucune bannière - crée la première, elle apparaîtra en haut du site public direct</p> : (
          <div className="mt-4 space-y-3">
            {promos.map(p=>(
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-[#101015] p-4" style={{ borderLeft: `4px solid ${p.background_color}` }}>
                <div><p className="font-bold text-sm">{p.type} - {p.title}</p><p className="text-xs text-zinc-500">{p.subtitle} • {p.badge_text} • {p.cta_text} → {p.cta_link} {p.code && `• Code: ${p.code}`}</p></div>
                <div className="flex gap-2">
                  <button onClick={()=>toggleActive(p.id, p.is_active)} className="rounded-xl bg-[#15151E] border border-zinc-800 p-2">{p.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-zinc-500" />}</button>
                  <button onClick={()=>deletePromo(p.id)} className="rounded-xl bg-red-500/10 border border-red-500/20 p-2 text-red-400"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
