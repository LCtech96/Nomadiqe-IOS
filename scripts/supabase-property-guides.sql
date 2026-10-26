-- =============================================================================
-- Property guides: host-editable guest info per property (check-in, wifi, etc.)
-- Run in Supabase SQL Editor after supabase-schema.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.property_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL UNIQUE REFERENCES public.properties(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in_out TEXT NOT NULL DEFAULT '',
  how_to_get_there TEXT NOT NULL DEFAULT '',
  wifi TEXT NOT NULL DEFAULT '',
  transportation TEXT NOT NULL DEFAULT '',
  good_to_know TEXT NOT NULL DEFAULT '',
  what_to_do TEXT NOT NULL DEFAULT '',
  restaurants TEXT NOT NULL DEFAULT '',
  bars TEXT NOT NULL DEFAULT '',
  property_rules TEXT NOT NULL DEFAULT '',
  emergency_numbers TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_guides_property ON public.property_guides(property_id);
CREATE INDEX IF NOT EXISTS idx_property_guides_host ON public.property_guides(host_id);

-- Shareable links: host shares with creators who requested info via message
CREATE TABLE IF NOT EXISTS public.property_guide_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_guide_share_links_token ON public.property_guide_share_links(token);
CREATE INDEX IF NOT EXISTS idx_property_guide_share_links_property ON public.property_guide_share_links(property_id);

-- Granted access for creators (via share link or accepted collaboration)
CREATE TABLE IF NOT EXISTS public.property_guide_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_via TEXT NOT NULL DEFAULT 'share_link' CHECK (granted_via IN ('share_link', 'collaboration')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (property_id, creator_id)
);

CREATE INDEX IF NOT EXISTS idx_property_guide_access_creator ON public.property_guide_access(creator_id);
CREATE INDEX IF NOT EXISTS idx_property_guide_access_property ON public.property_guide_access(property_id);

ALTER TABLE public.property_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_guide_share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_guide_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hosts manage own property guides" ON public.property_guides;
CREATE POLICY "Hosts manage own property guides"
  ON public.property_guides FOR ALL
  TO authenticated
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Creators with access read property guides" ON public.property_guides;
CREATE POLICY "Creators with access read property guides"
  ON public.property_guides FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.property_guide_access pga
      WHERE pga.property_id = property_guides.property_id
        AND pga.creator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Hosts manage own guide share links" ON public.property_guide_share_links;
CREATE POLICY "Hosts manage own guide share links"
  ON public.property_guide_share_links FOR ALL
  TO authenticated
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Anyone authenticated can validate share link token" ON public.property_guide_share_links;
CREATE POLICY "Anyone authenticated can validate share link token"
  ON public.property_guide_share_links FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Creators read own guide access" ON public.property_guide_access;
CREATE POLICY "Creators read own guide access"
  ON public.property_guide_access FOR SELECT
  TO authenticated
  USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Creators insert own guide access" ON public.property_guide_access;
CREATE POLICY "Creators insert own guide access"
  ON public.property_guide_access FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Hosts read guide access for their properties" ON public.property_guide_access;
CREATE POLICY "Hosts read guide access for their properties"
  ON public.property_guide_access FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_guide_access.property_id
        AND (p.owner_id = auth.uid() OR p.host_id = auth.uid())
    )
  );

COMMENT ON TABLE public.property_guides IS 'Guest guide info per property (check-in, wifi, rules, etc.)';
COMMENT ON TABLE public.property_guide_share_links IS 'Shareable links for hosts to grant creators read access to property guide';
COMMENT ON TABLE public.property_guide_access IS 'Creators granted read access via share link or accepted collaboration';
