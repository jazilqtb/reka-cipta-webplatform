# Epic 3 Task Breakdown — Katalog Produk (Customer-Facing)

**Project:** reka-cipta-platform
**Epic:** Epic 3 — Katalog Produk
**Scope Dokumen:** Bagian **A. Customer-Facing Web** saja (bagian B. Admin/CRM di-defer ke Epic 3B)
**Version:** 1.0
**Author:** Ach. Jazilul Qutbi
**Status:** Draft — menunggu review sebelum eksekusi
**Depends on:** Epic 1 (selesai), Epic 2 Slice 1/2/3 (selesai — Beranda, Tentang Kami, Kontak + Admin Settings)
**Blocks:** Epic 3B (Admin CRUD Produk), Epic 4 (RFQ System — akan konsumsi produk sebagai relasi)

---

## Konteks Slice

Epic 3 menampilkan **5 produk garam** CV Reka Cipta Indonesia sebagai portfolio profesional dengan spesifikasi teknis lengkap dan dokumen hasil uji laboratorium yang dapat diunduh. Konten kritis untuk positioning brand sebagai **distributor B2B garam industri berbasis data lab, bukan sekadar penjual komoditas**.

Karena scope customer-facing Epic 3 mencakup 2 halaman baru dengan kompleksitas berbeda (list page relatif standar, detail page 5-variant dengan spec table JSONB dan static generation), scope ini **dibagi menjadi 2 slice**:

| Slice | Scope Utama | Demoable Outcome |
|---|---|---|
| **Slice 1 — Fondasi + Halaman Daftar Produk** | DB `products` + Storage buckets + Backend GET endpoints + Frontend `/produk` list page | Klien membuka `/produk`, melihat grid 5 kartu produk dengan foto, kategori, badge SNI, filter tab kategori. Tombol "Lihat Detail" ada tapi placeholder (belum aktif). |
| **Slice 2 — Halaman Detail Produk** | Frontend `/produk/[slug]` 5 halaman detail via `generateStaticParams` + metadata SEO dynamic + integrasi CTA ke `/kontak` + sitemap update | Klien klik "Lihat Detail" → landing di halaman detail dengan spec table dari JSONB, badge SNI, list industri, tombol download PDF lab, CTA "Minta Sampel" & "Dapatkan Penawaran" yang prefill halaman kontak. |

Backend endpoint `GET /products/{slug}` dibangun di Slice 1 sekaligus (bukan Slice 2) karena satu router file. Endpoint testable via curl/OpenAPI di Slice 1 meskipun consumer-nya baru dipakai di Slice 2. Ini bukan violation vertical slicing karena Slice 1 tetap punya demo point mandiri (list page fungsional).

---

## Prasyarat Teknis (Konfirmasi Sebelum Mulai)

Verifikasi state platform sebelum mulai eksekusi Slice 1. Jika ada yang ❌, selesaikan dulu.

- [ ] Epic 1 selesai: Navbar, Footer, `lib/supabase/public.ts`, `lib/supabase/server.ts`, `lib/api.ts`, `lib/env.ts`, middleware auth, admin login, admin layout
- [ ] Epic 2 Slice 1 selesai: Beranda dengan pattern Server Component + ISR (`revalidate = 3600`), pattern `lib/supabase/public.ts` untuk Static rendering
- [ ] Epic 2 Slice 2 selesai: Component `InnerPageHero` tersedia (akan di-reuse di Slice 1 & 2 Epic 3)
- [ ] Epic 2 Slice 3 selesai: `/kontak` public page + contact form (react-hook-form + Zod + POST `/contact/send`) — **penting untuk Slice 2 karena CTA produk akan prefill contact form**
- [ ] Design System v2.0 tersedia di `globals.css` dengan brand tokens (Brand Teal 600 `#0B7D6E`, Deep Ink, Warm Sand)
- [ ] Backend FastAPI berjalan di Railway staging + production, endpoints Epic 2 accessible
- [ ] Supabase project aktif, `company_settings` table sudah seeded, Storage buckets dari Epic 1 sudah ada (kalau belum dibuat di Epic 1, akan dibuat di Slice 1 ini)

---

## Keputusan Arsitektur Global Epic 3

Keputusan yang berlaku untuk **kedua slice**. Dibaca sekali di awal, tidak diulang di tiap task.

### AR-01 — Skema Tabel `products` (tambah 4 field dari Epic Doc)

Epic Doc mendefinisikan 12 field. Tambahan 4 field untuk implementasi bersih:

| Field | Tipe | Alasan Tambah |
|---|---|---|
| `category` | VARCHAR(50) NOT NULL | Filter tab butuh field ini. Enum-like values: `'halus'`, `'kasar'`, `'industri'`. Produk multi-kategori (mis. SPO/M yang overlap kasar+industri) di-assign ke kategori dominan. Trade-off: pragmatis, refactor ke `tags TEXT[]` kalau klien butuh multi-select. |
| `sort_order` | INT NOT NULL DEFAULT 0 | Grid urutan display. Tanpa ini urutan tidak deterministik. Admin nanti bisa control via CRUD Epic 3B. |
| `is_active` | BOOLEAN NOT NULL DEFAULT TRUE | Soft-disable produk tanpa delete. `GET /products` hanya return `is_active = TRUE`. |
| `created_at` | TIMESTAMPTZ NOT NULL DEFAULT NOW() | Audit standar. Kombinasi dengan `updated_at`. |

Field enum `category` **tidak menggunakan Postgres ENUM type** (rigid, susah alter). Pakai VARCHAR + CHECK constraint (`CHECK (category IN ('halus', 'kasar', 'industri'))`) supaya ekstensi mudah.

### AR-02 — Rendering Strategy

- **`/produk`** (list): **Static + ISR** dengan `export const revalidate = 3600` (1 jam). Konsisten dengan Beranda & Tentang Kami. Data source: `lib/supabase/public.ts` (stateless client). **JANGAN** pakai `lib/supabase/server.ts` — akan bikin route jadi Dynamic (`ƒ`) karena `cookies()` call.
- **`/produk/[slug]`** (detail): **Static Generation** via `generateStaticParams()` yang fetch 5 slug dari Supabase di build time. Setiap slug jadi Static HTML terpisah. **ISR revalidate = 3600** juga, supaya update konten produk dari admin panel Epic 3B tercermin dalam 1 jam tanpa redeploy.
- **Fallback**: `generateStaticParams` hanya return 5 slug valid. Slug lain di-handle dengan `notFound()` — akan render halaman 404 (dari Epic 1).

### AR-03 — Storage Strategy

Dua bucket baru dibuat di Slice 1:

| Bucket | Isi | Public Access | RLS |
|---|---|---|---|
| `product-photos` | 5 foto produk (JPG/PNG/WebP, target ≤500 KB per file) | Public READ | INSERT/UPDATE/DELETE hanya untuk `auth.role() = 'authenticated'` (untuk admin upload di Epic 3B) |
| `lab-docs` | 5 PDF dokumen lab | Public READ (read-only) | Sama seperti di atas |

URL yang disimpan di tabel `products.photo_url` dan `products.lab_doc_url` = **public URL absolute** dari Supabase Storage (bukan path relatif), supaya `<Image>` dan `<a href>` bisa langsung konsumsi.

### AR-04 — Placeholder Assets Strategy

Untuk Slice 1 seed data, gunakan **placeholder assets** (bukan asset real dari klien):
- **Foto**: 5 file placeholder generik (bisa pakai Unsplash salt-related atau plain colored rectangles dengan text "PRO YD", "PRO L", dst)
- **PDF lab**: 5 file PDF minimal 1-halaman dengan header "Dokumen Uji Laboratorium — Placeholder" + nama produk

Asset real dari klien di-swap saat Epic 3B (admin panel) sudah live dan Manager Pemasaran (Irwan Sugianto) upload via UI admin. Ini mencegah blocking Epic 3 karena menunggu delivery asset dari klien.

**Konsekuensi demo Slice 1 & 2**: klien akan lihat placeholder — komunikasikan eksplisit di awal demo bahwa foto & PDF akan real setelah Epic 3B + upload klien.

### AR-05 — CTA Section Detail Page (Bridging Epic 4)

Epic 4 (RFQ System) belum dibangun. CTA "Minta Sampel" dan "Dapatkan Penawaran" di halaman detail produk akan link ke:

```
/kontak?produk={slug}&intent=sample     → Minta Sampel
/kontak?produk={slug}&intent=quotation  → Dapatkan Penawaran
```

Contact form di `/kontak` (Epic 2 Slice 3) akan diupdate di Slice 2 Epic 3 (task `E3-S2-FE-10`) untuk:
1. Baca `searchParams.produk` dan `searchParams.intent`
2. Prefill textarea pesan dengan template:
   - Intent `sample`: `"Saya tertarik untuk meminta sampel produk {nama_produk}. Mohon informasi terkait pengiriman sampel."`
   - Intent `quotation`: `"Saya ingin mendapatkan penawaran harga untuk produk {nama_produk}. Estimasi kebutuhan: [mohon lengkapi]."`
3. Tampilkan info label kecil di atas form: "Terkait produk: **{nama_produk}**"

Saat Epic 4 (RFQ) live, CTA produk akan **repurposed** ke `/rfq?produk={slug}` sebagai CTA utama, dan `/kontak` tetap sebagai fallback secondary CTA. Query param tetap berguna → tidak ada throwaway work.

### AR-06 — Contract Sync (types ↔ Pydantic)

`types/api.ts` interfaces di-maintain manual sync dengan `backend/schemas/product.py` Pydantic schemas. Konsisten dengan pattern Epic 2. Kalau ada perubahan field, update kedua file dalam commit yang sama.

### AR-07 — Reuse Existing Components

Component yang WAJIB di-reuse (jangan bikin baru):
- `InnerPageHero` dari Epic 2 Slice 2 → untuk hero section `/produk` dan `/produk/[slug]`
- Button variant styling dari `@base-ui/react` dengan pattern `<Link className={cn(buttonVariants(...))}>` — **BUKAN** `<Button asChild><Link>` (itu Radix idiom)
- Navbar & Footer (global layout Epic 1)

### AR-08 — Base UI vs Radix Reminder

Project pakai **Base UI (`@base-ui/react`)**, bukan Radix. Ini reminder karena semua tutorial online masih dominan Radix. Kalau ada component baru butuh primitive (accordion, tabs, dialog), cek dulu tersedia di Base UI. Filter tab di list page kemungkinan pakai Base UI Tabs primitive.

---

## Ringkasan Task per Slice

| Slice | UX | US | Backend | Contract | Frontend | QA | Total |
|---|---|---|---|---|---|---|---|
| **Slice 1** | 5 | 4 | 4 | 1 | 9 (termasuk Storage & seed) | 6 | **29** |
| **Slice 2** | 7 | 5 | 0 (reuse) | 0 (reuse) | 12 | 7 | **31** |

Total **60 task** across kedua slice. Estimasi effort:
- Slice 1: 3-5 hari kerja (kalau full-time solo dev + Claude Code)
- Slice 2: 2-4 hari kerja (frontend-heavy tapi lebih repetitif)

---

# SLICE 1 — Fondasi Produk + Halaman Daftar Produk

## Tujuan Slice 1

