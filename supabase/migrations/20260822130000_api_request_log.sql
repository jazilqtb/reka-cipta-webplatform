-- 20260822130000_api_request_log.sql
-- CP0 ronde 4 — catatan permintaan/jawaban API yang bisa dibaca manusia.
--
-- KENAPA TABEL, BUKAN BERKAS
-- Backend berjalan di Railway. Berkas di dalam kontainernya hilang setiap
-- kali deploy, dan tidak ada yang bisa membacanya tanpa CLI. Yang diminta
-- adalah catatan yang BISA DIPANTAU Jazil — jadi ia harus berada di tempat
-- yang sudah bisa ia buka, yaitu panel admin.
--
-- KENAPA BUKAN LAYANAN OBSERVABILITY
-- Untuk 1-2 admin, satu tabel berbatas dan satu halaman tabel sudah menjawab
-- "apa yang terjadi tadi?". Memasang agregator log berarti menambah
-- ketergantungan, akun, biaya, dan satu tempat lagi yang harus dijaga
-- kredensialnya — semuanya untuk pertanyaan yang bisa dijawab satu SELECT.
--
-- SIFAT: ADDITIVE MURNI. Tidak ada objek lama yang diubah atau dihapus.

-- ── Tabel ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.api_request_log (
  id           bigserial PRIMARY KEY,
  occurred_at  timestamptz NOT NULL DEFAULT now(),
  method       text        NOT NULL,
  path         text        NOT NULL,
  status       integer     NOT NULL,
  duration_ms  integer     NOT NULL,

  -- Ringkasan sebab saat gagal, dalam kalimat. NULL kalau berhasil.
  -- Diisi dari `detail` HTTPException atau nama kelas exception —
  -- TIDAK PERNAH dari body permintaan.
  failure_reason text,

  -- Konteks non-pribadi secukupnya untuk mengenali kejadian, mis.
  -- {"company":"PT Uji Kirim","items":2}. Skema bebas dan SENGAJA kecil.
  -- Yang boleh masuk sini diatur di backend/core/request_log.py.
  context      jsonb,

  -- Alamat IP DIPOTONG ke blok /24 (mis. "182.253.45.0"). Cukup untuk
  -- membedakan "satu orang mencoba sepuluh kali" dari "sepuluh orang
  -- mencoba sekali", tanpa menyimpan alamat yang menunjuk satu perangkat.
  ip_prefix    text
);

-- Satu-satunya pola baca yang ada: "yang terbaru dulu".
CREATE INDEX IF NOT EXISTS api_request_log_occurred_at_idx
  ON public.api_request_log (occurred_at DESC);

-- Untuk chip filter "hanya yang gagal".
CREATE INDEX IF NOT EXISTS api_request_log_status_idx
  ON public.api_request_log (status)
  WHERE status >= 400;

COMMENT ON TABLE public.api_request_log IS
  'CP0 ronde 4. Catatan ringkas permintaan API. TIDAK PERNAH memuat token, '
  'header Authorization, isi .env, atau body mentah. Email & telepon pengirim '
  'RFQ tidak disalin ke sini sama sekali. Dipangkas otomatis — lihat '
  'public.prune_api_request_log().';

-- ── RLS: admin saja ──────────────────────────────────────────
-- Isi tabel ini menceritakan pola pemakaian sistem. Tidak ada satu pun
-- alasan pembaca publik perlu melihatnya.
ALTER TABLE public.api_request_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_api_request_log" ON public.api_request_log;
CREATE POLICY "admin_read_api_request_log"
  ON public.api_request_log
  FOR SELECT
  USING (public.is_admin());

-- Sengaja TIDAK ada policy INSERT/UPDATE/DELETE untuk peran mana pun.
-- Penulisnya adalah FastAPI dengan service-role key, yang mem-bypass RLS.
-- Artinya: log ini tidak bisa ditulis maupun dihapus dari browser siapa pun,
-- termasuk oleh admin — catatan yang bisa disunting pembacanya bukan catatan.

-- ── Retensi: dua batas, keduanya wajib ───────────────────────
--
-- Batas UMUR saja tidak cukup: satu ledakan lalu lintas dalam sehari bisa
-- menulis ratusan ribu baris yang semuanya masih "muda".
-- Batas JUMLAH saja juga tidak cukup: pada situs sesepi ini, 5.000 baris
-- bisa berarti catatan dari dua tahun lalu yang tidak berguna bagi siapa pun.
-- Jadi keduanya dipakai bersama.
CREATE OR REPLACE FUNCTION public.prune_api_request_log()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.api_request_log
  WHERE occurred_at < now() - interval '30 days';

  DELETE FROM public.api_request_log
  WHERE id NOT IN (
    SELECT id FROM public.api_request_log
    ORDER BY occurred_at DESC
    LIMIT 5000
  );
END;
$$;

COMMENT ON FUNCTION public.prune_api_request_log() IS
  'Batas ganda: 30 hari ATAU 5.000 baris terbaru, mana pun yang lebih ketat.';

-- Pemangkasan dijalankan dari trigger, bukan dari cron — proyek ini
-- sengaja tidak punya penjadwal (lihat DESIGN-SYSTEM.md §4.12), dan
-- menambahkannya hanya demi membuang baris log akan menjadi
-- ketergantungan baru yang tidak sebanding.
--
-- `random() < 0.02` berarti kira-kira sekali tiap 50 penulisan. Pada situs
-- ini itu jarang sekali, dan biayanya hanya dibayar oleh satu permintaan
-- yang KEBETULAN terpilih — dan permintaan itu pun sudah berada di
-- BackgroundTask, di luar jalur jawaban ke pengguna.
CREATE OR REPLACE FUNCTION public.api_request_log_prune_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF random() < 0.02 THEN
    PERFORM public.prune_api_request_log();
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS api_request_log_prune ON public.api_request_log;
CREATE TRIGGER api_request_log_prune
  AFTER INSERT ON public.api_request_log
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.api_request_log_prune_trigger();

REVOKE ALL ON FUNCTION public.prune_api_request_log() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.prune_api_request_log() TO service_role;
