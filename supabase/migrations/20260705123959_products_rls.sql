-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy: Public can SELECT active products only
CREATE POLICY "Public can read active products"
    ON public.products
    FOR SELECT
    TO anon, authenticated
    USING (is_active = TRUE);

-- Policy: Authenticated users can SELECT all products (untuk admin panel Epic 3B)
CREATE POLICY "Authenticated can read all products"
    ON public.products
    FOR SELECT
    TO authenticated
    USING (TRUE);

-- Policy: Authenticated can INSERT (untuk Epic 3B admin)
CREATE POLICY "Authenticated can insert products"
    ON public.products
    FOR INSERT
    TO authenticated
    WITH CHECK (TRUE);

-- Policy: Authenticated can UPDATE
CREATE POLICY "Authenticated can update products"
    ON public.products
    FOR UPDATE
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

-- Policy: Authenticated can DELETE (soft delete pakai is_active, tapi hard delete tetap allowed untuk admin)
CREATE POLICY "Authenticated can delete products"
    ON public.products
    FOR DELETE
    TO authenticated
    USING (TRUE);
