# Panduan Urutan Pengerjaan — Epic 2 · Slice 1: Beranda
## CV Reka Cipta Indonesia · Solo Developer Guide

> **Prinsip utama:** Urutan di bawah bukan layer-by-layer (L1→L2→L3a→L3b→...→L4), melainkan **dependency-driven** — setiap task dikerjakan tepat saat semua dependensinya terpenuhi, tidak lebih awal, tidak lebih lambat.
>
> **Perbedaan kritis vs Epic 1:** Di Epic 1 ada infrastructure spikes, scaffolding, deployment setup, dll. Di Epic 2 semua infrastruktur sudah berjalan. Ini adalah **feature epic murni** — fokus ke DB schema, backend endpoint, tipe data, animation primitives, lalu 7 section frontend halaman Beranda.

---

## ⚡ TL;DR — Urutan Sederhana

```
FASE 0 → FASE 1 → FASE 2 → FASE 3 → FASE 4 → FASE 5 → FASE 6 → FASE 7
UX All  DB      Backend  Animation  Page    Sections  Assembly  QA
(5 UX)  (DB-01  (BE-01→  (ANIM-01  Shell   (FE-02    (FE-09    Staging
        DB-02)  CONT-01  →02→03)   (FE-01)  s/d       sitemap   QA-01
                →BE-02            metadata)  FE-08)    robots)  →QA-06
                →BE-03)
```

---

## ✅ Prasyarat: Verifikasi Output Epic 1

> **Tidak ada kode ditulis di sini.** Buka checklist dan pastikan semuanya ada.

Sebelum mulai satu baris pun di Epic 2, verifikasi semua output Epic 1 berikut:

| Cek | Output Epic 1 | Path | Kenapa Wajib Ada |
|---|---|---|---|
| ☐ | Global Navbar | `components/layout/Navbar.tsx` | Halaman Beranda otomatis dapat Navbar via `(public)/layout.tsx` |
| ☐ | Global Footer | `components/layout/Footer.tsx` | Sama seperti Navbar |
| ☐ | Public layout wrapper | `app/(public)/layout.tsx` | Tanpa ini, Beranda tidak punya Navbar + Footer |
| ☐ | Skeleton components | `components/ui/skeletons/` | Dipakai `loading.tsx` dan `ProductsPreview` |
| ☐ | Tailwind brand tokens | `tailwind.config.ts` + `globals.css` | **FROZEN** — semua komponen baru pakai token ini |
| ☐ | Supabase server client | `lib/supabase/server.ts` | `page.tsx` fetch `company_settings` via ini |
| ☐ | Type-safe env access | `lib/env.ts` | Semua env vars server-side |
| ☐ | Migration files berjalan | `supabase/migrations/` (3 files dari E1) | Migration baru Epic 2 akan append ke sini |
| ☐ | RLS pattern template | `..._base_rls_patterns.sql` | **Pattern A** dipakai untuk `company_settings` |
| ☐ | `hooks/` folder | `hooks/` (ada, tapi kosong) | ANIM-01 akan membuat file pertama di sini |
| ☐ | `components/animations/` folder | `components/animations/` (ada, tapi kosong) | ANIM-02 dan ANIM-03 akan membuat file di sini |
| ☐ | `components/sections/` folder | `components/sections/` (ada, tapi kosong) | Semua 7 section components akan dibuat di sini |

> **Jika ada yang belum ada:** Selesaikan dulu item Epic 1 yang bersangkutan sebelum lanjut.

---

## FASE 0 — Pre-Code: Semua Keputusan Desain Beranda

> **Tidak ada kode ditulis di fase ini.** Output berupa keputusan tertulis / sketsa / tabel spec.
> **Estimasi:** 1.5–2.5 jam
> **⚠️ Perbedaan dari E1:** Di Epic 1, wireframe dikerjakan tepat sebelum komponen terkait (interleaved). Untuk Beranda, lebih efisien **semua UX sekaligus di awal** karena ke-7 section berada di satu halaman — keputusan warna background satu section mempengaruhi section berikutnya (contrast alternation), dan proporsi antar section harus konsisten secara visual.

