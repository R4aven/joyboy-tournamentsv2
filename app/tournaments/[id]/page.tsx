
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function TournamentDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const supabase = createClient();
  const [t, setT] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("tournaments").select("*").eq("id", id).single();
      if (data) setT(data);
      setLoading(false);
    };
    if (id) load();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-[#08080B] text-white p-10">Chargement...</div>;
  if (!t) return <div className="min-h-screen bg-[#08080B] text-white p-10">Tournoi introuvable</div>;

  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link href="/tournaments" className="text-sm text-zinc-500">← Retour</Link>
        <h1 className="mt-4 text-3xl font-black">{t.title}</h1>
        <p className="text-zinc-400 mt-2">{t.game} • {t.status} • {t.max_players} places</p>
        <p className="mt-4 text-sm text-zinc-300">{t.description}</p>
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-[#101015] p-5 space-y-3">
          <div><p className="text-xs text-zinc-500">Date</p><p className="font-bold">{t.start_date ? new Date(t.start_date).toLocaleString("fr-FR") : "-"}</p></div>
          <div><p className="text-xs text-zinc-500">Frais</p><p className="font-bold">{t.entry_fee} FCFA - Wave {t.wave_number || "01 51 42 99 18"}</p></div>
          <div><p className="text-xs text-zinc-500">Règlement</p><p className="text-sm whitespace-pre-wrap">{t.rules}</p></div>
        </div>
      </div>
    </div>
  );
}
