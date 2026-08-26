"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, Save, User, Image as ImageIcon, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EditProfilePage() {
  const supabase = createClient();
  const { user, profile } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setBio((profile as any).bio || "");
      setAvatarUrl((profile as any).avatar_url || null);
    }
  }, [profile]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return toast.error("Image trop lourde >5Mo");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!file || !user) return avatarUrl;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      // bucket avatars doit exister, sinon on utilise profiles bucket ou storage public
      const { error: upError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upError) {
        // fallback bucket "avatars" n'existe pas, essaie "public"
        const { error: up2 } = await supabase.storage.from("public").upload(path, file, { upsert: true });
        if (up2) throw up2;
        const { data } = supabase.storage.from("public").getPublicUrl(path);
        return data.publicUrl;
      }
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      return data.publicUrl;
    } catch (e: any) {
      toast.error("Upload échoué: " + e.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (username.length < 3) return toast.error("Pseudo min 3 caractères");
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) return toast.error("Pseudo: lettres, chiffres, _ . - seulement");
    setSaving(true);
    try {
      let finalAvatar = avatarUrl;
      if (file) {
        const url = await uploadAvatar();
        if (url) finalAvatar = url;
      }

      // check username unique sauf pour soi
      const { data: existing } = await supabase.from("profiles").select("id").ilike("username", username).neq("id", user.id).maybeSingle();
      if (existing) throw new Error("Ce pseudo est déjà pris");

      const { error } = await supabase.from("profiles").update({
        username: username.trim(),
        bio: bio.trim(),
        avatar_url: finalAvatar,
        updated_at: new Date().toISOString(),
      }).eq("id", user.id);

      if (error) throw error;

      toast.success("Profil mis à jour ! Visible par tous ✅");
      router.push(`/profile/${username}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-[13px] text-zinc-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Retour dashboard</Link>
      <h1 className="mt-6 text-[28px] font-black tracking-tight text-white flex items-center gap-3"><User className="h-6 w-6 text-[#7C3AED]" /> Modifier mon profil</h1>
      <p className="mt-2 text-[13px] text-zinc-400">Photo, pseudo et bio visibles par tous les joueurs et l'admin.</p>

      <div className="mt-8 rounded-[20px] border border-[#22222F] bg-[#101015] p-6 space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-6">
          <div className="h-[84px] w-[84px] rounded-[20px] bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] p-[2px]">
            <div className="h-full w-full rounded-[18px] bg-[#0A0A0F] flex items-center justify-center overflow-hidden">
              {(preview || avatarUrl) ? <img src={preview || avatarUrl!} className="h-full w-full object-cover" alt="avatar" /> : <span className="text-2xl font-black">{username[0]?.toUpperCase() || "J"}</span>}
            </div>
          </div>
          <div>
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#15151E] border border-[#22222F] px-4 text-[12px] font-bold text-white hover:border-[#7C3AED]/40">
              <Upload className="h-4 w-4" /> Choisir photo
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
            <p className="mt-2 text-[11px] text-zinc-500">PNG/JPG max 5Mo. Carré conseillé.</p>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2"><User className="h-3 w-3" /> Nom d'utilisateur</label>
          <input value={username} onChange={(e)=>setUsername(e.target.value)} className="mt-2 w-full rounded-xl bg-[#0E0E14] border border-[#22222F] px-4 py-3 text-[14px] text-white placeholder:text-zinc-600 focus:border-[#7C3AED]/50 outline-none" placeholder="Ex: JoyBoyCI" />
          <p className="mt-1 text-[11px] text-zinc-500">Ton lien public: /profile/{username || "tonpseudo"}</p>
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2"><FileText className="h-3 w-3" /> Bio</label>
          <textarea value={bio} onChange={(e)=>setBio(e.target.value)} rows={4} maxLength={160} className="mt-2 w-full rounded-xl bg-[#0E0E14] border border-[#22222F] px-4 py-3 text-[14px] text-white placeholder:text-zinc-600 focus:border-[#7C3AED]/50 outline-none resize-none" placeholder="Ex: Joueur FIFA d'Abidjan, dispo le soir, 1v1 1000F minimum 🔥" />
          <p className="mt-1 text-[11px] text-zinc-500 text-right">{bio.length}/160</p>
        </div>

        <button onClick={handleSave} disabled={saving || uploading} className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white text-black text-[14px] font-black hover:bg-zinc-100 disabled:opacity-50">
          {saving ? "Enregistrement..." : <><Save className="h-4 w-4" /> Enregistrer</>}
        </button>
      </div>

      <div className="mt-4 rounded-xl bg-[#7C3AED]/10 border border-[#7C3AED]/20 p-4 text-[11px] text-[#A855F7]">Ces infos sont publiques et visibles dans /profile/{username} et dans l'admin /admin/players. Ne mets pas ton numéro Wave ici, il est privé.</div>
    </div>
  );
}