### Kenapa FASE 0 ini penting?
- Tanpa **UX-01**, kamu tidak tahu apakah Hero pakai foto dengan overlay atau `bg-brand-animated` → kode Hero salah
- Tanpa **UX-05**, kamu tidak bisa mengisi `export const metadata` di FE-01 → harus balik ke sini
- Tanpa **UX-02 + UX-03 + UX-04** sekaligus, kamu bisa membuat 3 section berturut-turut dengan background yang sama (bukan alternating) → halaman terlihat flat

### Urutan:

| # | Task ID | Apa yang dikerjakan | Output konkret |
|---|---------|--------------------|----|
| 1 | `E2-S1-UX-01` | Putuskan background Hero: **Opsi A** (foto + overlay) atau **Opsi B** (`bg-brand-animated`). Dokumentasikan pilihan + spesifikasi semua elemen Hero | Keputusan background tertulis + spec headline, sub-headline, CTA buttons, animasi mount |
| 2 | `E2-S1-UX-02` | Tentukan warna background Stats Bar (harus kontras dengan Hero yang baru dipilih). Konfirmasi layout 4 kolom desktop / 2×2 mobile | Keputusan warna + konfirmasi layout stats |
| 3 | `E2-S1-UX-03` | Tentukan layout Product Grid (5 kolom lurus vs 3+2). Konfirmasi Cara Kerja 4-langkah horizontal + Industries Grid 3 kolom desktop | Keputusan layout product grid terdokumentasi |
| 4 | `E2-S1-UX-04` | Tentukan background Credibility (bg-neutral-50 vs bg-teal-50). Konfirmasi elemen CTA penutup | Spec Credibility + CTA Section |
| 5 | `E2-S1-UX-05` | Tulis nilai final semua metadata: `<title>`, `<meta description>` (≤160 char), `og:title`, `og:description`, path `og:image`, canonical URL | Tabel metadata yang siap di-copy paste ke `export const metadata` di FE-01 |

**📖 Baca juga (tidak perlu dikerjakan terpisah):** Review **E2-S1-US-01** s/d **E2-S1-US-05** sebagai acceptance criteria — baca sekilas sebelum memulai FASE 3 dan FASE 5 sebagai reminder "apa yang harus bisa dilakukan user."

---

## FASE 1 — Database Foundation

> **Tujuan:** Tabel `company_settings` ada di Supabase dengan data seed, RLS aktif dan terverifikasi.
> **Estimasi:** 30–45 menit

### Kenapa DB dikerjakan sebelum Backend dan Frontend?

Karena DB adalah **foundational layer** yang tidak bergantung pada apapun dari Epic 2:
- Backend (`BE-01` s/d `BE-03`) butuh tabel ini untuk query
- Frontend (`FE-01`) fetch langsung dari tabel ini via Supabase server client
- Kalau DB dikerjakan belakangan, kamu tidak bisa end-to-end test apapun — semua data akan kosong/error

Kerjakan keduanya dalam **satu sesi** — setelah `DB-01` apply migration, langsung lanjut `DB-02` seed tanpa istirahat. Migration dan seed adalah dua file terpisah, tapi saling terkait.

### Urutan:

| # | Task ID | Apa yang dikerjakan | Dependensi |
|---|---------|--------------------|----|
| 6 | `E2-S1-DB-01` | `npx supabase migration new company_settings` → tulis DDL → `npx supabase db push` → verifikasi tabel + RLS di Supabase dashboard | Epic 1: `supabase/migrations/` sudah ada, Supabase CLI ter-link |
| 7 | `E2-S1-DB-02` | `npx supabase migration new seed_company_settings` → tulis 9 INSERT rows → `npx supabase db push` → verifikasi semua 9 rows ada di Table Editor | DB-01 (tabel harus sudah ada sebelum INSERT) |

> **Test RLS wajib setelah DB-02:** Lakukan anonymous REST request → `SELECT` harus return data, `INSERT` harus return 401. Jangan lanjut ke FASE 2 sebelum ini terverifikasi.

---

## FASE 2 — Backend + API Contract

> **Tujuan:** Pydantic schemas terdefinisi, TypeScript types ter-sync, endpoint `GET /api/v1/settings/` berjalan dan terproteksi auth.
> **Estimasi:** 45 menit–1 jam

### Kenapa CONT-01 dikerjakan di antara BE-01 dan BE-02 (bukan setelah BE-03)?

Ini adalah **keputusan terpenting** di FASE ini. Urutan dokumen menyebut: `3b → 3c`. Tapi urutan yang benar adalah: `BE-01 → CONT-01 → BE-02 → BE-03`.

