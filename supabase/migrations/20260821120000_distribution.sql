-- CP3 ronde 3 — model distribusi: JANJI vs REALISASI.
--
-- KLASIFIKASI: ADDITIVE murni. Dua tabel baru, nol kolom lama disentuh.
--
-- MASALAH YANG DITUTUP, dan kenapa chart tidak akan menyelesaikannya:
-- sistem hari ini tidak menyimpan realisasi distribusi SAMA SEKALI.
-- Satu-satunya angka volume yang ada adalah `volume yang DIMINTA per RFQ` —
-- itulah sebabnya "Ton Distribusi" di beranda tidak pernah punya sumber dan
-- harus dinyatakan "belum ada sumber". Yang kurang bukan visualisasinya,
-- melainkan ENTITASNYA. Dua tabel di bawah adalah entitas itu.
--
-- YANG SENGAJA TIDAK DIBANGUN, dan alasannya:
--   · Stok / inventaris / gudang. Jazil distributor, bukan pabrik, dan
--     tidak ada satu pun sinyal di data bahwa stok fisik dikelola sendiri.
--     Membangun manajemen gudang berarti menuntut admin memelihara angka
--     yang tidak pernah mereka hitung — dan angka yang tidak dipelihara
--     akan salah dalam sebulan, lalu dipercaya selama setahun.
--   · Purchase order, invoice, jurnal. Itu wilayah ERP dan tidak diminta.
--   · Harga. Tidak ada harga di mana pun di sistem ini sekarang; menambah
--     kolom harga tanpa alur yang memakainya hanya menciptakan kolom kosong.

-- ─────────────────────────────────────────────────────────────────────
-- 1. SUPPLY_COMMITMENTS — apa yang sudah DIJANJIKAN ke mitra.
--
--    Berulang menurut periode, bukan sekali kirim. Inilah yang membedakan
--    "kesepakatan pasokan" dari "satu pesanan": mitra yang deal biasanya
--    minta jumlah tertentu SETIAP bulan, dan yang perlu dipantau adalah
--    apakah tiap periode benar-benar terpenuhi.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.supply_commitments (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    product_slug  VARCHAR(120) NOT NULL,

    -- Selalu kilogram. Satuan asli yang dipilih admin disimpan di sebelahnya
    -- supaya tampilan bisa mengembalikan bentuknya, persis pola rfq_items.
    qty_kg        NUMERIC(14,3) NOT NULL CHECK (qty_kg > 0),
    qty_original  NUMERIC(14,3),
    unit_original VARCHAR(20),

    period        VARCHAR(20) NOT NULL DEFAULT 'monthly',
    starts_on     DATE NOT NULL DEFAULT CURRENT_DATE,
    ends_on       DATE,
    status        VARCHAR(20) NOT NULL DEFAULT 'active',

    -- Dari mana angka ini berasal. Dipakai UI untuk membedakan mana yang
    -- lahir dari data nyata dan mana yang diketik admin — aturan kejujuran
    -- data yang sudah berlaku sejak ronde lalu.
    source        VARCHAR(20) NOT NULL DEFAULT 'manual',
    rfq_id        UUID REFERENCES public.rfqs(id) ON DELETE SET NULL,

    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT sc_period_check CHECK (period IN ('weekly','biweekly','monthly')),
    CONSTRAINT sc_status_check CHECK (status IN ('active','paused','ended')),
    CONSTRAINT sc_source_check CHECK (source IN ('rfq','manual')),
    CONSTRAINT sc_dates_ordered CHECK (ends_on IS NULL OR ends_on >= starts_on)
);
CREATE INDEX IF NOT EXISTS idx_sc_company ON public.supply_commitments(company_id);
CREATE INDEX IF NOT EXISTS idx_sc_active ON public.supply_commitments(status, starts_on);
CREATE INDEX IF NOT EXISTS idx_sc_product ON public.supply_commitments(product_slug);

-- ─────────────────────────────────────────────────────────────────────
-- 2. SHIPMENTS — apa yang benar-benar DIKIRIM, bertanggal.
--
--    Inilah satu-satunya sumber yang sah untuk "Ton Distribusi". Sebelum
--    tabel ini ada, angka itu memang tidak punya sumber — dan panel admin
--    menyatakannya apa adanya alih-alih menampilkan 0.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shipments (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    product_slug  VARCHAR(120) NOT NULL,
    shipped_on    DATE NOT NULL DEFAULT CURRENT_DATE,

    qty_kg        NUMERIC(14,3) NOT NULL CHECK (qty_kg > 0),
    qty_original  NUMERIC(14,3),
    unit_original VARCHAR(20),

    -- Dari supplier mana. Nullable dengan sengaja: pengiriman awal sering
    -- dicatat belakangan tanpa ingat sumbernya, dan memaksa kolom ini
    -- terisi akan membuat admin mengarang atau tidak mencatat sama sekali.
    supplier_id   UUID REFERENCES public.supplier_registrations(id) ON DELETE SET NULL,
    -- Terhubung ke komitmen mana. Nullable: ada pengiriman di luar
    -- kesepakatan berulang (pesanan sekali jalan, penggantian).
    commitment_id UUID REFERENCES public.supply_commitments(id) ON DELETE SET NULL,

    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shipments_company ON public.shipments(company_id);
CREATE INDEX IF NOT EXISTS idx_shipments_date ON public.shipments(shipped_on DESC);
CREATE INDEX IF NOT EXISTS idx_shipments_product ON public.shipments(product_slug);
CREATE INDEX IF NOT EXISTS idx_shipments_supplier ON public.shipments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_shipments_commitment ON public.shipments(commitment_id);

COMMENT ON TABLE public.shipments IS
  'Pengiriman yang BENAR-BENAR terjadi. Satu-satunya sumber sah untuk '
  'angka realisasi distribusi.';

-- RLS: data internal, tidak ada akses publik.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['supply_commitments','shipments'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Admin can read %1$s" ON public.%1$I FOR SELECT TO authenticated USING (public.is_admin())', t);
    EXECUTE format('CREATE POLICY "Admin can insert %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (public.is_admin())', t);
    EXECUTE format('CREATE POLICY "Admin can update %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())', t);
    EXECUTE format('CREATE POLICY "Admin can delete %1$s" ON public.%1$I FOR DELETE TO authenticated USING (public.is_admin())', t);
  END LOOP;
END $$;

CREATE TRIGGER trigger_sc_set_updated_at BEFORE UPDATE ON public.supply_commitments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_shipments_set_updated_at BEFORE UPDATE ON public.shipments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
