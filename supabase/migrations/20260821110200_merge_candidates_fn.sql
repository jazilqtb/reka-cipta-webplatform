-- CP1 ronde 3 — deteksi duplikat sebagai FUNGSI yang bisa dipanggil ulang.
--
-- Di migrasi sebelumnya deteksi dijalankan sekali sebagai INSERT biasa.
-- Itu hanya menutup data yang sudah ada. RFQ baru yang masuk besok tidak
-- akan pernah diperiksa. Fungsi ini dipanggil setiap kali RFQ publik masuk
-- dan bisa dipanggil manual dari panel admin.
--
-- ATURAN KERAS: fungsi ini HANYA MENGUSULKAN. Tidak ada jalur kode mana pun
-- yang menggabungkan perusahaan tanpa keputusan manusia. Menggabungkan dua
-- perusahaan yang sebenarnya berbeda jauh lebih mahal daripada membiarkan
-- dua entri yang sebenarnya sama: yang pertama mencampur riwayat pesanan
-- dua pelanggan dan baru ketahuan saat salah kirim; yang kedua hanya
-- membuat daftar sedikit lebih panjang.

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
        -- Sinyal TERKUAT: domain email kerja yang sama. Dua orang dengan
        -- alamat @perusahaan.co.id hampir pasti satu perusahaan.
        -- work_email_domain() sudah membuang penyedia gratis, jadi dua
        -- alamat @gmail.com TIDAK pernah sampai ke sini.
        WHEN a.email_domain IS NOT NULL AND a.email_domain = b.email_domain THEN 0.90
        -- Nama identik setelah normalisasi. Kuat, tapi di bawah domain:
        -- "PT Sejahtera" bisa benar-benar dua perusahaan berbeda.
        WHEN a.name_key = b.name_key THEN 0.85
        -- Salah ketik. Inilah kasus yang paling sering terjadi dan paling
        -- sering terlewat kalau pencocokan hanya persis-sama.
        WHEN similarity(a.name_key, b.name_key) >= 0.72
          THEN similarity(a.name_key, b.name_key)::NUMERIC(4,3)
        ELSE 0
      END AS score,
      CASE
        WHEN a.email_domain IS NOT NULL AND a.email_domain = b.email_domain
          THEN 'Domain email kerja sama: ' || a.email_domain
        WHEN a.name_key = b.name_key
          THEN 'Nama identik setelah normalisasi'
        ELSE 'Nama sangat mirip — kemungkinan salah ketik'
      END AS reason
  ) s
  WHERE s.score >= 0.72
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

COMMENT ON FUNCTION public.refresh_company_merge_candidates IS
  'Mengusulkan pasangan perusahaan yang mungkin duplikat. TIDAK PERNAH '
  'menggabungkan. Ambang 0,72 dipilih supaya salah ketik satu-dua huruf '
  'tertangkap tanpa memasangkan nama yang kebetulan mirip.';

-- Menggabungkan: memindahkan seluruh contact & rfq, lalu MENANDAI (bukan
-- menghapus) company yang dilebur. Snapshot disimpan supaya bisa dibatalkan.
CREATE OR REPLACE FUNCTION public.merge_companies(p_surviving UUID, p_merged UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_snapshot JSONB;
  v_merge_id UUID;
BEGIN
  IF p_surviving = p_merged THEN
    RAISE EXCEPTION 'Tidak bisa menggabungkan perusahaan dengan dirinya sendiri';
  END IF;
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang boleh menggabungkan perusahaan';
  END IF;

  -- Rekam keadaan SEBELUM apa pun dipindah. Inilah yang membuat
  -- pembatalan mungkin.
  SELECT jsonb_build_object(
    'merged_company', (SELECT to_jsonb(c) FROM public.companies c WHERE c.id = p_merged),
    'contact_ids',    COALESCE((SELECT jsonb_agg(ct.id) FROM public.contacts ct WHERE ct.company_id = p_merged), '[]'::jsonb),
    'rfq_ids',        COALESCE((SELECT jsonb_agg(r.id)  FROM public.rfqs r      WHERE r.company_id = p_merged), '[]'::jsonb)
  ) INTO v_snapshot;

  UPDATE public.contacts SET company_id = p_surviving WHERE company_id = p_merged;
  UPDATE public.rfqs     SET company_id = p_surviving WHERE company_id = p_merged;
  UPDATE public.companies SET merged_into_id = p_surviving WHERE id = p_merged;

  UPDATE public.company_merge_candidates
     SET status = 'merged', decided_at = NOW()
   WHERE (company_a_id = p_merged AND company_b_id = p_surviving)
      OR (company_a_id = p_surviving AND company_b_id = p_merged);

  INSERT INTO public.company_merges (surviving_id, merged_id, snapshot)
  VALUES (p_surviving, p_merged, v_snapshot)
  RETURNING id INTO v_merge_id;

  RETURN v_merge_id;
END;
$$;

-- Membatalkan penggabungan: kembalikan contact & rfq ke pemilik semula.
CREATE OR REPLACE FUNCTION public.undo_company_merge(p_merge_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.company_merges%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang boleh membatalkan penggabungan';
  END IF;
  SELECT * INTO v_row FROM public.company_merges WHERE id = p_merge_id AND undone_at IS NULL;
  IF NOT FOUND THEN RETURN FALSE; END IF;

  UPDATE public.contacts SET company_id = v_row.merged_id
   WHERE id IN (SELECT (jsonb_array_elements_text(v_row.snapshot->'contact_ids'))::uuid);
  UPDATE public.rfqs SET company_id = v_row.merged_id
   WHERE id IN (SELECT (jsonb_array_elements_text(v_row.snapshot->'rfq_ids'))::uuid);
  UPDATE public.companies SET merged_into_id = NULL WHERE id = v_row.merged_id;
  UPDATE public.company_merge_candidates
     SET status = 'pending', decided_at = NULL
   WHERE (company_a_id = v_row.merged_id AND company_b_id = v_row.surviving_id)
      OR (company_a_id = v_row.surviving_id AND company_b_id = v_row.merged_id);
  UPDATE public.company_merges SET undone_at = NOW() WHERE id = p_merge_id;
  RETURN TRUE;
END;
$$;
