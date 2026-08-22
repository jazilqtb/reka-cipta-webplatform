-- 20260822140000_lead_archive.sql
-- CP1 ronde 4 — menyembunyikan lead (arsip), bukan menghapusnya.
--
-- ═══ KENAPA ARSIP, BUKAN HAPUS ═══
--
-- Lead bukan lagi entitas berdiri sendiri sejak CP1 ronde 3. Satu lead
-- menggantung pada rantai berikut:
--
--   rfq_leads ──(legacy_lead_id, ON DELETE SET NULL)──> rfqs
--                                                         │
--                                        rfq_items ───────┘ (CASCADE)
--                                        tasks     ───────┘ (CASCADE)
--   rfq_leads ──(lead_id, ON DELETE CASCADE)──> lead_status_history
--   rfqs ──> companies, contacts
--
-- Perhatikan `ON DELETE SET NULL` pada `rfqs.legacy_lead_id`. Menghapus
-- satu baris `rfq_leads` TIDAK meninggalkan foreign key menggantung —
-- Postgres menjaga itu — tapi ia meninggalkan sesuatu yang lebih licik:
-- baris `rfqs` yang MASIH HIDUP dengan `legacy_lead_id = NULL`. Ia tetap
-- terhitung di dashboard dan di statistik, tapi asal-usulnya sudah
-- terputus dan tidak bisa dipulihkan. Itu bukan baris yatim menurut
-- definisi Postgres, tapi ia baris yatim menurut definisi yang penting:
-- data yang tidak lagi bisa dijelaskan dari mana asalnya.
--
-- Karena itu perilaku BAKU adalah menyembunyikan. Yang disembunyikan
-- tetap utuh, tetap bisa dipulihkan, dan berhenti terhitung di mana pun.
--
-- Penghapusan permanen tetap disediakan, tapi (a) hanya untuk lead yang
-- SUDAH diarsipkan lebih dulu, dan (b) lewat satu fungsi yang menghapus
-- seluruh rantai secara eksplisit dalam satu transaksi — bukan lewat
-- DELETE lepas yang mengandalkan orang mengingat urutannya.
--
-- SIFAT: ADDITIVE MURNI. Nol kolom diubah, nol baris disentuh.

-- ── Kolom arsip di KEDUA sisi ────────────────────────────────
--
-- Diarsipkan di dua tempat, bukan satu. `rfq_leads` adalah yang dibaca
-- panel admin; `rfqs` adalah yang dibaca statistik dan dashboard. Kalau
-- hanya satu yang ditandai, lead akan hilang dari daftar tapi TETAP
-- terhitung di angka — persis jenis ketidaksesuaian diam yang paling
-- sulit dilacak nanti.
ALTER TABLE public.rfq_leads
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_reason text;

ALTER TABLE public.rfqs
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_reason text;

-- Index parsial: hampir semua baris punya archived_at NULL, jadi index
-- penuh akan berisi hampir seluruh tabel demi menjawab pertanyaan yang
-- selalu "yang TIDAK diarsipkan".
CREATE INDEX IF NOT EXISTS rfq_leads_active_idx
  ON public.rfq_leads (created_at DESC) WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS rfqs_active_idx
  ON public.rfqs (created_at DESC) WHERE archived_at IS NULL;

COMMENT ON COLUMN public.rfq_leads.archived_at IS
  'CP1 ronde 4. NULL = aktif. Terisi = disembunyikan dari daftar DAN dari '
  'seluruh perhitungan statistik. Baris tetap utuh dan bisa dipulihkan.';

