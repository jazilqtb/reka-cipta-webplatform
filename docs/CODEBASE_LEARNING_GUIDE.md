# Panduan Belajar Codebase — CV Reka Cipta Indonesia

> **Cara pakai dokumen ini:** Saya (pemilik project) membangun seluruh project ini dengan bantuan AI, dan **tidak punya latar belakang web development sebelumnya**. Saya paham Python, backend, AI/LLM, dan dasar Node.js — tapi tidak paham konsep frontend modern (React/Next.js), TypeScript, Tailwind, routing berbasis file, atau hosting (Vercel/Railway/Supabase). Tujuan saya: memahami struktur & fungsi setiap bagian project supaya saya punya **kontrol penuh**, bukan cuma "AI yang buat, saya tidak ngerti isinya". Tolong ajak saya diskusi dengan mengaitkan tiap konsep ke file nyata di project ini (bukan contoh generik), dan pakai analogi ke backend/Python yang sudah saya pahami kalau membantu.
>
> **Untuk AI yang membaca dokumen ini:** Dokumen ini adalah peta struktur + konsep, disusun dari pembacaan langsung isi repo (bukan template generik). Nama file/fungsi di bawah **indikatif berdasarkan konvensi penamaan dan struktur folder** — kalau user bertanya detail *cara kerja* persis suatu file, sebaiknya diverifikasi ke isi file aslinya, karena dokumen ini tidak mereproduksi seluruh isi kode. Untuk konteks deployment/hosting yang lebih dalam (Vercel/Railway/Supabase env vars, branch strategy, SEO), ada dokumen pendamping: `docs/DEPLOYMENT_HOSTING_CONTEXT.md`.

---

## 0. Ringkasan project dalam satu paragraf

Website perusahaan garam (CV Reka Cipta Indonesia) dengan dua bagian yang **dikembangkan dan di-deploy terpisah** dalam satu repo (disebut "monorepo"):
- **Frontend** (`/` — root repo): Next.js — website publik (company profile, katalog produk, artikel, kalkulator kebutuhan garam, form RFQ/minta penawaran, form pendaftaran supplier) + panel admin/CRM.
- **Backend** (`/backend`): FastAPI (Python) — API untuk hal-hal yang butuh logika bisnis, autentikasi, atau integrasi pihak ketiga (AI, email).
- **Database**: Supabase (PostgreSQL terkelola + Auth + Storage file).

---

## 1. Istilah paling dasar — sebelum masuk ke struktur

| Istilah | Apa itu | Analogi dari yang sudah Anda pahami |
|---|---|---|
| **React** | Library JavaScript untuk membangun UI dari potongan-potongan disebut "component" (fungsi yang me-return tampilan) | Mirip: bikin fungsi Python yang return string HTML, tapi lebih terstruktur dan bisa "reaktif" (auto re-render kalau datanya berubah) |
| **Next.js** | Framework yang dibangun **di atas** React — nambahin routing berbasis folder, server-side rendering, build system, dll | Analoginya seperti FastAPI dibangun di atas Starlette — React itu "mesinnya", Next.js "kerangka aplikasi lengkap"-nya |
| **TypeScript (`.ts`)** | JavaScript + sistem tipe statis (mirip type hint Python tapi wajib & dicek saat build) | `def foo(x: int) -> str` di Python — bedanya di TS ini **wajib dan dicek ketat** |
| **`.tsx`** | File TypeScript yang **isinya ada markup UI** (JSX — HTML ditulis di dalam kode) | File `.ts` = logic murni (baca: fungsi, tipe, util). File `.tsx` = logic + tampilan (component React) |
| **JSX** | Sintaks nulis HTML langsung di dalam JavaScript/TypeScript, contoh: `return <div>Halo</div>` | Mirip f-string yang isinya HTML, tapi lebih canggih (bisa event handler, kondisi, loop) |
| **Node.js** | Runtime JavaScript di server (bukan browser) — sudah Anda pahami dasarnya | — |
| **npm / `package.json`** | Package manager + manifest dependency untuk Node.js | Persis seperti `pip` + `requirements.txt` |
| **Component** | Satu unit UI yang bisa dipakai ulang, ditulis sebagai fungsi yang return JSX | Mirip fungsi Python yang return template Jinja2 ter-render, tapi component bisa "hidup" dan berubah sendiri di browser |
| **Endpoint / API route** | URL yang menerima request dan return data (biasanya JSON) | Sama persis dengan konsep endpoint FastAPI yang sudah Anda pahami |
| **Server vs Client (di React/Next.js)** | Kode yang jalan **di server** (sebelum dikirim ke browser) vs kode yang beneran jalan **di browser user** | Server Component ≈ Anda render HTML di backend Python lalu kirim jadi (seperti `render_template`). Client Component ≈ JavaScript yang dikirim utuh dan dieksekusi browser, dipakai kalau butuh interaktif (klik, form, dst) |
| **Tailwind CSS** | Cara styling pakai class utility langsung di HTML/JSX (`className="text-red-500 p-4"`), bukan file CSS terpisah per komponen | Tidak ada analogi backend langsung — anggap saja "inline style tapi pakai kata kunci pendek yang sudah didefinisikan di satu file config" |
| **Hosting / Deploy** | Server yang menjalankan aplikasi Anda 24/7 supaya bisa diakses publik dari internet | Detail lengkap ada di `docs/DEPLOYMENT_HOSTING_CONTEXT.md` |

---

