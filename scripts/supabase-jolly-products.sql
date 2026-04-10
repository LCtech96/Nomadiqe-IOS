-- =========================================================
-- Nomadiqe: Jolly prodotti per la casa (e-commerce)
-- Per Jolly con jolly_subcategory = 'home_products': catalogo prodotti con prezzi e quantità
-- Eseguire dopo supabase-jolly-restaurant-and-ratings.sql
-- =========================================================

COMMENT ON COLUMN public.profiles.jolly_subcategory IS 'cleaner | property_manager | assistenza | autista | fornitore | restaurant | excursions | boat_excursions | home_products';

-- Catalogo prodotti (carta igienica, tovaglie, shampoo, arredamenti, ecc.)
CREATE TABLE IF NOT EXISTS public.jolly_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jolly_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL CHECK (price >= 0),
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jolly_products_jolly ON public.jolly_products(jolly_id);
CREATE INDEX IF NOT EXISTS idx_jolly_products_sort ON public.jolly_products(jolly_id, sort_order);

COMMENT ON TABLE public.jolly_products IS 'Prodotti e-commerce per Jolly con jolly_subcategory = home_products';
COMMENT ON COLUMN public.jolly_products.price IS 'Prezzo unitario';
COMMENT ON COLUMN public.jolly_products.quantity IS 'Quantità disponibile';

ALTER TABLE public.jolly_products ENABLE ROW LEVEL SECURITY;

-- Il Jolly può gestire solo i propri prodotti
DROP POLICY IF EXISTS "Jolly can manage own products" ON public.jolly_products;
CREATE POLICY "Jolly can manage own products"
  ON public.jolly_products FOR ALL TO authenticated
  USING (auth.uid() = jolly_id)
  WITH CHECK (auth.uid() = jolly_id);

-- Chiunque (autenticato) può leggere i prodotti (per mostrare catalogo sulla card e in lista)
DROP POLICY IF EXISTS "Anyone can read jolly products" ON public.jolly_products;
CREATE POLICY "Anyone can read jolly products"
  ON public.jolly_products FOR SELECT TO authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.jolly_products TO authenticated;