-- ── Arsipkan / pulihkan — satu tindakan, dua tabel ───────────
CREATE OR REPLACE FUNCTION public.archive_rfq_lead(
  p_lead_id uuid,
  p_reason  text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'hanya admin yang boleh mengarsipkan lead';
  END IF;

  UPDATE public.rfq_leads
     SET archived_at = now(), archived_reason = p_reason
   WHERE id = p_lead_id;

  -- Sisi CRM ikut, dicocokkan lewat legacy_lead_id.
  UPDATE public.rfqs
     SET archived_at = now(), archived_reason = p_reason
   WHERE legacy_lead_id = p_lead_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_rfq_lead(p_lead_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'hanya admin yang boleh memulihkan lead';
  END IF;

  UPDATE public.rfq_leads
     SET archived_at = NULL, archived_reason = NULL
   WHERE id = p_lead_id;

  UPDATE public.rfqs
     SET archived_at = NULL, archived_reason = NULL
   WHERE legacy_lead_id = p_lead_id;
END;
$$;

-- ── Penghapusan permanen ─────────────────────────────────────
--
-- Dua penjaga yang disengaja:
--
--   1. Menolak lead yang belum diarsipkan. Menghapus permanen karena itu
--      SELALU dua langkah dan dua keputusan, tidak pernah satu klik dari
--      daftar utama.
--   2. Menghapus seluruh rantai secara EKSPLISIT dalam satu transaksi.
--      Mengandalkan `ON DELETE SET NULL` di rfqs berarti meninggalkan
--      baris CRM hidup tanpa asal-usul (lihat catatan di atas), jadi
--      barisnya dihapus lebih dulu — dengan urutan yang benar, sehingga
--      rfq_items dan tasks ikut lewat CASCADE-nya sendiri.
CREATE OR REPLACE FUNCTION public.purge_archived_rfq_lead(p_lead_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_archived timestamptz;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'hanya admin yang boleh menghapus permanen';
  END IF;

  SELECT archived_at INTO v_archived
    FROM public.rfq_leads WHERE id = p_lead_id;

  IF v_archived IS NULL THEN
    RAISE EXCEPTION
      'lead ini belum diarsipkan; arsipkan dulu sebelum menghapus permanen';
  END IF;

  -- rfqs dihapus lebih dulu supaya tidak tertinggal dengan
  -- legacy_lead_id = NULL. rfq_items dan tasks ikut lewat CASCADE.
  DELETE FROM public.rfqs WHERE legacy_lead_id = p_lead_id;

  -- lead_status_history ikut lewat CASCADE-nya sendiri.
  DELETE FROM public.rfq_leads WHERE id = p_lead_id;

  -- companies/contacts SENGAJA TIDAK ikut dihapus. Satu perusahaan bisa
  -- punya beberapa RFQ; menghapusnya bersama satu lead akan membuang
  -- riwayat RFQ lain milik perusahaan yang sama. Perusahaan yang benar-
  -- benar tidak dipakai lagi dibereskan lewat halaman /admin/perusahaan,
  -- yang memang tempatnya.
END;
$$;

COMMENT ON FUNCTION public.purge_archived_rfq_lead(uuid) IS
  'Hapus permanen satu lead beserta rfqs/rfq_items/tasks/lead_status_history '
  'miliknya. MENOLAK lead yang belum diarsipkan. companies & contacts tidak '
  'ikut — keduanya bisa dipakai RFQ lain.';

REVOKE ALL ON FUNCTION public.archive_rfq_lead(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.restore_rfq_lead(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.purge_archived_rfq_lead(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.archive_rfq_lead(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.restore_rfq_lead(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.purge_archived_rfq_lead(uuid) TO authenticated, service_role;

-- ── Statistik hero berhenti menghitung yang diarsipkan ───────
--
-- Ini bagian yang paling mudah terlupa dan paling merusak kalau terlupa:
-- lead yang "sudah dibuang" tapi masih terhitung di angka publik membuat
-- angka itu tidak bisa dijelaskan oleh apa pun yang terlihat di panel.
--
-- Yang BERUBAH hanya penambahan `archived_at IS NULL`. Cara menghitungnya
-- tidak disentuh sama sekali.
CREATE OR REPLACE FUNCTION public.get_public_hero_stats()
RETURNS TABLE (
  active_products   INTEGER,
  deal_count        INTEGER,
  city_count        INTEGER,
  shipped_kg        NUMERIC,
  shipment_rows     INTEGER
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    (SELECT count(*)::int FROM public.products WHERE is_active),
    (SELECT count(*)::int FROM public.rfqs
      WHERE status = 'deal' AND archived_at IS NULL),
    (SELECT count(DISTINCT lower(btrim(delivery_city)))::int
       FROM public.rfqs
      WHERE status = 'deal' AND archived_at IS NULL
        AND btrim(coalesce(delivery_city,'')) <> ''),
    (SELECT coalesce(sum(qty_kg), 0) FROM public.shipments),
    (SELECT count(*)::int FROM public.shipments);
$$;

GRANT EXECUTE ON FUNCTION public.get_public_hero_stats() TO anon, authenticated;
