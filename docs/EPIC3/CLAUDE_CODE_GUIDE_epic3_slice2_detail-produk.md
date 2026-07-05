# Claude Code Execution Guide — Epic 3 Slice 2 (Halaman Detail Produk)

**Project:** reka-cipta-platform
**Slice:** Epic 3 Slice 2 — 5 Halaman Detail Produk `/produk/[slug]`
**Task Breakdown Reference:** `epic3_task_breakdown_customer-facing.md` (WAJIB dibaca sebelum eksekusi)
**Prasyarat:** Epic 3 Slice 1 sudah merged ke `main`, live di production, dan sign-off klien.
**Version:** 1.0
**Author:** Ach. Jazilul Qutbi
**Total Phase:** 15 | **STOP Gates:** 2

---

## Cara Pakai Guide Ini

Sama seperti Slice 1: setiap phase punya 3 section (**Kerjakan** / **Jangan** / **Verifikasi**). Di STOP Gate berhenti dan tunggu Jazil.

Detail implementasi (kode JSX komponen, config generateStaticParams, spec label registry) ada di **task breakdown**. Guide ini kompas eksekusi.

**Perbedaan penting dari Slice 1:**

| Aspek | Slice 1 | Slice 2 |
|---|---|---|
| Backend work | Ya (schema + router + deploy Railway) | **Tidak ada** — endpoint sudah live di Slice 1 |
| DB migration | Ya (create table + RLS + seed) | **Tidak ada** — schema tidak berubah |
| Manual Supabase step | Ya (buckets + upload + apply migration) | **Tidak ada** |
| Cross-slice touches | Hanya Epic 1 (Navbar) | **2 titik risky**: Slice 1 `ProductCard` + Epic 2 `/kontak` contact form |
| STOP gates | 3 (Supabase setup, Visual QA, Demo) | 2 (Visual QA, Demo) |
| Fokus utama | Foundation + list page + backend infra | Frontend-heavy, Static generation 5 routes, SEO metadata |

**Risiko utama Slice 2:** Regression Epic 2 saat modify `/kontak` contact form. Phase 9 punya extra QA step untuk memastikan flow lama (submit tanpa query param) tetap jalan.

---

## Operating Rules — Delta dari Slice 1

Semua Operating Rules Slice 1 (R-01 sampai R-10) **tetap berlaku**. Baca ulang guide Slice 1 kalau lupa. Rules tambahan khusus Slice 2:

### R-11 — `generateStaticParams` Signature Ketat

Fungsi `generateStaticParams` di route dynamic:
- **Wajib async**
- **Return** `Promise<Array<{ slug: string }>>` — bukan `Array<string>`, bukan objek dengan key selain `slug`
- **Fetch di build time** — pakai `createPublicSupabaseClient` (sama seperti Slice 1). **JANGAN** `createServerClient` yang trigger `cookies()`.

```typescript
// BENAR
export async function generateStaticParams() {
  const supabase = createPublicSupabaseClient();
  const { data } = await supabase.from('products').select('slug').eq('is_active', true);
  return (data ?? []).map((p) => ({ slug: p.slug }));
}

// SALAH — return array of strings
// return data.map(p => p.slug);
```

### R-12 — `generateMetadata` Signature Next.js 15

```typescript
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;   // MUST be Promise
}): Promise<Metadata> {
  const { slug } = await params;
  // ...
}
```

- **JANGAN** sync signature `params: { slug: string }` — Next.js 15 sudah async by default.
- **Return** minimal `title` + `description`. Open Graph `og:image` **tambahkan** kalau `product.photo_url` ada.

### R-13 — `notFound()` bukan Custom 404 Component

Kalau slug invalid atau produk `is_active = false`:
```typescript
import { notFound } from 'next/navigation';
if (!product) notFound();
```

- **JANGAN** render custom komponen "produk tidak ditemukan" inline — pakai `notFound()` supaya trigger halaman 404 global dari Epic 1.
- **JANGAN** return null/undefined dari page component — akan render blank page tanpa 404 header.

### R-14 — Regression Test Wajib Setelah Touch Epic 2 Contact Form

Setelah modifikasi contact form untuk baca `searchParams.produk`:
- **Test path lama** (submit tanpa query param) sebelum test path baru (dengan query param). Kalau path lama break, revert dulu.
- **Log manual test** di PR description supaya Jazil bisa verify.

### R-15 — Base UI Reminder

Slice 2 komponen mostly presentational — mungkin tidak butuh Base UI primitive baru. Kalau ada butuh (mis. Dialog untuk preview PDF), pakai Base UI. **Tidak ada import `@radix-ui/*` di Slice 2 sama sekali.**

---

# PHASE 1 — Preflight & Branch Setup

**Tujuan:** Konfirmasi Slice 1 sudah live production dan bersih. Buat feature branch baru.

## Kerjakan

1. `git status` — working directory bersih.
2. `git checkout main && git pull origin main` — sync latest main.
3. Verifikasi Slice 1 artifacts sudah ada di `main`:
   ```bash
   ls app/produk/page.tsx
   ls components/product/ProductCard.tsx
   ls components/product/ProductGrid.tsx
   ls components/product/CategoryFilterTabs.tsx
   ls backend/routers/products.py
   grep -l "getProductBySlug" lib/api.ts
   ```
   Kalau ada yang miss, **STOP** — Slice 1 mungkin belum fully merged.
4. Verifikasi production `/produk` accessible dan 5 kartu render dengan foto.
5. Verifikasi backend `GET /products/{slug}` accessible di production Railway:
   ```bash
   curl -s https://<railway-prod-url>/products/garam-halus-yodium | jq '.product.name'
   # Expected: "Garam Halus Yodium"
   ```