## 2. Next.js App Router — konvensi file khusus (INI YANG PALING PENTING dipahami duluan)

Next.js versi ini pakai sistem **"App Router"**: struktur folder di dalam `app/` **otomatis jadi struktur URL**. Di dalam tiap folder, ada beberapa **nama file khusus** yang punya arti tetap (bukan nama bebas):

| File | Fungsi | Analogi ke yang Anda pahami |
|---|---|---|
| **`page.tsx`** | Mendefinisikan **satu halaman** yang bisa diakses lewat URL. Wajib `export default` sebuah component. | Mirip 1 route handler `GET /path` yang return HTML halaman jadi |
| **`layout.tsx`** | **Bungkus** semua `page.tsx` di dalam folder yang sama (dan sub-foldernya). Dipakai untuk elemen yang selalu tampil, misal Navbar/Footer. Layout bersarang (nested) — layout luar membungkus layout dalam. | Mirip base template Jinja2 (`{% block content %}`) atau middleware yang wrap response di semua route di bawahnya |
| **`route.ts`** | Endpoint API **murni** — return JSON/file, bukan HTML/UI. Ini yang paling mirip endpoint FastAPI biasa. | Endpoint FastAPI (`@app.get(...)`) |
| **`loading.tsx`** | Otomatis ditampilkan saat `page.tsx` di folder yang sama masih memuat data (skeleton/spinner) | Semacam "please wait" otomatis, tidak perlu Anda handle manual di komponen |
| **`error.tsx`** | Otomatis ditampilkan kalau ada error runtime di dalam folder itu. **Wajib** `'use client'`. | Error handler / exception boundary |
| **`not-found.tsx`** | Ditampilkan saat halaman tidak ditemukan (404) — otomatis atau dipanggil manual lewat fungsi `notFound()` | Halaman 404 custom |
| **`sitemap.ts` / `robots.ts`** | Bukan halaman — generate file `sitemap.xml` / `robots.txt` otomatis dari kode saat build, untuk kebutuhan SEO | Endpoint yang return XML/text, tapi ditangani otomatis oleh Next.js |
| **`middleware.ts`** (di root project) | Kode yang jalan **sebelum** request sampai ke `page.tsx`/`route.ts` manapun yang cocok dengan `matcher`-nya. Dipakai di sini untuk cek login sebelum akses `/admin/*`. | Middleware/`before_request` di Flask, atau FastAPI Dependency global |

### Aturan folder penting

| Notasi folder | Arti | Contoh di project ini |
|---|---|---|
| `folder/` biasa | Jadi bagian URL | `app/produk/` → URL `/produk` |
| `(folder)/` — pakai kurung | **Route group** — TIDAK muncul di URL, cuma buat mengelompokkan halaman yang butuh `layout.tsx` berbeda | `app/(public)/` dan `app/(auth)/` — sama-sama tidak muncul di URL |
| `[folder]/` — pakai kurung siku | **Dynamic segment** — bagian URL yang jadi variabel | `app/(public)/produk/[slug]/` → URL `/produk/garam-halus-yodium`, `slug` bisa dibaca di kode (mirip path param `/produk/<slug>` di Flask) |

**Kenapa ada `(public)` dan `(auth)` terpisah padahal sama-sama tidak muncul di URL?** Supaya masing-masing bisa punya `layout.tsx` sendiri. Halaman publik dibungkus Navbar+Footer (`(public)/layout.tsx`), tapi halaman login admin (`(auth)/admin/login/`) sengaja **tidak** ikut layout admin (`app/admin/layout.tsx`) yang isinya cek sesi login — kalau ikut, halaman login sendiri akan kena cek "sudah login?", `belum` → redirect ke halaman login → yang notabene adalah dirinya sendiri → **infinite redirect loop**. Ini keputusan desain yang eksplisit, bukan kebetulan.

---

## 3. Peta folder top-level

```
/                     ← Root repo = project Next.js (frontend)
├── app/              ← Semua halaman & routing (App Router, lihat §2)
├── components/       ← Potongan UI yang dipakai ulang oleh halaman-halaman di app/
├── lib/              ← Fungsi utilitas & koneksi ke layanan eksternal (Supabase, API backend)
├── hooks/            ← Custom React hooks (logic reusable yang butuh state React)
├── constants/        ← Data statis (daftar navigasi, daftar industri, dll) — bukan dari database
├── types/             ← Definisi tipe TypeScript (bentuk data — mirip Pydantic schema tapi di sisi frontend)
├── public/            ← File statis yang di-serve apa adanya (logo, ikon, gambar) — diakses langsung lewat URL `/nama-file`
├── supabase/           ← File migrasi skema database (SQL) — dikelola lewat Supabase CLI
├── backend/            ← Project FastAPI terpisah (Python) — lihat §9
├── docs/                ← Dokumentasi project (termasuk dokumen ini)
├── tokens/              ← (kosong saat ini — kemungkinan disiapkan untuk design token terpisah, belum dipakai)
├── middleware.ts        ← Auth guard, jalan sebelum request masuk ke /admin/* (lihat §2 & §7)
├── next.config.ts        ← Konfigurasi Next.js: security headers, domain gambar yang diizinkan, integrasi Sentry
├── tailwind.config.ts     ← Konfigurasi Tailwind — **FROZEN, jangan diedit** (sudah diputuskan sebagai design system final)
├── app/globals.css        ← CSS global (font, custom animation class) — **FROZEN**, satu-satunya file CSS manual di project
├── tsconfig.json           ← Konfigurasi TypeScript (path alias `@/` = root project)
├── components.json         ← Konfigurasi shadcn/ui (generator komponen UI)
├── package.json             ← Daftar dependency Node.js + script (`npm run dev`, dst) — setara `requirements.txt`
├── instrumentation.ts        ← Setup Sentry sisi server (dijalankan otomatis oleh Next.js saat startup)
├── instrumentation-client.ts  ← Setup Sentry sisi browser
└── sentry.server.config.ts / sentry.edge.config.ts ← Konfigurasi Sentry per environment eksekusi
```

