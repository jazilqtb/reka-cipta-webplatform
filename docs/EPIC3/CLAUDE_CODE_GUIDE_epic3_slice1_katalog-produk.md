# Claude Code Execution Guide — Epic 3 Slice 1 (Fondasi + Halaman Daftar Produk)

**Project:** reka-cipta-platform
**Slice:** Epic 3 Slice 1 — Fondasi Produk + Halaman `/produk`
**Task Breakdown Reference:** `epic3_task_breakdown_customer-facing.md` (WAJIB dibaca sebelum eksekusi)
**Version:** 1.0
**Author:** Ach. Jazilul Qutbi
**Total Phase:** 14 | **STOP Gates:** 4

---

## Cara Pakai Guide Ini

Anda (Claude Code) akan menjalankan phase secara **berurutan**. Setiap phase punya 3 section:

- **Kerjakan** — aksi konkret yang perlu dijalankan
- **Jangan** — larangan eksplisit (constraint) untuk mencegah drift
- **Verifikasi** — cek yang wajib dilakukan sebelum lanjut ke phase berikutnya

Pada **STOP Gate**, Anda **berhenti total** dan menunggu Jazil melakukan aksi manual (Supabase Dashboard, upload asset, visual QA, demo klien). Jangan lanjut sampai Jazil eksplisit bilang "lanjut" atau "gate cleared".

Detail implementasi (kode Pydantic, SQL migration lengkap, JSX komponen) ada di **task breakdown**. Guide ini adalah **kompas eksekusi**, bukan tempat copy-paste kode.

---

## Operating Rules — Wajib Diikuti Seluruh Phase

Constraint di bawah **overrides default behavior** Anda. Kalau ada tutorial atau best practice yang bertentangan dengan rules ini, ikuti rules ini.

### R-01 — Supabase CLI `db push` Tidak Berfungsi

Jaringan Jazil punya DNS failure ke pooler URL Supabase (`aws-0-ap-southeast-1.pooler.supabase.com`). Perintah `supabase db push` akan gagal.

- **JANGAN** jalankan `supabase db push` di terminal apa pun.
- **JANGAN** sarankan URL pooler untuk `$SUPABASE_DB_URL`.
- Migration diapply via: (a) commit .sql file → Jazil eksekusi manual di **Supabase Dashboard → SQL Editor**, atau (b) `supabase db execute --db-url "$SUPABASE_DB_URL" -f <file>` dengan **direct connection string** (bukan pooler).

### R-02 — `lib/supabase/public.ts` untuk Semua Public Server Component

Route publik (`/produk`, `/produk/[slug]`, `/`, `/tentang-kami`, `/kontak`) **WAJIB** pakai `createPublicSupabaseClient()` dari `lib/supabase/public.ts` (stateless, `persistSession: false`, `autoRefreshToken: false`).

- **JANGAN** pakai `lib/supabase/server.ts` — akan `await cookies()` dan bikin route jadi Dynamic (`ƒ`), merusak Static rendering.
- **JANGAN** bikin instance client baru dengan `createClient()` langsung dari `@supabase/supabase-js` — pakai wrapper existing.

### R-03 — Base UI, Bukan Radix

Project pakai `@base-ui-components/react` (atau `@base-ui/react` — cek `package.json`).

- **JANGAN** import dari `@radix-ui/*`. Kalau butuh primitive Tabs untuk `CategoryFilterTabs`, pakai Base UI.
- **JANGAN** pakai pattern `<Button asChild><Link>...</Link></Button>` — itu Radix idiom yang tidak jalan di Base UI.
- Pattern yang benar untuk Link bergaya Button: `<Link href="..." className={cn(buttonVariants({ variant: "..." }))}>`.

### R-04 — `globals.css` Frozen

Jangan modifikasi `globals.css` kecuali untuk menambah brand token yang eksplisit ter-approve. Untuk Slice 1, **tidak ada** perubahan `globals.css` yang perlu.

- Kalau butuh styling baru, pakai Tailwind utility di JSX.
- Kalau butuh warna baru yang belum ada di Design System, **STOP** dan tanya Jazil dulu.

### R-05 — Next.js 15 Async Params & searchParams

Route handler dan `page.tsx` yang terima `params` / `searchParams` **WAJIB** async signature:

```tsx
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // ...
}
```

- **JANGAN** pakai signature sync `params: { slug: string }`.
- **JANGAN** tambah `@ts-expect-error` untuk pattern Next.js 15 yang legit (mis. `inert` boolean).

### R-06 — Static Access untuk `lib/env.ts`

`process.env.NEXT_PUBLIC_*` harus di-akses **eksplisit ditulis**, bukan via `process.env[key]` — Next.js bundler tidak inline dynamic access.

- **JANGAN** pattern `const val = process.env[envKey];`
- **YA** pattern `const val = process.env.NEXT_PUBLIC_API_URL;`

### R-07 — TypeScript ↔ Pydantic Manual Sync

`types/api.ts` interfaces di-maintain manual dengan `backend/schemas/*.py`. Kalau ubah salah satu, ubah keduanya di commit yang sama.

### R-08 — Bahasa Komunikasi

Semua komunikasi ke Jazil (progress update, pertanyaan, error report) dalam **Bahasa Indonesia**. Kode, nama variable, komentar TypeScript boleh English (industri standard). Komentar SQL boleh mix.

