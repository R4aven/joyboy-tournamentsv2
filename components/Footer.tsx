
import Link from "next/link";
export default function Footer(){
  return (
    <footer className="border-t border-[#22222F] bg-[#101015] mt-12">
      <div className="mx-auto max-w-7xl px-6 py-10 grid md:grid-cols-4 gap-8">
        <div><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center font-black text-[12px]">ET</div><span className="font-black text-[14px]">E-TOURNOIS CI</span></div><p className="mt-3 text-[12px] leading-relaxed text-zinc-500">La plateforme e-sport #1 en Côte d'Ivoire. Tournois 10 joueurs, 1V1 direct, vrai palmarès, gains Wave.</p><p className="mt-3 text-[11px] text-zinc-600">© 2025 E-TOURNOIS CI 🇨🇮</p></div>
        <div><h4 className="text-[12px] font-black uppercase tracking-widest text-zinc-400">Plateforme</h4><div className="mt-3 space-y-2 text-[12px] text-zinc-500"><Link href="/tournaments" className="block hover:text-white">Tournois</Link><Link href="/1v1" className="block hover:text-white">1V1 Direct</Link><Link href="/palmares" className="block hover:text-white">Palmarès</Link><Link href="/search" className="block hover:text-white">Recherche joueur</Link></div></div>
        <div><h4 className="text-[12px] font-black uppercase tracking-widest text-zinc-400">Support</h4><div className="mt-3 space-y-2 text-[12px] text-zinc-500"><a href="https://wa.me/2250748235226" target="_blank" className="block hover:text-white">WhatsApp : 07 48 23 52 26</a><span className="block">Wave : 01 51 42 99 18</span><Link href="/dashboard" className="block hover:text-white">Dashboard</Link></div></div>
        <div><h4 className="text-[12px] font-black uppercase tracking-widest text-zinc-400">Légal</h4><div className="mt-3 space-y-2 text-[12px] text-zinc-500"><span className="block">Paiement Wave uniquement</span><span className="block">Pas d'Orange Money / MTN / PayPal</span><span className="block">Gains en FCFA</span><span className="block">Abidjan, Côte d'Ivoire 🇨🇮</span></div></div>
      </div>
    </footer>
  );
}
