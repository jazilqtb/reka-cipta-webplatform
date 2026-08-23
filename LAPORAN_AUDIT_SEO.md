# AUDIT SEO — Sebelum Daftar ke Google Search Console

Dilakukan dengan 3 sumber: **Kode** (graphify + baca langsung), **DB** (query
langsung Supabase, service-role — bypass RLS untuk ground truth penuh), **Live
production** (`https://reka-cipta-webplatform.vercel.app` — domain yang
BENAR-BENAR live, bukan `rekaciptaindonesia.com`). Firecrawl tidak
dipakai — lihat §0. Fase ini tidak menulis/mengubah kode.

---

## 0. Sumber & metodologi

| Sumber | Status | Catatan |
|---|---|---|
| Kode | ✅ Dipakai | graphify + baca 15+ berkas: layout.tsx, sitemap.ts, robots.ts, generateMetadata di 8 halaman, mapper, RLS |
| Database | ✅ Dipakai | Query langsung via REST API dgn `SUPABASE_SERVICE_KEY` (bypass RLS) — 3 artikel, 5 produk, kolom SEO nyata dibaca satu-per-satu |
| Firecrawl | ❌ **Tidak terkonfigurasi** — `FIRECRAWL_API_KEY` tidak ada di environment maupun `.env.local`. **Butuh aksi Jazil**, lihat §5. |
| Live production (pengganti sebagian Sumber 3) | ✅ Dipakai | Browser + `fetch()` langsung ke `reka-cipta-webplatform.vercel.app` (domain yang BENAR-BENAR melayani traffic hari ini) — status HTTP asli, `<head>` ter-render, JSON-LD, robots.txt, sitemap.xml. Ini BUKAN Firecrawl (tidak render lewat headless crawler pihak ketiga), tapi mengukur hal yang sama: apa yang benar-benar dikirim server ke browser. |

---

## 1. Rekonsiliasi tiga lapisan — temuan utama