**Alasan:** `CONT-01` adalah mirror TypeScript dari Pydantic schemas di `BE-01`. Kalau kamu tulis `BE-01`, lanjut `BE-02`, lanjut `BE-03`, baru kemudian `CONT-01` — kamu **harus membuka kembali** file `schemas/settings.py` dan membacanya ulang untuk menulis `types/api.ts`. Buang waktu dan risiko typo naik.

Kerjakan `CONT-01` **tepat setelah** `BE-01`, saat schema Pydantic masih ada di layar dan di memori kerjamu. Ini adalah pola "API contract langsung di tempat lahirnya" — sama persis dengan yang dilakukan di E1-FASE-5 (ENG-40 langsung setelah SPIKE-09).

Selain itu: FE-01 dan FE-03 mengimport `CompanySettingsMap` dari `types/api.ts`. Kalau CONT-01 belum selesai saat kamu mulai coding frontend, TypeScript akan throw error import.

### Urutan:

| # | Task ID | Apa yang dikerjakan | Dependensi |
|---|---------|--------------------|----|
| 8 | `E2-S1-BE-01` | Buat `backend/schemas/settings.py` — 4 Pydantic classes: `CompanySettingItem`, `CompanySettingsResponse`, `CompanySettingUpdate`, `CompanySettingsBulkUpdate` + expose di `schemas/__init__.py` | Epic 1: `backend/schemas/__init__.py` sudah ada |
| 9 | `E2-S1-CONT-01` | **Langsung** buka `types/api.ts` → tambah section `// === Epic 2: Company Settings ===` → tulis 4 TypeScript interfaces yang mirror BE-01 1:1 → update `ARCHITECTURE.md §16.1` | BE-01 (tulis TS types selagi Pydantic schema masih terbuka) |
| 10 | `E2-S1-BE-02` | Buat `backend/routers/settings.py` — `GET /settings/` endpoint (AUTH-protected) yang query `company_settings` dan return `CompanySettingsResponse` | BE-01 (schemas diimport oleh router ini), DB-01 (tabel harus sudah ada) |
| 11 | `E2-S1-BE-03` | Edit `backend/main.py` → import settings router → `app.include_router(settings_router, prefix="/api/v1")` → test di Swagger: endpoint muncul, hit tanpa token → 401 | BE-02 (tidak bisa daftarkan router yang belum ada) |

> **⚠️ Catatan arsitektur penting:** Endpoint `GET /api/v1/settings/` adalah **[AUTH]** — hanya untuk admin panel di Slice 3. Halaman Beranda (publik) **TIDAK** memanggil FastAPI ini. Beranda fetch langsung dari Supabase via `createClient()` di Server Component (Pattern §6.6 ARCHITECTURE.md). Jangan bingungkan dua jalur fetch ini.

---

## FASE 3 — Animation Utilities

> **Tujuan:** `useScrollReveal`, `RevealWrapper`, dan `AnimatedCounter` siap dipakai oleh semua section components.
> **Estimasi:** 45 menit–1 jam

### Kenapa Animation Utilities dikerjakan sebelum section Frontend?

Hampir semua 7 section Beranda membungkus kontennya dalam `<RevealWrapper>`. Kalau kamu mulai coding `HeroSection.tsx` atau `StatsBar.tsx` sebelum `RevealWrapper` ada, kamu akan menulis kode yang tidak bisa diimport → TypeScript error → kamu terpaksa skip animasi dulu, lalu balik pasang → double work.

`AnimatedCounter` adalah blocker untuk `StatsBar.tsx` (FE-03). Selesaikan ketiga animation utilities dalam **satu sesi** sebelum menyentuh satu pun section component.

### Urutan:

| # | Task ID | Apa yang dikerjakan | Dependensi |
|---|---------|--------------------|----|
| 12 | `E2-S1-ANIM-01` | Buat `hooks/use-scroll-reveal.ts` — custom IntersectionObserver hook, opsi `threshold`, `rootMargin`, `once`, return `ref` | Epic 1: `hooks/` folder ada (tapi kosong) |
| 13 | `E2-S1-ANIM-02` | Buat `components/animations/RevealWrapper.tsx` — `'use client'` wrapper yang pakai `useScrollReveal`, props: `variant`, `delay`, `as`, `className` | ANIM-01 (mengimport `useScrollReveal`) |
| 14 | `E2-S1-ANIM-03` | Buat `components/animations/AnimatedCounter.tsx` — `'use client'`, IntersectionObserver + `requestAnimationFrame` + easeOutCubic, props: `target`, `suffix`, `staggerDelay`, format `id-ID` | Independen dari ANIM-01/02 — bisa dikerjakan segera setelah ANIM-01 selesai |