### R-09 — Reuse Existing Component

Sebelum bikin komponen baru, cek dulu apakah sudah ada di Epic 1/2:
- `InnerPageHero` — **WAJIB reuse** untuk hero section `/produk`. Cek di `components/hero/` atau `components/layout/`.
- Button variants — **WAJIB reuse** dari `components/ui/button.tsx` atau setara.
- Navbar & Footer — global, jangan bikin baru.

Kalau spec berbeda, extend dengan prop opsional (`variant`, `subtitle`), **JANGAN** bikin komponen duplikat.

### R-10 — Branch Strategy

Slice 1 dikerjakan di feature branch `feature/epic3-slice1-katalog-produk` yang dibuat dari `dev`. Setelah semua phase selesai + demo klien approve, merge ke `dev`. Merge ke `main` dilakukan Jazil manual saat ready untuk production release Epic 3.

---

# PHASE 1 — Preflight & Branch Setup

**Tujuan:** Konfirmasi state repo bersih, prasyarat terpenuhi, dan buat feature branch.

## Kerjakan

1. `git status` — pastikan working directory bersih (no uncommitted changes). Kalau ada, laporkan ke Jazil dan tunggu instruksi.
2. `git fetch origin && git checkout dev && git pull origin dev` — sync latest dev branch.
3. Verifikasi 3 file kritikal dari Epic 2 sudah ada:
   - `lib/supabase/public.ts` (fungsi `createPublicSupabaseClient` exports)
   - `lib/api.ts` (fungsi `apiFetch` exists)
   - Komponen `InnerPageHero` (grep di `components/`)
4. Verifikasi Epic 2 Slice 3 selesai: route `app/kontak/page.tsx` exists, route `app/admin/settings/page.tsx` exists.
5. Buat branch baru: `git checkout -b feature/epic3-slice1-katalog-produk`

## Jangan

- Jangan modifikasi apa pun di phase ini. Ini pure inspeksi.
- Jangan proceed kalau ada uncommitted change atau file kritikal tidak ada — laporkan ke Jazil dulu.

## Verifikasi

- [ ] Branch aktif: `feature/epic3-slice1-katalog-produk`
- [ ] File Epic 2 kritikal ter-detect
- [ ] Working directory bersih

---

# PHASE 2 — Buat SQL Migration & Seed Files

**Tujuan:** Bikin file `.sql` untuk migration `products` table, RLS, storage RLS, dan seed 5 produk. **File hanya di-commit, belum di-apply.**

## Kerjakan

1. Generate timestamp UTC format `YYYYMMDDHHMMSS` (contoh: `20260705120000`) untuk penamaan migration.
2. Buat 3 file migration di folder `supabase/migrations/`:
   - `{ts}_create_products_table.sql` — CREATE TABLE `products` dengan **skema final** (lihat task `E3-S1-DB-01` di task breakdown, termasuk 4 field tambahan: `category`, `sort_order`, `is_active`, `created_at`, dengan CHECK constraint kategori, indexes, dan trigger auto-update `updated_at`).
   - `{ts+1}_products_rls.sql` — 5 policy RLS Pattern A (lihat task `E3-S1-DB-02`).
   - `{ts+2}_storage_products_rls.sql` — 8 policy untuk bucket `product-photos` dan `lab-docs` (lihat task `E3-S1-DB-04`).
3. Buat file seed `supabase/seeds/products_seed.sql` — 5 produk lengkap dengan JSONB spec, array industries, sort_order 1-5 (lihat task `E3-S1-DB-06`). **BIARKAN placeholder `{PROJECT_REF}`** — akan diganti Jazil manual.
4. `git add supabase/ && git commit -m "chore(db): add products table migration, RLS, and seed [Epic 3 Slice 1]"`

## Jangan

- **JANGAN** eksekusi `supabase db push`, `supabase db reset`, atau perintah apa pun yang mencoba apply migration ke DB. Ini pure file creation phase.
- **JANGAN** replace `{PROJECT_REF}` di seed file — Jazil yang lakukan manual dengan project ref-nya sendiri.
- **JANGAN** skip CHECK constraint di CREATE TABLE — validasi kategori penting untuk data integrity.
- **JANGAN** pakai Postgres ENUM type untuk `category` — pakai VARCHAR + CHECK constraint (lebih fleksibel, alasan di AR-01 task breakdown).

## Verifikasi

- [ ] 4 file `.sql` created di path yang benar
- [ ] Commit sudah masuk branch
- [ ] `{PROJECT_REF}` masih ada sebagai placeholder di `products_seed.sql`
- [ ] Semua file syntax-valid SQL (bisa cek dengan `psql --dry-run` kalau perlu, atau visual inspection)

---

# 🛑 STOP GATE 1 — Manual Supabase Dashboard Setup

**Status:** Menunggu Jazil melakukan aksi manual di Supabase Dashboard.

## Aksi Manual yang Jazil Lakukan

1. **Buat Storage buckets** via Dashboard → Storage → New bucket:
   - `product-photos` (public, 5 MB limit, MIME: `image/jpeg`, `image/png`, `image/webp`)
   - `lab-docs` (public, 10 MB limit, MIME: `application/pdf`)