| Halaman | Field | DB (nyata) | Kode | Live production | Cocok? |
|---|---|---|---|---|---|
| Semua halaman | Domain di canonical/OG/sitemap/robots | — | Hardcode `https://rekaciptaindonesia.com` di 11 berkas (§3) | **`rekaciptaindonesia.com`** di robots.txt, sitemap.xml, `<link rel="canonical">`, semua `og:url` — domain ini **belum live** (docs/DEPLOYMENT_HOSTING_CONTEXT.md §3: "belum tersambung secara aktual") | ❌ **TIDAK.** Situs melayani dari `reka-cipta-webplatform.vercel.app`, tapi memberi tahu Google versi kanoniknya ada di domain lain yang kemungkinan tidak menjawab apa pun |
| `/artikel/reka-cipta-jembatani-dua-dunia` | `meta_title` | `"Dari Tambak Petani ke Lini Produksi Industri:"` (diakhiri titik dua, terlihat terpotong) | `article.meta_title ?? title` | Title tag persis sama, titik dua ikut tampil di tab browser | ✅ Kode benar baca DB — tapi ISI datanya sendiri terlihat rusak/tidak selesai |
| `/artikel/reka-cipta-jembatani-dua-dunia` | `canonical_url` | `""` (string kosong) | `orNull()` di mapper menormalkan `""` → `null` → fallback ke URL tersusun | Canonical tag ADA (bukan hilang), isinya `.../artikel/reka-cipta-jembatani-dua-dunia` | ✅ Fallback bekerja — DB-nya kotor tapi output tidak rusak. **DB tetap perlu dibersihkan** (isi manual lewat admin) |
| `/artikel/...-rembang` | `meta_description` | `""` (string kosong) | `orNull()` → null → fallback ke `getArticleExcerpt()` | Meta description terisi dari kalimat pembuka artikel, bukan string kosong | ✅ Fallback bekerja, sama seperti di atas |
| `/artikel/...-rembang` | `meta_title` | `"Dari Reka Cipta Indonesia Perluas Jaringan Distribusi ke Jawa Tengah, Gandeng Unit Pengolahan Garam Rembang"` (108 karakter) | Dipakai apa adanya, tanpa batas panjang | Title tag 108 karakter — Google memotong/menulis ulang title di atas ~60 karakter | ⚠️ Kode & DB cocok, tapi **kualitas kontennya sendiri** melebihi batas praktis SERP |
| `/artikel/reka-cipta-jembatani-dua-dunia` | `updated_at` vs sitemap `lastmod` | `updated_at = 2026-08-22`, `published_at = 2026-07-14` | `sitemap.ts` pakai `article.published_at`, BUKAN `updated_at` | sitemap.xml live: `lastmod = 2026-07-14T13:51:47.753Z` (= published_at) | ❌ **TIDAK.** Artikel diedit 22 Agustus, tapi sitemap bilang belum berubah sejak 14 Juli — sinyal kesegaran ke Google salah |
| `/artikel/[slug]` (halaman sendiri) | `dateModified` di JSON-LD | sama | `article.updated_at ?? article.published_at` — **benar** | JSON-LD live: `dateModified: 2026-08-22...` | ✅ Benar — **tapi berselisih dengan sitemap.ts di baris di atas**, dua sumber tanggal berbeda untuk artikel yang sama |
| `/artikel/jenis-garam-dan-kegunaannya` (draft, `is_published=false`) | Status akses publik | `is_published=false`, `meta_description` sudah terisi | `getArticleBySlug()` filter `is_published=true` + RLS `published_at<=now()` | **HTTP 200**, judul "Artikel tidak ditemukan" | ❌ **BUG (soft-404).** `notFound()` terpanggil (render benar), tapi status HTTP tetap 200 — Google akan mengindeks halaman "tidak ditemukan" sebagai halaman valid |
| `/produk/[slug]` (slug tidak ada) | Status akses publik | — | `dynamicParams = false` | **HTTP 404** yang benar | ✅ Produk aman — kontras langsung dengan bug artikel di atas |
| `/produk` (katalog) | `meta_title`/`meta_description`/`canonical_url` per produk | **Kolom-kolom ini TIDAK ADA di tabel `products`** — diverifikasi query langsung, PostgREST menjawab `column products.meta_title does not exist` | `generateMetadata` produk pakai `tagline`/`description`, **tidak pernah ada field SEO khusus produk untuk dibaca** | Title = `"{nama} — {kode}"`, tidak ada `<link rel="canonical">` sama sekali | ⚠️ **Bukan bug mismatch — GAP FITUR.** Artikel dapat sistem SEO penuh (CP3, 15 Agu); produk tidak pernah dapat yang setara |
| Homepage `/` | `og:image` | — | `/og-image.svg`, dengan komentar developer sendiri: `// TODO: ganti /og-image.jpg sebelum production launch` | Live: `og-image.svg`, HTTP 200, `content-type: image/svg+xml` | ❌ **TODO developer belum dikerjakan**, sudah live. Facebook/WhatsApp/LinkedIn tidak me-render SVG untuk preview link |
| `/kontak` | `og:image` | — | Sama, `/og-image.svg` | Sama | ❌ Sama persis |
| JSON-LD Article, `publisher.logo` | Dimensi berkas nyata | `public/logo/logo-light.png` = **895×791px** (dicek `file` langsung) | Hardcode `width: 2816, height: 1536` di `artikel/[slug]/page.tsx` | JSON-LD live memuat dimensi yang salah (belum sempat dicek ulang live karena field terpotong di respons, tapi kode & file lokal sudah cukup membuktikan) | ❌ **Dimensi di JSON-LD tidak pernah cocok dengan berkas manapun** — bahkan sebelum logo diganti sesi ini. Google Rich Results akan menandai "declared image size mismatch" |

---

## 2. Temuan teknis

