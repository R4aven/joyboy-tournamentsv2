
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Swords, Crown, Bell, User, Home } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
  const pathname = usePathname();
  const { user, profile } = useAuth() as any;
  const supabase = createClient();
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { count } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false);
      if (count !== null) setNotifCount(count);
    };
    load();
    const channel = supabase.channel(`notifs-nav-${user.id}`).on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, load).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const nav = [
    { href: "/", label: "Accueil", icon: Home },
    { href: "/tournaments", label: "Tournois", icon: Trophy },
    { href: "/1v1", label: "1V1", icon: Swords },
    { href: "/palmares", label: "Palmarès", icon: Crown },
    { href: "/notifications", label: "Notifs", icon: Bell, isNotif: true },
    { href: "/dashboard", label: "Profil", icon: User },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#22222F]/80 bg-[#08080B]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 h-[64px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center font-black text-[14px] shadow-[0_0_20px_rgba(124,58,237,0.3)]">JB</div>
            <div className="leading-none"><p className="text-[14px] font-black tracking-tight">JOYBOY</p><p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500">TOURNAMENTS</p></div>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {nav.map(item=>{
              const active = pathname===item.href || (item.href!=="/" && pathname.startsWith(item.href));
              const Icon=item.icon;
              const badge = item.isNotif ? notifCount : (item as any).badge;
              return (
                <Link key={item.href} href={item.href} className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-bold transition ${active ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-[#15151E]'}`}>
                  <Icon className="h-4 w-4" />{item.label}
                  {badge > 0 && <span className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center font-black animate-pulse">{badge > 9 ? "9+" : badge}</span>}
                </Link>
              );
            })}
          </nav>
          <div className="hidden md:flex items-center gap-2">
            <div className="rounded-full border border-[#22222F] bg-[#15151E] px-3 py-1.5 text-[11px]"><span className="text-zinc-500">Wave</span> <span className="font-bold text-white ml-1">01 51 42 99 18</span></div>
            {user ? (
              <Link href={`/profile/${profile?.username || "me"}`} className="h-9 w-9 rounded-full overflow-hidden bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center font-black text-[11px] border border-[#22222F]">
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="avatar" className="h-full w-full object-cover" /> : (profile?.display_name?.[0] || profile?.username?.[0] || "J")}
              </Link>
            ) : (
              <Link href="/login" className="rounded-full bg-white text-black px-4 py-1.5 text-[11px] font-black">CONNEXION</Link>
            )}
          </div>
          <Link href="/dashboard" className="md:hidden h-9 w-9 rounded-full bg-[#15151E] border border-[#22222F] flex items-center justify-center"><User className="h-4 w-4" /></Link>
        </div>
      </header>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[#22222F] bg-[#08080B]/90 backdrop-blur-xl">
        <div className="grid grid-cols-6 h-[68px]">
          {nav.map(item=>{
            const active = pathname===item.href || (item.href!=="/" && pathname.startsWith(item.href));
            const Icon=item.icon;
            const badge = item.isNotif ? notifCount : 0;
            return (
              <Link key={item.href} href={item.href} className={`flex flex-col items-center justify-center gap-1 ${active ? 'text-white' : 'text-zinc-500'}`}>
                <div className="relative"><Icon className={`h-5 w-5 ${active ? 'text-[#7C3AED]' : ''}`} />{badge > 0 && <span className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-red-600 text-[8px] flex items-center justify-center font-black text-white animate-pulse">{badge > 9 ? "9+" : badge}</span>}</div>
                <span className="text-[9px] font-bold uppercase tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
