# E1-UX-07 — Arsitektur Routing, Navigasi & State Management
**CV Reka Cipta Indonesia · Web Platform & CRM System**  
**Versi:** 2.0 (Revised & Complete)  
**Fase:** Epic 1 — Fondasi Project & Global Layout  
**Tech Stack:** Next.js 14 (App Router) + Supabase Auth (`@supabase/ssr`) + FastAPI Backend  
**Referensi:** PRD v1.0 §4, §6, §7 · Epic Doc 1 & 2 · E1-TaskBreakdown v1.1 · Wireframes E1-UX-02 s/d E1-UX-06

---

## 📁 1. Route Groups & Struktur Folder (Next.js App Router)
Next.js App Router menggunakan **Route Groups** `(folder)` untuk organisasi layout tanpa mempengaruhi URL. Berikut adalah pemetaan folder ke logika routing:

| Route Group | Folder Path | Layout | Deskripsi |
|-------------|-------------|--------|-----------|
| `(public)` | `/app/(public)/` | `layout.tsx` (Navbar + Footer) | Semua halaman publik. Menggunakan root layout global. |
| `(auth)` | `/app/(auth)/admin/login/` | `layout.tsx` (Terisolasi, tanpa Navbar/Footer) | Halaman login admin. Layout khusus sesuai wireframe E1-UX-05. |
| `admin` | `/app/admin/` | `layout.tsx` (Sidebar + Header + Content) | Semua halaman CRM. Terproteksi middleware. |
| `api` | `/app/api/` | `layout.tsx` (None) | Next.js Route Handlers (opsional, jika diperlukan sebagai proxy ke FastAPI). |
| `[...not-found]` | `/app/not-found.tsx` | Root layout wrapper | Halaman 404 global. HTTP 404 otomatis. |
| `error` | `/app/error.tsx` | Root layout wrapper | Global error boundary untuk runtime crashes. |

**Aturan Penting:**
- `/app/layout.tsx` = Root layout (font, metadata default, `<html>`, `<body>`, `<main>`)
- `/app/(public)/layout.tsx` = Wrapper untuk Navbar + Footer
- `/app/(auth)/admin/login/layout.tsx` = Override layout untuk halaman login
- `/app/admin/layout.tsx` = Admin global layout (sidebar + header)

---

## 🌐 2. Public Routes Specification
Rute publik dapat diakses tanpa autentikasi. Mayoritas menggunakan **SSG/ISR** untuk performa & SEO optimal.

| Route | Deskripsi | Strategi Rendering | Caching / Revalidation | Dynamic Params | Metadata Source |
|-------|-----------|-------------------|------------------------|----------------|-----------------|
| `/` | Homepage (Hero, Stats, Produk Preview, CTA) | `SSG` (Static) | `revalidate: 3600` (1 jam) | — | Static (`generateMetadata`) |
| `/produk` | Katalog produk (Grid 5 item) | `SSG` | `revalidate: 1800` | — | Static |
| `/produk/[slug]` | Detail produk per item | `SSG` + `generateStaticParams` | `revalidateTag('products')` | `slug: string` | Dynamic (fetch from DB/Supabase) |
| `/tentang-kami` | Sejarah, Visi-Misi, Tim, Legalitas | `SSG` | `revalidate: 86400` (24 jam) | — | Static |
| `/kontak` | Info kontak, WA, Maps, Form Email | `SSG` | Static (form client-side) | — | Static |
| `/artikel` | Daftar artikel (pagination, filter) | `SSR` / `ISR` | `revalidate: 300` (5 menit) | `?category`, `?page` | Dynamic (fetch latest published) |
| `/artikel/[slug]` | Detail artikel | `SSR` / `ISR` | `revalidateTag('articles')` | `slug: string` | Dynamic (title, OG, JSON-LD) |
| `/kalkulator` | Tool estimasi kebutuhan garam | `SSG` | Static (logic 100% client-side) | — | Static |
| `/minta-penawaran` | Form RFQ | `SSG` | Static (form client-side) | `?produk`, `?volume` | Static |
| `/minta-penawaran/terima-kasih` | Konfirmasi RFQ | `SSG` | Static (hanya via redirect) | — | Static |
| `/jadi-supplier` | Form pendaftaran supplier | `SSG` | Static | — | Static |
| `/jadi-supplier/terima-kasih` | Konfirmasi supplier | `SSG` | Static (hanya via redirect) | — | Static |