> **Verifikasi cepat setelah FASE 3:** Buat file test sementara, render `<RevealWrapper><p>Test</p></RevealWrapper>` dan `<AnimatedCounter target={42} suffix="+" />` → scroll ke viewport → verifikasi animasi berjalan. Hapus file test setelah verifikasi.

---

## FASE 4 — Page Shell Setup

> **Tujuan:** `app/(public)/page.tsx` punya struktur yang benar, metadata SEO terisi, `loading.tsx` ada, data fetch dari Supabase berjalan.
> **Estimasi:** 30 menit

### Kenapa FE-01 dikerjakan sebelum section components?

`page.tsx` adalah **container** untuk semua 7 section. Di `page.tsx` terjadi:
1. `export const metadata` — butuh output UX-05
2. `async function getCompanySettings()` — fetch dari Supabase, return `CompanySettingsMap`
3. `export default async function BerandaPage()` — memanggil semua section components dengan `settings` prop

Kalau kamu coding `StatsBar.tsx` dulu sebelum `page.tsx`, kamu tidak tahu bentuk exact prop yang akan diterima `StatsBar`. Kalau kamu coding `page.tsx` dulu, prop contract-nya sudah jelas saat coding setiap section.

**FE-01 harus dikerjakan SETELAH:**
- ✅ `UX-05` selesai (nilai metadata siap untuk di-copy)
- ✅ `CONT-01` selesai (`CompanySettingsMap` type sudah bisa diimport)
- ✅ `DB-01` + `DB-02` selesai (tabel dan data ada, fetch tidak akan error)

### Urutan:

| # | Task ID | Apa yang dikerjakan | Dependensi |
|---|---------|--------------------|----|
| 15 | `E2-S1-FE-01` | Update `app/(public)/page.tsx`: tambah `export const revalidate = 3600`, `export const metadata` dari UX-05, fungsi `getCompanySettings()` yang fetch dari Supabase, dan skeleton struktur JSX untuk 7 section. Buat/update `app/(public)/loading.tsx` dengan skeleton Hero + Stats + Products | UX-05, CONT-01, DB-01+DB-02 |

> **Catatan:** Saat ini `page.tsx` akan throw error karena section components belum ada. Ini normal — import akan diselesaikan di FASE 5. Untuk sementara, comment-out import yang belum ada dan return markup minimal agar dev server tidak crash.

---

## FASE 5 — Section Components (Urutan Top-to-Bottom)

> **Tujuan:** Ketujuh section Beranda dibangun, masing-masing independent, dan siap dirakit.
> **Estimasi:** 3–5 jam

### Strategi: Bangun section sesuai urutan tampil di halaman (top → bottom)

Alasan: Saat kamu coding dan testing di localhost, scrolling ke bawah sambil build adalah workflow yang natural. Section yang sudah selesai bisa langsung dilihat efeknya saat dev server berjalan. Selain itu:
- **Hero** (FE-02) adalah section paling kritis — first impression — selesaikan dulu sebelum yang lain
- **StatsBar** (FE-03) harus menyusul langsung karena menggunakan `AnimatedCounter` + `settings` prop — paling kompleks setelah Hero
- **Sections tengah** (FE-04 s/d FE-07) lebih straightforward — kerjakan berurutan
- **CTASection** (FE-08) adalah penutup — dikerjakan paling akhir dari section group

### Pre-flight check sebelum mulai coding section:

Sebelum FE-02, **cek `globals.css`** untuk dua class penting:
- `cta-hero-pulse` → animasi pulse untuk CTA button di Hero. Jika belum ada, tambahkan sesuai spec di task FE-02
- `bg-brand-animated` → animated gradient untuk CTA Section (FE-08). Jika belum ada, tambahkan sesuai Design System §21.1

Cek ini harus dilakukan **sekali di awal** agar tidak di-interrupt saat coding section.

### Urutan:

