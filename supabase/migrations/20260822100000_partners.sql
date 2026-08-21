-- CP5 ronde 3 — daftar mitra distribusi yang bisa dikelola admin.
--
-- KLASIFIKASI: ADDITIVE. Satu tabel + satu bucket logo.
--
-- Sumber sebelumnya `constants/clients.ts` — berkas TypeScript, jadi
-- menambah satu mitra menuntut deploy ulang. Pola yang sama dengan
-- about_* di CP4: berkas TS-nya tidak dihapus, ia menjadi cadangan.

CREATE TABLE IF NOT EXISTS public.partners (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL CHECK (length(btrim(name)) > 0),
    industry    VARCHAR(160),
    -- Path relatif di bucket, ATAU path /public yang diawali '/'.
    -- Pola dua-bentuk yang sama dengan about_team.photo_path, supaya logo
    -- yang sudah ada di /public tetap tampil tanpa dipindah manual.
    logo_path   TEXT,
    status      VARCHAR(20) NOT NULL DEFAULT 'active',
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT partners_status_check CHECK (status IN ('active','hidden'))
);
CREATE INDEX IF NOT EXISTS idx_partners_order ON public.partners(sort_order)
    WHERE status = 'active';

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
-- Publik BACA: marquee mitra tampil di beranda anonim.
CREATE POLICY "Public can read partners" ON public.partners
    FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "Admin can insert partners" ON public.partners
    FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin can update partners" ON public.partners
    FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin can delete partners" ON public.partners
    FOR DELETE TO authenticated USING (public.is_admin());

CREATE TRIGGER trigger_partners_set_updated_at BEFORE UPDATE ON public.partners
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Seed dari constants/clients.ts yang sedang tayang.
INSERT INTO public.partners (name, industry, sort_order) VALUES
 ('PT. Surabaya Mekabox',        'Industri Pengemasan',        1),
 ('PT. Sejati Tritunggal Indah', 'Water Treatment',            2),
 ('PT. Cakrawala Cemerlang Box', 'Industri Pengemasan',        3),
 ('Unit Pengolahan Garam KKP',   'Pengolahan Garam',           4),
 ('Perusahaan Pengolah Limbah',  'Water Treatment / Limbah',   5)
ON CONFLICT DO NOTHING;
