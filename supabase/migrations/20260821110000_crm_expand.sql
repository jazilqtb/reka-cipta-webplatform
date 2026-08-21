-- CP1 ronde 3 — EXPAND: Company -> Contact -> RFQ sebagai entitas utama.
--
-- FASE: EXPAND. Murni ADDITIVE. Enam tabel baru + tiga fungsi. NOL kolom
-- lama disentuh, NOL baris lama diubah. `rfq_leads` tetap utuh dan tetap
-- bisa dibaca kode lama selama masa transisi.
--
-- MASALAH YANG DITUTUP: lead adalah entitas puncak. PT X mengirim RFQ tiga
-- kali menghasilkan tiga baris terpisah, bukan satu akun dengan tiga
-- transaksi. Akibatnya mustahil menjawab pertanyaan paling dasar seorang
-- distributor: "pelanggan mana yang paling sering memesan?"

-- ─────────────────────────────────────────────────────────────────────
-- FUNGSI NORMALISASI — dipakai untuk pencocokan, BUKAN untuk tampilan.
-- Nama asli selalu disimpan apa adanya di kolom `name`.
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.normalize_company_name(raw TEXT)
RETURNS TEXT
LANGUAGE sql IMMUTABLE
AS $$
  SELECT NULLIF(
    btrim(
      regexp_replace(
        regexp_replace(
          -- bentuk badan usaha dilepas: "PT Maju Jaya" dan "CV. Maju Jaya"
          -- harus bertemu di titik yang sama
          regexp_replace(lower(btrim(coalesce(raw, ''))),
            '(^|\s)(pt|cv|ud|pd|tbk|persero|perseroan|koperasi|kop|yayasan|fa)\.?(\s|$)',
            ' ', 'g'),
          '[^a-z0-9]+', ' ', 'g'),   -- tanda baca -> spasi
        '\s+', ' ', 'g')             -- rapatkan spasi
    ), '');
$$;

COMMENT ON FUNCTION public.normalize_company_name IS
  'Kunci pencocokan nama perusahaan. "PT. Maju Jaya", "pt maju jaya", dan '
  '"CV Maju Jaya" semuanya menjadi "maju jaya". TIDAK untuk ditampilkan.';

-- Nomor telepon Indonesia: 0812…, +62812…, 62812… harus bertemu.
CREATE OR REPLACE FUNCTION public.normalize_phone_id(raw TEXT)
RETURNS TEXT
LANGUAGE sql IMMUTABLE
AS $$
  SELECT NULLIF(
    regexp_replace(
      CASE
        WHEN regexp_replace(coalesce(raw,''), '\D', '', 'g') LIKE '62%'
          THEN '0' || substr(regexp_replace(coalesce(raw,''), '\D', '', 'g'), 3)
        ELSE regexp_replace(coalesce(raw,''), '\D', '', 'g')
      END,
    '\D', '', 'g'), '');
$$;

-- Domain email HANYA berguna sebagai sinyal identitas kalau BUKAN penyedia
-- gratis. Dua orang ber-@gmail.com tidak berarti satu perusahaan — dan data
-- yang ada sekarang justru penuh alamat gmail, jadi tanpa penjagaan ini
-- seluruh lead akan tergabung jadi satu "perusahaan gmail".
CREATE OR REPLACE FUNCTION public.work_email_domain(raw TEXT)
RETURNS TEXT
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN d IS NULL THEN NULL
    WHEN d IN ('gmail.com','yahoo.com','yahoo.co.id','hotmail.com','outlook.com',
               'outlook.co.id','icloud.com','proton.me','protonmail.com',
               'aol.com','mail.com','ymail.com','live.com','msn.com','gmx.com')
      THEN NULL
    ELSE d
  END
  FROM (SELECT lower(split_part(btrim(coalesce(raw,'')), '@', 2)) AS d) t
  WHERE d <> '';
$$;

-- ─────────────────────────────────────────────────────────────────────
-- COMPANIES
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.companies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL CHECK (length(btrim(name)) > 0),
    -- Kolom terhitung: tidak bisa melenceng dari `name`, dan tidak bisa
    -- diisi manual dengan nilai yang salah.
    name_key        TEXT GENERATED ALWAYS AS (public.normalize_company_name(name)) STORED,
    email_domain    TEXT,
    industry_type   VARCHAR(100),
    city            VARCHAR(100),
    -- Kalau company ini digabungkan ke company lain, kolom ini menunjuk ke
    -- yang bertahan. Barisnya TIDAK dihapus — itulah yang membuat
    -- penggabungan bisa dibatalkan.
    merged_into_id  UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_companies_name_key ON public.companies(name_key);
CREATE INDEX IF NOT EXISTS idx_companies_email_domain ON public.companies(email_domain)
    WHERE email_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_active ON public.companies(id)
    WHERE merged_into_id IS NULL;

-- ─────────────────────────────────────────────────────────────────────
-- CONTACTS
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contacts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id   UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    full_name    VARCHAR(255) NOT NULL,
    position     VARCHAR(100),
    email        VARCHAR(255),
    phone        VARCHAR(32),
    phone_key    TEXT GENERATED ALWAYS AS (public.normalize_phone_id(phone)) STORED,
    email_key    TEXT GENERATED ALWAYS AS (lower(btrim(email))) STORED,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON public.contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email_key ON public.contacts(email_key);
CREATE INDEX IF NOT EXISTS idx_contacts_phone_key ON public.contacts(phone_key);