Setelah Slice 1 selesai:
1. Tabel `products` dibuat dengan skema final + RLS Pattern A + seed 5 produk placeholder
2. Storage buckets `product-photos` dan `lab-docs` aktif dengan RLS + 5 placeholder foto + 5 placeholder PDF
3. Backend endpoint `GET /products` dan `GET /products/{slug}` accessible (public, no auth)
4. Halaman `/produk` live: hero section, filter tab kategori, grid 5 produk, ProductCard dengan foto+badge SNI+tagline, tombol "Lihat Detail" (placeholder, belum aktif — akan aktif di Slice 2)
5. Static rendering (`○`) preserved, ISR 1 jam, Lighthouse score baseline
6. Demoable ke klien secara mandiri

---

## Layer 1 — UX Tasks (Slice 1)

### E3-S1-UX-01 — Wireframe `/produk`

**Priority:** P0 · **Tags:** `wireframe` `public`

**Deliverable:** File markdown `docs/wireframes/Epic3_slice1_daftar-produk.md` dengan ASCII wireframe struktur halaman.

**Struktur wireframe:**
```
┌─────────────────────────────────────────────────┐
│  <Navbar />                                     │  ← global
├─────────────────────────────────────────────────┤
│  <InnerPageHero                                 │
│    title="Katalog Produk"                       │
│    subtitle="Portfolio garam industri..."       │
│    breadcrumb=[Beranda / Produk]                │  ← reuse dari Slice 2 Epic 2
│  />                                             │
├─────────────────────────────────────────────────┤
│  <CategoryFilterTabs>                           │  ← Client Component
│    [Semua] [Halus] [Kasar] [Industri]          │
│  </CategoryFilterTabs>                          │
├─────────────────────────────────────────────────┤
│  <ProductGrid>                                  │
│    ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│    │ Card 1  │ │ Card 2  │ │ Card 3  │         │
│    └─────────┘ └─────────┘ └─────────┘         │
│    ┌─────────┐ ┌─────────┐                     │
│    │ Card 4  │ │ Card 5  │                     │
│    └─────────┘ └─────────┘                     │
│  </ProductGrid>                                 │
├─────────────────────────────────────────────────┤
│  <Footer />                                     │  ← global
└─────────────────────────────────────────────────┘
```

**Responsive breakpoint:**
- Desktop (`≥ 1024px`): grid 3 kolom
- Tablet (`768px - 1023px`): grid 2 kolom
- Mobile (`< 768px`): grid 1 kolom, filter tab jadi horizontal scroll

**Verifikasi:** Wireframe di-commit, path ada di `docs/wireframes/`.

---

### E3-S1-UX-02 — Spec Component `ProductCard`

**Priority:** P0 · **Tags:** `component-spec` `public`

**Deliverable:** Spec detail di file yang sama, section `## Component: ProductCard`.

**Anatomi kartu:**
```
┌──────────────────────────┐
│                          │
│    <Image foto>          │  ← aspect-ratio 4:3, object-cover
│                          │
├──────────────────────────┤
│ [Badge SNI] (conditional)│  ← muncul jika is_sni=true
│                          │
│ Garam Halus Yodium       │  ← name
│ PRO YD                   │  ← code, muted text
│                          │
│ Tagline pendek...        │  ← 2 baris max, truncate
│                          │
│ [Lihat Detail  →]        │  ← button variant, full width
└──────────────────────────┘
```

**States:**
- **Default:** background white, border tipis, shadow-sm
- **Hover** (`≥ 768px` only): shadow-md, foto scale 1.02 (transition 200ms)
- **Focus-visible:** ring 2px Brand Teal 600
- **Disabled state untuk tombol "Lihat Detail" di Slice 1**: `aria-disabled="true"`, cursor default, opacity 60%, tooltip "Segera hadir". Akan diaktifkan di Slice 2 (task `E3-S2-FE-12`).

**Design tokens:**
- Background: `--color-white`
- Border: `--color-slate-200`
- Nama produk: `text-lg font-semibold text-ink-primary`
- Code: `text-sm text-ink-muted font-mono`
- Tagline: `text-sm text-ink-secondary line-clamp-2`
- Badge SNI: `bg-brand-teal-50 text-brand-teal-700 text-xs font-medium rounded px-2 py-0.5`

**Verifikasi:** Spec di dokumen wireframe. Tokens harus resolve ke variables di `globals.css` (jangan pakai hex hardcoded di JSX).

---

### E3-S1-UX-03 — Spec Component `CategoryFilterTabs`

**Priority:** P1 · **Tags:** `component-spec` `client-component` `interactive`

**Deliverable:** Section `## Component: CategoryFilterTabs`.

**Behavior:**
- Client Component (`'use client'`) karena menggunakan state.
- 4 tab: `Semua`, `Garam Halus`, `Garam Kasar`, `Garam Industri`
- Default state: `Semua` (semua produk visible)
- Filter dilakukan **client-side** dengan filter array `products` — TIDAK re-fetch backend. Konsekuensi: seluruh 5 produk sudah ada di client props dari Server Component parent. Ini efisien karena data set kecil.
- Query param optional: `/produk?kategori=halus` bisa deep-link ke tab tertentu. Update URL dengan `router.replace()` tanpa scroll saat tab berubah.
- Primitive: **Base UI `Tabs`** (`@base-ui/react`). JANGAN pakai Radix Tabs.

**States tab:**
- Inactive: `text-ink-secondary border-b-2 border-transparent`
- Active: `text-brand-teal-700 border-b-2 border-brand-teal-600 font-semibold`
- Hover: `text-ink-primary`

**Mobile behavior:** Horizontal scroll dengan `overflow-x-auto scrollbar-hide`. Tab aktif auto-scroll ke tengah viewport.

**Empty state:** Kalau kategori yang dipilih tidak ada produk aktif → tampilkan message "Belum ada produk di kategori ini." + button "Lihat semua produk" reset ke `Semua`.

**Verifikasi:** Component spec masuk dokumen wireframe.

---

### E3-S1-UX-04 — Loading Skeleton Grid

**Priority:** P2 · **Tags:** `loading-state` `ux`

**Deliverable:** Spec skeleton di section `## Loading State`.

**Trigger:** Karena `/produk` adalah Server Component + ISR (rendered at build), loading skeleton **jarang terlihat** (hanya saat revalidation background atau first hit setelah cache miss). Tapi tetap perlu untuk:
- Streaming case (jika pakai `loading.tsx`)
- Filter change dengan transisi yang tidak instant

**Skeleton anatomy:** Grid 5 kartu placeholder dengan `<div className="animate-pulse bg-slate-100 rounded" />` mengikuti aspect ratio ProductCard.

**File:** `app/produk/loading.tsx` (opsional, kalau perlu untuk `<Suspense>` boundary).

**Verifikasi:** Spec dokumen. Implementasi task ini opsional kalau tim mau defer — flag di DoD.

---

### E3-S1-UX-05 — Empty & Error States

**Priority:** P2 · **Tags:** `edge-case` `ux`

**Deliverable:** Section `## Edge States`.

**Skenario:**
1. **Semua produk `is_active = FALSE`** (edge case operational, hampir tidak mungkin di production): Tampilkan message "Katalog produk sedang diperbarui. Silakan hubungi kami untuk informasi terkini." + button link ke `/kontak`.
2. **Backend error (500 dari Supabase)**: Fallback error boundary. Tampilkan message generik + button "Coba lagi" (reload page).
3. **Foto produk gagal load**: `<Image>` component dengan `onError` fallback ke placeholder generik `/images/product-placeholder.svg` yang di-commit di `public/`.

**Verifikasi:** Ketiga state ter-spec, ada rencana implementasi di frontend task.

---

## Layer 2 — User Stories (Slice 1)

### E3-S1-US-01 — Pengunjung Ingin Lihat Semua Produk

**As** pengunjung website reka-cipta,
**I want** melihat semua produk garam yang ditawarkan dalam satu halaman,
**So that** saya bisa cepat mengevaluasi apakah produk mereka relevan dengan kebutuhan bisnis saya.

**Acceptance:**
- Halaman `/produk` accessible dari Navbar link "Produk"
- Grid menampilkan tepat 5 produk (data dari DB `is_active = TRUE`)
- Setiap kartu memiliki: foto, nama produk, kode produk, badge SNI (kalau applicable), tagline
- Grid responsive (3 kolom desktop, 2 kolom tablet, 1 kolom mobile)
- Load time < 2 detik (di jaringan 4G)

---

### E3-S1-US-02 — Pengunjung Ingin Filter Berdasarkan Kategori

**As** pengunjung dari industri makanan yang cari garam halus,
**I want** filter produk berdasarkan kategori (Halus / Kasar / Industri),
**So that** saya tidak perlu scroll produk yang tidak relevan.

**Acceptance:**
- 4 tab tersedia: Semua, Halus, Kasar, Industri
- Klik tab langsung filter grid (client-side, no page reload)
- Tab aktif ter-highlight visual
- URL berubah dengan query param `?kategori=halus` (deep-linkable)
- Kalau kategori kosong, muncul empty state dengan CTA reset

---

### E3-S1-US-03 — Pengunjung Ingin Akses Cepat (Static + ISR)

**As** pengunjung mobile dari koneksi lambat,
**I want** halaman `/produk` load cepat,
**So that** saya tidak abandon sebelum content muncul.

**Acceptance:**
- Route `/produk` di-render Static (`○` symbol di Next.js build output)
- ISR revalidate interval 3600 detik
- FCP (First Contentful Paint) < 1.5s di 4G simulated
- LCP (Largest Contentful Paint) < 2.5s
- Lighthouse Performance score ≥ 90 (mobile emulation)

---

### E3-S1-US-04 — Visitor Mobile Ingin Grid Responsive

**As** pengunjung dari smartphone,
**I want** grid kartu produk mudah di-tap dan di-scroll,
**So that** saya bisa browsing tanpa frustasi di layar kecil.

**Acceptance:**
- Mobile (< 768px): 1 kolom, kartu full-width dengan margin horizontal 16px
- Tap target tombol minimal 44×44px (accessibility)
- Filter tab horizontal scroll dengan momentum + snap
- Foto lazy-load (Next.js `<Image>` default behavior)
- No horizontal overflow di viewport 320px

---

## Layer 3 — Engineering (Slice 1)

### 3a. Database & Storage

#### E3-S1-DB-01 — Migration SQL: Create Table `products`

**Priority:** P0 · **Tags:** `migration` `database` `sql`

**File:** `supabase/migrations/YYYYMMDDHHMMSS_create_products_table.sql`

**Konten:**
```sql
-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL,
    tagline VARCHAR(300),
    description TEXT,
    specs JSONB NOT NULL DEFAULT '{}'::jsonb,
    industries TEXT[] NOT NULL DEFAULT '{}',
    category VARCHAR(50) NOT NULL,
    is_sni BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    photo_url TEXT,
    lab_doc_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT products_category_check
        CHECK (category IN ('halus', 'kasar', 'industri'))
);

-- Indexes for common queries
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_is_active ON public.products(is_active);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_sort_order ON public.products(sort_order);

-- Trigger auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_products_set_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Comment untuk dokumentasi
COMMENT ON TABLE public.products IS 'Katalog produk garam CV Reka Cipta Indonesia — Epic 3';
COMMENT ON COLUMN public.products.specs IS 'Spesifikasi teknis dari uji lab dalam format JSONB. Contoh: {"nacl_pct": 97.5, "water_pct": 0.5, "kio3_ppm": 30, ...}';
COMMENT ON COLUMN public.products.industries IS 'Array nama industri yang dilayani. Contoh: [\"Makanan & Minuman\", \"Farmasi\", \"Peternakan\"]';
```

