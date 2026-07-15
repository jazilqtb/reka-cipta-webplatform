# Epic 6 Task Breakdown — Artikel & Berita (Customer-Facing) · Slice 1

**Depends on:** Epic 1 (routing, layout global, Navbar/Footer, security headers), Epic 2 Slice 1 (design tokens, `InnerPageHero`, homepage yang akan disentuh di Slice 3), Epic 3 Customer-Facing (pola Direct Supabase untuk public read — `lib/supabase/public.ts`, `generateStaticParams`/`generateMetadata`/JSON-LD di `app/(public)/produk/[slug]/page.tsx`, `CategoryFilterTabs`, skeleton system), `CLAUDE.md` (rendering strategy resmi proyek)

**Blocks:** Epic 6 Slice 3 (homepage section "Wawasan & Kabar Terbaru" — konsumsi `ArticleCard` + data-access functions dari slice ini), Epic 6 Admin Panel (CRUD artikel — epic terpisah di masa depan, butuh tabel `articles` + bucket `article-thumbnails` yang dibuat di slice ini)

**Tidak bergantung pada / tidak memblokir:** Epic 6 Slice 2 (Kalkulator Garam) — independen penuh, bisa dikerjakan paralel atau lebih dulu.

---

## Konteks Slice

Slice ini adalah **separuh pertama** dari Epic 6 Customer-Facing: sisi konsumsi publik untuk fitur Artikel & Berita — halaman daftar (`/artikel`), halaman detail (`/artikel/[slug]`), filter kategori, pagination, SEO, dan (tambahan di luar Epic Doc 2 asli, lihat AR-06) view count untuk mendukung kebutuhan baru "artikel terbanyak dilihat" di homepage (Slice 3).

**Yang TIDAK termasuk slice ini:**
- **CRUD artikel di Admin Panel** (buat, edit, hapus, publish/unpublish, rich text editor, upload thumbnail). Ini scope Epic 6 Admin Panel — epic/dokumen terpisah, dikerjakan setelah atau paralel dengan slice CF ini, mengikuti pola yang sama persis dengan Epic 5 (CF shipped duluan, lalu Admin Panel menyusul di dokumen `epic5_task_breakdown_admin-panel.md`).
- **Kalkulator Garam** — Slice 2, dokumen terpisah, independen.
- **Section homepage** — Slice 3, dokumen terpisah, dependent ke slice ini.

**Konsekuensi penting dari tidak adanya Admin CRUD di slice ini:** tidak ada jalur UI untuk membuat artikel baru. Untuk keperluan development dan QA, artikel diseed manual via SQL (`E6-S1-DB-05`) — pola yang sama dengan bagaimana Epic 5 CF diuji sebelum Epic 5 Admin Panel ada.

---

## Prasyarat Teknis (Konfirmasi Sebelum Mulai)

- [ ] Epic 3 Customer-Facing selesai — pola `createPublic()`, `generateStaticParams`, `generateMetadata`, JSON-LD di `app/(public)/produk/[slug]/page.tsx` dipahami penuh (slice ini mereplikasi pola ini persis, lihat AR-01)
- [ ] Epic 2 Slice 1 selesai — `InnerPageHero`, design tokens (`ink-700`, `brand-teal-600`, dll), skeleton system (`.skeleton`, `CardSkeleton`) tersedia
- [ ] `CLAUDE.md` bagian "Rendering Strategy" dan "Data Fetching: Direct Supabase vs FastAPI" sudah dibaca — slice ini adalah implementasi konkret dari baris: *"Direct Supabase: public reads (products, articles, settings)"* dan *"/artikel list: ISR with revalidate: 300"*
- [ ] `next.config.js` sudah punya `images.remotePatterns` untuk `*.supabase.co/storage/v1/object/public/**` (dikonfirmasi ada — dipakai bersama oleh `product-photos` dan bucket baru `article-thumbnails`)

---

## Keputusan Arsitektur Slice

### AR-01 — Direct Supabase untuk Public Reads, Bukan Endpoint FastAPI (Menyimpang dari Draft Epic Doc 2, Konsisten dengan Implementasi Aktual Epic 3 CF)

Epic Doc 2 menulis spesifikasi backend `GET /articles` dan `GET /articles/{slug}` sebagai endpoint FastAPI publik. **Slice ini TIDAK membangun endpoint tersebut.**

Alasan: `CLAUDE.md` (living reference proyek, lebih otoritatif dari draft Epic Doc untuk keputusan implementasi) eksplisit menyatakan:
> "Direct Supabase: public reads (products, articles, settings) — SSG-compatible, no FastAPI overhead"

Dan ini **sudah dibuktikan sebagai pola yang benar-benar dipakai**, bukan cuma niat dokumentasi — diverifikasi langsung di kode:
- `app/(public)/produk/page.tsx:3,25,28` — `createPublic().from('products')...`
- `app/(public)/produk/[slug]/page.tsx:28-29,34-38` — `createPublic().from('products')...` di `generateStaticParams` dan `generateMetadata`
- `app/(public)/page.tsx:89-108` (`getProductsPreview`) — pola yang sama untuk homepage

Menariknya, Epic 3 CF *juga* membangun endpoint FastAPI `GET /products` (`epic3_task_breakdown_customer-facing.md` Layer 3b) — tapi endpoint itu tidak pernah dipakai oleh frontend publik yang benar-benar shipped. Untuk menghindari mengulang pekerjaan yang tidak terpakai, slice ini **tidak** membangun paralel endpoint FastAPI untuk artikel sama sekali. Semua public read (list, detail, related, latest, most-viewed) lewat `lib/data/articles.ts` yang query Supabase langsung via `createPublic()`.

**Konsekuensi:** tidak ada Layer "Backend" di slice ini. Diganti Layer "Data Access" (3b) — lihat Ringkasan Task per Layer.

### AR-02 — `dynamicParams = true` untuk Detail Artikel (Berbeda dengan Pola Epic 3 Produk)

`app/(public)/produk/[slug]/page.tsx` memakai `export const dynamicParams = false` — slug di luar 5 produk yang di-generate langsung 404 di level routing (komentar di file itu sendiri menjelaskan alasannya: state produk stabil, jarang berubah, trade-off diterima).

**Artikel berbeda konteks bisnisnya:** akan terus bertambah pasca-launch lewat Epic 6 Admin Panel (fitur masa depan) **tanpa redeploy**. Kalau `dynamicParams = false` dipakai, artikel baru yang dipublish admin tidak akan pernah accessible sampai next deploy — itu bug fungsional, bukan trade-off yang bisa diterima untuk fitur konten yang justru dirancang untuk sering diupdate (SEO engine).

**Keputusan:** `app/(public)/artikel/[slug]/page.tsx` memakai `dynamicParams = true` (default Next.js — tidak perlu deklarasi eksplisit, atau deklarasikan eksplisit untuk dokumentasi niat). `generateStaticParams` tetap ada untuk build-time pre-render artikel yang sudah published saat build, tapi slug baru pasca-deploy tetap accessible via on-demand ISR fallback (ditandai dengan `revalidate` di bawah).

### AR-03 — View Count via Postgres RPC `SECURITY DEFINER`, Bukan Endpoint FastAPI

Untuk mendukung kebutuhan baru "artikel terbanyak dilihat" (lihat AR-06), butuh mekanisme increment `view_count` yang aman diakses dari browser publik. Karena AR-01 menetapkan pola Direct Supabase (tanpa FastAPI untuk read), increment juga tetap dalam paradigma Supabase-native — **bukan** membuat satu-satunya endpoint FastAPI di slice ini hanya untuk write kecil ini.

**Pola:** fungsi Postgres `increment_article_view(p_slug TEXT)` dengan `SECURITY DEFINER`, di-`GRANT EXECUTE` ke role `anon`. Function inilah yang boleh menaikkan `view_count` — RLS pada tabel `articles` sendiri **tidak** memberi `anon` hak `UPDATE` langsung (lihat DB-02). Dipanggil dari Client Component via `supabase.rpc('increment_article_view', { p_slug: slug })`.

**Anti-abuse — sengaja minimal:** guard di sisi client pakai `sessionStorage` (satu artikel di-count sekali per sesi browser, refresh tidak dobel-count dalam sesi yang sama). Ini **bukan** proteksi anti-fraud yang kuat (incognito/session baru bisa menaikkan lagi) — dan itu keputusan sadar: `view_count` adalah metrik engagement lunak untuk mengurutkan "populer" di homepage, bukan angka yang punya konsekuensi bisnis/keamanan kalau digelembungkan sedikit. Rate limiting per-IP di level backend untuk ini adalah over-engineering (YAGNI) — konsisten dengan semangat R-55 dari Epic 5 Admin (jangan optimize/proteksi berlebihan untuk kebutuhan yang belum terbukti).

