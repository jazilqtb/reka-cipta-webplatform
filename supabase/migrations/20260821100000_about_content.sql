-- CP4 (2026-08-21) — konten halaman Tentang Kami yang bisa disunting admin.
--
-- KLASIFIKASI: ADDITIVE murni. Tiga tabel baru + satu bucket storage.
-- Nol kolom lama disentuh, nol query lama berubah.
--
-- Sumber sebelumnya adalah constants/company-profile.ts — berkas TypeScript.
-- Artinya mengubah satu tahun di timeline menuntut deploy ulang. Ketiga
-- tabel di bawah memindahkan kepemilikan konten dari developer ke admin.

-- ─────────────────────────────────────────────────────────────────────
-- 1. TIMELINE — "Perjalanan Kami"
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.about_timeline (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year        SMALLINT NOT NULL CHECK (year BETWEEN 1900 AND 2200),
    title       VARCHAR(120) NOT NULL CHECK (length(btrim(title)) > 0),
    description TEXT NOT NULL DEFAULT '',
    -- sort_order dipisah dari `year` supaya dua peristiwa di tahun yang
    -- sama tetap punya urutan yang pasti. Mengurutkan hanya dengan `year`
    -- membuat urutannya ditentukan planner — bisa berubah antar query.
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_about_timeline_order
    ON public.about_timeline(sort_order, year);

-- ─────────────────────────────────────────────────────────────────────
-- 2. MISI — poin misi, ditampilkan sebagai accordion
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.about_mission (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(160) NOT NULL CHECK (length(btrim(title)) > 0),
    description TEXT NOT NULL DEFAULT '',
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_about_mission_order ON public.about_mission(sort_order);

-- ─────────────────────────────────────────────────────────────────────
-- 3. TIM — anggota tim
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.about_team (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(120) NOT NULL CHECK (length(btrim(name)) > 0),
    position    VARCHAR(120) NOT NULL DEFAULT '',
    -- PATH relatif di bucket, bukan URL penuh — pola sama products.photo_path
    -- dan articles.thumbnail_path. URL penuh akan basi kalau domain storage
    -- berubah; path tidak.
    photo_path  TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_about_team_order ON public.about_team(sort_order);

-- ─────────────────────────────────────────────────────────────────────
-- 4. VISI — kalimat tunggal, ikut menumpang company_settings (key/value)
--    karena bentuknya memang satu string; tabel sendiri akan berlebihan.
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO public.company_settings (key, value)
VALUES ('about_vision',
        'Menjadi distributor garam terpercaya pilihan industri menengah Indonesia, yang dikenal karena konsistensi kualitas, transparansi dokumentasi, dan komitmen jangka panjang terhadap petani lokal.')
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────
-- RLS — publik BACA saja, tulis hanya admin dari allowlist.
-- Pola identik migrasi 20260815090100. Sesi ber-login saja TIDAK cukup:
-- signup publik di project ini masih aktif, jadi "authenticated" bukan
-- sinonim "admin".
-- ─────────────────────────────────────────────────────────────────────
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['about_timeline','about_mission','about_team'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Public can read %1$s" ON public.%1$I FOR SELECT TO anon, authenticated USING (TRUE)', t);
    EXECUTE format('CREATE POLICY "Admin can insert %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (public.is_admin())', t);
    EXECUTE format('CREATE POLICY "Admin can update %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())', t);
    EXECUTE format('CREATE POLICY "Admin can delete %1$s" ON public.%1$I FOR DELETE TO authenticated USING (public.is_admin())', t);
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- SEED — dari constants/company-profile.ts yang sedang tayang, supaya
-- halaman tidak pernah kosong sebelum admin menyentuhnya sekali pun.
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO public.about_timeline (year, title, description, sort_order) VALUES
 (2018, 'Studi Banding ke Sentra Garam Nasional', 'Tim melakukan survei langsung ke sentra produksi untuk memahami ekosistem petani garam lokal dan membuka jaringan kemitraan pertama.', 1)
ON CONFLICT DO NOTHING;

INSERT INTO public.about_timeline (year, title, description, sort_order) VALUES
 (2019, 'Pendirian UD Kreasi Anak Bangsa', 'Langkah awal memasuki industri distribusi garam dengan skala usaha dagang perorangan, membangun pengalaman operasional dan kepercayaan mitra pertama.', 2),
 (2020, 'Transformasi menjadi CV Reka Cipta Indonesia', 'Pendirian resmi badan hukum CV pada 17 November 2020, dengan legalitas penuh dari Kemenkumham. Tonggak komitmen jangka panjang dalam industri distribusi garam nasional.', 3)
ON CONFLICT DO NOTHING;

INSERT INTO public.about_mission (title, description, sort_order) VALUES
 ('Jaminan kualitas yang bisa diverifikasi', 'Menyediakan portofolio garam multi-produk yang terstandarisasi SNI, lengkap dengan dokumentasi hasil uji laboratorium yang dapat diakses oleh setiap mitra kapan saja.', 1),
 ('Kemitraan yang adil dengan petani', 'Membangun hubungan distribusi yang konsisten dan adil dengan petani garam lokal di sentra produksi nasional, sebagai bentuk komitmen terhadap keberlanjutan rantai pasok domestik.', 2),
 ('Respons yang tidak membuat menunggu', 'Merespons setiap kebutuhan mitra — dari pertanyaan awal hingga penawaran harga — dengan standar kecepatan dan transparansi tertinggi.', 3),
 ('Distribusi yang menjangkau', 'Membangun jaringan distribusi yang efisien untuk menjamin ketersediaan garam berkualitas di wilayah-wilayah yang dibutuhkan mitra, tidak hanya di Surabaya dan sekitarnya.', 4),
 ('Peningkatan standar yang berkelanjutan', 'Terus meningkatkan standar dokumentasi, sertifikasi, dan layanan seiring pertumbuhan perusahaan — karena standar hari ini adalah minimum masa depan.', 5)
ON CONFLICT DO NOTHING;

-- photo_path menyimpan path lama di /public apa adanya (diawali '/').
-- Pemetaan di lib/data/about.ts memperlakukan nilai yang diawali '/'
-- sebagai aset lokal dan sisanya sebagai path di bucket Supabase. Dengan
-- begitu foto tim yang SUDAH ADA tetap tampil tanpa perlu dipindahkan
-- manual lebih dulu, dan unggahan baru langsung masuk ke storage.
INSERT INTO public.about_team (name, position, photo_path, sort_order) VALUES
 ('Widril Fakki', 'Komisaris', '/images/team/widril-fakki.png', 1),
 ('Abdul Majid Abdillah', 'Direktur', '/images/team/abdul-majid.png', 2),
 ('Salman Al Halili', 'Manager Keuangan', '/images/team/salman-al-halili.png', 3),
 ('Irwan Sugianto', 'Manager Pemasaran', '/images/team/irwan-sugianto.png', 4)
ON CONFLICT DO NOTHING;
