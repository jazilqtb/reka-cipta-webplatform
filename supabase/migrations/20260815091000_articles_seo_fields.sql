-- Checkpoint 3 — Field SEO per-artikel.
--
-- KLASIFIKASI: ADDITIVE murni. Tiga kolom baru, SEMUANYA NULLABLE,
-- tanpa DEFAULT dan tanpa constraint baru. Nol baris tersentuh, nol
-- query lama rusak (SELECT * tetap jalan, INSERT lama tetap valid).
-- Reversible tanpa kehilangan data: DROP COLUMN mengembalikan keadaan
-- semula selama kolomnya memang belum diisi.
--
-- BLAST RADIUS (diverifikasi via graphify query + grep, bukan tebakan) —
-- file yang membaca/menulis tabel `articles`:
--   app/admin/articles/page.tsx            (list, baca)
--   app/admin/articles/[id]/edit/page.tsx  (edit, baca+tulis)
--   lib/data/articles.ts                   (query publik)
--   app/(public)/artikel/[slug]/page.tsx   (render + JSON-LD)
--   backend/routers/articles.py            (CRUD API)
-- Ditambah app/sitemap.ts yang membaca lewat lib/data/articles.ts.
-- Karena kolomnya nullable dan tak ada yang di-rename, tidak satu pun
-- dari file di atas perlu berubah agar tetap berfungsi.
--
-- KENAPA FALLBACK, BUKAN NOT NULL:
-- 6 artikel yang sudah ada tidak punya nilai untuk kolom ini. Memaksa
-- NOT NULL akan menolak baris lama (destructive). Sebagai gantinya,
-- application layer memakai pola fallback:
--   meta_title    -> kalau NULL, pakai `title`
--   og_image_path -> kalau NULL, pakai `thumbnail_path`
--   canonical_url -> kalau NULL, susun dari slug
-- Artinya SEO tetap benar untuk artikel lama tanpa backfill apa pun.

ALTER TABLE public.articles
    ADD COLUMN IF NOT EXISTS meta_title    VARCHAR(200),
    ADD COLUMN IF NOT EXISTS og_image_path TEXT,
    ADD COLUMN IF NOT EXISTS canonical_url TEXT;

COMMENT ON COLUMN public.articles.meta_title IS
    'Judul untuk <title> & og:title. NULL = pakai kolom title. Dipisah '
    'karena judul yang bagus untuk pembaca sering terlalu panjang / kurang '
    'mengandung kata kunci untuk hasil pencarian (batas aman ~60 karakter).';

COMMENT ON COLUMN public.articles.og_image_path IS
    'Path relatif di bucket article-thumbnails untuk og:image / twitter:image. '
    'NULL = pakai thumbnail_path. Dipisah karena rasio ideal social card '
    '(1200x630) berbeda dari thumbnail kartu artikel (16:9).';

COMMENT ON COLUMN public.articles.canonical_url IS
    'URL kanonik absolut. NULL = susun dari slug '
    '(https://rekaciptaindonesia.com/artikel/{slug}). Diisi manual HANYA '
    'kalau artikel ini duplikat/republish dari sumber lain.';

-- Index parsial: hanya artikel yang PUNYA canonical override. Jumlahnya
-- akan sedikit, jadi index-nya kecil dan murah.
CREATE INDEX IF NOT EXISTS idx_articles_canonical
    ON public.articles(canonical_url)
    WHERE canonical_url IS NOT NULL;
