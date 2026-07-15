-- Create articles table — Epic 6 Slice 1 (Artikel & Berita)
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    thumbnail_path TEXT,
    meta_description VARCHAR(300),
    view_count INT NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT articles_category_check
        CHECK (category IN ('education', 'company_news')),
    CONSTRAINT articles_view_count_check
        CHECK (view_count >= 0)
);

-- Indexes for common queries
CREATE INDEX idx_articles_slug ON public.articles(slug);
CREATE INDEX idx_articles_published ON public.articles(is_published, published_at DESC)
    WHERE is_published = TRUE;
CREATE INDEX idx_articles_category ON public.articles(category) WHERE is_published = TRUE;
CREATE INDEX idx_articles_view_count ON public.articles(view_count DESC) WHERE is_published = TRUE;

-- Trigger auto-update updated_at (reuse function dari migration company_settings)
CREATE TRIGGER trigger_articles_set_updated_at
    BEFORE UPDATE ON public.articles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Comment untuk dokumentasi
COMMENT ON TABLE public.articles IS 'Artikel edukasi dan berita perusahaan CV Reka Cipta Indonesia — Epic 6 Slice 1';
COMMENT ON COLUMN public.articles.thumbnail_path IS 'Path relatif file di bucket article-thumbnails (mis. standar-sni-garam.jpg), BUKAN URL absolut. Full public URL dikonstruksi di application layer via lib/storage.ts getPublicStorageUrl(), pola sama dengan products.photo_path.';
COMMENT ON COLUMN public.articles.meta_description IS 'Dipakai dual-purpose: SEO meta description DAN teks excerpt/preview di ArticleCard (lihat AR-04 epic6_task_breakdown_slice1_artikel-berita.md) — tidak ada kolom excerpt terpisah.';
COMMENT ON COLUMN public.articles.view_count IS 'Ekstensi di luar skema Epic Doc 2 asli (lihat AR-06) — hanya berubah lewat RPC increment_article_view, read-only dari sisi Admin Panel.';