> **Catatan silang-cek:** `ARCHITECTURE.md` di root repo menyebut file Sentry client bernama `sentry.client.config.ts` — tapi di kode aktual sekarang namanya `instrumentation-client.ts` (konvensi Next.js versi terbaru berubah). `ARCHITECTURE.md` juga masih menyebut "Next.js 14", padahal `package.json` aktual mencatat **Next.js 16.2.6** dan React 19.2.4. Artinya: `ARCHITECTURE.md` adalah dokumen bagus untuk *konsep & keputusan arsitektur*, tapi untuk *daftar file paling akurat*, rujuk struktur aktual di dokumen ini atau cek langsung ke repo.

---

## 4. `app/` — peta halaman lengkap

### 4.1 File di root `app/`

| File | Fungsi |
|---|---|
| `layout.tsx` | Root layout — bungkus paling luar: `<html>`, `<body>`, font, metadata default. Semua halaman lain nested di dalam ini. |
| `globals.css` | CSS global (FROZEN) |
| `not-found.tsx` | Halaman 404 global |
| `global-error.tsx` | Error boundary paling luar (menangkap error yang lolos dari semua `error.tsx` di bawahnya) |
| `sitemap.ts` | Generate `/sitemap.xml` otomatis dari data Supabase (produk + artikel aktif) |
| `robots.ts` | Generate `/robots.txt` — izinkan semua kecuali `/admin/*` dan `/api/*` |

### 4.2 `app/(public)/` — halaman publik (dibungkus Navbar + Footer)

| Route (URL) | File | Catatan |
|---|---|---|
| `layout.tsx` (bukan URL) | `(public)/layout.tsx` | Render `<Navbar>` + `<main>{children}</main>` + `<Footer>` |
| `loading.tsx` | — | Skeleton loading untuk semua halaman publik |
| `/` | `(public)/page.tsx` | Homepage |
| `/produk` | `produk/page.tsx` + `loading.tsx` + `error.tsx` | Katalog produk |
| `/produk/[slug]` | `produk/[slug]/page.tsx` | Detail 1 produk, `slug` dari URL |
| `/tentang-kami` | `tentang-kami/page.tsx` + `loading.tsx` | Profil perusahaan |
| `/kontak` | `kontak/page.tsx` + `loading.tsx` | Halaman kontak |
| `/artikel` | `artikel/page.tsx` | Daftar artikel/blog |
| `/artikel/[slug]` | `artikel/[slug]/page.tsx` | Detail 1 artikel |
| `/kalkulator` | `kalkulator/page.tsx` | Kalkulator kebutuhan garam (logic di client) |
| `/minta-penawaran` | `minta-penawaran/page.tsx` + `error.tsx` | Form RFQ (Request for Quotation) |
| `/minta-penawaran/terima-kasih` | `.../terima-kasih/page.tsx` | Halaman konfirmasi setelah submit RFQ |
| `/jadi-supplier` | `jadi-supplier/page.tsx` + `error.tsx` | Form pendaftaran supplier |
| `/jadi-supplier/terima-kasih` | `.../terima-kasih/page.tsx` | Konfirmasi setelah daftar supplier |

### 4.3 `app/(auth)/admin/login/` — halaman login (terisolasi, lihat §2)

| File | Fungsi |
|---|---|
| `layout.tsx` | Layout terpisah total — **tanpa** Navbar/Footer publik maupun shell admin |
| `page.tsx` | Form login (`'use client'` — pakai react-hook-form + validasi zod) |

### 4.4 `app/admin/` — panel admin (semua ter-proteksi lewat `middleware.ts`)

| Route | File | Catatan |
|---|---|---|
| layout (bukan URL) | `admin/layout.tsx` | Server Component — cek sesi login (double-guard, lihat §7) + render `<AdminSidebar>` + `<AdminHeader>` |
| `/admin/dashboard` | `dashboard/page.tsx` | Halaman utama admin setelah login |
| `/admin/leads` | `leads/page.tsx` | CRM: Kanban board leads RFQ |
| `/admin/leads/[id]` | `leads/[id]/page.tsx` | Detail 1 lead |
| `/admin/suppliers` | `suppliers/page.tsx` + `error.tsx` | Daftar pendaftaran supplier |
| `/admin/suppliers/[id]` | `suppliers/[id]/page.tsx` | Detail 1 pendaftaran supplier |
| `/admin/products` | `products/page.tsx` | Daftar produk (admin) |
| `/admin/products/[id]/edit` | `.../edit/page.tsx` | Form edit produk |
| `/admin/articles` | `articles/page.tsx` | Daftar artikel + toggle publish |
| `/admin/articles/new` | `articles/new/page.tsx` | Buat artikel baru (rich text editor) |
| `/admin/articles/[id]/edit` | `.../edit/page.tsx` | Edit artikel |
| `/admin/settings` | `settings/page.tsx` + `actions.ts` | Pengaturan umum perusahaan (`actions.ts` = Server Actions untuk simpan data) |
| `/admin/proposal-settings` | `proposal-settings/page.tsx` | Pengaturan template/prompt AI proposal generator |
| `/admin/email-templates` | `email-templates/page.tsx` | Kelola template email otomatis |

