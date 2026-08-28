
"use client";
/**
 * 🇨🇮 JOYBOY - SalonDeMatch.tsx
 * Affiche infos salon eFootball UNIQUEMENT si user est joueur A/B ou admin.
 * JOYBOY organise seulement - pas d\'API eFootball.
 */
import { useState } from "react";
import { Copy, Eye, EyeOff, Lock, ShieldCheck, Gamepad2, Info, Check, AlertTriangle, Clock } from "lucide-react";
import type { EfootballMatch, SalonInfo } from "@/lib/matches/types";
import type { CanViewSalon } from "@/lib/matches/types";

interface Props {
  match: EfootballMatch;
  canView: CanViewSalon;
  currentUserId: string | null;
  onCreateSalon: (info: { salonId: string; code: string; instructions: string }) => Promise<void> | void;
  onMarkConnected: () => Promise<void> | void;
  onStartMatch: () => Promise<void> | void;
  isLoading?: boolean;
}

export default function SalonDeMatch({ match, canView, currentUserId, onCreateSalon, onMarkConnected, onStartMatch, isLoading }: Props) {
  const [salonId, setSalonId] = useState(match.salon_info?.salonId || "");
  const [code, setCode] = useState(match.salon_info?.code || "");
  const [instructions, setInstructions] = useState(match.salon_info?.instructions || "");
  const [showCode, setShowCode] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  const isCreator = canView.isCreator;
  const hasSalon = !!match.salon_info;
  const isPlayerA = canView.reason === "PLAYER_A";
  const isPlayerB = canView.reason === "PLAYER_B";
  const isParticipant = isPlayerA || isPlayerB;
  const connected = isPlayerA ? match.player_a_connected : match.player_b_connected;

  const copy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {}
  };

  const handleCreate = async () => {
    if (!salonId.trim()) {
      alert("ID Salon eFootball obligatoire");
      return;
    }
    if (!instructions.trim()) {
      alert("Instructions obligatoires");
      return;
    }
    setLocalLoading(true);
    try {
      await onCreateSalon({ salonId: salonId.trim(), code: code.trim(), instructions: instructions.trim() });
    } finally {
      setLocalLoading(false);
    }
  };

  // Accès refusé - masqué totalement si pas participant ni admin
  if (!canView.canView) {
    return (
      <div className="rounded-[20px] border border-[#22222F] bg-[#15151E]/60 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#22222F] border border-[#333]">
          <Lock className="h-6 w-6 text-zinc-400" />
        </div>
        <h3 className="mt-4 text-[14px] font-black tracking-wide">SALON PRIVÉ</h3>
        <p className="mt-2 text-[12px] leading-relaxed text-zinc-500 max-w-sm mx-auto">
          Les infos de connexion eFootball sont visibles uniquement par les 2 joueurs + admin.
          <br />JOYBOY organise seulement - les joueurs jouent réellement sur eFootball.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-bold text-amber-300">
          <ShieldCheck className="h-3.5 w-3.5" /> Accès réservé aux participants
        </div>
      </div>
    );
  }

  // Formulaire création si pas encore créé et user peut créer
  if (!hasSalon) {
    return (
      <div className="rounded-[24px] border border-violet-500/20 bg-gradient-to-b from-[#15151E] to-[#101015] p-6 shadow-[0_0_40px_rgba(124,58,237,0.15)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center shadow-lg">
              <Gamepad2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-[14px] font-black tracking-wide">CRÉER LE SALON eFOOTBALL</h3>
              <p className="text-[11px] text-zinc-500">Tu es le créateur - renseigne les infos pour ton adversaire</p>
            </div>
          </div>
          <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-black text-cyan-300">PRIVÉ</span>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
              ID SALON / SALLE eFOOTBALL <span className="text-red-400">*</span>
            </label>
            <input
              value={salonId}
              onChange={(e) => setSalonId(e.target.value)}
              placeholder="Ex: RavenCI_225, Salle 4521, KONAMI ID..."
              className="mt-2 h-12 w-full rounded-xl border border-[#22222F] bg-[#08080B] px-4 text-[13px] font-medium text-white placeholder:text-zinc-600 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]/30"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">CODE / INFOS CONNEXION (optionnel)</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ex: 1234, Amical, Aucun mot de passe..."
              className="mt-2 h-12 w-full rounded-xl border border-[#22222F] bg-[#08080B] px-4 text-[13px] text-white placeholder:text-zinc-600 focus:border-[#7C3AED] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
              INSTRUCTIONS <span className="text-red-400">*</span>
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ex: Rejoins en amical, cherche RavenCI, on se retrouve en salle eFootball. Match 6min, pas de prolong."
              rows={3}
              className="mt-2 w-full rounded-xl border border-[#22222F] bg-[#08080B] px-4 py-3 text-[13px] leading-relaxed text-white placeholder:text-zinc-600 focus:border-[#7C3AED] focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p className="text-[11px] leading-relaxed text-zinc-400">
              <span className="font-bold text-amber-300">IMPORTANT:</span> JOYBOY organise seulement. Tu joues réellement sur eFootball, puis tu reviens confirmer ici. Pas d\'API eFootball.
            </p>
          </div>

          <button
            onClick={handleCreate}
            disabled={localLoading || isLoading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-[13px] font-black tracking-wide text-white shadow-[0_0_20px_rgba(124,58,237,0.35)] hover:opacity-90 transition disabled:opacity-50"
          >
            {localLoading ? <Clock className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            J\'AI CRÉÉ LE SALON
          </button>
          <p className="text-center text-[10px] text-zinc-600">Visible uniquement par les joueurs concernés et l'administration.</p>
        </div>
      </div>
    );
  }

  // Affichage lecture (salon déjà créé)
  const info = match.salon_info as SalonInfo;
  return (
    <div className="rounded-[24px] border border-[#22222F] bg-[#15151E] overflow-hidden">
      <div className="border-b border-[#22222F] bg-gradient-to-r from-[#7C3AED]/10 via-transparent to-[#06B6D4]/10 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#101015] border border-[#22222F] flex items-center justify-center">
            <Gamepad2 className="h-5 w-5 text-[#7C3AED]" />
          </div>
          <div>
            <h3 className="text-[13px] font-black tracking-wide flex items-center gap-2">
              ESPACE CONNEXION eFOOTBALL
              <span className={`h-2 w-2 rounded-full ${match.player_a_connected && match.player_b_connected ? "bg-emerald-400 animate-pulse" : "bg-amber-400 animate-pulse"}`} />
            </h3>
            <p className="text-[11px] text-zinc-500">Créé par {isCreator ? "toi" : match.player_a.id === info.createdBy ? match.player_a.username : match.player_b?.username} • {new Date(info.createdAt).toLocaleTimeString("fr-FR")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
            <Lock className="h-3 w-3" /> PRIVÉ
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Ligne ID salon avec copier */}
        <div className="rounded-xl border border-[#22222F] bg-[#08080B] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">ID SALON / SALLE</p>
              <p className="mt-1 text-[14px] font-black text-white tracking-wide break-all">{info.salonId}</p>
            </div>
            <button
              onClick={() => copy(info.salonId, "salonId")}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#22222F] bg-[#15151E] hover:border-[#7C3AED]/50 transition"
            >
              {copiedField === "salonId" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-zinc-400" />}
            </button>
          </div>
        </div>

        {info.code && (
          <div className="rounded-xl border border-[#22222F] bg-[#08080B] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">CODE / INFOS</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-[13px] font-bold text-white">{showCode ? info.code : "••••••"}</p>
                  <button onClick={() => setShowCode(!showCode)} className="text-zinc-500 hover:text-white">
                    {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button
                onClick={() => copy(info.code, "code")}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#22222F] bg-[#15151E] hover:border-[#7C3AED]/50 transition"
              >
                {copiedField === "code" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-zinc-400" />}
              </button>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-[#22222F] bg-[#08080B] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">INSTRUCTIONS</p>
              <p className="mt-2 text-[12px] leading-relaxed text-zinc-300 whitespace-pre-wrap">{info.instructions}</p>
            </div>
            <button
              onClick={() => copy(info.instructions, "instructions")}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#22222F] bg-[#15151E] hover:border-[#7C3AED]/50 transition"
            >
              {copiedField === "instructions" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-zinc-400" />}
            </button>
          </div>
        </div>

        {/* Statuts connexion */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-xl border p-3 flex items-center gap-2 ${match.player_a_connected ? "border-emerald-500/20 bg-emerald-500/10" : "border-[#22222F] bg-[#101015]"}`}>
            <div className={`h-2 w-2 rounded-full ${match.player_a_connected ? "bg-emerald-400" : "bg-zinc-600"}`} />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold truncate">{match.player_a.username}</p>
              <p className="text-[10px] text-zinc-500">{match.player_a_connected ? "Connecté ✓" : "Pas encore"}</p>
            </div>
          </div>
          <div className={`rounded-xl border p-3 flex items-center gap-2 ${match.player_b_connected ? "border-emerald-500/20 bg-emerald-500/10" : "border-[#22222F] bg-[#101015]"}`}>
            <div className={`h-2 w-2 rounded-full ${match.player_b_connected ? "bg-emerald-400" : "bg-zinc-600"}`} />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold truncate">{match.player_b?.username || "Adversaire"}</p>
              <p className="text-[10px] text-zinc-500">{match.player_b_connected ? "Connecté ✓" : "Pas encore"}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {isParticipant && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {!connected && (
              <button
                onClick={() => onMarkConnected()}
                disabled={isLoading}
                className="h-12 rounded-xl bg-white text-black text-[12px] font-black tracking-wide hover:bg-zinc-200 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" /> JE SUIS CONNECTÉ
              </button>
            )}
            {connected && match.status !== "MATCH_EN_COURS" && match.status !== "RESULTAT_EN_ATTENTE" && match.status !== "TERMINE" && (
              <button
                onClick={() => onStartMatch()}
                disabled={isLoading || !(match.player_a_connected && match.player_b_connected)}
                className="h-12 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#7C3AED] text-white text-[12px] font-black tracking-wide shadow-lg hover:opacity-90 transition disabled:opacity-40 flex items-center justify-center gap-2 col-span-2 sm:col-span-1"
              >
                <Gamepad2 className="h-4 w-4" /> MATCH EN COURS
              </button>
            )}
            {match.status === "MATCH_EN_COURS" && (
              <div className="col-span-2 rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-center">
                <p className="text-[12px] font-black text-blue-300">🎮 MATCH EN COURS SUR eFOOTBALL</p>
                <p className="mt-1 text-[11px] text-zinc-400">Joue réellement puis reviens déclarer le score</p>
              </div>
            )}
            {connected && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 flex items-center gap-2 text-emerald-300 text-[11px] font-bold">
                <Check className="h-4 w-4" /> Toi: connecté
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-[10px] text-zinc-600 justify-center pt-1">
          <AlertTriangle className="h-3 w-3" /> Jamais public. RLS: (player_id IN OR is_admin). JOYBOY n\'accède pas à eFootball.
        </div>
      </div>
    </div>
  );
}