2. **Upload 5 placeholder foto** ke `product-photos` dengan nama file: `pro-yd.jpg`, `pro-l.jpg`, `spo-m.jpg`, `petani-premium.jpg`, `ghpt.jpg`
3. **Upload 5 placeholder PDF** ke `lab-docs` dengan nama: `lab-pro-yd.pdf`, `lab-pro-l.pdf`, `lab-spo-m.pdf`, `lab-petani-premium.pdf`, `lab-ghpt.pdf`
4. **Copy project ref** dari Dashboard → Settings → General
5. **Edit `supabase/seeds/products_seed.sql`** — replace 10 occurrences `{PROJECT_REF}` dengan project ref aktual. Commit perubahan.
6. **Apply migrations via Dashboard → SQL Editor** dengan urutan:
   - `create_products_table.sql`
   - `products_rls.sql`
   - `storage_products_rls.sql`
   - `products_seed.sql`
7. **Verifikasi** di SQL Editor:
   ```sql
   SELECT count(*) FROM products;              -- harus 5
   SELECT slug FROM products ORDER BY sort_order;
   SELECT * FROM pg_policies WHERE tablename = 'products';  -- harus 5 rows
   ```
8. **Test public URL** salah satu foto di browser — harus render.

## Setelah Gate Ini Clear

Jazil akan bilang: "Gate 1 clear" atau "supabase setup done". Setelah itu lanjut Phase 3.

## Sinyal Masalah — Berhenti dan Konsultasi Jazil Kalau

- Migration gagal apply — kemungkinan syntax error atau conflict dengan schema existing.
- `count(*) FROM products` bukan 5 — kemungkinan seed conflict atau `{PROJECT_REF}` belum di-replace.
- RLS policy count kurang — cek policy names di migration sudah unique.

---

# PHASE 3 — Backend Pydantic Schema

**Tujuan:** Buat `backend/schemas/product.py` dengan 3 schema (Product, ProductListResponse, ProductDetailResponse).

## Kerjakan

1. Buat file `backend/schemas/product.py` sesuai spec task `E3-S1-BE-01`.
2. Pastikan `model_config = ConfigDict(from_attributes=True)` untuk kompatibilitas dengan Supabase row.
3. Type hints: `dict[str, Any]` untuk `specs`, `list[str]` untuk `industries`, `datetime` untuk timestamps.
4. Aktifkan virtual environment sebelum import test: `cd backend && source .venv/bin/activate` (atau ekuivalen di OS Jazil).
5. Test import: `python -c "from backend.schemas.product import Product, ProductListResponse, ProductDetailResponse"` — harus tidak error.

## Jangan

- **JANGAN** pakai `pydantic.v1` — project pakai Pydantic v2.
- **JANGAN** tambah field yang tidak ada di skema DB — Contract-first, sync ketat.
- **JANGAN** commit dulu di phase ini — akan commit bareng router di Phase 4.

## Verifikasi

- [ ] Import test pass tanpa error
- [ ] Semua field DB (14 field) ter-represent di Pydantic model
- [ ] Type hints resolve

---

# PHASE 4 — Backend Router `products.py`

**Tujuan:** Implementasi `GET /products` dan `GET /products/{slug}`, register di `main.py`.

## Kerjakan

1. Buat file `backend/routers/products.py` sesuai spec task `E3-S1-BE-02`:
   - Router prefix: `/products`, tags: `["products"]`
   - `list_products()` — filter `is_active = TRUE`, order `sort_order` ASC
   - `get_product_by_slug(slug: str)` — return 404 kalau tidak ditemukan
2. Update `backend/main.py`:
   - Tambah import: `from backend.routers import products`
   - Tambah include: `app.include_router(products.router)`
3. Jalankan FastAPI dev server local: `uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000`
4. Buka `http://localhost:8000/docs` — verifikasi section `products` muncul dengan 2 endpoint terlist.
5. Test manual di terminal terpisah (**gunakan `curl` bukan `httpie` untuk konsistensi log**):
   ```bash
   curl -s http://localhost:8000/products | jq '.total'
   # Expected: 5

   curl -s http://localhost:8000/products/garam-halus-yodium | jq '.product.name'
   # Expected: "Garam Halus Yodium"

   curl -i http://localhost:8000/products/tidak-ada
   # Expected: HTTP/1.1 404
   ```
6. Commit: `git add backend/ && git commit -m "feat(api): add products endpoints [Epic 3 Slice 1]"`

## Jangan

- **JANGAN** tambah `Depends(get_current_user)` di kedua endpoint — kedua public, no auth.
- **JANGAN** pakai `get_supabase_client()` (anon client) — pakai `get_supabase_service()` (service role) konsisten dengan pattern Epic 2.
- **JANGAN** hardcode `is_active = True` di query kalau field tidak ada di DB — verifikasi di Phase 2 udah bikin field ini.
- **JANGAN** deploy ke Railway di phase ini — akan di Phase 5 setelah verifikasi local.

## Verifikasi

- [ ] `/docs` OpenAPI menampilkan 2 endpoint products
- [ ] Curl test 3/3 pass (total=5, name match, 404 untuk invalid)
- [ ] Commit sudah masuk

---

# PHASE 5 — Deploy Backend ke Railway Staging

**Tujuan:** Push branch ke remote, trigger Railway deploy staging, verifikasi endpoint accessible di production URL.

## Kerjakan

