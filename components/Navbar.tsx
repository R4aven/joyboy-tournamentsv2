"use client"
import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Trophy, Swords, Crown, Bell, User, Menu, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { useRealtime } from "@/hooks/useRealtime"

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
  badge?: number
}

function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5 group", className)}>
      <div className="relative flex h-9 w-9 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] shadow-[0_0_20px_rgba(124,58,237,0.35)] group-hover:shadow-[0_0_28px_rgba(124,58,237,0.5)] transition-all">
        <span className="text-[16px] font-black tracking-tighter text-white">J</span>
        <div className="absolute inset-0 rounded-[12px] bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-[15px] font-black tracking-[-0.02em] text-white">
          JOYBOY <span className="bg-gradient-to-br from-[#A855F7] to-[#06B6D4] bg-clip-text text-transparent">TOURNAMENTS</span>
        </span>
        <span className="text-[10px] font-semibold tracking-[0.18em] text-zinc-500 uppercase">Côte d'Ivoire • Abidjan</span>
      </div>
    </Link>
  )
}

export function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)
  const { unreadCount } = useRealtime()

  const NAV_ITEMS: NavItem[] = [
    { label: "Accueil", href: "/", icon: Home },
    { label: "Tournois", href: "/tournaments", icon: Trophy },
    { label: "1V1", href: "/1v1", icon: Swords },
    { label: "Palmarès", href: "/palmares", icon: Crown },
    { label: "Notifications", href: "/notifications", icon: Bell, badge: unreadCount },
    { label: "Profil", href: "/profile", icon: User },
  ]

  // fix routes legacy /tournois etc
  const navItemsFixed = NAV_ITEMS.map(i => {
    if (i.href === "/tournois") return { ...i, href: "/tournaments" }
    if (i.href === "/profil") return { ...i, href: "/profile" }
    return i
  })

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#08080B]/80 backdrop-blur-[16px]">
        <div className="mx-auto flex h-[66px] max-w-[1280px] items-center justify-between px-4 lg:px-6">
          <Logo />
          <nav className="hidden lg:flex items-center gap-1 rounded-full bg-[#12121A] border border-[#22222F] p-1">
            {navItemsFixed.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-2 rounded-full px-4 py-2 text-[13.5px] font-medium transition-all",
                    isActive ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={cn(
                        "ml-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold",
                        "bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                      )}
                    >
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
          <div className="hidden lg:flex items-center gap-3">
            <div className="h-6 w-px bg-[#22222F]" />
            <Link href="/dashboard" className="flex items-center gap-2 rounded-full border border-[#22222F] bg-[#12121A] pl-1 pr-3 py-1 hover:border-[#7C3AED]/30 transition-colors">
              <Avatar src={null} alt="Profil" fallback="JB" size="sm" glow={false} />
              <span className="text-[13px] font-medium text-zinc-300">Mon profil</span>
            </Link>
          </div>
          <button
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl bg-[#15151E] border border-[#22222F] text-zinc-300"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
        {open && (
          <div className="lg:hidden border-t border-white/[0.06] bg-[#0F0F14]/95 backdrop-blur-xl">
            <nav className="mx-auto max-w-[1280px] px-4 py-4 grid grid-cols-2 gap-2">
              {navItemsFixed.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-[14px] border px-4 py-3 text-[14px] font-medium transition-colors",
                      isActive
                        ? "bg-white text-black border-white"
                        : "bg-[#15151E] border-[#22222F] text-zinc-300 hover:border-[#7C3AED]/30"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                    {item.badge && item.badge > 0 ? (
                      <Badge variant="live" className="ml-auto">
                        {item.badge > 99 ? "99+" : item.badge}
                      </Badge>
                    ) : null}
                  </Link>
                )
              })}
            </nav>
          </div>
        )}
      </header>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] bg-[#08080B]/90 backdrop-blur-[20px]">
        <div className="mx-auto flex max-w-[480px] items-center justify-around px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          {navItemsFixed.map((item) => {
            const isActive = pathname === item.href || (item.href === "/" && pathname === "/")
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 rounded-[14px] px-3 py-1.5 transition-all min-w-[56px]",
                  isActive ? "text-white" : "text-zinc-500"
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 rounded-[14px] bg-gradient-to-br from-[#7C3AED]/20 to-[#06B6D4]/15 border border-[#7C3AED]/20" />
                )}
                <div className="relative">
                  <Icon className={cn("h-5 w-5", isActive && "text-white")} />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </div>
                <span className={cn("relative text-[10px] font-medium tracking-wide", isActive ? "text-white" : "text-zinc-500")}>
                  {item.label === "Notifications" ? "Notifs" : item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
      <div className="lg:hidden h-[78px]" />
    </>
  )
}

export default Navbar