### AR-04 — Excerpt Artikel Reuse `meta_description`, Tidak Ada Kolom `excerpt` Terpisah

Epic Doc 2 minta card artikel menampilkan "preview 2 baris teks", dan requirement baru dari user minta "beberapa kalimat awal dari berita" di section homepage. Skema `articles` dari Epic Doc 2 sudah punya `meta_description VARCHAR(300)` yang fungsinya SEO meta description.

**Keputusan:** field yang sama dipakai dua fungsi — SEO meta description **dan** teks preview di card (list, related articles, homepage teaser). **Tidak** menambah kolom `excerpt` baru. Alasan: satu field, satu tempat isi (admin nanti isi sekali di form CRUD), tidak ada risiko dua teks yang saling tidak sinkron. Kalau field ini kosong (artikel lama / admin lupa isi), fallback: strip HTML dari `content`, ambil ~160 karakter pertama, potong di word boundary, tambah `…` (lihat DA-02).

### AR-05 — Konten HTML Wajib Disanitasi Sebelum Render (XSS Defense)

Kolom `content` menyimpan HTML mentah dari rich text editor (dibangun di Admin Panel epic masa depan, di luar scope slice ini). **Slice ini tetap wajib menyanitasi HTML tersebut sebelum `dangerouslySetInnerHTML`** — tidak boleh menunggu Admin Panel epic untuk menambahkan proteksi ini, karena:

1. Trust boundary yang benar bukan "apakah editornya sudah dibangun dengan aman", tapi "apakah HTML yang tersimpan di DB bisa dipercaya blind" — jawabannya tidak pernah, terlepas siapa yang menulis (akun admin bisa dikompromikan, editor masa depan bisa punya bug, copy-paste dari sumber lain bisa membawa payload).
2. Kalau proteksi ini ditunda ke Admin Panel epic, ada window artikel live di production tanpa sanitasi — risk yang tidak perlu diambil.

Pakai `isomorphic-dompurify` (bekerja di server & client, cocok untuk Server Component render). Task instalasi: `E6-S1-FE-01`. Wrapper helper: `E6-S1-DA-02`.

### AR-06 — Kolom `view_count`: Ekstensi di Luar Skema Epic Doc 2 (Justified, Didorong Kebutuhan Baru)

Skema `articles` di Epic Doc 2 / PRD **tidak** punya kolom view count — requirement "artikel terbanyak dilihat" adalah permintaan baru dari user di luar dokumen epic asli (section homepage baru). Kolom `view_count INTEGER NOT NULL DEFAULT 0` ditambahkan di migration `E6-S1-DB-01` sebagai bagian dari skema awal (bukan migration `ALTER TABLE` terpisah, karena tabel belum pernah dibuat — masih bisa didesain sekali jalan).

**Catatan untuk penulis dokumen Epic 6 Admin Panel di masa depan:** kolom ini ada dan harus di-exclude dari form CRUD admin (bukan field yang diisi manual — read-only, hanya berubah lewat RPC `increment_article_view`). Jangan dianggap sebagai field yang terlewat dari Epic Doc 2 — ini memang tambahan sengaja.

### AR-07 — Pagination via URL Query Param, `.range()` Langsung (Konsisten Pola Epic 4B/Epic 5 Admin `FilterPanel`)

`/artikel` pakai `?category=education&page=2` di URL — bukan state lokal (`useState`) tanpa sinkron URL. Ini gaya yang sama dengan R-58 di Epic 5 Admin (filter state via URL, defense-in-depth validasi enum di Server Component). Query Supabase pakai `.range(offset, offset + 5)` (6 artikel per halaman per Epic Doc 2) — tidak butuh backend pagination logic karena Direct Supabase (AR-01).

### AR-08 — Kategori Artikel: 2 Nilai Tetap, Sama Persis Epic Doc 2

`category IN ('education', 'company_news')` — tidak ada deviasi di sini, dikonfirmasi konsisten dengan skema asli.

### AR-09 — Storage Bucket `article-thumbnails` Dibuat di Slice Ini Meski Belum Ada UI Upload

Bucket + RLS (public `SELECT`, admin-only `INSERT`/`UPDATE`/`DELETE` via service role) dibuat sekarang (`E6-S1-DB-03`) karena tabel `articles.thumbnail_url` butuh sumber gambar yang valid untuk seed data QA. Upload UI ada di Admin Panel epic masa depan — sampai saat itu, thumbnail diupload manual via Supabase Dashboard (pola sama seperti Epic 5 CF → Epic 5 Admin, di mana banyak field CRUD yang baru punya UI penuh belakangan).

---

## Ringkasan Task per Layer

| Layer | Jumlah Task | Prefix |
|---|---|---|
| UX | 3 | `E6-S1-UX` |
| User Stories | 3 | `E6-S1-US` |
| Database | 5 | `E6-S1-DB` |
| Data Access | 2 | `E6-S1-DA` |
| Contract (Types) | 1 | `E6-S1-CT` |
| Frontend Public | 9 | `E6-S1-FE` |
| QA | 5 | `E6-S1-QA` |
| **Total** | **28** | |

---

## Layer 1 — UX Tasks

### E6-S1-UX-01 — Wireframe `/artikel` (Daftar Artikel)

**Priority:** P0 · **Tags:** `wireframe` `public`

**Deliverable:** `docs/wireframes/Epic6_slice1_artikel-list.md`

**Struktur wireframe:**
```
┌─────────────────────────────────────────────────┐
│  <Navbar />                                     │
├─────────────────────────────────────────────────┤
│  <InnerPageHero                                 │  ← reuse Epic 2 Slice 2
│    title="Artikel & Berita"                     │
│    subtitle="Wawasan industri garam dan kabar    │
│              terbaru dari CV Reka Cipta"        │
│  />                                              │
├─────────────────────────────────────────────────┤
│  <CategoryTabs>                                  │
│    [ Semua ] [ Edukasi Garam ] [ Berita ]        │  ← tab aktif underline
│                                    Perusahaan     │     slide (Design System §10.6)
│  </CategoryTabs>                                 │
├─────────────────────────────────────────────────┤
│  <ArticleGrid>  (3 kolom desktop / 1 kolom mobile)│
│    ┌───────────┐ ┌───────────┐ ┌───────────┐    │
│    │[thumbnail]│ │[thumbnail]│ │[thumbnail]│    │
│    │[Edukasi]  │ │[Berita]   │ │[Edukasi]  │    │  ← badge kategori
│    │Judul...   │ │Judul...   │ │Judul...   │    │
│    │12 Jul 2026│ │10 Jul 2026│ │08 Jul 2026│    │
│    │Preview 2  │ │Preview 2  │ │Preview 2  │    │
│    │baris...   │ │baris...   │ │baris...   │    │
│    └───────────┘ └───────────┘ └───────────┘    │
│    ... (total maks 6 kartu per halaman)          │
│  </ArticleGrid>                                  │
├─────────────────────────────────────────────────┤
│  <Pagination>                                    │
│    [ ← Sebelumnya ]   Hal. 2 dari 3   [ Berikutnya → ] │
│  </Pagination>                                   │
├─────────────────────────────────────────────────┤
│  <Footer />                                      │
└─────────────────────────────────────────────────┘
```

**Empty state (0 artikel published — mungkin terjadi sebelum konten diisi via Admin Panel):**
```
┌─────────────────────────────────────────────────┐
│         [ikon BookOpen, neutral-300]             │
│      "Belum ada artikel yang dipublikasikan"     │
│   "Nantikan konten edukasi dan berita terbaru    │
│         dari CV Reka Cipta Indonesia"            │
└─────────────────────────────────────────────────┘
```

**Responsive:**
- Desktop (≥1024px): grid 3 kolom, gap 24px, container `max-w-7xl` (konsisten `ProductsPreview`)
- Tablet (768–1023px): grid 2 kolom
- Mobile (<768px): grid 1 kolom, `CategoryTabs` horizontal-scroll kalau overflow

**Verifikasi:** Wireframe committed.

---

### E6-S1-UX-02 — Wireframe `/artikel/[slug]` (Detail Artikel)

**Priority:** P0 · **Tags:** `wireframe` `public`

**Deliverable:** `docs/wireframes/Epic6_slice1_artikel-detail.md`