-- ─────────────────────────────────────────────────────────────────────
-- RFQS — transaksi. Inilah yang dulu bernama "lead".
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rfqs (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id     UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    contact_id     UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    -- Jejak ke baris lama. Membuat migrasi idempoten (UNIQUE) sekaligus
    -- memungkinkan penelusuran balik selama fase transisi.
    legacy_lead_id UUID UNIQUE REFERENCES public.rfq_leads(id) ON DELETE SET NULL,

    status              VARCHAR(50) NOT NULL DEFAULT 'new',
    delivery_city       VARCHAR(100),
    delivery_frequency  VARCHAR(50),
    notes               TEXT,
    admin_notes         TEXT,

    -- Volume gabungan dari data LAMA. Baris lama hanya punya SATU angka
    -- volume untuk SEMUA jenis garam yang dicentang, jadi angka itu tidak
    -- bisa dibagi ke tiap jenis tanpa mengarang. Disimpan apa adanya di
    -- sini, dan rfq_items untuk baris lama sengaja tidak punya kuantitas.
    legacy_total_qty_kg NUMERIC(14,3),

    proposal_html         TEXT,
    proposal_generated    BOOLEAN NOT NULL DEFAULT FALSE,
    proposal_generated_at TIMESTAMPTZ,

    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT rfqs_status_check
      CHECK (status IN ('new','contacted','sample_sent','negotiation','deal','lost'))
);
CREATE INDEX IF NOT EXISTS idx_rfqs_company ON public.rfqs(company_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_status ON public.rfqs(status);
CREATE INDEX IF NOT EXISTS idx_rfqs_created ON public.rfqs(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────
-- RFQ_ITEMS — volume PER JENIS GARAM, dengan satuan (CP2 poin 1A/1B)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rfq_items (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id        UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
    product_slug  VARCHAR(120) NOT NULL,

    -- Angka & satuan SEPERTI YANG DIPILIH pengguna. Disimpan supaya
    -- tampilan bisa mengembalikan bentuk aslinya ("80 sak"), bukan hanya
    -- hasil konversinya.
    quantity      NUMERIC(14,3) CHECK (quantity IS NULL OR quantity > 0),
    unit          VARCHAR(20),

    -- SATUAN KANONIK. Tanpa ini agregasi di CP3 mustahil benar — sak tidak
    -- bisa dijumlahkan dengan ton. Dihitung saat tulis, bukan saat baca.
    quantity_kg   NUMERIC(14,3) CHECK (quantity_kg IS NULL OR quantity_kg > 0),

    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT rfq_items_unit_check
      CHECK (unit IS NULL OR unit IN ('kg','ton','sak_25','sak_50')),
    -- Kuantitas dan satuan harus datang berpasangan: satu tanpa yang lain
    -- adalah angka tanpa arti.
    CONSTRAINT rfq_items_qty_unit_together
      CHECK ((quantity IS NULL AND unit IS NULL) OR (quantity IS NOT NULL AND unit IS NOT NULL)),
    CONSTRAINT rfq_items_unique_product UNIQUE (rfq_id, product_slug)
);
CREATE INDEX IF NOT EXISTS idx_rfq_items_rfq ON public.rfq_items(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_items_product ON public.rfq_items(product_slug);

COMMENT ON COLUMN public.rfq_items.quantity_kg IS
  'Kilogram — satuan kanonik. kg x1, ton x1000, sak_25 x25, sak_50 x50. '
  'Kontainer SENGAJA tidak disediakan: bobotnya berubah menurut jenis garam '
  'dan cara muat, jadi memberinya angka tetap akan menghasilkan konversi '
  'yang terlihat pasti tapi salah.';

-- ─────────────────────────────────────────────────────────────────────
-- DUPLIKAT: kandidat + jejak penggabungan
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.company_merge_candidates (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_a_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    company_b_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    score         NUMERIC(4,3) NOT NULL,
    reason        TEXT NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    decided_at    TIMESTAMPTZ,
    CONSTRAINT cmc_status_check CHECK (status IN ('pending','merged','rejected')),
    CONSTRAINT cmc_not_self CHECK (company_a_id <> company_b_id),
    CONSTRAINT cmc_unique_pair UNIQUE (company_a_id, company_b_id)
);
CREATE INDEX IF NOT EXISTS idx_cmc_pending ON public.company_merge_candidates(status)
    WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS public.company_merges (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    surviving_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    merged_id     UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    -- Cukup untuk mengembalikan keadaan sebelum digabung: daftar rfq &
    -- contact yang dipindah, plus nilai kolom company yang tertimpa.
    snapshot      JSONB NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    undone_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_company_merges_surviving ON public.company_merges(surviving_id);

-- ─────────────────────────────────────────────────────────────────────
-- RLS — semuanya data internal. TIDAK ADA akses publik sama sekali.
-- Bedanya dengan tabel konten (about_*, hero_content) yang publik-baca:
-- ini daftar pelanggan.
-- ─────────────────────────────────────────────────────────────────────
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['companies','contacts','rfqs','rfq_items',
                           'company_merge_candidates','company_merges'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Admin can read %1$s" ON public.%1$I FOR SELECT TO authenticated USING (public.is_admin())', t);
    EXECUTE format('CREATE POLICY "Admin can insert %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (public.is_admin())', t);
    EXECUTE format('CREATE POLICY "Admin can update %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())', t);
    EXECUTE format('CREATE POLICY "Admin can delete %1$s" ON public.%1$I FOR DELETE TO authenticated USING (public.is_admin())', t);
  END LOOP;
END $$;

CREATE TRIGGER trigger_companies_set_updated_at BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_contacts_set_updated_at BEFORE UPDATE ON public.contacts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_rfqs_set_updated_at BEFORE UPDATE ON public.rfqs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
