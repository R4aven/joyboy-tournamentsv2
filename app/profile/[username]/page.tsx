
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
  const [form, setForm] = useState({ username: "", display_name: "", bio: "", avatar_url: "" });

  const isOwn = user && profile && user.id === profile.id;

  useEffect(() => {
    const load = async () => {
      try {
        if (!usernameParam) { setLoading(false); return; }
        const { data } = await client.from("profiles").select("*").ilike("username", usernameParam).maybeSingle();
        let d = data;
        if (!d) {
          const { data: d2 } = await client.from("profiles").select("*").eq("id", usernameParam).maybeSingle();
          d = d2;
        }
        if (d) {
          setProfile(d);
          setForm({ username: d.username || "", display_name: d.display_name || "", bio: d.bio || "", avatar_url: d.avatar_url || "" });
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [usernameParam]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${ext}`;
      const { error } = await client.storage.from("avatars").upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data } = client.storage.from("avatars").getPublicUrl(fileName);
      const publicUrl = data.publicUrl;
      setForm((f) => ({ ...f, avatar_url: publicUrl }));
      await client.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
      setProfile((p: any) => ({ ...p, avatar_url: publicUrl }));
      toast.success("Photo mise à jour !");
      setTimeout(()=>window.location.reload(), 600);
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!user || !isOwn) return;
    setSaving(true);
    try {
      // FIX DEFINITIF: utilise UNIQUEMENT colonnes qui existent dans schema.sql : username, display_name, bio, avatar_url
      // AUCUNE colonne pseudo - c'est ça qui causait l'erreur "Could not find the 'pseudo' column"
      const cleanUsername = form.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
      if (cleanUsername.length < 3) { toast.error("Username min 3 caractères"); setSaving(false); return; }
      const updates = {
        username: cleanUsername,
        display_name: form.display_name || cleanUsername,
        bio: form.bio?.slice(0,200) || "",
        avatar_url: form.avatar_url || null,
      };
      const { error } = await client.from("profiles").update(updates).eq("id", user.id);
      if (error) throw error;
      setProfile((p: any) => ({ ...p, ...updates }));
      toast.success("Profil enregistré !");
      setEditing(false);
      // Force reload pour voir modifs partout y compris admin
      setTimeout(()=>{ window.location.href = `/profile/${cleanUsername}`; }, 800);
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes("pseudo")) toast.error("Erreur pseudo encore présente dans un autre fichier - utilise ce fix complet");
      else toast.error(e.message);
    } finally { setSaving(false); }
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-zinc-500">Chargement...</div>;
  if (!profile) return <div className="min-h-[60vh] flex flex-col items-center justify-center"><p className="text-zinc-400">Profil {usernameParam} introuvable</p><Link href="/dashboard" className="mt-4 rounded-xl bg-white text-black px-6 py-2 font-bold">Dashboard</Link></div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/dashboard" className="text-sm text-zinc-500">← Dashboard</Link>
      <div className="mt-6 rounded-[20px] border border-zinc-800 bg-[#101015] p-6">
        <div className="flex gap-6">
          <div className="relative group">
            <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-violet-600 bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-2xl font-black text-white">
              {form.avatar_url ? <img src={form.avatar_url} alt="" className="h-full w-full object-cover" /> : (form.display_name||form.username||"J")[0].toUpperCase()}
            </div>
            {isOwn && <label className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"><Camera className="h-6 w-6 text-white" /><input type="file" accept="image/*" className="hidden" onChange={handleUpload} /></label>}
          </div>
          <div className="flex-1">
            {editing ? (
              <div className="space-y-3">
                <input value={form.username} onChange={e=>setForm({...form, username:e.target.value})} placeholder="username unique" className="w-full rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2 text-sm" />
                <input value={form.display_name} onChange={e=>setForm({...form, display_name:e.target.value})} placeholder="Nom affiché" className="w-full rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2 text-sm" />
                <textarea value={form.bio} onChange={e=>setForm({...form, bio:e.target.value})} placeholder="Bio (visible par tous)" rows={3} className="w-full rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2 text-sm" maxLength={200} />
                <div className="flex gap-2"><button onClick={handleSave} disabled={saving} className="rounded-xl bg-violet-600 px-5 py-2 text-sm font-bold text-white">{saving?"...":"Enregistrer"}</button><button onClick={()=>setEditing(false)} className="rounded-xl bg-[#15151E] border border-zinc-800 px-5 py-2 text-sm">Annuler</button></div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-black">{form.display_name || form.username}</h1>
                <p className="text-sm text-zinc-500">@{profile.username} • {profile.wins||0}V - {profile.losses||0}D</p>
                {profile.bio && <p className="mt-3 text-sm bg-[#15151E] border border-zinc-800 p-3 rounded-xl">{profile.bio}</p>}
                {isOwn && <button onClick={()=>setEditing(true)} className="mt-4 rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2 text-xs font-bold">Modifier profil (fix pseudo définitif)</button>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