**Struktur wireframe:**
```
┌─────────────────────────────────────────────────┐
│  <Navbar />                                     │
├─────────────────────────────────────────────────┤
│  <ArticleBreadcrumb>                             │
│    Artikel & Berita / {judul artikel}            │
│  </ArticleBreadcrumb>                            │
├─────────────────────────────────────────────────┤
│  [ Thumbnail besar, full-width, aspect 16:9 ]    │
├─────────────────────────────────────────────────┤
│  [Badge: Edukasi Garam]                          │
│  # Judul Artikel (H1, text-4xl, ink-700)         │
│  📅 12 Juli 2026                                 │
├─────────────────────────────────────────────────┤
│  <ArticleContent>                                │
│    (HTML content, di-sanitize, prose-brand class)│  ← Design System .prose-brand
│    Paragraf... Heading H2/H3... List...          │
│  </ArticleContent>                               │
│  <ArticleViewTracker slug={slug} />               │  ← invisible, side-effect only
├─────────────────────────────────────────────────┤
│  <RelatedArticles category={category}>          │
│    "Artikel Terkait"                             │
│    [Card] [Card] [Card]  (3 kartu, kategori sama)│
│  </RelatedArticles>                              │
├─────────────────────────────────────────────────┤
│  <Footer />                                      │
└─────────────────────────────────────────────────┘
```

**404 state:** slug tidak ditemukan ATAU `is_published = false` → `notFound()` Next.js standar (bukan pesan custom — konsisten pola produk).

**Responsive:**
- Desktop: content `max-w-3xl` centered (lebar baca nyaman, ~65-75 karakter per baris)
- Mobile: full-width padding 16px, thumbnail tetap 16:9 tapi height menyesuaikan

**Verifikasi:** Wireframe committed.

---

### E6-S1-UX-03 — Spek Komponen `ArticleCard`

**Priority:** P0 · **Tags:** `wireframe` `component-spec`

`ArticleCard` dipakai di 3 tempat: `/artikel` (grid), `RelatedArticles` (detail page), dan homepage Slice 3 — jadi harus didesain generic dari awal, bukan dibuat khusus list lalu di-duplicate.

**Anatomi kartu:**
```
┌───────────────────────┐
│  [Thumbnail 16:9]      │  ← next/image, fill, object-cover
│  fallback: gradient +  │     bg-gradient-to-br from-brand-teal-50
│  ikon BookOpen         │     to-brand-teal-100 (pola sama ProductCard)
├───────────────────────┤
│ [Badge Edukasi/Berita] │  ← bg beda per kategori (lihat token di bawah)
│ Judul Artikel (2 baris │  ← text-lg font-semibold, line-clamp-2
│ max, line-clamp)       │
│ 📅 12 Juli 2026        │  ← text-xs text-neutral-500, date-fns locale id
│ Preview teks dari      │  ← text-sm text-neutral-600, line-clamp-2
│ meta_description...    │
└───────────────────────┘
```

**Token badge kategori (baru, belum ada di Design System — proposal, cite §2.6 semantic pattern):**
| Kategori | Background | Text |
|---|---|---|
| `education` (Edukasi Garam) | `brand-teal-50` | `brand-teal-700` |
| `company_news` (Berita Perusahaan) | `sand-100` | `sand-700` |

Rasional: edukasi pakai warna brand utama (konten evergreen, identitas inti), berita perusahaan pakai warm sand accent (konsisten §2.4 — sand dipakai untuk "highlights, aksen" dan section yang lebih personal/human, cocok untuk berita seputar perusahaan).

**Hover:** seluruh kartu adalah `<Link>` (pola `ProductCard`), pakai `card-hover-lift` class. **Catatan:** class ini saat ini tidak punya definisi CSS aktif di `globals.css`/`tailwind.config.ts` (dead utility — juga dipakai di `ProductCard`/`IndustriesGrid` tanpa efek visual). Tetap dipakai di sini untuk **konsistensi kelas markup** dengan komponen kartu lain, bukan untuk mengharapkan efek — bukan scope slice ini untuk memperbaiki utility yang hilang (di luar batas kerja, laporkan terpisah ke Jazil kalau perlu diperbaiki lintas komponen).

**Verifikasi:** Spek committed, ditinjau ulang saat FE-02 implementasi.

---

## Layer 2 — User Stories

### E6-S1-US-01 — Calon Mitra Membaca Artikel Edukasi Sebelum RFQ

**As** calon mitra industri yang riset sebelum menghubungi sales,
**I want** membaca artikel edukasi tentang jenis garam dan standar SNI,
**So that** saya lebih paham kebutuhan saya sebelum mengisi form RFQ.

**Acceptance:**
- Artikel kategori "Edukasi Garam" accessible tanpa login
- Konten lengkap terbaca (bukan preview terpotong)
- Tidak ada CTA agresif yang mengganggu membaca (link ke RFQ ada, tapi tidak modal/popup)

---

### E6-S1-US-02 — Pengunjung Filter Artikel Berdasarkan Kategori

**As** pengunjung yang cari konten spesifik,
**I want** filter artikel antara "Edukasi Garam" dan "Berita Perusahaan",
**So that** saya tidak perlu scroll semua artikel untuk temukan yang relevan.

**Acceptance:**
- Klik tab kategori → grid update, URL berubah (`?category=education`)
- Refresh halaman dengan URL ber-filter → filter tetap aktif
- Filter tidak valid di URL (`?category=hacked`) → default ke semua (defense in depth, AR-07)

---

### E6-S1-US-03 — Pengunjung Membaca Artikel Lengkap dengan URL yang Bisa Dibagikan

**As** pengunjung yang ingin share artikel ke rekan kerja,
**I want** URL artikel yang bersih dan SEO-friendly (`/artikel/manfaat-garam-industri`),
**So that** link yang saya share terlihat profesional dan mudah diingat.

**Acceptance:**
- URL pakai slug, bukan UUID
- Meta tag OG lengkap (title, description, image) — preview link di WhatsApp/social media menampilkan thumbnail dan judul yang benar
- Artikel yang di-unpublish tidak lagi accessible (404), meski link lama sudah beredar

---

## Layer 3 — Engineering

### 3a. Database

#### E6-S1-DB-01 — Migration Create Table `articles`

**Priority:** P0 · **Tags:** `migration` `database`

**File:** `supabase/migrations/20260716090000_create_articles_table.sql`

**Schema:**
```sql
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    thumbnail_url TEXT,
    meta_description VARCHAR(300),
    view_count INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT articles_category_check
        CHECK (category IN ('education', 'company_news')),
    CONSTRAINT articles_view_count_check
        CHECK (view_count >= 0)
);

CREATE INDEX idx_articles_slug ON public.articles(slug);
CREATE INDEX idx_articles_published ON public.articles(is_published, published_at DESC)
    WHERE is_published = TRUE;
CREATE INDEX idx_articles_category ON public.articles(category) WHERE is_published = TRUE;
CREATE INDEX idx_articles_view_count ON public.articles(view_count DESC) WHERE is_published = TRUE;

CREATE TRIGGER trigger_articles_set_updated_at
    BEFORE UPDATE ON public.articles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

**Catatan penting:**
- `view_count` **bukan** bagian skema Epic Doc 2 asli — lihat AR-06 untuk justifikasi.
- `thumbnail_url` dan `meta_description` nullable — artikel bisa disimpan draft tanpa keduanya lengkap (Admin Panel epic akan handle validasi "wajib sebelum publish" di layer form, bukan constraint DB — analog dengan pola `SupplierRegisterRequest` optional fields).
- Trigger `set_updated_at` reuse function yang sudah ada dari Epic 3 (`public.set_updated_at()`) — jangan buat ulang function, cukup reference.
- Index parsial (`WHERE is_published = TRUE`) untuk 3 index terakhir — query publik selalu filter `is_published = TRUE`, index parsial lebih kecil dan efisien daripada index penuh.

**Verifikasi:**
```sql
INSERT INTO public.articles (title, slug, category, content, meta_description, is_published, published_at)
VALUES ('Manfaat Garam Industri', 'manfaat-garam-industri', 'education', '<p>Test</p>', 'Test description', TRUE, NOW());
SELECT * FROM articles LIMIT 1;
-- Expected: 1 row, view_count = 0, created_at + updated_at populated
```

---

#### E6-S1-DB-02 — Migration RLS `articles`

**Priority:** P0 · **Tags:** `migration` `database` `security`

**File:** `supabase/migrations/20260716090001_articles_rls.sql`

```sql
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Public: hanya boleh SELECT artikel yang published
CREATE POLICY "Public can read published articles"
    ON public.articles FOR SELECT
    TO anon, authenticated
    USING (is_published = TRUE);

