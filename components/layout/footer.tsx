"use client"
import Link from "next/link"
import { Trophy, MessageCircle, Phone, MapPin, Instagram, Twitter, Youtube, Crown } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const WAVE_NUMBER = "01 51 42 99 18"
const WHATSAPP_NUMBER = "07 48 23 52 26"

export function Footer() {
  return (
    <footer className="relative mt-20 border-t border-white/[0.06] bg-[#08080B] overflow-hidden">
      {/* glow bg */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-96 w-[800px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.12)_0%,transparent_70%)] blur-[40px]" />
        <div className="absolute -bottom-20 right-0 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(6,182,214,0.08)_0%,transparent_70%)] blur-[30px]" />
      </div>

      <div className="relative mx-auto max-w-[1280px] px-4 lg:px-6">
        {/* Top CTA */}
        <div className="relative mt-8 rounded-[24px] border border-white/[0.06] bg-[linear-gradient(100deg,rgba(124,58,237,0.14)_0%,rgba(6,182,214,0.10)_60%,rgba(255,255,255,0.02)_100%),#15151E] p-6 lg:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(400px_at_0%_0%,rgba(124,58,237,0.20),transparent)] pointer-events-none" />
          <div className="relative">
            <Badge variant="violet" className="mb-3">
              <Crown className="h-3 w-3" /> Tournois 100% Ivoirien
            </Badge>
            <h3 className="text-[22px] lg:text-[26px] font-bold tracking-tight text-white leading-tight">
              Prêt à devenir le prochain <span className="bg-gradient-to-br from-[#A855F7] to-[#06B6D4] bg-clip-text text-transparent">JoyBoy</span> ?
            </h3>
            <p className="mt-2 text-[13.5px] text-zinc-400 max-w-[520px] leading-relaxed">
              Rejoins la communauté gaming la plus chaude d'Abidjan. Inscriptions via Wave, support direct sur WhatsApp. On gère tout pour toi.
            </p>
          </div>
          <div className="relative flex gap-3 shrink-0">
            <a
              href={`https://wa.me/2250748235226`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-[14px] font-semibold text-white shadow-[0_0_20px_rgba(37,211,102,0.3)] hover:bg-[#22c55e] transition-colors"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
            <Link
              href="/tournois"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-black px-5 py-3 text-[14px] font-semibold hover:bg-zinc-100 transition-colors"
            >
              <Trophy className="h-4 w-4" /> S'inscrire
            </Link>
          </div>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 py-12">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] shadow-[0_0_20px_rgba(124,58,237,0.35)]">
                <span className="text-[16px] font-black text-white">J</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[14px] font-black tracking-tight text-white">
                  JOYBOY <span className="text-[#A855F7]">TOURNAMENTS</span>
                </span>
                <span className="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">Abidjan • CI 🇨🇮</span>
              </div>
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-zinc-400">
              La plateforme de tournois gaming numéro 1 en Côte d'Ivoire. On organise, tu joues, tu brilles. Pas de blabla, que du game.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#15151E] border border-[#22222F] text-zinc-400 hover:text-white hover:border-[#7C3AED]/30 transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#15151E] border border-[#22222F] text-zinc-400 hover:text-white hover:border-[#7C3AED]/30 transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#15151E] border border-[#22222F] text-zinc-400 hover:text-white hover:border-[#7C3AED]/30 transition-colors"
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-[13px] font-semibold tracking-wide uppercase text-white mb-4">Navigation</h4>
            <ul className="space-y-2.5">
              {[
                ["Accueil", "/"],
                ["Tournois", "/tournois"],
                ["Duels 1V1", "/1v1"],
                ["Palmarès", "/palmares"],
                ["Classement", "/palmares"],
              ].map(([l, href]) => (
                <li key={l}>
                  <Link href={href} className="text-[13.5px] text-zinc-400 hover:text-white transition-colors">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-[13px] font-semibold tracking-wide uppercase text-white mb-4">Support</h4>
            <ul className="space-y-2.5">
              {[
                ["Règlement", "/reglement"],
                ["FAQ", "/faq"],
                ["Nous contacter", "/contact"],
                ["Signaler un problème", "/contact"],
              ].map(([l, href]) => (
                <li key={l}>
                  <Link href={href} className="text-[13.5px] text-zinc-400 hover:text-white transition-colors">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Wave & WhatsApp only */}
          <div>
            <h4 className="text-[13px] font-semibold tracking-wide uppercase text-white mb-4">Paiement & Contact</h4>
            <div className="space-y-3">
              <a
                href={`tel:+225${WAVE_NUMBER.replace(/\s/g, "")}`}
                className="flex items-center gap-3 rounded-xl border border-[#22222F] bg-[#15151E] px-4 py-3 hover:border-[#7C3AED]/30 transition-colors group"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#7C3AED]/15 text-[#A78BFA] group-hover:bg-[#7C3AED]/20 transition-colors">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold tracking-wide uppercase text-zinc-500">Wave - Paiement unique</p>
                  <p className="text-[14px] font-bold text-white tracking-tight">{WAVE_NUMBER}</p>
                </div>
              </a>

              <a
                href={`https://wa.me/2250748235226`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-[#22222F] bg-[#15151E] px-4 py-3 hover:border-[#25D366]/30 transition-colors group"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#25D366]/15 text-[#25D366] group-hover:bg-[#25D366]/20 transition-colors">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold tracking-wide uppercase text-zinc-500">WhatsApp - Support direct</p>
                  <p className="text-[14px] font-bold text-white tracking-tight">{WHATSAPP_NUMBER}</p>
                </div>
              </a>

              <div className="flex items-center gap-2 pt-2 text-[12px] text-zinc-500">
                <MapPin className="h-3.5 w-3.5" /> Abidjan, Côte d'Ivoire 🇨🇮
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 border-t border-white/[0.06] py-6">
          <p className="text-[12.5px] text-zinc-500">
            © {new Date().getFullYear()} JOYBOY TOURNAMENTS. Tous droits réservés. Fièrement Ivoirien 🇨🇮 • Que du vrai game, pas de calculs compliqués.
          </p>
          <div className="flex items-center gap-4 text-[12px]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#15151E] border border-[#22222F] px-3 py-1 text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Système en ligne
            </span>
            <Link href="/reglement" className="text-zinc-500 hover:text-zinc-300 transition-colors">
              Confidentialité
            </Link>
            <Link href="/reglement" className="text-zinc-500 hover:text-zinc-300 transition-colors">
              Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
