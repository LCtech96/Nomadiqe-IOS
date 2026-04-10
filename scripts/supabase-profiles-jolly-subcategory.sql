-- Aggiungi sottocategoria jolly a profiles (cleaner, property_manager, assistenza, autista, fornitore)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS jolly_subcategory TEXT;