### 4.5 `app/api/` — Route Handler (endpoint API murni dari Next.js sendiri)

| Route | File | Fungsi |
|---|---|---|
| `/api/legal-docs/[filename]` | `legal-docs/[filename]/route.ts` | Proxy download dokumen legal privat dari Supabase Storage (bucket `legal-docs` tidak publik, jadi butuh endpoint yang generate signed URL / stream file) |

> Catatan: Sebelumnya ada juga endpoint `/api/revalidate` (webhook cache invalidation) yang tercatat di `ARCHITECTURE.md` — tidak muncul di listing file aktual saat ini, kemungkinan pola invalidasi cache sudah sepenuhnya beralih ke Server Actions (`app/actions/*.ts`, lihat §4.6) alih-alih webhook terpisah.

### 4.6 `app/actions/` — Server Actions (logic sisi server yang dipanggil langsung dari component, tanpa bikin endpoint API manual)

| File | Fungsi |
|---|---|
| `products.ts` | `revalidateProductRoutes()` — invalidate cache halaman produk setelah admin edit produk |
| `articles.ts` | Aksi terkait artikel (kemungkinan: revalidate cache, publish/unpublish) |
| `leads.ts` | Aksi terkait leads RFQ |
| `supplier.ts` | Aksi terkait pendaftaran supplier |

**Apa itu Server Action?** Fungsi yang ditandai `'use server'` di baris pertama file, bisa dipanggil langsung dari component React (server maupun client) seolah-olah pemanggilan fungsi biasa, padahal sebenarnya jalan di server. Next.js otomatis bikinkan mekanisme network call di baliknya. Ini pola modern Next.js untuk "submit form" atau "trigger aksi server" **tanpa perlu bikin `route.ts` manual**.

---

## 5. `components/` — peta lengkap

Prinsip pembagian: `app/*/page.tsx` biasanya **tipis** (fetch data + susun layout), lalu detail UI-nya didelegasikan ke `components/`.

| Subfolder | Isi | Catatan |
|---|---|---|
| `components/ui/` | Komponen dasar dari **shadcn/ui** (button, input, label, dialog, badge, textarea, dll) + `skeletons/` (loading placeholder custom) | **Jangan edit langsung** — ini "base library". Kalau butuh varian brand, extend lewat `components/brand/` |
| `components/brand/` | Komponen yang pakai brand token secara spesifik (saat ini: `Logo.tsx`) | |
| `components/layout/` | `Navbar.tsx` (client — ada state buka/tutup menu mobile), `Footer.tsx` (server), `AdminSidebar.tsx` (client — deteksi halaman aktif), `AdminHeader.tsx` (server) | Dipakai di `layout.tsx` masing-masing route group |
| `components/sections/` | Blok besar per-section halaman publik: `HeroSection`, `HeroCarousel`, `StatsBar`, `ProductsPreview`, `HowItWorks`, `IndustriesGrid`, `CredibilitySection`, `CTASection`, `CompanyTimeline`, `VisiMisi`, `OrgStructure`, `ContactInfo`, `GMapsEmbed`, `LegalDocsGrid`, `ArticlesPreview`/`ArticlesPreviewTabs`, `InnerPageHero`, `WhatsAppButtons` | Dipakai langsung oleh `page.tsx` halaman publik |
| `components/blocks/` | Kartu/unit UI kecil yang dipakai berulang: `ProductCard`, `ArticleCard`, `TeamMember`, `LegalDocCard`, `LegalDocModal` | |
| `components/forms/` | `ContactForm.tsx` (form kontak, client) | |
| `components/rfq/` | `RFQForm.tsx`, `FormSection.tsx`, `InfoBlock.tsx`, `SaltTypeCheckboxGroup.tsx` | Form "minta penawaran" lengkap dengan sub-komponen |
| `components/product/` | `ProductGrid`, `ProductCard`, `ProductHero`, `ProductBreadcrumb`, `ProductCTA`, `SpecTable`, `CategoryFilterTabs`, `IndustryList`, `LabDocDownload` | Komponen khusus halaman katalog/detail produk publik |
| `components/article/` | `ArticleBreadcrumb`, `ArticlePagination`, `ArticleViewTracker`, `CategoryTabs`, `RelatedArticles` | Komponen khusus halaman artikel publik |
| `components/calculator/` | `CalculatorForm`, `CalculatorIntro`, `CalculatorResult` | Kalkulator kebutuhan garam — logic 100% di client |
| `components/supplier/` | `SupplierRegistrationForm`, `BenefitsSection`, `SupplierSaltTypesCheckboxGroup` | Form pendaftaran supplier publik |
| `components/animations/` | `RevealWrapper.tsx` (bungkus elemen supaya muncul dengan animasi saat di-scroll, pakai IntersectionObserver), `AnimatedCounter.tsx` | |
| `components/admin/` | Lihat breakdown di bawah — di-organize per domain (bukan flat lagi seperti tercatat di `ARCHITECTURE.md`) | |

### `components/admin/` — sudah di-reorganize per domain

