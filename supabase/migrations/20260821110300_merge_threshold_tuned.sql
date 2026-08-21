-- CP1 ronde 3 — ambang deteksi duplikat disetel ulang dari PENGUKURAN.
--
-- Ambang 0,72 di migrasi sebelumnya adalah tebakan, dan tebakan itu SALAH:
-- ia melewatkan justru kasus yang paling sering terjadi. Diukur dengan
-- definisi trigram yang sama dengan pg_trgm:
--
--   mitracomm ekasarana  vs mitracom ekasarana   0,857  salah ketik
--   airlangga university vs airlangga universitas 0,792  varian
--   maju jaya            vs maju jayaa            0,750  salah ketik
--   sumber rezeki        vs sumber rejeki         0,647  salah ketik  <- LEWAT
--   maju jaya            vs maju jya              0,583  salah ketik  <- LEWAT
--   maju jaya            vs maju sentosa          0,278  BEDA
--   maju jaya            vs sumber rezeki         0,000  BEDA
--
-- Jurang antara "salah ketik" (0,58-0,86) dan "benar-benar beda" (<=0,28)
-- lebar sekali, jadi ambang bisa turun ke 0,50 tanpa mendekati kelompok
-- kedua.
--
-- ASIMETRI BIAYA yang membenarkan penurunan ini: fungsi ini hanya
-- MENGUSULKAN. Usulan yang salah memakan beberapa detik admin untuk
-- ditolak. Duplikat yang TIDAK pernah diusulkan akan hidup selamanya
-- sebagai dua pelanggan yang riwayat pesanannya terbelah — dan itu persis
-- masalah yang membuat model data ini dirombak.

CREATE OR REPLACE FUNCTION public.refresh_company_merge_candidates()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted INTEGER;
BEGIN
  INSERT INTO public.company_merge_candidates (company_a_id, company_b_id, score, reason)
  SELECT a.id, b.id, s.score, s.reason
  FROM public.companies a
  JOIN public.companies b ON a.id < b.id
  CROSS JOIN LATERAL (
    SELECT
      CASE
        -- 1. Domain email kerja sama — sinyal terkuat. Penyedia gratis
        --    sudah disaring work_email_domain(), jadi dua @gmail.com tidak
        --    pernah sampai ke sini.
        WHEN a.email_domain IS NOT NULL AND a.email_domain = b.email_domain THEN 0.95

        -- 2. Nama identik setelah normalisasi.
        WHEN a.name_key = b.name_key THEN 0.85

        -- 3. Nomor telepon sama DAN nama masih berkerabat. Telepon saja
        --    sengaja TIDAK cukup: satu broker bisa mewakili beberapa
        --    perusahaan, dan data uji yang ada sekarang membuktikan
        --    bahayanya — tiga lead berbeda memakai satu nomor.
        WHEN EXISTS (
               SELECT 1 FROM public.contacts ca
               JOIN public.contacts cb ON cb.phone_key = ca.phone_key
               WHERE ca.company_id = a.id AND cb.company_id = b.id
                 AND ca.phone_key IS NOT NULL)
             AND similarity(a.name_key, b.name_key) >= 0.30
          THEN 0.80

        -- 4. Salah ketik pada nama.
        WHEN similarity(a.name_key, b.name_key) >= 0.50
          THEN similarity(a.name_key, b.name_key)::NUMERIC(4,3)
        ELSE 0
      END AS score,
      CASE
        WHEN a.email_domain IS NOT NULL AND a.email_domain = b.email_domain
          THEN 'Domain email kerja sama: ' || a.email_domain
        WHEN a.name_key = b.name_key
          THEN 'Nama identik setelah normalisasi'
        WHEN EXISTS (
               SELECT 1 FROM public.contacts ca
               JOIN public.contacts cb ON cb.phone_key = ca.phone_key
               WHERE ca.company_id = a.id AND cb.company_id = b.id
                 AND ca.phone_key IS NOT NULL)
             AND similarity(a.name_key, b.name_key) >= 0.30
          THEN 'Nomor telepon sama dan nama berkerabat'
        ELSE 'Nama sangat mirip — kemungkinan salah ketik'
      END AS reason
  ) s
  WHERE s.score >= 0.50
    AND a.merged_into_id IS NULL
    AND b.merged_into_id IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.company_merge_candidates x
      WHERE x.company_a_id = a.id AND x.company_b_id = b.id
    );
  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted;
END;
$$;
