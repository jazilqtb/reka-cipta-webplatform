-- ROLLBACK untuk 20260822110000_article_scheduling.sql
--
-- KENAPA MIGRASI ITU DIHITUNG TRANSFORMATIF, bukan additive:
-- ia tidak menambah apa pun — ia MENGGANTI kebijakan RLS yang sudah ada
-- ("Public can read published articles"). Kebijakan lama dijatuhkan lebih
-- dulu, dan di antara DROP dan CREATE tidak ada kebijakan yang berlaku.
-- Arah kegagalannya aman (tanpa kebijakan, anon tidak melihat apa pun,
-- bukan melihat semuanya), tapi tetap sebuah penggantian, bukan tambahan.
--
-- NOL BARIS TERSENTUH, di migrasi maupun di rollback ini. Tidak ada
-- ALTER TABLE, tidak ada UPDATE, tidak ada DROP COLUMN. Kolom
-- `published_at` sudah ada sejak migrasi pertama tabel articles; yang
-- berubah hanya ARTI-nya, dan arti tidak bisa di-rollback lewat SQL.
--
-- AKIBAT MENJALANKAN BERKAS INI: artikel mana pun yang `is_published`
-- true dengan `published_at` di MASA DEPAN akan langsung terlihat publik,
-- karena penyaring waktunya hilang. Periksa dulu:
--
--   SELECT slug, published_at FROM public.articles
--    WHERE is_published = TRUE AND published_at > now();
--
-- Kalau query itu mengembalikan baris, artikel-artikel itulah yang akan
-- bocor begitu rollback dijalankan. Jadikan draf dulu kalau belum waktunya.

BEGIN;

DROP POLICY IF EXISTS "Public can read published articles" ON public.articles;

CREATE POLICY "Public can read published articles"
    ON public.articles
    FOR SELECT
    TO anon, authenticated
    USING (is_published = TRUE);

COMMENT ON COLUMN public.articles.published_at IS NULL;

COMMIT;

-- Verifikasi sesudah rollback — harus mengembalikan tepat satu baris
-- dengan qual berbunyi `(is_published = true)` saja:
--
--   SELECT policyname, qual FROM pg_policies
--    WHERE tablename = 'articles'
--      AND policyname = 'Public can read published articles';
