"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Trophy,
  Swords,
  CreditCard,
  Gamepad2,
  AlertTriangle,
  Banknote,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Crown,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Utilisateurs", icon: Users },
  { href: "/admin/tournaments", label: "Tournois", icon: Trophy },
  { href: "/admin/1v1", label: "Duels 1V1", icon: Swords },
  { href: "/admin/payments", label: "Paiements", icon: CreditCard },
  { href: "/admin/matches", label: "Matchs", icon: Gamepad2 },
  { href: "/admin/disputes", label: "Litiges", icon: AlertTriangle },
  { href: "/admin/gains", label: "Gains", icon: Banknote },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/settings", label: "Paramètres", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-joy-border">
        <div className="h-10 w-10 rounded-xl bg-gradient-joy flex items-center justify-center glow-violet">
          <Crown className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-white leading-tight">E-TOURNOIS CI</h1>
          <p className="text-[10px] tracking-[0.3em] text-joy-violet font-bold">ADMIN PANEL</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                active
                  ? "bg-joy-violet text-white shadow-glow"
                  : "text-zinc-400 hover:bg-joy-card hover:text-white border border-transparent hover:border-joy-border"
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-joy-border space-y-3">
        <div className="rounded-xl bg-joy-card border border-joy-border p-3">
          <p className="text-xs text-zinc-400">Paiements Wave</p>
          <p className="text-sm font-mono font-bold text-white">01 51 42 99 18</p>
          <p className="text-xs text-zinc-500 mt-1">WhatsApp: 07 48 23 52 26</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition"
        >
          <LogOut className="h-[18px] w-[18px]" /> Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-joy-black border-b border-joy-border sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-joy flex items-center justify-center">
            <Crown className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold">E-TOURNOIS CI ADMIN</span>
        </div>
        <button onClick={() => setOpen(!open)} className="p-2 rounded-lg bg-joy-card border border-joy-border">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-[280px] bg-[#0C0C10] border-r border-joy-border z-30 flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="w-[300px] bg-[#0C0C10] border-l border-joy-border h-full animate-in slide-in-from-right">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}
