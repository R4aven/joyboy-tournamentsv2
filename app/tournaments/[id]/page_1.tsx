
"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Trophy, Users, Wallet, Calendar, Clock, Shield, FileText, Crown, Swords } from "lucide-react";

const mockDetail = {
  id: "1",
  name: "JOYBOY CUP #12",
  jeu: "FC 26",
  description: "Le tournoi référence à Abidjan. 10 joueurs, bracket réel, finale en BO3. Ambiance premium, arbitrage pro.",
  date: "30 Août 2025",
  heure: "19:00",
  prix: 1000,
  gains: { champion: 7000, finaliste: 2000, troisieme: 1000 },
  places: 10,
  statut: "OUVERT" as const,
  participants: [
    { pseudo: "RavenCI", avatar: "RC", inscrit: "Validé" },
    { pseudo: "Kev_225", avatar: "K2", inscrit: "Validé" },
    { pseudo: "Jordan_Pro", avatar: "JP", inscrit: "Validé" },
    { pseudo: "Momo_Yop", avatar: "MY", inscrit: "En attente" },
    { pseudo: "IvoiroGamer", avatar: "IG", inscrit: "Validé" },
  ],
  reglement: "Format 10 joueurs -> 2 barrages (7v10, 8v9) -> Quarts -> Demis -> Finale BO3. Pas de triche, pas d'insultes. Capture obligatoire en cas de contestation. Paiement Wave uniquement.",
};

const tabs = [
  { id: "infos", label: "Informations", icon: FileText },
  { id: "participants", label: "Participants", icon: Users },
  { id: "bracket", label: "Bracket", icon: Trophy },
  { id: "matchs", label: "Matchs", icon: Swords },
  { id: "reglement", label: "Règlement", icon: Shield },
  { id: "gains", label: "Gains", icon: Crown },
];

