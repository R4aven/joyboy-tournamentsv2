
"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { MessageCircle, Send, X } from "lucide-react";

export default function ProfilePage() {
  const params = useParams();
  const search = useSearchParams();
  const usernameParam = (params?.username as string) ?? "";
  const { user } = useAuth() as any;
  const client = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(search.get("chat")==="1");
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const adminConversation = profile?.role === "ADMIN";

  const isOwn = user && profile && user.id === profile.id;

  useEffect(() => {
    const load = async () => {
      const { data } = await client.from("profiles").select("*").ilike("username", usernameParam).maybeSingle();
      let d = data;
      if (!d) { const { data: d2 } = await client.from("profiles").select("*").eq("id", usernameParam).maybeSingle(); d = d2; }
      if (d) setProfile(d);
      setLoading(false);
      if (d && user) {
        const { data: msgs } = await client.from("direct_messages").select("*").or(`and(sender_id.eq.${user.id},receiver_id.eq.${d.id}),and(sender_id.eq.${d.id},receiver_id.eq.${user.id})`).order("created_at",{ascending:true}).limit(50);
        if (msgs) setMessages(msgs);
      }
    };
    if (usernameParam) load();
  }, [usernameParam, user]);

  const sendMessage = async () => {
    if (!user || !profile || !msg.trim()) return;
    setSending(true);
    try {
      const { data: createdMessage, error } = await client.from("direct_messages").insert({ sender_id: user.id, receiver_id: profile.id, content: msg.trim() }).select("id").single();
      if (error) throw error;
      await client.from("notifications").insert({ user_id: profile.id, type: "MESSAGE", title: `Message de @${user.email?.split("@")[0] || "joueur"}`, message: msg.trim().slice(0,100), link: `/profile/${usernameParam}?chat=1`, related_id: createdMessage?.id || null, related_type: "message" });
      setMessages([...messages, { sender_id: user.id, content: msg, created_at: new Date().toISOString() }]);
      setMsg("");
      toast.success("Message envoyé");
    } catch (e:any) { toast.error(e.message); }
    finally { setSending(false); }
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-zinc-500">Chargement...</div>;
  if (!profile) return <div className="min-h-[60vh] flex flex-col items-center justify-center"><p className="text-zinc-400">Profil introuvable</p></div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="rounded-[20px] border border-zinc-800 bg-[#101015] p-6">
        <div className="flex gap-6">
          <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-violet-600 bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-2xl font-black">{profile.avatar_url ? <img src={profile.avatar_url} className="h-full w-full object-cover" /> : (profile.display_name||profile.username)[0]}</div>
          <div className="flex-1">
            <h1 className="text-2xl font-black">{profile.display_name||profile.username}</h1>
            <p className="text-sm text-zinc-500">@{profile.username} • {profile.wins||0}V - {profile.losses||0}D • Tournois {profile.tournaments_won||0}</p>
            {profile.bio && <p className="mt-3 text-sm bg-[#15151E] border border-zinc-800 p-3 rounded-xl">{profile.bio}</p>}
            {!isOwn && <div className="mt-4 flex gap-2"><button onClick={()=>setShowChat(true)} className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white flex items-center gap-2"><MessageCircle className="h-4 w-4" /> Chatter</button><Link href={`/1v1`} className="rounded-xl bg-[#15151E] border border-zinc-800 px-5 py-2.5 text-sm font-bold">Défier en 1V1</Link></div>}
          </div>
        </div>
      </div>

      {showChat && !isOwn && (
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-[#101015] p-5">
          <div className="flex items-center justify-between"><h3 className="font-bold">Chat avec @{profile.username}</h3><button onClick={()=>setShowChat(false)} className="p-1"><X className="h-4 w-4" /></button></div>
          <div className="mt-4 max-h-64 overflow-auto space-y-2">
            {messages.map((m,i)=><div key={i} className={`rounded-xl p-3 text-sm max-w-[80%] ${m.sender_id===user?.id ? "bg-violet-600 ml-auto text-white" : "bg-[#15151E] border border-zinc-800"}`}>{m.content}</div>)}
            {messages.length===0 && <p className="text-xs text-zinc-500">Aucun message - envoie le premier !</p>}
          </div>
          {adminConversation ? <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-200">👑 <b>Message de l'administration</b><br/>Vous ne pouvez pas répondre directement aux administrateurs.<div className="mt-3"><a href="https://wa.me/2250748235226" className="inline-flex rounded-lg bg-white text-black px-3 py-2 font-black">Contacter JOYBOY sur WhatsApp</a></div></div> : <div className="mt-4 flex gap-2"><input value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Écris ton message..." className="flex-1 rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2.5 text-sm" onKeyDown={e=> e.key==="Enter" && sendMessage()} /><button onClick={sendMessage} disabled={sending || !msg.trim()} className="rounded-xl bg-white text-black px-4 py-2.5"><Send className="h-4 w-4" /></button></div>}
        </div>
      )}
    </div>
  );
}