1. `git push -u origin feature/epic3-slice1-katalog-produk`
2. Tunggu Railway auto-deploy (biasanya 2-4 menit). Cek Railway dashboard untuk status build & deploy.
3. Setelah deploy selesai, ambil staging URL dari Railway (atau `$NEXT_PUBLIC_API_URL` yang sudah diset untuk staging).
4. Test production endpoints:
   ```bash
   curl -s https://<railway-staging-url>/products | jq '.total'
   curl -s https://<railway-staging-url>/products/garam-halus-yodium | jq '.product.slug'
   ```
5. Kalau ada error 500, cek Railway logs dan investigate (biasanya env var `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` belum di-set atau typo).

## Jangan

- **JANGAN** push ke `dev` atau `main` — hanya push ke feature branch.
- **JANGAN** commit `.env` atau secret ke repo.
- **JANGAN** skip test production endpoint — kalau backend belum accessible, frontend akan gagal build (karena beberapa fetch di Server Component).

## Verifikasi

- [ ] Railway deploy sukses (green status)
- [ ] Production `/products` return 5 produk
- [ ] Production `/products/garam-halus-yodium` return valid response

---

# PHASE 6 — Contract Layer (types + lib/api)

**Tujuan:** Update `types/api.ts` dengan Product interface, tambah 2 fetcher di `lib/api.ts`.

## Kerjakan

1. Update `types/api.ts` sesuai spec task `E3-S1-CT-01`:
   - Type alias `ProductCategory = 'halus' | 'kasar' | 'industri'`
   - Interface `ProductSpecs` (dengan index signature untuk fleksibilitas future field)
   - Interface `Product`, `ProductListResponse`, `ProductDetailResponse`
   - **Header komentar**: `// KEEP IN SYNC with backend/schemas/product.py` — untuk future maintainer.
2. Update `lib/api.ts` tambah 2 fungsi:
   - `getProducts()` → `apiFetch<ProductListResponse>('/products', { auth: false })`
   - `getProductBySlug(slug)` → `apiFetch<ProductDetailResponse>('/products/${slug}', { auth: false })`
3. Type check global: `pnpm tsc --noEmit`. Harus **0 error**. Kalau error, fix dulu sebelum lanjut.
4. Commit: `git add types/ lib/ && git commit -m "feat(contract): add product types and api fetchers [Epic 3 Slice 1]"`

## Jangan

- **JANGAN** tambah field TypeScript yang tidak ada di Pydantic — akan bikin drift.
- **JANGAN** pakai `any` untuk `specs` — pakai `ProductSpecs` interface dengan index signature.
- **JANGAN** hilangkan flag `{ auth: false }` — endpoint public, tidak perlu JWT.

## Verifikasi

- [ ] `pnpm tsc --noEmit` pass tanpa error
- [ ] Import `getProducts` dari `@/lib/api` bisa dilakukan tanpa TS error
- [ ] Commit sudah masuk

---

# PHASE 7 — Route `/produk/page.tsx` (Server Component)

**Tujuan:** Buat halaman utama `/produk` sebagai Server Component + ISR, fetch produk via `lib/supabase/public.ts`, render InnerPageHero + placeholder untuk grid.

## Kerjakan

1. Verifikasi import path `InnerPageHero`:
   ```bash
   grep -r "export.*InnerPageHero" components/
   ```
   Catat path exact untuk import di `page.tsx`.
2. Buat file `app/produk/page.tsx` sesuai spec task `E3-S1-FE-01`:
   - `export const revalidate = 3600`
   - `export const metadata: Metadata = { ... }` dengan title & description
   - Fetch products via `createPublicSupabaseClient()` (**bukan** `createServerClient`)
   - Order by `sort_order` ASC, filter `is_active = true`
   - Render `<InnerPageHero>` dengan title "Katalog Produk"
   - Pass `products` ke `<CategoryFilterTabs>` (akan dibuat Phase 9)
3. Untuk sementara kalau `CategoryFilterTabs` belum ada, render placeholder: `<div>Total: {typedProducts.length} produk</div>` supaya bisa test route dulu.
4. Jalankan `pnpm dev`, buka `http://localhost:3000/produk`. Halaman harus render tanpa error, menampilkan hero + placeholder "Total: 5 produk".

## Jangan

- **JANGAN** import `createServerClient` dari `lib/supabase/server.ts` — akan trigger `cookies()` dan bikin route Dynamic.
- **JANGAN** pakai `'use client'` di file ini — Server Component.
- **JANGAN** pakai `fetch` langsung ke backend FastAPI untuk fetch produk di sini — pakai Supabase langsung (public data, lebih cepat, skip network hop).
- **JANGAN** skip verifikasi InnerPageHero path — kalau import salah, build akan gagal.

## Verifikasi

- [ ] Route `/produk` accessible di dev server, no runtime error
- [ ] Placeholder text menunjukkan "5 produk"
- [ ] Hero render dengan konsisten style dengan `/tentang-kami`

---

# PHASE 8 — Component `ProductGrid` & `ProductCard`

**Tujuan:** Bikin 2 komponen presentation untuk render grid dan kartu produk. Tombol "Lihat Detail" **disabled** di Slice 1.

## Kerjakan