| Subfolder | Isi |
|---|---|
| `admin/article/` | `ArticleForm`, `ArticleAdminRow`, `ArticlesAdminList`, `RichTextEditor` (editor Tiptap), `ThumbnailUploader` |
| `admin/lead/` | `LeadsKanbanBoard`, `KanbanColumn`, `LeadKanbanCard`, `LeadDetailView`, `FilterPanel`, `MobileLeadsView`, `StatusPanel`, `StatusHistoryTable`, `WATemplateModal`, `ProposalGeneratorPanel` |
| `admin/product/` | `ProductsAdminList`, `ProductAdminRow`, `ProductEditForm`, `PhotoUploader`, `PDFUploader`, `IndustriesEditor`, `SpecJSONBEditor` (editor untuk kolom JSONB spesifikasi produk), `ReadOnlyInfoBlock` |
| `admin/supplier/` | `SupplierListView`, `SupplierDetailView`, `SupplierTable`, `SupplierInfoCard`, `SupplierStatusPanel`, `StatusBadge`, `SaltTypesCell`, `FilterPanel`, `MetadataCard`, `SupplierWATemplateButton` |
| `admin/settings/` | `EmailTemplatesTabs`, `EmailTemplateEditor`, `WATemplateEditor`, `PromptEditor` (edit prompt AI proposal generator), `LayoutCustomizer`, `HistoryPanel` |
| `admin/shared/` | `AdminNotesEditor` |
| `admin/` (langsung) | `SettingsForm.tsx` |

---

## 6. `lib/`, `hooks/`, `constants/`, `types/`

### `lib/` — fungsi utilitas & koneksi layanan eksternal

| File | Fungsi |
|---|---|
| `lib/supabase/server.ts` | Bikin Supabase client untuk **Server Component** — baca cookie sesi lewat Next.js `cookies()`, jadi request ikut ter-autentikasi sebagai user yang login |
| `lib/supabase/client.ts` | Bikin Supabase client untuk **Client Component** (`'use client'`) — dipakai di browser |
| `lib/supabase/middleware.ts` | Helper `updateSession()` dipanggil dari `middleware.ts` — refresh token & sinkronisasi cookie di tiap request |
| `lib/supabase/public.ts` | Supabase client **tanpa akses cookie**, stateless — dipakai untuk fetch data publik di Server Component supaya halamannya tetap bisa di-cache sebagai static/ISR (kalau pakai client yang baca cookie, Next.js otomatis anggap halaman itu dinamis) |
| `lib/api.ts` | Wrapper `fetch()` khusus untuk manggil backend FastAPI — otomatis nempelin header `Authorization: Bearer <token>` kalau `auth: true`, ada timeout default | Ini "HTTP client" Anda ke backend, mirip `requests` session dengan default header |
| `lib/env.ts` | Baca environment variable dengan validasi — kalau ada yang kosong, langsung error saat startup (bukan silent fail) |
| `lib/storage.ts` | `getPublicStorageUrl(bucket, path)` — bangun URL publik lengkap dari path relatif yang disimpan di database (lihat §10) |
| `lib/utils.ts` | Fungsi umum: `cn()` (gabung className Tailwind dengan aman), formatter tanggal/angka, dll |
| `lib/wa-link.ts` | `generateWALink(nomor, pesan)` — bikin link `wa.me/...` untuk tombol WhatsApp |
| `lib/calculator.ts` | Logic hitung kalkulator kebutuhan garam |
| `lib/slugify.ts` | Ubah teks jadi slug URL-friendly (mis. "Garam Halus" → `garam-halus`) |
| `lib/article-content.ts`, `lib/article-mapper.ts` | Olah/format data artikel dari Supabase jadi bentuk siap-render |
| `lib/product-mapper.ts`, `lib/product-spec-labels.ts`, `lib/product-industry-icons.ts` | Olah/format data produk dari Supabase jadi bentuk siap-render + label & ikon industri |
| `lib/data/articles.ts` | Query data artikel dari Supabase (fungsi fetch spesifik) |
| `lib/constants/*.ts` (`lead-status.ts`, `salt-calculator.ts`, `supplier-salt-types.ts`) | Konstanta domain-specific yang dipakai lintas komponen |
| `lib/validation/*.ts` (`article-schema.ts`, `product-schema.ts`, `rfq-schema.ts`, `supplier-schema.ts`) | Skema validasi **zod** untuk tiap form — ini yang dipakai `react-hook-form` untuk validasi input sebelum submit (mirip Pydantic tapi jalan di sisi frontend/browser) |

### `hooks/` — custom React hooks

| File | Fungsi |
|---|---|
| `use-is-mobile.ts` | Deteksi apakah layar termasuk ukuran mobile (dipakai untuk render tampilan beda, mis. `MobileLeadsView`) |
| `use-scroll-reveal.ts` | Logic di balik animasi reveal-on-scroll (`RevealWrapper`) |

### `constants/`

| File | Fungsi |
|---|---|
| `navigation.ts` | Item menu Navbar/Footer publik |
| `adminNavigation.ts` | Item menu `AdminSidebar` |
| `company-profile.ts` | Data profil perusahaan statis (kemungkinan sebagian sudah pindah ke `company_settings` di database — cek isinya kalau ragu mana yang sumber kebenarannya) |
| `clients.ts` | Daftar klien/mitra (untuk ditampilkan di halaman publik) |

### `types/`