-- Admin (service role dipakai FastAPI/Admin Panel masa depan): full access
-- Tidak ada policy INSERT/UPDATE/DELETE untuk anon/authenticated —
-- write hanya lewat service_role key (bypass RLS) di Admin Panel epic mendatang,
-- ATAU lewat RPC function increment_article_view (SECURITY DEFINER, lihat DB-04)
-- untuk kolom view_count secara spesifik.
```

**Verifikasi (WAJIB dijalankan manual oleh Jazil, sama pola Gate RLS di epic-epic sebelumnya):**
```sql
SET ROLE anon;
SELECT * FROM articles WHERE is_published = FALSE LIMIT 1;
-- Expected: 0 rows (artikel draft tidak boleh terbaca anon)

UPDATE articles SET view_count = 999 WHERE slug = 'manfaat-garam-industri';
-- Expected: ERROR — permission denied / 0 rows affected (anon tidak punya UPDATE)

RESET ROLE;
```

---

#### E6-S1-DB-03 — Migration Storage Bucket `article-thumbnails`

**Priority:** P0 · **Tags:** `migration` `storage`

**File:** `supabase/migrations/20260716090002_create_article_thumbnails_bucket.sql`

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-thumbnails', 'article-thumbnails', TRUE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read article thumbnails"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'article-thumbnails');

-- Tidak ada policy INSERT/UPDATE/DELETE untuk anon/authenticated.
-- Upload dilakukan admin via service_role key (Admin Panel epic mendatang)
-- atau manual via Supabase Dashboard sampai saat itu.
```

**Catatan:** pola identik `product-photos` bucket (Epic 3 DB-xx) — public read, admin-only write via service role.

**Verifikasi:** Upload 1 file test manual via Supabase Dashboard ke bucket `article-thumbnails`, akses public URL-nya di browser tanpa auth → harus bisa diakses.

---

#### E6-S1-DB-04 — Migration RPC Function `increment_article_view`

**Priority:** P0 · **Tags:** `migration` `database` `security`

**File:** `supabase/migrations/20260716090003_articles_increment_view_rpc.sql`

```sql
CREATE OR REPLACE FUNCTION public.increment_article_view(p_slug TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.articles
    SET view_count = view_count + 1
    WHERE slug = p_slug AND is_published = TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_article_view(TEXT) TO anon, authenticated;
```

**Catatan penting (lihat AR-03):**
- `SECURITY DEFINER` — function berjalan dengan hak pemilik function (biasanya `postgres`/owner), bukan hak pemanggil (`anon`). Ini yang memungkinkan `anon` menaikkan `view_count` tanpa punya hak `UPDATE` langsung di tabel (RLS di DB-02 tetap menolak `UPDATE` langsung dari `anon`).
- `SET search_path = public` — wajib untuk function `SECURITY DEFINER`, mencegah search-path hijacking attack (praktik keamanan standar Postgres, bukan opsional).
- Filter `AND is_published = TRUE` di dalam function — mencegah increment ke artikel draft/unpublished (kalaupun slug-nya "ditebak").
- Tidak ada return value berarti (VOID) — client tidak perlu tunggu response untuk update UI, panggilan bisa "fire and forget".

**Verifikasi:**
```sql
SELECT public.increment_article_view('manfaat-garam-industri');
SELECT view_count FROM articles WHERE slug = 'manfaat-garam-industri';
-- Expected: view_count = 1

SET ROLE anon;
SELECT public.increment_article_view('manfaat-garam-industri');
RESET ROLE;
SELECT view_count FROM articles WHERE slug = 'manfaat-garam-industri';
-- Expected: view_count = 2 (anon BISA execute function ini meski tidak bisa UPDATE langsung)
```

---

#### E6-S1-DB-05 — Seed Data Artikel untuk QA & Dev

**Priority:** P0 · **Tags:** `seed` `qa`

**Bukan file migration** — dijalankan manual via Supabase Dashboard SQL Editor (seed data, bukan schema change, konsisten pola seed supplier di Epic 5 Phase 1).

Minimal 6 artikel (untuk test pagination 6/halaman — butuh >6 supaya halaman 2 muncul), campuran kategori, beberapa dengan `view_count` berbeda-beda untuk test sorting "terbanyak dilihat" di Slice 3:

```sql
INSERT INTO public.articles (title, slug, category, content, meta_description, thumbnail_url, view_count, is_published, published_at)
VALUES
  ('Mengenal Standar SNI untuk Garam Industri', 'standar-sni-garam-industri', 'education',
   '<p>Konten edukasi lengkap tentang SNI...</p>', 'Panduan lengkap memahami standar SNI garam untuk kebutuhan industri Anda.',
   NULL, 45, TRUE, NOW() - INTERVAL '10 days'),
  ('5 Jenis Garam dan Kegunaannya di Industri', 'jenis-garam-dan-kegunaannya', 'education',
   '<p>Konten edukasi jenis garam...</p>', 'Kenali 5 jenis garam yang kami distribusikan dan industri yang cocok untuk masing-masing.',
   NULL, 120, TRUE, NOW() - INTERVAL '8 days'),
  ('CV Reka Cipta Hadir di Pameran Industri Surabaya', 'hadir-di-pameran-industri-surabaya', 'company_news',
   '<p>Konten berita pameran...</p>', 'Tim kami berpartisipasi dalam pameran industri untuk memperluas jaringan mitra.',
   NULL, 30, TRUE, NOW() - INTERVAL '5 days'),
  ('Kemitraan Baru dengan Petani Garam Sumenep', 'kemitraan-baru-petani-garam-sumenep', 'company_news',
   '<p>Konten berita kemitraan...</p>', 'Kami menyambut mitra supplier baru dari Sumenep, Jawa Timur.',
   NULL, 80, TRUE, NOW() - INTERVAL '3 days'),
  ('Cara Memilih Garam yang Tepat untuk Water Treatment', 'cara-memilih-garam-water-treatment', 'education',
   '<p>Konten edukasi water treatment...</p>', 'Panduan memilih spesifikasi garam yang sesuai untuk kebutuhan pengolahan air.',
   NULL, 200, TRUE, NOW() - INTERVAL '2 days'),
  ('Proses Distribusi Garam dari Tambak ke Pabrik', 'proses-distribusi-garam-tambak-ke-pabrik', 'education',
   '<p>Konten edukasi proses distribusi...</p>', 'Simak bagaimana garam berkualitas sampai ke tangan mitra industri kami.',
   NULL, 15, TRUE, NOW() - INTERVAL '1 day'),
  ('Artikel Draft — Belum Siap Publish', 'draft-belum-siap-publish', 'education',
   '<p>Draft...</p>', 'Draft artikel untuk test is_published = false.',
   NULL, 0, FALSE, NULL);
```

**Catatan:** `thumbnail_url` sengaja `NULL` di seed ini — supaya `ArticleCard` fallback state (gradient + ikon `BookOpen`) tervalidasi. Kalau ingin test dengan thumbnail asli, upload manual dulu via Dashboard (DB-03) lalu update `thumbnail_url` ke public URL-nya.

**Verifikasi:** `SELECT COUNT(*) FROM articles WHERE is_published = TRUE;` → Expected: 6 (7 baris total, 1 draft).

---

### 3b. Data Access (Direct Supabase — Pengganti Layer "Backend", lihat AR-01)

#### E6-S1-DA-01 — `lib/data/articles.ts`: Fungsi Query Terpusat

**Priority:** P0 · **Tags:** `data-access` `shared`

**File:** `lib/data/articles.ts` (folder baru — belum ada `lib/data/` di proyek, tapi ini pola yang tepat untuk query Supabase yang dipakai lintas halaman/slice, mencegah duplikasi `createPublic().from('articles')...` di 4+ tempat berbeda seperti yang terjadi kalau masing-masing page.tsx menulis query sendiri)

