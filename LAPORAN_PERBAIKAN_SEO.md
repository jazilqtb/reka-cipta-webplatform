# LAPORAN PERBAIKAN SEO — Eksekusi atas Audit

Ringkas, tabel. Fase eksekusi atas `LAPORAN_AUDIT_SEO.md`.

## 1. Ran / Skipped / Planned / Manual

| CP | Isi | Status | Catatan |
|---|---|---|---|
| CP0 | Domain hardcode → `NEXT_PUBLIC_BASE_URL`, `metadataBase` di root | **Ran** | 11 berkas disambungkan ke `lib/site-url.ts`; diuji dengan & tanpa env var, keduanya benar |
| CP1 | generateMetadata baca DB sungguhan (artikel & produk) | **Ran** | Produk sebelumnya TIDAK PUNYA kolom SEO sama sekali — migrasi additive dijalankan, form admin + backend disambungkan |
| CP1 | Freshness: `updated_at` di atas `published_at` | **Ran** | Sitemap `lastmod` diuji cocok persis dengan JSON-LD `dateModified` |
| CP1 | OG image bukan .svg | **Ran** | `next/og` `ImageResponse` — 4 halaman (beranda, kontak, produk, tentang-kami); `/og-image.svg` (tak terpakai) & referensi rusak `/og-image.jpg` (tak pernah ada) dihapus |
| CP2 | 404 sejati untuk konten unpublish | **Ran, dengan keterbatasan diketahui** | Lihat §6 — root cause ditemukan (bukan cache, konfirmasi Next.js), perbaikan penuh butuh trade-off yang ditolak (lihat di bawah); mitigasi `robots: noindex` diterapkan |
| CP2 | router.push → Link untuk navigasi konten publik | **Ran** | `CategoryTabs.tsx` (filter kategori artikel) — satu-satunya yang diidentifikasi laporan A. Dua `router.push` lain (RFQForm, SupplierRegistrationForm) diverifikasi BUKAN navigasi konten — itu redirect pasca-submit, sengaja tidak disentuh |
| CP2 | robots.txt tidak blokir bot AI | **Skipped — sudah benar** | `userAgent: '*'` sudah mencakup semua bot termasuk GPTBot/ClaudeBot/dll; tidak ada perubahan diperlukan |
| CP3 | Alt text deskriptif & dinamis | **Skipped — sudah benar** | Diaudit ProductCard, ProductsPreview, ArticleCard, ProductHero, TeamMember, artikel/[slug] — semua dinamis. `alt=""` yang ada (HeroCarousel, CredibilitySection marquee) sudah benar sengaja (dekoratif/aria-hidden) |
| CP3 | Satu H1 per halaman | **Skipped — sudah benar** | Diaudit semua hero (Home, About, Contact, ProductCatalog, ProductDetail, PageHero generik) — masing-masing tepat satu H1 |
| CP4 | revalidatePath saat admin simpan | **Ran — bug lama ditemukan & diperbaiki sebagian** | Lihat §6 — bug kritis (404 permanen) ditemukan saat verifikasi dan sudah diperbaiki; kesegaran instan untuk PRODUK masih tidak tercapai penuh (batasan Next.js yang dikonfirmasi, lihat §6b) |

## 2. Rekonsiliasi tiga lapisan — before/after

