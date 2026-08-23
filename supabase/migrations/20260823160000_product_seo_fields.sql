ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS meta_title       VARCHAR(200),
    ADD COLUMN IF NOT EXISTS meta_description VARCHAR(300),
    ADD COLUMN IF NOT EXISTS og_image_path    TEXT,
    ADD COLUMN IF NOT EXISTS canonical_url    TEXT;

COMMENT ON COLUMN public.products.meta_title IS
    'NULL = pakai "{name} — {code}".';
COMMENT ON COLUMN public.products.meta_description IS
    'NULL = pakai tagline, lalu description.';
COMMENT ON COLUMN public.products.og_image_path IS
    'Path relatif di bucket product-photos. NULL = pakai photo_path.';
COMMENT ON COLUMN public.products.canonical_url IS
    'NULL = susun dari slug.';

CREATE INDEX IF NOT EXISTS idx_products_canonical
    ON public.products(canonical_url)
    WHERE canonical_url IS NOT NULL;
