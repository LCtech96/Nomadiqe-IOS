-- ============================================
-- NOMADIQE - Support tickets (Richiedi assistenza)
-- Esegui in Supabase → SQL Editor
-- ============================================

-- 1) Tabella richieste assistenza
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device TEXT,
  request_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'replied', 'closed')),
  user_last_read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON public.support_tickets(created_at DESC);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
CREATE POLICY "Users can view own tickets"
  ON public.support_tickets FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tickets" ON public.support_tickets;
CREATE POLICY "Users can insert own tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tickets (read)" ON public.support_tickets;
CREATE POLICY "Users can update own tickets (read)"
  ON public.support_tickets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin: service role o policy per email in lista admin (via function)
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
CREATE POLICY "Admins can view all tickets"
  ON public.support_tickets FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.email IN (SELECT unnest(ARRAY['lucacorrao1996@gmail.com'])))
  );

DROP POLICY IF EXISTS "Admins can update tickets" ON public.support_tickets;
CREATE POLICY "Admins can update tickets"
  ON public.support_tickets FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.email IN (SELECT unnest(ARRAY['lucacorrao1996@gmail.com']))))
  WITH CHECK (true);

-- 2) Allegati ticket (screenshot iniziali, max 5)
CREATE TABLE IF NOT EXISTS public.support_ticket_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  support_ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_attachments_ticket ON public.support_ticket_attachments(support_ticket_id);

ALTER TABLE public.support_ticket_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own ticket attachments" ON public.support_ticket_attachments;
CREATE POLICY "Users can view own ticket attachments"
  ON public.support_ticket_attachments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = support_ticket_id AND t.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.email IN (SELECT unnest(ARRAY['lucacorrao1996@gmail.com'])))
  );

DROP POLICY IF EXISTS "Users can insert attachments for own ticket" ON public.support_ticket_attachments;
CREATE POLICY "Users can insert attachments for own ticket"
  ON public.support_ticket_attachments FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = support_ticket_id AND t.user_id = auth.uid())
  );

-- 3) Messaggi nella conversazione
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  support_ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON public.support_ticket_messages(support_ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created ON public.support_ticket_messages(created_at);

ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages of own ticket" ON public.support_ticket_messages;
CREATE POLICY "Users can view messages of own ticket"
  ON public.support_ticket_messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = support_ticket_id AND t.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.email IN (SELECT unnest(ARRAY['lucacorrao1996@gmail.com'])))
  );

DROP POLICY IF EXISTS "Users can insert message in own ticket" ON public.support_ticket_messages;
CREATE POLICY "Users can insert message in own ticket"
  ON public.support_ticket_messages FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = support_ticket_id AND t.user_id = auth.uid())
    AND sender_type = 'user'
    AND sender_id = auth.uid()
  );

DROP POLICY IF EXISTS "Admins can insert reply" ON public.support_ticket_messages;
CREATE POLICY "Admins can insert reply"
  ON public.support_ticket_messages FOR INSERT
  WITH CHECK (
    sender_type = 'admin'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.email IN (SELECT unnest(ARRAY['lucacorrao1996@gmail.com'])))
    AND sender_id = auth.uid()
  );

-- 4) Bucket storage per screenshot supporto
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'support',
  'support',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Users can upload support images" ON storage.objects;
CREATE POLICY "Users can upload support images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'support'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Support images are public" ON storage.objects;
CREATE POLICY "Support images are public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'support');

COMMENT ON TABLE public.support_tickets IS 'Richieste assistenza utenti';
COMMENT ON TABLE public.support_ticket_messages IS 'Messaggi conversazione assistenza';
COMMENT ON TABLE public.support_ticket_attachments IS 'Screenshot allegati alla richiesta (max 5)';