**Catatan eksekusi:** Karena Supabase CLI `db push` broken di jaringan Jazil (DNS pooler URL failure — didokumentasikan di project memory), migration dijalankan via:
1. Commit file ke git repo `supabase/migrations/`
2. Eksekusi manual di **Supabase Dashboard → SQL Editor**
3. Atau CLI dengan `supabase db execute --db-url "$SUPABASE_DB_URL" -f <file>` (direct connection string, BUKAN pooler)

**Verifikasi:** Query `SELECT * FROM information_schema.tables WHERE table_name = 'products';` return 1 row. Constraint check muncul di `information_schema.check_constraints`.

---

#### E3-S1-DB-02 — Migration SQL: RLS Pattern A untuk `products`

**Priority:** P0 · **Tags:** `migration` `security` `rls`

**File:** `supabase/migrations/YYYYMMDDHHMMSS_products_rls.sql`

**Konten:**
```sql
-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy: Public can SELECT active products only
CREATE POLICY "Public can read active products"
    ON public.products
    FOR SELECT
    TO anon, authenticated
    USING (is_active = TRUE);

-- Policy: Authenticated users can SELECT all products (untuk admin panel Epic 3B)
CREATE POLICY "Authenticated can read all products"
    ON public.products
    FOR SELECT
    TO authenticated
    USING (TRUE);

-- Policy: Authenticated can INSERT (untuk Epic 3B admin)
CREATE POLICY "Authenticated can insert products"
    ON public.products
    FOR INSERT
    TO authenticated
    WITH CHECK (TRUE);

-- Policy: Authenticated can UPDATE
CREATE POLICY "Authenticated can update products"
    ON public.products
    FOR UPDATE
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

-- Policy: Authenticated can DELETE (soft delete pakai is_active, tapi hard delete tetap allowed untuk admin)
CREATE POLICY "Authenticated can delete products"
    ON public.products
    FOR DELETE
    TO authenticated
    USING (TRUE);
```

**Rasional 2 policy SELECT:** Public hanya lihat `is_active = TRUE`, admin lihat semua (termasuk yang disabled). Postgres RLS akan OR kedua policy untuk role yang match — jadi authenticated user lihat semua produk.

**Verifikasi:**
- `SELECT * FROM pg_policies WHERE tablename = 'products';` return 5 rows.
- Test: `SET ROLE anon; SELECT * FROM products;` hanya return `is_active = TRUE`.
- Test: authenticated bisa lihat semua.

---

#### E3-S1-DB-03 — Create Storage Buckets

**Priority:** P0 · **Tags:** `storage` `supabase`

**Manual step via Supabase Dashboard → Storage:**

1. Bucket `product-photos`:
   - Name: `product-photos`
   - Public: **YES** (public read akses)
   - File size limit: **5 MB** (guard rail, foto asli akan di-compress ≤500 KB)
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

2. Bucket `lab-docs`:
   - Name: `lab-docs`
   - Public: **YES**
   - File size limit: **10 MB**
   - Allowed MIME types: `application/pdf`

**Dokumentasikan** di file `docs/infrastructure/supabase_storage_buckets.md` supaya trackable.

**Verifikasi:** Kedua bucket muncul di dashboard Storage list. Test upload manual 1 file dummy per bucket, dapat public URL yang accessible via browser.

---

#### E3-S1-DB-04 — Storage RLS Policies

**Priority:** P0 · **Tags:** `storage` `security` `rls`

**File:** `supabase/migrations/YYYYMMDDHHMMSS_storage_products_rls.sql`

**Konten:**
```sql
-- product-photos bucket policies

CREATE POLICY "Public can view product photos"
    ON storage.objects
    FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'product-photos');

CREATE POLICY "Authenticated can upload product photos"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'product-photos');

CREATE POLICY "Authenticated can update product photos"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'product-photos')
    WITH CHECK (bucket_id = 'product-photos');

CREATE POLICY "Authenticated can delete product photos"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'product-photos');

-- lab-docs bucket policies (identical pattern)

CREATE POLICY "Public can view lab docs"
    ON storage.objects
    FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'lab-docs');

CREATE POLICY "Authenticated can upload lab docs"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'lab-docs');

CREATE POLICY "Authenticated can update lab docs"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'lab-docs')
    WITH CHECK (bucket_id = 'lab-docs');

CREATE POLICY "Authenticated can delete lab docs"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'lab-docs');
```

**Verifikasi:** Test anonymous fetch public URL foto → 200 OK. Test upload dari anonymous → 401/403.

---

#### E3-S1-DB-05 — Upload Placeholder Assets

**Priority:** P1 · **Tags:** `assets` `storage` `manual`

**Aksi manual (via Supabase Dashboard → Storage):**

Upload 5 foto placeholder ke bucket `product-photos`:
- `pro-yd.jpg` (Garam Halus Yodium)
- `pro-l.jpg` (Garam Halus Non-Yodium)
- `spo-m.jpg` (Garam Kasar Industri)
- `petani-premium.jpg` (Garam Kasar Petani)
- `ghpt.jpg` (Garam Halus Pakan Ternak)

Placeholder bisa berupa:
- Foto stock salt (Unsplash CC0)
- Atau rectangle solid dengan text overlay (bisa generate cepat via Figma export atau `placehold.co`)

Upload 5 PDF placeholder ke bucket `lab-docs`:
- `lab-pro-yd.pdf`
- `lab-pro-l.pdf`
- `lab-spo-m.pdf`
- `lab-petani-premium.pdf`
- `lab-ghpt.pdf`

Masing-masing PDF 1 halaman dengan header "Placeholder — Dokumen Uji Laboratorium akan segera diperbarui" + nama produk. Bisa generate via Word → Export PDF, atau `qpdf` / online converter.

**Catat public URL** setiap file untuk dipakai di seed SQL (task berikutnya). Format URL Supabase Storage:
```
https://{PROJECT_REF}.supabase.co/storage/v1/object/public/{bucket_name}/{filename}
```

**Verifikasi:** Semua 10 file terupload, public URL accessible via browser (200 OK, image render / PDF preview).

---

#### E3-S1-DB-06 — Seed 5 Produk via SQL

**Priority:** P0 · **Tags:** `seed` `database` `sql`

**File:** `supabase/seeds/products_seed.sql`

**Konten:**
```sql
-- Idempotent seed: kalau slug sudah ada, skip
INSERT INTO public.products (
    name, slug, code, tagline, description, specs, industries,
    category, is_sni, sort_order, photo_url, lab_doc_url
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
    'https://{PROJECT_REF}.supabase.co/storage/v1/object/public/product-photos/pro-yd.jpg',
    'https://{PROJECT_REF}.supabase.co/storage/v1/object/public/lab-docs/lab-pro-yd.pdf'
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
    'https://{PROJECT_REF}.supabase.co/storage/v1/object/public/product-photos/pro-l.jpg',
    'https://{PROJECT_REF}.supabase.co/storage/v1/object/public/lab-docs/lab-pro-l.pdf'
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
    'https://{PROJECT_REF}.supabase.co/storage/v1/object/public/product-photos/spo-m.jpg',
    'https://{PROJECT_REF}.supabase.co/storage/v1/object/public/lab-docs/lab-spo-m.pdf'
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
    'https://{PROJECT_REF}.supabase.co/storage/v1/object/public/product-photos/petani-premium.jpg',
    'https://{PROJECT_REF}.supabase.co/storage/v1/object/public/lab-docs/lab-petani-premium.pdf'
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
    'https://{PROJECT_REF}.supabase.co/storage/v1/object/public/product-photos/ghpt.jpg',
    'https://{PROJECT_REF}.supabase.co/storage/v1/object/public/lab-docs/lab-ghpt.pdf'
)
ON CONFLICT (slug) DO NOTHING;
```

**Catatan penting:**
- Ganti `{PROJECT_REF}` dengan project ref Supabase Anda sebelum eksekusi.
- Spec JSON di atas adalah **estimasi** — akan direvisi ketika data lab real dari klien tersedia.
- Gunakan `ON CONFLICT (slug) DO NOTHING` supaya seed bisa dijalankan berulang tanpa error (idempotent).

**Verifikasi:** `SELECT count(*) FROM products;` = 5. `SELECT slug FROM products ORDER BY sort_order;` return dalam urutan 1-5.

---

### 3b. Backend API

#### E3-S1-BE-01 — Pydantic Schema `Product`

**Priority:** P0 · **Tags:** `backend` `schema` `pydantic`

**File:** `backend/schemas/product.py`

**Konten:**
```python
from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class Product(BaseModel):
    """Public product schema untuk response GET /products dan GET /products/{slug}."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str
    code: str
    tagline: str | None = None
    description: str | None = None
    specs: dict[str, Any] = Field(default_factory=dict)
    industries: list[str] = Field(default_factory=list)
    category: str  # 'halus' | 'kasar' | 'industri'
    is_sni: bool
    is_active: bool
    sort_order: int
    photo_url: str | None = None
    lab_doc_url: str | None = None
    created_at: datetime
    updated_at: datetime


class ProductListResponse(BaseModel):
    """Response schema untuk GET /products."""
    products: list[Product]
    total: int


class ProductDetailResponse(BaseModel):
    """Response schema untuk GET /products/{slug}."""
    product: Product
```

**Verifikasi:** Import dari `backend/schemas/product.py` tidak error. Type hints resolve.

---

#### E3-S1-BE-02 — Router `products.py` (GET List + GET Detail)

**Priority:** P0 · **Tags:** `backend` `router` `fastapi`

**File:** `backend/routers/products.py`

**Konten:**
```python
from fastapi import APIRouter, HTTPException, status
from supabase import Client

from backend.dependencies.supabase_client import get_supabase_service
from backend.schemas.product import (
    Product,
    ProductDetailResponse,
    ProductListResponse,
)

router = APIRouter(prefix="/products", tags=["products"])


@router.get(
    "",
    response_model=ProductListResponse,
    summary="Get all active products",
    description="Public endpoint. Returns active products sorted by sort_order ASC.",
)
async def list_products() -> ProductListResponse:
    """List all products where is_active = TRUE."""
    supabase: Client = get_supabase_service()
    result = (
        supabase.table("products")
        .select("*")
        .eq("is_active", True)
        .order("sort_order", desc=False)
        .execute()
    )
    products = [Product(**row) for row in result.data]
    return ProductListResponse(products=products, total=len(products))


@router.get(
    "/{slug}",
    response_model=ProductDetailResponse,
    summary="Get product by slug",
    description="Public endpoint. Returns 404 if slug not found or product inactive.",
)
async def get_product_by_slug(slug: str) -> ProductDetailResponse:
    """Get single product by slug. 404 if not found or not active."""
    supabase: Client = get_supabase_service()
    result = (
        supabase.table("products")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", True)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with slug '{slug}' not found",
        )
    product = Product(**result.data[0])
    return ProductDetailResponse(product=product)
```