**Catatan Teknis:**
- `generateStaticParams` wajib untuk `/produk/[slug]` dan `/artikel/[slug]` agar semua route di-prebuild saat deployment.
- Form interaktif (`/minta-penawaran`, `/jadi-supplier`, `/kalkulator`) tetap `SSG` karena logika form berjalan di `'use client'`.
- Data yang sering berubah (artikel, kontak) di-fetch di runtime atau di-cache via `revalidateTag`.

---

## 🔒 3. Admin Routes (CRM Panel) Specification
Seluruh route di bawah `/admin` (kecuali `/admin/login`) **WAJIB** memiliki sesi JWT Supabase yang valid. Menggunakan layout admin global (sidebar + header).

| Route | Deskripsi | Layout Group | Auth Requirement | Data Source |
|-------|-----------|--------------|------------------|-------------|
| `/admin/login` | Halaman login admin | `(auth)` layout (terisolasi) | Publik (Tanpa Sesi) | Supabase Auth |
| `/admin/dashboard` | Ringkasan metrik & quick actions | `admin` layout | Sesi Aktif | Supabase / FastAPI |
| `/admin/leads` | Pipeline Kanban CRM | `admin` layout | Sesi Aktif | FastAPI `GET /rfq/leads` |
| `/admin/leads/[id]` | Detail lead, histori, WA template | `admin` layout | Sesi Aktif | FastAPI `GET /rfq/leads/{id}` |
| `/admin/suppliers` | Daftar registrasi supplier | `admin` layout | Sesi Aktif | FastAPI `GET /supplier` |
| `/admin/suppliers/[id]` | Detail supplier | `admin` layout | Sesi Aktif | FastAPI `GET /supplier/{id}` |
| `/admin/articles` | Manajemen konten (list, publish toggle) | `admin` layout | Sesi Aktif | Supabase `articles` |
| `/admin/articles/new` | Editor rich-text (buat artikel) | `admin` layout | Sesi Aktif | Supabase `POST /articles` |
| `/admin/articles/[id]/edit` | Editor update artikel | `admin` layout | Sesi Aktif | Supabase `PUT /articles/{id}` |
| `/admin/products` | Daftar 5 produk (edit only) | `admin` layout | Sesi Aktif | Supabase `products` |
| `/admin/products/[id]/edit` | Form edit spesifikasi & upload | `admin` layout | Sesi Aktif | Supabase `PUT /products/{id}` |
| `/admin/settings` | Pengaturan kontak & config web | `admin` layout | Sesi Aktif | Supabase `company_settings` |

**Catatan Teknis:**
- Semua halaman admin menggunakan `'use client'` untuk komponen interaktif (sidebar, dropdown, form).
- Data fetching di halaman admin dilakukan di Client Component via `fetch(NEXT_PUBLIC_API_URL)` atau langsung ke Supabase JS SDK (tergantung kompleksitas).
- Session check dilakukan di `/app/admin/layout.tsx` (Server Component) sebelum render.

---

## 🔗 4. Query Parameters & Prefill Logic
Parameter URL digunakan untuk **konversi lintas halaman** dan **filtering**. Harus divalidasi & disanitasi sebelum digunakan.

| Parameter | Halaman Target | Fungsi | Validasi & Sanitasi |
|-----------|----------------|--------|---------------------|
| `?produk=garam-halus-yodium` | `/minta-penawaran` | Prefill checkbox "Jenis Garam" di form RFQ | Harus match dengan slug produk valid. Default: unchecked jika invalid. |
| `?volume=10&produk=garam-kasar` | `/minta-penawaran` | Prefill volume (ton) & jenis garam dari Kalkulator | `volume`: number > 0. `produk`: string slug. |
| `?category=education` | `/artikel` | Filter tab artikel (education / company_news) | Enum validation. Default: `all`. |
| `?page=2` | `/artikel` | Pagination offset | Integer ≥ 1. Default: `1`. |
| `?status=new` | `/admin/leads`, `/admin/suppliers` | Filter pipeline/table by status | Enum match DB status. Default: `all`. |
| `?search=surabaya` | `/admin/leads`, `/admin/suppliers` | Search by name/company/location | `encodeURIComponent()` + backend LIKE query. |

**Implementasi di Next.js:**
```ts
// Contoh validasi di komponen client
const searchParams = useSearchParams()
const produk = searchParams.get('produk')
const isValid = produk && VALID_SLUGS.includes(produk)
```

---

## 🛡️ 5. Auth & Middleware Logic
Dikelola via `@supabase/ssr` + `/middleware.ts`. Semua logika proteksi terjadi **di server-side** sebelum response dikirim ke browser.