6. Verifikasi Epic 2 `/kontak` masih working (submit form test kecil, atau minimal render check).
7. `git checkout -b feature/epic3-slice2-detail-produk`

## Jangan

- Jangan proceed kalau Slice 1 artifacts tidak ada di `main` — akan bikin merge conflict later.
- Jangan proceed kalau backend production `/products/{slug}` return 500 — fix dulu.

## Verifikasi

- [ ] Branch aktif: `feature/epic3-slice2-detail-produk`
- [ ] Slice 1 file kritikal exist di `main`
- [ ] Production backend & frontend Slice 1 healthy

---

# PHASE 2 — Foundation Registries (Spec Labels + Industry Icons)

**Tujuan:** Buat 2 registry file yang dipakai oleh komponen SpecTable dan IndustryList. Registry pattern ini penting supaya extensible tanpa refactor komponen.

## Kerjakan

1. Buat `lib/product-spec-labels.ts`:
   - Type + const `SPEC_LABEL_REGISTRY: Record<string, { label: string; unit: string; method?: string }>`
   - Isi minimum 8 key: `nacl_pct`, `water_pct`, `kio3_ppm`, `insoluble_impurities_pct`, `color`, `smell`, `mesh_size`, `grain_size_mm` (semua yang muncul di seed Slice 1)
   - Fungsi `getSpecLabel(key: string)` dengan fallback ke `{ label: key, unit: '-' }` untuk field yang belum ter-register
2. Buat `lib/product-industry-icons.ts`:
   - Import icon dari `lucide-react`: `Utensils`, `Pill`, `Home`, `FlaskConical`, `Shirt`, `Fish`, `Cog`, dan tambahan yang relevan
   - Const `INDUSTRY_ICON_REGISTRY: Record<string, LucideIcon>` dengan mapping nama industri → icon component
   - Cover minimum semua nama industri yang ada di seed Slice 1: "Makanan & Minuman", "Farmasi", "Rumah Tangga", "Kimia", "Tekstil", "Pengolahan Ikan", "Peternakan", "Budidaya Ikan", "Pakan Ternak", "Water Treatment", "Penyamakan Kulit", "Distributor Retail"
   - Fallback icon: `Factory` untuk industri yang tidak ter-register
3. Type check: `pnpm tsc --noEmit` — 0 error.
4. Commit: `git add lib/ && git commit -m "feat(lib): add product spec labels and industry icon registries [Epic 3 Slice 2]"`

## Jangan

- **JANGAN** hardcode mapping di dalam komponen — semua di registry. Ini design decision untuk extensibility.
- **JANGAN** pakai icon library selain `lucide-react` — sudah standard di project ini.
- **JANGAN** skip industri di seed — kalau ada yang miss, chip nanti pakai fallback icon dan terlihat aneh.

## Verifikasi

- [ ] 2 file registry created
- [ ] Semua industri di seed ter-cover (grep seed SQL vs registry)
- [ ] Type check pass
- [ ] Commit masuk

---

# PHASE 3 — Component `ProductBreadcrumb`

**Tujuan:** Bikin breadcrumb navigation reusable untuk detail page.

## Kerjakan

1. Buat `components/product/ProductBreadcrumb.tsx` sesuai spec task `E3-S2-UX-07`:
   - Server Component (tidak butuh `'use client'`)
   - `<nav aria-label="Breadcrumb">` + `<ol>` semantic
   - 3 level: Beranda / Produk / {productName}
   - Level terakhir `aria-current="page"`, tidak clickable
   - Icon separator `ChevronRight` dari `lucide-react`, `aria-hidden`
2. Test import path benar (tidak error di TS check).

## Jangan

- **JANGAN** pakai `<div>` untuk breadcrumb — semantic `<nav>` + `<ol>` penting untuk a11y.
- **JANGAN** buat breadcrumb generic yang menerima array — spesifik untuk detail produk saja. Kalau nanti butuh generic breadcrumb di tempat lain, refactor terpisah.

## Verifikasi

- [ ] File created, type check pass
- [ ] Semantic HTML benar

---

# PHASE 4 — Component `ProductHero`

**Tujuan:** Bikin hero section detail page dengan foto besar + info panel.

## Kerjakan

1. Buat `components/product/ProductHero.tsx` sesuai spec task `E3-S2-FE-04`:
   - Terima `product: Product`
   - Layout grid 12 kolom: `md:col-span-5` untuk foto, `md:col-span-7` untuk info
   - Mobile: stacked (default grid single column)
   - `<Image>` dari `next/image` dengan `priority={true}` (LCP element), `fill`, `sizes` responsive
   - Badge "Bersertifikat SNI" conditional
   - `<h1>` untuk nama, font-mono untuk code
   - Description support paragraph break: split `description.split('\n\n')` → render multiple `<p>`

## Jangan

- **JANGAN** lupa `priority` prop di `<Image>` hero — ini LCP element, tanpa priority Lighthouse score turun.
- **JANGAN** hardcode aspect ratio square kalau foto placeholder lebih baik landscape — cek foto Slice 1 dan sesuaikan.
- **JANGAN** render `<h1>` lebih dari 1 di halaman — SEO issue.

## Verifikasi

- [ ] File created, type check pass
- [ ] Import Product type dari `@/types/api`

---

# PHASE 5 — Component `SpecTable` (Dynamic JSONB Rendering)

**Tujuan:** Bikin komponen tabel spesifikasi teknis yang render dari JSONB dinamis. **Ini komponen paling kritis di Slice 2** karena data structure per produk berbeda.