**Catatan:**
- Pakai `get_supabase_service()` (service role key, bypass RLS) karena FastAPI backend adalah trusted server. Konsisten dengan pattern Epic 2 `settings.py`.
- Kedua endpoint **public** — tidak ada dependency `Depends(get_current_user)`.
- Sorting selalu berdasarkan `sort_order` ASC.

**Verifikasi:** Import router di step berikutnya.

---

#### E3-S1-BE-03 — Register Router di `main.py`

**Priority:** P0 · **Tags:** `backend` `wiring`

**File:** `backend/main.py`

**Tambahkan:**
```python
from backend.routers import products  # <-- tambah import

# ... existing app setup ...

app.include_router(products.router)  # <-- tambah include
```

**Verifikasi:** Start FastAPI dev server (`uvicorn backend.main:app --reload`). Buka `/docs`, muncul section `products` dengan 2 endpoint.

---

#### E3-S1-BE-04 — Manual Testing via curl / OpenAPI

**Priority:** P0 · **Tags:** `testing` `manual`

**Test cases:**
```bash
# 1. GET list products (harus return 5 produk)
curl http://localhost:8000/products

# 2. GET detail by valid slug
curl http://localhost:8000/products/garam-halus-yodium

# 3. GET detail by invalid slug (harus 404)
curl -i http://localhost:8000/products/tidak-ada

# 4. Test dengan production URL (setelah deploy)
curl https://api.rekaciptaindonesia.com/products
```

**Expected results:**
1. `{"products": [...5 items...], "total": 5}`, status 200
2. `{"product": {...}}`, status 200
3. `{"detail": "Product with slug 'tidak-ada' not found"}`, status 404
4. Same as (1) di production

**Verifikasi:** Semua test pass. Dokumentasikan output di komentar commit atau PR description.

---

### 3c. Contract (Types + lib/api)

#### E3-S1-CT-01 — Update `types/api.ts` + `lib/api.ts`

**Priority:** P0 · **Tags:** `contract` `typescript` `sync`

**File 1:** `types/api.ts`

**Tambahkan:**
```typescript
// Product types — Epic 3 Slice 1
// KEEP IN SYNC with backend/schemas/product.py

export type ProductCategory = 'halus' | 'kasar' | 'industri';

export interface ProductSpecs {
  nacl_pct?: number;
  water_pct?: number;
  kio3_ppm?: number;
  insoluble_impurities_pct?: number;
  color?: string;
  smell?: string;
  mesh_size?: string;
  grain_size_mm?: string;
  // Extend as needed for future spec fields
  [key: string]: string | number | undefined;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  code: string;
  tagline: string | null;
  description: string | null;
  specs: ProductSpecs;
  industries: string[];
  category: ProductCategory;
  is_sni: boolean;
  is_active: boolean;
  sort_order: number;
  photo_url: string | null;
  lab_doc_url: string | null;
  created_at: string;   // ISO 8601 string
  updated_at: string;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
}

export interface ProductDetailResponse {
  product: Product;
}
```

**File 2:** `lib/api.ts`

**Tambahkan 2 typed fetcher:**
```typescript
import type {
  ProductListResponse,
  ProductDetailResponse,
} from '@/types/api';

// ... existing functions ...

export async function getProducts(): Promise<ProductListResponse> {
  return apiFetch<ProductListResponse>('/products', { auth: false });
}

export async function getProductBySlug(
  slug: string
): Promise<ProductDetailResponse> {
  return apiFetch<ProductDetailResponse>(`/products/${slug}`, { auth: false });
}
```

**Verifikasi:** `pnpm tsc --noEmit` pass tanpa error. Import `getProducts` dari komponen Server Component di step berikutnya tidak error.

---

### 3d. Frontend Public

#### E3-S1-FE-01 — Route `/produk/page.tsx` Server Component

**Priority:** P0 · **Tags:** `frontend` `server-component` `route`

**File:** `app/produk/page.tsx`

**Struktur:**
```typescript
import type { Metadata } from 'next';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { InnerPageHero } from '@/components/hero/InnerPageHero';
import { CategoryFilterTabs } from '@/components/product/CategoryFilterTabs';
import { ProductGrid } from '@/components/product/ProductGrid';
import type { Product } from '@/types/api';

// ISR: revalidate setiap 1 jam
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Katalog Produk | CV Reka Cipta Indonesia',
  description:
    'Portofolio produk garam industri CV Reka Cipta Indonesia. 5 varian garam untuk industri makanan, farmasi, kimia, peternakan, dan lainnya. Bersertifikat SNI.',
  openGraph: {
    title: 'Katalog Produk Garam Industri',
    description: '5 varian garam berkualitas dari CV Reka Cipta Indonesia',
    type: 'website',
  },
};

export default async function ProdukPage() {
  const supabase = createPublicSupabaseClient();

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  const typedProducts = (products ?? []) as Product[];

  return (
    <main>
      <InnerPageHero
        title="Katalog Produk"
        subtitle="Portfolio garam industri berbasis data uji laboratorium"
        breadcrumb={[
          { label: 'Beranda', href: '/' },
          { label: 'Produk', href: '/produk' },
        ]}
      />
      <section className="container mx-auto px-4 py-12 md:py-16">
        <CategoryFilterTabs products={typedProducts} />
      </section>
    </main>
  );
}
```

**Catatan penting:**
- Gunakan `createPublicSupabaseClient` dari `lib/supabase/public.ts` — **JANGAN** `lib/supabase/server.ts` (akan trigger `cookies()` dan bikin route Dynamic).
- `CategoryFilterTabs` adalah Client Component yang terima props `products` dan handle rendering `ProductGrid` di dalamnya (karena state filter live di client).
- Alternatif: fetch via `lib/api.ts` (`getProducts()`) untuk konsistensi. Trade-off: Supabase direct lebih cepat (skip FastAPI hop). Rekomendasi: **direct Supabase** karena data public dan skema RLS sudah lock.

**Verifikasi:** Build success. Cek `pnpm build` output menampilkan `○ /produk` (Static symbol).

---

#### E3-S1-FE-02 — Reuse `InnerPageHero` dari Slice 2 Epic 2

**Priority:** P0 · **Tags:** `frontend` `reuse` `component`

**Aksi:** Import `InnerPageHero` dari path yang sudah dibuat di Epic 2 Slice 2 (kemungkinan `@/components/hero/InnerPageHero` atau `@/components/layout/InnerPageHero`).

**JANGAN buat baru.** Kalau spec berbeda (mis. background style Slice 2 tidak cocok), extend dengan prop opsional (`variant`, `backgroundImage`) — bukan bikin komponen baru.

**Verifikasi:** Hero di `/produk` render dengan konsistensi visual dengan `/tentang-kami`. Screenshot side-by-side.

---

#### E3-S1-FE-03 — Component `ProductGrid`

**Priority:** P0 · **Tags:** `frontend` `component`

**File:** `components/product/ProductGrid.tsx`

**Struktur:**
```typescript
import type { Product } from '@/types/api';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-ink-secondary mb-4">
          Belum ada produk di kategori ini.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

**Verifikasi:** Grid layout responsive sesuai spec. Empty state visible saat array kosong.

---

#### E3-S1-FE-04 — Component `ProductCard`

**Priority:** P0 · **Tags:** `frontend` `component`

**File:** `components/product/ProductCard.tsx`

**Struktur:**
```typescript
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import type { Product } from '@/types/api';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-50">
        {product.photo_url ? (
          <Image
            src={product.photo_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            No image
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 p-5">
        {product.is_sni && (
          <span className="inline-flex w-fit items-center rounded bg-brand-teal-50 px-2 py-0.5 text-xs font-medium text-brand-teal-700">
            SNI
          </span>
        )}

        <div>
          <h3 className="text-lg font-semibold text-ink-primary">
            {product.name}
          </h3>
          <p className="font-mono text-sm text-ink-muted">{product.code}</p>
        </div>

        {product.tagline && (
          <p className="line-clamp-2 text-sm text-ink-secondary">
            {product.tagline}
          </p>
        )}

        {/* Tombol placeholder untuk Slice 1 — akan diaktifkan di Slice 2 */}
        <button
          type="button"
          aria-disabled="true"
          disabled
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'mt-auto w-full opacity-60 cursor-not-allowed'
          )}
          title="Halaman detail segera tersedia"
        >
          Lihat Detail →
        </button>
      </div>
    </article>
  );
}
```

**Catatan Slice 1:** Tombol di-disable karena route `/produk/[slug]` belum ada. Di Slice 2 task `E3-S2-FE-12`, tombol akan diganti jadi `<Link>` aktif.

**Verifikasi:** Card render dengan foto, badge SNI (untuk produk 1 & 2), name, code, tagline, tombol disabled.

---

#### E3-S1-FE-05 — Component `CategoryFilterTabs` (Client Component)

**Priority:** P1 · **Tags:** `frontend` `client-component` `interactive`

**File:** `components/product/CategoryFilterTabs.tsx`

**Struktur:**
```typescript
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs } from '@base-ui-components/react/tabs';
import { ProductGrid } from './ProductGrid';
import type { Product, ProductCategory } from '@/types/api';

interface CategoryFilterTabsProps {
  products: Product[];
}

type TabValue = 'all' | ProductCategory;

const TAB_LABELS: Record<TabValue, string> = {
  all: 'Semua',
  halus: 'Garam Halus',
  kasar: 'Garam Kasar',
  industri: 'Garam Industri',
};

export function CategoryFilterTabs({ products }: CategoryFilterTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('kategori') as TabValue) || 'all';
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);

  // Sync URL saat tab berubah (tanpa scroll)
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (activeTab === 'all') {
      params.delete('kategori');
    } else {
      params.set('kategori', activeTab);
    }
    const queryString = params.toString();
    const url = queryString ? `/produk?${queryString}` : '/produk';
    router.replace(url, { scroll: false });
  }, [activeTab, router, searchParams]);

  const filteredProducts = useMemo(() => {
    if (activeTab === 'all') return products;
    return products.filter((p) => p.category === activeTab);
  }, [products, activeTab]);

  return (
    <Tabs.Root
      value={activeTab}
      onValueChange={(val) => setActiveTab(val as TabValue)}
    >
      <Tabs.List className="mb-8 flex gap-2 overflow-x-auto border-b border-slate-200">
        {(Object.keys(TAB_LABELS) as TabValue[]).map((value) => (
          <Tabs.Tab
            key={value}
            value={value}
            className="whitespace-nowrap px-4 py-3 text-sm font-medium text-ink-secondary transition-colors data-[selected]:border-b-2 data-[selected]:border-brand-teal-600 data-[selected]:text-brand-teal-700 hover:text-ink-primary"
          >
            {TAB_LABELS[value]}
          </Tabs.Tab>
        ))}
      </Tabs.List>

      <Tabs.Panel value={activeTab}>
        <ProductGrid products={filteredProducts} />
      </Tabs.Panel>
    </Tabs.Root>
  );
}
```

**Catatan:**
- **Base UI import path** perlu diverifikasi (bisa `@base-ui-components/react/tabs` atau `@base-ui/react`, cek versi package.json).
- Fallback kalau Base UI Tabs bermasalah: implementasi manual dengan `<button>` + state.

**Verifikasi:** Klik tab langsung filter grid. URL update dengan `?kategori=halus`. Refresh page dengan URL query param tetap preserve tab state.

---

#### E3-S1-FE-06 — Loading Skeleton Component (Opsional)

**Priority:** P2 · **Tags:** `frontend` `loading-state`

**File:** `components/product/ProductGridSkeleton.tsx` + `app/produk/loading.tsx`

**Struktur skeleton:**
```typescript
export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-lg border border-slate-200 bg-white"
        >
          <div className="aspect-[4/3] bg-slate-200" />
          <div className="space-y-3 p-5">
            <div className="h-4 w-16 rounded bg-slate-200" />
            <div className="h-5 w-3/4 rounded bg-slate-200" />
            <div className="h-3 w-1/3 rounded bg-slate-200" />
            <div className="h-3 w-full rounded bg-slate-200" />
            <div className="mt-2 h-9 w-full rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Verifikasi:** Loading state terlihat saat hard refresh dari koneksi lambat.

