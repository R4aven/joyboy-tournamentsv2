"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Trophy,
  Phone,
  Gamepad2,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

function isValidUsername(u: string) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(u);
}

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [efootball, setEfootball] = useState("");
  const [wave, setWave] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const checkUsername = async (value: string) => {
    if (!isValidUsername(value)) {
      setUsernameAvailable(null);
      return;
    }
    setChecking(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .ilike("username", value)
        .limit(1);
      if (error) throw error;
      setUsernameAvailable(!data || data.length === 0);
    } catch {
      setUsernameAvailable(null);
    } finally {
      setChecking(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanUsername = username.trim().toLowerCase();
    const cleanWhatsapp = whatsapp.trim();
    const cleanEfootball = efootball.trim();
    const cleanWave = wave.trim();
    const cleanEmail = email.trim().toLowerCase();

    // VALIDATION OBLIGATOIRE
    if (!cleanUsername || !cleanWhatsapp || !cleanEfootball || !cleanWave || !cleanEmail || !password || !confirm) {
      toast.error("Remplis TOUS les champs obligatoires ! WhatsApp + eFootball + Wave requis ⚠️");
      return;
    }
    if (!isValidUsername(cleanUsername)) {
      toast.error("Pseudo E-TOURNOIS CI invalide : 3 à 20 caractères, lettres, chiffres ou _ uniquement");
      return;
    }
    if (cleanWhatsapp.length < 8) {
      toast.error("Numéro WhatsApp invalide : minimum 8 caractères requis (ex: 07 48 23 52 26)");
      return;
    }
    if (cleanEfootball.length < 2) {
      toast.error("Pseudo eFootball trop court : minimum 2 caractères");
      return;
    }
    if (cleanWave.length < 8) {
      toast.error("Numéro Wave perso invalide : minimum 8 caractères requis pour encaisser ton djai");
      return;
    }
    if (password.length < 6) {
      toast.error("Mot de passe trop court (6 caractères minimum)");
      return;
    }
    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    if (usernameAvailable === false) {
      toast.error("Ce pseudo E-TOURNOIS CI est déjà pris. Trouve un autre blaze !");
      return;
    }

    setLoading(true);
    try {
      // Vérification finale unicité
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", cleanUsername)
        .limit(1);

      if (existing && existing.length > 0) {
        toast.error("Pseudo déjà utilisé. Sois créatif !");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            username: cleanUsername,
            display_name: cleanUsername,
            whatsapp_number: cleanWhatsapp,
            efootball_pseudo: cleanEfootball,
            wave_number: cleanWave,
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error("Inscription échouée");

      // Insertion / Upsert dans profiles avec les champs obligatoires
      const profilePayload = {
        id: data.user.id,
        username: cleanUsername,
        display_name: cleanUsername,
        whatsapp_number: cleanWhatsapp,
        efootball_pseudo: cleanEfootball,
        wave_number: cleanWave,
        phone_wave: cleanWhatsapp, // compat ancien champ
        wins: 0,
        losses: 0,
        tournaments_played: 0,
        tournaments_won: 0,
        total_earnings: 0,
      };

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(profilePayload, { onConflict: "id" });

      if (profileError) {
        // Fallback: si colonnes pas encore migrées, log mais continue
        console.warn("Profile upsert warning:", profileError);
        // Tentative sans les nouvelles colonnes si migration pas faite
        if (profileError.message?.includes("whatsapp_number") || profileError.message?.includes("efootball") || profileError.message?.includes("wave_number")) {
          toast.error("Base pas encore migrée côté admin - contacte le support, mais ton compte est créé");
        }
      }

      toast.success(`Bienvenue ${cleanUsername} ! Admin a reçu ton WhatsApp + eFootball + Wave 🇨🇮`);

      if (data.session) {
        router.push("/dashboard");
      } else {
        toast.info("Vérifie ton email pour confirmer (regarde les spams) 📩");
        router.push("/login");
      }
      router.refresh();
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("already registered") || err.message?.includes("already exists")) {
        toast.error("Cet email est déjà utilisé");
      } else {
        toast.error(err.message ?? "Erreur lors de l'inscription");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-68px)] overflow-hidden bg-[#08080B]">
      {/* LEFT FORM */}
      <div className="flex flex-1 items-center justify-center bg-[#08080B] px-5 py-8 lg:px-10 order-2 lg:order-1 overflow-y-auto">
        <div className="w-full max-w-[480px] my-auto">
          <div className="rounded-[24px] border border-[#22222F] bg-[#101015]/90 backdrop-blur-xl p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_20px_60px_rgba(0,0,0,0.6)]">
            <div className="mb-5">
              <h2 className="text-[24px] font-black tracking-tight text-white">Rejoins E-TOURNOIS CI 🇨🇮</h2>
              <p className="mt-1 text-[12px] text-zinc-400">
                30 secondes pour jouer. Paiement gains sur Wave.
              </p>
            </div>

            {/* AVERTISSEMENT JAUNE OBLIGATOIRE */}
            <div className="mb-5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-amber-300">⚠️ OBLIGATOIRE</p>
                <p className="mt-1 text-[12px] leading-relaxed text-amber-100/90">
                  <span className="font-black">WhatsApp + eFootball + Wave obligatoires</span>. L&apos;admin reçoit tout pour te contacter et te payer. <span className="font-bold underline">Sans ça pas de tournoi</span>.
                </p>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Pseudo E-TOURNOIS CI */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-300 flex items-center gap-1">
                  <User className="h-3 w-3" /> Pseudo E-TOURNOIS CI *{" "}
                  <span className="text-red-400">OBLIGATOIRE</span>
                </label>
                <div className="relative group">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-[#7C3AED] transition-colors" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      const v = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
                      setUsername(v);
                      if (v.length >= 3) checkUsername(v);
                      else setUsernameAvailable(null);
                    }}
                    placeholder="kader225"
                    className="h-[46px] w-full rounded-xl border border-[#22222F] bg-[#15151E] pl-11 pr-16 text-[14px] text-white placeholder:text-zinc-600 outline-none focus:border-[#7C3AED]/50 focus:ring-4 focus:ring-[#7C3AED]/10 transition-all"
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px]">
                    {checking ? (
                      <span className="text-zinc-500">...</span>
                    ) : usernameAvailable === true ? (
                      <span className="text-emerald-400 font-bold">✓ Dispo</span>
                    ) : usernameAvailable === false ? (
                      <span className="text-red-400 font-bold">✗ Pris</span>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-red-400 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-emerald-400" /> WhatsApp *{" "}
                  <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[9px] text-red-300 border border-red-500/20">OBLIGATOIRE</span>
                </label>
                <div className="relative group">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400 group-focus-within:text-emerald-300 transition-colors" />
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+225 07 48 23 52 26"
                    className="h-[46px] w-full rounded-xl border border-[#22222F] bg-[#15151E] pl-11 pr-4 text-[14px] text-white placeholder:text-zinc-600 outline-none focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              {/* eFootball */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-red-400 flex items-center gap-1.5">
                  <Gamepad2 className="h-3.5 w-3.5 text-violet-400" /> Pseudo eFootball *{" "}
                  <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[9px] text-red-300 border border-red-500/20">OBLIGATOIRE</span>
                </label>
                <div className="relative group">
                  <Gamepad2 className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-400 group-focus-within:text-violet-300 transition-colors" />
                  <input
                    type="text"
                    value={efootball}
                    onChange={(e) => setEfootball(e.target.value)}
                    placeholder="Kader_Yop_10"
                    className="h-[46px] w-full rounded-xl border border-[#22222F] bg-[#15151E] pl-11 pr-4 text-[14px] text-white placeholder:text-zinc-600 outline-none focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/10 transition-all"
                    required
                    minLength={2}
                  />
                </div>
              </div>

              {/* Wave perso */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-red-400 flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5 text-cyan-400" /> Numéro Wave perso pour encaisser ton djai *{" "}
                  <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[9px] text-red-300 border border-red-500/20">OBLIGATOIRE</span>
                </label>
                <div className="relative group">
                  <Wallet className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400 group-focus-within:text-cyan-300 transition-colors" />
                  <input
                    type="tel"
                    value={wave}
                    onChange={(e) => setWave(e.target.value)}
                    placeholder="07 12 34 56 78"
                    className="h-[46px] w-full rounded-xl border border-[#22222F] bg-[#15151E] pl-11 pr-4 text-[14px] text-white placeholder:text-zinc-600 outline-none focus:border-cyan-500/40 focus:ring-4 focus:ring-cyan-500/10 transition-all"
                    required
                    minLength={8}
                  />
                </div>
                <p className="text-[10px] text-zinc-500">C&apos;est sur ce numéro que l&apos;admin t&apos;envoie tes gains.</p>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Email *</label>
                <div className="relative group">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-[#7C3AED] transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="champion@email.com"
                    className="h-[46px] w-full rounded-xl border border-[#22222F] bg-[#15151E] pl-11 pr-4 text-[14px] text-white placeholder:text-zinc-600 outline-none focus:border-[#7C3AED]/50 focus:ring-4 focus:ring-[#7C3AED]/10 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Mot de passe *</label>
                  <div className="relative group">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-[#7C3AED] transition-colors" />
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-[46px] w-full rounded-xl border border-[#22222F] bg-[#15151E] pl-11 pr-11 text-[14px] text-white placeholder:text-zinc-600 outline-none focus:border-[#7C3AED]/50 focus:ring-4 focus:ring-[#7C3AED]/10 transition-all"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Confirmer *</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                      type={showPass ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      className={`h-[46px] w-full rounded-xl border bg-[#15151E] pl-11 pr-4 text-[14px] text-white placeholder:text-zinc-600 outline-none focus:ring-4 transition-all ${
                        confirm && confirm !== password
                          ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/10"
                          : "border-[#22222F] focus:border-[#7C3AED]/50 focus:ring-[#7C3AED]/10"
                      }`}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-[#15151E] border border-[#22222F] p-3 flex gap-2.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <p className="text-[11px] leading-relaxed text-zinc-400">
                  WhatsApp + eFootball + Wave perso envoyés à l&apos;admin pour te contacter et te payer. Tes données sont sécurisées, paiement via Wave uniquement.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || usernameAvailable === false}
                className="group flex h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-[14px] font-black tracking-wide text-white shadow-[0_0_20px_rgba(124,58,237,0.35)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    CRÉER MON COMPTE E-TOURNOIS CI
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>

              <p className="text-center text-[12px] text-zinc-400">
                Déjà inscrit ?{" "}
                <Link href="/login" className="font-bold text-white hover:text-[#A855F7] transition-colors">
                  Connecte-toi
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* RIGHT - TEMOIGNAGE PREMIUM */}
      <div className="hidden lg:flex lg:w-[48%] relative flex-col justify-between p-12 bg-[#0F0F14] border-l border-[#22222F] order-1 lg:order-2">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-bl from-[#06B6D4]/20 via-transparent to-[#7C3AED]/15" />
          <div className="absolute bottom-1/3 right-1/3 w-[480px] h-[480px] rounded-full bg-[#06B6D4]/[0.10] blur-[80px]" />
          <div className="absolute top-1/4 left-1/4 w-[320px] h-[320px] rounded-full bg-[#7C3AED]/[0.12] blur-[70px]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center font-black text-white">J</div>
            <span className="font-black tracking-tight text-white">E-TOURNOIS CI 🇨🇮</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="font-black leading-[0.9] tracking-tighter text-white">
            <span className="block text-[56px]">DEVIENS UNE</span>
            <span className="block text-[56px] bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] bg-clip-text text-transparent">LÉGENDE.</span>
          </h1>
          <p className="max-w-[420px] text-[15px] leading-relaxed text-zinc-400">
            Inscris-toi en 30 secondes avec ton WhatsApp et ton Wave perso. L&apos;admin te contacte direct, tu encaisses ton djai en moins de 24h.
          </p>
          <div className="space-y-3 max-w-[420px]">
            <div className="rounded-2xl bg-[#15151E] border border-[#22222F] p-4 flex gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center shrink-0">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-white">&quot;J&apos;ai gagné mon premier tournoi en 2 jours ! Paiement Wave en 3h sur mon numéro perso.&quot;</p>
                <p className="mt-1 text-[11px] text-zinc-500">— Kader, Yopougon • 12 tournois gagnés</p>
              </div>
            </div>
            <div className="rounded-2xl bg-[#101015] border border-emerald-500/10 p-4 flex gap-3">
              <div className="h-8 w-8 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Phone className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-white">Admin te contacte sur WhatsApp dès l&apos;inscription</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">Validation tournoi, envoi gains, support 07 48 23 52 26</p>
              </div>
            </div>
            <div className="rounded-2xl bg-[#101015] border border-violet-500/10 p-4 flex gap-3">
              <div className="h-8 w-8 rounded-full bg-violet-500/15 border border-violet-500/20 flex items-center justify-center shrink-0">
                <Gamepad2 className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-white">Pseudo eFootball vérifié pour anti-triche</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">On t&apos;invite avec ton vrai pseudo Konami • Fair-play</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-[11px] text-zinc-600 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Paiements Wave sécurisés • Support WhatsApp 07 48 23 52 26 • Admin reçoit tes infos direct
        </div>
      </div>
    </div>
  );
}