1. Buat `components/product/ProductGrid.tsx` sesuai spec task `E3-S1-FE-03`:
   - Terima `products: Product[]`
   - Render grid responsive `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
   - Empty state kalau `products.length === 0`
2. Buat `components/product/ProductCard.tsx` sesuai spec task `E3-S1-FE-04`:
   - `<article>` semantic tag
   - `<Image>` dari `next/image` dengan `fill`, `sizes` responsive, `object-cover`
   - Badge SNI conditional
   - Nama, code (font-mono), tagline (line-clamp-2)
   - **Tombol "Lihat Detail" harus disabled** — pakai `<button disabled aria-disabled="true">` dengan opacity 60% dan tooltip. **JANGAN** pakai `<Link>` — route detail belum ada, akan diaktifkan di Slice 2.
3. Sementara belum ada CategoryFilterTabs, update `app/produk/page.tsx` untuk render langsung `<ProductGrid products={typedProducts} />` supaya bisa test visual.
4. Reload dev server. Halaman `/produk` sekarang menampilkan 5 kartu produk dengan foto (dari public URL Supabase).

## Jangan

- **JANGAN** pakai `<img>` biasa — wajib `<Image>` Next.js untuk optimization.
- **JANGAN** hardcode dimensions foto — pakai `fill` + parent container dengan `aspect-[4/3]`.
- **JANGAN** aktifkan tombol "Lihat Detail" jadi Link — akan diaktifkan di Slice 2 task `E3-S2-FE-10`. Kalau aktifkan sekarang, klik akan 404.
- **JANGAN** hardcode warna hex — pakai Tailwind token (`brand-teal-*`, `ink-*`, `slate-*`).

## Verifikasi

- [ ] 5 kartu render dengan foto real dari Storage
- [ ] Badge SNI muncul untuk produk 1 & 2 (PRO YD, PRO L)
- [ ] Tombol "Lihat Detail" disabled dengan cursor `not-allowed`
- [ ] Grid responsive (test resize browser: 3 kolom → 2 kolom → 1 kolom)

---

# PHASE 9 — Component `CategoryFilterTabs` (Client Component)

**Tujuan:** Bikin filter tab dengan Base UI Tabs primitive, filter client-side, sync dengan URL query param.

## Kerjakan

1. Cek versi Base UI di `package.json`. Confirm import path untuk Tabs primitive (`@base-ui-components/react/tabs` atau `@base-ui/react`).
2. Buat `components/product/CategoryFilterTabs.tsx` sesuai spec task `E3-S1-FE-05`:
   - Directive `'use client'` di baris pertama
   - Import `Tabs` dari Base UI
   - State `activeTab: TabValue` (default `'all'` atau dari `useSearchParams`)
   - 4 tab: Semua, Garam Halus, Garam Kasar, Garam Industri
   - `useMemo` untuk `filteredProducts` berdasarkan `activeTab`
   - `useEffect` sync URL dengan `router.replace(..., { scroll: false })`
   - Render `<ProductGrid products={filteredProducts} />` di dalam `Tabs.Panel`
3. Update `app/produk/page.tsx` — replace direct `<ProductGrid>` dengan `<CategoryFilterTabs products={typedProducts} />`.
4. Reload dev server. Test:
   - Klik tab "Garam Halus" — grid filter jadi 3 produk (PRO YD, PRO L, GHPT)
   - Klik tab "Garam Kasar" — grid filter jadi 1 produk (Petani Premium)
   - Klik tab "Garam Industri" — grid filter jadi 1 produk (SPO/M)
   - URL berubah jadi `/produk?kategori=halus` (dst)
   - Refresh browser di URL `/produk?kategori=kasar` — tab "Garam Kasar" auto-selected

## Jangan

- **JANGAN** import Tabs dari `@radix-ui/react-tabs` — project pakai Base UI (constraint R-03).
- **JANGAN** re-fetch backend saat filter change — filtering client-side dengan `useMemo`.
- **JANGAN** pakai `router.push` untuk sync URL — pakai `router.replace({ scroll: false })` supaya tidak scroll ke atas dan tidak menambah history entry.
- **JANGAN** commit dulu — akan commit bareng polish phase.

## Verifikasi

- [ ] 4 tab render dengan label Indonesian benar
- [ ] Filter berfungsi (3 kategori + Semua)
- [ ] URL deep-link preserve tab state after refresh
- [ ] Empty state muncul saat kategori kosong (edge case, mungkin tidak reproducible karena semua kategori isi — test manual dengan sementara set `is_active=false` di DB salah satu produk lalu revert)

**Kalau Base UI Tabs bermasalah** (mis. styling tidak muncul, event tidak firing): fallback ke implementasi manual dengan `<button>` array + local state — lapor ke Jazil sebelum switch approach.

---

# PHASE 10 — Frontend Polish (Skeleton, Error, Navbar, Sitemap)

**Tujuan:** Tambahkan loading state, error boundary, update navigation link, dan sitemap.

## Kerjakan

1. **Loading skeleton** (opsional tapi recommended):
   - Buat `components/product/ProductGridSkeleton.tsx` sesuai spec task `E3-S1-FE-06`
   - Buat `app/produk/loading.tsx` yang render `<InnerPageHero>` + `<ProductGridSkeleton />`
2. **Error boundary**:
   - Buat `app/produk/error.tsx` — Client Component dengan `reset` button (spec di task `E3-S1-FE-09`)
3. **Navbar link "Produk"**:
   - Buka file Navbar (kemungkinan `components/layout/Navbar.tsx` atau setara).
   - Verifikasi link "Produk" sudah aktif ke `/produk` (bukan `#` atau placeholder).
   - Kalau active state highlight belum ter-implement, tambahkan dengan `usePathname` comparison.
