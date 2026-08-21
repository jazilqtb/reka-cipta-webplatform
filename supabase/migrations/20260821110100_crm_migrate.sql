-- CP1 ronde 3 — MIGRATE: salin rfq_leads ke Company/Contact/RFQ.
--
-- FASE: MIGRATE. IDEMPOTEN — aman dijalankan berulang. Data lama di
-- `rfq_leads` TETAP UTUH; tidak satu baris pun diubah atau dihapus.
-- Penghubungnya `rfqs.legacy_lead_id` yang UNIQUE, jadi menjalankan ulang
-- tidak menggandakan apa pun.
--
-- KEPUTUSAN YANG PALING MENENTUKAN DI BERKAS INI — kenapa rfq_items hasil
-- migrasi TIDAK punya kuantitas:
-- Baris lama menyimpan SATU `volume_per_month` untuk SEMUA jenis garam yang
-- dicentang. Sebuah lead dengan 4 jenis dan volume 90 ton tidak berarti
-- 90 ton per jenis, dan juga tidak berarti 22,5 ton per jenis — informasi
-- itu tidak pernah dikumpulkan. Menyalin 90 ke tiap jenis akan melipatgandakan
-- total jadi 360 ton; membaginya rata akan mengarang angka yang tidak pernah
-- dikatakan siapa pun. Keduanya menghasilkan laporan yang terlihat pasti dan
-- salah. Jadi: totalnya disimpan di rfqs.legacy_total_qty_kg apa adanya, dan
-- item-nya hanya mencatat JENIS yang diminta tanpa angka.

-- 1) COMPANY — satu per name_key. Nama tampilan diambil dari kemunculan
--    PERTAMA (created_at paling awal) supaya deterministik.
INSERT INTO public.companies (name, email_domain, industry_type, city, created_at)
SELECT DISTINCT ON (public.normalize_company_name(l.company_name))
       l.company_name,
       public.work_email_domain(l.email),
       l.industry_type,
       l.delivery_city,
       l.created_at
FROM public.rfq_leads l
WHERE public.normalize_company_name(l.company_name) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.name_key = public.normalize_company_name(l.company_name)
  )
ORDER BY public.normalize_company_name(l.company_name), l.created_at ASC;

-- 2) CONTACT — satu per (company, email). Orang yang sama mengirim dua RFQ
--    tidak boleh jadi dua kontak.
INSERT INTO public.contacts (company_id, full_name, position, email, phone, created_at)
SELECT DISTINCT ON (c.id, lower(btrim(l.email)))
       c.id, l.full_name, l.position, l.email, l.whatsapp, l.created_at
FROM public.rfq_leads l
JOIN public.companies c
  ON c.name_key = public.normalize_company_name(l.company_name)
WHERE NOT EXISTS (
    SELECT 1 FROM public.contacts ct
    WHERE ct.company_id = c.id AND ct.email_key = lower(btrim(l.email))
  )
ORDER BY c.id, lower(btrim(l.email)), l.created_at ASC;

-- 3) RFQ — satu per baris lama. legacy_lead_id UNIQUE menjaga idempotensi.
INSERT INTO public.rfqs (
    company_id, contact_id, legacy_lead_id, status, delivery_city,
    delivery_frequency, notes, admin_notes, legacy_total_qty_kg,
    proposal_html, proposal_generated, proposal_generated_at, created_at, updated_at)
SELECT c.id,
       ct.id,
       l.id,
       l.status,
       l.delivery_city,
       l.delivery_frequency,
       l.notes,
       l.admin_notes,
       -- volume lama SELALU dalam ton (tidak ada satuan lain waktu itu)
       (l.volume_per_month * 1000)::NUMERIC(14,3),
       l.proposal_html,
       l.proposal_generated,
       l.proposal_generated_at,
       l.created_at,
       l.updated_at
FROM public.rfq_leads l
JOIN public.companies c
  ON c.name_key = public.normalize_company_name(l.company_name)
LEFT JOIN public.contacts ct
  ON ct.company_id = c.id AND ct.email_key = lower(btrim(l.email))
WHERE NOT EXISTS (SELECT 1 FROM public.rfqs r WHERE r.legacy_lead_id = l.id);

-- 4) RFQ_ITEMS — hanya JENIS, tanpa kuantitas. Lihat catatan di kepala berkas.
INSERT INTO public.rfq_items (rfq_id, product_slug)
SELECT r.id, s.slug
FROM public.rfqs r
JOIN public.rfq_leads l ON l.id = r.legacy_lead_id
CROSS JOIN LATERAL unnest(l.salt_types) AS s(slug)
WHERE NOT EXISTS (
  SELECT 1 FROM public.rfq_items i WHERE i.rfq_id = r.id AND i.product_slug = s.slug
);

-- 5) KANDIDAT DUPLIKAT — hanya MENGUSULKAN, tidak pernah menggabungkan.
--    Tiga sinyal, dengan bobot berbeda. Nama saja BUKAN sinyal kuat:
--    "PT Sejahtera" bisa jadi dua perusahaan yang benar-benar berbeda.
INSERT INTO public.company_merge_candidates (company_a_id, company_b_id, score, reason)
SELECT a.id, b.id, s.score, s.reason
FROM public.companies a
JOIN public.companies b ON a.id < b.id
CROSS JOIN LATERAL (
  SELECT
    CASE
      WHEN a.email_domain IS NOT NULL AND a.email_domain = b.email_domain THEN 0.90
      WHEN a.name_key = b.name_key THEN 0.85
      WHEN similarity(a.name_key, b.name_key) >= 0.72 THEN similarity(a.name_key, b.name_key)::NUMERIC(4,3)
      ELSE 0
    END AS score,
    CASE
      WHEN a.email_domain IS NOT NULL AND a.email_domain = b.email_domain
        THEN 'Domain email kerja sama: ' || a.email_domain
      WHEN a.name_key = b.name_key
        THEN 'Nama identik setelah normalisasi: ' || a.name_key
      ELSE 'Nama sangat mirip setelah normalisasi'
    END AS reason
) s
WHERE s.score >= 0.72
  AND a.merged_into_id IS NULL AND b.merged_into_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.company_merge_candidates x
    WHERE x.company_a_id = a.id AND x.company_b_id = b.id
  );
