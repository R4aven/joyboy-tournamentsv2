
-- Table messages directs entre joueurs (chat)
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) >=1 AND char_length(content) <= 1000),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_direct_messages_convo ON public.direct_messages(sender_id, receiver_id, created_at DESC);
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dm_select_own" ON public.direct_messages;
CREATE POLICY "dm_select_own" ON public.direct_messages FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());
DROP POLICY IF EXISTS "dm_insert_own" ON public.direct_messages;
CREATE POLICY "dm_insert_own" ON public.direct_messages FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Fix notifications type -> TEXT pour éviter enum error
ALTER TABLE public.notifications ALTER COLUMN type TYPE TEXT;

-- Fix tournaments constraints already done but re-ensure
ALTER TABLE public.tournaments DROP CONSTRAINT IF EXISTS tournaments_title_check;
ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_title_check CHECK (char_length(trim(title)) >= 3);
