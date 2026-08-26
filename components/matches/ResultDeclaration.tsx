
"use client";
/**
 * 🇨🇮 E-TOURNOIS CI - ResultDeclaration.tsx
 * Double déclaration avec upload capture, comparaison auto, badge CONTESTÉ.
 */
import { useState, useRef } from "react";
import { Upload, CheckCircle2, XCircle, AlertTriangle, Trophy, Image as ImageIcon, Trash2 } from "lucide-react";
import type { EfootballMatch, ResultDeclaration } from "@/lib/matches/types";
import { checkDeclarationsMatchWithMatch } from "@/lib/matches/matchLogic";

interface Props {
  match: EfootballMatch;
  currentUserId: string | null;
  onDeclare: (dec: { scoreA: number; scoreB: number; captureUrl: string | null; captureFileName?: string }) => Promise<void> | void;
  isLoading?: boolean;
}

export default function ResultDeclarationComponent({ match, currentUserId, onDeclare, isLoading }: Props) {
  const [scoreA, setScoreA] = useState<number>(0);
  const [scoreB, setScoreB] = useState<number>(0);
  const [captureUrl, setCaptureUrl] = useState<string | null>(null);
  const [captureName, setCaptureName] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [localLoading, setLocalLoading] = useState(false);

  const myDeclaration = match.result_declarations.find((d) => d.playerId === currentUserId);
  const otherDeclaration = match.result_declarations.find((d) => d.playerId !== currentUserId);
  const hasBoth = match.result_declarations.length >= 2;
  const check = hasBoth ? checkDeclarationsMatchWithMatch(match, match.result_declarations) : null;

  const handleFile = (file: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(file.type)) {
      alert("JPG/PNG uniquement");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Max 5Mo");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCaptureUrl(reader.result as string);
      setCaptureName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async () => {
    if (scoreA < 0 || scoreB < 0 || scoreA > 20 || scoreB > 20) {
      alert("Score invalide");
      return;
    }
    setLocalLoading(true);
    try {
      await onDeclare({ scoreA, scoreB, captureUrl, captureFileName: captureName });
    } finally {
      setLocalLoading(false);
    }
  };

  const canDeclare = match.status === "MATCH_EN_COURS" || match.status === "RESULTAT_EN_ATTENTE";
  const isParticipant = match.player_a.id === currentUserId || match.player_b?.id === currentUserId;

  if (match.status === "TERMINE") {
    return (
      <div className="rounded-[20px] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-[#15151E] p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/20">
          <Trophy className="h-7 w-7 text-emerald-400" />
        </div>
        <h3 className="mt-4 text-[16px] font-black">RÉSULTAT CONFIRMÉ</h3>
        <p className="mt-2 text-[13px] text-zinc-400">
          Score final: <span className="font-black text-white">{match.final_score_a} - {match.final_score_b}</span>
          {match.winner_id && <span> • Vainqueur: {match.winner_id === match.player_a.id ? match.player_a.username : match.player_b?.username}</span>}
        </p>
        {match.result_declarations.length > 0 && (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {match.result_declarations.map((d) => (
              <div key={d.playerId} className="rounded-xl border border-[#22222F] bg-[#101015] p-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold">{d.playerUsername}</p>
                  <p className="text-[10px] text-zinc-500">{new Date(d.declaredAt).toLocaleTimeString("fr-FR")}</p>
                </div>
                <span className="text-[13px] font-black">{d.scoreA}-{d.scoreB} {d.isVictory ? "✓ Victoire" : "✕ Défaite"}</span>
              </div>
            ))}
          </div>
        )}
        <p className="mt-4 text-[11px] text-zinc-500">Bracket, stats et palmarès mis à jour. Bravo ! 🇨🇮</p>
      </div>
    );
  }

  if (match.status === "CONTESTATION") {
    return (
      <div className="rounded-[20px] border border-red-500/30 bg-gradient-to-br from-red-500/10 to-[#15151E] p-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-red-500/15 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-[14px] font-black tracking-wide text-red-300">CONTESTATION - ADMIN REQUIS</h3>
            <p className="text-[11px] text-zinc-400">{match.contested_reason || "Déclarations différentes"}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {match.result_declarations.map((d, i) => (
            <div key={d.playerId} className="rounded-xl border border-[#22222F] bg-[#08080B] p-4">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-black">{d.playerUsername} {i===0 ? "(A)" : "(B)"}</p>
                <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${d.isVictory ? "bg-emerald-500/15 text-emerald-300" : "bg-zinc-800 text-zinc-400"}`}>{d.isVictory ? "Victoire" : "Défaite"}</span>
              </div>
              <p className="mt-2 text-[18px] font-black tracking-wide text-white">{d.scoreA} - {d.scoreB}</p>
              <p className="mt-1 text-[10px] text-zinc-500">Déclaré à {new Date(d.declaredAt).toLocaleString("fr-FR")}</p>
              {d.captureUrl && (
                <div className="mt-3 rounded-lg overflow-hidden border border-[#22222F]">
                  <img src={d.captureUrl} alt="capture" className="w-full max-h-40 object-contain bg-[#101015]" />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] text-amber-200">
          Admin intervient pour arbitrer. Envoie ta capture sur WhatsApp <span className="font-bold">07 48 23 52 26</span> si besoin. Ne rejoue pas sans consigne admin.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-[#22222F] bg-[#15151E] overflow-hidden">
      <div className="p-5 border-b border-[#22222F] flex items-center justify-between">
        <h3 className="text-[13px] font-black tracking-wide flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" /> PREUVE DE MATCH - RÉSULTAT RÉEL eFOOTBALL
        </h3>
        {hasBoth && check && (
          <span className={`rounded-full px-3 py-1 text-[10px] font-black border ${check.match ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/20" : "bg-red-500/15 text-red-300 border-red-500/30"}`}>
            {check.match ? "CONCORDANT ✓ AUTO CONFIRMÉ" : "CONTESTÉ"}
          </span>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Affichage des déclarations existantes côte à côte */}
        {match.result_declarations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {match.result_declarations.map((d) => {
              const isMe = d.playerId === currentUserId;
              return (
                <div key={d.playerId} className={`rounded-xl border p-4 ${isMe ? "border-violet-500/30 bg-violet-500/10" : "border-[#22222F] bg-[#08080B]"}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-black flex items-center gap-2">
                      {d.playerUsername} {isMe && <span className="text-[10px] font-bold rounded-full bg-violet-500 text-white px-2 py-0.5">TOI</span>}
                    </p>
                    <span className={`text-[10px] font-bold ${d.isVictory ? "text-emerald-400" : "text-zinc-500"}`}>{d.isVictory ? "Victoire déclarée" : "Défaite déclarée"}</span>
                  </div>
                  <p className="mt-2 text-[20px] font-black text-white">{d.scoreA} - {d.scoreB}</p>
                  <p className="text-[10px] text-zinc-500">{new Date(d.declaredAt).toLocaleString("fr-FR")}</p>
                  {d.captureUrl && (
                    <img src={d.captureUrl} alt="preuve" className="mt-3 w-full max-h-40 object-contain rounded-lg border border-[#22222F] bg-[#101015]" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {canDeclare && isParticipant && !myDeclaration && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">{match.player_a.username} (A)</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={scoreA}
                  onChange={(e) => setScoreA(parseInt(e.target.value) || 0)}
                  className="mt-2 h-12 w-full rounded-xl border border-[#22222F] bg-[#08080B] px-4 text-[18px] font-black text-center text-white focus:border-[#7C3AED] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">{match.player_b?.username || "Adversaire"} (B)</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={scoreB}
                  onChange={(e) => setScoreB(parseInt(e.target.value) || 0)}
                  className="mt-2 h-12 w-full rounded-xl border border-[#22222F] bg-[#08080B] px-4 text-[18px] font-black text-center text-white focus:border-[#7C3AED] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {}}
                className={`h-12 rounded-xl border text-[11px] font-black transition ${scoreA > scoreB ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300" : "border-[#22222F] bg-[#101015] text-zinc-500"}`}
                disabled
              >
                {scoreA > scoreB ? "🏆 Je déclare VICTOIRE" : "Victoire si A > B"}
              </button>
              <div className="rounded-xl border border-[#22222F] bg-[#101015] p-3 flex items-center justify-center text-[11px] text-zinc-500">
                Score final réel sur eFootball
              </div>
            </div>

            {/* Upload capture */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <ImageIcon className="h-3.5 w-3.5" /> CAPTURE ÉCRAN RÉSULTAT (JPG/PNG max 5Mo)
              </label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`mt-2 rounded-xl border-2 border-dashed p-6 text-center transition ${dragOver ? "border-[#7C3AED] bg-[#7C3AED]/10" : "border-[#22222F] bg-[#08080B]"}`}
              >
                {captureUrl ? (
                  <div className="relative">
                    <img src={captureUrl} alt="preview" className="mx-auto max-h-48 rounded-lg border border-[#22222F]" />
                    <p className="mt-2 text-[11px] text-zinc-400">{captureName}</p>
                    <button onClick={() => { setCaptureUrl(null); setCaptureName(""); }} className="mt-3 inline-flex items-center gap-1 rounded-full border border-[#22222F] bg-[#15151E] px-3 py-1 text-[11px] text-zinc-400 hover:text-white">
                      <Trash2 className="h-3.5 w-3.5" /> Supprimer
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-8 w-8 text-zinc-600" />
                    <p className="mt-2 text-[12px] font-bold text-zinc-400">Glisse ta capture ici ou clique</p>
                    <p className="mt-1 text-[10px] text-zinc-600">Écran fin de match KONAMI - preuve obligatoire</p>
                    <button onClick={() => fileRef.current?.click()} className="mt-3 rounded-full bg-white text-black px-4 py-2 text-[11px] font-black">CHOISIR UN FICHIER</button>
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/jpg,image/webp" className="hidden" onChange={(e) => { const f=e.target.files?.[0]; if(f) handleFile(f); }} />
                  </>
                )}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={localLoading || isLoading}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-[13px] font-black tracking-wide text-white shadow-[0_0_25px_rgba(124,58,237,0.4)] hover:opacity-90 transition disabled:opacity-50"
            >
              {localLoading ? "Envoi..." : "ENVOYER LA CAPTURE & DÉCLARER"}
            </button>

            <p className="text-center text-[10px] text-zinc-600">
              Si A dit 3-1 et B dit 1-3 → auto confirmé. Si différent → <span className="text-red-400 font-bold">CONTESTATION</span> → admin intervient.
            </p>
          </>
        )}

        {myDeclaration && !hasBoth && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-center">
            <CheckCircle2 className="mx-auto h-6 w-6 text-amber-400" />
            <p className="mt-2 text-[13px] font-black text-amber-200">Déclaration envoyée - en attente de ton adversaire</p>
            <p className="mt-1 text-[11px] text-zinc-400">Score déclaré: {myDeclaration.scoreA}-{myDeclaration.scoreB}</p>
            <p className="mt-2 text-[10px] text-zinc-500">Notification envoyée à l\'adversaire</p>
          </div>
        )}

        {hasBoth && check?.match === true && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 p-4 text-center">
            <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-400" />
            <p className="mt-2 text-[14px] font-black text-emerald-200">RÉSULTAT CONCORDANT - AUTO CONFIRMÉ ✓</p>
            <p className="mt-1 text-[12px] text-zinc-300">Score: {match.result_declarations[0].scoreA}-{match.result_declarations[0].scoreB} • Gagnant: {check.winnerId === match.player_a.id ? match.player_a.username : match.player_b?.username}</p>
          </div>
        )}

        {hasBoth && check?.match === false && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/15 p-4 text-center">
            <XCircle className="mx-auto h-7 w-7 text-red-400" />
            <p className="mt-2 text-[13px] font-black text-red-300">DÉCLARATIONS DIFFÉRENTES - CONTESTATION</p>
            <p className="mt-1 text-[11px] text-zinc-400">{check.reason}</p>
          </div>
        )}
      </div>
    </div>
  );
}
