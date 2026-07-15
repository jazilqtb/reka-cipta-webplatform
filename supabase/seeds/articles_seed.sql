-- Idempotent seed: kalau slug sudah ada, skip
-- thumbnail_path sengaja NULL di seluruh seed ini — supaya fallback state
-- ArticleCard (gradient + ikon BookOpen) tervalidasi saat QA. Upload thumbnail
-- asli manual via Supabase Dashboard ke bucket article-thumbnails lalu
-- UPDATE thumbnail_path kalau ingin test dengan gambar sungguhan.
-- Ref: epic6_task_breakdown_slice1_artikel-berita.md E6-S1-DB-05.
INSERT INTO public.articles (
    title, slug, category, content, meta_description, thumbnail_path,
    view_count, is_published, published_at
) VALUES
(
    'Mengenal Standar SNI untuk Garam Industri',
    'standar-sni-garam-industri',
    'education',
    '<p>Standar Nasional Indonesia (SNI) untuk garam mengatur kadar NaCl minimum, kadar air maksimum, dan kandungan kalium iodat untuk garam konsumsi. Memahami standar ini penting bagi pelaku industri yang membutuhkan garam sebagai bahan baku.</p><h2>Kenapa SNI Penting</h2><p>Kepatuhan terhadap SNI memastikan konsistensi kualitas garam yang Anda terima, terlepas dari sumber produksinya.</p>',
    'Panduan lengkap memahami standar SNI garam untuk kebutuhan industri Anda.',
    NULL, 45, TRUE, NOW() - INTERVAL '10 days'
),
(
    '5 Jenis Garam dan Kegunaannya di Industri',
    'jenis-garam-dan-kegunaannya',
    'education',
    '<p>CV Reka Cipta Indonesia mendistribusikan 5 jenis garam utama: Halus Yodium, Halus Non-Yodium, Kasar Industri, Kasar Petani, dan GHPT (Garam Halus Pakan Ternak).</p><h2>Memilih Jenis yang Tepat</h2><p>Setiap jenis garam punya karakteristik dan kegunaan industri yang berbeda-beda, mulai dari makanan, farmasi, hingga pakan ternak.</p>',
    'Kenali 5 jenis garam yang kami distribusikan dan industri yang cocok untuk masing-masing.',
    NULL, 120, TRUE, NOW() - INTERVAL '8 days'
),
(
    'CV Reka Cipta Hadir di Pameran Industri Surabaya',
    'hadir-di-pameran-industri-surabaya',
    'company_news',
    '<p>Tim CV Reka Cipta Indonesia berpartisipasi dalam pameran industri di Surabaya untuk memperluas jaringan mitra dan memperkenalkan lini produk garam kami kepada calon buyer industri.</p>',
    'Tim kami berpartisipasi dalam pameran industri untuk memperluas jaringan mitra.',
    NULL, 30, TRUE, NOW() - INTERVAL '5 days'
),
(
    'Kemitraan Baru dengan Petani Garam Sumenep',
    'kemitraan-baru-petani-garam-sumenep',
    'company_news',
    '<p>Kami menyambut mitra supplier baru dari Sumenep, Jawa Timur — memperkuat rantai pasok garam kasar petani yang kami distribusikan ke mitra industri di seluruh Indonesia.</p>',
    'Kami menyambut mitra supplier baru dari Sumenep, Jawa Timur.',
    NULL, 80, TRUE, NOW() - INTERVAL '3 days'
),
(
    'Cara Memilih Garam yang Tepat untuk Water Treatment',
    'cara-memilih-garam-water-treatment',
    'education',
    '<p>Proses pengolahan air (water treatment) membutuhkan garam dengan spesifikasi kemurnian tertentu. Artikel ini membahas faktor-faktor yang perlu dipertimbangkan saat memilih garam untuk kebutuhan water treatment industri Anda.</p>',
    'Panduan memilih spesifikasi garam yang sesuai untuk kebutuhan pengolahan air.',
    NULL, 200, TRUE, NOW() - INTERVAL '2 days'
),
(
    'Proses Distribusi Garam dari Tambak ke Pabrik',
    'proses-distribusi-garam-tambak-ke-pabrik',
    'education',
    '<p>Simak bagaimana garam berkualitas dari tambak petani di Madura sampai ke tangan mitra industri kami — mulai dari verifikasi kualitas, penyimpanan, hingga pengiriman.</p>',
    'Simak bagaimana garam berkualitas sampai ke tangan mitra industri kami.',
    NULL, 15, TRUE, NOW() - INTERVAL '1 day'
),
(
    'Artikel Draft — Belum Siap Publish',
    'draft-belum-siap-publish',
    'education',
    '<p>Draft artikel untuk keperluan QA is_published = false.</p>',
    'Draft artikel untuk test is_published = false.',
    NULL, 0, FALSE, NULL
)
ON CONFLICT (slug) DO NOTHING;
