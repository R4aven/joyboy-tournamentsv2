"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Trophy, Clock, Users, Shield, Copy, Check, Gamepad2, Phone, Upload, Image as ImageIcon, X, AlertTriangle, MessageCircle, Crown, Swords } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

// Statuts 100% français - ordre réel
const STATUTS = [
  { id: "PROGRAMME", label: "MATCH PROGRAMMÉ", color: "bg-zinc-800 text-zinc-300 border-zinc-700" },
  { id: "EN_ATTENTE_SALON", label: "EN ATTENTE DU SALON", color: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
  { id: "SALON_CREE", label: "SALON CRÉÉ", color: "bg-violet-500/10 text-violet-300 border-violet-500/20" },
  { id: "EN_ATTENTE_ADVERSAIRE", label: "EN ATTENTE DE L'ADVERSAIRE", color: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
  { id: "JOUEURS_CONNECTES", label: "JOUEURS CONNECTÉS", color: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20" },
  { id: "MATCH_EN_COURS", label: "MATCH EN COURS", color: "bg-blue-500/15 text-blue-300 border-blue-500/20 animate-pulse" },
  { id: "RESULTAT_EN_ATTENTE", label: "RÉSULTAT EN ATTENTE", color: "bg-orange-500/10 text-orange-300 border-orange-500/20" },
  { id: "RESULTAT_CONFIRME", label: "RÉSULTAT CONFIRMÉ", color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
  { id: "CONTESTATION", label: "CONTESTATION", color: "bg-red-500/15 text-red-300 border-red-500/20" },
  { id: "TERMINE", label: "TERMINÉ", color: "bg-zinc-800 text-zinc-400 border-zinc-700" },
];

function getStatusLabel(id: string) {
  return STATUTS.find(s=>s.id===id)?.label || id;
}
function getStatusColor(id: string) {
  return STATUTS.find(s=>s.id===id)?.color || "bg-zinc-800 text-zinc-400";
}

export default function MatchSalonPage() {
  const params = useParams();
  const matchId = params.matchId as string;
  const supabase = createClient();
  
  // Mock user pour démo - en prod viendra de useAuth
  const [currentUserId, setCurrentUserId] = useState("player_a"); // player_a, player_b, other, admin
  const [statut, setStatut] = useState("PROGRAMME");
  const [salonInfo, setSalonInfo] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [salonForm, setSalonForm] = useState({ salon_id: "", salon_code: "", instructions: "Rejoins en amical, cherche mon pseudo eFootball, 6min, équipe normale. Confirme quand tu es connecté, champion !" });
  const [playerAConnected, setPlayerAConnected] = useState(false);
  const [playerBConnected, setPlayerBConnected] = useState(false);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [capture, setCapture] = useState<File|null>(null);
  const [preview, setPreview] = useState<string|null>(null);
  const [declarations, setDeclarations] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState("2h 15m");

  // Mock joueurs
  const playerA = { id: "player_a", pseudo: "RavenCI", efootball: "RavenCI_eFoot", whatsapp: "07 48 23 52 26", avatar: "RC", wins: 47, losses: 12, palmarès: "🏆 Champion x2 • 🥇 Vainqueur x3", taux: 79 };
  const playerB = { id: "player_b", pseudo: "Kev_225", efootball: "Kev_eFoot", whatsapp: "07 12 34 56 78", avatar: "K2", wins: 39, losses: 18, palmarès: "🥈 Finaliste • 🔥 Série 5V", taux: 68 };
  
  const isParticipant = currentUserId === "player_a" || currentUserId === "player_b" || currentUserId === "admin";
  const isAdmin = currentUserId === "admin";
  const canViewSalon = isParticipant; // RLS: seulement A, B, ADMIN
  const isCreator = currentUserId === "player_a"; // Joueur A crée en général

  useEffect(() => {
    const interval = setInterval(() => {
      // Mock countdown
      setTimeLeft(prev => prev);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateSalon = async () => {
    if (!salonForm.salon_id || !salonForm.instructions) {
      toast.error("ID salon et instructions obligatoires");
      return;
    }
    // En prod: await supabase.from('match_salons').upsert({ match_id: matchId, salon_id: salonForm.salon_id, ... })
    setSalonInfo({ ...salonForm, created_by: currentUserId, created_at: new Date().toISOString() });
    setStatut("SALON_CREE");
    setShowCreateForm(false);
    toast.success("Salon créé ! Ton adversaire a été notifié 🎮");
    // Notif en prod
  };

  const handleConnect = (player: string) => {
    if (player === "A") setPlayerAConnected(true);
    if (player === "B") setPlayerBConnected(true);
    if ((player === "A" && playerBConnected) || (player === "B" && playerAConnected) || (playerAConnected && playerBConnected)) {
      setStatut("JOUEURS_CONNECTES");
      toast.success("Les deux joueurs sont connectés ! Vous pouvez lancer le match sur eFootball");
    } else {
      toast.success("Connexion enregistrée, en attente de l'adversaire");
    }
  };

  const handleStartMatch = () => {
    setStatut("MATCH_EN_COURS");
    toast.info("Vous allez maintenant jouer votre match sur eFootball. Bonne chance champion !");
  };

  const handleSendResult = () => {
    if (!capture) {
      toast.error("Ajoute ta capture eFootball");
      return;
    }
    const decl = { playerId: currentUserId, scoreA, scoreB, isVictory: (currentUserId === "player_a" && scoreA > scoreB) || (currentUserId === "player_b" && scoreB > scoreA), capture: preview, at: new Date().toISOString() };
    const newDecls = [...declarations, decl];
    setDeclarations(newDecls);
    
    if (newDecls.length === 1) {
      setStatut("RESULTAT_EN_ATTENTE");
      toast.success("Résultat envoyé, en attente de la confirmation adverse");
    } else if (newDecls.length === 2) {
      const d1 = newDecls[0];
      const d2 = newDecls[1];
      if (d1.scoreA === d2.scoreA && d1.scoreB === d2.scoreB) {
        setStatut("RESULTAT_CONFIRME");
        toast.success("Résultat confirmé ! Les deux déclarations correspondent ✅");
        setTimeout(() => {
          setStatut("TERMINE");
          toast.success("🏆 Match terminé ! Vainqueur avance dans le bracket, palmarès mis à jour");
        }, 1500);
      } else {
        setStatut("CONTESTATION");
        toast.error("Contestation - déclarations différentes, admin va intervenir");
      }
    }
  };

  const handleFile = (f: File) => {
    if (!["image/jpeg","image/png","image/jpg","image/webp"].includes(f.type)) { toast.error("JPG, PNG, WEBP uniquement"); return; }
    if (f.size > 5*1024*1024) { toast.error("Max 5Mo"); return; }
    setCapture(f);
    setPreview(URL.createObjectURL(f));
  };

  return (
    <div className="min-h-screen bg-[#08080B] text-white">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Link href="/matches" className="text-[12px] text-zinc-500 hover:text-white">← Mes matchs</Link>
        
        {/* Debug switch */}
        <div className="mt-4 flex gap-2">
          <span className="text-[11px] text-zinc-500">Tester en tant que:</span>
          {["player_a","player_b","other","admin"].map(id=>(
            <button key={id} onClick={()=>setCurrentUserId(id)} className={`rounded-full px-3 py-1 text-[10px] font-bold border ${currentUserId===id ? "bg-white text-black border-white" : "bg-[#15151E] border-[#22222F] text-zinc-400"}`}>{id}</button>
          ))}
        </div>

        <div className="mt-6 rounded-[20px] border border-[#22222F] bg-[#101015] p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 px-3 py-1 text-[10px] font-black">TOURNOI • JOYBOY CUP #12 • Quarts</span>
              <span className={`rounded-full px-3 py-1 text-[10px] font-black border ${getStatusColor(statut)}`}>{getStatusLabel(statut)}</span>
            </div>
            <span className="text-[11px] text-zinc-500 flex items-center gap-1"><Clock className="h-3 w-3" /> Temps restant: {timeLeft}</span>
          </div>
          
          <div className="mt-6 grid md:grid-cols-[1fr_auto_1fr] items-center gap-6">
            <div className="rounded-[20px] border border-[#22222F] bg-[#15151E] p-5 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center font-black text-[18px]">{playerA.avatar}</div>
              <p className="mt-3 text-[16px] font-black">{playerA.pseudo}</p>
              <p className="text-[11px] text-zinc-500">eFootball: <span className="font-bold text-white">{playerA.efootball}</span></p>
              <p className="mt-2 text-[12px]">{playerA.palmarès}</p>
              <p className="text-[11px] text-zinc-500">{playerA.wins}V {playerA.losses}D • {playerA.taux}%</p>
              <div className="mt-3 flex justify-center"><span className={`h-2 w-2 rounded-full ${playerAConnected ? "bg-emerald-400" : "bg-zinc-600"}`} /> <span className="ml-2 text-[11px]">{playerAConnected ? "Connecté" : "Non connecté"}</span></div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-[#15151E] border border-[#22222F] flex items-center justify-center font-black text-[12px]">VS</div>
              <Swords className="mt-3 h-6 w-6 text-zinc-600" />
            </div>
            
            <div className="rounded-[20px] border border-[#22222F] bg-[#15151E] p-5 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center font-black text-[18px]">{playerB.avatar}</div>
              <p className="mt-3 text-[16px] font-black">{playerB.pseudo}</p>
              <p className="text-[11px] text-zinc-500">eFootball: <span className="font-bold text-white">{playerB.efootball}</span></p>
              <p className="mt-2 text-[12px]">{playerB.palmarès}</p>
              <p className="text-[11px] text-zinc-500">{playerB.wins}V {playerB.losses}D • {playerB.taux}%</p>
              <div className="mt-3 flex justify-center"><span className={`h-2 w-2 rounded-full ${playerBConnected ? "bg-emerald-400" : "bg-zinc-600"}`} /> <span className="ml-2 text-[11px]">{playerBConnected ? "Connecté" : "Non connecté"}</span></div>
            </div>
          </div>

          {/* Timeline */}
          <div className="mt-8 flex gap-1 overflow-x-auto">
            {STATUTS.slice(0,6).map((s,i)=>{
              const isPast = STATUTS.findIndex(st=>st.id===statut) >= i;
              return <div key={s.id} className="flex items-center gap-1"><div className={`h-2 w-2 rounded-full ${isPast ? "bg-emerald-400" : "bg-zinc-700"}`} /><span className={`text-[9px] font-bold whitespace-nowrap ${isPast ? "text-white" : "text-zinc-600"}`}>{s.label}</span>{i<5 && <div className={`h-px w-8 ${isPast ? "bg-emerald-400/50" : "bg-zinc-800"}`} />}</div>
            })}
          </div>
        </div>

        {/* SALON PRIVÉ - RLS SÉCURISÉ */}
        <div className="mt-6 rounded-[20px] border border-[#7C3AED]/30 bg-gradient-to-br from-[#7C3AED]/10 to-[#06B6D4]/10 p-6">
          <h3 className="text-[14px] font-black flex items-center gap-2">🔒 Salon eFootball privé</h3>
          <p className="mt-2 text-[12px] leading-relaxed text-zinc-300">Chaque rencontre JOYBOY doit utiliser un salon eFootball privé réservé exclusivement aux deux joueurs concernés. Les informations de connexion ne doivent jamais être visibles publiquement.</p>
          <div className="mt-3 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 flex gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-amber-200"><span className="font-black">Pourquoi privé ?</span> Parce qu'un salon public pourrait permettre à un autre joueur de venir perturber le match ou rejoindre la rencontre. JOYBOY ne doit pas afficher un faux salon privé : il gère seulement les informations réellement nécessaires au mode match en ligne eFootball.</p>
          </div>

          {!canViewSalon ? (
            <div className="mt-4 rounded-xl bg-[#101015] border border-red-500/20 p-4 text-center">
              <Shield className="mx-auto h-8 w-8 text-red-400" />
              <p className="mt-2 text-[13px] font-black">🔒 Salon privé - Accès refusé</p>
              <p className="text-[11px] text-zinc-500 mt-1">Informations visibles uniquement par {playerA.pseudo} et {playerB.pseudo} + admin. Chaque rencontre JOYBOY utilise un salon eFootball privé réservé exclusivement aux deux joueurs concernés.</p>
              <p className="text-[11px] text-zinc-600 mt-2">Tu es connecté en tant que: {currentUserId} (autre joueur) → pas autorisé. RLS Supabase bloque l'accès.</p>
            </div>
          ) : (
            <>
              {!salonInfo ? (
                <div className="mt-4">
                  {isCreator || isAdmin ? (
                    <>
                      {!showCreateForm ? (
                        <button onClick={()=>setShowCreateForm(true)} className="h-12 w-full rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-[13px] font-black">🎮 J'AI CRÉÉ LE SALON</button>
                      ) : (
                        <div className="rounded-xl bg-[#101015] border border-[#22222F] p-4 space-y-3">
                          <div><label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">ID / informations du salon eFootball *</label><input value={salonForm.salon_id} onChange={e=>setSalonForm({...salonForm, salon_id: e.target.value})} placeholder="Ex: 883472 ou RavenCI_225" className="mt-1 h-11 w-full rounded-xl border border-[#22222F] bg-[#15151E] px-4 text-[13px]" /></div>
                          <div><label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Code du salon (si nécessaire)</label><input value={salonForm.salon_code} onChange={e=>setSalonForm({...salonForm, salon_code: e.target.value})} placeholder="Ex: JOYBOY12" className="mt-1 h-11 w-full rounded-xl border border-[#22222F] bg-[#15151E] px-4 text-[13px]" /></div>
                          <div><label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Instructions *</label><textarea value={salonForm.instructions} onChange={e=>setSalonForm({...salonForm, instructions: e.target.value})} rows={3} className="mt-1 w-full rounded-xl border border-[#22222F] bg-[#15151E] p-3 text-[13px]" /></div>
                          <div className="flex gap-2"><button onClick={handleCreateSalon} className="flex-1 h-11 rounded-xl bg-white text-black text-[12px] font-black">Enregistrer salon privé</button><button onClick={()=>setShowCreateForm(false)} className="h-11 rounded-xl border border-[#22222F] bg-[#15151E] px-4 text-[12px]">Annuler</button></div>
                          <p className="text-[10px] text-zinc-500">⚠️ JOYBOY ne contrôle pas eFootball. Tu crées vraiment le salon sur eFootball, puis tu renseignes ici les infos pour ton adversaire. Table match_salons avec RLS: seulement toi, adversaire, admin.</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-xl bg-[#101015] border border-[#22222F] p-4 text-center"><p className="text-[12px] text-zinc-400">En attente que {playerA.pseudo} crée le salon eFootball privé...</p><p className="text-[11px] text-zinc-600 mt-1">Tu recevras une notification dès que c'est prêt.</p></div>
                  )}
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl bg-[#101015] border border-emerald-500/20 p-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-emerald-300">✅ Salon créé - Infos privées (visibles uniquement par vous 2 + admin)</p>
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between items-center rounded-lg bg-[#15151E] p-3"><span className="text-[11px] text-zinc-500">ID salon eFootball</span><div className="flex items-center gap-2"><span className="font-bold text-[13px]">{salonInfo.salon_id}</span><button onClick={()=>{navigator.clipboard.writeText(salonInfo.salon_id); toast.success("Copié");}} className="h-7 w-7 rounded-full bg-white text-black flex items-center justify-center"><Copy className="h-3 w-3" /></button></div></div>
                      {salonInfo.salon_code && <div className="flex justify-between items-center rounded-lg bg-[#15151E] p-3"><span className="text-[11px] text-zinc-500">Code</span><span className="font-bold">{salonInfo.salon_code}</span></div>}
                      <div className="rounded-lg bg-[#15151E] p-3"><span className="text-[11px] text-zinc-500">Instructions</span><p className="mt-1 text-[13px] leading-relaxed">{salonInfo.salon_instructions}</p></div>
                    </div>
                    <p className="mt-3 text-[10px] text-zinc-500">🔒 Stocké dans table match_salons avec RLS: SELECT seulement si is_match_participant_secure(match_id) OR is_staff(). Autre joueur ne peut pas récupérer via Supabase.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={()=>handleConnect(currentUserId==="player_a" ? "A" : "B")} className="h-11 rounded-xl border border-[#22222F] bg-[#15151E] text-[12px] font-bold">✅ JE SUIS CONNECTÉ</button>
                    <a href={`https://wa.me/${(currentUserId==="player_a" ? playerB : playerA).whatsapp.replace(/ /g,"")}?text=Yo%20je%20rejoins%20le%20salon%20${salonInfo.salon_id}`} target="_blank" className="h-11 rounded-xl bg-[#25D366] text-black flex items-center justify-center gap-2 text-[12px] font-black">💬 CONTACTER ADVERSAIRE</a>
                  </div>
                  {playerAConnected && playerBConnected && statut !== "MATCH_EN_COURS" && <button onClick={handleStartMatch} className="h-12 w-full rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-[13px] font-black">🎮 JOUER LE MATCH - Vous allez maintenant jouer sur eFootball</button>}
                </div>
              )}
            </>
          )}
        </div>

        {/* PREUVE */}
        {["JOUEURS_CONNECTES","MATCH_EN_COURS","RESULTAT_EN_ATTENTE","RESULTAT_CONFIRME","CONTESTATION","TERMINE"].includes(statut) && canViewSalon && (
          <div className="mt-6 rounded-[20px] border border-[#22222F] bg-[#101015] p-6">
            <h3 className="text-[14px] font-black">📸 Envoyer le résultat</h3>
            <p className="text-[11px] text-zinc-500 mt-1">Après avoir joué réellement sur eFootball, reviens ici.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div><label className="text-[11px] font-bold uppercase text-zinc-500">Score {playerA.pseudo}</label><input type="number" value={scoreA} onChange={e=>setScoreA(parseInt(e.target.value)||0)} className="mt-1 h-11 w-full rounded-xl border border-[#22222F] bg-[#15151E] px-4" /></div>
              <div><label className="text-[11px] font-bold uppercase text-zinc-500">Score {playerB.pseudo}</label><input type="number" value={scoreB} onChange={e=>setScoreB(parseInt(e.target.value)||0)} className="mt-1 h-11 w-full rounded-xl border border-[#22222F] bg-[#15151E] px-4" /></div>
            </div>
            <div className="mt-4">
              {!preview ? (
                <label className="flex h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#22222F] bg-[#15151E] hover:border-[#7C3AED]/50"><input type="file" accept="image/jpeg,image/png,image/jpg,image/webp" className="hidden" onChange={e=>{const f=e.target.files?.[0]; if(f) handleFile(f);}} /><ImageIcon className="h-6 w-6 text-zinc-600" /><p className="mt-2 text-[12px] font-bold">Choisir capture eFootball</p><p className="text-[10px] text-zinc-500">JPG/PNG/WEBP max 5Mo</p></label>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-[#22222F]"><img src={preview} className="max-h-[250px] w-full object-contain bg-black" /><button onClick={()=>{setCapture(null); setPreview(null);}} className="absolute right-2 top-2 h-7 w-7 rounded-full bg-black/70 flex items-center justify-center"><X className="h-4 w-4" /></button></div>
              )}
            </div>
            <button onClick={handleSendResult} className="mt-4 h-12 w-full rounded-xl bg-white text-black text-[13px] font-black">ENVOYER MON RÉSULTAT</button>
            <p className="mt-2 text-[10px] text-zinc-500">Captures stockées dans Storage privé match-proofs, RLS: seulement participants + admin. Un joueur ne peut pas voir captures d'un autre match.</p>
          </div>
        )}

        {/* DOUBLE CONFIRMATION */}
        {declarations.length > 0 && (
          <div className="mt-6 rounded-[20px] border border-[#22222F] bg-[#101015] p-6">
            <h3 className="text-[14px] font-black">🤝 Double confirmation</h3>
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              {declarations.map((d,i)=>(
                <div key={i} className="rounded-xl border border-[#22222F] bg-[#15151E] p-4">
                  <p className="text-[12px] font-bold">{d.playerId === "player_a" ? playerA.pseudo : playerB.pseudo} déclare: {d.scoreA} - {d.scoreB}</p>
                  {d.capture && <img src={d.capture} className="mt-2 rounded-lg max-h-[120px] w-full object-contain bg-black" />}
                  <p className="text-[10px] text-zinc-500 mt-1">{new Date(d.at).toLocaleString("fr-FR")}</p>
                </div>
              ))}
            </div>
            {declarations.length === 2 && (
              <div className="mt-4">
                {declarations[0].scoreA === declarations[1].scoreA && declarations[0].scoreB === declarations[1].scoreB ? (
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center"><p className="text-[13px] font-black text-emerald-300">✅ RÉSULTAT CONFIRMÉ - Les deux déclarations correspondent (ex: Raven 3-1 Kevin et Kevin 1-3 Raven)</p><p className="text-[11px] text-emerald-200/70 mt-1">Vainqueur avance dans bracket, palmarès maj, notif envoyée</p></div>
                ) : (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center"><p className="text-[13px] font-black text-red-300">🚨 CONTESTATION - Déclarations différentes (ex: A dit 3-1, B dit 2-1) → Admin intervient</p><p className="text-[11px] text-red-200/70 mt-1">Admin voit captures, décide résultat officiel</p></div>
                )}
              </div>
            )}
          </div>
        )}

        {statut === "TERMINE" && (
          <div className="mt-6 rounded-[20px] border border-amber-500/20 bg-amber-500/10 p-6 text-center">
            <Crown className="mx-auto h-10 w-10 text-amber-400" />
            <p className="mt-3 text-[18px] font-black">🏆 Bravo ! Match terminé</p>
            <p className="text-[12px] text-zinc-400">Vainqueur avance dans bracket, perdant éliminé, stats + palmarès mis à jour, notification envoyée</p>
          </div>
        )}

        <div className="mt-8 text-center">
          <a href="https://wa.me/2250748235226?text=Bonjour%20JOYBOY%20besoin%20d'aide%20match%20eFootball" target="_blank" className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-[13px] font-black text-black">💬 BESOIN D'AIDE ? WHATSAPP 07 48 23 52 26</a>
          <p className="mt-2 text-[11px] text-zinc-600">Wave paiement officiel: 01 51 42 99 18 • Gains: Encaisse ton djai sur Wave ! 🇨🇮</p>
        </div>
      </div>
    </div>
  );
}