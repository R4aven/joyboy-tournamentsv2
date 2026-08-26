
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Trophy, Swords, Crown, Bell, User, Home, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState, useRef, useEffect } from "react";

const nav = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/tournaments", label: "Tournois", icon: Trophy },
  { href: "/1v1", label: "1V1", icon: Swords },
  { href: "/palmares", label: "Palmarès", icon: Crown },
  { href: "/notifications", label: "Notifs", icon: Bell },
  { href: "/dashboard", label: "Profil", icon: User },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, supabase } = useAuth() as any;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleProfileClick = () => {
    if (!user) router.push("/login");
    else router.push("/dashboard");
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (e) {
      console.error(e);
    }
  };

  const avatarUrl = (profile as any)?.avatar_url;
  const initial = (profile?.pseudo?.[0] || profile?.username?.[0] || profile?.efootball_pseudo?.[0] || user?.email?.[0] || "J").toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#22222F]/80 bg-[#08080B]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 h-[64px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center font-black text-[14px] text-white">JB</div>
            <div className="leading-none"><p className="text-[14px] font-black text-white">JOYBOY</p><p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500">TOURNAMENTS</p></div>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {nav.map(item=>{
              const active = pathname===item.href || (item.href!=="/" && pathname.startsWith(item.href));
              const Icon=item.icon;
              if(item.href==="/dashboard"){
                return <button key={item.href} onClick={handleProfileClick} className={`flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-bold ${active ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-[#15151E]'}`}><Icon className="h-4 w-4" />{item.label}</button>
              }
              return <Link key={item.href} href={item.href} className={`flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-bold ${active ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-[#15151E]'}`}><Icon className="h-4 w-4" />{item.label}</Link>
            })}
          </nav>
          <div className="hidden md:flex items-center gap-2 relative" ref={ref}>
            <button onClick={() => user ? setOpen(!open) : handleProfileClick()} className="h-9 w-9 rounded-full overflow-hidden border border-[#22222F] bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center font-black text-[11px] text-white">
              {avatarUrl ? <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" /> : initial}
            </button>
            {open && user && (
              <div className="absolute right-0 top-[48px] w-64 rounded-2xl border border-zinc-800 bg-[#101015] shadow-2xl p-2 z-50">
                <div className="p-3 rounded-xl bg-[#15151E] border border-zinc-800/50">
                  <p className="text-sm font-bold text-white truncate">{(profile as any)?.pseudo || (profile as any)?.username || user.email}</p>
                  <p className="text-xs text-zinc-500 truncate">{(profile as any)?.role || "JOUEUR"}</p>
                </div>
                <div className="mt-2 space-y-1">
                  <Link href="/dashboard" onClick={()=>setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-zinc-300 hover:bg-[#15151E] hover:text-white"><User className="h-4 w-4" /> Mon dashboard</Link>
                  <Link href={`/profile/${(profile as any)?.username || (profile as any)?.pseudo || user.id}`} onClick={()=>setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-zinc-300 hover:bg-[#15151E] hover:text-white"><Settings className="h-4 w-4" /> Voir profil public</Link>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/10"><LogOut className="h-4 w-4" /> Déconnexion</button>
                </div>
              </div>
            )}
          </div>
          <div className="md:hidden flex items-center gap-2">
            <button onClick={handleProfileClick} className="h-9 w-9 rounded-full overflow-hidden border border-[#22222F] bg-[#15151E] flex items-center justify-center">
              {avatarUrl ? <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" /> : <User className="h-4 w-4 text-white" />}
            </button>
          </div>
        </div>
      </header>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[#22222F] bg-[#08080B]/90 backdrop-blur-xl">
        <div className="grid grid-cols-6 h-[68px]">
          {nav.map(item=>{
            const active = pathname===item.href || (item.href!=="/" && pathname.startsWith(item.href));
            const Icon=item.icon;
            if(item.href==="/dashboard"){
              return <button key={item.href} onClick={handleProfileClick} className={`flex flex-col items-center justify-center gap-1 ${active ? 'text-white' : 'text-zinc-500'}`}><Icon className={`h-5 w-5 ${active ? 'text-[#7C3AED]' : ''}`} /><span className="text-[9px] font-bold uppercase">{item.label}</span></button>
            }
            return <Link key={item.href} href={item.href} className={`flex flex-col items-center justify-center gap-1 ${active ? 'text-white' : 'text-zinc-500'}`}><Icon className={`h-5 w-5 ${active ? 'text-[#7C3AED]' : ''}`} /><span className="text-[9px] font-bold uppercase">{item.label}</span></Link>
          })}
        </div>
      </nav>
    </>
  );
}
