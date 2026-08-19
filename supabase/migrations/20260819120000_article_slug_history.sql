-- CP3 — Riwayat slug artikel + redirect 301.
--
-- KLASIFIKASI: ADDITIVE murni. Satu tabel baru. Nol kolom lama diubah,
-- nol baris tersentuh, nol query lama rusak. Reversible dengan DROP TABLE
-- selama belum ada baris yang diandalkan.
-- Disetujui Jazil 2026-08-19 (§7 docs/ADMIN-OVERHAUL-DISCOVERY.md).
--
-- MASALAH YANG DITUTUP:
-- `articles.slug` unik dan diisi manual. Di form admin, slug auto-regenerate
-- dari judul saat mode create, dan bisa disunting bebas saat edit — dengan
-- peringatan bahwa "link lama akan 404". Artinya memperbaiki typo pada judul
-- artikel yang sudah terbit BISA mematahkan setiap tautan yang mengarah ke
-- sana, termasuk hasil pencarian Google yang sudah terindeks.
--
-- KEBIJAKAN BARU:
--   draf           slug bebas mengikuti judul (belum ada yang menautkan)
--   terbit pertama slug DIBEKUKAN, tidak pernah auto-regenerate lagi
--   diubah manual  slug lama masuk ke tabel ini -> /artikel/<slug-lama>
--                  menjawab 301 ke slug baru
--
-- KENAPA 301, BUKAN 404 ATAU 302:
-- 301 (permanen) memindahkan otoritas peringkat ke URL baru; 302 tidak.
-- Tanpa redirect, tautan lama mati dan peringkatnya hilang total.

CREATE TABLE IF NOT EXISTS public.article_slug_history (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id  UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    old_slug    TEXT NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.article_slug_history IS
    'Slug lama artikel setelah diubah. Dipakai /artikel/[slug] untuk '
    'menjawab 301 ke slug terkini, supaya tautan & peringkat SEO tidak '
    'patah saat judul artikel diperbaiki.';

COMMENT ON COLUMN public.article_slug_history.old_slug IS
    'UNIQUE — satu slug hanya boleh menunjuk ke satu artikel, kalau tidak '
    'redirect-nya ambigu. Juga mencegah slug lama dipakai ulang artikel '
    'lain, yang akan membuat redirect mengarah ke isi yang salah.';

-- Pencarian selalu lewat old_slug (satu lookup per request 404 potensial).
CREATE INDEX IF NOT EXISTS idx_article_slug_history_old_slug
    ON public.article_slug_history(old_slug);

CREATE INDEX IF NOT EXISTS idx_article_slug_history_article
    ON public.article_slug_history(article_id);

-- ─── RLS ───
-- Pola sama dengan articles: publik boleh BACA (redirect harus bekerja
-- untuk pengunjung anonim), hanya admin yang boleh menulis.
ALTER TABLE public.article_slug_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "slug_history_public_read"
    ON public.article_slug_history
    FOR SELECT TO anon, authenticated
    USING (TRUE);

CREATE POLICY "slug_history_admin_write"
    ON public.article_slug_history
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