```typescript
import { createPublic } from '@/lib/supabase/public'
import { mapArticleRow } from '@/lib/article-mapper'
import type { Article, ArticleCategory, ArticleRow } from '@/types/api'

const ARTICLES_PER_PAGE = 6

interface GetPublishedArticlesParams {
  category?: ArticleCategory
  page?: number
}

interface GetPublishedArticlesResult {
  articles: Article[]
  total: number
  totalPages: number
}

export async function getPublishedArticles(
  params: GetPublishedArticlesParams = {}
): Promise<GetPublishedArticlesResult> {
  const page = params.page && params.page > 0 ? params.page : 1
  const from = (page - 1) * ARTICLES_PER_PAGE
  const to = from + ARTICLES_PER_PAGE - 1

  try {
    const supabase = createPublic()
    let query = supabase
      .from('articles')
      .select('*', { count: 'exact' })
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .range(from, to)

    if (params.category) {
      query = query.eq('category', params.category)
    }

    const { data, error, count } = await query

    if (error || !data) {
      console.error('[Articles] Gagal fetch published articles:', error?.message)
      return { articles: [], total: 0, totalPages: 0 }
    }

    const total = count ?? 0
    return {
      articles: data.map((row) => mapArticleRow(row as ArticleRow)),
      total,
      totalPages: Math.max(1, Math.ceil(total / ARTICLES_PER_PAGE)),
    }
  } catch (err) {
    console.error('[Articles] Exception saat fetch published articles:', err)
    return { articles: [], total: 0, totalPages: 0 }
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const supabase = createPublic()
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .limit(1)
      .maybeSingle()

    if (error || !data) return null
    return mapArticleRow(data as ArticleRow)
  } catch (err) {
    console.error('[Articles] Exception saat fetch article by slug:', err)
    return null
  }
}

export async function getLatestArticles(limit = 3): Promise<Article[]> {
  try {
    const supabase = createPublic()
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error || !data) return []
    return data.map((row) => mapArticleRow(row as ArticleRow))
  } catch (err) {
    console.error('[Articles] Exception saat fetch latest articles:', err)
    return []
  }
}

export async function getMostViewedArticles(limit = 3): Promise<Article[]> {
  try {
    const supabase = createPublic()
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('is_published', true)
      .order('view_count', { ascending: false })
      .limit(limit)

    if (error || !data) return []
    return data.map((row) => mapArticleRow(row as ArticleRow))
  } catch (err) {
    console.error('[Articles] Exception saat fetch most viewed articles:', err)
    return []
  }
}

export async function getRelatedArticles(
  category: ArticleCategory,
  excludeSlug: string,
  limit = 3
): Promise<Article[]> {
  try {
    const supabase = createPublic()
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('is_published', true)
      .eq('category', category)
      .neq('slug', excludeSlug)
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error || !data) return []
    return data.map((row) => mapArticleRow(row as ArticleRow))
  } catch (err) {
    console.error('[Articles] Exception saat fetch related articles:', err)
    return []
  }
}
```

**Catatan pattern:** setiap fungsi mengikuti try/catch → `console.error` → fallback kosong yang identik dengan `getProductsPreview`/`getCompanySettings` di `app/(public)/page.tsx`. `getLatestArticles` dan `getMostViewedArticles` adalah fungsi yang akan dikonsumsi langsung oleh Slice 3 (homepage) — **dependency eksplisit**, jangan ubah signature-nya tanpa cek pemakaian di Slice 3.

**Verifikasi:** Manual test tiap fungsi dari file test sementara atau langsung dari `page.tsx` saat FE-05/FE-08 diimplementasi.

---

#### E6-S1-DA-02 — `lib/article-mapper.ts` + `lib/article-content.ts`: Row Mapper, Sanitasi, Excerpt Fallback

**Priority:** P0 · **Tags:** `data-access` `security`

**File 1 — `lib/article-mapper.ts`** (pola identik `lib/product-mapper.ts`):
```typescript
import type { Article, ArticleRow } from '@/types/api'

export function mapArticleRow(row: ArticleRow): Article {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    category: row.category,
    content: row.content,
    thumbnail_url: row.thumbnail_url,
    meta_description: row.meta_description,
    view_count: row.view_count,
    published_at: row.published_at,
  }
}
```

**File 2 — `lib/article-content.ts`:**
```typescript
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeArticleContent(rawHtml: string): string {
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: ['p', 'h2', 'h3', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'img', 'br', 'blockquote'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'target', 'rel'],
  })
}

export function getArticleExcerpt(article: { meta_description: string | null; content: string }): string {
  if (article.meta_description) return article.meta_description

  const plainText = article.content.replace(/<[^>]*>/g, '').trim()
  if (plainText.length <= 160) return plainText

  const truncated = plainText.slice(0, 160)
  const lastSpace = truncated.lastIndexOf(' ')
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : 160)}…`
}
```

**Catatan penting (lihat AR-05):**
- `ALLOWED_TAGS`/`ALLOWED_ATTR` whitelist eksplisit — bukan default DOMPurify config. Ini sengaja ketat: rich text editor (Admin Panel epic mendatang) direncanakan output Tiptap/Quill standar (paragraf, heading, bold/italic, list, link, image) — tidak butuh `<script>`, `<iframe>`, `<style>`, atau atribut event handler (`onclick`, dll) yang notabene sudah otomatis di-strip DOMPurify, tapi whitelist eksplisit adalah defense-in-depth kedua.
- `sanitizeArticleContent` dipanggil di `E6-S1-FE-08` (halaman detail) sebelum `dangerouslySetInnerHTML` — **jangan pernah render `article.content` mentah tanpa lewat fungsi ini.**
- `getArticleExcerpt` implementasi AR-04 (fallback kalau `meta_description` kosong).

**Verifikasi:**
```typescript
// Manual test:
sanitizeArticleContent('<p>Aman</p><script>alert(1)</script>')
// Expected: '<p>Aman</p>' (script tag hilang)

sanitizeArticleContent('<p onclick="alert(1)">Klik</p>')
// Expected: '<p>Klik</p>' (atribut onclick hilang)
```

---

### 3c. Contract (Types)

#### E6-S1-CT-01 — `types/api.ts` Append Article Types

**Priority:** P0 · **Tags:** `contract` `types`

**File:** `types/api.ts` (append di akhir file, ikuti pola banner comment `// === Epic N ... ===` seperti blok Supplier yang sudah ada)

```typescript
// === Epic 6 Slice 1: Artikel & Berita (E6-S1-CT-01) ===

export type ArticleCategory = 'education' | 'company_news'

export interface ArticleRow {
  id: string
  title: string
  slug: string
  category: ArticleCategory
  content: string
  thumbnail_url: string | null
  meta_description: string | null
  view_count: number
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface Article {
  id: string
  title: string
  slug: string
  category: ArticleCategory
  content: string
  thumbnail_url: string | null
  meta_description: string | null
  view_count: number
  published_at: string | null
}
```

**Catatan:**
- `ArticleRow` = bentuk mentah row Supabase (semua kolom, termasuk `is_published`/`created_at`/`updated_at` yang tidak perlu di frontend publik). `Article` = bentuk yang dipakai komponen (subset, sudah "dipetakan" via `mapArticleRow`) — pola identik `ProductRow`/`Product`.
- Hapus placeholder comment lama di baris ~46 (`// Epic 6: Article, ArticleCreate, ArticleUpdate`) yang menunjuk ke sini — sudah terisi. `ArticleCreate`/`ArticleUpdate` **belum** dibuat di sini karena itu kebutuhan form Admin Panel (epic terpisah, masa depan) — jangan buat types yang belum ada konsumennya (YAGNI).

**Verifikasi:** `npx tsc --noEmit` — no errors.

---

### 3d. Frontend Public

#### E6-S1-FE-01 — Install `isomorphic-dompurify`

**Priority:** P0 · **Tags:** `dependency`

```bash
npm install isomorphic-dompurify
```

**Verifikasi:** `npm list isomorphic-dompurify` menunjukkan versi terinstal, `import DOMPurify from 'isomorphic-dompurify'` tidak error di build.

---

#### E6-S1-FE-02 — `components/blocks/ArticleCard.tsx`

**Priority:** P0 · **Tags:** `component` `public`

**File:** `components/blocks/ArticleCard.tsx` (folder `components/blocks/` sudah dipakai `ProductCard.tsx` — konsisten lokasi untuk kartu konten reusable lintas section)