| # | Isu | Dampak | Bukti | Sumber | Perbaikan |
|---|---|---|---|---|---|
| 1 | **Canonical/OG/sitemap/robots seluruh situs menunjuk domain `rekaciptaindonesia.com` yang belum live** | **Tinggi** | Live: `robots.txt` → `Host:`/`Sitemap:` ke domain itu; `sitemap.xml` → SEMUA 15 URL pakai domain itu; `<link rel="canonical">` di homepage & artikel → domain itu. `docs/DEPLOYMENT_HOSTING_CONTEXT.md` §3 mengonfirmasi domain belum tersambung DNS | Kode + Live | Ganti SEMUA hardcode (§3) jadi baca `process.env.NEXT_PUBLIC_SITE_URL`, satu sumber kebenaran (idealnya satu helper `lib/site-url.ts`, bukan disalin ke 11 berkas). **Sebelum daftar GSC**: set `NEXT_PUBLIC_SITE_URL` di Vercel ke domain yang BENAR-BENAR akan didaftarkan |
| 2 | **Artikel tidak-ditemukan/belum-terbit balas HTTP 200, bukan 404 (soft-404)** | **Tinggi** | `fetch()` langsung ke slug draft → status 200, body "Artikel tidak ditemukan". Kontras: produk sama-sama pakai `notFound()` tapi balas 404 yang benar (karena `dynamicParams=false`) | Kode + Live | `/produk/[slug]` sudah punya pola yang benar (dynamicParams=false + generateStaticParams filter is_active). Terapkan pola setara untuk artikel, ATAU — karena artikel sengaja butuh on-demand ISR untuk slug baru (komentar developer di file) — pertimbangkan `export const dynamic = 'force-static'` tidak cocok; solusi yang tidak mengorbankan on-demand: precompute status di `generateStaticParams` tetap `dynamicParams: true` tapi tangani notFound() di layer routing (`middleware.ts` cek existensi) atau upgrade Next.js/pola redirect resmi untuk notFound+200 di on-demand ISR (docs Next.js: gunakan `redirect()` ke halaman 404 statis, atau downgrade ke output non-streaming) |
| 3 | **Produk tidak punya kolom SEO sama sekali** (`meta_title`, `meta_description`, `canonical_url`, `og_image_path` tidak ada di tabel `products`) | **Tinggi** (produk = halaman komersial utama) | Query REST API langsung: `column products.meta_title does not exist`. `generateMetadata` produk tidak pernah mencoba baca field ini pun | DB + Kode | Migrasi ADDITIVE: tambah 4 kolom nullable ke `products` (pola identik migrasi artikel `20260815091000`), tambah field ke form admin produk, sambungkan ke `generateMetadata`. Minimal: tambahkan `alternates.canonical` yang DIHITUNG dari slug (tanpa kolom baru) sebagai perbaikan cepat sementara |
| 4 | **`og-image.svg` dipakai sebagai og:image di 2 halaman** | **Sedang** | `app/(public)/page.tsx:50` & `kontak/page.tsx:35`, dengan TODO developer sendiri yang belum dikerjakan. Live: content-type `image/svg+xml` | Kode + Live | Ganti ke JPG/PNG 1200×630, atau gunakan `next/og` (`ImageResponse`) untuk generate OG image dinamis dari template |
| 5 | **Sitemap `lastmod` artikel pakai `published_at`, bukan `updated_at`** — berselisih dengan `dateModified` JSON-LD di halaman yang sama | **Sedang** | `app/sitemap.ts:53` vs `artikel/[slug]/page.tsx:179`. Data nyata: artikel diupdate 22 Agustus, sitemap bilang 14 Juli | Kode + DB | Ganti `article.published_at` → `article.updated_at ?? article.published_at` di `getArticleDetailUrls()` |
| 6 | **JSON-LD `publisher.logo` dimensi hardcode, tidak cocok berkas manapun** | **Sedang** | `artikel/[slug]/page.tsx:190-191`: `width:2816,height:1536`. Berkas nyata `logo-light.png` = 895×791 | Kode + berkas lokal | Hitung dimensi dari berkas nyata, atau — lebih baik lagi — sambungkan ke `getLogoUrls()` yang sudah dibangun (fitur Logo CRUD sesi sebelumnya) supaya ikut berubah kalau admin ganti logo lewat `/admin/logo`. Saat ini JSON-LD publisher logo TIDAK ikut sistem baru itu sama sekali |
| 7 | **`/produk` dan `/tentang-kami` tidak punya `<link rel="canonical">` sama sekali** | Rendah–Sedang | Grep `alternates`/`canonical` di kedua berkas: nol hasil | Kode | Tambahkan `alternates.canonical` self-referencing di kedua halaman, konsisten dengan pola di halaman lain |
| 8 | **CategoryTabs artikel navigasi murni `router.push()`, tanpa `<a href>` fallback** | Rendah | `components/article/CategoryTabs.tsx:49` — tidak ada `<Link>` di file ini sama sekali | Kode | Dampak kecil (artikel individual tetap ditemukan lewat sitemap + `/artikel` tanpa filter), tapi tambahkan `<Link href>` di baliknya agar filter kategori sendiri crawlable |
| 9 | **`/admin/*` dan `/api/*` di-disallow di robots.txt** | Tidak masalah | `app/robots.ts:24` | Kode | Sudah benar — admin memang tidak perlu terindeks. Tidak perlu perubahan |
| 10 | **Penjadwalan artikel (RLS `published_at<=now()`) — berkas rollback ADA tapi TIDAK diterapkan** | Informasi (bukan bug) | `supabase migration list` menunjukkan `20260822110000` (migrasi scheduling) applied di remote; file rollback ada di `supabase/pending-approval/`, BUKAN di `migrations/`, dan tidak muncul di migration history — belum dijalankan | DB (migration list) | Tidak perlu aksi — hanya dicatat supaya tidak ada yang mengira proteksi ini sudah dicabut |

