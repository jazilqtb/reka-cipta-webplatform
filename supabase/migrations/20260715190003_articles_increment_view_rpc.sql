-- RPC increment_article_view — Epic 6 Slice 1 (AR-03)
-- SECURITY DEFINER supaya anon bisa menaikkan view_count tanpa hak UPDATE
-- langsung di tabel articles (RLS di 20260715190001_articles_rls.sql tetap
-- menolak UPDATE langsung dari anon).

CREATE OR REPLACE FUNCTION public.increment_article_view(p_slug TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.articles
    SET view_count = view_count + 1
    WHERE slug = p_slug AND is_published = TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_article_view(TEXT) TO anon, authenticated;

COMMENT ON FUNCTION public.increment_article_view(TEXT) IS 'Menaikkan view_count artikel published. Dipanggil dari ArticleViewTracker (Client Component) via supabase.rpc(). Bukan proteksi anti-fraud kuat — metrik engagement lunak, lihat AR-03 epic6_task_breakdown_slice1_artikel-berita.md.';
