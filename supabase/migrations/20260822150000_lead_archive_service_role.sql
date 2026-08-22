-- 20260822150000_lead_archive_service_role.sql
-- CP1 ronde 4 — perbaikan penjaga pada tiga fungsi arsip lead.
--
-- ═══ CACAT YANG DITUTUP (ditemukan saat menguji, bukan saat menulis) ═══
--
-- Migrasi 20260822140000 menjaga ketiga fungsi dengan `IF NOT
-- public.is_admin() THEN RAISE`. Terlihat benar, dan salah:
--
--   is_admin()  =  EXISTS(SELECT 1 FROM admin_users WHERE user_id = auth.uid())
--
-- `auth.uid()` membaca klaim `sub` dari JWT permintaan. Koneksi
-- service-role TIDAK punya klaim itu — nilainya NULL — jadi `is_admin()`
-- selalu FALSE di sana. Dan satu-satunya pemanggil ketiga fungsi ini
-- adalah FastAPI, yang memang memakai service-role key (lihat
-- backend/core/supabase.py).
--
-- Akibatnya penjaga itu tidak menyaring penyalahguna; ia menyaring
-- SATU-SATUNYA pemanggil yang sah. Setiap upaya menyembunyikan lead
-- ditolak dengan "hanya admin yang boleh mengarsipkan lead".
--
-- Terlihat karena jalur kegagalannya sekarang terlihat (CP0): tombol
-- ditekan → "Gagal menyembunyikan lead." Kalau CP0 belum dikerjakan,
-- cacat ini akan tampil sebagai tombol yang diam — persis pola yang baru
-- saja dihabiskan satu checkpoint untuk dihapus.
--
-- ═══ KENAPA MENGIZINKAN service_role TIDAK MELONGGARKAN APA PUN ═══
--
-- Penjaga di dalam fungsi ini melindungi jalur LANGSUNG: sesi peramban
-- yang memanggil RPC-nya sendiri lewat PostgREST. Jalur itu tetap dijaga
-- persis seperti semula.
--
-- Jalur FastAPI dijaga di lapisan lain yang memang tempatnya:
-- `Depends(require_admin)` memverifikasi JWT dan keanggotaan allowlist
-- sebelum permintaan mencapai fungsi ini. Dan service-role key adalah
-- rahasia yang hanya ada di server — siapa pun yang memilikinya sudah
-- bisa menulis langsung ke tabelnya tanpa lewat fungsi ini sama sekali.
--
-- Jadi yang ditambahkan bukan pintu baru, melainkan pengakuan atas pintu
-- yang memang sudah ada dan sudah dijaga di depannya.

CREATE OR REPLACE FUNCTION public.is_admin_or_service()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.is_admin() OR coalesce(auth.role(), '') = 'service_role';
$$;

COMMENT ON FUNCTION public.is_admin_or_service() IS
  'TRUE untuk sesi admin (auth.uid() ada di admin_users) ATAU koneksi '
  'service-role. Dipakai HANYA oleh fungsi yang dipanggil dari FastAPI; '
  'JANGAN dipakai sebagai predikat RLS — di sana service_role sudah '
  'mem-bypass RLS dan memakainya hanya akan mengaburkan maksudnya.';

REVOKE ALL ON FUNCTION public.is_admin_or_service() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_or_service() TO authenticated, service_role;

-- ── Ketiga fungsi ditulis ulang dengan penjaga yang benar ────

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
  IF NOT public.is_admin_or_service() THEN
    RAISE EXCEPTION 'hanya admin yang boleh mengarsipkan lead';
  END IF;

  UPDATE public.rfq_leads
     SET archived_at = now(), archived_reason = p_reason
   WHERE id = p_lead_id;

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
  IF NOT public.is_admin_or_service() THEN
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

CREATE OR REPLACE FUNCTION public.purge_archived_rfq_lead(p_lead_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_archived timestamptz;
  v_found    boolean;
BEGIN
  IF NOT public.is_admin_or_service() THEN
    RAISE EXCEPTION 'hanya admin yang boleh menghapus permanen';
  END IF;

  SELECT archived_at, TRUE INTO v_archived, v_found
    FROM public.rfq_leads WHERE id = p_lead_id;

  -- Dibedakan dari "belum diarsipkan": lead yang sudah tidak ada bukan
  -- kesalahan urutan, dan pesan yang menyuruh "arsipkan dulu" untuk
  -- sesuatu yang sudah hilang hanya menyesatkan.
  IF NOT coalesce(v_found, FALSE) THEN
    RAISE EXCEPTION 'lead tidak ditemukan';
  END IF;

  IF v_archived IS NULL THEN
    RAISE EXCEPTION
      'lead ini belum diarsipkan; arsipkan dulu sebelum menghapus permanen';
  END IF;

  DELETE FROM public.rfqs WHERE legacy_lead_id = p_lead_id;
  DELETE FROM public.rfq_leads WHERE id = p_lead_id;
END;
$$;

REVOKE ALL ON FUNCTION public.archive_rfq_lead(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.restore_rfq_lead(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.purge_archived_rfq_lead(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.archive_rfq_lead(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.restore_rfq_lead(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.purge_archived_rfq_lead(uuid) TO authenticated, service_role;