---

## 3. Hardcode domain yang mestinya dinamis — lokasi lengkap

Semua ini literal `'https://rekaciptaindonesia.com'`, TIDAK membaca `NEXT_PUBLIC_SITE_URL`:

| Berkas | Baris | Konteks |
|---|---|---|
| `app/robots.ts` | 16 | `BASE_URL` untuk Host & Sitemap reference |
| `app/sitemap.ts` | 25 | `BASE_URL` untuk seluruh `<loc>` |
| `app/(public)/page.tsx` | 42, 48 | canonical & og:url homepage |
| `app/(public)/kontak/page.tsx` | 28, 34 | canonical & og:url |
| `app/(public)/artikel/page.tsx` | 60, 67, 73 | `SITE_URL` const + canonical + og:url (termasuk versi ber-pagination) |
| `app/(public)/artikel/[slug]/page.tsx` | 42 | `SITE_URL` const — dipakai canonical, JSON-LD Article, JSON-LD BreadcrumbList, publisher.logo.url |
| `app/(public)/jadi-supplier/page.tsx` | 22, 27 | canonical & og:url |
| `app/(public)/minta-penawaran/page.tsx` | 24, 29 | canonical & og:url |
| `app/(public)/kalkulator/page.tsx` | 19, 25 | canonical & og:url |
| `components/seo/StructuredData.tsx` | 32 | `SITE_URL` const — dipakai Organization `@id`/`url` dan tiap Product `@id`/`url` di homepage |

**Satu-satunya yang env-aware:** `app/layout.tsx:13` — `process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rekaciptaindonesia.com'`. Tapi karena `NEXT_PUBLIC_SITE_URL` **tidak ada** di daftar env var wajib Vercel (`docs/DEPLOYMENT_HOSTING_CONTEXT.md` §5), `metadataBase` kemungkinan besar JUGA jatuh ke fallback hardcode — dikonfirmasi live: canonical homepage = `rekaciptaindonesia.com`, cocok dengan asumsi ini.

**Rekomendasi struktural:** satu `lib/site-url.ts` yang diekspor sebagai `SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rekaciptaindonesia.com'`, diimpor ke 11 berkas di atas. Ini bukan cuma soal domain yang benar — dengan 11 salinan literal, memperbaiki satu tanpa yang lain menciptakan inkonsistensi baru (persis pola bug yang sudah dua kali ditemukan di ronde sebelumnya untuk kasus lain: `w-full` vs `w-32`, `steel-900` vs `ink-900`).

---

## 4. Rencana checkpoint (berurutan, berdasarkan dampak)