---

#### E3-S1-FE-07 — Update Navbar Link "Produk"

**Priority:** P1 · **Tags:** `frontend` `nav`

**Aksi:** Pastikan link "Produk" di Navbar (Epic 1) sudah menunjuk ke `/produk`. Kalau sebelumnya menunjuk ke `#` atau placeholder, update jadi `/produk`.

**File:** komponen Navbar (path kemungkinan `components/layout/Navbar.tsx`).

**Verifikasi:** Klik link "Produk" di navbar dari halaman lain → land di `/produk`. Active state highlight benar.

---

#### E3-S1-FE-08 — Update `app/sitemap.ts` include `/produk`

**Priority:** P1 · **Tags:** `frontend` `seo`

**File:** `app/sitemap.ts`

**Tambahkan entry:**
```typescript
{
  url: `${baseUrl}/produk`,
  lastModified: new Date(),
  changeFrequency: 'weekly',
  priority: 0.9,
},
```

**Note:** Entry untuk `/produk/[slug]` 5 halaman akan ditambah di Slice 2 (task `E3-S2-FE-11`).

**Verifikasi:** Buka `/sitemap.xml` di browser, `/produk` muncul.

---

#### E3-S1-FE-09 — Error Boundary (Opsional)

**Priority:** P2 · **Tags:** `frontend` `error-handling`

**File:** `app/produk/error.tsx`

**Struktur:**
```typescript
'use client';

export default function ProdukError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="container mx-auto px-4 py-16 text-center">
      <h1 className="mb-4 text-2xl font-semibold">
        Terjadi kesalahan memuat katalog
      </h1>
      <p className="mb-6 text-ink-secondary">
        Kami sedang memperbaiki masalah ini. Silakan coba lagi.
      </p>
      <button
        onClick={reset}
        className="rounded bg-brand-teal-600 px-4 py-2 text-white"
      >
        Coba lagi
      </button>
    </main>
  );
}
```

**Verifikasi:** Test dengan simulasi error (mis. sementara throw di page.tsx) — error boundary render.

---

## Layer 4 — QA Tasks (Slice 1)

### E3-S1-QA-01 — Verify Static Rendering

**Priority:** P0 · **Tags:** `qa` `rendering`

**Aksi:** Jalankan `pnpm build`. Verifikasi output:
```
Route (app)                          Size    First Load JS
...
○ /produk                            ...     ...
```

Symbol harus **`○` (Static)**. Kalau `ƒ` (Dynamic), ada masalah — investigasi apakah ada import `lib/supabase/server.ts` yang tidak sengaja.

**Verifikasi:** Screenshot build output, commit di PR description.

---

### E3-S1-QA-02 — Visual QA Responsive

**Priority:** P0 · **Tags:** `qa` `responsive` `visual`

**Test viewport:**
- 320px (small mobile)
- 375px (iPhone SE)
- 768px (tablet portrait)
- 1024px (desktop)
- 1440px (large desktop)

**Checklist per viewport:**
- [ ] Grid kolom jumlah sesuai spec (1/2/3)
- [ ] Filter tab tidak overflow horizontal
- [ ] Foto tidak stretch atau distort
- [ ] Tap target ≥ 44×44px
- [ ] Text tidak overflow container
- [ ] Padding & margin konsisten dengan Design System

**Verifikasi:** Screenshot per viewport dilampirkan di PR atau di dokumen QA notes.

---

### E3-S1-QA-03 — Accessibility Scan

**Priority:** P1 · **Tags:** `qa` `a11y`

**Aksi:**
- Jalankan `axe DevTools` extension di browser pada `/produk`
- Test keyboard navigation: Tab through filter tab & tombol
- Test screen reader (VoiceOver macOS atau NVDA Windows) baca semua card

**Target:** 0 critical & 0 serious violation dari axe. Semantic HTML (h1, h2, article) benar.

**Verifikasi:** Screenshot axe report clean.

---

### E3-S1-QA-04 — Lighthouse Score

**Priority:** P1 · **Tags:** `qa` `performance` `seo`

**Aksi:** Jalankan Lighthouse (mobile emulation) di production URL setelah deploy.

**Target minimum:**
- Performance: ≥ 90
- Accessibility: ≥ 95
- Best Practices: ≥ 95
- SEO: ≥ 95

**Kalau Performance < 90:** cek image size (compress placeholder foto), preload font, cek bundle size CategoryFilterTabs.

**Verifikasi:** Screenshot Lighthouse report attached di PR.

---

### E3-S1-QA-05 — Design System v2.0 Compliance

**Priority:** P1 · **Tags:** `qa` `design-system`

**Checklist:**
- [ ] Semua warna via CSS variables (`--color-*`), tidak ada hex hardcoded
- [ ] Typography scale sesuai Design System (font-size, font-weight, line-height)
- [ ] Spacing pakai Tailwind scale konsisten (bukan arbitrary values `[13px]`)
- [ ] Radius pakai token (`rounded`, `rounded-lg`)
- [ ] Brand Teal 600 (`#0B7D6E`) muncul di badge SNI, active tab, button primary
- [ ] Deep Ink untuk text primary, muted untuk secondary

**Verifikasi:** Manual walkthrough halaman `/produk` dengan Design System doc terbuka side-by-side.

---

### E3-S1-QA-06 — Client Demo Script Slice 1

**Priority:** P0 · **Tags:** `demo` `sign-off`

**File:** `docs/demos/epic3_slice1_demo_script.md`

**Struktur demo (~5 menit):**
1. **Konteks pembukaan (30 detik)** — "Slice 1 Epic 3 fokus pada foundation katalog produk dan halaman list. Foto & PDF yang tampil sekarang adalah placeholder — akan diganti dengan asset asli setelah Epic 3B (admin panel) live dan tim marketing upload."
2. **Demo `/produk` (2 menit)** — Buka `/produk`, tunjukkan hero, grid 5 produk, badge SNI, filter tab per kategori.
3. **Demo responsive (1 menit)** — Resize browser ke mobile viewport, tunjukkan grid berubah 1 kolom, filter tab horizontal scroll.
4. **Demo deep-link (30 detik)** — Share URL `/produk?kategori=halus` — refresh page, tab tetap terpilih.
5. **Roadmap Slice 2 (1 menit)** — "Slice 2 akan mengaktifkan tombol 'Lihat Detail', membuka 5 halaman detail dengan tabel spesifikasi teknis dan tombol download PDF lab. Setelah itu Epic 3B untuk panel admin edit produk."

**Sign-off criteria:** Klien setuju layout, konten teks, dan roadmap Slice 2.

---

## Definition of Done — Slice 1

**Backend:**
- [ ] Migration `products` table applied di production Supabase
- [ ] RLS Pattern A active dan verified (anon hanya SELECT `is_active=TRUE`)
- [ ] Storage buckets `product-photos` & `lab-docs` created dengan RLS
- [ ] 5 placeholder foto + 5 placeholder PDF uploaded
- [ ] Seed 5 produk applied (`SELECT count(*)` = 5)
- [ ] `GET /products` return 5 produk sorted by `sort_order`
- [ ] `GET /products/{slug}` return single product, 404 untuk slug invalid
- [ ] Backend deployed di production Railway

**Frontend:**
- [ ] `/produk` accessible, render Static (`○`), ISR 3600
- [ ] Grid responsive 3/2/1 kolom
- [ ] Filter tab kategori berfungsi (client-side filtering)
- [ ] URL deep-link `?kategori=halus` preserve state
- [ ] Badge SNI muncul untuk 2 produk yang applicable
- [ ] Tombol "Lihat Detail" disabled dengan tooltip
- [ ] Navbar link "Produk" active state benar
- [ ] Sitemap include `/produk`
- [ ] Metadata SEO tersedia

**Kualitas kode:**
- [ ] `pnpm tsc --noEmit` pass
- [ ] `pnpm lint` pass
- [ ] `types/api.ts` sinkron dengan `backend/schemas/product.py`
- [ ] Tidak ada import dari `@radix-ui/*`
- [ ] Tidak ada modifikasi `globals.css` (kecuali brand token yang sudah disepakati)

**QA:**
- [ ] Visual QA pass di 5 viewport
- [ ] axe DevTools 0 critical/serious
- [ ] Lighthouse Performance ≥ 90 mobile
- [ ] Design System v2.0 compliance verified

**Demo:**
- [ ] Client demo dilakukan, sign-off tercatat
- [ ] Roadmap Slice 2 dikomunikasikan

---

# SLICE 2 — Halaman Detail Produk (`/produk/[slug]`)

## Tujuan Slice 2

Setelah Slice 2 selesai:
1. 5 halaman detail produk accessible di `/produk/garam-halus-yodium`, `/produk/garam-halus-non-yodium`, `/produk/garam-kasar-industri`, `/produk/garam-kasar-petani`, `/produk/garam-ghpt`
2. Setiap halaman render Static via `generateStaticParams`, ISR 3600
3. Konten detail: foto besar, spec table dari JSONB, badge SNI, list industri, tombol download PDF lab, CTA "Minta Sampel" & "Dapatkan Penawaran" ke `/kontak` dengan prefill
4. Contact form (`/kontak` dari Epic 2 Slice 3) di-update untuk baca `searchParams.produk` dan prefill message
5. Tombol "Lihat Detail" di `ProductCard` (Slice 1) diaktifkan
6. Sitemap include 5 URL detail
7. Metadata SEO unique per halaman

---

## Layer 1 — UX Tasks (Slice 2)

### E3-S2-UX-01 — Wireframe `/produk/[slug]`

**Priority:** P0 · **Tags:** `wireframe` `public`

**File:** `docs/wireframes/Epic3_slice2_detail-produk.md`

