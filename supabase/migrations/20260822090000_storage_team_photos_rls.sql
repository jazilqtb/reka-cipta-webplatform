-- CP5 ronde 3 — kebijakan RLS storage untuk bucket `team-photos`.
--
-- BUG YANG DITUTUP, dan kenapa ia luput:
-- Bucket `team-photos` dibuat di CP4 lewat Storage API — bucket-nya jadi,
-- `public: true` menyala, dan MEMBACA berkas berfungsi. Yang tidak pernah
-- dibuat adalah kebijakan MENULIS di `storage.objects`. Akibatnya setiap
-- unggahan ditolak dengan "new row violates row-level security policy",
-- dan pesan itu tidak pernah sampai ke admin — ia hanya melihat
-- "gagal upload foto".
--
-- Empat bucket lain (article-thumbnails, product-photos, lab-docs,
-- legal-docs) semuanya punya berkas migrasi kebijakan sendiri. `team-photos`
-- tidak, karena ia satu-satunya yang dibuat lewat API alih-alih lewat
-- migrasi. Pelajaran itu ditulis ke ACTION REQUIRED: bucket baru harus
-- selalu datang berpasangan dengan kebijakannya, dalam migrasi yang sama.
--
-- DIREPRODUKSI SEBELUM DIPERBAIKI: unggah PNG 85 byte sebagai admin yang
-- benar-benar login -> "new row violates row-level security policy" (403).

DROP POLICY IF EXISTS "Public can view team photos"           ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload team photos"          ON storage.objects;
DROP POLICY IF EXISTS "Admin can update team photos"          ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete team photos"          ON storage.objects;

-- BACA publik: foto tim tampil di halaman /tentang-kami yang anonim.
CREATE POLICY "Public can view team photos"
    ON storage.objects FOR SELECT TO anon, authenticated
    USING (bucket_id = 'team-photos');

-- TULIS hanya admin dari allowlist. Bucket lain memakai `TO authenticated`
-- tanpa syarat tambahan — pola yang dibuat sebelum allowlist admin ada.
-- Di sini dipakai public.is_admin() karena signup publik di project ini
-- MASIH AKTIF, jadi "authenticated" bukan sinonim "admin": siapa pun yang
-- mendaftar akan bisa menulis ke bucket kalau syaratnya hanya login.
CREATE POLICY "Admin can upload team photos"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'team-photos' AND public.is_admin());

CREATE POLICY "Admin can update team photos"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'team-photos' AND public.is_admin())
    WITH CHECK (bucket_id = 'team-photos' AND public.is_admin());

CREATE POLICY "Admin can delete team photos"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'team-photos' AND public.is_admin());