| CP | Isi | Kenapa urutan ini |
|---|---|---|
| **CP0** | Satu `lib/site-url.ts`, sambungkan ke 11 lokasi di §3. Set `NEXT_PUBLIC_SITE_URL` di Vercel (aksi Jazil, lihat §5) | Semua temuan Tinggi lain (canonical salah, sitemap salah, robots salah) berakar dari SATU sumber ini — memperbaikinya lebih dulu membuat verifikasi checkpoint berikutnya tidak perlu diulang saat domain berubah |
| **CP1** | Perbaiki soft-404 artikel (Temuan #2) | Blocker langsung untuk index quality — soft-404 adalah salah satu sinyal yang paling cepat membuat Google menurunkan crawl budget/trust satu domain, dan ini HARUS beres sebelum submit ke GSC, bukan sesudah |
| **CP2** | Tambah kolom SEO ke `products` + sambungkan ke `generateMetadata` (Temuan #3), minimal canonical self-referencing dulu kalau migrasi penuh butuh waktu | Produk adalah halaman intent tertinggi (RFQ dimulai dari sini) — saat ini paling lemah SEO-nya dari semua tipe halaman |
| **CP3** | `og-image.svg` → JPG/PNG (Temuan #4), sitemap `lastmod` pakai `updated_at` (Temuan #5), JSON-LD logo dimensi (Temuan #6) — sambungkan ke `getLogoUrls()` sekalian | Tiga-tiganya independen satu sama lain, bisa dikerjakan sekaligus, dampak Sedang |
| **CP4** | Canonical `/produk` + `/tentang-kami` (Temuan #7), `<Link>` fallback CategoryTabs (Temuan #8) | Dampak Rendah, polish terakhir sebelum submit GSC |

---

## 5. Butuh aksi Jazil

- [ ] **`FIRECRAWL_API_KEY`** — kalau audit render-JS penuh (setara Firecrawl) tetap diinginkan sebagai lapisan verifikasi tambahan, sediakan key ini
- [ ] **`NEXT_PUBLIC_SITE_URL`** — belum di-set di Vercel dashboard sama sekali (tidak ada di daftar env var project). Tentukan dulu: submit ke GSC pakai `reka-cipta-webplatform.vercel.app` (langsung bisa jalan) atau tunggu `rekaciptaindonesia.com` benar-benar live (DNS diarahkan) — lihat checklist domain di `docs/DEPLOYMENT_HOSTING_CONTEXT.md` §10
- [ ] **Keputusan domain untuk GSC**: mendaftarkan property GSC untuk domain yang BELUM live tidak ada gunanya (tidak ada yang bisa di-crawl). Pastikan urutannya: domain live dulu → `NEXT_PUBLIC_SITE_URL` diset → baru daftar GSC
- [ ] **Isi manual 2 kolom DB kotor**: `canonical_url=''` di `reka-cipta-jembatani-dua-dunia`, `meta_description=''` di artikel Rembang (sudah tertutup fallback, tapi lebih baik diisi eksplisit lewat `/admin/articles`)
- [ ] **Judul artikel Rembang** (108 karakter) — pertimbangkan dipersingkat di bawah ~60 karakter biar tidak dipotong Google
- [ ] **`meta_title` artikel "Dari Tambak Petani..."** — diakhiri titik dua, terlihat seperti kalimat terpotong; cek apakah memang sengaja atau typo

---

## 6. Yang TIDAK diverifikasi

- **Alt text gambar** di seluruh halaman publik (Image tim, produk, artikel) — belum diaudit satu-per-satu; investigasi berhenti di temuan yang lebih berdampak. Perlu audit terpisah kalau checkpoint di atas sudah selesai.
- **`article_slug_history` / redirect 308 untuk slug lama** — kode-nya dibaca (logic terlihat benar: cek riwayat, redirect kalau artikel masih published), tapi tidak diuji langsung dengan slug lama yang sungguhan berpindah — tidak ada data uji di tabel `article_slug_history` yang saya temukan untuk dicoba.
- **Core Web Vitals / performa** — di luar cakupan audit ini (murni SEO teknis & konten, bukan performa). Perlu Lighthouse/PageSpeed Insights terpisah.
- **Perilaku Googlebot sungguhan** (crawl budget, cara Google benar-benar memperlakukan domain ganda ini) — tidak bisa disimulasikan, hanya bisa diprediksi dari dokumentasi resmi Google tentang duplicate content & canonical.
- **Semua halaman admin** — sengaja tidak diaudit SEO-nya (memang tidak untuk publik, sudah benar di-disallow robots.txt).
