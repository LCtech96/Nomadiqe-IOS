-- =========================================================
-- Nomadiqe: Host–Creator moderation tables + RLS
-- Da eseguire dopo supabase-schema.sql (dipende da public.profiles).
-- Estensioni: pgcrypto o uuid-ossp.
-- =========================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    BEGIN
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not create extension pgcrypto (insufficient privileges?)';
    END;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
    BEGIN
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not create extension uuid-ossp (insufficient privileges?)';
    END;
  END IF;
END$$;

-- =========================================================
-- host_creator_message_queue
-- =========================================================
CREATE TABLE IF NOT EXISTS public.host_creator_message_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_message TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_host_creator_queue_status ON public.host_creator_message_queue(status);
CREATE INDEX IF NOT EXISTS idx_host_creator_queue_created ON public.host_creator_message_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_host_creator_queue_sender ON public.host_creator_message_queue(sender_id);
CREATE INDEX IF NOT EXISTS idx_host_creator_queue_receiver ON public.host_creator_message_queue(receiver_id);

COMMENT ON TABLE public.host_creator_message_queue IS 'Messaggi host-creator in attesa di moderazione admin';

ALTER TABLE public.host_creator_message_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated insert" ON public.host_creator_message_queue;
CREATE POLICY "Allow authenticated insert" ON public.host_creator_message_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can view own queue entries" ON public.host_creator_message_queue;
CREATE POLICY "Users can view own queue entries" ON public.host_creator_message_queue
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Admins can manage queue entries" ON public.host_creator_message_queue;
CREATE POLICY "Admins can manage queue entries" ON public.host_creator_message_queue
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'is_admin') = 'true'
    OR reviewed_by = auth.uid()
  )
  WITH CHECK (
    (auth.jwt() ->> 'is_admin') = 'true'
    OR reviewed_by = auth.uid()
  );

-- =========================================================
-- host_creator_collaboration_requests
-- =========================================================
CREATE TABLE IF NOT EXISTS public.host_creator_collaboration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(host_id, creator_id)
);

CREATE INDEX IF NOT EXISTS idx_collab_requests_host ON public.host_creator_collaboration_requests(host_id);
CREATE INDEX IF NOT EXISTS idx_collab_requests_creator ON public.host_creator_collaboration_requests(creator_id);

COMMENT ON TABLE public.host_creator_collaboration_requests IS 'Richieste collaborazione host->creator (evita duplicati)';

ALTER TABLE public.host_creator_collaboration_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hosts can create collaboration requests" ON public.host_creator_collaboration_requests;
CREATE POLICY "Hosts can create collaboration requests" ON public.host_creator_collaboration_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Users can view own collaboration requests" ON public.host_creator_collaboration_requests;
CREATE POLICY "Users can view own collaboration requests" ON public.host_creator_collaboration_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = host_id OR auth.uid() = creator_id);

DROP POLICY IF EXISTS "Owners can delete collaboration requests" ON public.host_creator_collaboration_requests;
CREATE POLICY "Owners can delete collaboration requests" ON public.host_creator_collaboration_requests
  FOR DELETE
  TO authenticated
  USING (auth.uid() = host_id OR auth.uid() = creator_id);

-- Allineato al resto dello schema: permessi per authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON public.host_creator_message_queue TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.host_creator_collaboration_requests TO authenticated;
GRANT SELECT ON public.host_creator_message_queue TO anon;
GRANT SELECT ON public.host_creator_collaboration_requests TO anon;
