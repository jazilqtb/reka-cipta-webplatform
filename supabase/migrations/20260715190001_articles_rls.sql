-- RLS untuk tabel articles — Epic 6 Slice 1

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Policy: Public (anon + authenticated) hanya bisa SELECT artikel published
CREATE POLICY "Public can read published articles"
    ON public.articles
    FOR SELECT
    TO anon, authenticated
    USING (is_published = TRUE);

-- Policy: Authenticated users can SELECT all articles (untuk Admin Panel Epic 6, epic terpisah masa depan)
CREATE POLICY "Authenticated can read all articles"
    ON public.articles
    FOR SELECT
    TO authenticated
    USING (TRUE);

-- Policy: Authenticated can INSERT (untuk Admin Panel Epic 6)
CREATE POLICY "Authenticated can insert articles"
    ON public.articles
    FOR INSERT
    TO authenticated
    WITH CHECK (TRUE);

-- Policy: Authenticated can UPDATE
CREATE POLICY "Authenticated can update articles"
    ON public.articles
    FOR UPDATE
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

-- Policy: Authenticated can DELETE
CREATE POLICY "Authenticated can delete articles"
    ON public.articles
    FOR DELETE
    TO authenticated
    USING (TRUE);

-- CATATAN: tidak ada policy UPDATE untuk anon — kolom view_count hanya boleh
-- naik lewat RPC increment_article_view (SECURITY DEFINER, lihat migration
-- 20260715190003_articles_increment_view_rpc.sql), bukan UPDATE langsung.