| File | Fungsi |
|---|---|
| `types/api.ts` | Interface TypeScript yang **harus** sinkron manual dengan Pydantic schema di `backend/schemas/*.py` — ini "kontrak" bentuk data antara frontend-backend |
| `types/index.ts` | Barrel export (re-export semua tipe dari satu pintu, supaya import di file lain lebih ringkas: `import { X } from '@/types'` bukan dari file spesifik) |

---

## 7. Server vs Client Component — kapan pakai yang mana

**Default: semua component di Next.js App Router adalah Server Component**, kecuali file itu diawali baris `'use client'`.

| Butuh... | Server Component (default) | Client Component (`'use client'`) |
|---|---|---|
| Fetch data langsung ke Supabase/DB | ✅ Bisa langsung, aman (service key/koneksi DB tidak pernah sampai ke browser) | ❌ Tidak — harus lewat API |
| `useState`, `useEffect` | ❌ Tidak bisa | ✅ |
| Event handler (`onClick`, `onSubmit`) | ❌ Tidak bisa | ✅ |
| `usePathname`, `useRouter`, `useSearchParams` | ❌ | ✅ |
| Ukuran JS yang dikirim ke browser | Tidak menambah bundle JS (di-render jadi HTML di server) | Menambah bundle JS (kode ikut dikirim ke browser) |

**Pola paling umum di project ini:** `page.tsx` adalah Server Component yang fetch data (mis. dari Supabase), lalu data itu dioper sebagai **props** ke sebuah Client Component leaf yang urus interaktivitas. Contoh nyata (`app/(public)/produk/[slug]/page.tsx` → komponen detail produk client): server ambil data produk dari Supabase, lempar sebagai props ke component yang punya tab/accordion interaktif.

**Kenapa ini penting dipahami:** kalau Anda baca satu file `.tsx` dan bingung kenapa dia "tidak bisa" pakai `useState`, cek baris pertama filenya — kalau tidak ada `'use client'`, itu Server Component dan memang tidak boleh pakai hook React.

---

## 8. Alur data end-to-end — supaya paham keterkaitan antar file

### 8.1 Pengunjung buka halaman detail produk

```
Browser minta /produk/garam-halus-yodium
   → app/(public)/produk/[slug]/page.tsx (Server Component)
       → panggil lib/supabase/public.ts (client Supabase stateless)
       → SELECT dari tabel `products` WHERE slug = ...
       → kalau tidak ketemu → notFound() → tampilkan app/(public)/produk/error.tsx atau not-found
   → data produk dioper sebagai props ke component client (tab/spec interaktif)
   → HTML jadi dikirim ke browser (karena halaman ini SSG/ISR, biasanya sudah di-generate sebelumnya, bukan fetch live tiap request)
```

### 8.2 Admin edit produk → publik langsung ter-update ("real-time edit")

```
Admin isi form di app/admin/products/[id]/edit/page.tsx
   → components/admin/product/ProductEditForm.tsx (client, react-hook-form + zod validation dari lib/validation/product-schema.ts)
   → submit → panggil backend FastAPI PUT /api/v1/products/{id} lewat lib/api.ts (pakai auth: true, JWT dari sesi Supabase)
   → backend/routers/products.py terima request, validasi lewat backend/schemas/product.py
   → update ke Supabase (backend/core/supabase.py)
   → setelah sukses, frontend panggil Server Action app/actions/products.ts → revalidateProductRoutes(slug)
   → revalidatePath('/'), revalidatePath('/produk'), revalidatePath('/produk/slug'), revalidatePath('/sitemap.xml')
   → cache halaman-halaman itu di-invalidate → pengunjung berikutnya dapat versi terbaru, TANPA perlu deploy ulang
```

### 8.3 Pengunjung submit form RFQ → trigger AI + email

```
components/rfq/RFQForm.tsx (client, react-hook-form + lib/validation/rfq-schema.ts)
   → submit → lib/api.ts → POST /api/v1/rfq/generate (backend FastAPI, BUKAN langsung ke Supabase — karena ada logic bisnis + integrasi pihak ketiga)
   → backend/routers/rfq.py → submit_rfq()
       → simpan lead baru ke tabel rfq_leads (Supabase)
       → panggil backend/services/proposal_generator.py → Anthropic API (Claude) untuk generate draft proposal
       → panggil backend/services/email_service.py → kirim email lewat Resend (ke calon klien + notifikasi admin)
   → response sukses → browser redirect ke /minta-penawaran/terima-kasih
```

### 8.4 Login admin

```
app/(auth)/admin/login/page.tsx (client)
   → form submit → Supabase Auth signInWithPassword() langsung dari browser (lib/supabase/client.ts)
   → sukses → router.push('/admin/dashboard')
   → request ke /admin/dashboard masuk lewat middleware.ts dulu
       → cek sesi user (lib/supabase/middleware.ts)
       → kalau valid, lanjut ke app/admin/layout.tsx (Server Component, double-check sesi lagi sebagai safety net)
       → render <AdminSidebar> + <AdminHeader> + halaman dashboard
```

---

## 9. `backend/` — struktur FastAPI

Karena Anda sudah paham FastAPI/Python, bagian ini cukup pemetaan singkat.

