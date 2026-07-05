-- Storage RLS untuk bucket product-photos dan lab-docs — Epic 3 Slice 1
-- Bucket dibuat manual via Supabase Dashboard (public, lihat STOP Gate 1 execution guide).
-- Policy idempoten (DROP IF EXISTS dulu) mengikuti konvensi migration legal-docs.

-- ─── product-photos bucket policies ───────────────────────

DROP POLICY IF EXISTS "Public can view product photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload product photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update product photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete product photos" ON storage.objects;

CREATE POLICY "Public can view product photos"
    ON storage.objects
    FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'product-photos');

CREATE POLICY "Authenticated can upload product photos"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'product-photos');

CREATE POLICY "Authenticated can update product photos"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'product-photos')
    WITH CHECK (bucket_id = 'product-photos');

CREATE POLICY "Authenticated can delete product photos"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'product-photos');

-- ─── lab-docs bucket policies (identical pattern) ─────────

DROP POLICY IF EXISTS "Public can view lab docs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload lab docs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update lab docs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete lab docs" ON storage.objects;

CREATE POLICY "Public can view lab docs"
    ON storage.objects
    FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'lab-docs');

CREATE POLICY "Authenticated can upload lab docs"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'lab-docs');

CREATE POLICY "Authenticated can update lab docs"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'lab-docs')
    WITH CHECK (bucket_id = 'lab-docs');

CREATE POLICY "Authenticated can delete lab docs"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'lab-docs');