**Struktur:**
```
┌─────────────────────────────────────────────────┐
│  <Navbar />                                     │
├─────────────────────────────────────────────────┤
│  <Breadcrumb>                                   │
│  Beranda / Produk / {Nama Produk}               │
├─────────────────────────────────────────────────┤
│  <ProductHero>                                  │
│  ┌────────────┐ ┌──────────────────────────┐   │
│  │            │ │ [SNI Badge]              │   │
│  │   Foto     │ │ Nama Produk (h1)         │   │
│  │  Produk    │ │ KODE PRODUK (mono)       │   │
│  │            │ │                          │   │
│  │            │ │ Deskripsi panjang...     │   │
│  │            │ │ (paragraf)               │   │
│  └────────────┘ └──────────────────────────┘   │
├─────────────────────────────────────────────────┤
│  <SpecTable>                                    │
│  ## Spesifikasi Teknis                          │
│  ┌─────────────────────────────────────────┐   │
│  │ Parameter │ Nilai   │ Satuan │ Metode   │   │
│  ├───────────┼─────────┼────────┼──────────┤   │
│  │ NaCl      │ 97.5    │ %      │ SNI 3556 │   │
│  │ Air       │ 0.5     │ %      │ SNI 3556 │   │
│  │ ...       │ ...     │ ...    │ ...      │   │
│  └─────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│  <IndustryList>                                 │
│  ## Kegunaan per Industri                       │
│  [🥫 Makanan] [💊 Farmasi] [🏠 Rumah Tangga]  │
├─────────────────────────────────────────────────┤
│  <LabDocDownload>                               │
│  [📄 Unduh Dokumen Uji Lab (PDF)]              │
├─────────────────────────────────────────────────┤
│  <ProductCTA>                                   │
│  ## Tertarik dengan produk ini?                 │
│  [Minta Sampel]  [Dapatkan Penawaran]           │
├─────────────────────────────────────────────────┤
│  <Footer />                                     │
└─────────────────────────────────────────────────┘
```

**Layout desktop:** Foto & info berdampingan (kolom 5:7). Mobile: stacked vertikal (foto di atas, info di bawah).

**Verifikasi:** Wireframe file committed.

---

### E3-S2-UX-02 — Spec Component `ProductHero`

**Priority:** P0 · **Tags:** `component-spec`

**Deliverable:** Section spec di wireframe file.

**Behavior:**
- Foto besar di kiri (aspect-ratio 1:1 atau 4:3 tergantung asset), object-cover, rounded-lg
- Info panel di kanan: SNI badge → name (h1) → code → deskripsi
- Mobile: foto stack di atas, info di bawah, padding container
- Description support paragraph break (`\n\n` di database → `<p>` terpisah di frontend)

**Design tokens:**
- Foto max-width: 500px desktop, full-width mobile
- Nama produk: `text-3xl md:text-4xl font-bold text-ink-primary`
- Code: `text-lg font-mono text-ink-muted`
- Description: `text-base text-ink-secondary leading-relaxed`

---

### E3-S2-UX-03 — Spec Component `SpecTable` (Dynamic dari JSONB)

**Priority:** P0 · **Tags:** `component-spec` `dynamic`

**Challenge:** Spec setiap produk memiliki field berbeda. Misal PRO YD punya `kio3_ppm` (yodium), PRO L tidak. GHPT punya `mesh_size`, Petani Premium punya `grain_size_mm`.

**Solusi:** SpecTable receive `specs: ProductSpecs` (Record dinamis), iterate keys, mapping ke label human-readable via **spec label registry**.

**File tambahan:** `lib/product-spec-labels.ts`
```typescript
export const SPEC_LABEL_REGISTRY: Record<
  string,
  { label: string; unit: string; method?: string }
> = {
  nacl_pct: { label: 'Kadar NaCl', unit: '%', method: 'SNI 3556:2016' },
  water_pct: { label: 'Kadar Air', unit: '%', method: 'SNI 3556:2016' },
  kio3_ppm: { label: 'Kandungan KIO3', unit: 'ppm', method: 'SNI 3556:2016' },
  insoluble_impurities_pct: {
    label: 'Zat Tak Larut',
    unit: '%',
    method: 'SNI 3556:2016',
  },
  color: { label: 'Warna', unit: '-' },
  smell: { label: 'Bau', unit: '-' },
  mesh_size: { label: 'Ukuran Mesh', unit: '-' },
  grain_size_mm: { label: 'Ukuran Butiran', unit: 'mm' },
};

export function getSpecLabel(key: string) {
  return SPEC_LABEL_REGISTRY[key] ?? { label: key, unit: '-' };
}
```

**Component behavior:**
- Iterate `Object.entries(specs)`, filter yang key ada di registry
- Render table dengan kolom: Parameter | Nilai | Satuan | Metode
- Kalau key tidak di registry, tetap render dengan key raw (fallback)
- Empty state (spec kosong): tidak render section sama sekali

**Verifikasi:** Registry accessible, mudah ditambah field baru tanpa refactor komponen.

---

### E3-S2-UX-04 — Spec Component `IndustryList`

**Priority:** P1 · **Tags:** `component-spec`

**Behavior:**
- Array `industries: string[]` di-render sebagai list chip/pill
- Setiap chip: icon + nama industri
- Icon mapping: `lib/product-industry-icons.ts` (registry mirip spec labels, mapping nama industri → icon component dari `lucide-react` atau emoji fallback)

**File tambahan:** `lib/product-industry-icons.ts`
```typescript
import { Utensils, Pill, Home, FlaskConical, Shirt, Fish, Cog } from 'lucide-react';

export const INDUSTRY_ICON_REGISTRY: Record<string, typeof Utensils> = {
  'Makanan & Minuman': Utensils,
  'Farmasi': Pill,
  'Rumah Tangga': Home,
  'Kimia': FlaskConical,
  'Tekstil': Shirt,
  'Pengolahan Ikan': Fish,
  'Peternakan': Cog,
  // Extend as needed
};
```

**Design:** Chip dengan border, padding kompak, hover state subtle.

---

### E3-S2-UX-05 — Spec Component `LabDocDownload`

**Priority:** P0 · **Tags:** `component-spec`

**Behavior:**
- Tombol prominent dengan icon PDF (dari `lucide-react`: `FileText` atau `Download`)
- Klik → open PDF di tab baru (`target="_blank" rel="noopener noreferrer"`)
- Kalau `lab_doc_url` null, tombol disabled dengan message "Dokumen lab akan segera tersedia"
- Track click event untuk analytics (opsional, defer ke Epic monitoring)

**Design:**
- Button variant `outline` atau `secondary`
- Full-width mobile, auto-width desktop
- Icon di kiri, text di kanan

---

### E3-S2-UX-06 — Spec Component `ProductCTA` Section

**Priority:** P0 · **Tags:** `component-spec` `cross-slice-integration`

**Behavior:**
- 2 tombol side-by-side (desktop) / stacked (mobile)
- **Minta Sampel** → `<Link href="/kontak?produk={slug}&intent=sample">`
- **Dapatkan Penawaran** → `<Link href="/kontak?produk={slug}&intent=quotation">`

**Pattern penting (dari AR-08):**
```tsx
<Link
  href={`/kontak?produk=${product.slug}&intent=sample`}
  className={cn(buttonVariants({ variant: 'default', size: 'lg' }))}
>
  Minta Sampel
</Link>
```

**JANGAN pakai `<Button asChild>` (Radix idiom).**

**Design:**
- Background section: `bg-brand-teal-50` atau `bg-slate-50` untuk kontras
- Heading `text-2xl font-semibold` + subheading kontekstual
- Button primary (Minta Sampel) & secondary variant (Dapatkan Penawaran)

---

### E3-S2-UX-07 — Spec Breadcrumb

**Priority:** P2 · **Tags:** `component-spec` `navigation`

**Behavior:**
- 3 level: Beranda / Produk / {Nama Produk}
- Level terakhir tidak clickable (current page indicator)
- Aria-label: "Breadcrumb"
- Menggunakan `<nav>` semantic dengan `<ol>` list

**File:** `components/product/ProductBreadcrumb.tsx`. Atau reuse breadcrumb pattern dari `InnerPageHero` kalau sudah ada.

---

## Layer 2 — User Stories (Slice 2)

### E3-S2-US-01 — Pengunjung Lihat Detail Lengkap Produk

**As** calon buyer B2B yang tertarik dengan produk PRO YD,
**I want** melihat spesifikasi teknis lengkap, kegunaan industri, dan dokumen lab,
**So that** saya bisa evaluasi apakah produk memenuhi kebutuhan teknis kami sebelum kontak sales.

**Acceptance:**
- URL `/produk/garam-halus-yodium` accessible
- Halaman menampilkan: foto, nama, kode, badge SNI, deskripsi, tabel spec, list industri, tombol download PDF, CTA
- Layout responsive
- Load time < 2 detik

---

### E3-S2-US-02 — Pengunjung Download PDF Lab

**As** engineer QC calon buyer,
**I want** download dokumen hasil uji lab dalam format PDF,
**So that** saya bisa validasi kualitas produk secara independen di internal team.

**Acceptance:**
- Tombol "Unduh Dokumen Uji Lab" visible di detail page
- Klik → PDF download atau open di tab baru
- File PDF valid, ter-render dengan header produk yang benar

---

### E3-S2-US-03 — Pengunjung Klik CTA Prefill Kontak

**As** pengunjung yang tertarik minta sampel PRO YD,
**I want** klik tombol "Minta Sampel" dan langsung di-arahkan ke form kontak dengan pesan sudah di-prefill,
**So that** saya tidak perlu manual tulis "Saya tertarik dengan produk PRO YD".

**Acceptance:**
- Klik "Minta Sampel" → landing di `/kontak?produk=garam-halus-yodium&intent=sample`
- Contact form textarea auto-prefill: "Saya tertarik untuk meminta sampel produk Garam Halus Yodium. Mohon informasi terkait pengiriman sampel."
- Label info visible di atas form: "Terkait produk: **Garam Halus Yodium**"
- Kalau user edit prefill, edit tidak ter-reset saat re-render

---

### E3-S2-US-04 — SEO Unique per Produk

**As** search engine crawler,
**I want** setiap halaman detail produk memiliki metadata unique,
**So that** hasil pencarian di Google menampilkan snippet yang relevan per produk.

**Acceptance:**
- `<title>` unique: "{Nama Produk} - {Code} | CV Reka Cipta Indonesia"
- `<meta name="description">` unique per produk (dari tagline atau description ringkas)
- Open Graph: `og:title`, `og:description`, `og:image` (foto produk)
- JSON-LD `Product` schema (opsional bonus, kalau waktu memungkinkan)
- Sitemap.xml include 5 URL detail

---

### E3-S2-US-05 — Static Generation 5 Detail Pages

**As** system,
**I want** semua 5 detail page di-generate saat build time,
**So that** load time optimal, SEO friendly, dan CDN cacheable.

**Acceptance:**
- `pnpm build` output menampilkan 5 route Static:
  ```
  ○ /produk/garam-halus-yodium
  ○ /produk/garam-halus-non-yodium
  ○ /produk/garam-kasar-industri
  ○ /produk/garam-kasar-petani
  ○ /produk/garam-ghpt
  ```
- Symbol `○` (Static), bukan `ƒ` (Dynamic)
- Slug invalid render 404

---

## Layer 3 — Engineering (Slice 2)

### 3a. Backend & Contract

**Tidak ada task backend/contract baru.** Endpoint `GET /products/{slug}` dan types sudah dibangun di Slice 1. Slice 2 fokus konsumsi di frontend.

---

### 3b. Frontend Public

#### E3-S2-FE-01 — Route `/produk/[slug]/page.tsx` dengan `generateStaticParams`

**Priority:** P0 · **Tags:** `frontend` `server-component` `static-generation`

**File:** `app/produk/[slug]/page.tsx`