| Folder/File | Fungsi | Analogi |
|---|---|---|
| `main.py` | Entry point: inisialisasi `FastAPI()`, setup Sentry, rate limiter (slowapi), CORS, daftarkan semua router, endpoint `/health` | `app = FastAPI()` + semua `include_router()` jadi satu tempat |
| `core/config.py` | Semua environment variable didefinisikan & divalidasi lewat `pydantic-settings` — crash saat startup kalau ada yang wajib tapi kosong | `Settings(BaseSettings)` |
| `core/supabase.py` | Singleton Supabase client Python (pakai **service role key** — akses penuh, bypass RLS) | Koneksi DB global/pool |
| `core/storage.py` | Helper bangun URL publik file dari Supabase Storage (versi Python dari `lib/storage.ts` di frontend) | |
| `routers/` | Satu file = satu grup endpoint terkait: `auth.py`, `rfq.py`, `supplier.py`, `articles.py`, `products.py`, `settings.py`, `contact.py`, `proposal_settings.py`, `templates.py` | Blueprint Flask / APIRouter FastAPI per domain |
| `schemas/` | Model Pydantic untuk request/response tiap domain (`rfq.py`, `article.py`, `product.py`, `supplier.py`, `auth.py`, `contact.py`, `settings.py`, `templates.py`, `proposal_settings.py`) — **ini yang harus disinkronkan manual ke `types/api.ts` di frontend** | Pydantic model biasa |
| `dependencies/auth.py` | `get_current_user()` — FastAPI Dependency yang verifikasi JWT dari Supabase Auth, dipakai di endpoint yang butuh login | `Depends(get_current_user)` |
| `services/` | Logic bisnis yang lebih kompleks dari sekadar CRUD: `proposal_generator.py` (panggil Anthropic API), `email_service.py` (wrapper Resend), `pdf_service.py` (generate PDF pakai WeasyPrint), `wa_template_service.py`/`wa_templates_service.py` (generate teks WhatsApp), `proposal_settings_service.py`, `email_templates_service.py`, `storage_service.py` | Service layer / use-case layer |
| `prompts/proposal_prompt.py` | Prompt template untuk AI proposal generator — dipisah dari logic supaya gampang di-tuning tanpa ubah kode | |
| `utils/slugify.py` | Versi Python dari `lib/slugify.ts` | |
| `Procfile` | Perintah start server: `web: uvicorn main:app --host 0.0.0.0 --port $PORT` — dipakai Railway | |
| `railpack.json` | Daftar system package (apt) tambahan yang dibutuhkan `weasyprint` untuk generate PDF | |

**Perbedaan penting dari kebiasaan Flask/FastAPI sederhana:** endpoint publik (baca produk/artikel) **sengaja tidak selalu lewat FastAPI** — banyak yang langsung dari frontend ke Supabase (lihat §6 dokumen `docs/DEPLOYMENT_HOSTING_CONTEXT.md` bagian rendering, atau §6.1 `ARCHITECTURE.md`). FastAPI dipakai spesifik untuk: yang butuh JWT admin, yang trigger side-effect (AI/email), atau yang punya business logic non-trivial.

---

## 10. Supabase — dijelaskan dari nol

**Apa itu Supabase?** Layanan terkelola ("managed service") yang menyediakan 3 hal sekaligus dalam satu project:
1. **Database PostgreSQL** — database relasional biasa, tapi Anda tidak perlu install/maintain server Postgres sendiri.
2. **Auth** — sistem login/user management siap pakai (dipakai untuk login admin panel).
3. **Storage** — penyimpanan file (mirip S3), dipakai untuk foto produk, PDF lab, thumbnail artikel.

### Konsep RLS (Row Level Security) — WAJIB dipahami

Alih-alih kontrol akses data cuma di kode aplikasi (misal: `if user.is_admin: ...`), Supabase mendorong kontrol akses **ke level database** lewat RLS. Tiap tabel punya "policy" yang menentukan siapa boleh SELECT/INSERT/UPDATE/DELETE baris mana. Contoh pola yang dipakai di project ini:

- **Pattern publik-baca, admin-tulis** (`products`, `company_settings`): siapa saja boleh `SELECT`, tapi `INSERT`/`UPDATE`/`DELETE` cuma boleh kalau `auth.uid()` (user login) tidak null.
- **Pattern publik-insert, admin-baca/tulis** (`rfq_leads`, `supplier_registrations`): publik boleh `INSERT` (submit form), tapi cuma admin yang bisa `SELECT`/`UPDATE` (lihat & proses leads).

Artinya: **keamanan data tidak bergantung sepenuhnya pada kode frontend/backend Anda benar** — kalaupun ada bug di kode yang lupa cek auth, database sendiri tetap menolak akses yang tidak sesuai policy. Ini beda dari pola tradisional yang biasanya Anda temui di backend murni (semua logic akses ada di application layer).

### Migration — cara ubah skema database

Tidak boleh edit skema langsung lewat dashboard Supabase. Semua perubahan (bikin tabel, ubah kolom, tambah policy) harus lewat **file migrasi SQL** di `supabase/migrations/` (26 file saat ini, format nama `{timestamp}_{deskripsi}.sql`), dijalankan dengan:
```bash
npx supabase migration new nama_migration   # bikin file baru
npx supabase db push                        # apply ke Supabase cloud
```
Alasan aturan ini: supaya riwayat perubahan skema tercatat di Git (bisa di-review, bisa di-rollback, tim lain tahu apa yang berubah) — bukan berubah diam-diam lewat klik di dashboard.

### 5 konteks koneksi Supabase yang berbeda di project ini

