-- ═══════════════════════════════════════════════════════════════════
-- NEEDS MANUAL APPROVAL — destructive
-- JANGAN JALANKAN sampai Jazil menyetujui secara eksplisit.
-- Berkas ini SENGAJA berada di luar supabase/migrations/ supaya
-- `supabase db push` tidak pernah menyentuhnya.
-- ═══════════════════════════════════════════════════════════════════
--
-- FASE: CONTRACT. Menghapus struktur lama setelah struktur baru terbukti
-- menopang seluruh sistem.
--
-- PRASYARAT — sistem sudah berjalan PENUH di atas struktur baru TANPA
-- berkas ini dijalankan. Itu memang keadaannya sekarang: `rfqs`,
-- `companies`, `contacts`, dan `rfq_items` sudah menjadi sumber untuk
-- seluruh permukaan, dan `rfq_leads` hanya tinggal sebagai arsip.
--
-- ─────────────────────────────────────────────────────────────────
-- BLAST RADIUS — diverifikasi lewat graphify + grep, bukan tebakan.
-- Berkas yang menyebut `rfq_leads` pada saat CONTRACT ini ditulis:
--
--   backend/routers/rfq.py           <- menulis lead baru dari form publik
--   backend/schemas/rfq.py           <- skema Pydantic
--   app/admin/dashboard/page.tsx     <- hitung lead baru & mandek
--   lib/data/hero.ts                 <- statistik hero (deal, kota)
--   supabase/migrations/2026082111*  <- migrasi MIGRATE (referensi historis)
--
-- SEBELUM menjalankan berkas ini, kelimanya harus sudah tidak lagi
-- menyentuh `rfq_leads`. Migrasi MIGRATE boleh tetap menyebutnya — ia
-- historis dan tidak dijalankan ulang di basis data yang sudah maju.
--
-- KEHILANGAN YANG DITERIMA kalau ini dijalankan:
--   · `rfqs.legacy_lead_id` menjadi NULL (ON DELETE SET NULL) sehingga
--     jejak balik ke baris asli hilang permanen.
--   · Volume gabungan per-lead lama hanya tersisa di
--     `rfqs.legacy_total_qty_kg` — nilainya sudah disalin, tapi tidak
--     ada lagi baris sumber untuk diaudit.
-- Karena itu: ambil dump `rfq_leads` sebelum menjalankan.
-- ─────────────────────────────────────────────────────────────────

BEGIN;

-- Sabuk pengaman: batalkan kalau masih ada rfq yang belum punya company.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.rfqs WHERE company_id IS NULL) THEN
    RAISE EXCEPTION 'Ada rfqs tanpa company_id — CONTRACT dibatalkan.';
  END IF;
  IF (SELECT count(*) FROM public.rfqs) < (SELECT count(*) FROM public.rfq_leads) THEN
    RAISE EXCEPTION 'Jumlah rfqs (%) lebih sedikit dari rfq_leads (%) — migrasi belum lengkap.',
      (SELECT count(*) FROM public.rfqs), (SELECT count(*) FROM public.rfq_leads);
  END IF;
END $$;

DROP TABLE IF EXISTS public.rfq_leads CASCADE;

COMMIT;