## Kerjakan

1. Buat `components/product/SpecTable.tsx` sesuai spec task `E3-S2-FE-05`:
   - Terima `specs: ProductSpecs`
   - `Object.entries(specs)` → filter yang value truthy (`!== null && !== undefined && !== ''`)
   - Kalau entries kosong, return `null` (tidak render section sama sekali)
   - Iterate entries, ambil label dari `getSpecLabel(key)` di registry
   - Render `<table>` 4 kolom: Parameter | Nilai | Satuan | Metode / Standar
   - Wrapper `overflow-x-auto` untuk mobile responsive
2. Test rendering dengan mock data (bisa buat test file `.test.tsx` opsional, atau visual test di dev server nanti):
   - Produk PRO YD (punya `kio3_ppm`)
   - Produk SPO/M (punya `grain_size_mm`, tidak punya `mesh_size`)
   - Kedua harus render dengan kolom sesuai field yang ada

## Jangan

- **JANGAN** hardcode 8 baris tabel — dinamis dari `Object.entries`. Kalau hardcode, produk yang punya field extra tidak render.
- **JANGAN** cast value ke number di JSX — pakai `String(value)` supaya string dan number handled sama.
- **JANGAN** pakai key raw sebagai fallback tanpa transformasi — kalau field tidak di registry, minimal capitalize dulu supaya `nacl_pct` tidak render sebagai "nacl_pct" tapi paling tidak "Nacl Pct". Tapi lebih baik: **lengkapi registry di Phase 2** supaya fallback hampir tidak pernah kepakai.

## Verifikasi

- [ ] File created
- [ ] Type check pass
- [ ] Empty state (spec = `{}`) return null

---

# PHASE 6 — Components `IndustryList` & `LabDocDownload`

**Tujuan:** Bikin 2 komponen presentational: list industri dengan icon, dan tombol download PDF dengan disabled state.

## Kerjakan

1. Buat `components/product/IndustryList.tsx` sesuai spec task `E3-S2-FE-06`:
   - Terima `industries: string[]`
   - Return `null` kalau array kosong
   - Render `<ul>` dengan `flex-wrap` untuk chip layout
   - Setiap chip: `<Icon />` dari registry + nama industri
   - Fallback icon `Factory` kalau nama tidak ter-register
2. Buat `components/product/LabDocDownload.tsx` sesuai spec task `E3-S2-FE-07`:
   - Terima `url: string | null` dan `productName: string`
   - Kalau `url` ada: `<a href target="_blank" rel="noopener noreferrer">` + icon Download
   - Kalau `url` null: `<button disabled>` dengan text "Segera tersedia" dan tooltip
   - Section wrapper dengan background `bg-slate-50` supaya visual break dari content atas
3. Type check global: `pnpm tsc --noEmit`.
4. Commit sementara: `git add components/ && git commit -m "feat(product): add breadcrumb, hero, spec table, industry list, and lab doc download components [Epic 3 Slice 2]"`

## Jangan

- **JANGAN** lupa `rel="noopener noreferrer"` di `<a target="_blank">` — security requirement.
- **JANGAN** pakai `<Link>` dari `next/link` untuk PDF eksternal — pakai `<a>` biasa. `<Link>` untuk client-side navigation internal.
- **JANGAN** implement PDF preview inline (iframe embed) di sini — download only. Preview inline butuh consideration UX + performance yang out of scope Slice 2.

## Verifikasi

- [ ] 2 file created
- [ ] Type check pass
- [ ] Empty state handled

---

# PHASE 7 — Component `ProductCTA`

**Tujuan:** Bikin section CTA dengan 2 tombol yang link ke `/kontak` dengan query param. **Ini titik cross-slice integration ke Epic 2.**

## Kerjakan

1. Buat `components/product/ProductCTA.tsx` sesuai spec task `E3-S2-FE-06`:
   - Terima `product: Product`
   - Construct 2 URL:
     - `/kontak?produk=${product.slug}&intent=sample`
     - `/kontak?produk=${product.slug}&intent=quotation`
   - 2 tombol side-by-side (desktop) / stacked (mobile) dengan `flex-col sm:flex-row`
   - Pattern link WAJIB: `<Link href={...} className={cn(buttonVariants({ variant, size }))}>` (constraint R-03 Slice 1)
   - Section wrapper: `bg-brand-teal-50 py-12 md:py-16`
2. Test URL construction di dev server nanti — inspect `href` attribute di DevTools.

## Jangan

- **JANGAN** pakai `<Button asChild><Link>` — Radix idiom, tidak jalan di Base UI.
- **JANGAN** encode nilai `intent` sebagai enum di sini — plain string `'sample'` dan `'quotation'`. Contact form akan interpretasi.
- **JANGAN** hardcode nama produk di tombol — reuse untuk 5 produk berbeda.

## Verifikasi

- [ ] File created
- [ ] Type check pass
- [ ] URL query param format benar

---

# PHASE 8 — Route `/produk/[slug]/page.tsx`

**Tujuan:** Buat halaman detail dengan `generateStaticParams` (5 slug), `generateMetadata` dinamis, `notFound` handling, dan compose semua 6 komponen dari Phase 3-7.

## Kerjakan

1. Buat direktori `app/produk/[slug]/`.
2. Buat file `app/produk/[slug]/page.tsx` sesuai spec task `E3-S2-FE-01`:
   - `export const revalidate = 3600`
   - `export async function generateStaticParams()` — fetch slug dari Supabase, return `Array<{ slug }>`
   - `export async function generateMetadata({ params })` — fetch product by slug, return title/description/openGraph
   - Helper function `getProduct(slug)` untuk share fetch logic antara `generateMetadata` dan `default export`
   - Default export: fetch product, kalau tidak ada `notFound()`, compose 6 komponen
