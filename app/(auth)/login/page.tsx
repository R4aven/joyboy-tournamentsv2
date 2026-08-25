"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Trophy, Swords, Zap } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Remplis tous les champs champion !");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      if (data.user) {
        toast.success(`Wassup ${data.user.email?.split("@")[0]} ! De retour dans l'arène 🔥`);
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.message?.toLowerCase() ?? "";
      if (msg.includes("invalid login credentials")) {
        toast.error("Email ou mot de passe incorrect. Vérifie bien mon gars.");
      } else if (msg.includes("email not confirmed")) {
        toast.error("Confirme ton email d'abord. Check tes spams !");
      } else {
        toast.error(err.message ?? "Impossible de se connecter");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Mets ton email pour recevoir le lien");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      toast.success("Lien envoyé ! Vérifie ta boîte mail (et les spams) 📩");
      setForgotMode(false);
    } catch (err: any) {
      toast.error(err.message ?? "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-68px)] overflow-hidden">
      {/* left branding */}
      <div className="hidden lg:flex lg:w-[48%] relative flex-col justify-between p-12 bg-[#0F0F14] border-r border-[#22222F]">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/20 via-transparent to-[#06B6D4]/15" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#7C3AED]/[0.12] blur-[80px]" />
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#1A1A23] border border-[#22222F] px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold tracking-widest text-zinc-300">347 JOUEURS EN LIGNE</span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="font-black leading-[0.9] tracking-tighter">
              <span className="block text-[64px] text-white">REJOINS</span>
              <span className="block text-[64px] bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] bg-clip-text text-transparent">L&apos;ARÈNE.</span>
            </h1>
            <p className="mt-5 max-w-[420px] text-[15px] leading-relaxed text-zinc-400">
              Abidjan joue ici. Défie les meilleurs, grimpe le classement et encaisse tes gains via Wave en moins de 24h.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-[420px]">
            {[
              { icon: Trophy, label: "Tournois", sub: "Chaque semaine" },
              { icon: Swords, label: "1V1", sub: "Défis directs" },
              { icon: Zap, label: "Gains Wave", sub: "01 51 42 99 18" },
            ].map((it) => (
              <div key={it.label} className="rounded-2xl bg-[#15151E] border border-[#22222F] p-4">
                <it.icon className="h-5 w-5 text-[#7C3AED] mb-2" />
                <p className="text-[13px] font-bold text-white">{it.label}</p>
                <p className="text-[11px] text-zinc-500">{it.sub}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 text-[12px] text-zinc-500">
            <span>🇨🇮</span>
            <span>Fait à Abidjan • Paiement Wave CI • WhatsApp 07 48 23 52 26</span>
          </div>
        </div>

        <div className="relative z-10 flex gap-2">
          <div className="h-1 w-12 rounded-full bg-[#7C3AED]" />
          <div className="h-1 w-6 rounded-full bg-[#22222F]" />
          <div className="h-1 w-6 rounded-full bg-[#22222F]" />
        </div>
      </div>

      {/* right form */}
      <div className="flex flex-1 items-center justify-center bg-[#08080B] px-5 py-10 lg:px-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center font-black text-white">J</div>
              <span className="font-black tracking-tight">JOYBOY TOURNAMENTS 🇨🇮</span>
            </div>
            <h1 className="text-[30px] font-black tracking-tighter leading-none">Bon retour champion !</h1>
            <p className="mt-2 text-[14px] text-zinc-400">On t’attendait dans l’arène.</p>
          </div>

          <div className="rounded-[24px] border border-[#22222F] bg-[#101015]/80 backdrop-blur-xl p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_20px_60px_rgba(0,0,0,0.6)]">
            <div className="hidden lg:block mb-6">
              <h2 className="text-[24px] font-black tracking-tight text-white">Connexion</h2>
              <p className="mt-1 text-[13px] text-zinc-400">Entre tes identifiants, on retourne jouer.</p>
            </div>

            {!forgotMode ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Email</label>
                  <div className="relative group">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-[#7C3AED] transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tonemail@exemple.com"
                      className="h-[46px] w-full rounded-xl border border-[#22222F] bg-[#15151E] pl-11 pr-4 text-[14px] text-white placeholder:text-zinc-600 outline-none focus:border-[#7C3AED]/50 focus:ring-4 focus:ring-[#7C3AED]/10 transition-all"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Mot de passe</label>
                    <button
                      type="button"
                      onClick={() => setForgotMode(true)}
                      className="text-[11px] font-semibold text-[#7C3AED] hover:text-[#A855F7] transition-colors"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <div className="relative group">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-[#7C3AED] transition-colors" />
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-[46px] w-full rounded-xl border border-[#22222F] bg-[#15151E] pl-11 pr-11 text-[14px] text-white placeholder:text-zinc-600 outline-none focus:border-[#7C3AED]/50 focus:ring-4 focus:ring-[#7C3AED]/10 transition-all"
                      autoComplete="current-password"
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

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-[14px] font-bold text-white shadow-[0_0_20px_rgba(124,58,237,0.35)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      Se connecter
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>

                <div className="flex items-center gap-3 py-2">
                  <div className="h-px flex-1 bg-[#22222F]" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-600">Ou</span>
                  <div className="h-px flex-1 bg-[#22222F]" />
                </div>

                <p className="text-center text-[13px] text-zinc-400">
                  Nouveau ici ?{" "}
                  <Link href="/register" className="font-bold text-white hover:text-[#A855F7] transition-colors">
                    Crée ton compte
                  </Link>
                </p>
              </form>
            ) : (
              <form onSubmit={handleForgot} className="space-y-4">
                <div>
                  <h3 className="text-[18px] font-black text-white">Récupération</h3>
                  <p className="mt-1 text-[13px] text-zinc-400">On t’envoie un lien de réinitialisation.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tonemail@exemple.com"
                      className="h-[46px] w-full rounded-xl border border-[#22222F] bg-[#15151E] pl-11 pr-4 text-[14px] text-white placeholder:text-zinc-600 outline-none focus:border-[#7C3AED]/50 focus:ring-4 focus:ring-[#7C3AED]/10 transition-all"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-[46px] w-full items-center justify-center rounded-xl bg-[#7C3AED] text-[14px] font-bold text-white hover:bg-[#6D28D9] disabled:opacity-50 transition-colors"
                >
                  {loading ? "Envoi..." : "Envoyer le lien"}
                </button>
                <button
                  type="button"
                  onClick={() => setForgotMode(false)}
                  className="w-full text-center text-[13px] font-semibold text-zinc-400 hover:text-white transition-colors"
                >
                  ← Retour à la connexion
                </button>
              </form>
            )}

            <p className="mt-6 rounded-xl bg-[#15151E] border border-[#22222F]/80 p-3 text-[11px] leading-relaxed text-zinc-500">
              Besoin d’aide ? Contacte-nous sur WhatsApp au <span className="font-bold text-white">07 48 23 52 26</span> ou Wave au{" "}
              <span className="font-bold text-white">01 51 42 99 18</span>. Réponse rapide, on est à Abidjan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
