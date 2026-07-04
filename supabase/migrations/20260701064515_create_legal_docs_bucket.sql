-- Buat storage bucket legal-docs (private)
-- Ref: E2-S2-STG-01 — Slice 2 Tentang Kami
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'legal-docs',
  'legal-docs',
  false,          -- private: tidak bisa diakses via URL langsung
  10485760,       -- 10MB max file size
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Drop dulu jika policy sudah ada (idempoten — aman dijalankan ulang)
DROP POLICY IF EXISTS "auth_insert_legal_docs" ON storage.objects;
DROP POLICY IF EXISTS "auth_read_legal_docs"   ON storage.objects;
DROP POLICY IF EXISTS "auth_delete_legal_docs" ON storage.objects;

-- RLS: hanya authenticated user yang bisa upload
CREATE POLICY "auth_insert_legal_docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'legal-docs');

-- RLS: hanya authenticated user yang bisa read (untuk admin)
-- Note: Public download menggunakan signed URL via service role — bypass RLS
CREATE POLICY "auth_read_legal_docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'legal-docs');

-- RLS: hanya authenticated user yang bisa hapus
CREATE POLICY "auth_delete_legal_docs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'legal-docs');