**Struktur:**
```typescript
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { ProductBreadcrumb } from '@/components/product/ProductBreadcrumb';
import { ProductHero } from '@/components/product/ProductHero';
import { SpecTable } from '@/components/product/SpecTable';
import { IndustryList } from '@/components/product/IndustryList';
import { LabDocDownload } from '@/components/product/LabDocDownload';
import { ProductCTA } from '@/components/product/ProductCTA';
import type { Product } from '@/types/api';

export const revalidate = 3600;

// Generate 5 static paths at build time
export async function generateStaticParams() {
  const supabase = createPublicSupabaseClient();
  const { data } = await supabase
    .from('products')
    .select('slug')
    .eq('is_active', true);
  return (data ?? []).map((p) => ({ slug: p.slug }));
}

async function getProduct(slug: string): Promise<Product | null> {
  const supabase = createPublicSupabaseClient();
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  return (data as Product | null) ?? null;
}

// Dynamic metadata per product
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;   // Next.js 15 async params
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: 'Produk tidak ditemukan' };

  return {
    title: `${product.name} - ${product.code} | CV Reka Cipta Indonesia`,
    description: product.tagline ?? product.description?.slice(0, 160) ?? '',
    openGraph: {
      title: product.name,
      description: product.tagline ?? '',
      images: product.photo_url ? [{ url: product.photo_url }] : [],
      type: 'website',
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  return (
    <main>
      <ProductBreadcrumb productName={product.name} />
      <ProductHero product={product} />
      <SpecTable specs={product.specs} />
      <IndustryList industries={product.industries} />
      <LabDocDownload url={product.lab_doc_url} productName={product.name} />
      <ProductCTA product={product} />
    </main>
  );
}
```

**Catatan penting:**
- `params` **wajib async** (`Promise<{ slug }>`) di Next.js 15 — sudah dokumentasi di project memory.
- `generateStaticParams` fetch 5 slug saat build time, sehingga 5 route jadi static.
- `notFound()` trigger halaman 404 dari Epic 1.

**Verifikasi:** `pnpm build` menampilkan 5 route `○ /produk/{slug}`.

---

#### E3-S2-FE-02 — Component `ProductHero`

**Priority:** P0 · **Tags:** `frontend` `component`

**File:** `components/product/ProductHero.tsx`

**Struktur:**
```typescript
import Image from 'next/image';
import type { Product } from '@/types/api';

interface Props {
  product: Product;
}

export function ProductHero({ product }: Props) {
  const paragraphs = product.description?.split('\n\n') ?? [];

  return (
    <section className="container mx-auto grid gap-8 px-4 py-8 md:grid-cols-12 md:py-12">
      <div className="md:col-span-5">
        {product.photo_url && (
          <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-50">
            <Image
              src={product.photo_url}
              alt={product.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 40vw"
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 md:col-span-7">
        {product.is_sni && (
          <span className="inline-flex w-fit items-center rounded bg-brand-teal-50 px-3 py-1 text-sm font-medium text-brand-teal-700">
            Bersertifikat SNI
          </span>
        )}

        <h1 className="text-3xl font-bold text-ink-primary md:text-4xl">
          {product.name}
        </h1>
        <p className="font-mono text-lg text-ink-muted">{product.code}</p>

        <div className="space-y-3">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-base leading-relaxed text-ink-secondary">
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

#### E3-S2-FE-03 — Component `SpecTable`

**Priority:** P0 · **Tags:** `frontend` `component` `dynamic`

**File:** `components/product/SpecTable.tsx`

**Struktur:**
```typescript
import { getSpecLabel } from '@/lib/product-spec-labels';
import type { ProductSpecs } from '@/types/api';

interface Props {
  specs: ProductSpecs;
}

