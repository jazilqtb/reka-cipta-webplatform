-- Create supplier_registrations table
-- Epic 5 Customer-Facing (E5-CF-DB-01) — pendaftaran dari form /jadi-supplier.
CREATE TABLE IF NOT EXISTS public.supplier_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name VARCHAR(255) NOT NULL,
    location_city VARCHAR(100) NOT NULL,
    location_province VARCHAR(100) NOT NULL,
    salt_types_available TEXT[] NOT NULL,
    capacity_per_month DECIMAL(10, 2) NOT NULL CHECK (capacity_per_month > 0),
    capacity_unit VARCHAR(20) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    additional_notes TEXT,
    admin_notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'new',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT supplier_status_check
        CHECK (status IN ('new', 'verified', 'active', 'inactive')),
    CONSTRAINT supplier_capacity_unit_check
        CHECK (capacity_unit IN ('ton', 'kwintal', 'kg')),
    CONSTRAINT supplier_salt_types_nonempty
        -- cardinality() dipakai bukan array_length(arr, 1) — array_length
        -- return NULL (bukan 0) untuk array kosong, dan CHECK constraint
        -- treat NULL sebagai PASSING, jadi array_length akan silently
        -- terima array kosong. Lihat migration
        -- 20260712022534_fix_supplier_salt_types_check.sql untuk history.
        CHECK (cardinality(salt_types_available) >= 1)
);

-- Indexes for common queries
CREATE INDEX idx_supplier_registrations_status ON public.supplier_registrations(status);
CREATE INDEX idx_supplier_registrations_created_at ON public.supplier_registrations(created_at DESC);
CREATE INDEX idx_supplier_registrations_province ON public.supplier_registrations(location_province);

-- Trigger auto-update updated_at (reuse function dari migration company_settings —
-- fungsi bernama handle_updated_at() di repo ini, BUKAN set_updated_at())
CREATE TRIGGER trigger_supplier_registrations_set_updated_at
    BEFORE UPDATE ON public.supplier_registrations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Comment untuk dokumentasi
COMMENT ON TABLE public.supplier_registrations IS 'Pendaftaran dari form Jadi Supplier (/jadi-supplier) — Epic 5 Customer-Facing';
COMMENT ON COLUMN public.supplier_registrations.salt_types_available IS 'Array kode jenis garam yang tersedia dari supplier (mis. ["kasar_petani", "halus_yodium"]) — enum tetap, lihat backend/schemas/supplier.py';
COMMENT ON COLUMN public.supplier_registrations.email IS 'Opsional — supplier bisa daftar tanpa email, WhatsApp adalah kontak utama';
COMMENT ON COLUMN public.supplier_registrations.admin_notes IS 'Catatan internal admin — belum dipakai di slice customer-facing, di-include untuk schema stability menjelang Epic 5 Admin Panel';
