
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Trophy, Swords, Crown, Bell, User, Home, LogOut, Settings, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile } = useAuth() as any;
  const supabase = createClient();
  const [notifCount, setNotifCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { count } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false);
      if (count !== null) setNotifCount(count);
    };
    load();
    const channel = supabase.channel(`notifs-${user.id}`).on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, load).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

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
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center font-black text-[14px]">JB</div>
            <div className="leading-none"><p className="text-[14px] font-black">JOYBOY</p><p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500">TOURNAMENTS</p></div>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {nav.map(item=>{
              const active = pathname===item.href || (item.href!=="/" && pathname.startsWith(item.href));
              const Icon=item.icon;
              const badge = item.isNotif ? notifCount : 0;
              return (
                <Link key={item.href} href={item.href} className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-bold ${active ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-[#15151E]'}`}>
                  <Icon className="h-4 w-4" />{item.label}
                  {badge > 0 && <span className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center font-black animate-pulse">{badge > 9 ? "9+" : badge}</span>}
                </Link>
              );
            })}
          </nav>
          <div className="hidden md:flex items-center gap-2 relative">
            <div className="rounded-full border border-[#22222F] bg-[#15151E] px-3 py-1.5 text-[11px]"><span className="text-zinc-500">Wave</span> <span className="font-bold ml-1">01 51 42 99 18</span></div>
            {user ? (
              <div className="relative">
                <button onClick={()=>setShowMenu(!showMenu)} className="h-9 w-9 rounded-full overflow-hidden bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center font-black text-[11px] border border-violet-500/50">
                  {profile?.avatar_url ? <img src={profile.avatar_url} alt="avatar" className="h-full w-full object-cover" /> : (profile?.display_name?.[0] || profile?.username?.[0] || "J")}
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-12 w-64 rounded-2xl border border-zinc-800 bg-[#101015] shadow-xl overflow-hidden z-50">
                    <div className="p-4 border-b border-zinc-800 flex gap-3">
                      <div className="h-12 w-12 rounded-full overflow-hidden bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center font-bold">
                        {profile?.avatar_url ? <img src={profile.avatar_url} className="h-full w-full object-cover" /> : (profile?.username?.[0]||"J")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">@{profile?.username}</p>
                        <p className="text-xs text-zinc-500 truncate">{profile?.display_name}</p>
                        <p className="text-[11px] text-zinc-400 truncate mt-1">{profile?.bio?.slice(0,40)||"Pas de bio"}</p>
                      </div>
                    </div>
                    <Link href={`/profile/${profile?.username}`} className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-[#15151E]"><User className="h-4 w-4" /> Voir mon profil public (photo visible)</Link>
                    <Link href="/settings/profile" className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-[#15151E]"><Settings className="h-4 w-4" /> Modifier photo + bio</Link>
                    <Link href="/messages" className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-[#15151E]"><MessageCircle className="h-4 w-4" /> Messages - Chat présent ✅</Link>
                    <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-red-500/10 text-red-400 text-left"><LogOut className="h-4 w-4" /> Se déconnecter</button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="rounded-full bg-white text-black px-4 py-1.5 text-[11px] font-black">CONNEXION</Link>
            )}
          </div>
          <Link href="/dashboard" className="md:hidden h-9 w-9 rounded-full overflow-hidden bg-[#15151E] border border-[#22222F] flex items-center justify-center">
            {profile?.avatar_url ? <img src={profile.avatar_url} className="h-full w-full object-cover" /> : <User className="h-4 w-4" />}
          </Link>
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
                <div className="relative"><Icon className={`h-5 w-5 ${active ? 'text-[#7C3AED]' : ''}`} />{badge > 0 && <span className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-red-600 text-[8px] flex items-center justify-center font-black text-white">{badge}</span>}</div>
                <span className="text-[9px] font-bold uppercase">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
