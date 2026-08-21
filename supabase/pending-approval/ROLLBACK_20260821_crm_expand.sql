-- ROLLBACK untuk migrasi transformatif CP1 ronde 3.
-- Mengembalikan basis data ke keadaan SEBELUM 20260821110000_crm_expand.sql.
--
-- AMAN dijalankan kapan saja SELAMA berkas CONTRACT belum pernah
-- dijalankan: seluruh data asli masih utuh di `rfq_leads`, dan tabel-tabel
-- baru hanyalah turunannya. Tidak ada data yang hanya hidup di struktur
-- baru — kecuali RFQ yang dibuat SESUDAH migrasi. Periksa dulu:
--
--   SELECT count(*) FROM public.rfqs WHERE legacy_lead_id IS NULL;
--
-- Kalau hasilnya > 0, RFQ-RFQ itu lahir langsung di struktur baru dan akan
-- HILANG. Ekspor dulu sebelum melanjutkan.

BEGIN;

DROP FUNCTION IF EXISTS public.undo_company_merge(UUID);
DROP FUNCTION IF EXISTS public.merge_companies(UUID, UUID);
DROP FUNCTION IF EXISTS public.refresh_company_merge_candidates();

DROP TABLE IF EXISTS public.company_merges CASCADE;
DROP TABLE IF EXISTS public.company_merge_candidates CASCADE;
DROP TABLE IF EXISTS public.rfq_items CASCADE;
DROP TABLE IF EXISTS public.rfqs CASCADE;
DROP TABLE IF EXISTS public.contacts CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;

DROP FUNCTION IF EXISTS public.work_email_domain(TEXT);
DROP FUNCTION IF EXISTS public.normalize_phone_id(TEXT);
DROP FUNCTION IF EXISTS public.normalize_company_name(TEXT);

-- pg_trgm SENGAJA tidak di-drop: ekstensi bisa dipakai hal lain, dan
-- membiarkannya terpasang tidak merugikan apa pun.

COMMIT;
