-- Checkpoint 1 — Re-scope RLS: role `authenticated` -> admin allowlist
--
-- KLASIFIKASI: bukan destructive terhadap DATA (nol baris disentuh,
-- nol kolom diubah). Yang berubah adalah AKSES. Sepenuhnya reversible —
-- SQL rollback ada di bagian bawah file ini.
--
-- MASALAH:
-- Policy lama memberi CRUD penuh ke SEMUA user ber-role `authenticated`
-- dengan predikat USING (TRUE). Contoh (20260715190001_articles_rls.sql):
--     CREATE POLICY "Authenticated can delete articles"
--       ON articles FOR DELETE TO authenticated USING (TRUE);
-- Karena signup publik aktif, "authenticated" = "siapa pun di internet
-- yang mau mendaftar".
--
-- KENAPA POLICY LAMA HARUS DI-DROP, BUKAN CUKUP TAMBAH YANG BARU:
-- Policy RLS PostgreSQL bersifat PERMISSIVE dan di-OR-kan. Menambah
-- policy ketat sambil membiarkan yang longgar = tidak ada efek sama
-- sekali; yang longgar tetap meloloskan semua orang.
--
-- YANG TIDAK TERDAMPAK (penting, sudah diverifikasi):
--   - Backend FastAPI: pakai SERVICE ROLE key (backend/core/supabase.py)
--     yang mem-bypass RLS. Otorisasinya kini dijaga require_admin.
--   - Halaman publik: policy `anon` (baca produk aktif, artikel
--     published) TIDAK disentuh sama sekali di file ini.

-- ═══════════════════════════════════════════════════════════
-- ARTICLES — publik tetap baca yang published; tulis khusus admin
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Authenticated can read all articles" ON public.articles;
DROP POLICY IF EXISTS "Authenticated can insert articles"   ON public.articles;
DROP POLICY IF EXISTS "Authenticated can update articles"   ON public.articles;
DROP POLICY IF EXISTS "Authenticated can delete articles"   ON public.articles;

CREATE POLICY "articles_admin_select_all" ON public.articles
    FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "articles_admin_insert" ON public.articles
    FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "articles_admin_update" ON public.articles
    FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "articles_admin_delete" ON public.articles
    FOR DELETE TO authenticated USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════
-- PRODUCTS
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Authenticated can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated can update products" ON public.products;
DROP POLICY IF EXISTS "Authenticated can delete products" ON public.products;
DROP POLICY IF EXISTS "products_auth_insert" ON public.products;
DROP POLICY IF EXISTS "products_auth_update" ON public.products;
DROP POLICY IF EXISTS "products_auth_delete" ON public.products;

CREATE POLICY "products_admin_insert" ON public.products
    FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "products_admin_update" ON public.products
    FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "products_admin_delete" ON public.products
    FOR DELETE TO authenticated USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════
-- RFQ_LEADS — data calon pelanggan (nama, email, WA, kebutuhan).
-- Ini PII. Sebelumnya bisa dibaca user terdaftar mana pun.
-- INSERT publik (form RFQ) dibiarkan apa adanya.
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Authenticated can read leads"   ON public.rfq_leads;
DROP POLICY IF EXISTS "Authenticated can update leads" ON public.rfq_leads;
DROP POLICY IF EXISTS "Authenticated can delete leads" ON public.rfq_leads;
DROP POLICY IF EXISTS "rfq_leads_auth_select" ON public.rfq_leads;
DROP POLICY IF EXISTS "rfq_leads_auth_update" ON public.rfq_leads;
DROP POLICY IF EXISTS "rfq_leads_auth_delete" ON public.rfq_leads;

CREATE POLICY "rfq_leads_admin_select" ON public.rfq_leads
    FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "rfq_leads_admin_update" ON public.rfq_leads
    FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "rfq_leads_admin_delete" ON public.rfq_leads
    FOR DELETE TO authenticated USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════
-- SUPPLIER_REGISTRATIONS — juga PII (nama usaha, lokasi, WA, email)
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Authenticated can read suppliers"   ON public.supplier_registrations;
DROP POLICY IF EXISTS "Authenticated can update suppliers" ON public.supplier_registrations;
DROP POLICY IF EXISTS "Authenticated can delete suppliers" ON public.supplier_registrations;
DROP POLICY IF EXISTS "supplier_registrations_auth_select" ON public.supplier_registrations;
DROP POLICY IF EXISTS "supplier_registrations_auth_update" ON public.supplier_registrations;
DROP POLICY IF EXISTS "supplier_registrations_auth_delete" ON public.supplier_registrations;

CREATE POLICY "supplier_admin_select" ON public.supplier_registrations
    FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "supplier_admin_update" ON public.supplier_registrations
    FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "supplier_admin_delete" ON public.supplier_registrations
    FOR DELETE TO authenticated USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════
-- LEAD_STATUS_HISTORY
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Admin can read history" ON public.lead_status_history;
CREATE POLICY "lead_history_admin_select" ON public.lead_status_history
    FOR SELECT TO authenticated USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════
-- ROLLBACK (jalankan blok ini untuk mengembalikan perilaku lama):
--
--   DROP POLICY IF EXISTS "articles_admin_select_all" ON public.articles;
--   ... (drop semua policy *_admin_* yang dibuat di atas) ...
--   CREATE POLICY "Authenticated can read all articles"
--     ON public.articles FOR SELECT TO authenticated USING (TRUE);
--   ... dst, persis seperti di file migrasi asli:
--       20260715190001_articles_rls.sql
--       20260705123959_products_rls.sql
--       20260707131758_rfq_leads_rls.sql
--       20260712013805_supplier_registrations_rls.sql
--       20260708020001_lead_status_history_rls.sql
--
-- Rollback TIDAK menyentuh data — hanya definisi akses.
-- ═══════════════════════════════════════════════════════════