| # | Task ID | Apa yang dikerjakan | Dependensi |
|---|---------|--------------------|----|
| 16 | `E2-S1-FE-02` | Buat `components/sections/HeroSection.tsx` — Server Component, headline `<h1>`, sub-headline, 2 CTA buttons (primary + outline), background sesuai keputusan UX-01, animasi mount dengan `.page-transition` CSS class (bukan IntersectionObserver karena above-the-fold) | UX-01 (keputusan background), Epic 1: shadcn `<Button>` sudah installed |
| 17 | `E2-S1-FE-03` | Buat `components/sections/StatsBar.tsx` — **harus `'use client'`** karena mengandung `AnimatedCounter`. Props: `settings: CompanySettingsMap`. Render 4 stat cards — 2 statis (hardcoded) + 2 dinamis (dari `settings`). Stagger delay 0/150/300/450ms | ANIM-03 (AnimatedCounter), CONT-01 (CompanySettingsMap type), UX-02 |
| 18 | `E2-S1-FE-04` | Buat `components/sections/ProductsPreview.tsx` — Server Component, data produk STATIC (PRODUCTS_PREVIEW array), 5 card dengan foto/placeholder + nama + badge SNI. Link tiap card ke `/produk/{slug}`. Bungkus dengan `<RevealWrapper>`. **Wajib tambahkan komentar** `// TODO(Epic 3): Replace static PRODUCTS_PREVIEW with data from GET /api/v1/products` | ANIM-02 (RevealWrapper), UX-03 |
| 19 | `E2-S1-FE-05` | Buat `components/sections/HowItWorks.tsx` — Server Component, 4 langkah statis dari STEPS array, Lucide icons (Phone/MessageSquare/Package/Truck), connector dashed di desktop, vertical di mobile. Stagger reveal per step | ANIM-02 (RevealWrapper), UX-03 |
| 20 | `E2-S1-FE-06` | Buat `components/sections/IndustriesGrid.tsx` — Server Component, 6 sektor dari INDUSTRIES array, Lucide icons, `grid-cols-2 sm:grid-cols-3`, hover state `hover:bg-teal-50`. **Section title `<h2>` wajib** (heading hierarchy) | ANIM-02 (RevealWrapper), UX-03 |
| 21 | `E2-S1-FE-07` | Buat `components/sections/CredibilitySection.tsx` — Server Component. Props: `settings: CompanySettingsMap`. Parse `client_list` dari comma-separated string. Badge SNI (`BadgeCheck` Lucide) + Badge NIB (hardcode `0280010102479`). `bg-neutral-50` atau `bg-teal-50/30` | ANIM-02 (RevealWrapper), CONT-01 (CompanySettingsMap type), UX-04 |
| 22 | `E2-S1-FE-08` | Buat `components/sections/CTASection.tsx` — Server Component. Heading "Siap Jadi Mitra Distribusi?" sebagai `<h2>`, dark background (`bg-brand-animated` dari globals.css), 2 tombol (primary white + outline white), bungkus dengan `<RevealWrapper variant="reveal-scale">` | ANIM-02 (RevealWrapper), UX-04 |

> **⚠️ Catatan heading hierarchy yang SERING SALAH:** Hanya `HeroSection.tsx` yang boleh punya `<h1>`. SEMUA section lain (Stats, Products, HowItWorks, Industries, Credibility, CTA) menggunakan `<h2>` untuk section title mereka. Ini adalah aturan SEO dan aksesibilitas — 1 halaman = 1 `<h1>`.

---

## FASE 6 — Assembly, Sitemap, Robots, Image Optimization

> **Tujuan:** Semua 7 section dirakit ke `page.tsx`, `sitemap.ts` dan `robots.ts` dikonfigurasi, image optimization diverifikasi.
> **Estimasi:** 30–45 menit

### Kenapa assembly dikerjakan setelah semua section selesai?

Bisa saja kamu menambahkan import section satu per satu ke `page.tsx` di FASE 5. Itu valid. Tapi assembly final (`FE-09`) juga mencakup:
- Verifikasi urutan section yang benar (Hero → Stats → Products → HowItWorks → Industries → Credibility → CTA)
- Cek semua `<Image>` pakai Next.js `<Image>` bukan raw `<img>`
- `sitemap.ts` — butuh semua URL final diketahui (setelah semua section selesai, URL yang di-link sudah final)
- `robots.ts` — cek apakah sudah ada dari Epic 1 atau perlu dibuat
- `npm run build` — build test. Tidak bisa dilakukan sebelum semua component selesai