| Halaman | Field | Sebelum | Sesudah (diverifikasi live, build lokal) |
|---|---|---|---|
| Semua halaman | Domain canonical/OG/sitemap/robots | Hardcode `rekaciptaindonesia.com` (belum live) | `NEXT_PUBLIC_BASE_URL` env-var, diverifikasi: tanpa env var jatuh ke fallback lama (aman), DENGAN env var (`reka-cipta-webplatform.vercel.app`) seluruh 3 sumber — robots.txt, sitemap.xml, `<link rel="canonical">` — cocok persis |
| `/artikel/[slug]` | `dateModified` vs sitemap `lastmod` | Berselisih (published_at vs updated_at) | **Cocok persis**: diuji live, keduanya `2026-08-23T09:50:27...Z` |
| `/artikel/[slug]` JSON-LD `publisher.logo` | Dimensi | Hardcode 2816×1536, berkas asli 895×791 | Dimensi dihapus (tidak wajib di skema), URL disambungkan ke `getLogoUrls()` — ikut berubah kalau admin ganti logo |
| `/produk/[slug]` | `meta_title`/`meta_description`/`canonical_url` | Kolom TIDAK ADA di DB, kode tidak pernah baca | Kolom ditambah (migrasi additive), kode baca dengan fallback (tagline→description), admin form bisa isi. Diuji end-to-end: isi via admin → tersimpan di DB → **tapi lihat bug §6** |
| `/`, `/kontak` | `og:image` | `.svg` (tidak di-render bot medsos) | PNG 1200×630 via `next/og`, diuji live: `content-type` PNG, bukan lagi svg |
| `/tentang-kami` | `og:image` | `/og-image.jpg` — **berkas ini tidak pernah ada**, 404 kalau di-fetch | PNG dinamis, sama pola |
| `/produk`, `/tentang-kami` | `<link rel="canonical">` | Tidak ada sama sekali | Ditambahkan, self-referencing |
| `/artikel` (filter kategori) | Crawlability navigasi | `router.push()` murni, nol `<a href>` | `<Link href>` nyata per kategori, diuji live: href muncul di HTML mentah |
| `/artikel/[slug]` draft/unpublish | Status HTTP | 200 (soft-404) | **Masih 200** — lihat §6. Mitigasi: `<meta name="robots" content="noindex">` sekarang ada (sebelumnya tidak) |
| `/produk/[slug]` slug tidak ada | Status HTTP | 404 (sudah benar) | Tetap 404 — TIDAK diubah, tapi lihat bug baru di §6 yang justru muncul dari jalur SIMPAN, bukan dari jalur ini |

## 3. Berkas yang diubah

**Baru:**
`lib/site-url.ts` · `lib/og-image-template.tsx` · `app/(public)/opengraph-image.tsx` · `app/(public)/kontak/opengraph-image.tsx` · `app/(public)/produk/opengraph-image.tsx` · `app/(public)/tentang-kami/opengraph-image.tsx` · `supabase/migrations/20260823160000_product_seo_fields.sql`

**Diubah:**
`app/layout.tsx` · `app/robots.ts` · `app/sitemap.ts` · `app/actions/products.ts` · `app/(public)/page.tsx` · `app/(public)/kontak/page.tsx` · `app/(public)/artikel/page.tsx` · `app/(public)/artikel/[slug]/page.tsx` · `app/(public)/produk/page.tsx` · `app/(public)/produk/[slug]/page.tsx` · `app/(public)/tentang-kami/page.tsx` · `app/(public)/jadi-supplier/page.tsx` · `app/(public)/minta-penawaran/page.tsx` · `app/(public)/kalkulator/page.tsx` · `components/seo/StructuredData.tsx` · `components/article/CategoryTabs.tsx` · `components/admin/product/ProductEditForm.tsx` · `lib/data/articles.ts` · `lib/product-mapper.ts` · `lib/validation/product-schema.ts` · `backend/schemas/product.py` · `types/api.ts`

**Dihapus:** `public/og-image.svg` (tidak terpakai lagi)

## 4. Perubahan DB

Migrasi `20260823160000_product_seo_fields.sql` — **ADDITIVE, sudah diterapkan** ke Supabase:
- `products.meta_title` (VARCHAR 200, nullable)
- `products.meta_description` (VARCHAR 300, nullable)
- `products.og_image_path` (TEXT, nullable)
- `products.canonical_url` (TEXT, nullable)
- Index parsial `idx_products_canonical`

Nol baris tersentuh, nol kolom lama diubah.

## 5. ACTION REQUIRED

- [ ] **`NEXT_PUBLIC_BASE_URL`** di Vercel (production + preview) — set ke domain yang akan didaftarkan ke Search Console. Kode sudah siap, diverifikasi bekerja dengan env var apa pun
- [ ] **`FIRECRAWL_API_KEY`** — masih tidak ada; verifikasi ulang di §7 memakai build produksi lokal + live Vercel langsung sebagai gantinya, bukan Firecrawl
- [x] ~~BUG KRITIS revalidatePath produk 404 permanen~~ — **sudah diperbaiki & diverifikasi ulang** (lihat §6b). Bug lama yang baru ketahuan saat verifikasi CP4, bukan sesuatu yang dibuat sengaja ronde ini
- [ ] **Kesegaran instan untuk edit produk** — masih menunggu TTL 1 jam meski status HTTP sudah aman (lihat batasan di §6b). Bukan bug baru (perilaku dari sebelum revalidatePath pernah dipasang), tapi tujuan awal CP4 belum tercapai penuh untuk PRODUK (artikel sudah). Perlu `revalidateTag` di ronde berikutnya kalau kesegaran instan penting
- [ ] **`tagline` "Garam Halus Yodium"** berakhiran kata nyasar **"ciba"** — lokasi persis sekarang diketahui: kolom `products.tagline`, baris slug `garam-halus-yodium`. Tidak diubah (data produksi milik Jazil)
- [ ] **`meta_title` artikel "Dari Tambak Petani..."** — diakhiri titik dua, masih terlihat terpotong (dari audit sebelumnya, belum diperbaiki — data produksi)
- [ ] **`meta_description` artikel Rembang** masih kosong di DB (fallback jalan, tapi kolomnya sendiri belum diisi — data produksi)
- [ ] **`canonical_url` artikel "jembatani-dua-dunia"** masih `''` di DB (fallback jalan — data produksi)
- [ ] Menggantung dari ronde sebelumnya: deploy Railway, signup publik Supabase, rotasi `ADMIN_TEST_PASSWORD`, klaim asal Madura di DB, lead uji, logo final, cold start Railway, `rfq_leads.status` vs `rfqs.status`

