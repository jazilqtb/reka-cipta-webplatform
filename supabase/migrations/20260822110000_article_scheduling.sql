-- CP5 ronde 3 — penjadwalan terbit artikel, TANPA cron.
--
-- KLASIFIKASI: mengubah SATU kebijakan RLS. Tidak ada kolom baru —
-- `published_at` sudah ada sejak migrasi pertama; yang berubah hanyalah
-- artinya: dari "kapan diterbitkan" menjadi "kapan BOLEH terbit".
--
-- KENAPA DI RLS, BUKAN DI SETIAP QUERY:
-- ada TUJUH tempat di kode yang menyaring `is_published` untuk pembaca
-- publik — daftar artikel, detail slug, artikel terkait, terpopuler,
-- terbaru, sitemap, dan generateStaticParams. Menambal ketujuhnya berarti
-- menyisakan yang KEDELAPAN untuk dilupakan nanti, dan kebocoran seperti
-- itu tidak menimbulkan error: artikel yang belum waktunya cuma muncul
-- diam-diam di sitemap, lalu terindeks.
-- Ditegakkan di database, satu tempat menutup semuanya — termasuk akses
-- langsung ke slug, RSS, dan kueri apa pun yang ditulis di kemudian hari.
--
-- ZONA WAKTU: published_at bertipe TIMESTAMPTZ dan dibandingkan dengan
-- now(), jadi seluruh perbandingan terjadi dalam UTC. Konversi ke waktu
-- lokal hanya terjadi saat DITAMPILKAN.

DROP POLICY IF EXISTS "Public can read published articles" ON public.articles;

CREATE POLICY "Public can read published articles"
    ON public.articles
    FOR SELECT
    TO anon, authenticated
    USING (
        is_published = TRUE
        AND (published_at IS NULL OR published_at <= now())
    );

COMMENT ON COLUMN public.articles.published_at IS
    'Kapan artikel BOLEH tampil ke publik. NULL = langsung tampil begitu '
    'is_published true. Nilai di MASA DEPAN = terjadwal: RLS menyembunyikan '
    'barisnya dari peran anon sampai waktunya lewat, tanpa cron. '
    'Selalu UTC (TIMESTAMPTZ); waktu lokal hanya untuk tampilan.';