### Urutan:

| # | Task ID | Apa yang dikerjakan | Dependensi |
|---|---------|--------------------|----|
| 23 | `E2-S1-FE-09` | Update `app/(public)/page.tsx`: import + susun 7 sections, verifikasi alur data `settings` prop. Buat/update `app/sitemap.ts` (Beranda `priority: 1.0`). Verifikasi `app/robots.ts` (sudah ada dari Epic 1). Replace semua `<img>` raw dengan Next.js `<Image>`. Jalankan `npm run build` — harus 0 error | FE-01 s/d FE-08 (semua section harus ada sebelum bisa di-import) |

---

## FASE 7 — QA (Di Staging)

> **Tujuan:** Verifikasi semua acceptance criteria terpenuhi di environment staging sebelum Slice 1 dinyatakan selesai.
> **Estimasi:** 1.5–2.5 jam

### Semua QA harus dilakukan di staging URL, bukan localhost

Sama seperti E1 — QA di localhost tidak valid untuk verifikasi SEO metadata, sitemap.xml, robots.txt, Lighthouse score, dan RLS behavior. Pastikan Vercel preview deployment sudah berjalan dengan `company_settings` data yang benar di Supabase staging/production.

### Urutan:

| # | Task ID | Apa yang ditest |
|---|---------|----------------|
| 24 | `E2-S1-QA-01` | Visual review 4 breakpoints: 375px, 768px, 1280px, 1440px — cek overflow horizontal, responsive layout setiap section, screenshot per breakpoint |
| 25 | `E2-S1-QA-02` | Content accuracy: headline tepat "Distributor" (bukan "Produsen"), Stats Bar "Mitra Aktif" = nilai DB, 5 produk benar, NIB `0280010102479` benar, CTA href benar |
| 26 | `E2-S1-QA-03` | Lighthouse audit desktop: Performance ≥85, Accessibility ≥90, SEO ≥90, Best Practices ≥90. Lighthouse mobile: Performance ≥70. LCP `<2.5s` — jika tidak, cek hero image `priority` prop |
| 27 | `E2-S1-QA-04` | Aksesibilitas: 1 `<h1>` di halaman, keyboard navigation (Tab key), AnimatedCounter `aria-hidden="true"`, contrast ratio ≥4.5:1 di teks atas background gelap, Reduced Motion mode |
| 28 | `E2-S1-QA-05` | SEO: source HTML → cek `<title>` dan `<meta description>`, `og:image` accessible, `{url}/sitemap.xml` ada `/` dengan priority 1.0, `{url}/robots.txt` ada dan benar |
| 29 | `E2-S1-QA-06` | **DoD Final Checklist** — semua 20+ item di Slice 1 Definition of Done ✅ sebelum Slice 2 dimulai |

---

## 🚨 Tabel Dependensi Kritis (Yang Paling Sering Salah)

| Jika kamu mengerjakan ini... | Kamu HARUS sudah selesai... | Kalau tidak... |
|---|---|---|
| `DB-02` (Seed data) | `DB-01` (Tabel ada) | INSERT akan gagal: tabel belum ada |
| `BE-02` (Router GET /settings) | `BE-01` (Pydantic schemas) | Import `CompanySettingsResponse` tidak ada → FastAPI error |
| `CONT-01` (TypeScript types) | `BE-01` (Pydantic schemas) | Tidak tahu field apa yang harus dimasukkan ke TS interfaces |
| `FE-01` (page.tsx + metadata) | `UX-05` + `CONT-01` + `DB-01` | Metadata kosong (UX-05); `CompanySettingsMap` import error (CONT-01); fetch gagal saat test (DB-01) |
| `ANIM-02` (RevealWrapper) | `ANIM-01` (useScrollReveal hook) | Import `useScrollReveal` tidak ada → TypeScript error |
| `FE-02` s/d `FE-08` (section components) | `ANIM-02` (RevealWrapper) | Semua section import `<RevealWrapper>` → error semua |
| `FE-03` (StatsBar) | `ANIM-03` (AnimatedCounter) | StatsBar mengimport `AnimatedCounter` → TypeScript error |
| `FE-03` (StatsBar) | `CONT-01` (CompanySettingsMap) | Props type `settings: CompanySettingsMap` tidak dikenal |
| `FE-07` (CredibilitySection) | `CONT-01` (CompanySettingsMap) | Sama seperti FE-03 |
| `FE-09` (Assembly) | FE-01 s/d FE-08 (semua sections) | Import akan missing → `npm run build` error |
| Semua QA tasks | FE-09 + staging deployed | QA harus di staging, tidak valid di localhost |