export function SpecTable({ specs }: Props) {
  const entries = Object.entries(specs).filter(
    ([_, value]) => value !== null && value !== undefined && value !== ''
  );

  if (entries.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-8">
      <h2 className="mb-6 text-2xl font-semibold text-ink-primary">
        Spesifikasi Teknis
      </h2>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-ink-secondary">
            <tr>
              <th className="px-4 py-3 font-semibold">Parameter</th>
              <th className="px-4 py-3 font-semibold">Nilai</th>
              <th className="px-4 py-3 font-semibold">Satuan</th>
              <th className="px-4 py-3 font-semibold">Metode / Standar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {entries.map(([key, value]) => {
              const meta = getSpecLabel(key);
              return (
                <tr key={key}>
                  <td className="px-4 py-3 font-medium text-ink-primary">
                    {meta.label}
                  </td>
                  <td className="px-4 py-3 text-ink-secondary">{String(value)}</td>
                  <td className="px-4 py-3 text-ink-secondary">{meta.unit}</td>
                  <td className="px-4 py-3 text-ink-muted">{meta.method ?? '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

**Verifikasi:** Table render sesuai JSONB. Kolom "Metode" empty (`-`) untuk field yang tidak punya metode.

---

#### E3-S2-FE-04 — Component `IndustryList`

**Priority:** P1 · **Tags:** `frontend` `component`

**File:** `components/product/IndustryList.tsx`

**Struktur:**
```typescript
import { INDUSTRY_ICON_REGISTRY } from '@/lib/product-industry-icons';
import { Factory } from 'lucide-react';

interface Props {
  industries: string[];
}

export function IndustryList({ industries }: Props) {
  if (industries.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-8">
      <h2 className="mb-6 text-2xl font-semibold text-ink-primary">
        Kegunaan per Industri
      </h2>
      <ul className="flex flex-wrap gap-3">
        {industries.map((industry) => {
          const Icon = INDUSTRY_ICON_REGISTRY[industry] ?? Factory;
          return (
            <li
              key={industry}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-ink-primary"
            >
              <Icon className="h-4 w-4 text-brand-teal-600" />
              {industry}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
```

---

#### E3-S2-FE-05 — Component `LabDocDownload`

**Priority:** P0 · **Tags:** `frontend` `component`

**File:** `components/product/LabDocDownload.tsx`

**Struktur:**
```typescript
import { FileText, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

interface Props {
  url: string | null;
  productName: string;
}

export function LabDocDownload({ url, productName }: Props) {
  return (
    <section className="container mx-auto px-4 py-8">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-brand-teal-600" />
            <div>
              <h3 className="font-semibold text-ink-primary">
                Dokumen Hasil Uji Laboratorium
              </h3>
              <p className="text-sm text-ink-secondary">
                Data teknis lengkap {productName} dalam format PDF
              </p>
            </div>
          </div>
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: 'default' }))}
            >
              <Download className="mr-2 h-4 w-4" />
              Unduh PDF
            </a>
          ) : (
            <button
              type="button"
              disabled
              aria-disabled="true"
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'opacity-60 cursor-not-allowed'
              )}
              title="Dokumen sedang diperbarui"
            >
              Segera tersedia
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
```

---

#### E3-S2-FE-06 — Component `ProductCTA`

**Priority:** P0 · **Tags:** `frontend` `component` `cross-slice-integration`

**File:** `components/product/ProductCTA.tsx`

**Struktur:**
```typescript
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import type { Product } from '@/types/api';

interface Props {
  product: Product;
}

export function ProductCTA({ product }: Props) {
  const sampleHref = `/kontak?produk=${product.slug}&intent=sample`;
  const quotationHref = `/kontak?produk=${product.slug}&intent=quotation`;

  return (
    <section className="bg-brand-teal-50 py-12 md:py-16">
      <div className="container mx-auto px-4 text-center">
        <h2 className="mb-3 text-2xl font-semibold text-ink-primary md:text-3xl">
          Tertarik dengan {product.name}?
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-ink-secondary">
          Tim kami siap membantu Anda dengan sampel produk atau penawaran harga
          sesuai kebutuhan.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href={sampleHref}
            className={cn(buttonVariants({ variant: 'default', size: 'lg' }))}
          >
            Minta Sampel
          </Link>
          <Link
            href={quotationHref}
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
          >
            Dapatkan Penawaran
          </Link>
        </div>
      </div>
    </section>
  );
}
```

**Verifikasi:** Klik CTA → navigate ke `/kontak?produk=...&intent=...`. Query param benar.

---

#### E3-S2-FE-07 — Component `ProductBreadcrumb`

**Priority:** P2 · **Tags:** `frontend` `component` `a11y`

**File:** `components/product/ProductBreadcrumb.tsx`

**Struktur:**
```typescript
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface Props {
  productName: string;
}

export function ProductBreadcrumb({ productName }: Props) {
  return (
    <nav aria-label="Breadcrumb" className="container mx-auto px-4 pt-4">
      <ol className="flex items-center gap-2 text-sm text-ink-muted">
        <li>
          <Link href="/" className="hover:text-brand-teal-600">
            Beranda
          </Link>
        </li>
        <ChevronRight className="h-4 w-4" aria-hidden />
        <li>
          <Link href="/produk" className="hover:text-brand-teal-600">
            Produk
          </Link>
        </li>
        <ChevronRight className="h-4 w-4" aria-hidden />
        <li aria-current="page" className="font-medium text-ink-primary">
          {productName}
        </li>
      </ol>
    </nav>
  );
}
```

---

#### E3-S2-FE-08 — Update Contact Form (`/kontak`) baca `searchParams.produk`

**Priority:** P0 · **Tags:** `frontend` `cross-slice-integration` `epic-2-touch`

**Aksi:** Update contact form yang dibangun di **Epic 2 Slice 3** untuk:

1. Baca `searchParams.produk` dan `searchParams.intent` (page `/kontak` → convert ke Server Component atau baca via Client hook `useSearchParams`)
2. Kalau `produk` present:
   - Fetch nama produk dari DB berdasarkan slug (via `lib/supabase/public.ts`)
   - Prefill textarea pesan sesuai `intent`
   - Tampilkan label info di atas form: "Terkait produk: **{Nama Produk}**"
3. Kalau `produk` tidak valid (slug tidak ada di DB), abaikan (no prefill, no label)

**File yang di-touch:**
- `app/kontak/page.tsx` — kemungkinan perlu accept `searchParams`
- Komponen `ContactForm` — accept prop opsional `initialMessage: string` dan `linkedProductName: string | null`

**Pattern:**
```typescript
// app/kontak/page.tsx (Server Component)
export default async function KontakPage({
  searchParams,
}: {
  searchParams: Promise<{ produk?: string; intent?: string }>;
}) {
  const { produk, intent } = await searchParams;
  let linkedProductName: string | null = null;
  let initialMessage = '';

  if (produk) {
    const supabase = createPublicSupabaseClient();
    const { data } = await supabase
      .from('products')
      .select('name')
      .eq('slug', produk)
      .eq('is_active', true)
      .maybeSingle();

    if (data) {
      linkedProductName = data.name;
      if (intent === 'sample') {
        initialMessage = `Saya tertarik untuk meminta sampel produk ${data.name}. Mohon informasi terkait pengiriman sampel.`;
      } else if (intent === 'quotation') {
        initialMessage = `Saya ingin mendapatkan penawaran harga untuk produk ${data.name}. Estimasi kebutuhan: [mohon lengkapi].`;
      }
    }
  }

  return (
    <ContactForm
      initialMessage={initialMessage}
      linkedProductName={linkedProductName}
    />
  );
}
```

**Konsekuensi rendering:** Halaman `/kontak` akan berubah dari Static menjadi bergantung `searchParams` — akan jadi **Dynamic** (`ƒ`) untuk URL dengan query param. Trade-off dapat diterima karena UX-nya jauh lebih baik. Alternatif: baca di Client Component dengan `useSearchParams()` supaya `/kontak` tetap Static + query handled di client. **Rekomendasi: Client Component approach** supaya tidak downgrade rendering strategy Epic 2. Trade-off: prefill terjadi setelah hydration (flash of empty textarea).

**Verifikasi:** Klik CTA dari detail produk → landing di `/kontak?produk=...` → form textarea sudah prefilled + label produk visible.

---

#### E3-S2-FE-09 — Update `app/sitemap.ts` include 5 URL Detail

**Priority:** P0 · **Tags:** `frontend` `seo`

**File:** `app/sitemap.ts`

**Update:**
```typescript
import { createPublicSupabaseClient } from '@/lib/supabase/public';

export default async function sitemap() {
  const baseUrl = getBaseUrl(); // dari lib/env.ts atau logic auto-detect
  const supabase = createPublicSupabaseClient();
  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('is_active', true);

  const productDetailUrls = (products ?? []).map((p) => ({
    url: `${baseUrl}/produk/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [
    { url: baseUrl, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/tentang-kami`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/kontak`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/produk`, changeFrequency: 'weekly', priority: 0.9 },
    ...productDetailUrls,
  ];
}
```

**Verifikasi:** Buka `/sitemap.xml`, 5 URL detail muncul dengan `lastModified` sesuai `updated_at`.

---

#### E3-S2-FE-10 — Aktifkan Tombol "Lihat Detail" di `ProductCard`

**Priority:** P0 · **Tags:** `frontend` `slice-1-touch`

**Aksi:** Update `components/product/ProductCard.tsx` (dari Slice 1) — replace tombol disabled dengan `<Link>` aktif ke `/produk/{slug}`.

**Perubahan:**
```typescript
// Ganti tombol disabled dengan:
<Link
  href={`/produk/${product.slug}`}
  className={cn(
    buttonVariants({ variant: 'outline', size: 'sm' }),
    'mt-auto w-full'
  )}
>
  Lihat Detail →
</Link>
```

**Hapus** `title="Halaman detail segera tersedia"`.

**Verifikasi:** Dari `/produk`, klik tombol → landing di halaman detail. Regression check filter tab tetap berfungsi.

---

#### E3-S2-FE-11 — Related Products Section (Opsional)

**Priority:** P2 · **Tags:** `frontend` `enhancement`

**Deliverable:** Section di bawah CTA "Produk Lainnya" — grid mini 2-3 produk dari kategori yang sama (exclude current).

**Trade-off:** Nice-to-have, tidak blocking untuk DoD. Skip kalau tight timeline, defer ke enhancement phase pasca Epic 3.

**Verifikasi:** Kalau di-implementasi, produk yang tampil bukan produk aktif current page.

---

#### E3-S2-FE-12 — JSON-LD Structured Data Product (Opsional Bonus)

**Priority:** P2 · **Tags:** `seo` `structured-data`

**Deliverable:** Tambahkan `<script type="application/ld+json">` di detail page dengan schema `Product` (schema.org).

**Contoh:**
```typescript
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: product.description,
  image: product.photo_url,
  brand: {
    '@type': 'Brand',
    name: 'CV Reka Cipta Indonesia',
  },
  category: product.category,
};

// Render di return:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
/>
```

**Verifikasi:** Test dengan Google Rich Results Test.

---

## Layer 4 — QA Tasks (Slice 2)

### E3-S2-QA-01 — Verify Static Generation 5 URLs

**Priority:** P0 · **Tags:** `qa` `rendering`

**Aksi:** `pnpm build`. Cek output menampilkan 5 route static:
```
○ /produk/garam-halus-yodium
○ /produk/garam-halus-non-yodium
○ /produk/garam-kasar-industri
○ /produk/garam-kasar-petani
○ /produk/garam-ghpt
```

**Verifikasi:** Screenshot output build.

---

### E3-S2-QA-02 — Visual QA per Detail Page

**Priority:** P0 · **Tags:** `qa` `visual`

**Aksi:** Manual walkthrough setiap 5 halaman di 3 viewport (mobile/tablet/desktop).

**Checklist per page:**
- [ ] Foto load tanpa distorsi
- [ ] SNI badge visible untuk 2 produk yang applicable
- [ ] Spec table render benar (kolom sejajar, satuan sesuai)
- [ ] Industry chips render dengan icon
- [ ] Tombol download PDF visible & clickable
- [ ] CTA section prominent
- [ ] Breadcrumb accurate

**Verifikasi:** Screenshot 5 halaman × 3 viewport = 15 screenshot, attached di PR.

---

### E3-S2-QA-03 — Test PDF Download (All 5)

**Priority:** P0 · **Tags:** `qa` `functional`

**Aksi:** Dari setiap 5 detail page, klik tombol "Unduh PDF". Verifikasi:
- File download atau open di tab baru
- PDF valid (bukan corrupt/empty)
- Konten PDF sesuai produk (nama produk match)

**Verifikasi:** Manual test log dokumentasikan.

---

### E3-S2-QA-04 — Test CTA Prefill Contact Form

**Priority:** P0 · **Tags:** `qa` `cross-slice-integration`

**Aksi:** Dari detail page:
1. Klik "Minta Sampel" — verifikasi URL, prefill message, label produk
2. Klik "Dapatkan Penawaran" — verifikasi URL, prefill berbeda
3. Test manipulasi URL `/kontak?produk=invalid-slug` — form tidak prefill, tidak error
4. Test submit form dengan prefilled message — email masuk normal ke email destination

**Verifikasi:** Screenshot flow. Email delivery confirmed dari step 4.

---

### E3-S2-QA-05 — SEO Metadata Validation

**Priority:** P1 · **Tags:** `qa` `seo`

**Aksi:**
- Buka setiap detail page, view source (`Ctrl+U`), cek `<title>` dan `<meta name="description">` unique
- Test Open Graph dengan opengraph.xyz atau Facebook Sharing Debugger
- Test JSON-LD (kalau diimplementasi) dengan Google Rich Results Test

**Verifikasi:** Screenshot 5 halaman menampilkan metadata unique.

---

### E3-S2-QA-06 — Sitemap Validation

**Priority:** P1 · **Tags:** `qa` `seo`

**Aksi:** Buka `/sitemap.xml` di production URL. Verifikasi:
- 5 URL detail muncul
- `<lastmod>` sesuai `updated_at` DB
- XML valid (test dengan XML validator online)
- Submit ke Google Search Console (kalau sudah setup)

**Verifikasi:** Screenshot sitemap.xml.

---

### E3-S2-QA-07 — Client Demo Script Slice 2

**Priority:** P0 · **Tags:** `demo` `sign-off`

**File:** `docs/demos/epic3_slice2_demo_script.md`

**Struktur demo (~7 menit):**
1. **Recap Slice 1 (30 detik)** — "Slice 1 kita sudah punya list produk. Slice 2 ini lengkapi dengan halaman detail per produk."
2. **Demo alur user (3 menit)**:
   - Dari `/produk`, klik "Lihat Detail" PRO YD → tunjukkan foto besar, spec table, industry chips, download button, CTA
   - Klik "Unduh PDF" — buka di tab baru
   - Klik "Minta Sampel" — landing di `/kontak` dengan message prefilled, label produk visible
3. **Demo 5 produk (2 menit)** — Navigate cepat ke 5 detail page, tunjukkan spec berbeda per produk
4. **Demo mobile (1 menit)** — Resize ke mobile viewport, tunjukkan layout stack
5. **Roadmap ke depan (30 detik)** — "Epic 3 customer-facing selesai. Selanjutnya Epic 3B — panel admin untuk klien edit deskripsi, spec, dan upload foto/PDF sendiri. Setelah itu Epic 4 RFQ system menggantikan CTA saat ini."

**Sign-off criteria:** Klien setuju detail konten produk, alur download, dan alur CTA ke kontak.

---

## Definition of Done — Slice 2

**Frontend:**
- [ ] 5 route `/produk/[slug]` accessible, semua Static (`○`)
- [ ] `generateStaticParams` return 5 slug valid
- [ ] `generateMetadata` per slug menghasilkan title & description unique
- [ ] Detail page components: Hero, SpecTable, IndustryList, LabDocDownload, CTA, Breadcrumb
- [ ] `SpecTable` dynamic dari JSONB dengan spec label registry
- [ ] `IndustryList` dengan icon mapping
- [ ] CTA link ke `/kontak?produk=...&intent=...`
- [ ] Contact form (Epic 2 Slice 3) baca query param dan prefill message + label produk
- [ ] Tombol "Lihat Detail" di ProductCard aktif (bukan disabled)
- [ ] Sitemap include 5 URL detail dengan lastmod

**Integrasi:**
- [ ] Contact form regression: submit tanpa query param tetap berfungsi normal (Epic 2 tidak break)
- [ ] Test end-to-end: `/produk` → klik detail → klik CTA → prefill kontak → submit → email received

**Kualitas kode:**
- [ ] `pnpm tsc --noEmit` pass
- [ ] `pnpm lint` pass
- [ ] Tidak ada regression di test Epic 1 & Epic 2

**QA:**
- [ ] Visual QA 5 halaman × 3 viewport pass
- [ ] PDF download 5/5 valid
- [ ] SEO metadata unique per halaman
- [ ] Sitemap validated
- [ ] Lighthouse per detail page: Performance ≥ 90, SEO ≥ 95

**Demo:**
- [ ] Client demo dilakukan, sign-off Epic 3 customer-facing tercatat
- [ ] Handover ke Epic 3B (Admin CRUD) direncanakan

---

# Handover ke Epic 3B — Admin CRUD Produk (Preview)

Setelah Slice 1 & 2 customer-facing Epic 3 selesai, **Epic 3B** akan cover:

- Route `/admin/products` — list 5 produk dengan tombol Edit
- Route `/admin/products/[id]/edit` — form edit
- Upload foto ke `product-photos` bucket (dynamic per produk)
- Upload PDF lab ke `lab-docs` bucket
- Backend `PUT /products/{id}` [AUTH]
- Backend endpoint upload signed URL atau proxy upload
- Server Action revalidate `/produk` + `/produk/[slug]` setelah update
- Whitelist field editable (mis. `slug` tidak boleh diubah supaya URL stabil untuk SEO)

**Scope Epic 3B akan ada dokumen terpisah** setelah Slice 1 & 2 sign-off dari klien.

---

## Catatan Penutup

Dokumen ini adalah **task breakdown level detail** — bukan execution guide untuk Claude Code. Sebelum eksekusi otomatis:

1. Review dokumen bersama Anda untuk validasi asumsi (khususnya AR-01 sampai AR-08)
2. Konfirmasi ketersediaan data & asset (foto, PDF, spec real)
3. Setelah setuju, buatkan **Claude Code execution guide** terpisah dengan phase sequential + STOP gates (pattern sama dengan Slice 2 Epic 2 dan Slice 3 Epic 2)

**File:** `docs/epic-breakdown/epic3_task_breakdown_customer-facing.md`
**Version:** 1.0 — 2026-07-05