### 5.1 Cookie & Session Configuration
- Cookie name: `sb-<project-ref>-auth-token`
- Flags: `httpOnly: true`, `secure: true` (production), `sameSite: 'lax'`, `path: '/'`
- JWT Expiry: `3600s` (1 jam)
- Refresh Token: Auto-rotate via `updateSession()` di middleware

### 5.2 Middleware Matcher & Logic
```ts
// /middleware.ts
export const config = {
  matcher: ['/admin/:path*', '/minta-penawaran/:path*'] // Tambahkan route lain jika perlu proteksi
}

export async function middleware(request: NextRequest) {
  const supabase = createServerClient(...)
  const { data: { session } } = await supabase.auth.getSession()
  const url = new URL(request.url)

  // RULE 1: Akses /admin/* tanpa session → redirect ke login
  if (url.pathname.startsWith('/admin') && !url.pathname.startsWith('/admin/login') && !session) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // RULE 2: Akses /admin/login dengan session aktif → redirect ke dashboard
  if (url.pathname.startsWith('/admin/login') && session) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  // REFRESH SESSION di setiap request
  return NextResponse.next({ headers: await createHeaders(supabase) })
}
```

### 5.3 4 Aturan Redirect Mutlak
| Trigger | Kondisi | Aksi |
|---------|---------|------|
| Protected Route Access | Path `/admin/*` (bukan login) + `!session` | `redirect('/admin/login')` |
| Logged-in Access Login | Path `/admin/login` + `session` valid | `redirect('/admin/dashboard')` |
| Login Success | `supabase.auth.signInWithPassword()` resolve | `router.push('/admin/dashboard')` (client) |
| Logout | `supabase.auth.signOut()` | `redirect('/admin/login')` (middleware detects missing session) |

### 5.4 Edge Cases & Mitigasi
- **Token Expired Mid-Session:** Middleware auto-refresh. Jika gagal → redirect ke login.
- **Concurrent Tabs:** `@supabase/ssr` syncs cookies across tabs via storage event.
- **Brute Force Protection:** FastAPI rate limiting (`slowapi`) pada `POST /api/v1/auth/login` → max 5 attempts/IP/min.
- **CSRF:** Next.js App Router + Supabase cookies aman dari CSRF karena `sameSite: lax` & `httpOnly`.

---

## 🌍 6. API & Backend Communication Strategy
FastAPI berjalan terpisah di Railway. Next.js berkomunikasi via HTTP fetch.

| Layer | Endpoint Prefix | Hosting | Auth | CORS |
|-------|-----------------|---------|------|------|
| FastAPI Backend | `/api/v1/*` | Railway | JWT Bearer (Header) | `ALLOWED_ORIGINS` dari env |
| Next.js Frontend | Direct fetch / Route Handler (opsional) | Vercel | Cookie (Supabase) | N/A |
| Supabase Direct | `/rest/v1/*` | Supabase Cloud | anon_key (public), service_role (admin) | RLS Policies |

**Aturan Komunikasi:**
1. Public endpoints (`/rfq/generate`, `/supplier/register`) dipanggil langsung dari Client Component via `fetch(NEXT_PUBLIC_API_URL + path)`
2. Admin endpoints (`/rfq/leads`, `/supplier`) dipanggil dari Admin Components dengan menyertakan `Authorization: Bearer <session.access_token>` header.
3. Semua request ke FastAPI wajib handle timeout & fallback (khususnya AI endpoint).

---

## ⚠️ 7. Error, Loading & Suspense Boundaries
Struktur file Next.js untuk handling state non-happy path.

| File | Lokasi | Fungsi | Trigger | Fallback UI |
|------|--------|--------|---------|-------------|
| `not-found.tsx` | `/app/not-found.tsx` | Global 404 | URL tidak match route | E1-UX-04 Wireframe (ilustrasi garam, 404 besar, CTA) |
| `error.tsx` | `/app/error.tsx` | Global runtime error | Unhandled React crash | Error card + "Coba lagi" button |
| `loading.tsx` | `/app/(public)/loading.tsx` | Page transition loading | Route navigation | Skeleton variants (E1-UX-08) |
| `loading.tsx` | `/app/admin/loading.tsx` | Admin page loading | Data fetch pending | TableRowSkeleton / CardSkeleton |
| `error.tsx` | `/app/admin/error.tsx` | Admin scoped error | FastAPI down / 500 | "Sistem sedang maintenance" + retry |

**Implementasi Best Practice:**
```tsx
// app/(public)/loading.tsx
export default function Loading() {
  return <Suspense fallback={<CardSkeleton variant="page" />}>
    <div className="grid grid-cols-3 gap-6">{/* skeletons */}</div>
  </Suspense>
}
```

---