## 6. Temuan penting selama eksekusi — dilaporkan jujur, bukan ditutupi

### 6a. Soft-404 artikel — akar masalah ditemukan, perbaikan penuh punya trade-off yang ditolak

Diselidiki mendalam: BUKAN cache basi (diuji dengan `.next` dihapus total, request pertama sekalipun tetap 200). Reproduksi konsisten di `next dev` DAN production build lokal (`next build && next start`), jadi ini perilaku Next.js 16.2.6 yang nyata, bukan artefak lingkungan lokal.

Dicoba `dynamic = 'force-dynamic'` + hapus `generateStaticParams` — **tidak memperbaiki** status HTTP (tetap 200) walau berhasil menghapus header prerender.

Dicoba menyamakan persis pola `/produk/[slug]` (`dynamicParams = false`) — **INI benar-benar memperbaiki status 404**, dibuktikan dengan `dynamicParams=false` di produk. Tapi ditolak untuk artikel karena trade-off nyata: fitur **penjadwalan terbit artikel** (migrasi `20260822110000_article_scheduling`, RLS berbasis `published_at`, sengaja TANPA cron) bergantung pada on-demand ISR (`dynamicParams: true`) supaya artikel otomatis muncul begitu waktunya lewat. Dengan `dynamicParams=false`, artikel yang published_at-nya sudah lewat TETAP 404 sampai redeploy — mematikan fitur yang sengaja dibangun tanpa cron.

**Keputusan: pertahankan `dynamicParams: true`, terima status 200 yang tidak sempurna, mitigasi dengan `robots: {index:false, follow:false}` eksplisit** pada respons not-found — diverifikasi live, tag `<meta name="robots" content="noindex">` sekarang muncul (sebelumnya tidak ada sama sekali). Ini bukan solusi sempurna, tapi konsekuensi terburuknya (Google mengindeks halaman kosong) sudah dicegah secara eksplisit, bukan implisit.

### 6b. BUG DITEMUKAN & DIPERBAIKI — revalidatePath meruntuhkan halaman produk yang dynamicParams=false

**Ditemukan tidak sengaja saat menguji CP4** (verifikasi "admin simpan → publik ikut segar"). Reproduksi awal lewat form admin sungguhan, lalu diisolasi lewat route debug sementara (`/api/debug-revalidate`, dibuat-dan-dihapus di sesi ini — tidak tersisa di repo) supaya bisa diuji berulang tanpa lewat form setiap kali.

**Akar masalah, dibuktikan lewat isolasi:**
`revalidatePath(path)` TANPA argumen `type` kedua, dipanggil pada path yang dilayani rute dengan `dynamicParams = false` (`/produk/[slug]`), membuat halaman itu balas **404 permanen** (`x-nextjs-cache: HIT`, `x-nextjs-prerender: 1`) — bukan transient, bertahan sampai server di-restart. Dikonfirmasi dengan isolasi murni: DB tidak disentuh, cuma memanggil `revalidatePath('/produk/garam-halus-yodium')` langsung → halaman yang tadinya 200 langsung 404.

**Dikonfirmasi BUKAN masalah umum revalidatePath** — diuji hal yang sama persis pada `/artikel/[slug]` (yang TIDAK pakai `dynamicParams=false`): `revalidatePath` tanpa `type` di sana bekerja sempurna, konten langsung segar, tanpa 404. Jadi masalahnya spesifik pada kombinasi `revalidatePath` tanpa `type` + `dynamicParams=false`, bukan revalidatePath secara umum.