3. Buat file `app/produk/[slug]/not-found.tsx` (opsional):
   - Custom 404 message context produk. Kalau skip, akan pakai global 404 dari Epic 1 — juga OK.
4. Jalankan `pnpm dev`, test:
   - `http://localhost:3000/produk/garam-halus-yodium` — render lengkap
   - `http://localhost:3000/produk/tidak-ada` — render 404
   - Cek 5 URL detail semua render tanpa error
5. Commit: `git add app/produk/ && git commit -m "feat(produk): add detail page with generateStaticParams for 5 products [Epic 3 Slice 2]"`

## Jangan

- **JANGAN** duplicate fetch logic di `generateMetadata` dan `page` — extract ke helper function.
- **JANGAN** pakai `notFound()` di `generateMetadata` — return metadata generic "Produk tidak ditemukan" saja.
- **JANGAN** cache result fetch dengan module-level variable — Next.js sudah handle deduplication otomatis via React `cache()`. Kalau butuh explicit, wrap `getProduct` dengan `cache()` dari `react`.
- **JANGAN** skip `notFound()` — kalau tidak dipanggil, produk invalid akan render page dengan error di dalam.

## Verifikasi

- [ ] 5 detail page render tanpa error di dev server
- [ ] Slug invalid render 404
- [ ] Metadata `<title>` unique per produk (view source di browser)
- [ ] Semua 6 komponen visible: Breadcrumb, Hero, SpecTable, IndustryList, LabDocDownload, CTA

---

# PHASE 9 — Aktifkan Tombol "Lihat Detail" di `ProductCard` (Slice 1 Touch)

**Tujuan:** Update `ProductCard.tsx` dari Slice 1 — replace tombol disabled dengan `<Link>` aktif ke `/produk/{slug}`.

## Kerjakan