## 🔍 8. SEO & Metadata Strategy
SEO dikelola via Next.js `metadata` object & `generateMetadata()` function.

| Halaman | Title Pattern | Description | Extra Meta |
|---------|---------------|-------------|------------|
| `/` | `CV Reka Cipta Indonesia — Distributor Garam SNI` | `Distributor garam industri bersertifikat SNI. Melayani kebutuhan garam untuk makanan, pengasinan, water treatment, dan lainnya.` | OG Image, JSON-LD (Organization) |
| `/produk/[slug]` | `{productName} — CV Reka Cipta Indonesia` | `Spesifikasi teknis & unduh hasil lab {productName}. Tersedia stok rutin, pengiriman ke seluruh Indonesia.` | OG, Product Schema |
| `/artikel/[slug]` | `{articleTitle} — Artikel & Berita Garam` | `{meta_description || excerpt}` | OG, Article Schema |
| `/admin/*` | `Admin Panel — CV Reka Cipta Indonesia` | `Internal CRM System` | `robots: 'noindex, nofollow'` |

**Implementasi:**
```ts
// app/layout.tsx
export const metadata: Metadata = {
  title: { template: '%s | CV Reka Cipta Indonesia', default: 'CV Reka Cipta Indonesia' },
  description: 'Distributor garam industri bersertifikat SNI...',
  robots: 'index, follow',
  icons: { icon: '/favicon.ico' },
  openGraph: { type: 'website', locale: 'id_ID', siteName: 'CV Reka Cipta Indonesia' }
}
```
- `sitemap.xml` & `robots.txt` di-generate otomatis via `next-sitemap` atau Next.js `app/sitemap.ts`
- Dynamic metadata menggunakan `export async function generateMetadata({ params })`

---

## 💾 9. Caching & Data Revalidation Strategy
Next.js 14 menggunakan **Data Cache** by default. Strategi revalidation berbeda per konteks.

| Data Type | Fetch Location | Caching Strategy | Invalidation Trigger |
|-----------|----------------|------------------|----------------------|
| Produk (Public) | Server Component | `cache: 'force-cache'` (SSG) | `revalidateTag('products')` via webhook/admin update |
| Artikel (Public) | Server Component | `next: { revalidate: 300 }` (ISR) | `revalidateTag('articles')` saat publish/unpublish |
| RFQ Leads (Admin) | Client Component | `no-store` (real-time) | Manual refresh atau WebSocket (future) |
| Company Settings | Server/Client | `cache: 'force-cache'`, `revalidate: 3600` | `revalidatePath('/kontak')`, `/tentang-kami` |
| FastAPI AI Response | Route Handler | `no-store` | Tidak di-cache (dinamis per request) |

**Aturan Penting:**
- Gunakan `revalidateTag()` di Server Actions atau API routes saat admin update konten.
- Client-side fetch (`/admin`) gunakan `no-store` atau `fetch(..., { cache: 'no-store' })` untuk data yang butuh real-time (leads, status).
- Hindari `fetch` tanpa cache config di public pages agar tetap SSG/ISR.

---

## ✅ 10. Implementation Checklist & Validation
Gunakan checklist ini saat setup routing di Epic 1 & verifikasi di QA.

- [ ] Folder structure sesuai tabel Section 1 (`(public)`, `(auth)`, `admin`, `api`)
- [ ] `middleware.ts` aktif dengan `matcher: ['/admin/:path*']`
- [ ] 4 redirect rules tested (protected access, logged-in access login, success, logout)
- [ ] `/admin/login` menggunakan layout terisolasi (tidak ada navbar/footer)
- [ ] `not-found.tsx` & `error.tsx` render benar di `/url-tidak-ada` & `/produk/slug-salah`
- [ ] `generateStaticParams` generate semua slug produk (5 item)
- [ ] Query params `?produk` & `?volume` berhasil prefill form RFQ
- [ ] Metadata dynamic untuk `/produk/[slug]` & `/artikel/[slug]` tampil benar di View Page Source
- [ ] `robots: 'noindex'` aktif di semua `/admin/*` routes
- [ ] CORS FastAPI accept Vercel staging URL tanpa error di console
- [ ] Session persists setelah refresh & buka tab baru
- [ ] Logout clears cookie & redirect ke `/admin/login` (no back-button leak)

---

**Dokumen ini menjadi kontrak final antara UI/UX Design & Engineering.**  
Setiap perubahan routing, redirect logic, atau auth flow **WAJIB** di-dokumentasikan di sini sebelum implementasi.  
Versi: `2.0` | Terakhir direvisi: Mei 2026 | Author: Tim Pengembang Reka Cipta