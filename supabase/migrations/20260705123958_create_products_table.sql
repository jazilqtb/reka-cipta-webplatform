-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL,
    tagline VARCHAR(300),
    description TEXT,
    specs JSONB NOT NULL DEFAULT '{}'::jsonb,
    industries TEXT[] NOT NULL DEFAULT '{}',
    category VARCHAR(50) NOT NULL,
    is_sni BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    photo_path TEXT,
    lab_doc_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT products_category_check
        CHECK (category IN ('halus', 'kasar', 'industri'))
);

-- Indexes for common queries
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_is_active ON public.products(is_active);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_sort_order ON public.products(sort_order);

-- Trigger auto-update updated_at (reuse function dari migration company_settings)
CREATE TRIGGER trigger_products_set_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Comment untuk dokumentasi
COMMENT ON TABLE public.products IS 'Katalog produk garam CV Reka Cipta Indonesia — Epic 3';
COMMENT ON COLUMN public.products.specs IS 'Spesifikasi teknis dari uji lab dalam format JSONB. Contoh: {"nacl_pct": 97.5, "water_pct": 0.5, "kio3_ppm": 30, ...}';
COMMENT ON COLUMN public.products.industries IS 'Array nama industri yang dilayani. Contoh: ["Makanan & Minuman", "Farmasi", "Peternakan"]';
COMMENT ON COLUMN public.products.photo_path IS 'Path relatif file di bucket product-photos (mis. pro-yd.jpg), BUKAN URL absolut. Full public URL dikonstruksi di application layer dari env var SUPABASE_URL, lihat ARCHITECTURE.md §12.4.';
COMMENT ON COLUMN public.products.lab_doc_path IS 'Path relatif file di bucket lab-docs (mis. lab-pro-yd.pdf), BUKAN URL absolut. Full public URL dikonstruksi di application layer dari env var SUPABASE_URL, lihat ARCHITECTURE.md §12.4.';