**Perbaikan diterapkan:** `app/actions/products.ts` — `revalidatePath(\`/produk/${slug}\`)` → `revalidatePath(\`/produk/${slug}\`, 'page')`. Argumen `type` eksplisit memang disyaratkan dokumentasi Next.js untuk path dinamis, dan menghilangkannya (seperti kode sebelumnya) adalah akar penyebabnya.

**Diverifikasi ulang setelah perbaikan (build produksi lokal, lewat form admin sungguhan, bukan route debug):** edit produk → simpan → halaman publik **tetap 200** (sebelumnya 404 permanen). Bug kritis (outage) **tertutup**.

**Keterbatasan yang TERSISA, dilaporkan jujur:** dengan `type: 'page'`, status HTTP aman tapi KONTEN tidak langsung segar — diuji beberapa kali berturut-turut (jeda beberapa detik), halaman publik produk tetap menampilkan versi lama sampai jendela `revalidate: 3600` alami habis. Dicoba kombinasi (`type` lalu bare, atau sebaliknya) — bare tetap merusak status di urutan manapun, jadi tidak bisa dipakai sama sekali untuk rute ini. Ini BUKAN regresi baru (sebelum ada `revalidatePath` sama sekali, produk juga menunggu TTL) — tapi juga berarti tujuan asli CP4 ("admin edit produk → publik segera segar") **belum tercapai penuh untuk PRODUK** (untuk ARTIKEL sudah, dikonfirmasi di atas). Memperbaikinya lebih jauh kemungkinan butuh `revalidateTag` dengan fetch bertag eksplisit di `lib/product-mapper.ts`/`getProduct()` — perubahan lebih besar, di luar sesi ini.

## 7. Verifikasi ulang — bukan Firecrawl, tapi build produksi lokal + live Vercel langsung

`FIRECRAWL_API_KEY` masih tidak tersedia (sama seperti audit awal). Sebagai gantinya: build produksi lokal (`next build && next start`) diuji langsung dengan `curl`, dan situs live (`reka-cipta-webplatform.vercel.app`, kode LAMA — belum di-deploy) diperiksa sebagai baseline "sebelum" di awal sesi.

Terverifikasi (build lokal, kode baru):
- `tsc --noEmit` bersih, `next build` EXIT=0
- robots.txt & sitemap.xml valid & bisa diakses, ikuti `NEXT_PUBLIC_BASE_URL`
- canonical, og:url, JSON-LD dateModified — cocok persis dengan DB pada 2 artikel & 1 produk yang diuji
- OG image PNG (bukan svg) di 4 halaman
- 404 sejati tetap berfungsi untuk produk (`dynamicParams=false`, tidak disentuh)
- CategoryTabs punya href nyata
- Bug 6b: diverifikasi ulang setelah perbaikan — edit produk lewat form admin sungguhan tidak lagi men-404-kan halaman publiknya (sebelumnya: 404 permanen setiap kali)

## 8. Yang TIDAK diverifikasi

- **Perbaikan bug 6b di Vercel production sungguhan** — perbaikan (`type: 'page'`) hanya diuji & diverifikasi di build produksi lokal (`next build && next start`). Vercel punya arsitektur cache (Edge/ISR terdistribusi) yang berbeda dari `next start` lokal — perilakunya SEHARUSNYA identik (`type: 'page'` adalah API resmi Next.js, bukan workaround khusus lokal), tapi **belum dibuktikan langsung di Vercel**. Uji sekali di staging sebelum benar-benar mengandalkannya di production.
- **Kesegaran instan untuk produk** — dikonfirmasi TIDAK tercapai (lihat §6b), bukan sesuatu yang belum diuji.
- **Kode SEO hasil sesi ini belum di-deploy** ke Vercel/Railway — semua verifikasi di atas dari lingkungan lokal.
- **Backend Python**: hanya diverifikasi `import` berhasil (`python3 -c "from schemas.product import ..."`) dan uvicorn lokal (`--reload`) tetap hidup — endpoint PATCH produk yang membawa field baru belum diuji lewat request HTTP sungguhan ke FastAPI (hanya lewat browser admin form, yang berhasil sampai revalidatePath memicu bug 6b).
- **Artikel**: field SEO artikel TIDAK diuji ulang end-to-end lewat admin form pada sesi ini (sudah diverifikasi benar dari audit sebelumnya, kode-nya tidak disentuh kecuali sitemap lastModified dan JSON-LD logo — keduanya sudah diverifikasi via curl langsung).
- Firecrawl asli — tetap tidak pernah dijalankan.
