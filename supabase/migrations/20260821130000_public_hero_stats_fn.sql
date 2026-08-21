-- CP3 ronde 3 — statistik hero yang benar-benar bisa dibaca publik.
--
-- BUG YANG DITUTUP, dan kenapa ia bertahan begitu lama:
-- `getHeroStats()` membaca `rfqs`/`rfq_leads` memakai anon key, sementara
-- RLS tabel itu hanya mengizinkan admin. PostgREST TIDAK mengembalikan
-- error untuk kasus ini — ia mengembalikan NOL BARIS. Jadi statistik
-- dinamis di beranda selalu bernilai 0 dan tampil sebagai
-- "baseline + 0" tanpa satu pun tanda bahwa ada yang salah.
--
-- Verifikasi CP1 saya sendiri lolos karena memakai service key, yang
-- melewati RLS. Itu pelajaran yang lebih luas: memverifikasi jalur publik
-- dengan kunci istimewa berarti tidak memverifikasi jalur publik.
--
-- SECURITY DEFINER dipakai supaya fungsi ini berjalan dengan hak pemilik
-- dan bisa menghitung tabel yang tertutup — TAPI ia hanya mengembalikan
-- ANGKA AGREGAT. Tidak ada nama perusahaan, kontak, atau nilai transaksi
-- yang bisa keluar lewat sini.

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
    (SELECT count(*)::int FROM public.rfqs WHERE status = 'deal'),
    (SELECT count(DISTINCT lower(btrim(delivery_city)))::int
       FROM public.rfqs
      WHERE status = 'deal' AND btrim(coalesce(delivery_city,'')) <> ''),
    (SELECT coalesce(sum(qty_kg), 0) FROM public.shipments),
    (SELECT count(*)::int FROM public.shipments);
$$;

COMMENT ON FUNCTION public.get_public_hero_stats IS
  'Agregat untuk statistik hero beranda. SECURITY DEFINER supaya bisa '
  'membaca tabel ber-RLS admin, tapi HANYA mengembalikan angka — tidak ada '
  'identitas pelanggan yang bisa bocor lewat fungsi ini. '
  '`shipment_rows` disertakan supaya pemanggil bisa membedakan '
  '"belum ada pengiriman" dari "totalnya nol".';

GRANT EXECUTE ON FUNCTION public.get_public_hero_stats() TO anon, authenticated;
