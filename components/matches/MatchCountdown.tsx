"use client";
import { useEffect, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";

export function MatchCountdown({ windowEnd, windowStart, availableFrom }: { windowEnd: string, windowStart?: string, availableFrom?: string }) {
  const [timeLeft, setTimeLeft] = useState<{ total: number, h: number, m: number, s: number, isExpired: boolean, isLessThan10: boolean, isAvailable: boolean }>({ total: 0, h: 0, m: 0, s: 0, isExpired: false, isLessThan10: false, isAvailable: false });

  useEffect(() => {
    const calc = () => {
      const now = new Date().getTime();
      const end = new Date(windowEnd).getTime();
      const start = windowStart ? new Date(windowStart).getTime() : now - 1000;
      const total = end - now;
      const isExpired = total <= 0;
      const isLessThan10 = total > 0 && total < 10 * 60 * 1000;
      const isAvailable = now >= start && !isExpired;
      const h = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((total % (1000 * 60)) / 1000);
      setTimeLeft({ total, h, m, s, isExpired, isLessThan10, isAvailable });
    };
    calc();
    const interval = setInterval(calc, 1000);
    const handleVis = () => { if (document.visibilityState === 'visible') calc(); };
    document.addEventListener('visibilitychange', handleVis);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', handleVis); };
  }, [windowEnd, windowStart]);

  if (timeLeft.isExpired) {
    return (
      <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[13px] font-black text-red-300">🚨 MATCH EXPIRÉ</span>
        <span className="text-[11px] text-red-200/70 ml-auto">Délai dépassé, admin va décider forfait/délai</span>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-3 flex items-center gap-3 ${timeLeft.isLessThan10 ? "bg-amber-500/10 border-amber-500/20 animate-pulse" : timeLeft.isAvailable ? "bg-emerald-500/10 border-emerald-500/20" : "bg-zinc-800/50 border-zinc-700"}`}>
      <div className={`h-2 w-2 rounded-full ${timeLeft.isAvailable ? "bg-emerald-400" : "bg-zinc-500"} ${timeLeft.isLessThan10 ? "bg-amber-400" : ""}`} />
      <div className="flex-1">
        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
          {timeLeft.isAvailable ? "🟢 MATCH DISPONIBLE" : "⏱ BIENTÔT DISPONIBLE"} {timeLeft.isLessThan10 && "⚠ Il reste moins de 10 minutes"}
        </p>
        <p className="text-[13px] font-black text-white">⏱ Il reste {String(timeLeft.h).padStart(2,'0')}:{String(timeLeft.m).padStart(2,'0')}:{String(timeLeft.s).padStart(2,'0')}</p>
      </div>
      <Clock className="h-5 w-5 text-zinc-500" />
    </div>
  );
}