4. **Sitemap update**:
   - Buka `app/sitemap.ts`.
   - Tambah entry `{ url: '${baseUrl}/produk', changeFrequency: 'weekly', priority: 0.9 }`.
   - **JANGAN** tambah 5 URL detail dulu — itu Slice 2 task `E3-S2-FE-11`.
5. Reload dev server, test:
   - Buka `/sitemap.xml` — `/produk` muncul
   - Trigger error boundary manual: sementara `throw new Error()` di `page.tsx`, verifikasi error page render, revert.

## Jangan

- **JANGAN** tambah 5 URL detail produk di sitemap — belum ada route detail.
- **JANGAN** ubah `robots.ts` — sudah handled Epic 1/2.
- **JANGAN** modifikasi `globals.css` untuk styling skeleton — pakai Tailwind utility `animate-pulse bg-slate-100`.

## Verifikasi

- [ ] `/sitemap.xml` include `/produk`
- [ ] Loading state visible saat hard refresh (throttle network di DevTools untuk simulasi)
- [ ] Error boundary tested (revert changes setelah test)
- [ ] Navbar "Produk" link ke `/produk` dengan active state highlight

---

# PHASE 11 — Build & Rendering Verification

**Tujuan:** Pastikan `/produk` render sebagai Static (`○`), no dynamic downgrade. Ini gate penting sebelum deploy.

## Kerjakan

1. Jalankan `pnpm build` di root project.
2. Cek output section "Route (app)". Cari baris `/produk`. Harus prefix `○` (Static).
3. Kalau muncul `ƒ` (Dynamic), **STOP** dan investigate:
   - Grep `page.tsx` dan komponen anak untuk import `next/headers`, `cookies()`, `noStore()`.
   - Cek apakah accidentally import `lib/supabase/server.ts`.
   - Cek apakah `useSearchParams` di-consume di Server Component (harus di Client Component).
4. Kalau `○` confirmed, cek juga First Load JS size — target < 200 KB untuk route ini. Kalau > 200 KB, cek bundle analyzer atau lazy-load CategoryFilterTabs.
5. `pnpm lint` — 0 error. Warning boleh, tapi 0 error.
6. Commit semua perubahan Phase 7-11:
   ```
   git add app/ components/ types/ lib/
   git commit -m "feat(produk): add /produk list page with filter tabs [Epic 3 Slice 1]"
   ```

## Jangan

- **JANGAN** proceed ke deploy staging kalau `/produk` masih `ƒ` — investigate dulu.
- **JANGAN** disable ESLint rule untuk suppress warning — fix root cause.
- **JANGAN** commit `.next/` folder (harus di `.gitignore`).

## Verifikasi

- [ ] Build sukses, no error
- [ ] `/produk` menampilkan `○` (Static) di build output
- [ ] `pnpm lint` 0 error
- [ ] Commit sudah masuk

---

# PHASE 12 — Deploy Staging (Vercel Preview)

**Tujuan:** Push branch untuk trigger Vercel preview deploy.

## Kerjakan

1. `git push origin feature/epic3-slice1-katalog-produk` (kalau belum push sebelumnya) atau `git push` (kalau upstream sudah set di Phase 5).
2. Tunggu Vercel auto-deploy (biasanya 2-4 menit). Cek Vercel dashboard atau komentar PR (kalau PR sudah dibuat).
3. Setelah deploy selesai, ambil preview URL Vercel.
4. Smoke test di preview URL:
   - `/produk` render dengan 5 kartu
   - Filter tab berfungsi
   - Deep-link `?kategori=halus` preserve state
   - Foto load dari Supabase Storage (bukan broken image)
5. Report preview URL ke Jazil untuk visual QA.

## Jangan

- **JANGAN** merge PR sebelum Jazil approve visual QA di STOP Gate 2.
- **JANGAN** ubah env variable production di Vercel dashboard tanpa konfirmasi Jazil.

## Verifikasi

- [ ] Vercel preview deploy sukses (green status)
- [ ] Smoke test 4/4 pass di preview URL
- [ ] Preview URL diberitahukan ke Jazil

---

# 🛑 STOP GATE 2 — Visual QA & Design System Compliance

**Status:** Menunggu Jazil melakukan visual QA di preview URL.

## Aksi Manual yang Jazil Lakukan

1. **Visual QA di 5 viewport** (mobile 320px, mobile 375px, tablet 768px, desktop 1024px, wide 1440px):
   - Grid kolom sesuai (1/2/3)
   - Filter tab tidak overflow, horizontal scroll mobile smooth
   - Foto proporsi benar
   - Tap target ≥ 44×44px
   - Text tidak overflow
2. **Accessibility scan** dengan axe DevTools browser extension — target 0 critical & 0 serious.
3. **Lighthouse mobile audit** — target Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95.
4. **Design System v2.0 walkthrough** — cek warna via CSS vars, typography scale, spacing token.
5. **Test keyboard navigation** — Tab through filter tab dan tombol tanpa mouse.

## Setelah Gate Ini Clear

Jazil bilang "Gate 2 clear" atau "visual QA approved". Kalau ada issue, Jazil akan list fix yang perlu. Anda kerjakan fix-nya, push, lalu tunggu re-review.

## Sinyal Masalah yang Mungkin Muncul

