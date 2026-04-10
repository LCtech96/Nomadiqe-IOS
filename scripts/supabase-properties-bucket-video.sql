-- ============================================
-- NOMADIQE - Abilita upload video nel bucket properties
-- Risolve: "mime type video/quicktime is not supported"
-- Esegui in Supabase → SQL Editor
-- ============================================

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg', 'image/png', 'image/webp',
  'video/mp4', 'video/quicktime'
]
WHERE id = 'properties';
