-- Idempotent seed: kalau slug sudah ada, skip
-- photo_path / lab_doc_path adalah PATH RELATIF di bucket (bukan URL absolut) —
-- tidak ada project ref yang perlu diganti manual di sini. Full public URL
-- dikonstruksi di application layer dari env var SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL
-- (lihat lib/storage.ts dan backend/core/storage.py). Ref: ARCHITECTURE.md §12.4.
INSERT INTO public.products (
    name, slug, code, tagline, description, specs, industries,
    category, is_sni, sort_order, photo_path, lab_doc_path
) VALUES
(
    'Garam Halus Yodium',
    'garam-halus-yodium',
    'PRO YD',
    'Garam halus beryodium untuk industri makanan dan konsumsi rumah tangga.',
    'Garam halus PRO YD adalah produk unggulan CV Reka Cipta Indonesia yang diperkaya kalium iodat (KIO3) sesuai standar SNI 3556:2016. Cocok untuk industri makanan olahan, farmasi, dan konsumsi rumah tangga.',
    '{
        "nacl_pct": 97.5,
        "water_pct": 0.5,
        "kio3_ppm": 30,
        "insoluble_impurities_pct": 0.1,
        "color": "Putih bersih",
        "smell": "Tidak berbau",
        "mesh_size": "60-80"
    }'::jsonb,
    ARRAY['Makanan & Minuman', 'Farmasi', 'Rumah Tangga'],
    'halus',
    TRUE,
    1,
    'pro-yd.jpg',
    'lab-pro-yd.pdf'
),
(
    'Garam Halus Non-Yodium',
    'garam-halus-non-yodium',
    'PRO L',
    'Garam halus murni tanpa yodium untuk aplikasi industri spesifik.',
    'PRO L adalah garam halus tanpa yodium, ideal untuk industri yang membutuhkan sodium klorida murni tanpa fortifikasi tambahan seperti industri kimia, tekstil, dan penyamakan kulit.',
    '{
        "nacl_pct": 98.5,
        "water_pct": 0.3,
        "insoluble_impurities_pct": 0.08,
        "color": "Putih bersih",
        "smell": "Tidak berbau",
        "mesh_size": "60-80"
    }'::jsonb,
    ARRAY['Kimia', 'Tekstil', 'Penyamakan Kulit'],
    'halus',
    TRUE,
    2,
    'pro-l.jpg',
    'lab-pro-l.pdf'
),
(
    'Garam Kasar Industri',
    'garam-kasar-industri',
    'SPO/M',
    'Garam kasar berkualitas tinggi untuk proses industri berskala besar.',
    'SPO/M adalah garam kasar dengan tingkat kemurnian tinggi, dirancang untuk aplikasi industri berskala besar seperti pengolahan ikan, industri kimia, dan water softening.',
    '{
        "nacl_pct": 96.0,
        "water_pct": 3.0,
        "insoluble_impurities_pct": 0.5,
        "color": "Putih keabuan",
        "grain_size_mm": "2-5"
    }'::jsonb,
    ARRAY['Pengolahan Ikan', 'Kimia', 'Water Treatment'],
    'industri',
    FALSE,
    3,
    'spo-m.jpg',
    'lab-spo-m.pdf'
),
(
    'Garam Kasar Petani Premium',
    'garam-kasar-petani',
    'PTN PREMIUM',
    'Garam kasar hasil panen petani lokal Madura dengan kualitas terjaga.',
    'Garam kasar Petani Premium adalah hasil panen langsung dari petani garam Madura yang telah melalui proses sortir. Mendukung ekonomi lokal sekaligus menyediakan bahan baku berkualitas untuk industri.',
    '{
        "nacl_pct": 94.5,
        "water_pct": 4.5,
        "insoluble_impurities_pct": 0.8,
        "color": "Putih keabuan alami",
        "grain_size_mm": "3-8"
    }'::jsonb,
    ARRAY['Pengolahan Ikan', 'Peternakan', 'Distributor Retail'],
    'kasar',
    FALSE,
    4,
    'petani-premium.jpg',
    'lab-petani-premium.pdf'
),
(
    'Garam Halus Pakan Ternak',
    'garam-ghpt',
    'GHPT',
    'Garam khusus formulasi pakan ternak dengan komposisi optimal.',
    'GHPT (Garam Halus Pakan Ternak) diformulasikan khusus untuk campuran pakan ternak. Kandungan NaCl dan mineral dijaga optimal untuk mendukung nutrisi sapi, unggas, dan ikan budidaya.',
    '{
        "nacl_pct": 96.5,
        "water_pct": 1.0,
        "insoluble_impurities_pct": 0.2,
        "color": "Putih",
        "smell": "Tidak berbau",
        "mesh_size": "40-60"
    }'::jsonb,
    ARRAY['Peternakan', 'Budidaya Ikan', 'Pakan Ternak'],
    'halus',
    FALSE,
    5,
    'ghpt.jpg',
    'lab-ghpt.pdf'
)
ON CONFLICT (slug) DO NOTHING;