- **Lighthouse Performance < 90:** cek foto size (compress placeholder), lazy load CategoryFilterTabs dengan `dynamic(() => import(...), { ssr: false })`, verify Next.js Image sizes prop.
- **axe critical:** biasanya missing alt text di `<Image>`, atau kontras warna kurang. Fix sesuai axe recommendation.
- **Grid tidak responsive:** cek Tailwind breakpoint class benar (`md:grid-cols-2 lg:grid-cols-3`).
- **Foto broken:** cek public URL di seed SQL, verifikasi bucket policy public read benar.

---

# PHASE 13 — Merge ke `dev` & Deploy Staging Final

**Tujuan:** Merge feature branch ke `dev` setelah Gate 2 clear.

## Kerjakan

1. Buat pull request (kalau belum) dari `feature/epic3-slice1-katalog-produk` ke `dev`.
2. Isi PR description dengan:
   - Ringkasan Slice 1 scope
   - Screenshot build output (menampilkan `○ /produk`)
   - Screenshot Lighthouse score
   - Link ke task breakdown reference
   - DoD checklist dari task breakdown, semua ter-check
3. Setelah Jazil approve, merge ke `dev` (squash atau merge commit sesuai preferensi Jazil — default: merge commit untuk preserve history).
4. Verifikasi Vercel auto-deploy `dev` branch sukses.
5. Smoke test di URL staging `dev` — sama dengan Phase 12.

## Jangan

- **JANGAN** merge ke `main` — merge ke `main` untuk production release dilakukan Jazil manual setelah demo klien approve.
- **JANGAN** hapus feature branch dulu — biarkan sampai demo klien selesai, untuk possible rollback.
- **JANGAN** force push atau rewrite history di `dev`.

## Verifikasi

- [ ] PR merged ke `dev`
- [ ] Vercel staging deploy `dev` sukses
- [ ] Smoke test pass di staging URL

---

# 🛑 STOP GATE 3 — Client Demo & Sign-Off

**Status:** Menunggu Jazil melakukan demo ke klien (Manager Pemasaran Irwan Sugianto + Direktur Abdul Majid Abdillah).

## Aksi Manual yang Jazil Lakukan

1. **Prepare demo environment** — buka staging URL di browser besar (share screen).
2. **Follow demo script** dari `docs/demos/epic3_slice1_demo_script.md`:
   - Konteks pembukaan (mention placeholder asset)
   - Demo `/produk` grid & filter
   - Demo responsive
   - Demo deep-link
   - Roadmap Slice 2
3. **Kumpulkan feedback** — kalau ada revisi konten teks atau layout minor, catat.
4. **Konfirmasi sign-off** — klien setuju untuk lanjut ke Slice 2 (detail pages).

## Setelah Gate Ini Clear

Jazil bilang "demo done, sign-off OK". Setelah itu:
- Kalau ada revisi minor, Anda kerjakan → push ke `dev` → Jazil verify → merge ke `main` untuk production release.
- Kalau no revisi, Jazil merge `dev` → `main` manual untuk production release Slice 1.
- **Slice 1 CLOSED.** Siap untuk Slice 2 (butuh Claude Code guide terpisah).

## Sinyal Masalah

- **Klien tidak setuju layout:** kemungkinan design system perlu adjustment. Diskusi dulu dengan Jazil sebelum ubah komponen (bisa jadi Design System v2.0 yang perlu update, bukan komponen individual).
- **Klien minta konten teks berbeda:** update seed SQL, apply lagi di Dashboard. Kalau perubahan sifatnya struktural (skema), STOP dan konsultasi.
- **Klien tanya kapan foto asli:** jawab jujur — akan setelah Epic 3B (admin panel) live dan tim marketing upload sendiri.

---

# PHASE 14 — Cleanup & Handover

**Tujuan:** Cleanup post-merge, update dokumentasi, dan handover ke persiapan Slice 2.

## Kerjakan

1. Setelah production deploy sukses (Jazil confirm), hapus feature branch:
   ```bash
   git branch -d feature/epic3-slice1-katalog-produk
   git push origin --delete feature/epic3-slice1-katalog-produk
   ```
2. Update `README.md` atau `docs/CHANGELOG.md` (kalau ada) dengan entry Slice 1 completed.
3. Update project memory / progress tracker: Slice 1 Epic 3 ✅.
4. Handover note ke Slice 2 di dokumen atau chat:
   - Semua backend endpoint sudah live (list + detail by slug)
   - Tombol "Lihat Detail" di ProductCard perlu diaktifkan (Slice 2 task `E3-S2-FE-10`)
   - Contact form di `/kontak` perlu update baca `searchParams.produk` (Slice 2 task `E3-S2-FE-08`)
   - Sitemap perlu tambah 5 URL detail (Slice 2 task `E3-S2-FE-11`)

## Jangan

- **JANGAN** hapus branch sebelum production deploy confirmed stable (minimal 1 hari observation, tidak ada error report).
- **JANGAN** anggap Slice 1 selesai sebelum ada sign-off eksplisit dari klien.

## Verifikasi

- [ ] Feature branch dihapus (local + remote)
- [ ] Progress tracker updated
- [ ] Handover note ke Slice 2 clear

---

# Kontingensi & Troubleshooting

## Situasi: Build gagal karena TypeScript error di `types/api.ts`

**Symptom:** `pnpm build` fail dengan pesan tipe tidak match antara `types/api.ts` dan usage di `page.tsx` / komponen.

