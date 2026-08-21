-- CP5 ronde 3 — kebijakan storage untuk bucket `partner-logos`.
--
-- Ditulis DI SAAT YANG SAMA dengan pembuatan bucketnya, bukan menyusul.
-- Itu langsung memperbaiki kesalahan yang baru saja ditemukan di bucket
-- `team-photos`: bucketnya dibuat lewat Storage API, kebijakannya tidak
-- pernah dibuat, dan setiap unggahan ditolak selama berminggu-minggu
-- dengan pesan "gagal upload" yang tidak menyebut sebabnya.
--
-- Aturan yang sekarang berlaku untuk bucket baru mana pun: bucket dan
-- kebijakannya datang berpasangan.

DROP POLICY IF EXISTS "Public can view partner logos"  ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload partner logos" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update partner logos" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete partner logos" ON storage.objects;

CREATE POLICY "Public can view partner logos"
    ON storage.objects FOR SELECT TO anon, authenticated
    USING (bucket_id = 'partner-logos');

CREATE POLICY "Admin can upload partner logos"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'partner-logos' AND public.is_admin());

CREATE POLICY "Admin can update partner logos"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'partner-logos' AND public.is_admin())
    WITH CHECK (bucket_id = 'partner-logos' AND public.is_admin());

CREATE POLICY "Admin can delete partner logos"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'partner-logos' AND public.is_admin());