```tsx
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen } from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { getArticleExcerpt } from '@/lib/article-content'
import type { Article } from '@/types/api'

const CATEGORY_LABEL: Record<Article['category'], string> = {
  education: 'Edukasi Garam',
  company_news: 'Berita Perusahaan',
}

const CATEGORY_BADGE_CLASS: Record<Article['category'], string> = {
  education: 'bg-brand-teal-50 text-brand-teal-700',
  company_news: 'bg-sand-100 text-sand-700',
}

export function ArticleCard({ article }: { article: Article }) {
  const excerpt = getArticleExcerpt(article)
  const dateLabel = article.published_at
    ? format(new Date(article.published_at), 'd MMMM yyyy', { locale: idLocale })
    : null

  return (
    <Link
      href={`/artikel/${article.slug}`}
      className="card-hover-lift group block overflow-hidden rounded-lg border border-neutral-200 bg-white"
    >
      <div className="relative aspect-video overflow-hidden bg-neutral-100">
        {article.thumbnail_url ? (
          <Image
            src={article.thumbnail_url}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 90vw, (max-width: 1024px) 45vw, 30vw"
            className="object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-teal-50 to-brand-teal-100">
            <BookOpen className="h-10 w-10 text-brand-teal-400" strokeWidth={1.5} />
          </div>
        )}
      </div>
      <div className="space-y-2 p-4">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_BADGE_CLASS[article.category]}`}
        >
          {CATEGORY_LABEL[article.category]}
        </span>
        <h3 className="line-clamp-2 text-lg font-semibold text-neutral-900">{article.title}</h3>
        {dateLabel && <p className="text-xs text-neutral-500">{dateLabel}</p>}
        <p className="line-clamp-2 text-sm text-neutral-600">{excerpt}</p>
      </div>
    </Link>
  )
}
```

**Verifikasi:** Render dengan artikel ber-thumbnail dan tanpa thumbnail (seed DB-05 sengaja punya keduanya nanti setelah upload manual test) → kedua state visual benar.

---

#### E6-S1-FE-03 — `components/article/CategoryTabs.tsx`

**Priority:** P0 · **Tags:** `component` `public`

**File:** `components/article/CategoryTabs.tsx` — pola tab-underline-slide (Design System §10.6), analog `CategoryFilterTabs` Epic 3 tapi untuk 3 opsi tetap (Semua/Edukasi/Berita), bukan dinamis dari DB.

```tsx
'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { ArticleCategory } from '@/types/api'

const TABS: Array<{ value: ArticleCategory | 'all'; label: string }> = [
  { value: 'all', label: 'Semua' },
  { value: 'education', label: 'Edukasi Garam' },
  { value: 'company_news', label: 'Berita Perusahaan' },
]