**Root cause biasanya:** Field TypeScript tidak match dengan response backend. Contoh: `created_at` di TS `string` tapi backend return null untuk field lain.

**Fix:**
1. Cek response actual: `curl <backend>/products | jq`
2. Bandingkan field-by-field dengan interface `Product` di `types/api.ts`
3. Fix mismatch, biasanya nullable (`string | null`)

## Situasi: Route `/produk` muncul `ƒ` bukan `○`

**Symptom:** Build output `ƒ /produk` — Dynamic rendering, ISR tidak jalan.

**Root cause biasa:**
- Accidental import `lib/supabase/server.ts` (mengandung `cookies()`)
- `useSearchParams()` dipakai di file yang tidak `'use client'`
- Import fungsi yang trigger dynamic (mis. `headers()` dari `next/headers`)

**Fix:**
1. `grep -rn "from '@/lib/supabase/server'" app/produk/` — kalau ada, ganti ke `public`
2. `grep -rn "cookies()" app/produk/` — hapus atau move ke Client Component
3. Pastikan `CategoryFilterTabs.tsx` punya `'use client'` (bukan Server Component)

## Situasi: Foto produk broken di production tapi OK di local

**Symptom:** `/produk` render tapi foto blank/broken image.

**Root cause biasa:**
- Public URL Supabase salah format (typo `{PROJECT_REF}` masih ada)
- Bucket policy tidak public read
- Next.js `next.config.js` tidak whitelist domain Supabase

**Fix:**
1. Cek URL manual di browser — akses langsung ke `https://xxx.supabase.co/storage/v1/object/public/product-photos/pro-yd.jpg`. Kalau 404 atau 400, fix di database (update `photo_url`).
2. Kalau URL OK di browser tapi Next.js `<Image>` error: tambah domain di `next.config.js`:
   ```js
   images: {
     remotePatterns: [
       { protocol: 'https', hostname: '<project-ref>.supabase.co' }
     ]
   }
   ```

## Situasi: Backend `/products` return `[]` empty di production

**Symptom:** Backend return `{"products": [], "total": 0}` walaupun DB ada 5 baris.

**Root cause biasa:**
- Backend production connect ke Supabase project berbeda dari staging (env var beda)
- Semua produk `is_active = false` accidentally
- RLS policy salah — service_role tidak bypass RLS (harusnya bypass by default, tapi service role key salah bisa jadi anon)

**Fix:**
1. Cek `SUPABASE_URL` di Railway production env var — match dengan project yang ada seed data?
2. Cek `SUPABASE_SERVICE_ROLE_KEY` di Railway — bukan anon key.
3. Query DB direct: `SELECT count(*) FROM products WHERE is_active = TRUE;` di Supabase SQL Editor.

## Situasi: Filter tab tidak update URL

**Symptom:** Klik tab, grid filter, tapi URL tetap `/produk` tanpa query param.

**Root cause biasa:**
- `useEffect` untuk sync URL tidak terpasang benar
- `router.replace` dipanggil dengan URL absolute alih-alih relative
- Race condition antara `useState` dan `useEffect`

**Fix:** Cek `CategoryFilterTabs.tsx`, verify `useEffect` dependencies `[activeTab, router, searchParams]`. Verify pakai `router.replace` bukan `router.push`.

---

# Ringkasan File yang Dibuat di Slice 1

**Database (via Supabase Dashboard manual):**
- `supabase/migrations/{ts}_create_products_table.sql`
- `supabase/migrations/{ts}_products_rls.sql`
- `supabase/migrations/{ts}_storage_products_rls.sql`
- `supabase/seeds/products_seed.sql`

**Backend:**
- `backend/schemas/product.py`
- `backend/routers/products.py`
- Modifikasi: `backend/main.py`

**Frontend Contract:**
- Modifikasi: `types/api.ts`
- Modifikasi: `lib/api.ts`

**Frontend Route & Components:**
- `app/produk/page.tsx`
- `app/produk/loading.tsx` (opsional)
- `app/produk/error.tsx` (opsional)
- `components/product/ProductGrid.tsx`
- `components/product/ProductCard.tsx`
- `components/product/CategoryFilterTabs.tsx`
- `components/product/ProductGridSkeleton.tsx` (opsional)

**Config:**
- Modifikasi: `app/sitemap.ts`
- Modifikasi: komponen Navbar (path bervariasi)
- Modifikasi: `next.config.js` (tambah remote pattern kalau belum)

**Dokumentasi:**
- `docs/wireframes/Epic3_slice1_daftar-produk.md`
- `docs/demos/epic3_slice1_demo_script.md`
- `docs/infrastructure/supabase_storage_buckets.md`

---

## Catatan Penutup

Guide ini **kompas eksekusi** dengan constraint eksplisit. Detail implementasi (kode Pydantic, JSX komponen, migration SQL) tinggal referensi ke **task breakdown** untuk copy-paste template.

Kalau ada situasi yang tidak ter-cover di Operating Rules atau Troubleshooting, **STOP dan tanya Jazil** — jangan improvise dengan pattern yang bisa bikin drift dari architecture decisions (AR-01 sampai AR-08 di task breakdown).

**File:** `docs/execution-guides/CLAUDE_CODE_GUIDE_epic3_slice1_katalog-produk.md`
**Version:** 1.0 — 2026-07-05