| Konteks | File | Kenapa beda |
|---|---|---|
| Server Component (butuh sesi login) | `lib/supabase/server.ts` | Baca cookie sesi dari request |
| Client Component (browser) | `lib/supabase/client.ts` | Jalan di browser, pakai anon key |
| Middleware | inline di `middleware.ts` | Perlu bisa **menulis ulang** cookie (refresh token) di response |
| Server Component untuk data publik | `lib/supabase/public.ts` | Sengaja **tidak** baca cookie, supaya halaman tetap bisa di-cache sebagai static (kalau baca cookie, Next.js otomatis anggap halaman dinamis dan tidak bisa di-SSG) |
| Backend FastAPI | `backend/core/supabase.py` | Pakai **service role key** (bukan anon key) — akses penuh, bypass RLS, karena FastAPI sendiri yang jadi lapisan otorisasi (lewat JWT check) |

### Storage — pola penyimpanan path, bukan URL penuh

Aturan penting: kolom database yang simpan referensi file (`products.photo_path`, dst) **hanya menyimpan path relatif** (contoh: `garam-yodium.jpg`), bukan URL lengkap. URL publik penuh baru dibangun saat aplikasi jalan, lewat `lib/storage.ts` (frontend) atau `backend/core/storage.py` (backend), yang menggabungkan `SUPABASE_URL` (dari env var) + bucket + path. Alasannya: kalau suatu saat pindah project Supabase (misal staging → production), tidak perlu migrasi data — tinggal ganti env var.

---

## 11. Vercel & Railway — ringkas (detail lengkap di `docs/DEPLOYMENT_HOSTING_CONTEXT.md`)

- **Vercel** menjalankan frontend Next.js 24/7 dan otomatis build ulang tiap ada push ke branch yang terhubung.
- **Railway** menjalankan backend FastAPI (Python) sebagai proses server biasa (`uvicorn`), juga auto-deploy dari GitHub.
- Keduanya **terpisah sepenuhnya** — beda platform, beda env var, beda proses deploy — karena frontend dan backend adalah dua aplikasi berbeda yang kebetulan hidup di satu repo (monorepo).
- Supabase **tidak di-deploy** oleh Anda — itu sepenuhnya dikelola Supabase sendiri, Anda cuma pakai lewat API/SDK.

Untuk penjelasan konsep hosting dari nol (apa itu domain/DNS, kenapa 3 platform, status live saat ini, cara konten bisa "real-time" ter-update, SEO), pakai dokumen pendamping **`docs/DEPLOYMENT_HOSTING_CONTEXT.md`** — dokumen itu fokus ke sisi hosting/deploy, dokumen ini fokus ke sisi struktur kode.

---

## 12. Konvensi penamaan (ringkas dari `ARCHITECTURE.md` §9)

| Tipe file/identifier | Konvensi | Contoh |
|---|---|---|
| React component (file) | `PascalCase.tsx` | `Navbar.tsx`, `ProductCard.tsx` |
| Non-component TypeScript | `kebab-case.ts` | `api.ts`, `wa-link.ts`, `use-scroll-reveal.ts` |
| File khusus Next.js | ditentukan Next.js sendiri, huruf kecil | `page.tsx`, `layout.tsx`, `route.ts` |
| Python module | `snake_case.py` | `proposal_generator.py` |
| Migration SQL | `{timestamp}_{deskripsi}.sql` | `20260601000006_articles.sql` |
| React component (nama fungsi) | `PascalCase` | `function Navbar()` |
| Custom hook | `use` + `camelCase` | `useScrollReveal()` |
| Konstanta array/object | `SCREAMING_SNAKE_CASE` | `NAV_ITEMS` |
| TypeScript type/interface | `PascalCase` | `interface RFQLead` |
| Pydantic model | `PascalCase` | `class LoginRequest` |

---

## 13. Urutan belajar yang disarankan

1. **Konsep dasar dulu** — apa itu component, JSX, `.tsx` vs `.ts`, server vs client component (§1, §7). Jangan langsung baca kode kalau istilah dasarnya belum nempel.
2. **Baca alur routing** — buka `middleware.ts`, lalu `app/admin/layout.tsx`, lalu `app/(auth)/admin/login/page.tsx`. Ini paket auth-flow lengkap yang paling sering jadi sumber kebingungan (kenapa route group terpisah, dst — §2 & §7).
3. **Baca satu halaman publik sederhana end-to-end** — mulai dari `app/(public)/tentang-kami/page.tsx` (paling simpel), lihat komponen apa yang dipanggil, lihat dari mana datanya.
4. **Baca satu alur form lengkap** — `components/rfq/RFQForm.tsx` → `lib/validation/rfq-schema.ts` → `lib/api.ts` → `backend/routers/rfq.py` → `backend/services/`. Ini mengajarkan bagaimana frontend-backend "ngobrol".
5. **Baca alur "real-time edit"** — `app/admin/products/[id]/edit/page.tsx` → `app/actions/products.ts` → `revalidatePath`. Ini konsep yang paling sering ditanyakan ("kok bisa update tanpa deploy ulang").
6. **Baru masuk Supabase** — migration files, RLS policy (§10), lalu baca salah satu file migrasi asli di `supabase/migrations/` untuk lihat SQL nyata.
7. **Terakhir, hosting** — pindah ke `docs/DEPLOYMENT_HOSTING_CONTEXT.md` untuk Vercel/Railway/domain/SEO.

Kalau di tiap tahap Anda tanya ke AI "jelaskan file X", minta AI itu **membaca isi file aslinya** (bukan cuma menebak dari nama), supaya jawabannya akurat — dokumen ini kasih peta & konteks, bukan pengganti baca kode langsung.
