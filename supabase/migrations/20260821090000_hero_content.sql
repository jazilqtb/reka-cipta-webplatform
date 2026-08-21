-- CP3 (2026-08-21) — konten hero yang bisa disunting admin.
--
-- KLASIFIKASI: ADDITIVE murni. Satu tabel baru, nol kolom lama disentuh,
-- nol query lama berubah. Reversible dengan DROP TABLE.
--
-- KENAPA TABEL SENDIRI, BUKAN company_settings.
-- company_settings adalah key/value TEXT. Menaruh struktur bersarang di
-- sana berarti menyimpan JSON sebagai string, dan Postgres tidak bisa
-- memvalidasi apa pun tentang isinya — bentuk yang rusak baru ketahuan
-- saat halaman publik gagal render. Kolom JSONB + CHECK membuat bentuk
-- yang salah ditolak di pintu masuk.
--
-- KENAPA SATU BARIS DIPAKSA.
-- Hero cuma ada satu. Tanpa paksaan, baris kedua yang tidak sengaja masuk
-- akan membuat halaman menampilkan hero mana pun yang kebetulan lebih
-- dulu terbaca — bug yang sulit dilacak karena tidak ada yang error.

CREATE TABLE IF NOT EXISTS public.hero_content (
    -- singleton_guard memaksa maksimal satu baris: kolomnya hanya boleh
    -- bernilai TRUE dan UNIQUE, jadi INSERT kedua ditolak database.
    singleton_guard  BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton_guard),

    -- Bentuk: [{ "text": "...", "style": "plain|bold|italic|primary" }, ...]
    -- Teks pengguna TIDAK PERNAH ditafsirkan sebagai markup di sisi render;
    -- `style` hanya memilih kelas dari daftar tetap. Jadi tidak ada jalur
    -- HTML-injection sama sekali, bukan sekadar "disanitasi".
    headline_parts     JSONB NOT NULL DEFAULT '[]'::jsonb,
    subheadline_parts  JSONB NOT NULL DEFAULT '[]'::jsonb,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    CONSTRAINT hero_headline_is_array    CHECK (jsonb_typeof(headline_parts) = 'array'),
    CONSTRAINT hero_subheadline_is_array CHECK (jsonb_typeof(subheadline_parts) = 'array'),
    -- Batas panjang ditegakkan di DATABASE, bukan hanya di form. Form bisa
    -- dilewati; tabel tidak. Anti-pattern #11 ("subtitle maksimal satu
    -- kalimat") jadi aturan yang benar-benar mengikat.
    CONSTRAINT hero_headline_len    CHECK (length(headline_parts::text) <= 2000),
    CONSTRAINT hero_subheadline_len CHECK (length(subheadline_parts::text) <= 1200)
);

COMMENT ON TABLE public.hero_content IS
    'Headline & sub-headline hero beranda, tersimpan sebagai deret span '
    'berlabel gaya. Maksimal satu baris (singleton_guard).';
COMMENT ON COLUMN public.hero_content.headline_parts IS
    'Array {text, style}. style hanya boleh: plain | bold | italic | primary. '
    'Nilai di luar itu diabaikan oleh renderer dan jatuh ke plain.';

ALTER TABLE public.hero_content ENABLE ROW LEVEL SECURITY;

-- Publik BOLEH membaca: hero tampil di halaman anonim.
CREATE POLICY "Public can read hero content"
    ON public.hero_content FOR SELECT TO anon, authenticated USING (TRUE);

-- Menulis HANYA admin dari allowlist (public.is_admin), pola sama dengan
-- migrasi 20260815090100. Sesi ber-login saja TIDAK cukup.
CREATE POLICY "Admin can insert hero content"
    ON public.hero_content FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin can update hero content"
    ON public.hero_content FOR UPDATE TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Baris awal diisi dari teks hero yang sedang tayang, supaya halaman tidak
-- pernah kosong sebelum admin menyentuhnya sekali pun.
INSERT INTO public.hero_content (singleton_guard, headline_parts, subheadline_parts)
VALUES (
    TRUE,
    '[{"text":"Garam industri bermutu ","style":"plain"},
      {"text":"konsisten","style":"primary"},
      {"text":", dari tambak petani ke lini produksi Anda.","style":"plain"}]'::jsonb,
    '[{"text":"Hasil uji laboratorium dan legalitas tiap produk terbuka untuk diperiksa, sebelum Anda memesan.","style":"plain"}]'::jsonb
)
ON CONFLICT (singleton_guard) DO NOTHING;
