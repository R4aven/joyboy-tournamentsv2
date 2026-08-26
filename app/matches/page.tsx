"use client";
import Link from "next/link";
export default function MyMatchesPage(){
  return (
    <div className="min-h-screen bg-[#08080B] text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-[28px] font-black">Mes matchs eFootball</h1>
        <p className="text-zinc-400 text-[13px] mt-2">JOYBOY organise, tu joues sur eFootball puis reviens confirmer.</p>
        <div className="mt-6 space-y-3">
          <div className="rounded-[20px] border border-[#22222F] bg-[#101015] p-5">
            <p className="font-black">JOYBOY CUP #12 vs Kev_225</p>
            <p className="text-[11px] text-zinc-500">SALON_CREE - 2h 15m restant</p>
            <Link href="/matches/m1" className="mt-3 inline-flex h-10 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-5 items-center text-[12px] font-black">REJOINDRE LE MATCH</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
