"use client";
import { useEffect, useState, useRef } from "react";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function MatchChat({ matchId, currentUserId }: { matchId: string, currentUserId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase.from('match_messages').select('*').eq('match_id', matchId).order('created_at', { ascending: true }).limit(100);
      if (data) setMessages(data);
    };
    fetchMessages();

    const channel = supabase.channel(`match:${matchId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'match_messages', filter: `match_id=eq.${matchId}` }, (payload: any) => {
      setMessages(prev => [...prev, payload.new]);
    }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [matchId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    if (input.length > 1000) { toast.error("Max 1000 caractères"); return; }
    setLoading(true);
    try {
      // Spam check
      const { data: recent } = await supabase.from('match_messages').select('id').eq('match_id', matchId).eq('sender_id', currentUserId).gte('created_at', new Date(Date.now() - 60000).toISOString());
      if (recent && recent.length >= 10) { toast.error("Trop de messages, attends 1 minute"); setLoading(false); return; }

      const { error } = await supabase.from('match_messages').insert({ match_id: matchId, sender_id: currentUserId, content: input.trim() });
      if (error) throw error;
      setInput("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[20px] border border-[#22222F] bg-[#101015] flex flex-col h-[400px]">
      <div className="p-4 border-b border-[#22222F]"><h3 className="font-black text-[13px]">💬 Chat privé adversaires - Visible uniquement par vous 2 + admin</h3><p className="text-[10px] text-zinc-500">Conversation privée entre les participants et l'administration.</p></div>
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender_id === currentUserId ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${m.sender_id === currentUserId ? "bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-white" : "bg-[#15151E] border border-[#22222F] text-zinc-200"}`}>
              <p className="text-[13px] whitespace-pre-wrap">{m.content}</p>
              <p className="text-[9px] opacity-60 mt-1">{new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="p-3 border-t border-[#22222F] flex gap-2">
        <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); } }} placeholder="Yo, je crée le salon..." className="flex-1 rounded-xl border border-[#22222F] bg-[#15151E] p-3 text-[13px] resize-none h-[44px]" rows={1} />
        <button onClick={sendMessage} disabled={loading || !input.trim()} className="h-11 w-11 rounded-xl bg-white text-black flex items-center justify-center disabled:opacity-50"><Send className="h-4 w-4" /></button>
      </div>
    </div>
  );
}