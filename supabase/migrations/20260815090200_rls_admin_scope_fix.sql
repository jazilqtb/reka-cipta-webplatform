-- Checkpoint 1 — KOREKSI atas 20260815090100.
--
-- KENAPA FILE INI ADA (dicatat apa adanya, bukan disembunyikan):
-- Migrasi 20260815090100 menebak nama policy lama. Sebagian tebakan
-- MELESET, dan `DROP POLICY IF EXISTS` diam-diam melewatinya
-- ("does not exist, skipping"). Karena policy RLS bersifat PERMISSIVE
-- dan di-OR-kan, policy longgar yang lolos dari DROP membuat policy
-- ketat yang baru TIDAK BERPENGARUH APA-APA. Terdeteksi saat memeriksa
-- output `db push` terhadap nama policy sebenarnya di file migrasi asli.
--
-- Nama sebenarnya menyesatkan: policy di rfq_leads bernama
-- "Admin can read all RFQ" tetapi predikatnya `TO authenticated
-- USING (TRUE)` — dinamai admin, faktanya terbuka untuk semua akun.
--
-- File ini men-drop nama-nama YANG BENAR (diverifikasi langsung dari
-- file migrasi asli, bukan ditebak).

-- ═══════════════════════════════════════════════════════════
-- RFQ_LEADS — PII calon pelanggan. Prioritas tertinggi.
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Admin can read all RFQ" ON public.rfq_leads;
DROP POLICY IF EXISTS "Admin can update RFQ"   ON public.rfq_leads;
DROP POLICY IF EXISTS "Admin can delete RFQ"   ON public.rfq_leads;
-- Policy pengganti (*_admin_*) sudah dibuat di 20260815090100.

-- ═══════════════════════════════════════════════════════════
-- SUPPLIER_REGISTRATIONS — PII mitra supplier.
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Admin can read all suppliers" ON public.supplier_registrations;
DROP POLICY IF EXISTS "Admin can update suppliers"   ON public.supplier_registrations;
DROP POLICY IF EXISTS "Admin can delete suppliers"   ON public.supplier_registrations;

-- ═══════════════════════════════════════════════════════════
-- PRODUCTS — sisa satu: baca SEMUA produk (termasuk is_active=false,
-- yaitu draf yang belum dipublikasikan).
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Authenticated can read all products" ON public.products;
CREATE POLICY "products_admin_select_all" ON public.products
    FOR SELECT TO authenticated USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════
-- STORAGE — terlewat sepenuhnya di migrasi sebelumnya.
-- Sebelum ini, akun terdaftar mana pun bisa UPLOAD, TIMPA, dan HAPUS
-- file di bucket product-photos, lab-docs, dan article-thumbnails.
-- Baca publik (view) sengaja DIPERTAHANKAN — situs publik butuh itu.
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Authenticated can upload product photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update product photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete product photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload lab docs"       ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update lab docs"       ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete lab docs"       ON storage.objects;

CREATE POLICY "storage_admin_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id IN ('product-photos', 'lab-docs', 'article-thumbnails')
        AND public.is_admin()
    );
CREATE POLICY "storage_admin_update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id IN ('product-photos', 'lab-docs', 'article-thumbnails')
        AND public.is_admin()
    );
CREATE POLICY "storage_admin_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id IN ('product-photos', 'lab-docs', 'article-thumbnails')
        AND public.is_admin()
    );

-- CATATAN: policy storage untuk article-thumbnails dari migrasi
-- 20260715190002 di-drop di bawah ini kalau namanya cocok; kalau
-- tidak, policy admin di atas tetap berlaku berdampingan dan HARUS
-- diverifikasi manual di Dashboard > Storage > Policies.
DROP POLICY IF EXISTS "Authenticated can upload article thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update article thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete article thumbnails" ON storage.objects;
