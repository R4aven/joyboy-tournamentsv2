
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Camera, Save, LogOut, Trophy, Swords } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const params = useParams();
  const usernameParam = (params?.username as string) ?? "";
  const { user, supabase } = useAuth() as any;
  const client = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ display_name: "", bio: "", pseudo: "", avatar_url: "" });

  const isOwn = user && profile && user.id === profile.id;

  useEffect(() => {
    const load = async () => {
      try {
        if (!usernameParam) { setLoading(false); return; }
        const tries = [
          () => client.from("profiles").select("*").ilike("username", usernameParam).maybeSingle(),
          () => client.from("profiles").select("*").ilike("pseudo", usernameParam).maybeSingle(),
          () => client.from("profiles").select("*").eq("id", usernameParam).maybeSingle(),
        ];
        let data = null;
        for (const fn of tries) {
          try { const { data: d } = await fn(); if (d) { data = d; break; } } catch {}
        }
        if (data) {
          setProfile(data);
          setForm({ display_name: data.display_name || "", bio: data.bio || "", pseudo: data.pseudo || data.username || "", avatar_url: data.avatar_url || "" });
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [usernameParam]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 3*1024*1024) { toast.error("Image trop lourde (max 3MB)"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${ext}`;
      // essaye bucket avatars, sinon profiles, sinon upload direct en base64 fallback
      let publicUrl = "";
      try {
        const { error: upErr } = await client.storage.from("avatars").upload(fileName, file, { upsert: true });
        if (upErr) throw upErr;
        const { data } = client.storage.from("avatars").getPublicUrl(fileName);
        publicUrl = data.publicUrl;
      } catch (err: any) {
        // fallback bucket profiles
        try {
          const { error } = await client.storage.from("profiles").upload(fileName, file, { upsert: true });
          if (!error) {
            const { data } = client.storage.from("profiles").getPublicUrl(fileName);
            publicUrl = data.publicUrl;
          } else throw err;
        } catch {
          // dernier fallback: base64 local (visible immediatement, meme si pas stocke)
          const reader = new FileReader();
          publicUrl = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          }) as string;
          toast("Stockage Supabase non configuré, image en local seulement - crée un bucket 'avatars' public");
        }
      }
      setForm((f) => ({ ...f, avatar_url: publicUrl }));
      // auto save avatar
      if (isOwn) {
        await client.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
        setProfile((p: any) => ({ ...p, avatar_url: publicUrl }));
        toast.success("Photo mise à jour ! Visible en haut à droite");
        window.location.reload();
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!user || !isOwn) return;
    setSaving(true);
    try {
      const updates: any = {
        display_name: form.display_name || form.pseudo,
        bio: form.bio,
        pseudo: form.pseudo,
        username: form.pseudo, // garde synchro pour que /profile/[username] marche
        avatar_url: form.avatar_url,
      };
      const { error } = await client.from("profiles").update(updates).eq("id", user.id);
      if (error) throw error;
      setProfile((p: any) => ({ ...p, ...updates }));
      toast.success("Profil mis à jour, visible par tous y compris admin !");
      setEditing(false);
      // force navbar refresh
      window.location.reload();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setSaving(false); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-zinc-500">Chargement...</div>;
  if (!profile) return <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4"><p className="text-zinc-400">Profil {usernameParam} introuvable</p><Link href="/dashboard" className="rounded-xl bg-white text-black px-6 py-2 font-bold">Dashboard</Link></div>;

  const displayName = profile.pseudo || profile.display_name || profile.username || "Joueur";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-white">← Retour dashboard</Link>
      
      <div className="mt-6 rounded-[20px] border border-zinc-800 bg-[#101015] p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative group shrink-0">
            <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-violet-600 bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-2xl font-black text-white">
              {form.avatar_url ? <img src={form.avatar_url} alt="avatar" className="h-full w-full object-cover" /> : displayName[0]?.toUpperCase()}
            </div>
            {isOwn && (
              <label className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition">
                <Camera className="h-6 w-6 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            )}
          </div>
          <div className="flex-1">
            {editing ? (
              <div className="space-y-3">
                <input value={form.pseudo} onChange={(e)=>setForm({...form, pseudo:e.target.value})} placeholder="Pseudo (visible par tous)" className="w-full rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2.5 text-sm text-white" />
                <input value={form.display_name} onChange={(e)=>setForm({...form, display_name:e.target.value})} placeholder="Nom d'affichage" className="w-full rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2.5 text-sm text-white" />
                <textarea value={form.bio} onChange={(e)=>setForm({...form, bio:e.target.value})} placeholder="Bio / Description - visible par tous y compris admin" rows={3} className="w-full rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2.5 text-sm text-white resize-none" maxLength={200} />
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={saving} className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white flex items-center gap-2"><Save className="h-4 w-4" />{saving?"...":"Enregistrer"}</button>
                  <button onClick={()=>setEditing(false)} className="rounded-xl bg-[#15151E] border border-zinc-800 px-5 py-2.5 text-sm font-bold text-zinc-400">Annuler</button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-black text-white">{displayName}</h1>
                <p className="text-sm text-zinc-500 mt-1">{profile.role || "JOUEUR"} • {profile.wins||0}V - {profile.losses||0}D • Level {profile.level||1}</p>
                {profile.bio && <p className="mt-3 text-sm text-zinc-300 leading-relaxed rounded-xl bg-[#15151E] border border-zinc-800 p-3">{profile.bio}</p>}
                {isOwn && <button onClick={()=>setEditing(true)} className="mt-4 rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2 text-xs font-bold text-white hover:border-violet-600">Modifier photo, bio, description</button>}
              </>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-[#15151E] border border-zinc-800 p-4 text-center"><Trophy className="mx-auto h-5 w-5 text-amber-400" /><p className="mt-2 text-lg font-black text-white">{profile.wins||0}</p><p className="text-[10px] text-zinc-500">VICTOIRES</p></div>
          <div className="rounded-xl bg-[#15151E] border border-zinc-800 p-4 text-center"><Swords className="mx-auto h-5 w-5 text-violet-500" /><p className="mt-2 text-lg font-black text-white">{profile.tournaments_won||0}</p><p className="text-[10px] text-zinc-500">TOURNOIS</p></div>
          <div className="rounded-xl bg-[#15151E] border border-zinc-800 p-4 text-center"><p className="mt-1 text-lg font-black text-white">{profile.total_earnings||0}</p><p className="text-[10px] text-zinc-500">FCFA GAGNÉS</p></div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/dashboard" className="rounded-xl bg-white text-black px-5 py-2.5 text-sm font-bold">Dashboard</Link>
          {isOwn && <button onClick={handleLogout} className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-2.5 text-sm font-bold flex items-center gap-2"><LogOut className="h-4 w-4" /> Déconnexion</button>}
        </div>

        {isOwn && <p className="mt-4 text-[11px] text-zinc-500">Astuce: ta photo uploadée s'affiche en haut à droite dans le petit logo, visible par tous y compris admin. Crée un bucket public 'avatars' dans Supabase Storage pour que l'image soit permanente.</p>}
      </div>
    </div>
  );
}
