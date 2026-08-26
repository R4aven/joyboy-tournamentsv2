
import Link from "next/link";
import { Trophy, Swords, Users, Zap, Crown, Flame, CheckCircle2, HelpCircle, Star, Wallet } from "lucide-react";

export default function HomePage() {
  const tournaments = [
    { id: "1", name: "E-TOURNOIS CI CUP #12", jeu: "FC 26", participants: 8, max: 10, prix: 1000, gain: 7000, date: "30 Août 2025", statut: "OUVERT" },
    { id: "2", name: "ABIDJAN SHOWDOWN", jeu: "eFootball", participants: 10, max: 10, prix: 1500, gain: 10000, date: "02 Sept 2025", statut: "COMPLET" },
    { id: "3", name: "YOPOUGON LEAGUE", jeu: "CODM", participants: 4, max: 10, prix: 500, gain: 3500, date: "05 Sept 2025", statut: "OUVERT" },
  ];
  const topPlayers = [
    { pseudo: "RavenCI", wins: 47, troph: "🏆", tit: "Champion x3" },
    { pseudo: "Kev_225", wins: 39, troph: "🥇", tit: "Boss du game" },
    { pseudo: "Jordan_Pro", wins: 34, troph: "🔥", tit: "En feu" },
    { pseudo: "Momo_Yop", wins: 28, troph: "⚔", tit: "Duelliste" },
  ];
  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#7C3AED]/20 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#7C3AED]/20 blur-[120px] rounded-full" />
        <div className="absolute top-40 right-20 w-[400px] h-[400px] bg-[#06B6D4]/15 blur-[100px] rounded-full" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#22222F] bg-[#15151E]/80 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Plateforme 100% Ivoirienne 🇨🇮
            </div>
            <h1 className="mt-8 font-black tracking-[-0.04em] leading-[0.85] text-[56px] md:text-[96px]">
              <span className="block">JOUE.</span>
              <span className="block bg-gradient-to-r from-[#A855F7] to-[#06B6D4] bg-clip-text text-transparent">AFFRONTE.</span>
              <span className="block">GAGNE.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-[16px] md:text-[18px] leading-relaxed text-zinc-400">
              Entre dans l'arène <span className="font-bold text-white">E-TOURNOIS CI</span> et affronte les meilleurs joueurs de Côte d'Ivoire. Tournois 10 joueurs, duels 1V1, vrai palmarès.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link href="/tournaments" className="inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-8 text-[14px] font-black tracking-wide shadow-[0_0_30px_rgba(124,58,237,0.4)] hover:opacity-90 transition">
                <Trophy className="h-5 w-5" /> TOURNOIS
              </Link>
              <Link href="/1v1" className="inline-flex h-[52px] items-center justify-center gap-2 rounded-full border border-[#22222F] bg-[#15151E] px-8 text-[14px] font-black tracking-wide hover:border-white/20 transition">
                <Swords className="h-5 w-5" /> 1V1 DIRECT
              </Link>
            </div>
            <div className="mt-10 rounded-[20px] border border-[#7C3AED]/30 bg-gradient-to-r from-[#7C3AED]/15 to-[#06B6D4]/10 px-6 py-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center shadow-lg"><Wallet className="h-6 w-6" /></div>
              <div className="text-left">
                <p className="text-[13px] font-black uppercase tracking-wide">Gagne et encaisse ton djai sur Wave ! 🇨🇮</p>
                <p className="text-[12px] text-zinc-400">Paiements vérifiés en moins de 24h • Wave : <span className="font-bold text-white">01 51 42 99 18</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TOURNOIS DISPONIBLES */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex items-center justify-between">
          <h2 className="text-[22px] font-black tracking-tight flex items-center gap-2"><Trophy className="h-6 w-6 text-[#7C3AED]" /> Tournois ouverts</h2>
          <Link href="/tournaments" className="text-[12px] font-bold text-zinc-400 hover:text-white">Voir tout →</Link>
        </div>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {tournaments.map(t=>(
            <div key={t.id} className="group rounded-[20px] border border-[#22222F] bg-[#15151E] p-5 hover:border-[#7C3AED]/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[#101015] border border-[#22222F] px-3 py-1 text-[10px] font-bold tracking-widest">{t.jeu}</span>
                <span className={`rounded-full px-3 py-1 text-[10px] font-black ${t.statut==='OUVERT'?'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20':'bg-amber-500/15 text-amber-300'}`}>{t.statut}</span>
              </div>
              <h3 className="mt-4 text-[16px] font-black">{t.name}</h3>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                <div className="rounded-xl bg-[#101015] border border-[#22222F]/60 p-2.5 text-center"><Users className="mx-auto h-4 w-4 text-zinc-500" /><p className="mt-1 font-bold text-white">{t.participants}/{t.max}</p><p className="text-zinc-500">Joueurs</p></div>
                <div className="rounded-xl bg-[#101015] border border-[#22222F]/60 p-2.5 text-center"><Wallet className="mx-auto h-4 w-4 text-zinc-500" /><p className="mt-1 font-bold text-white">{t.prix}F</p><p className="text-zinc-500">Entrée</p></div>
                <div className="rounded-xl bg-[#101015] border border-[#22222F]/60 p-2.5 text-center"><Crown className="mx-auto h-4 w-4 text-amber-400" /><p className="mt-1 font-bold text-white">{t.gain}F</p><p className="text-zinc-500">Gain</p></div>
              </div>
              <p className="mt-3 text-[11px] text-zinc-500">📅 {t.date}</p>
              <Link href={`/tournaments/${t.id}`} className="mt-4 flex h-10 w-full items-center justify-center rounded-xl bg-white text-black text-[12px] font-black hover:bg-zinc-200 transition">VOIR LE TOURNOI</Link>
            </div>
          ))}
        </div>
      </section>

      {/* 1V1 + POPULAIRES */}
      <section className="mx-auto max-w-7xl px-6 py-12 grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-[22px] font-black tracking-tight flex items-center gap-2"><Swords className="h-6 w-6 text-[#06B6D4]" /> 1V1 Direct</h2>
          <p className="mt-2 text-[13px] text-zinc-400">Défie un adversaire, 500 FCFA chacun. Paiement Wave 01 51 42 99 18.</p>
          <div className="mt-4 space-y-3">
            {[
              { a: "RavenCI", b: "Kev_225", stake: 1000, status: "En attente" },
              { a: "Jordan_Pro", b: "Momo_Yop", stake: 1000, status: "Confirmé" },
            ].map((d,i)=>(
              <div key={i} className="flex items-center justify-between rounded-2xl border border-[#22222F] bg-[#101015] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2"><div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 border-2 border-[#101015]" /><div className="h-8 w-8 rounded-full bg-[#15151E] border-2 border-[#101015] flex items-center justify-center text-[10px] font-bold">VS</div></div>
                  <div><p className="text-[13px] font-bold">{d.a} <span className="text-zinc-500">vs</span> {d.b}</p><p className="text-[11px] text-zinc-500">{d.stake} FCFA • {d.status}</p></div>
                </div>
                <Link href="/1v1" className="rounded-full bg-[#15151E] border border-[#22222F] px-4 py-2 text-[11px] font-bold">Voir</Link>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-[22px] font-black tracking-tight flex items-center gap-2"><Flame className="h-6 w-6 text-orange-400" /> Joueurs populaires</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {topPlayers.map((p)=>(
              <Link key={p.pseudo} href={`/profile/${p.pseudo}`} className="rounded-2xl border border-[#22222F] bg-[#15151E] p-4 hover:border-white/10 transition">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center font-black text-[12px]">{p.pseudo.slice(0,2).toUpperCase()}</div>
                  <div><p className="text-[13px] font-bold">{p.pseudo}</p><p className="text-[11px] text-zinc-500">{p.tit}</p></div>
                </div>
                <div className="mt-3 flex items-center justify-between"><span className="text-[11px] text-zinc-500">{p.wins} victoires</span><span className="text-[14px]">{p.troph}</span></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* COMMENT CA MARCHE */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-[28px] font-black tracking-tight text-center">Comment ça marche ?</h2>
        <div className="mt-8 grid md:grid-cols-4 gap-4">
          {[
            { step: "01", title: "Inscris-toi", desc: "Crée ton compte en 30 secondes avec ton pseudo." },
            { step: "02", title: "Paie sur Wave", desc: "Envoie sur 01 51 42 99 18 et upload ta capture." },
            { step: "03", title: "Affronte", desc: "Bracket 10 joueurs réel, matchs en direct." },
            { step: "04", title: "Encaisse", desc: "Gagne et récupère ton djai sur Wave 🇨🇮" },
          ].map(s=>(
            <div key={s.step} className="rounded-[20px] border border-[#22222F] bg-[#101015] p-6">
              <p className="text-[32px] font-black text-gradient bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] bg-clip-text text-transparent">{s.step}</p>
              <h3 className="mt-2 text-[15px] font-black">{s.title}</h3>
              <p className="mt-2 text-[12px] leading-relaxed text-zinc-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="text-[22px] font-black flex items-center gap-2 justify-center"><HelpCircle className="h-6 w-6" /> FAQ</h2>
        <div className="mt-6 space-y-3">
          {[
            { q: "Comment payer ?", a: "Wave uniquement au 01 51 42 99 18. Tu envoies, tu fais une capture, tu uploades. Validation en moins de 24h." },
            { q: "Combien coûte un 1V1 ?", a: "500 FCFA par joueur, donc 1000 FCFA total. Le gagnant prend le pot moins les frais plateforme." },
            { q: "Le bracket est-il réel ?", a: "Oui, 10 joueurs → 2 barrages → 8 → quarts → demis → finale. Généré à partir des vrais inscrits, progression automatique." },
            { q: "Comment encaisser ?", a: "Ton gain est marqué 'Ton djai est prêt'. On te paie sur ton numéro Wave. WhatsApp support : 07 48 23 52 26" },
          ].map((f,i)=>(
            <details key={i} className="group rounded-2xl border border-[#22222F] bg-[#101015] p-5 open:border-[#7C3AED]/30">
              <summary className="flex cursor-pointer list-none items-center justify-between text-[14px] font-bold">{f.q}<span className="text-zinc-500 group-open:rotate-45 transition">+</span></summary>
              <p className="mt-3 text-[13px] leading-relaxed text-zinc-400">{f.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <a href="https://wa.me/2250748235226?text=Bonjour%20E-TOURNOIS CI%20TOURNAMENTS%2C%20j%27ai%20besoin%20d%27aide%20concernant%20mon%20paiement." target="_blank" className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-[13px] font-black text-black hover:opacity-90">
            💬 BESOIN D'AIDE ? WHATSAPP
          </a>
        </div>
      </section>
    </div>
  );
}
