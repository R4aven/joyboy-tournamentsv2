
"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Upload, Check, Copy, Wallet, AlertCircle, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export default function TournamentPaymentPage() {
  const params = useParams();
  const [file, setFile] = useState<File|null>(null);
  const [preview, setPreview] = useState<string|null>(null);
  const [sent, setSent] = useState(false);
  const amount = 1000;

  const handleFile = (f: File) => {
    if (!["image/jpeg","image/png","image/jpg","image/webp"].includes(f.type)) { toast.error("Format invalide. JPG, PNG, WEBP uniquement."); return; }
    if (f.size > 5*1024*1024) { toast.error("Fichier trop lourd (max 5Mo)"); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = () => {
    if (!file) { toast.error("Ajoute ta capture Wave"); return; }
    setSent(true);
    toast.success("Preuve envoyée ! Vérification en cours.");
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-[#08080B] flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full rounded-[24px] border border-[#22222F] bg-[#15151E] p-8 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center"><Check className="h-8 w-8 text-emerald-400" /></div>
          <h2 className="mt-5 text-[20px] font-black">Ta preuve a bien été envoyée !</h2>
          <p className="mt-2 text-[13px] text-zinc-400">Statut : <span className="font-bold text-amber-300">EN ATTENTE DE VÉRIFICATION</span></p>
          <p className="mt-4 rounded-xl bg-[#101015] border border-[#22222F] p-4 text-[12px] leading-relaxed text-zinc-400">L'admin vérifie ton paiement Wave. Tu recevras une notification : <span className="font-bold text-white">Ton paiement est en cours de vérification</span> puis <span className="font-bold text-emerald-300">Paiement validé • Ta place est confirmée.</span></p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Link href="/tournaments" className="h-11 flex items-center justify-center rounded-xl bg-white text-black text-[12px] font-black">TOURNOIS</Link>
            <Link href="/dashboard" className="h-11 flex items-center justify-center rounded-xl border border-[#22222F] bg-[#101015] text-[12px] font-bold">DASHBOARD</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      <div className="mx-auto max-w-5xl px-6 py-10 grid md:grid-cols-[1.2fr_0.8fr] gap-8">
        <div>
          <Link href={`/tournaments/${params.id}`} className="text-[12px] text-zinc-500 hover:text-white">← Retour tournoi</Link>
          <h1 className="mt-4 text-[28px] font-black tracking-tight flex items-center gap-3"><Wallet className="h-7 w-7 text-[#7C3AED]" /> Paiement Wave</h1>
          <p className="mt-2 text-[13px] text-zinc-400">Envoie ton paiement au numéro officiel ci-dessous, puis upload ta capture.</p>

          <div className="mt-6 rounded-[20px] border border-[#7C3AED]/30 bg-gradient-to-br from-[#7C3AED]/15 to-[#06B6D4]/10 p-6">
            <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Numéro Wave officiel</p>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-black/30 border border-white/10 px-4 py-4">
              <div><p className="text-[22px] font-black tracking-wide">01 51 42 99 18</p><p className="text-[11px] text-zinc-400">E-TOURNOIS CI • Wave CI</p></div>
              <button onClick={()=>{navigator.clipboard.writeText('0151429918'); toast.success('Numéro copié');}} className="h-10 w-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-200"><Copy className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 grid grid-cols-5 gap-2 text-center">
              {[{n:"1",t:"Ouvre Wave"},{n:"2",t:`Envoie ${amount}F`},{n:"3",t:"Capture écran"},{n:"4",t:"Upload ici"},{n:"5",t:"Envoie preuve"}].map(s=>(
                <div key={s.n} className="rounded-xl bg-black/20 border border-white/10 p-2.5"><p className="text-[16px] font-black text-white">{s.n}⃣</p><p className="mt-1 text-[10px] leading-tight text-zinc-400">{s.t}</p></div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-[20px] border border-[#22222F] bg-[#101015] p-6">
            <h3 className="text-[13px] font-black flex items-center gap-2"><Upload className="h-4 w-4" /> Upload ta capture</h3>
            <p className="mt-1 text-[11px] text-zinc-500">JPG, PNG, WEBP • Max 5Mo • Capture lisible avec montant, numéro, date</p>
            <div className="mt-4">
              {!preview ? (
                <label className="flex h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#22222F] bg-[#15151E] hover:border-[#7C3AED]/50 transition">
                  <input type="file" accept="image/jpeg,image/png,image/jpg,image/webp" className="hidden" onChange={e=>{const f=e.target.files?.[0]; if(f) handleFile(f);}} />
                  <ImageIcon className="h-8 w-8 text-zinc-600" />
                  <p className="mt-2 text-[12px] font-bold">Clique pour ajouter ta capture</p>
                  <p className="text-[11px] text-zinc-500">ou glisse-dépose</p>
                </label>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-[#22222F] bg-[#15151E]">
                  <img src={preview} alt="preview" className="max-h-[300px] w-full object-contain bg-black" />
                  <button onClick={()=>{setFile(null); setPreview(null);}} className="absolute right-3 top-3 h-8 w-8 rounded-full bg-black/70 border border-white/10 flex items-center justify-center"><X className="h-4 w-4" /></button>
                  <div className="p-3 flex items-center justify-between"><span className="text-[11px] text-zinc-400 truncate">{file?.name}</span><span className="text-[11px] font-bold">{file ? Math.round(file.size/1024)+' Ko' : ''}</span></div>
                </div>
              )}
            </div>
            <button onClick={submit} disabled={!file} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-[13px] font-black disabled:opacity-40">📸 ENVOYER MA PREUVE • {amount} FCFA</button>
            <p className="mt-3 flex gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-[11px] leading-relaxed text-amber-200"><AlertCircle className="h-4 w-4 shrink-0" /> Assure-toi que le montant ({amount}F), le numéro 01 51 42 99 18 et la date sont visibles. Fausse capture = bannissement définitif.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[20px] border border-[#22222F] bg-[#15151E] p-5">
            <h4 className="text-[12px] font-black uppercase tracking-widest text-zinc-500">Récap</h4>
            <div className="mt-3 space-y-2 text-[13px]"><div className="flex justify-between"><span className="text-zinc-500">Tournoi</span><span className="font-bold">E-TOURNOIS CI CUP #12</span></div><div className="flex justify-between"><span className="text-zinc-500">Montant</span><span className="font-black text-white">{amount} FCFA</span></div><div className="flex justify-between"><span className="text-zinc-500">Méthode</span><span className="font-bold">Wave uniquement</span></div><div className="flex justify-between"><span className="text-zinc-500">Numéro</span><span className="font-bold">01 51 42 99 18</span></div></div>
            <div className="mt-4 rounded-xl bg-[#101015] border border-[#22222F] p-3 text-[11px] text-zinc-400">Après envoi : <span className="font-bold text-amber-300">En attente</span> → <span className="font-bold text-emerald-300">Validé</span> → Ta place est confirmée.</div>
          </div>
          <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-5">
            <h4 className="text-[12px] font-black">Besoin d'aide ?</h4>
            <p className="mt-2 text-[12px] leading-relaxed text-zinc-400">Paiement non reçu, capture floue, problème Wave ? Contacte-nous directement.</p>
            <a href="https://wa.me/2250748235226?text=Bonjour%20E-TOURNOIS CI%20TOURNAMENTS%2C%20j%27ai%20besoin%20d%27aide%20concernant%20mon%20paiement%20tournoi%20${params.id}%20-%20${amount}%20FCFA." target="_blank" className="mt-3 flex h-11 w-full items-center justify-center rounded-xl bg-[#25D366] text-[12px] font-black text-black">💬 WHATSAPP • 07 48 23 52 26</a>
            <p className="mt-2 text-center text-[11px] text-zinc-600">Réponse en &lt; 15 min • 9h-23h</p>
          </div>
        </div>
      </div>
    </div>
  );
}