1. Buka `components/product/ProductCard.tsx`.
2. Cari tombol disabled yang punya text "Lihat Detail →" dan `aria-disabled="true"`.
3. Replace dengan `<Link>` aktif:
   ```tsx
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
4. Import `Link` dari `next/link` di file yang sama (kalau belum).
5. Hapus prop `disabled`, `aria-disabled`, dan `title` yang sebelumnya.
6. Test di dev server: buka `/produk`, klik tombol "Lihat Detail" salah satu kartu → landing di detail page.
7. Test 5 kartu semua bisa navigate ke detail page benar.

## Jangan

- **JANGAN** ubah struktur lain di `ProductCard` — hanya tombol yang berubah. Grid layout, foto, badge SNI, dll harus tetap sama.
- **JANGAN** pakai `<a href>` biasa — pakai `<Link>` untuk client-side navigation Next.js.

## Verifikasi

- [ ] Tombol aktif, klik navigate ke detail page yang benar
- [ ] Regression Slice 1: filter tab kategori masih berfungsi normal
- [ ] Regression Slice 1: badge SNI, foto, tagline tetap render

---

# PHASE 10 — Update Contact Form `/kontak` (Epic 2 Touch — HIGH REGRESSION RISK)

**Tujuan:** Modify contact form di Epic 2 Slice 3 untuk baca `searchParams.produk` + `searchParams.intent` dan prefill message + label produk. **Ini phase paling risky di Slice 2 karena menyentuh code yang sudah live.**

## Prep Sebelum Kerjakan

Baca ulang implementasi `/kontak` di codebase sekarang:
```bash
cat app/kontak/page.tsx
grep -r "ContactForm" components/
```

Pahami:
- Apakah `page.tsx` sekarang Server atau Client Component?
- Apakah contact form component terpisah?
- Apakah sudah pakai `useSearchParams` sebelumnya?

Kalau struktur unclear, **STOP** dan tanya Jazil.

## Kerjakan

**Pendekatan yang dipilih (per AR-05 task breakdown): Client Component approach** — supaya `/kontak` tetap Static, tidak downgrade ke Dynamic.

1. Identifikasi komponen contact form (mis. `components/contact/ContactForm.tsx` atau di `components/form/ContactForm.tsx`).
2. Pastikan komponen tersebut sudah `'use client'` (kemungkinan besar iya karena pakai react-hook-form).
3. Tambah 2 hal di dalam komponen:

   **a.** Import `useSearchParams` dari `next/navigation` dan fetch product name via client-side fetch atau props.

   **Trade-off keputusan:** Client-side fetch (via `getProductBySlug` dari `lib/api.ts`) akan bikin extra network call setelah hydration. Alternatif: pass semua produk sebagai props dari parent Server Component (5 produk data kecil). **Rekomendasi: pass sebagai props** — cleaner, no extra fetch.

   Update `app/kontak/page.tsx` (Server Component) untuk fetch products list dan pass ke ContactForm:
   ```typescript
   // app/kontak/page.tsx (tetap Server Component, tetap Static)
   import { createPublicSupabaseClient } from '@/lib/supabase/public';

   export default async function KontakPage() {
     const supabase = createPublicSupabaseClient();
     const { data: products } = await supabase
       .from('products')
       .select('slug, name')
       .eq('is_active', true);

     return (
       // ... hero, info sections ...
       <ContactForm availableProducts={products ?? []} />
     );
   }
   ```

   **b.** Di dalam `ContactForm` (Client Component), pakai `useSearchParams()`:
   ```typescript
   'use client';
   import { useSearchParams } from 'next/navigation';
   import { useEffect } from 'react';

   interface ContactFormProps {
     availableProducts: Array<{ slug: string; name: string }>;
     // ... existing props kalau ada
   }

   export function ContactForm({ availableProducts }: ContactFormProps) {
     const searchParams = useSearchParams();
     const produkSlug = searchParams.get('produk');
     const intent = searchParams.get('intent');

     const linkedProduct = produkSlug
       ? availableProducts.find((p) => p.slug === produkSlug)
       : null;

     const initialMessage = linkedProduct
       ? intent === 'sample'
         ? `Saya tertarik untuk meminta sampel produk ${linkedProduct.name}. Mohon informasi terkait pengiriman sampel.`
         : intent === 'quotation'
           ? `Saya ingin mendapatkan penawaran harga untuk produk ${linkedProduct.name}. Estimasi kebutuhan: [mohon lengkapi].`
           : ''
       : '';

     // Existing react-hook-form setup — tambah defaultValues.message = initialMessage
     // ATAU pakai form.reset() di useEffect kalau form sudah initialized
   }
   ```

   **c.** Tampilkan label info di atas form kalau `linkedProduct` ada:
   ```tsx
   {linkedProduct && (
     <div className="mb-4 rounded bg-brand-teal-50 p-3 text-sm">
       Terkait produk: <strong>{linkedProduct.name}</strong>
     </div>
   )}
   ```

4. **CRITICAL: Test regression path lama sebelum test path baru:**
   - Buka `/kontak` **tanpa query param** — form render, textarea empty, submit works normal
   - Buka `/kontak?produk=garam-halus-yodium&intent=sample` — form render, textarea prefilled, label produk visible, submit works normal
   - Buka `/kontak?produk=slug-invalid&intent=sample` — form render, textarea empty (no prefill), no error thrown
5. Test build: `pnpm build`. Verifikasi `/kontak` **tetap Static (`○`)**. Kalau jadi Dynamic (`ƒ`), berarti ada import yang salah — investigate.
6. Commit: `git add app/kontak/ components/ && git commit -m "feat(kontak): prefill contact form from product CTA query params [Epic 3 Slice 2]"`

## Jangan

- **JANGAN** ubah endpoint POST /contact/send — cukup update UI form.
- **JANGAN** rewrite ContactForm dari scratch — extend existing dengan minimal changes.
- **JANGAN** pakai `useState` dengan `useEffect` yang set form value manual — pakai `defaultValues` atau `form.reset()` dari react-hook-form.
- **JANGAN** skip test path lama — regression risk tinggi.
- **JANGAN** convert `/kontak/page.tsx` jadi Client Component untuk baca searchParams — akan hilang Static rendering benefit yang sudah dicapai Epic 2 Slice 3.

## Verifikasi

- [ ] Path lama (tanpa query param) tetap berfungsi identik dengan sebelum modifikasi
- [ ] Path baru (dengan query param valid) prefill message benar + label produk visible
- [ ] Path invalid (slug tidak ada) fallback ke behavior default
- [ ] `pnpm build` output `/kontak` masih `○` (Static)
- [ ] `pnpm tsc --noEmit` pass
- [ ] Screenshot 3 skenario di atas ambil untuk PR description

---

# PHASE 11 — Update `app/sitemap.ts` (Dynamic 5 Detail URLs)

**Tujuan:** Tambah 5 URL detail produk ke sitemap.xml dengan `lastModified` dari `updated_at` DB.

## Kerjakan

1. Buka `app/sitemap.ts`.
2. Tambah fetch produk aktif dari Supabase (async function, sitemap.ts default already async):
   ```typescript
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
   ```
3. Return array include existing + `...productDetailUrls`.
4. Test: `pnpm dev`, buka `http://localhost:3000/sitemap.xml`. Verifikasi 5 URL detail muncul dengan `<lastmod>` valid.

## Jangan

- **JANGAN** hardcode 5 URL detail — pakai fetch dari DB. Kalau produk ditambah nanti di admin panel (Epic 3B), sitemap auto-update.
- **JANGAN** hardcode `changeFrequency: 'weekly'` untuk detail — `monthly` lebih akurat untuk produk yang jarang berubah.
- **JANGAN** skip filter `is_active = true` — produk disabled harusnya tidak muncul di sitemap.

## Verifikasi

- [ ] Sitemap XML valid (test dengan XML validator online)
- [ ] 5 URL detail muncul
- [ ] `lastModified` reflect `updated_at` dari DB

---

# PHASE 12 — JSON-LD Structured Data (Bonus, Recommended)

**Tujuan:** Tambah structured data schema.org `Product` di setiap detail page. **Ditandai bonus di task breakdown tapi saya recommend include** — untuk B2B distributor yang target Google search, structured data significant improvement SEO.

## Kerjakan

1. Di `app/produk/[slug]/page.tsx`, dalam default export, sebelum return, construct JSON-LD object:
   ```typescript
   const jsonLd = {
     '@context': 'https://schema.org',
     '@type': 'Product',
     name: product.name,
     description: product.description ?? product.tagline ?? '',
     image: product.photo_url ?? undefined,
     sku: product.code,
     brand: {
       '@type': 'Brand',
       name: 'CV Reka Cipta Indonesia',
     },
     category: product.category,
     manufacturer: {
       '@type': 'Organization',
       name: 'CV Reka Cipta Indonesia',
       address: {
         '@type': 'PostalAddress',
         addressLocality: 'Surabaya',
         addressCountry: 'ID',
       },
     },
   };
   ```
2. Render di return sebagai sibling `<script>`:
   ```tsx
   <>
     <script
       type="application/ld+json"
       dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
     />
     <main>
       {/* existing content */}
     </main>
   </>
   ```