---

## 📊 Master Checklist — 29 Task Berurutan

```
FASE 0 — Pre-Code UX (semua desain Beranda, tidak ada kode)
 [ ] 01. E2-S1-UX-01   Wireframe + spec Hero Section (putuskan background)
 [ ] 02. E2-S1-UX-02   Wireframe + spec Stats Bar (warna bg, layout grid)
 [ ] 03. E2-S1-UX-03   Wireframe Products Grid + Cara Kerja + Industries
 [ ] 04. E2-S1-UX-04   Wireframe Credibility Section + CTA Penutup
 [ ] 05. E2-S1-UX-05   Tabel SEO metadata final (title, desc, og:image, canonical)
     ↓ Baca E2-S1-US-01 s/d US-05 sebagai referensi AC (tidak dikerjakan terpisah)

FASE 1 — Database Foundation
 [ ] 06. E2-S1-DB-01   Migration: CREATE TABLE company_settings + RLS
 [ ] 07. E2-S1-DB-02   Seed: 9 rows INSERT company_settings
     → Test RLS: anonymous SELECT ✅  anonymous INSERT ❌ (401) sebelum lanjut

FASE 2 — Backend + API Contract
 [ ] 08. E2-S1-BE-01   Pydantic schemas: CompanySettingItem, CompanySettingsResponse, dll.
 [ ] 09. E2-S1-CONT-01 TypeScript interfaces di types/api.ts + update ARCHITECTURE.md §16.1
 [ ] 10. E2-S1-BE-02   Router: GET /api/v1/settings/ (AUTH-protected)
 [ ] 11. E2-S1-BE-03   Register settings router di main.py + test Swagger + test 401

FASE 3 — Animation Utilities
 [ ] 12. E2-S1-ANIM-01 Hook: hooks/use-scroll-reveal.ts
 [ ] 13. E2-S1-ANIM-02 Component: components/animations/RevealWrapper.tsx
 [ ] 14. E2-S1-ANIM-03 Component: components/animations/AnimatedCounter.tsx
     → Quick test: render kedua komponen → verifikasi animasi berjalan

FASE 4 — Page Shell
 [ ] 15. E2-S1-FE-01   Setup app/(public)/page.tsx (metadata + data fetch + JSX shell) + loading.tsx

FASE 5 — Section Components
     ↓ Pre-flight: cek globals.css untuk cta-hero-pulse + bg-brand-animated
 [ ] 16. E2-S1-FE-02   HeroSection.tsx (h1 utama, CTA buttons, background)
 [ ] 17. E2-S1-FE-03   StatsBar.tsx ('use client', AnimatedCounter, settings prop)
 [ ] 18. E2-S1-FE-04   ProductsPreview.tsx (static data + TODO(Epic 3) comment)
 [ ] 19. E2-S1-FE-05   HowItWorks.tsx (4 steps, connector desktop)
 [ ] 20. E2-S1-FE-06   IndustriesGrid.tsx (6 sektor, h2 heading)
 [ ] 21. E2-S1-FE-07   CredibilitySection.tsx (client_list parse, badge SNI + NIB)
 [ ] 22. E2-S1-FE-08   CTASection.tsx (h2, dark bg, 2 CTA buttons)

FASE 6 — Assembly + SEO
 [ ] 23. E2-S1-FE-09   Assembly 7 sections + sitemap.ts + robots.ts + Image check + npm run build

FASE 7 — QA (Staging)
 [ ] 24. E2-S1-QA-01   Visual review 4 breakpoints
 [ ] 25. E2-S1-QA-02   Content accuracy check
 [ ] 26. E2-S1-QA-03   Lighthouse audit (Performance ≥85, A11y ≥90, SEO ≥90)
 [ ] 27. E2-S1-QA-04   Manual accessibility test
 [ ] 28. E2-S1-QA-05   SEO verification (sitemap, robots, meta tags)
 [ ] 29. E2-S1-QA-06   DoD Final Checklist ← SLICE 1 DONE ✅
```

---

## ❓ FAQ untuk Solo Developer