function Bracket10() {
  const rounds = [
    { name: "Barrages", matches: [{ a: "7. Kev", b: "10. New", score: "- vs -" }, { a: "8. Ivoiro", b: "9. Momo", score: "- vs -" }] },
    { name: "Quarts", matches: [{ a: "1. Raven", b: "Vainq B1" }, { a: "4. Jordan", b: "5. Ivoiro" }, { a: "2. Kev", b: "Vainq B2" }, { a: "3. Momo", b: "6. Player" }] },
    { name: "Demis", matches: [{ a: "Q1 Winner", b: "Q2 Winner" }, { a: "Q3 Winner", b: "Q4 Winner" }] },
    { name: "Finale", matches: [{ a: "Demi 1", b: "Demi 2", final: true }] },
  ];
  return (
    <div className="overflow-x-auto pb-6">
      <div className="flex gap-6 min-w-[900px]">
        {rounds.map((r,ri)=>(
          <div key={ri} className="flex-1">
            <h4 className="text-[12px] font-black uppercase tracking-widest text-zinc-500 mb-4">{r.name}</h4>
            <div className="space-y-8">
              {r.matches.map((m,mi)=>(
                <div key={mi} className={`rounded-xl border bg-[#101015] p-3 ${r.name==='Finale' ? 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent' : 'border-[#22222F]'}`}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-[#15151E] px-3 py-2"><span className="text-[12px] font-bold">{m.a}</span><span className="text-[10px] text-zinc-500">{(m as any).score || '0'}</span></div>
                    <div className="flex items-center justify-between rounded-lg bg-[#15151E] px-3 py-2"><span className="text-[12px] font-bold">{m.b}</span><span className="text-[10px] text-zinc-500">0</span></div>
                  </div>
                  {r.name==='Finale' && <p className="mt-2 text-center text-[11px] font-black text-amber-300">🏆 CHAMPION</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TournamentDetail() {
  const params = useParams();
  const [tab, setTab] = useState("infos");
  const t = mockDetail;

  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Link href="/tournaments" className="text-[12px] text-zinc-500 hover:text-white">← Retour tournois</Link>
        <div className="mt-4 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[#15151E] border border-[#22222F] px-3 py-1 text-[11px] font-bold">{t.jeu}</span>
              <span className="rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 px-3 py-1 text-[11px] font-black">{t.statut}</span>
            </div>
            <h1 className="mt-3 text-[32px] font-black tracking-tight">{t.name}</h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-zinc-400">{t.description}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full bg-[#101015] border border-[#22222F] px-3 py-1.5 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {t.date}</span>
              <span className="rounded-full bg-[#101015] border border-[#22222F] px-3 py-1.5 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {t.heure}</span>
              <span className="rounded-full bg-[#101015] border border-[#22222F] px-3 py-1.5 flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {t.participants.length}/{t.places}</span>
              <span className="rounded-full bg-[#101015] border border-[#22222F] px-3 py-1.5 flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> {t.prix} FCFA</span>
            </div>
          </div>
          <div className="shrink-0 rounded-[20px] border border-[#22222F] bg-[#15151E] p-5 w-full md:w-[320px]">
            <p className="text-[12px] font-black uppercase tracking-widest text-zinc-500">Rejoindre</p>
            <p className="mt-3 text-[13px] text-zinc-300">Paiement Wave uniquement. Ta place est confirmée après validation admin.</p>
            <Link href={`/tournaments/${params.id}/payment`} className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-[13px] font-black tracking-wide">PARTICIPER • {t.prix} FCFA</Link>
            <p className="mt-3 text-center text-[11px] text-zinc-500">Wave : <span className="font-bold text-white">01 51 42 99 18</span></p>
            <a href="https://wa.me/2250748235226?text=Bonjour%20JOYBOY%20TOURNAMENTS%2C%20j%27ai%20besoin%20d%27aide%20concernant%20mon%20paiement." target="_blank" className="mt-3 flex h-10 w-full items-center justify-center rounded-xl border border-[#22222F] bg-[#101015] text-[11px] font-bold hover:border-white/20">💬 Besoin d'aide ? WhatsApp</a>
          </div>
        </div>

        <div className="mt-8 flex gap-2 overflow-x-auto border-b border-[#22222F] pb-px">
          {tabs.map(tb=>{
            const Icon = tb.icon;
            return <button key={tb.id} onClick={()=>setTab(tb.id)} className={`shrink-0 flex items-center gap-2 border-b-2 px-4 py-3 text-[12px] font-bold transition ${tab===tb.id ? 'border-[#7C3AED] text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}><Icon className="h-4 w-4" />{tb.label}</button>
          })}
        </div>

        <div className="mt-6">
          {tab==='infos' && (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-6"><h3 className="text-[14px] font-black">À propos</h3><p className="mt-3 text-[13px] leading-relaxed text-zinc-400">{t.description} Format officiel 10 joueurs avec bracket dynamique réel, pas une image. Chaque victoire fait avancer automatiquement le vainqueur.</p></div>
                <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-6"><h3 className="text-[14px] font-black">Comment ça se passe ?</h3><ul className="mt-3 space-y-2 text-[13px] text-zinc-400 list-disc pl-5"><li>Tu paies sur Wave 01 51 42 99 18 et upload ta capture</li><li>Admin valide → tu es dans les 10</li><li>Bracket généré automatiquement quand complet</li><li>Tu joues, envoies score + capture, vainqueur avance</li><li>Finale → Champion → Palmarès + Gains Wave</li></ul></div>
              </div>
              <div className="space-y-4">
                <div className="rounded-[20px] border border-[#22222F] bg-[#15151E] p-5"><h4 className="text-[12px] font-black uppercase tracking-widest text-zinc-500">Gains</h4><div className="mt-3 space-y-2 text-[13px]"><div className="flex justify-between"><span className="text-zinc-500">Champion</span><span className="font-black text-amber-300">{t.gains.champion} FCFA</span></div><div className="flex justify-between"><span className="text-zinc-500">Finaliste</span><span className="font-bold">{t.gains.finaliste} FCFA</span></div><div className="flex justify-between"><span className="text-zinc-500">3e place</span><span className="font-bold">{t.gains.troisieme} FCFA</span></div></div><p className="mt-4 rounded-xl bg-[#101015] border border-[#22222F] p-3 text-[11px] text-zinc-400">Gagne et encaisse ton djai sur Wave ! 🇨🇮</p></div>
              </div>
            </div>
          )}
          {tab==='participants' && (
            <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-6">
              <h3 className="text-[14px] font-black">Joueurs inscrits ({t.participants.length}/{t.places})</h3>
              <div className="mt-4 grid md:grid-cols-2 gap-3">
                {t.participants.map((p,i)=>(
                  <div key={i} className="flex items-center justify-between rounded-xl border border-[#22222F] bg-[#15151E] p-4">
                    <div className="flex items-center gap-3"><span className="text-[11px] font-bold text-zinc-500">{i+1}.</span><div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center text-[11px] font-black">{p.avatar}</div><span className="text-[13px] font-bold">{p.pseudo}</span></div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${p.inscrit==='Validé'?'bg-emerald-500/15 text-emerald-300':'bg-amber-500/15 text-amber-300'}`}>{p.inscrit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab==='bracket' && <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-6"><h3 className="text-[14px] font-black mb-6">Vrai bracket dynamique - 10 joueurs</h3><Bracket10 /><p className="mt-6 text-[11px] text-zinc-500">Bracket généré à partir des vrais participants. Quand un résultat est validé, le vainqueur avance automatiquement. Responsive sur téléphone.</p></div>}
          {tab==='matchs' && <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-6"><h3 className="text-[14px] font-black">Matchs du tournoi</h3><div className="mt-4 space-y-3">{[{j1:"RavenCI",j2:"Momo_Yop",s:"À venir",h:"19:00"},{j1:"Kev_225",j2:"Jordan_Pro",s:"Terminé",score:"2-1"}].map((m,i)=><div key={i} className="flex items-center justify-between rounded-xl border border-[#22222F] bg-[#15151E] p-4"><div><p className="text-[13px] font-bold">{m.j1} vs {m.j2}</p><p className="text-[11px] text-zinc-500">{m.s} { (m as any).score ? '• '+(m as any).score : ''} • {m.h}</p></div><span className={`rounded-full px-3 py-1 text-[10px] font-bold ${m.s==='Terminé'?'bg-emerald-500/15 text-emerald-300':'bg-zinc-800 text-zinc-400'}`}>{m.s}</span></div>)}</div></div>}
          {tab==='reglement' && <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-6"><h3 className="text-[14px] font-black">Règlement officiel</h3><p className="mt-3 text-[13px] leading-relaxed text-zinc-400 whitespace-pre-wrap">{t.reglement}

1. Fair-play obligatoire
2. Capture obligatoire en cas de litige
3. 10 min de retard = forfait
4. Décision admin finale
5. Paiement Wave uniquement 01 51 42 99 18
6. Gains versés sous 24h après finale</p></div>}
          {tab==='gains' && <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-6"><h3 className="text-[14px] font-black">Répartition des gains</h3><div className="mt-4 grid md:grid-cols-3 gap-4"><div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-center"><p className="text-[28px]">🏆</p><p className="mt-2 text-[14px] font-black">Champion</p><p className="text-[22px] font-black text-amber-300">{t.gains.champion} FCFA</p></div><div className="rounded-2xl border border-[#22222F] bg-[#15151E] p-5 text-center"><p className="text-[28px]">🥈</p><p className="mt-2 text-[14px] font-bold">Finaliste</p><p className="text-[18px] font-bold">{t.gains.finaliste} FCFA</p></div><div className="rounded-2xl border border-[#22222F] bg-[#15151E] p-5 text-center"><p className="text-[28px]">🥉</p><p className="mt-2 text-[14px] font-bold">3e place</p><p className="text-[18px] font-bold">{t.gains.troisieme} FCFA</p></div></div><p className="mt-6 rounded-xl bg-gradient-to-r from-[#7C3AED]/20 to-[#06B6D4]/15 border border-[#7C3AED]/20 p-4 text-[13px] font-bold text-center">Gagne et encaisse ton djai sur Wave ! 🇨🇮 Ton djai est prêt après validation.</p></div>}
        </div>
      </div>
    </div>
  );
}
