-- Storage RLS untuk bucket article-thumbnails — Epic 6 Slice 1
-- Bucket dibuat manual via Supabase Dashboard (public), pola sama dengan
-- product-photos/lab-docs (lihat 20260705124000_storage_products_rls.sql).
-- Policy idempoten (DROP IF EXISTS dulu) mengikuti konvensi yang sama.

DROP POLICY IF EXISTS "Public can view article thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload article thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update article thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete article thumbnails" ON storage.objects;

CREATE POLICY "Public can view article thumbnails"
    ON storage.objects
    FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'article-thumbnails');

CREATE POLICY "Authenticated can upload article thumbnails"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'article-thumbnails');

CREATE POLICY "Authenticated can update article thumbnails"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'article-thumbnails')
    WITH CHECK (bucket_id = 'article-thumbnails');

CREATE POLICY "Authenticated can delete article thumbnails"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'article-thumbnails');
