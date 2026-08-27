
"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Save, LogOut, User, FileText, Upload, Camera } from "lucide-react";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const { user, profile } = useAuth() as any;
  const supabase = createClient();
  const router = useRouter();
  const [form, setForm] = useState({ display_name: "", username: "", bio: "", city: "", efootball_pseudo: "" });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({ display_name: profile.display_name||"", username: profile.username||"", bio: profile.bio||"", city: profile.city||"Abidjan", efootball_pseudo: profile.efootball_pseudo||"" });
      if (profile.avatar_url) setAvatarPreview(profile.avatar_url);
    }
  }, [profile]);

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2*1024*1024) { toast.error("Photo trop lourde >2Mo"); return; }
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return null;
    setUploading(true);
    try {
      const fileName = `${user.id}/${Date.now()}_${avatarFile.name}`;
      const { error } = await supabase.storage.from("avatars").upload(fileName, avatarFile, { cacheControl: "3600", upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
      return data.publicUrl;
    } catch (e:any) {
      toast.error("Erreur upload photo: "+e.message);
      return null;
    } finally { setUploading(false); }
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (form.bio && form.bio.length > 300) { toast.error("Bio max 300 caractères"); setSaving(false); return; }
      let avatarUrl = profile?.avatar_url || null;
      if (avatarFile) {
        const uploaded = await uploadAvatar();
        if (uploaded) avatarUrl = uploaded;
      }
      const { error } = await supabase.from("profiles").update({ 
        display_name: form.display_name, 
        username: form.username, 
        bio: form.bio, 
        city: form.city, 
        efootball_pseudo: form.efootball_pseudo,
        avatar_url: avatarUrl
      }).eq("id", user.id);
      if (error) throw error;
      toast.success("Profil + photo mis à jour ✅ Visible par tous y compris admin - plus de JD, ta vraie photo s'affiche");
      router.refresh();
    } catch (e:any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    toast.success("Déconnecté");
    router.push("/login");
  };

  if (!user) return <div className="min-h-[60vh] flex items-center justify-center text-zinc-500">Connecte-toi</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-black flex items-center gap-2"><User className="h-6 w-6 text-violet-500" /> Modifier profil - Photo + Bio visibles par tous</h1>
      
      <div className="rounded-[20px] border border-zinc-800 bg-[#101015] p-6 space-y-6">
        {/* Photo de profil */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-violet-600 bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-2xl font-black">
              {avatarPreview ? <img src={avatarPreview} alt="avatar" className="h-full w-full object-cover" /> : (form.display_name?.[0] || form.username?.[0] || "J")}
            </div>
            <label className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-white text-black flex items-center justify-center cursor-pointer shadow-lg">
              <Camera className="h-4 w-4" />
              <input type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
            </label>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold uppercase text-zinc-500">Photo de profil - Visible par tous y compris admin</p>
            <p className="text-[11px] text-zinc-500 mt-1">Remplace JD - ta vraie photo s'affiche partout (Navbar, profil, 1V1, chat)</p>
            {avatarFile && <p className="text-xs text-violet-400 mt-2">Nouvelle photo sélectionnée: {avatarFile.name} - clique Sauvegarder</p>}
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-6 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-zinc-500">Pseudo (username)</label>
            <input value={form.username} onChange={e=>setForm({...form, username: e.target.value})} className="mt-2 w-full rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2.5 text-sm" placeholder="Ex: RavenCI" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-zinc-500">Nom affiché</label>
            <input value={form.display_name} onChange={e=>setForm({...form, display_name: e.target.value})} className="mt-2 w-full rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2.5 text-sm" placeholder="Raven Côte d'Ivoire" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-zinc-500 flex items-center gap-2"><FileText className="h-4 w-4" /> Bio / Description (visible par tous y compris admin)</label>
            <textarea value={form.bio} onChange={e=>setForm({...form, bio: e.target.value})} rows={4} maxLength={300} className="mt-2 w-full rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2.5 text-sm resize-none" placeholder="Ex: Champion eFootball Abidjan..." />
            <p className="text-[10px] text-zinc-500 mt-1">{form.bio.length}/300 - Visible sur /profile/{form.username} et admin</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-zinc-500">Ville</label>
              <input value={form.city} onChange={e=>setForm({...form, city: e.target.value})} className="mt-2 w-full rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-zinc-500">Pseudo eFootball</label>
              <input value={form.efootball_pseudo} onChange={e=>setForm({...form, efootball_pseudo: e.target.value})} className="mt-2 w-full rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2.5 text-sm" />
            </div>
          </div>
          <button onClick={save} disabled={saving || uploading} className="w-full rounded-xl bg-white text-black py-3 text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50">
            {uploading ? "Upload photo..." : saving ? "Sauvegarde..." : <><Upload className="h-4 w-4" /> Sauvegarder photo + bio - visible par tous</>}
          </button>
          <p className="text-[11px] text-zinc-500 text-center">Garde chat et tout ce qui a été rajouté récemment - rien n'est supprimé</p>
        </div>
      </div>

      <div className="rounded-[20px] border border-red-500/20 bg-red-500/5 p-6">
        <h3 className="font-bold text-red-400 flex items-center gap-2"><LogOut className="h-5 w-5" /> Déconnexion</h3>
        <button onClick={logout} className="mt-4 rounded-xl bg-red-600 text-white px-6 py-2.5 text-sm font-bold">Se déconnecter</button>
      </div>
    </div>
  );
}
