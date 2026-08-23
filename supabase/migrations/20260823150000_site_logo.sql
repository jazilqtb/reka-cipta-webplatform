-- Bucket + kebijakan untuk logo situs yang dikelola admin (bukan lagi
-- berkas statis di /public/logo/*.png). Bucket dan kebijakan dibuat
-- berpasangan (pola yang sama dengan partner-logos/team-photos).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-logo',
  'site-logo',
  true,
  2097152, -- 2MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view site logo" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload site logo" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update site logo" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete site logo" ON storage.objects;

CREATE POLICY "Public can view site logo"
    ON storage.objects FOR SELECT TO anon, authenticated
    USING (bucket_id = 'site-logo');

CREATE POLICY "Admin can upload site logo"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'site-logo' AND public.is_admin());

CREATE POLICY "Admin can update site logo"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'site-logo' AND public.is_admin())
    WITH CHECK (bucket_id = 'site-logo' AND public.is_admin());

CREATE POLICY "Admin can delete site logo"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'site-logo' AND public.is_admin());

-- Nilai bawaan menunjuk ke berkas statis yang sudah ada (path diawali
-- '/' = aset lokal, pola yang sama dengan about_team.photo_path) —
-- supaya situs tidak berubah tampilan sampai admin mengunggah logo
-- lewat /admin/logo.
INSERT INTO public.company_settings (key, value) VALUES
  ('logo_dark_path', '/logo/logo-dark.png'),
  ('logo_light_path', '/logo/logo-light.png')
ON CONFLICT (key) DO NOTHING;