export function CategoryTabs() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeCategory = searchParams.get('category') ?? 'all'

  function handleTabClick(value: string) {
    const params = new URLSearchParams(searchParams)
    if (value === 'all') {
      params.delete('category')
    } else {
      params.set('category', value)
    }
    params.delete('page') // reset ke halaman 1 saat ganti kategori
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <div className="relative flex gap-6 border-b border-neutral-200">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => handleTabClick(tab.value)}
          className={`relative pb-3 text-sm font-medium transition-colors ${
            activeCategory === tab.value ? 'text-brand-teal-700' : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          {tab.label}
          {activeCategory === tab.value && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-teal-600" />
          )}
        </button>
      ))}
    </div>
  )
}
```

**Catatan:** komponen ini `'use client'` dan memakai `useSearchParams()` langsung (bukan pola `useSyncExternalStore` yang dipakai `RFQForm`/`ContactForm`) — **ini boleh** karena `CategoryTabs` sendiri memang kecil dan dirender di dalam halaman yang *sudah* menerima `searchParams` sebagai prop dari Server Component induknya (`FE-05`); tidak seperti `RFQForm` yang perlu seluruh form tetap statis. Kalau `CategoryTabs` bikin bagian ini jadi Client Component, itu tidak apa — hanya sub-tree tab yang jadi dynamic, bukan seluruh grid artikel (grid tetap dirender Server Component di induknya).

**Verifikasi:** Klik tab → URL berubah, grid update. Refresh dengan `?category=education` → tab "Edukasi Garam" aktif dari awal render.

---

#### E6-S1-FE-04 — `components/article/ArticlePagination.tsx`

**Priority:** P1 · **Tags:** `component` `public`

```tsx
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  currentPage: number
  totalPages: number
  buildHref: (page: number) => string
}

export function ArticlePagination({ currentPage, totalPages, buildHref }: Props) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-4 py-8">
      <Link
        href={buildHref(currentPage - 1)}
        aria-disabled={currentPage <= 1}
        className={`link-arrow inline-flex items-center gap-1 text-sm font-medium ${
          currentPage <= 1 ? 'pointer-events-none text-neutral-300' : 'text-brand-teal-600'
        }`}
      >
        <ChevronLeft className="arrow-icon h-4 w-4" />
        Sebelumnya
      </Link>
      <span className="text-sm text-neutral-500">
        Halaman {currentPage} dari {totalPages}
      </span>
      <Link
        href={buildHref(currentPage + 1)}
        aria-disabled={currentPage >= totalPages}
        className={`link-arrow inline-flex items-center gap-1 text-sm font-medium ${
          currentPage >= totalPages ? 'pointer-events-none text-neutral-300' : 'text-brand-teal-600'
        }`}
      >
        Berikutnya
        <ChevronRight className="arrow-icon h-4 w-4" />
      </Link>
    </div>
  )
}
```

**Verifikasi:** Di halaman 1 → tombol "Sebelumnya" disabled. Di halaman terakhir → tombol "Berikutnya" disabled. Klik tombol aktif → URL `?page=N` berubah, grid update ke set artikel yang benar.

---

#### E6-S1-FE-05 — `app/(public)/artikel/page.tsx`

**Priority:** P0 · **Tags:** `page` `public`

```tsx
import type { Metadata } from 'next'
import { InnerPageHero } from '@/components/sections/InnerPageHero'
import { CategoryTabs } from '@/components/article/CategoryTabs'
import { ArticleCard } from '@/components/blocks/ArticleCard'
import { ArticlePagination } from '@/components/article/ArticlePagination'
import { getPublishedArticles } from '@/lib/data/articles'
import type { ArticleCategory } from '@/types/api'

export const revalidate = 300 // ISR — konsisten CLAUDE.md "/artikel list: ISR revalidate 300"

export const metadata: Metadata = {
  title: 'Artikel & Berita | CV Reka Cipta Indonesia',
  description: 'Wawasan industri garam, standar SNI, dan kabar terbaru dari CV Reka Cipta Indonesia.',
}

const VALID_CATEGORIES: ArticleCategory[] = ['education', 'company_news']

interface Props {
  searchParams: Promise<{ category?: string; page?: string }>
}

export default async function ArtikelListPage({ searchParams }: Props) {
  const params = await searchParams

  // Defense in depth — konsisten pola R-58 Epic 5 Admin
  const validCategory: ArticleCategory | undefined = VALID_CATEGORIES.includes(
    params.category as ArticleCategory
  )
    ? (params.category as ArticleCategory)
    : undefined

  const pageNum = Number(params.page)
  const validPage = Number.isInteger(pageNum) && pageNum > 0 ? pageNum : 1

  const { articles, totalPages } = await getPublishedArticles({
    category: validCategory,
    page: validPage,
  })

  function buildHref(page: number) {
    const qs = new URLSearchParams()
    if (validCategory) qs.set('category', validCategory)
    if (page > 1) qs.set('page', String(page))
    const query = qs.toString()
    return `/artikel${query ? `?${query}` : ''}`
  }

  return (
    <main>
      <InnerPageHero
        title="Artikel & Berita"
        subtitle="Wawasan industri garam dan kabar terbaru dari CV Reka Cipta Indonesia"
      />
      <section className="mx-auto max-w-7xl px-4 py-12">
        <CategoryTabs />
        {articles.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
        <ArticlePagination currentPage={validPage} totalPages={totalPages} buildHref={buildHref} />
      </section>
    </main>
  )
}

function EmptyState() {
  return (
    <div className="py-16 text-center text-neutral-500">
      <p className="text-lg font-medium">Belum ada artikel yang dipublikasikan</p>
      <p className="mt-1 text-sm">
        Nantikan konten edukasi dan berita terbaru dari CV Reka Cipta Indonesia
      </p>
    </div>
  )
}
```

**Catatan:** `searchParams` di-`await` (pola Next.js 15, sama seperti Epic 5 Admin `SuppliersListPage`). Karena halaman ini baca `searchParams`, ia otomatis jadi dynamic per kombinasi query string — tapi `revalidate = 300` tetap berlaku per variant URL unik (Next.js men-cache tiap kombinasi `?category=&page=` secara terpisah, di-refresh tiap 300 detik), konsisten dengan CLAUDE.md.

**Verifikasi:** `/artikel` render 6 kartu (dari 6 published seed). `/artikel?category=education` filter ke edukasi saja. `/artikel?page=2` (kalau seed >6) tampilkan sisa artikel.

---

#### E6-S1-FE-06 — `components/article/RelatedArticles.tsx`

**Priority:** P1 · **Tags:** `component` `public`

```tsx
import { ArticleCard } from '@/components/blocks/ArticleCard'
import { getRelatedArticles } from '@/lib/data/articles'
import type { ArticleCategory } from '@/types/api'

interface Props {
  category: ArticleCategory
  excludeSlug: string
}

export async function RelatedArticles({ category, excludeSlug }: Props) {
  const related = await getRelatedArticles(category, excludeSlug, 3)

  if (related.length === 0) return null

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <h2 className="mb-6 text-2xl font-bold text-ink-700">Artikel Terkait</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {related.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  )
}
```

**Catatan:** `async` Server Component langsung (bukan props dari parent) — pola ini valid di Next.js App Router (async component dipanggil sebagai child biasa), memisahkan concern fetch related dari `page.tsx` utama supaya tidak membengkakkan satu file.

**Verifikasi:** Jika hanya ada 1 artikel dalam kategori tersebut (artikel itu sendiri), section tidak muncul sama sekali (bukan grid kosong).

---

#### E6-S1-FE-07 — `components/article/ArticleViewTracker.tsx`

**Priority:** P0 · **Tags:** `component` `client` `analytics`

**File:** `components/article/ArticleViewTracker.tsx`

```tsx
'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const SESSION_KEY_PREFIX = 'article-viewed:'

export function ArticleViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const sessionKey = `${SESSION_KEY_PREFIX}${slug}`
    if (sessionStorage.getItem(sessionKey)) return

    sessionStorage.setItem(sessionKey, '1')

    const supabase = createClient()
    supabase.rpc('increment_article_view', { p_slug: slug }).then(({ error }) => {
      if (error) console.error('[ArticleViewTracker] Gagal increment view:', error.message)
    })
  }, [slug])

  return null
}
```

**Catatan (lihat AR-03):**
- Komponen ini tidak render apa pun (`return null`) — murni side-effect. Ditempatkan di dalam halaman detail (`FE-08`).
- `sessionStorage` guard mencegah refresh berulang dalam satu sesi tab browser menaikkan `view_count` berkali-kali. **Bukan** proteksi kuat (lihat AR-03) — cukup untuk metrik engagement lunak.
- Memakai `lib/supabase/client.ts` (`createClient()` browser client) — bukan `lib/supabase/public.ts` (yang untuk Server Component). Konsisten pola: Client Component pakai `client.ts`, Server Component pakai `public.ts`/`server.ts`.

**Verifikasi:** Buka artikel di tab baru → `view_count` naik 1 (cek via query manual atau lewat homepage Slice 3 kalau sudah ada). Refresh halaman yang sama → `view_count` **tidak** naik lagi. Buka di incognito/tab baru → naik lagi (expected, sesuai batas desain AR-03).

---

#### E6-S1-FE-08 — `app/(public)/artikel/[slug]/page.tsx`

**Priority:** P0 · **Tags:** `page` `public` `seo`

```tsx
import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { getArticleBySlug } from '@/lib/data/articles'
import { sanitizeArticleContent } from '@/lib/article-content'
import { createPublic } from '@/lib/supabase/public'
import { ArticleViewTracker } from '@/components/article/ArticleViewTracker'
import { RelatedArticles } from '@/components/article/RelatedArticles'
import type { Article } from '@/types/api'

export const revalidate = 3600
// dynamicParams TIDAK di-set false (default true) — lihat AR-02: artikel baru
// pasca-deploy via Admin Panel epic mendatang harus tetap accessible via
// on-demand ISR fallback, berbeda sengaja dari pola /produk/[slug].

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const supabase = createPublic()
  const { data } = await supabase.from('articles').select('slug').eq('is_published', true)
  return (data ?? []).map((row) => ({ slug: row.slug as string }))
}

const getArticle = cache(async (slug: string): Promise<Article | null> => getArticleBySlug(slug))

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)

  if (!article) {
    return { title: 'Artikel tidak ditemukan | CV Reka Cipta Indonesia' }
  }

  const description = article.meta_description ?? undefined

  return {
    title: `${article.title} | CV Reka Cipta Indonesia`,
    description,
    openGraph: {
      title: article.title,
      description,
      type: 'article',
      images: article.thumbnail_url ? [{ url: article.thumbnail_url }] : undefined,
    },
  }
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = await getArticle(slug)

  if (!article) notFound()

  const sanitizedContent = sanitizeArticleContent(article.content)
  const dateLabel = article.published_at
    ? format(new Date(article.published_at), 'd MMMM yyyy', { locale: idLocale })
    : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    image: article.thumbnail_url ?? undefined,
    datePublished: article.published_at ?? undefined,
    description: article.meta_description ?? undefined,
    author: { '@type': 'Organization', name: 'CV Reka Cipta Indonesia' },
    publisher: { '@type': 'Organization', name: 'CV Reka Cipta Indonesia' },
  }

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticleViewTracker slug={article.slug} />
      {article.thumbnail_url && (
        <div className="relative aspect-[21/9] w-full bg-neutral-100">
          <Image src={article.thumbnail_url} alt={article.title} fill className="object-cover" priority />
        </div>
      )}
      <article className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-4xl font-bold text-ink-700">{article.title}</h1>
        {dateLabel && <p className="mt-2 text-sm text-neutral-500">{dateLabel}</p>}
        <div
          className="prose-brand mt-8"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
      </article>
      <RelatedArticles category={article.category} excludeSlug={article.slug} />
    </main>
  )
}
```

**Catatan:**
- `dangerouslySetInnerHTML` hanya dipakai dengan `sanitizedContent` yang sudah lewat `sanitizeArticleContent` — **tidak pernah** `article.content` mentah (AR-05).
- `prose-brand` class dari `globals.css` (frozen file, sudah ada — dipakai untuk styling konten rich text, lihat `CLAUDE.md`: "`.prose-brand` — Tailwind Typography override for articles").
- JSON-LD `@type: Article` — memenuhi requirement PRD §6.4 ("JSON-LD structured data untuk artikel").
- Breadcrumb (dari wireframe UX-02) sengaja tidak dimasukkan kode di atas untuk keringkasan — implementasikan sebagai komponen kecil terpisah `ArticleBreadcrumb.tsx` mengikuti pola `ProductBreadcrumb.tsx`, ditambahkan di atas `<article>`.

**Verifikasi:**
- `/artikel/standar-sni-garam-industri` render lengkap, thumbnail, tanggal, konten, related articles.
- `/artikel/slug-tidak-ada` → 404.
- `/artikel/draft-belum-siap-publish` (draft dari seed) → 404 (bukan 200 dengan konten draft bocor).
- View source → `<title>`, `<meta name="description">`, OG tags, `<script type="application/ld+json">` semua terisi.

---

#### E6-S1-FE-09 — Update `sitemap.xml` untuk Sertakan Slug Artikel

**Priority:** P1 · **Tags:** `seo`

**File:** cari file sitemap generator yang sudah ada (kemungkinan `app/sitemap.ts` — pola Next.js App Router built-in sitemap; cek dulu apakah sudah ada dari Epic 3, karena `revalidatePath('/sitemap.xml')` sudah dipanggil di `app/actions/products.ts`).

Tambahkan entries untuk tiap artikel published, mengikuti pola entries produk yang sudah ada:
```typescript
const articles = await getPublishedArticlesForSitemap() // semua published, tanpa pagination
const articleEntries = articles.map((article) => ({
  url: `https://rekaciptaindonesia.com/artikel/${article.slug}`,
  lastModified: article.published_at ?? new Date(),
  changeFrequency: 'monthly' as const,
  priority: 0.6,
}))
```

**Verifikasi:** `/sitemap.xml` (via `next start`, bukan dev server — sitemap dinamis butuh build) menyertakan URL semua artikel published, tidak menyertakan draft.

---

## Layer 4 — QA Tasks

### E6-S1-QA-01 — Fungsional List, Filter, Pagination

**Steps:**
1. Buka `/artikel` → 6 kartu tampil (dari seed DB-05), urut dari terbaru
2. Klik tab "Edukasi Garam" → hanya artikel edukasi tampil, URL jadi `?category=education`
3. Klik tab "Berita Perusahaan" → hanya berita tampil
4. Klik tab "Semua" → semua tampil lagi, URL bersih
5. Kalau seed >6 artikel published: klik "Berikutnya" → halaman 2, URL `?page=2`

**Verifikasi:** Semua langkah sesuai expected, tidak ada flash of wrong content.

---

### E6-S1-QA-02 — SEO Meta Tags & JSON-LD

**Steps:**
1. Buka `/artikel/standar-sni-garam-industri`, klik kanan → "View Page Source"
2. Cari `<title>`, `<meta name="description">`, `<meta property="og:title">`, `<meta property="og:image">`
3. Cari `<script type="application/ld+json">` — parse isinya, verify `@type: Article`, `headline`, `datePublished` terisi

**Verifikasi:** Semua tag ada dan berisi data artikel yang benar (bukan placeholder/default).

---

### E6-S1-QA-03 — Sanitasi XSS

**Payload test (insert manual via SQL, lalu hapus setelah test):**
```sql
UPDATE articles
SET content = '<p>Konten aman</p><script>alert("XSS")</script><img src=x onerror="alert(1)">'
WHERE slug = 'standar-sni-garam-industri';
```

| Aksi | Expected |
|---|---|
| Buka `/artikel/standar-sni-garam-industri` | Tidak ada popup `alert()` muncul |
| Inspect element pada konten | `<script>` tag tidak ada di DOM, `onerror` attribute hilang dari `<img>` |
| Teks "Konten aman" | Tetap tampil normal |

**Rollback:** `UPDATE articles SET content = '<p>Konten edukasi lengkap tentang SNI...</p>' WHERE slug = 'standar-sni-garam-industri';`

**Verifikasi:** Payload XSS sepenuhnya tidak tereksekusi, konten sah tetap render.

---

### E6-S1-QA-04 — View Count Increment

**Steps:**
1. Catat `view_count` awal artikel test (via Supabase Dashboard)
2. Buka `/artikel/{slug}` di tab normal → cek `view_count` naik 1
3. Refresh halaman yang sama (tab sama) → `view_count` **tidak** naik lagi
4. Buka `/artikel/{slug}` di jendela incognito baru → `view_count` naik 1 lagi

**Verifikasi:** Perilaku sesuai AR-03 (session-based, bukan strict per-IP).

---

### E6-S1-QA-05 — Empty State & Draft Isolation

**Steps:**
1. Set semua artikel `is_published = FALSE` sementara (via SQL)
2. Buka `/artikel` → empty state tampil ("Belum ada artikel...")
3. Buka `/artikel/{slug-yang-baru-di-unpublish}` → 404
4. Rollback: set kembali `is_published = TRUE` untuk artikel yang tadinya published

**Verifikasi:** Tidak ada crash, tidak ada draft yang bocor ke publik.

---

## Definition of Done — Slice 1

**Database:**
- [ ] Tabel `articles` dibuat dengan kolom `view_count` (AR-06)
- [ ] RLS `articles` aktif — anon hanya bisa SELECT published, tidak bisa UPDATE
- [ ] Bucket `article-thumbnails` dibuat, public read
- [ ] RPC `increment_article_view` aktif, `SECURITY DEFINER`, granted ke `anon`
- [ ] Seed data minimal 6 artikel published + 1 draft ter-insert

**Frontend:**
- [ ] `/artikel` menampilkan grid artikel published, filter kategori berfungsi, pagination berfungsi
- [ ] `/artikel/[slug]` menampilkan artikel lengkap, 404 untuk slug invalid/draft
- [ ] SEO meta tags + JSON-LD terpasang dan benar (verified via View Source)
- [ ] Related articles muncul di detail page (kategori sama, exclude diri sendiri)
- [ ] Konten HTML disanitasi sebelum render — XSS payload test gagal tereksekusi
- [ ] View count naik saat artikel dibuka, tidak dobel-count dalam sesi sama

**QA:**
- [ ] Semua 5 QA task (QA-01 s/d QA-05) pass
- [ ] `npx tsc --noEmit` clean
- [ ] `npm run lint` clean

**Demo ke klien:**
- [ ] Sign-off dari Jazil/klien: navigasi `/artikel` → filter → baca artikel lengkap → related articles

---

## Handover ke Slice 2 & Slice 3

**Ke Slice 2 (Kalkulator Garam):** Tidak ada dependency langsung — Slice 2 independen sepenuhnya, tidak menyentuh tabel `articles` atau komponen apa pun dari slice ini.

**Ke Slice 3 (Homepage section):** Slice 3 **bergantung** pada:
- `lib/data/articles.ts` — fungsi `getLatestArticles()` dan `getMostViewedArticles()` (DA-01)
- `components/blocks/ArticleCard.tsx` (FE-02) — dipakai ulang persis, tidak dibuat versi baru
- `types/api.ts` — `Article` type (CT-01)

Slice 3 **tidak boleh** memulai sebelum Slice 1 selesai dan ketiga item di atas stabil (signature tidak berubah lagi).

**Ke Epic 6 Admin Panel (epic terpisah, masa depan):** dokumen task breakdown Admin Panel nanti perlu tahu:
- Kolom `view_count` sudah ada, **read-only** dari sisi admin (jangan tambah field ini ke form CRUD, AR-06)
- `meta_description` dipakai dual-purpose SEO + card excerpt (AR-04) — form CRUD cukup 1 field, bukan 2
- Konten HTML dari editor akan disanitasi otomatis di sisi customer-facing (AR-05) — admin tidak perlu preview "hasil sanitasi" secara eksplisit, tapi bagus untuk WYSIWYG preview menunjukkan hasil akhir yang mendekati

---

## Catatan Penutup

**1. Penyimpangan dari Epic Doc 2 didokumentasikan eksplisit, bukan diam-diam.** Tiga penyimpangan utama — tidak ada endpoint FastAPI publik (AR-01), kolom `view_count` tambahan (AR-06), dan `dynamicParams=true` alih-alih mengikuti pola produk (AR-02) — masing-masing punya rasional tertulis. Ini penting supaya siapa pun yang baca Epic Doc 2 dan dokumen ini bersamaan tidak bingung kenapa keduanya tidak identik.

**2. `card-hover-lift` adalah dead CSS class di seluruh proyek** (dikonfirmasi via grep — dipakai `ProductCard`, `IndustriesGrid`, dan sekarang `ArticleCard`, tapi tidak pernah didefinisikan di `globals.css`/`tailwind.config.ts`). Slice ini sengaja tetap memakainya untuk **konsistensi markup** dengan komponen kartu lain, bukan mengklaim ada efek visual. Ini bukan bug yang harus difix di slice ini (di luar scope) — tapi worth diangkat ke Jazil sebagai potential quick-win terpisah (menambahkan definisi class yang hilang akan otomatis memperbaiki hover di 3+ komponen sekaligus).

**3. Kesenjangan CF → Admin Panel adalah pola yang sudah terbukti aman di Epic 5** — pendaftaran supplier customer-facing shipped duluan tanpa Admin CRUD, diseed manual untuk testing, lalu Admin Panel menyusul. Slice ini mengikuti pola yang identik untuk artikel. Bedanya: artikel butuh *konten* (bukan cuma data form) untuk terlihat meyakinkan saat demo — pertimbangkan menulis 5-6 artikel asli (bukan placeholder Lorem Ipsum) sebelum demo ke klien, sesuai requirement PRD "minimal 5 artikel edukasi sebelum launch".

**4. View count bukan metrik yang butuh presisi statistik** — desain sengaja sederhana (RPC + sessionStorage) alih-alih sistem tracking canggih (unique visitor dedup via IP/fingerprint, analytics pihak ketiga). Kalau di masa depan `view_count` dipakai untuk keputusan bisnis yang lebih serius (mis. menentukan artikel mana yang di-boost SEO), pertimbangkan ulang precision requirement-nya saat itu — jangan over-build sekarang untuk kebutuhan yang belum ada (YAGNI, konsisten semangat R-55 Epic 5 Admin).

---

**File:** `docs/EPIC6/epic6_task_breakdown_slice1_artikel-berita.md`
**Versi:** 1.0
**Berdasarkan:** `Epic_Doc2_Epics4-6_RekaCirciptaIndonesia.md` (Epic 6, dengan penyimpangan terdokumentasi), `PRD_WebGaram_RekaCirciptaIndonesia_v1.docx` §5.1.4/§6.4/§8.3/§9.3, `DESIGN_SYSTEM_RekaCirciptaIndonesia_v2.md` v2.0, `CLAUDE.md`, verifikasi langsung kode `app/(public)/produk/`, `epic5_task_breakdown_customer-facing.md` (format acuan)