**Q: Kenapa semua UX tasks (UX-01 s/d UX-05) dikerjakan sekaligus di awal, beda dengan E1 yang interleaved?**
A: Di E1, wireframe dikerjakan tepat sebelum komponen terkait karena setiap komponen (Navbar, Footer, 404, Admin) berdiri sendiri. Di Beranda, ke-7 section adalah **satu halaman terpadu** — keputusan background di UX-01 (Hero) langsung mempengaruhi keputusan background di UX-02 (Stats Bar harus kontras). Jika dilakukan interleaved, kamu bisa membuat Stats Bar dengan warna yang clash dengan Hero karena belum lihat gambaran keseluruhan.

**Q: Bolehkah FASE 2 (Backend) dan FASE 3 (Animation Utilities) dibalik urutannya?**
A: Ya, boleh — keduanya tidak saling bergantung. Tapi pertimbangkan: FASE 2 butuh database yang sudah aktif (dari FASE 1) untuk test endpoint, sedangkan FASE 3 sepenuhnya frontend dan bisa dikerjakan kapan saja setelah Epic 1. Jika kamu ingin waktu "backend istirahat" (sambil tunggu Supabase push), kerjakan ANIM-01/02/03 di sela itu.

**Q: Kenapa tidak langsung kerjakan semua dalam urutan layer: semua Layer 1 → semua Layer 2 → semua Layer 3a → dst?**
A: Urutan layer-by-layer akan membuat dua masalah: (1) `CONT-01` dikerjakan jauh setelah `BE-01` → harus buka file schema lagi dari awal, risiko typo. (2) `FE-01` dikerjakan setelah semua Layer 3 selesai → kamu menunggu selesai `ANIM-01/02/03` dulu padahal `FE-01` tidak butuh animasi — hanya butuh `CONT-01` dan `UX-05`.

**Q: Haruskah `FE-01` (page.tsx setup) selesai 100% sebelum mulai FE-02?**
A: Tidak harus. Tapi minimal: `export const metadata` sudah terisi (dari UX-05), dan `async function getCompanySettings()` sudah ada. Section imports bisa di-comment dulu, lalu uncomment satu per satu saat section-nya selesai di FASE 5.

**Q: Bolehkah section-section di FASE 5 dikerjakan bukan dalam urutan halaman (misalnya CTA dulu)?**
A: Secara teknis boleh — section-section tidak saling bergantung satu sama lain (kecuali semua butuh ANIM-02). Tapi urutan top-to-bottom (FE-02 → FE-03 → ... → FE-08) sangat disarankan karena: kamu test di browser sambil scroll dari atas ke bawah, dan Hero + Stats adalah yang paling kritikal secara bisnis — lebih baik diselesaikan dulu.

**Q: `FE-03` (StatsBar) harus `'use client'` karena AnimatedCounter. Apakah ini berpengaruh pada performa?**
A: Tidak signifikan. `StatsBar` adalah satu-satunya section yang `'use client'` — semua section lain tetap Server Components. Data fetch (`company_settings`) dilakukan di `page.tsx` (Server Component) dan di-pass sebagai prop ke `StatsBar`. Ini sudah sesuai pattern ARCHITECTURE.md §5.

---

## 🔁 Visualisasi Alur Data di Halaman Beranda

```
Supabase (company_settings)
  ↓ fetch via createClient() [server-side]
  ↓
app/(public)/page.tsx (Server Component)
  ├── getCompanySettings() → CompanySettingsMap
  ├── <HeroSection />           (Server, no props)
  ├── <StatsBar settings={...} /> (CLIENT — AnimatedCounter)
  ├── <ProductsPreview />       (Server, static data)
  ├── <HowItWorks />            (Server, static data)
  ├── <IndustriesGrid />        (Server, static data)
  ├── <CredibilitySection settings={...} /> (Server)
  └── <CTASection />            (Server, no props)

FastAPI GET /api/v1/settings/ → hanya untuk Admin Panel (Slice 3)
                                  TIDAK digunakan oleh halaman publik ini
```

---

*Dibuat berdasarkan analisis dependensi Epic 2 Task Breakdown Slice 1 · CV Reka Cipta Indonesia*
*Mengikuti pola E1_Task_Ordering_Guide.md · Juni 2026*
*Slice berikutnya: `E2_S2_Task_Ordering_Guide.md` (setelah epic2_task_breakdown_slice2_tentang-kami.md tersedia)*
