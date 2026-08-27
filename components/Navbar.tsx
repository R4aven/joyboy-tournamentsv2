
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { Bell, Trophy, Swords, Crown, User, LogOut } from "lucide-react";

export default function Navbar() {
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
    const channel = supabase.channel(`notifs-${user.id}`).on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, load).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <nav className="sticky top-0 z-50 border-b border-[#22222F] bg-[#08080B]/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-black text-[18px] tracking-tighter">JOYBOY<span className="text-[#7C3AED]">.CI</span></Link>
        <div className="hidden md:flex items-center gap-6 text-[12px] font-bold">
          <Link href="/tournaments" className="flex items-center gap-1.5 hover:text-white text-zinc-400"><Trophy className="h-4 w-4" /> TOURNOIS</Link>
          <Link href="/1v1" className="flex items-center gap-1.5 hover:text-white text-zinc-400"><Swords className="h-4 w-4" /> 1V1</Link>
          <Link href="/palmares" className="flex items-center gap-1.5 hover:text-white text-zinc-400"><Crown className="h-4 w-4" /> CLASSEMENT</Link>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/notifications" className="relative rounded-full bg-[#15151E] border border-[#22222F] h-9 w-9 flex items-center justify-center">
                <Bell className="h-4 w-4" />
                {notifCount > 0 && <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-[10px] font-black flex items-center justify-center text-white animate-pulse">{notifCount > 9 ? "9+" : notifCount}</span>}
              </Link>
              <Link href={`/profile/${profile?.username || user.id}`} className="h-9 w-9 rounded-full overflow-hidden border border-violet-600 bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center font-bold text-xs">
                {profile?.avatar_url ? <img src={profile.avatar_url} className="h-full w-full object-cover" /> : (profile?.display_name||"J")[0]}
              </Link>
            </>
          ) : (
            <Link href="/login" className="rounded-full bg-white text-black px-5 py-2 text-xs font-black">CONNEXION</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