3. Test dengan [Google Rich Results Test](https://search.google.com/test/rich-results) di production URL setelah deploy. Structured data harus valid, no error.

## Jangan

- **JANGAN** include field yang tidak akurat (mis. `offers.price` — kita tidak jual online, hanya B2B via inquiry). Google penalty untuk misleading structured data.
- **JANGAN** pakai `<Script>` dari `next/script` untuk inline JSON-LD — pakai `<script dangerouslySetInnerHTML>`. `next/script` lebih untuk external JS.

## Verifikasi

- [ ] JSON-LD render di HTML (view source)
- [ ] Structured data pass Google Rich Results Test (test setelah deploy staging)

---

# PHASE 13 — Build Verification & Local E2E Test

**Tujuan:** Pastikan semua 5 detail page + `/produk` + `/kontak` render Static, no dynamic downgrade. E2E test alur customer flow.

## Kerjakan

1. `pnpm build` di root project.
2. Cek output section "Route (app)". Wajib muncul semua ini dengan symbol `○`:
   ```
   ○ /
   ○ /produk
   ○ /produk/garam-halus-yodium
   ○ /produk/garam-halus-non-yodium
   ○ /produk/garam-kasar-industri
   ○ /produk/garam-kasar-petani
   ○ /produk/garam-ghpt
   ○ /tentang-kami
   ○ /kontak
   ```
3. Kalau ada yang `ƒ`, **STOP** dan investigate.
4. Untuk 5 detail page, cek "First Load JS" size — target < 220 KB per route.
5. `pnpm lint` — 0 error.
6. Jalankan dev server, lakukan **E2E manual test** end-to-end:
   - Buka `/produk`
   - Klik "Lihat Detail" pada kartu PRO YD
   - Verifikasi detail page render lengkap: breadcrumb, hero, spec table, industry chips, download button, CTA section
   - Klik tombol "Unduh PDF" — PDF open di tab baru
   - Klik tombol "Minta Sampel" — landing di `/kontak?produk=garam-halus-yodium&intent=sample`
   - Verifikasi contact form: label produk visible, textarea prefilled
   - Isi form + submit → email received di destination
   - Repeat untuk 1 produk lain dengan intent `quotation`
7. Commit final: `git add . && git commit -m "feat(produk): complete Epic 3 Slice 2 detail pages [Epic 3 Slice 2]"`

## Jangan

- **JANGAN** proceed deploy kalau ada route `ƒ` — perbaiki dulu.
- **JANGAN** skip E2E test — kalau CTA broken, klien akan komplain di demo.
- **JANGAN** disable ESLint warnings dengan `// eslint-disable` — fix root cause.

## Verifikasi

- [ ] Build sukses, 5+ route Static (`○`)
- [ ] `pnpm lint` 0 error
- [ ] E2E test 2 produk pass (Unduh PDF, Minta Sampel, form prefill, submit)
- [ ] Commit sudah masuk

---

# PHASE 14 — Deploy Vercel Preview

**Tujuan:** Push branch, trigger Vercel preview deploy.

## Kerjakan

1. `git push -u origin feature/epic3-slice2-detail-produk`
2. Buat Pull Request ke `dev` (kalau tim biasa PR, atau langsung merge — sesuai preferensi Jazil).
3. Tunggu Vercel preview deploy (2-4 menit).
4. Ambil preview URL, smoke test:
   - 5 detail page accessible: `/produk/garam-halus-yodium`, `/produk/garam-halus-non-yodium`, `/produk/garam-kasar-industri`, `/produk/garam-kasar-petani`, `/produk/garam-ghpt`
   - Semua render tanpa error, foto load dari Supabase Storage
   - CTA link ke `/kontak` dengan query param
   - Contact form prefill benar di preview
   - Sitemap `/sitemap.xml` include 5 URL detail
   - JSON-LD (kalau diimplementasi) valid di Google Rich Results Test
5. Report preview URL ke Jazil untuk visual QA.

## Jangan

- **JANGAN** merge PR sebelum Gate 1 (Visual QA) clear.
- **JANGAN** deploy production langsung tanpa preview review.

## Verifikasi

- [ ] Vercel preview deploy sukses
- [ ] Smoke test 5/5 detail page pass
- [ ] Preview URL diberitahukan ke Jazil

---

# 🛑 STOP GATE 1 — Visual QA + Regression Test + E2E CTA Flow

**Status:** Menunggu Jazil melakukan QA komprehensif.

## Aksi Manual yang Jazil Lakukan

### 1. Visual QA — 5 Detail Pages × 3 Viewport

Buka setiap 5 detail page di mobile (375px), tablet (768px), desktop (1440px). Cek:
- [ ] Foto proporsi benar (tidak stretch/distort)
- [ ] Layout hero: foto kiri + info kanan di desktop, stacked di mobile
- [ ] Spec table readable, tidak overflow, kolom sejajar
- [ ] Industry chips wrap dengan benar, icon render
- [ ] LabDocDownload section visible dengan icon PDF
- [ ] CTA buttons prominent, 2 tombol side-by-side desktop / stacked mobile
- [ ] Breadcrumb accurate per halaman

**Total: 15 screenshot** untuk documentation.

### 2. PDF Download Test — 5/5 Produk

Dari setiap detail page, klik "Unduh PDF":
- [ ] File open di tab baru atau download
- [ ] PDF valid (bukan corrupt)
- [ ] Konten PDF match produk (nama produk benar di header)

### 3. CTA E2E Flow — Minimal 3 Produk × 2 Intent

Test 6 kombinasi:
- Produk 1 (PRO YD) + intent `sample` → verifikasi prefill message + label
- Produk 1 + intent `quotation` → verifikasi prefill berbeda
- Produk 3 (SPO/M) + intent `sample`
- Produk 3 + intent `quotation`
- Produk 5 (GHPT) + intent `sample`
- Produk 5 + intent `quotation`

Untuk setiap: submit form dengan test email → verifikasi email received.

### 4. Regression Test Epic 2

- [ ] Buka `/kontak` **tanpa query param** — form render normal, submit works
- [ ] Buka `/kontak?produk=slug-invalid` — form render normal, no error, no prefill
- [ ] Beranda `/` masih Static, no regression
- [ ] `/tentang-kami` masih Static, no regression

### 5. SEO & Metadata Validation

- [ ] View source setiap 5 detail page — `<title>` dan `<meta name="description">` unique
- [ ] Open Graph test di [opengraph.xyz](https://www.opengraph.xyz) — 1 produk sample
- [ ] JSON-LD test di Google Rich Results Test — 1 produk sample
- [ ] Sitemap.xml include 5 URL detail dengan lastmod

### 6. Accessibility Scan

- axe DevTools di 1 detail page — target 0 critical & 0 serious

### 7. Lighthouse Mobile — Minimal 1 Detail Page

- Performance ≥ 90
- Accessibility ≥ 95
- SEO ≥ 95

## Setelah Gate Ini Clear

Jazil bilang "Gate 1 clear" atau "QA approved, lanjut merge". Kalau ada issue:
- **Visual issue:** fix di feature branch, force push, tunggu re-review.
- **Regression Epic 2:** revert Phase 10 changes, redesign approach, re-test.
- **Static → Dynamic downgrade:** investigate import chain, fix, re-verify build output.

## Sinyal Masalah yang Mungkin Muncul

- **Lighthouse Performance < 90 di detail page:** kemungkinan foto belum di-optimize. Compress placeholder foto atau verify `<Image>` sizes prop.
- **CTA prefill tidak jalan:** cek `useSearchParams` dependency di `useEffect`. Cek `defaultValues` react-hook-form vs `form.reset()`.
- **`/kontak` jadi Dynamic:** cek apakah `page.tsx` accidentally import `useSearchParams` dari `next/navigation` di Server Component (harus di Client Component saja).
- **JSON-LD invalid:** cek nested object structure, escaping quotes di JSON.stringify.

---

# PHASE 15 — Merge ke `dev`, Deploy Staging, Production Deploy

**Tujuan:** Merge PR, deploy staging final, siapkan production release.

## Kerjakan

1. Setelah Gate 1 clear, merge PR ke `dev`.
2. Vercel auto-deploy `dev` → staging URL.
3. Smoke test staging URL — sama dengan Phase 14.
4. Update PR description atau chat dengan:
   - Ringkasan Slice 2 scope
   - Screenshot build output (menampilkan 5 detail Static)
   - Screenshot Lighthouse
   - DoD checklist tercentang
5. Jazil manual merge `dev` → `main` untuk production release.
6. Verifikasi production URL:
   - `https://rekaciptaindonesia.com/produk/garam-halus-yodium` accessible
   - CTA prefill jalan di production
   - Sitemap.xml production include 5 detail URL
7. Submit sitemap ke Google Search Console (kalau sudah ter-setup).

## Jangan

- **JANGAN** merge `dev` → `main` sendiri — itu tindakan Jazil.
- **JANGAN** hapus feature branch sampai demo klien selesai.

## Verifikasi

- [ ] PR merged ke `dev`
- [ ] Staging deploy sukses, smoke test pass
- [ ] Production deploy sukses (setelah Jazil merge)
- [ ] Sitemap production accessible

---

# 🛑 STOP GATE 2 — Client Demo & Epic 3 Customer-Facing Sign-Off

**Status:** Menunggu Jazil demo ke klien.

## Aksi Manual yang Jazil Lakukan

1. **Prepare demo environment** di production URL.
2. **Follow demo script** dari `docs/demos/epic3_slice2_demo_script.md`:
   - Recap Slice 1 (30 detik)
   - Demo alur user complete: list → detail → download PDF → CTA → kontak prefill (3 menit)
   - Demo 5 produk (2 menit) — showcase spec table berbeda per produk
   - Demo mobile (1 menit)
   - Roadmap: Epic 3B (admin panel) + Epic 4 (RFQ)
3. **Kumpulkan feedback** — content teks, spec value, foto placeholder timing.
4. **Konfirmasi sign-off Epic 3 customer-facing** — klien setuju customer-facing complete, siap lanjut Epic 3B.

## Setelah Gate Ini Clear

Jazil bilang "demo done, sign-off Epic 3 customer-facing OK". Kalau ada revisi:
- Konten teks minor (tagline, description): update seed SQL, apply via Dashboard, revalidate cache
- Spec value: sama, update seed + revalidate
- Layout: assess apakah design system update atau komponen local

**Slice 2 CLOSED.** Epic 3 customer-facing complete. Siap untuk Epic 3B (Admin CRUD Produk).

## Sinyal Masalah

- **Klien tidak yakin dengan layout detail:** kemungkinan ada expectation gap. Screenshot komparasi dengan referensi klien (kalau ada) untuk diskusi.
- **Klien tanya kapan RFQ system live:** jawab jujur — Epic 4 setelah Epic 3B. Timeline realistis, tidak over-promise.
- **Klien minta tambah section (mis. testimoni customer, video product):** scope creep. Log sebagai enhancement untuk Epic post-3, jangan langsung implement.

---

# Kontingensi & Troubleshooting

## Situasi: Build muncul `ƒ /produk/[slug]` bukan `○ /produk/[...]`

**Symptom:** Route detail Dynamic, bukan Static.

**Root cause biasa:**
- `generateStaticParams` tidak return array (return undefined atau throw)
- Import `next/headers` accidentally di komponen anak
- `useSearchParams` di Server Component

**Fix:**
1. Tambah console.log di `generateStaticParams` untuk verify return value. Test `pnpm build` — log muncul di terminal.
2. Grep `app/produk/[slug]/` dan `components/product/` untuk import `next/headers` atau `cookies()`.
3. Verify 6 komponen detail semua Server Component (no `'use client'` kecuali kalau memang interactive).

## Situasi: CTA prefill tidak muncul di production tapi jalan di local

**Symptom:** `/kontak?produk=...` di local prefill message, di production tidak.

**Root cause biasa:**
- Vercel caching aggressive — refresh dengan `?cache=bust` query
- Contact form component tidak update di production build
- Environment variable beda antara local dan production (mis. `NEXT_PUBLIC_API_URL`)

**Fix:**
1. Hard refresh production dengan Cmd/Ctrl + Shift + R.
2. Cek Vercel deploy log — apakah last commit ter-deploy.
3. Cek `pnpm build` output di local — cari string prefill di JS bundle. Kalau ada di local tapi tidak di production, kemungkinan build cache di Vercel.

## Situasi: Foto detail page load lambat, LCP > 4s

**Symptom:** Lighthouse Performance < 80 karena LCP.

**Root cause biasa:**
- `<Image>` di hero tidak pakai `priority`
- Foto original size besar (> 500 KB)
- `sizes` prop tidak akurat

**Fix:**
1. Tambah `priority` di hero `<Image>`.
2. Compress foto placeholder (target < 200 KB WebP atau < 300 KB JPG).
3. Set `sizes` akurat: `(max-width: 768px) 100vw, 40vw` untuk hero foto yang 5-column di grid 12.

## Situasi: JSON-LD invalid di Google Rich Results Test

**Symptom:** Test tool report syntax error atau missing required property.

**Root cause biasa:**
- Nested object escape issue
- Field kosong (`name: undefined`) — Google requires string
- `@type` typo

**Fix:**
1. Console.log `jsonLd` object sebelum stringify — inspect di browser DevTools.
2. Filter undefined values: `JSON.stringify(jsonLd, (_, v) => v ?? undefined)`.
3. Verify structure di [schema.org/Product](https://schema.org/Product) documentation.

## Situasi: Regression `/kontak` — form tidak submit setelah update

**Symptom:** Form submit button tidak trigger POST /contact/send.

**Root cause biasa:**
- Prop `availableProducts` bikin type mismatch dengan react-hook-form schema
- `defaultValues` override user input yang seharusnya di-preserve
- Zod schema tidak allow message empty (kalau prefill kosong)

**Fix:**
1. Isolate: temporary revert perubahan Phase 10, verify form kembali normal. Kalau iya, ada bug di update.
2. Cek react-hook-form devtools — inspect form state saat submit.
3. Cek Zod schema — pastikan `message` allow empty string atau min length yang reasonable.

---

# Ringkasan File yang Dibuat di Slice 2

**Registry:**
- `lib/product-spec-labels.ts`
- `lib/product-industry-icons.ts`

**Components:**
- `components/product/ProductBreadcrumb.tsx`
- `components/product/ProductHero.tsx`
- `components/product/SpecTable.tsx`
- `components/product/IndustryList.tsx`
- `components/product/LabDocDownload.tsx`
- `components/product/ProductCTA.tsx`

**Routes:**
- `app/produk/[slug]/page.tsx`
- `app/produk/[slug]/not-found.tsx` (opsional)

**Modifikasi (Cross-slice Touch):**
- `components/product/ProductCard.tsx` — aktifkan tombol Lihat Detail (Slice 1 touch)
- `app/kontak/page.tsx` — pass availableProducts (Epic 2 touch)
- `components/[path]/ContactForm.tsx` — read searchParams, prefill message (Epic 2 touch)
- `app/sitemap.ts` — tambah 5 URL detail

**Dokumentasi:**
- `docs/wireframes/Epic3_slice2_detail-produk.md`
- `docs/demos/epic3_slice2_demo_script.md`

---

## Catatan Penutup

Slice 2 secara scope lebih sederhana dari Slice 1 (no backend, no DB), **tapi risky-nya di cross-slice touches**. Dua titik integrasi (ProductCard Slice 1 + ContactForm Epic 2) adalah tempat regression paling mungkin muncul.

**Prinsip yang saya encode di guide ini:**
1. **Phase 9 (Slice 1 touch)** ditempatkan sebelum Phase 10 (Epic 2 touch) karena Slice 1 touch lebih simple — memberikan confidence sebelum masuk touch yang risky.
2. **Phase 10 (Epic 2 touch)** punya Rule R-14 tambahan wajib regression test path lama dulu — kalau path lama break, revert dulu sebelum lanjut.
3. **Gate 1 Visual QA** punya section eksplisit "Regression Test Epic 2" — bukan afterthought.
4. **Client Component approach** untuk contact form prefill di-lock supaya `/kontak` tetap Static. Kalau Claude Code menemukan reason untuk switch ke Server Component approach, WAJIB STOP dan tanya Jazil dulu — tidak boleh unilateral decision.

Kalau ada situasi yang tidak ter-cover di Operating Rules atau Troubleshooting, **STOP dan tanya Jazil**.

**File:** `docs/execution-guides/CLAUDE_CODE_GUIDE_epic3_slice2_detail-produk.md`
**Version:** 1.0 — 2026-07-05
