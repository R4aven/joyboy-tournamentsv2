
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Trophy, Swords, Crown, Bell, User, Home } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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
  const { user, profile } = useAuth() as any;
  
  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login");
    } else {
      router.push("/dashboard");
    }
  };

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
              if(item.href==="/dashboard"){
                return <button key={item.href} onClick={handleProfileClick} className={`flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-bold ${active ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-[#15151E]'}`}><Icon className="h-4 w-4" />{item.label}</button>
              }
              return <Link key={item.href} href={item.href} className={`flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-bold ${active ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-[#15151E]'}`}><Icon className="h-4 w-4" />{item.label}</Link>
            })}
          </nav>
          <div className="hidden md:flex items-center gap-2">
            <button onClick={handleProfileClick} className="h-9 w-9 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center font-black text-[11px] text-white">
              {(profile?.pseudo?.[0] || profile?.username?.[0] || "J")}
            </button>
          </div>
          <button onClick={handleProfileClick} className="md:hidden h-9 w-9 rounded-full bg-[#15151E] border border-[#22222F] flex items-center justify-center"><User className="h-4 w-4" /></button>
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
