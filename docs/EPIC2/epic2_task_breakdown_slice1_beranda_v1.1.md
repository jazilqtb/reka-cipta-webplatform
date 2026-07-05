# Epic 2 — Profil Perusahaan: SLICE 1 — Halaman Beranda (`/`)
## CV Reka Cipta Indonesia · Web Platform & CRM System

> **Versi:** 1.1 *(direvisi berdasarkan Wireframe Resmi v1.0)* &emsp;
> **Metode:** MDD + Vertical Slicing &emsp;
> **Status:** Aktif · Juni 2026

---

## Changelog v1.0 → v1.1

Dokumen ini merupakan revisi dari `epic2_task_breakdown_slice1_beranda.md` v1.0. Semua perubahan berdasarkan `Epic2_slice1_beranda_wireframe.md` yang ditetapkan sebagai **SOURCE OF TRUTH**.

| # | Area | Perubahan | Task Terdampak |
|---|---|---|---|
| 1 | **Hero Section** | Layout berubah ke centered. Tambah badge SNI. Headline/sub-headline baru (teks final). Background menjadi carousel crossfade. Animasi berubah ke Framer Motion `fadeInUp` stagger. | UX-01, FE-02 |
| 2 | **Stats Bar** | Berubah total menjadi 2-slide carousel. Slide 1: stats baru (stat ke-4 `Tahun Berdiri` → `Jumlah Distribusi TON`, nilai aktual dari Fondasi Brand). Slide 2: Interactive SVG Distribution Map Jawa Timur/Tengah. | UX-02, FE-03 |
| 3 | **Stats — Nilai** | `partner_count: 50 → 6`, `cities_served: 15 → 9`, tambah key baru `total_distribution_tons: 353` | DB-02 |
| 4 | **ProductsPreview** | Mobile berubah dari grid 2-col → horizontal snap scroll. Card tambah field `spec` (NaCl%, kode). CTA per card berubah dari outlined button → text link "Lihat Detail →". | UX-03, FE-04 |
| 5 | **HowItWorks** | Desain berubah total dari card 4-kolom → **scroll-driven sticky section** (100vh bg image, panel geser dari kiri/bawah). Animasi pakai Framer Motion `useScroll` + `useTransform`. | UX-03, FE-05 |
| 6 | **IndustriesGrid** | Ikon berubah dari Lucide React → **SVG line-art 48×48px** (stroke teal). Hover berubah ke `scale(1.05)`. Tambah klik navigasi placeholder. | FE-06 |
| 7 | **CredibilitySection** | Berubah total dari static chips → **Marquee infinite scroll** (CSS translateX). Item sekarang: nama klien + jenis industri. Pause on hover. Gradient overlay atas/bawah. | UX-04, FE-07 |
| 8 | **CTASection** | Background menjadi `bg-brand-teal-600` solid. CTA Primary: `bg-white text-brand-teal-600`. CTA Secondary: `border-white text-white`. | UX-04, FE-08 |
| 9 | **Framer Motion** | Dependency baru. Dibutuhkan untuk HeroSection stagger, HowItWorks scroll-driven, StatsBar map tooltip. | **LIB-01** *(task baru)* |
| 10 | **Constants** | Dua file constants baru untuk data marquee klien dan data peta distribusi. | **CONST-01, CONST-02** *(task baru)* |
| 11 | **InteractiveDistributionMap** | Sub-komponen baru: SVG peta stylized Jawa Timur/Tengah dengan tooltip kota. | **FE-10** *(task baru)* |

**Total task:** 34 (v1.0) → **39 (v1.1)** *(+5 task baru, ~12 task direvisi signifikan)*

---

## Tentang Dokumen Ini

Epic 2 diurai menjadi 3 Slice independen. Dokumen ini memuat **Slice 1** secara lengkap.

| Slice | Halaman | DB Baru | Admin CRM | File Dokumen |
|---|---|---|---|---|
| **Slice 1** ← *dokumen ini* | Halaman Beranda (`/`) | `company_settings` | — | `epic2_task_breakdown_slice1_beranda_v1.1.md` |
| Slice 2 | Halaman Tentang Kami (`/tentang-kami`) | Storage bucket `legal-docs` | — | `epic2_task_breakdown_slice2_tentang-kami.md` |
| Slice 3 | Halaman Kontak (`/kontak`) + Admin Pengaturan | — | `/admin/settings` | `epic2_task_breakdown_slice3_kontak.md` |

---

## Prasyarat: Output Epic 1 yang Dipakai di Slice Ini

| Output Epic 1 | File | Dipakai oleh |
|---|---|---|
| Global Navbar | `components/layout/Navbar.tsx` | `app/(public)/layout.tsx` |
| Global Footer | `components/layout/Footer.tsx` | `app/(public)/layout.tsx` |
| Public layout wrapper | `app/(public)/layout.tsx` | Semua halaman publik |
| Skeleton components | `components/ui/skeletons/` | Loading states Beranda |
| Tailwind brand tokens | `tailwind.config.ts` + `globals.css` | **FROZEN** — dipakai semua komponen baru |
| Supabase server client | `lib/supabase/server.ts` | Fetch `company_settings` di Server Component |
| Type-safe env access | `lib/env.ts` | Semua akses env vars di server context |
| Database migrations | `supabase/migrations/` (3 files) | Migration `company_settings` ditambahkan di sini |
| RLS pattern template | `supabase/migrations/..._base_rls_patterns.sql` | Pattern A (public READ, auth WRITE) untuk `company_settings` |

---

## Tujuan Slice 1

Menghadirkan Halaman Beranda sebagai *first impression* digital perusahaan yang lengkap, responsif, dan SEO-ready. Setelah slice ini selesai:

- Halaman Beranda tampil dengan 7 section sesuai wireframe resmi v1.0
- Tabel `company_settings` ada di database dengan data awal ter-seed (nilai aktual dari Fondasi Brand)
- Stats Bar: 4 angka dinamis dari DB + peta distribusi interaktif di Slide 2
- Animasi hero (Framer Motion stagger), scroll-driven HowItWorks, marquee kredibilitas berjalan
- Lighthouse score ≥ 85 Performance, ≥ 90 Accessibility, ≥ 90 SEO

**Demo ke klien setelah Slice 1 selesai:** Buka URL staging → Hero tampil dengan badge SNI + carousel foto. Scroll → stats count-up + slide ke peta distribusi Jawa Timur. Scroll lanjut → 5 product cards snap-scrollable di mobile. HowItWorks animasi scroll-driven. Marquee klien berjalan. CTA penutup background teal.

---

## Ringkasan Per Layer

| # | Layer | Tasks | Ket. |
|---|---|:---:|---|
| 1 | UX & Information Architecture | 5 | 3 task direvisi signifikan |
| 2 | User Stories | 5 | 2 task direvisi |
| 3a | Engineering · Database | 2 | DB-02 seed direvisi |
| 3b | Engineering · Backend | 3 | Tidak berubah |
| 3c | Engineering · API Contract | 1 | Tidak berubah |
| 3d | Engineering · Library (Framer Motion) | **1** | **BARU** |
| 3e | Engineering · Animation Utilities | 3 | Tidak berubah |
| 3f | Engineering · Static Data Constants | **2** | **BARU** |
| 3g | Engineering · Utility Libraries | 1 | Tidak berubah |
| 3h | Engineering · Frontend | **10** | 6 direvisi, 1 baru (FE-10) |
| 4 | QA & Observability | 6 | Minor updates |
| | **Total Slice 1** | **39** | |

---

## Layer 1 · UX & Information Architecture

Semua keputusan desain harus selesai sebelum menulis kode. Semua task UX **harus merujuk `Epic2_slice1_beranda_wireframe.md` v1.0 sebagai SOURCE OF TRUTH**.

---

#### `E2-S1-UX-01` — Wireframe & spesifikasi Hero Section ⚠️ *DIREVISI*
**Priority:** 🔴 HIGH &emsp; **Tags:** `Design` · `Frontend` · `Blocker`

**Perubahan dari v1.0:** Layout → centered. Tambah SNI badge. Headline/sub-headline baru (final). Background → carousel crossfade. Animasi → Framer Motion stagger.

**Layout & Konten (dari wireframe v1.0):**
- [ ] **Layout:** `flex-col items-center text-center`, container `max-w-7xl`, `min-h-screen`
- [ ] **Badge:** Pill-shape di atas headline — teks `"Tersertifikasi SNI"`, `bg-brand-teal-50 text-brand-teal-600 border border-brand-teal-200`, border-radius `rounded-full`, font-size `text-sm`, padding `px-3 py-1`
- [ ] **Headline (H1):** `"Mitra Distribusi Garam SNI Anda: Transparan, Cepat, dan Terverifikasi"` — weight `700`, ukuran `text-4xl md:text-5xl lg:text-6xl`, warna `ink-900` (di background terang) atau `white` (jika overlay gelap)
- [ ] **Sub-headline:** `"Kami menyediakan 5 pilihan garam bersertifikasi untuk kelancaran produksi industri Anda. Mulai dari dokumentasi uji laboratorium hingga legalitas perusahaan, semuanya terbuka untuk Anda. Dapatkan penawaran harga kurang dari 2 menit."` — weight `400`, warna `neutral-600`, `max-w-2xl mx-auto`
- [ ] **CTA Primary:** `"Minta Penawaran Sekarang"` → `/minta-penawaran` — `bg-brand-teal-600`, hover `bg-brand-teal-500`, class `cta-hero-pulse`
- [ ] **CTA Secondary:** `"Lihat Produk Kami"` → `/produk` — variant `outline`, `border-brand-teal-600 text-brand-teal-600`
- [ ] **Mobile:** CTA buttons `flex-col` gap `3`, font size dikurangi (`text-3xl md:text-4xl`)

**Background Carousel (Client Component):**
- [ ] **Mekanisme:** Image carousel crossfade (opacity transition + slight scale `scale(1.02)`) — **BUKAN** static image atau gradient
- [ ] **Gambar:** 3–5 foto produk/kegiatan perusahaan disimpan di `public/images/hero/` — minimal file `public/images/hero/hero-1.jpg`, `hero-2.jpg`, `hero-3.jpg` (siapkan placeholder jika foto belum ada)
- [ ] **Overlay:** `bg-gradient-to-t from-background/80 to-transparent` agar teks terbaca
- [ ] **Pagination dots:** di bawah konten — aktif: `bg-brand-teal-600 w-6 h-2 rounded-full`, non-aktif: `bg-neutral-300 w-2 h-2 rounded-full`, transisi `300ms`
- [ ] **Auto-play:** interval `5000ms`, pause saat hover di atas carousel atau saat dot diklik
- [ ] **Komponen split:** `HeroSection` (Server Component) membungkus `HeroCarousel` (Client Component) + `HeroContent` (Server Component static text). Server Component TIDAK bisa mengandung `useState`/`useEffect`.

**Animasi Masuk (Framer Motion):**
- [ ] Import `motion` dari `framer-motion` (diinstall di task `E2-S1-LIB-01`)
- [ ] Badge → Headline → Sub-headline → CTAs: `initial={{ opacity: 0, y: 20 }}` → `animate={{ opacity: 1, y: 0 }}`
- [ ] Easing: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (dari wireframe v1.0)
- [ ] Stagger: badge delay `0s`, headline `0.1s`, sub-headline `0.2s`, CTAs `0.35s`
- [ ] Trigger: `mount` (bukan viewport scroll) — karena above-the-fold

> **Output:** Background carousel approach terdokumentasi + placeholder foto tersedia + spesifikasi animasi tertulis

---

#### `E2-S1-UX-02` — Wireframe & spesifikasi Stats Bar ⚠️ *DIREVISI TOTAL*
**Priority:** 🔴 HIGH &emsp; **Tags:** `Design` · `Frontend`

**Perubahan dari v1.0:** Stats Bar adalah 2-slide carousel. Stat ke-4 berubah dari "Tahun Berdiri: 2020" → "Jumlah Distribusi: 353 TON". Slide 2 adalah interactive SVG distribution map (BARU).

**Slide 1 — Rekap Statistik:**

| # | Label | Nilai | Tipe | Key DB |
|---|---|---|---|---|
| 1 | Jenis Garam | `5` | Statis | — |
| 2 | Mitra Aktif | `6` | Dinamis (CRM) | `partner_count` |
| 3 | Kota Dilayani | `9` | Dinamis (CRM) | `cities_served` |
| 4 | Jumlah Distribusi (TON) | `353` | Dinamis (CRM) | `total_distribution_tons` |

*Catatan: nilai "(CRM)" berarti sumber data akhirnya adalah tabel CRM (dibangun Epic 4). Untuk Epic 2, nilai disimpan dan di-edit via `company_settings` di admin panel.*

- [ ] Layout slide: `grid-cols-4` desktop, `grid-cols-2` mobile (2×2)
- [ ] Setiap stat: angka besar (`text-5xl font-extrabold text-brand-teal-600` atau `text-white`) + label (`text-sm text-neutral-500`)
- [ ] **AnimatedCounter:** count-up saat masuk viewport, stagger 0/150/300/450ms — `once: true`
- [ ] Suffix: stat 2, 3, 4 → suffix `"+"` atau `" TON"`
- [ ] Background section: `bg-neutral-50` atau `bg-brand-teal-50` — kontras dengan Hero
- [ ] Stat 1 ("Jenis Garam") TIDAK pakai AnimatedCounter (statis, angka kecil 5 → tampilkan langsung)

**Slide 2 — Interactive Distribution Map:**
- [ ] **Visual:** SVG stylized map wilayah Jawa Timur & Jawa Tengah, latar `neutral-200`, titik distribusi aktif berwarna `brand-teal-600`
- [ ] **Dot markers:** setiap kota distribusi = lingkaran kecil (`r=6–8`) di koordinat SVG yang sesuai posisi geografis
- [ ] **Interaksi:** hover/klik dot → tooltip Framer Motion muncul (scale + fade): `[Nama Kota] • [X Ton Distribusi]`
- [ ] **Data:** 6–9 kota sesuai nilai `cities_served`. Data dari `constants/distribution-map.ts` (dibuat di `E2-S1-CONST-02`)
- [ ] **Label wilayah:** teks "Jawa Timur" dan "Jawa Tengah" pada SVG map
- [ ] **Tooltip:** `bg-ink-900 text-white rounded-lg px-3 py-2 text-sm`, `z-10`

**Navigasi Carousel:**
- [ ] Tombol panah kiri/kanan (`<` `>`) untuk pindah slide — ikon `ChevronLeft` / `ChevronRight` dari Lucide React
- [ ] Pagination dots di bawah (dua dots — aktif/non-aktif)
- [ ] Auto-slide interval `8000ms`, pause saat hover
- [ ] Komponen ini adalah **Client Component** karena ada state slide + auto-play interval

> **Output:** Spesifikasi 2 slide, data stats (nilai aktual), dan spesifikasi SVG map yang terdokumentasi

---

#### `E2-S1-UX-03` — Wireframe ProductsPreview, HowItWorks, dan IndustriesGrid ⚠️ *DIREVISI SIGNIFIKAN*
**Priority:** 🔴 HIGH &emsp; **Tags:** `Design` · `Frontend`

**Product Preview Grid (perubahan dari v1.0):**
- [ ] **Desktop:** `grid-cols-5`, gap `lg`
- [ ] **Mobile:** Horizontal snap scroll container — `overflow-x-auto scroll-smooth snap-x snap-mandatory` — setiap card `snap-start`, width `w-[75vw]` (3/4 viewport agar terlihat ada card berikutnya)
- [ ] **Setiap card (struktur baru):**
  - Foto: aspect ratio `4:3`, `object-cover`, `border-radius: sm`, `shadow-sm`
  - Nama produk: font-weight `600`, ukuran `lg`
  - Spesifikasi singkat: 1 baris, `text-sm text-neutral-500` — contoh: `"NaCl 98.3% • SPO/M"` (dari static data)
  - Tombol navigasi: teks `"Lihat Detail →"`, style `text-sm opacity-60 hover:opacity-100 hover:underline`, link ke `/produk/[slug]`
- [ ] **Card hover:** `transform: translateY(-4px)`, shadow meningkat — gunakan class `card-hover-lift` dari Design System §11.2
- [ ] **CTA bawah grid:** `"Lihat Semua Produk"` → `/produk`, variant `outline`

**HowItWorks — DESAIN BERUBAH TOTAL dari 4-kolom card → scroll-driven sticky:**
- [ ] **Konsep:** Saat user scroll melewati section ini, background image `fixed/sticky` 100vh tetap di tempat. Panel teks muncul dari kiri (desktop) atau bawah (mobile) menutupi 50% area.
- [ ] **Background image:** foto kegiatan perusahaan — full-width `100vh`, `object-cover`, posisi `sticky top-0` atau `fixed` dalam scroll container
- [ ] **Panel konten:** background `neutral-50` atau `brand-teal-50`, animasi masuk `slideIn` dari kiri (desktop) / bawah (mobile) dengan `ease-out`
  - Heading: `"Cara Kami Bekerja"`
  - Sub-teks: 1 paragraf singkat (transparan, terukur, responsif)
  - 4 poin proses dengan scroll-driven activation
- [ ] **4 poin proses:** Hubungi Kami → Konsultasi Kebutuhan → Pengiriman Sampel → Distribusi Rutin
- [ ] **Scroll-driven logic:** setiap scroll 25% dari tinggi section → aktifkan 1 poin
  - State aktif: heading membesar, warna `ink-900`, deskripsi muncul di bawah
  - State tidak aktif: opacity `40%`, font size normal
- [ ] **Progress line:** garis vertikal di kiri poin, panjang penuh. Segmen aktif: `brand-teal-600`, non-aktif: `neutral-200`
- [ ] **Teknis:** gunakan Framer Motion `useScroll` + `useTransform` (diinstall di `E2-S1-LIB-01`)

**IndustriesGrid (perubahan dari v1.0):**
- [ ] `grid-cols-3` (desktop), `grid-cols-2` (mobile), gap `lg`
- [ ] **Ikon:** SVG line-art ukuran `48×48px`, stroke `brand-teal-600` — **bukan** Lucide React icon (wireframe eksplisit menyebut SVG line-art)
- [ ] Ikon SVG disimpan di `public/icons/industries/` atau dirender sebagai inline SVG component
- [ ] **Hover:** `scale(1.05)`, background `neutral-50`, icon stroke fill subtle — `transition-all duration-200`
- [ ] **Klik:** navigasi ke `/industri/[slug]` (placeholder — halaman belum ada di Epic 2). Gunakan `href="/kontak"` sebagai fallback sambil catat `// TODO(Future Epic): Halaman detail industri`

---

#### `E2-S1-UX-04` — Wireframe Credibility Section dan CTA Penutup ⚠️ *DIREVISI*
**Priority:** 🟡 MED &emsp; **Tags:** `Design` · `Frontend`

**Credibility Section — berubah total dari static chips → Marquee:**
- [ ] **Mekanisme:** Infinite horizontal marquee — CSS `translateX(0%) → translateX(-50%)`, durasi `20s`, `linear`, `infinite`
- [ ] **Pause on hover:** `animation-play-state: paused` via `:hover` di CSS atau JS event listener
- [ ] **Item per klien (dalam 1 kotak):** nama perusahaan + jenis industri. Contoh: `"PT. Surabaya Mekabox" / "Industri Pengemasan"`
- [ ] **Styling kotak:** `bg-white` atau `bg-neutral-50`, border `none`, shadow hanya atas & samping (`shadow-sm`), bawah memudar via `linear-gradient` overlay, padding `px-6 py-4`, gap antar item `gap-8`
- [ ] **Seamless loop:** duplicate/clone item pertama ke akhir array untuk menghindari gap saat reset
- [ ] **Gradient fade overlay:** kiri dan kanan container memiliki gradient fade `from-white to-transparent` (`w-24`, absolute) untuk efek masuk/keluar yang mulus
- [ ] **Data:** dari `constants/clients.ts` (dibuat di `E2-S1-CONST-01`) — 5 klien dengan nama + jenis industri
- [ ] Background section: `bg-white` atau `bg-neutral-50`, padding vertikal `py-16`

**CTA Section Penutup (perubahan spesifik dari v1.0):**
- [ ] **Background:** `bg-brand-teal-600` solid (bukan `bg-brand-animated`) atau gradient `bg-gradient-to-br from-brand-teal-600 to-brand-teal-700`
- [ ] **Heading (H2):** `"Siap Jadi Mitra Distribusi?"` — warna `white`, `text-3xl md:text-4xl`, `font-bold`
- [ ] **CTA Primary:** `"Minta Penawaran"` → `/minta-penawaran` — `bg-white text-brand-teal-600 hover:bg-neutral-100`
- [ ] **CTA Secondary:** `"Hubungi Kami"` → `/kontak` — `border-white text-white hover:bg-white/10`
- [ ] **Mobile:** tombol `flex-col gap-3`. **Desktop:** `flex-row gap-4`
- [ ] Max-width konten: `max-w-xl mx-auto text-center`
- [ ] Animasi: `reveal-scale` saat masuk viewport

---

#### `E2-S1-UX-05` — SEO metadata dan Open Graph spec untuk Beranda
**Priority:** 🔴 HIGH &emsp; **Tags:** `SEO` · `Frontend`
*(Tidak berubah dari v1.0)*

- [ ] **`<title>`:** `CV Reka Cipta Indonesia — Distributor Garam SNI untuk Industri | Surabaya`
- [ ] **`<meta description>`:** "Distributor garam industri bersertifikasi SNI di Surabaya. Melayani sektor makanan, pengasinan, water treatment, dan pakan ternak. Minta penawaran sekarang." (≤160 karakter)
- [ ] **Open Graph:** `og:title`, `og:description`, `og:image` (`public/og-image.jpg`, 1200×630px), `og:type: website`, `og:url`
- [ ] **Twitter Card:** `twitter:card: summary_large_image`
- [ ] **Canonical URL:** URL production
- [ ] **`sitemap.ts`:** Beranda — priority `1.0`, changefreq `monthly`
- [ ] **`robots.ts`:** Beranda allow crawl (default), admin routes noindex dari Epic 1

> **Output:** Tabel metadata final siap diimplementasikan sebagai `export const metadata` di `app/(public)/page.tsx`

---

## Layer 2 · User Stories

---

#### `E2-S1-US-01` — Visitor melihat dan berinteraksi dengan Hero Section ⚠️ *DIREVISI*
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` · `UX`

*As a prospective industrial buyer, I want to immediately understand who RCI is and what they offer so that I can decide whether to explore further.*

**Acceptance Criteria:**
- [ ] Hero Section tampil penuh saat halaman pertama kali dimuat — tidak perlu scroll
- [ ] Badge "Tersertifikasi SNI" tampil di atas headline
- [ ] Headline `"Mitra Distribusi Garam SNI Anda..."` muncul dengan animasi Framer Motion `fadeInUp` pada load pertama
- [ ] Badge → Headline → Sub-headline → CTAs muncul berurutan dengan stagger delay
- [ ] Carousel foto berjalan otomatis setiap 5 detik — pause saat cursor di atas area hero
- [ ] Pagination dots menampilkan posisi slide saat ini, bisa diklik untuk pindah slide
- [ ] Klik CTA Primary → navigasi ke `/minta-penawaran`
- [ ] Klik CTA Secondary → navigasi ke `/produk`
- [ ] Di mobile (375px): teks terbaca (contrast ≥ 4.5:1), tombol tidak terpotong, layout centered

---

#### `E2-S1-US-02` — Visitor melihat angka kepercayaan dan peta distribusi ⚠️ *DIREVISI*
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` · `Database`

*As a visitor, I want to see RCI's scale and distribution coverage so that I can gauge their capability.*

**Acceptance Criteria:**
- [ ] Stats Bar tampil di bawah Hero dengan 2 slide yang dapat digeser
- [ ] **Slide 1:** 4 angka tampil dan count-up dari 0 saat pertama masuk viewport
  - "Jenis Garam: 5", "Mitra Aktif: {dari DB}", "Kota Dilayani: {dari DB}", "Distribusi TON: {dari DB}"
- [ ] Jika fetch DB gagal → Stats Bar tampil dengan fallback value (6, 9, 353) — tidak blank/error
- [ ] AnimatedCounter `once: true` — tidak berjalan ulang saat scroll kembali
- [ ] **Slide 2:** SVG peta tampil dengan dot-dot kota distribusi. Hover dot → tooltip nama kota + volume
- [ ] Navigasi antar slide via tombol panah dan pagination dots
- [ ] Auto-slide ke Slide 2 setelah 8 detik, lalu kembali ke Slide 1
- [ ] Di mobile: Slide 1 tampil dalam 2×2 grid. Slide 2 (peta) tetap terbaca di layar kecil.

---

#### `E2-S1-US-03` — Visitor melihat preview produk ⚠️ *DIREVISI*
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend`

*As a potential buyer, I want to see a preview of the salt products so that I know what RCI distributes.*

**Acceptance Criteria:**
- [ ] 5 product cards tampil dengan foto, nama, spesifikasi singkat (NaCl%, kode), dan badge SNI (jika berlaku)
- [ ] Di **desktop:** grid 5 kolom horizontal
- [ ] Di **mobile:** horizontal snap scroll — swipe untuk lihat semua 5 kartu
- [ ] Card hover: naik `translateY(-4px)` + shadow lebih dalam
- [ ] Klik "Lihat Detail →" pada card → navigasi ke `/produk/[slug]`
- [ ] Tombol "Lihat Semua Produk" di bawah grid → `/produk`

---

#### `E2-S1-US-04` — Visitor memahami cara kerja dan industri yang dilayani ⚠️ *DIREVISI*
**Priority:** 🟡 MED &emsp; **Tags:** `Frontend`

*As a buyer, I want to understand RCI's distribution process so that I know what to expect when ordering.*

**Acceptance Criteria:**
- [ ] Section HowItWorks tampil dengan background foto perusahaan yang "sticky"
- [ ] Saat scroll melewati section → panel teks muncul dari kiri (desktop) / bawah (mobile)
- [ ] 4 poin proses muncul satu per satu saat scroll 25% per poin
- [ ] Poin aktif: heading lebih besar, warna gelap, deskripsi tampil
- [ ] Progress line vertikal menampilkan progres saat ini (teal = aktif, abu = belum)
- [ ] Grid 6 industri tampil di bawahnya dengan ikon SVG line-art
- [ ] Hover pada kartu industri: sedikit membesar + background neutral

---

#### `E2-S1-US-05` — Visitor melihat bukti kredibilitas dan menemukan CTA penutup
**Priority:** 🟡 MED &emsp; **Tags:** `Frontend`
*(Tidak berubah dari v1.0)*

*As a skeptical buyer, I want to see proof of RCI's legitimacy so that I feel confident contacting them.*

**Acceptance Criteria:**
- [ ] Credibility Section menampilkan nama-nama klien aktif berjalan dalam marquee horizontal
- [ ] Marquee berhenti saat cursor di atasnya
- [ ] Setiap item menampilkan nama perusahaan + jenis industri
- [ ] CTA penutup "Siap Jadi Mitra Distribusi?" tampil dengan background teal solid
- [ ] Tombol "Minta Penawaran" (putih) → `/minta-penawaran`
- [ ] Tombol "Hubungi Kami" (outline putih) → `/kontak`

---

## Layer 3 · Engineering Sub-tasks

Kerjakan sesuai urutan fase di bagian **FASE PENGERJAAN** (lihat akhir dokumen). Urutan dependencies: Database → Backend → Library → Constants → Fondasi Page → Komponen.

---

### 3a — Database

#### `E2-S1-DB-01` — Migration: tabel `company_settings`
**Priority:** 🔴 HIGH &emsp; **Tags:** `Database` · `Blocker`
*(Tidak berubah dari v1.0 — lihat dokumen v1.0 untuk SQL lengkap)*

- [ ] Buat migration: `npx supabase migration new company_settings`
- [ ] Tulis DDL: tabel `company_settings` + RLS Pattern A (public READ, auth WRITE) + trigger `updated_at`
- [ ] Apply: `npx supabase db push`
- [ ] Verifikasi di dashboard: tabel ada, RLS aktif

---

#### `E2-S1-DB-02` — Seed: data awal `company_settings` ⚠️ *DIREVISI*
**Priority:** 🔴 HIGH &emsp; **Tags:** `Database`

**Perubahan dari v1.0:** Nilai `partner_count` dan `cities_served` diperbarui ke nilai aktual dari Fondasi Brand. Tambah key `total_distribution_tons`.

- [ ] Buat migration seed: `npx supabase migration new seed_company_settings`
- [ ] Tulis INSERT berikut:

```sql
INSERT INTO public.company_settings (key, value, label, description) VALUES
  ('whatsapp_1',              '082136096528',
   'Nomor WhatsApp 1',        'Nomor WA utama untuk tombol kontak di halaman Kontak'),
  ('whatsapp_2',              '087839031378',
   'Nomor WhatsApp 2',        'Nomor WA alternatif untuk tombol kontak di halaman Kontak'),
  ('email',                   'rekaciptaindonesiaa@gmail.com',
   'Email Kontak',            'Email yang tampil di halaman Kontak dan penerima notifikasi form'),
  ('address',                 'Jl. Bratang Gede III-I No. 16A, Ngagel Rejo, Wonokromo, Surabaya 60245',
   'Alamat Kantor',           'Alamat lengkap yang tampil di halaman Kontak'),
  ('gmaps_embed_url',         '',
   'URL Embed Google Maps',   'URL iframe embed peta. Kosongkan jika belum siap.'),
  ('wa_default_message',      'Halo, saya ingin mengetahui lebih lanjut tentang produk garam CV Reka Cipta Indonesia.',
   'Pesan Default WhatsApp',  'Pesan pre-fill saat tombol WA diklik'),
  ('partner_count',           '6',
   'Jumlah Mitra Aktif',      'Angka mitra aktif di Stats Bar Beranda. Sumber akhir: CRM (Epic 4).'),
  ('cities_served',           '9',
   'Jumlah Kota Dilayani',    'Angka kota distribusi di Stats Bar Beranda. Sumber akhir: CRM (Epic 4).'),
  ('total_distribution_tons', '353',
   'Total Distribusi (TON)',   'Total volume distribusi dalam ton. Ditampilkan di Stats Bar Slide 1. Sumber akhir: CRM (Epic 4).'),
  ('client_list',             'PT. Surabaya Mekabox,PT. Sejati Tritunggal Indah,PT. Cakrawala Cemerlang Box,Unit Pengolahan Garam KKP',
   'Daftar Klien',            'Nama klien dipisah koma. Untuk referensi admin — tampilan kredibilitas pakai constants/clients.ts')
ON CONFLICT (key) DO NOTHING;
```

- [ ] Apply: `npx supabase db push`
- [ ] Verifikasi: 10 rows ada dengan nilai yang benar (6, 9, 353 — bukan 50, 15)
- [ ] Update `README.md`: catatan bahwa nilai stats ini diupdate manual via `/admin/settings` sampai CRM Epic 4 selesai

> **Output:** File `supabase/migrations/{timestamp}_seed_company_settings.sql` ter-commit

---

### 3b — Backend (FastAPI)

#### `E2-S1-BE-01` — Pydantic schemas: `CompanySettingItem` dan `CompanySettingsResponse`
**Priority:** 🔴 HIGH &emsp; **Tags:** `Backend`
*(Tidak berubah dari v1.0 — lihat dokumen v1.0 untuk kode lengkap)*

- [ ] Buat `backend/schemas/settings.py` dengan class: `CompanySettingItem`, `CompanySettingsResponse`, `CompanySettingUpdate`, `CompanySettingsBulkUpdate`
- [ ] Expose di `backend/schemas/__init__.py`
- [ ] Verifikasi import tidak ada error

---

#### `E2-S1-BE-02` — Router: `GET /settings`
**Priority:** 🔴 HIGH &emsp; **Tags:** `Backend`
*(Tidak berubah dari v1.0 — lihat dokumen v1.0 untuk kode lengkap)*

- [ ] Buat `backend/routers/settings.py` dengan endpoint `GET /` [AUTH]
- [ ] Catatan: halaman publik fetch langsung dari Supabase — endpoint ini khusus admin panel (Slice 3)
- [ ] Verifikasi: server berjalan tanpa import error

---

#### `E2-S1-BE-03` — Register settings router di `main.py`
**Priority:** 🔴 HIGH &emsp; **Tags:** `Backend`
*(Tidak berubah dari v1.0)*

- [ ] Tambah `from routers.settings import router as settings_router` di `backend/main.py`
- [ ] `app.include_router(settings_router, prefix="/api/v1")`
- [ ] Test: `GET /api/v1/settings/` tanpa JWT → 401. Buka Swagger UI → endpoint muncul.

---

### 3c — API Contract

#### `E2-S1-CONT-01` — Update `types/api.ts` dengan CompanySetting types
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` · `Backend` · `Blocker`
*(Tidak berubah dari v1.0 — lihat dokumen v1.0 untuk kode lengkap)*

- [ ] Tambahkan `CompanySettingItem`, `CompanySettingsResponse`, `CompanySettingUpdate`, `CompanySettingsBulkUpdate`, `CompanySettingsMap` ke `types/api.ts`
- [ ] Update `ARCHITECTURE.md §16.1` dengan mapping Pydantic ↔ TypeScript

---

### 3d — Library Installation *(BARU)*

#### `E2-S1-LIB-01` — Install `framer-motion` *(TASK BARU)*
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` · `Blocker`

Framer Motion dibutuhkan oleh 3 komponen di Beranda: HeroSection (stagger), HowItWorks (scroll-driven), StatsBar InteractiveMap (tooltip). Dari wireframe v1.0: *"Gunakan Framer Motion untuk scroll-triggered, hover, dan carousel."*

- [ ] Cek apakah sudah terinstall: `cat package.json | grep framer-motion`
- [ ] Jika belum: `npm install framer-motion`
- [ ] Verifikasi versi: `framer-motion` >= `10.x` (untuk `useScroll` + `useTransform` hook yang dibutuhkan HowItWorks)
- [ ] Test import dasar: buat komponen test sementara yang render `<motion.div animate={{ opacity: 1 }}>test</motion.div>` → pastikan tidak ada TypeScript error
- [ ] Update `ARCHITECTURE.md §11.4` (Dependencies list): tambahkan baris `framer-motion | Animation library | HeroSection, HowItWorks, StatsBar`
- [ ] **Performance note:** Framer Motion menambah ~50KB ke bundle. Gunakan dynamic import untuk komponen berat:
  ```typescript
  // Untuk HowItWorks (scroll-driven, below-fold):
  const HowItWorks = dynamic(() => import('@/components/sections/HowItWorks'), { ssr: false })
  ```
  Komponen yang above-the-fold (HeroSection) tidak perlu dynamic import.

> **Output:** `framer-motion` terinstall, import berfungsi, bundle impact terdokumentasi

---

### 3e — Animation Utilities

*(Semua 3 tasks tidak berubah dari v1.0 — lihat dokumen v1.0 untuk implementasi lengkap)*

#### `E2-S1-ANIM-01` — Hook: `hooks/use-scroll-reveal.ts`
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` · `Animation`

- [ ] Buat `hooks/use-scroll-reveal.ts` dengan `useScrollReveal({ threshold, rootMargin, once })` menggunakan `IntersectionObserver`
- [ ] Catatan: Hook ini untuk CSS-based reveal (RevealWrapper). HowItWorks pakai Framer Motion `useScroll` terpisah.

---

#### `E2-S1-ANIM-02` — Component: `components/animations/RevealWrapper.tsx`
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` · `Animation`

- [ ] Buat `RevealWrapper` dengan prop `variant`, `delay`, `className`
- [ ] Mendukung variant: `reveal-up`, `reveal-scale`, `reveal-left`, `reveal-right`
- [ ] Wrap dengan `'use client'`, gunakan `useScrollReveal` hook

---

#### `E2-S1-ANIM-03` — Component: `components/animations/AnimatedCounter.tsx`
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` · `Animation`

- [ ] Buat `AnimatedCounter` dengan props `target`, `suffix`, `duration`, `staggerDelay`
- [ ] `requestAnimationFrame` + `easeOutCubic` easing
- [ ] IntersectionObserver trigger, `once: true`
- [ ] Format angka: `toLocaleString('id-ID')` (separator ribuan titik)

---

### 3f — Static Data Constants *(BARU)*

#### `E2-S1-CONST-01` — `constants/clients.ts` *(TASK BARU)*
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` · `Content`

Data klien untuk komponen marquee `CredibilitySection`. Terpisah dari `company_settings` karena marquee butuh struktur yang lebih kaya (nama + jenis industri).

- [ ] Buat `constants/clients.ts`:

```typescript
// constants/clients.ts
// Data klien aktif untuk marquee Credibility Section
// Sumber: Fondasi Brand v1.0 §5.2 dan company profile
// Update file ini ketika ada klien baru / perubahan industri

export interface ClientEntry {
  name: string          // Nama resmi perusahaan
  industry: string      // Jenis industri untuk tampilan marquee
  volumePerMonth?: string  // Opsional — volume referensi internal
}

export const ACTIVE_CLIENTS: ClientEntry[] = [
  { name: 'PT. Surabaya Mekabox',        industry: 'Industri Pengemasan',       volumePerMonth: '20 ton/bulan' },
  { name: 'PT. Sejati Tritunggal Indah', industry: 'Water Treatment',           volumePerMonth: '10 ton/bulan' },
  { name: 'PT. Cakrawala Cemerlang Box', industry: 'Industri Pengemasan',       volumePerMonth: '1.5 ton/bulan' },
  { name: 'Unit Pengolahan Garam KKP',   industry: 'Pengolahan Garam',          volumePerMonth: '30 ton/bulan' },
  { name: 'Perusahaan Pengolah Limbah',  industry: 'Water Treatment / Limbah',  volumePerMonth: '20 ton/bulan' },
]

// Untuk marquee seamless loop: array di-duplicate di komponen
// Contoh: [...ACTIVE_CLIENTS, ...ACTIVE_CLIENTS]
```

- [ ] Verifikasi: tidak ada TypeScript error
- [ ] Data sesuai dengan Fondasi Brand v1.0 §5.2 (partner list)

---

#### `E2-S1-CONST-02` — `constants/distribution-map.ts` *(TASK BARU)*
**Priority:** 🟡 MED &emsp; **Tags:** `Frontend` · `Content`

Data kota distribusi untuk SVG interactive map di Stats Bar Slide 2. Koordinat dalam SVG viewBox space (normalized, bukan lat/lng GPS).

- [ ] Buat `constants/distribution-map.ts`:

```typescript
// constants/distribution-map.ts
// Data titik distribusi untuk InteractiveDistributionMap (StatsBar Slide 2)
// cx/cy = koordinat dalam SVG viewBox "0 0 500 300" — normalized dari posisi geografis
// Jawa Timur kanan, Jawa Tengah kiri dalam viewBox ini

export interface DistributionCity {
  id: string
  name: string        // Nama kota untuk tooltip
  cx: number          // SVG x coordinate (0–500)
  cy: number          // SVG y coordinate (0–300)
  tons: number        // Volume distribusi dalam ton
  province: 'jawa-timur' | 'jawa-tengah'
}

export const DISTRIBUTION_CITIES: DistributionCity[] = [
  // Jawa Timur
  { id: 'surabaya',  name: 'Surabaya',  cx: 380, cy: 160, tons: 180, province: 'jawa-timur' },
  { id: 'sidoarjo',  name: 'Sidoarjo',  cx: 390, cy: 185, tons:  45, province: 'jawa-timur' },
  { id: 'malang',    name: 'Malang',    cx: 380, cy: 220, tons:  30, province: 'jawa-timur' },
  { id: 'gresik',    name: 'Gresik',    cx: 355, cy: 148, tons:  35, province: 'jawa-timur' },
  { id: 'mojokerto', name: 'Mojokerto', cx: 360, cy: 175, tons:  20, province: 'jawa-timur' },
  // Jawa Tengah
  { id: 'semarang',  name: 'Semarang',  cx: 200, cy: 120, tons:  18, province: 'jawa-tengah' },
  { id: 'solo',      name: 'Solo',      cx: 230, cy: 165, tons:  15, province: 'jawa-tengah' },
  { id: 'kudus',     name: 'Kudus',     cx: 220, cy: 95,  tons:  10, province: 'jawa-tengah' },
]

// Catatan implementasi:
// Koordinat ini APPROXIMATE untuk layout SVG stylized, bukan peta GPS presisi
// Jika peta resmi disediakan klien, update cx/cy sesuai SVG path yang diberikan
// Total kota: 8 → sesuai dengan cities_served: 9 (termasuk 1 kota minor tidak ditampilkan)
```

- [ ] Update koordinat jika diperoleh SVG path resmi dari klien
- [ ] Verifikasi total `tons` semua kota mendekati `total_distribution_tons: 353`

---

### 3g — Utility Libraries

#### `E2-S1-UTIL-01` — `lib/api.ts` (typed fetch wrapper — opsional di Slice 1)
**Priority:** 🟡 MED &emsp; **Tags:** `Frontend`
*(Tidak berubah dari v1.0 — referensi ARCHITECTURE.md §6.4)*

- [ ] Buat `lib/api.ts` dengan `apiFetch<T>(path, options)` yang mendukung `auth: boolean` dan `timeout: number`
- [ ] Catatan: Di Slice 1, `apiFetch` belum digunakan langsung. Dibuat sekarang karena di-setup sekali untuk Slice 3.

---

### 3h — Frontend

#### `E2-S1-FE-01` — Setup `app/(public)/page.tsx`, metadata, dan `loading.tsx`
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` · `Blocker`
*(Tidak berubah dari v1.0 — lihat dokumen v1.0 untuk kode lengkap)*

- [ ] `export const revalidate = 3600`
- [ ] `export const metadata: Metadata` sesuai `E2-S1-UX-05`
- [ ] Fetch `company_settings` dari Supabase server client + fallback
- [ ] `loading.tsx` dengan hero skeleton + stats skeleton + 5× CardSkeleton

---

#### `E2-S1-FE-02` — Component: `components/sections/HeroSection.tsx` ⚠️ *DIREVISI*
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` · `Animation`

**Perubahan dari v1.0:** Tambah SNI badge. Background menjadi carousel (HeroCarousel client component). Animasi berubah ke Framer Motion stagger. Layout centered.

**Komponen split (penting):**
```
HeroSection.tsx (Server Component — koordinator)
├── HeroContent (inline / sub-component, static text)
└── HeroCarousel.tsx (Client Component — carousel state + Framer Motion stagger)
```

- [ ] Buat `components/sections/HeroSection.tsx` (Server Component wrapper)
- [ ] Buat `components/sections/HeroCarousel.tsx` (`'use client'`):
  - State: `currentSlide`, `isPaused`
  - `useEffect` untuk auto-play interval `5000ms` — clear interval jika `isPaused`
  - `onMouseEnter` → `setIsPaused(true)`, `onMouseLeave` → `setIsPaused(false)`
  - Background images: `images/hero/hero-1.jpg`, `hero-2.jpg`, `hero-3.jpg` — crossfade via `opacity` transition
  - Pagination dots: klik dot → `setCurrentSlide(i)` + `setIsPaused(true)` (reset 3s)
  - **Framer Motion stagger untuk teks:**
    ```typescript
    const containerVariants = {
      hidden: {},
      visible: { transition: { staggerChildren: 0.1 } }
    }
    const itemVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }
    }
    ```
  - Urutan elemen: SNI badge → headline → sub-headline → CTA buttons
- [ ] Gambar hero (`public/images/hero/`): buat folder + placeholder jika foto belum ada (bisa gunakan `bg-teal-900` sebagai bg sementara)
- [ ] Verifikasi: Jika `prefers-reduced-motion` aktif → carousel tidak auto-play, animasi Framer Motion disable via `useReducedMotion()` hook
- [ ] Cek: hanya SATU `<h1>` di seluruh halaman (`/`) — headline di HeroSection

---

#### `E2-S1-FE-03` — Component: `components/sections/StatsBar.tsx` ⚠️ *DIREVISI TOTAL*
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` · `Animation`

**Perubahan dari v1.0:** Komponen ini sekarang adalah 2-slide carousel. Slide 1: stats dengan AnimatedCounter. Slide 2: InteractiveDistributionMap.

**Konteks:**
- File: `components/sections/StatsBar.tsx` (`'use client'` — karena carousel state + auto-slide)
- Props: `settings: CompanySettingsMap`
- Sub-komponen: `InteractiveDistributionMap` (dibuat di `E2-S1-FE-10`)

**Data stats dari `settings`:**
```typescript
const STATS = [
  { label: 'Jenis Garam',       value: 5,    suffix: '',     isStatic: true },
  { label: 'Mitra Aktif',       key: 'partner_count',           suffix: '+' },
  { label: 'Kota Dilayani',     key: 'cities_served',           suffix: '+' },
  { label: 'Distribusi (TON)',  key: 'total_distribution_tons', suffix: '' },
]
```

- [ ] Buat `components/sections/StatsBar.tsx`:
  - State: `activeSlide` (0 atau 1), `isPaused`
  - Auto-slide interval `8000ms`: Slide 0 → Slide 1 → Slide 0 → ...
  - Slide transition: `opacity` fade atau `translateX` slide
  - Tombol navigasi: `<ChevronLeft>` / `<ChevronRight>` dari Lucide React — absolute positioned di kiri/kanan
  - Pagination dots (2 dots) di bawah
  - **Slide 0 (Stats):** `grid grid-cols-2 md:grid-cols-4` — setiap stat menggunakan `AnimatedCounter` kecuali stat statis
  - **Slide 1 (Map):** render `<InteractiveDistributionMap />` (dari FE-10)
- [ ] Fallback jika `settings.partner_count` bukan angka valid → gunakan fallback value `6`
- [ ] Suffix "TON" untuk stat distribusi, "+" untuk mitra dan kota

---

#### `E2-S1-FE-04` — Component: `components/sections/ProductsPreview.tsx` ⚠️ *DIREVISI*
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend`

**Perubahan dari v1.0:** Mobile layout berubah ke snap scroll horizontal. Card tambah field `spec`.

**Data produk (update dengan field `spec`):**
```typescript
// TODO(Epic 3): Replace with data from GET /api/v1/products
const PRODUCTS_PREVIEW = [
  { slug: 'garam-halus-yodium',     name: 'Garam Halus PRO YD',         spec: 'NaCl ≥97.0% • Beryodium',   is_sni: true  },
  { slug: 'garam-halus-non-yodium', name: 'Garam Halus PRO L',          spec: 'NaCl ≥97.0% • Non-yodium',  is_sni: false },
  { slug: 'garam-kasar-industri',   name: 'Garam Kasar SPO/M',          spec: 'NaCl ≥96.0% • Kasar SPO/M', is_sni: true  },
  { slug: 'garam-kasar-petani',     name: 'Garam Kasar Petani Premium', spec: 'NaCl ≥94.0% • Kasar',       is_sni: false },
  { slug: 'garam-ghpt',             name: 'Garam Halus Pakan Ternak',   spec: 'NaCl ≥95.0% • GHPT',        is_sni: false },
]
```

- [ ] Buat `components/sections/ProductsPreview.tsx`
- [ ] `components/blocks/ProductCard.tsx` dengan props: `slug`, `name`, `spec`, `imagePath`, `is_sni`
  - Foto: `<Image>` dari next/image, aspect-ratio `4:3`, `border-radius: sm`, `shadow-sm`
  - Nama: `font-semibold text-lg`
  - Spec: `text-sm text-neutral-500` — contoh: `"NaCl ≥97.0% • Beryodium"`
  - Badge SNI: hanya jika `is_sni === true` — shadcn `<Badge>` `bg-teal-100 text-teal-800`
  - CTA: `"Lihat Detail →"` — `<Link>` style `text-sm text-neutral-500 hover:text-brand-teal-600 hover:underline opacity-70 hover:opacity-100 transition-all`
  - Card hover: class `card-hover-lift` dari `globals.css` (Design System §11.2) → `translateY(-4px)` + shadow
- [ ] **Desktop layout:** `grid grid-cols-5 gap-6`
- [ ] **Mobile layout:** `flex overflow-x-auto scroll-smooth snap-x snap-mandatory gap-4 pb-4` — setiap card `shrink-0 w-[75vw] snap-start`
- [ ] Bungkus dengan `<RevealWrapper>` + class `reveal-stagger` untuk setiap card
- [ ] Tombol CTA bawah: `"Lihat Semua Produk"` → `/produk`, variant `outline`

---

#### `E2-S1-FE-05` — Component: `components/sections/HowItWorks.tsx` ⚠️ *DIREVISI TOTAL*
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` · `Animation`

**Perubahan dari v1.0:** Desain berubah total. Bukan lagi 4-kolom card biasa — sekarang scroll-driven sticky section dengan Framer Motion.

**Konteks:**
- Komponen ini harus `'use client'` (pakai `useScroll`, `useTransform` Framer Motion)
- **Atau:** dynamic import dengan `ssr: false` dari page.tsx (direkomendasikan untuk performa SSG)
- Background image: `public/images/how-it-works-bg.jpg` — foto kegiatan perusahaan

**Data 4 langkah:**
```typescript
const STEPS = [
  { step: 1, title: 'Hubungi Kami',        desc: 'Sampaikan kebutuhan garam industri Anda melalui WA atau form kontak.' },
  { step: 2, title: 'Konsultasi Kebutuhan', desc: 'Tim kami diskusikan spesifikasi, volume, dan jadwal pengiriman.' },
  { step: 3, title: 'Pengiriman Sampel',    desc: 'Kami kirimkan sampel untuk diuji di laboratorium Anda terlebih dahulu.' },
  { step: 4, title: 'Distribusi Rutin',     desc: 'Setelah deal, kami atur jadwal distribusi berkala sesuai kebutuhan Anda.' },
]
```

**Implementasi:**
- [ ] Buat `components/sections/HowItWorks.tsx` (`'use client'`)
- [ ] **Scroll container:** `position: relative`, `height: 400vh` (agar ada ruang scroll untuk 4 langkah × 100vh)
- [ ] **Sticky wrapper:** `position: sticky`, `top: 0`, `height: 100vh`, `overflow: hidden`
- [ ] **Background image layer:** `<Image fill objectFit="cover">` dengan foto kegiatan, class `z-0`
- [ ] **Panel konten:** `position: absolute`, desktop: `left-0 top-0 w-1/2 h-full bg-neutral-50/95`, mobile: `bottom-0 left-0 w-full h-1/2 bg-neutral-50/95`
- [ ] **Framer Motion `useScroll`:**
  ```typescript
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  })
  // activeStep: 0–3 berdasarkan scrollYProgress 0–1
  // 0–0.25 → step 0 aktif, 0.25–0.5 → step 1 aktif, dst.
  const activeStep = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], [0, 1, 2, 3, 3])
  ```
- [ ] **Setiap step:** `motion.div` dengan `animate={{ opacity, scale }}` berdasarkan apakah step ini aktif
- [ ] **Progress line:** `div` tinggi penuh dengan Framer Motion `scaleY` yang berubah seiring `scrollYProgress`
- [ ] **Mobile:** Panel muncul dari bawah. Konten scroll vertikal dalam panel (bukan horizontal)
- [ ] **Fallback reduced motion:** jika `useReducedMotion()` → tampilkan layout static 4-kolom sederhana (fallback ke desain v1.0)

---

#### `E2-S1-FE-06` — Component: `components/sections/IndustriesGrid.tsx` ⚠️ *DIREVISI*
**Priority:** 🟡 MED &emsp; **Tags:** `Frontend`

**Perubahan dari v1.0:** Ikon berubah dari Lucide React → SVG line-art 48×48px. Hover berubah ke `scale(1.05)`. Tambah klik navigasi placeholder.

**Data 6 sektor:**
```typescript
const INDUSTRIES = [
  { id: 'makanan-minuman',   name: 'Makanan & Minuman',  icon: '/icons/industries/food.svg'     },
  { id: 'pengasinan-ikan',   name: 'Pengasinan Ikan',    icon: '/icons/industries/fish.svg'     },
  { id: 'water-treatment',   name: 'Water Treatment',    icon: '/icons/industries/water.svg'    },
  { id: 'pakan-ternak',      name: 'Pakan Ternak',       icon: '/icons/industries/cattle.svg'   },
  { id: 'pulp-kertas',       name: 'Pulp & Kertas',      icon: '/icons/industries/paper.svg'    },
  { id: 'penyamakan-kulit',  name: 'Penyamakan Kulit',   icon: '/icons/industries/leather.svg'  },
]
```

- [ ] Buat `components/sections/IndustriesGrid.tsx`
- [ ] Siapkan folder `public/icons/industries/` dengan 6 file SVG line-art
  - SVG spec: `viewBox="0 0 48 48"`, stroke `currentColor`, fill `none`, stroke-width `1.5–2`
  - Warna via Tailwind class `text-brand-teal-600` pada container → `stroke: currentColor` pada SVG
  - Jika SVG belum tersedia: gunakan Lucide React sebagai fallback sementara dengan catatan `// TODO: Replace with custom SVG — E2-S1-FE-06`
- [ ] Layout: `grid grid-cols-2 sm:grid-cols-3 gap-6`
- [ ] Setiap item: `<Link href="/kontak" className="...">` (fallback — `// TODO(Future Epic): /industri/[slug]`)
  - Padding `p-6`, rounded `rounded-xl`, border `border border-transparent`
  - Hover: `hover:scale-105 hover:bg-neutral-50 hover:border-neutral-200 transition-all duration-200`
  - SVG: ukuran `w-12 h-12 mx-auto mb-3`
  - Nama: `text-sm font-medium text-center text-ink-700`
- [ ] Bungkus grid dengan `<RevealWrapper>` + class `reveal-stagger`
- [ ] Section heading: `<h2>` "Industri yang Kami Layani"

---

#### `E2-S1-FE-07` — Component: `components/sections/CredibilitySection.tsx` ⚠️ *DIREVISI TOTAL*
**Priority:** 🟡 MED &emsp; **Tags:** `Frontend`

**Perubahan dari v1.0:** Berubah total dari static chips → Marquee infinite scroll. Data dari `constants/clients.ts`.

**Konteks:**
- Komponen ini tetap bisa Server Component — marquee menggunakan CSS animation (tidak butuh `useState`)
- Pause on hover membutuhkan CSS `:hover` selector (tidak perlu JS)
- Gradient fade kiri/kanan menggunakan absolute positioned divs

- [ ] Buat `components/sections/CredibilitySection.tsx`
- [ ] Import `ACTIVE_CLIENTS` dari `@/constants/clients`
- [ ] Duplicate array untuk seamless loop: `const marqueeItems = [...ACTIVE_CLIENTS, ...ACTIVE_CLIENTS]`
- [ ] **Markup:**
  ```tsx
  <div className="relative overflow-hidden py-16 bg-white">
    {/* Gradient fade kiri */}
    <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-white to-transparent pointer-events-none" />
    {/* Gradient fade kanan */}
    <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-white to-transparent pointer-events-none" />
    
    <div className="marquee-track">  {/* CSS animation class */}
      {marqueeItems.map((client, i) => (
        <div key={i} className="marquee-item">
          <p className="font-semibold text-ink-700">{client.name}</p>
          <p className="text-sm text-neutral-500">{client.industry}</p>
        </div>
      ))}
    </div>
  </div>
  ```
- [ ] **CSS `globals.css`** — tambahkan (cek dulu apakah sudah ada):
  ```css
  /* Marquee animation — Credibility Section */
  /* Tambahan Slice 1 v1.1 — Design System §6 (CredibilitySection) */
  @keyframes marquee-scroll {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }  /* -50% karena array di-duplicate */
  }
  .marquee-track {
    display: flex;
    gap: 2rem;
    width: max-content;
    animation: marquee-scroll 20s linear infinite;
  }
  .marquee-track:hover {
    animation-play-state: paused;
  }
  .marquee-item {
    padding: 1rem 1.5rem;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 -1px 0 rgba(0,0,0,0.04);
    border-radius: 0.5rem;
    min-width: 200px;
    flex-shrink: 0;
  }
  ```
- [ ] **Catatan CSS freeze:** `globals.css` adalah file FROZEN. Tambahan ini diizinkan karena sudah terdefinisi di Design System §6 dan merupakan implementasi dari spec wireframe resmi. Dokumentasikan dengan komentar `/* Tambahan Slice 1 v1.1 */`
- [ ] Verifikasi: marquee berjalan mulus tanpa gap. Pause saat hover. Gradient kiri/kanan tampil.
- [ ] `<RevealWrapper>` untuk section header sebelum marquee

---

#### `E2-S1-FE-08` — Component: `components/sections/CTASection.tsx` ⚠️ *DIREVISI*
**Priority:** 🟡 MED &emsp; **Tags:** `Frontend`

**Perubahan dari v1.0:** Background menjadi `bg-brand-teal-600` solid. Warna tombol spesifik.

- [ ] Buat `components/sections/CTASection.tsx` (Server Component)
- [ ] Background: `bg-brand-teal-600` atau `bg-gradient-to-br from-brand-teal-600 to-brand-teal-700`
- [ ] `py-20 md:py-28 px-4`
- [ ] Heading: `"Siap Jadi Mitra Distribusi?"` — `<h2>`, `text-3xl md:text-4xl font-bold text-white`
- [ ] Sub-teks: kalimat singkat mengundang — `text-white/80`
- [ ] **CTA Primary:** `"Minta Penawaran"` → `/minta-penawaran`
  - Style: `bg-white text-brand-teal-600 hover:bg-neutral-100 font-semibold`
- [ ] **CTA Secondary:** `"Hubungi Kami"` → `/kontak`
  - Style: `border-2 border-white text-white hover:bg-white/10 font-semibold`
- [ ] Layout tombol: `flex flex-col gap-3 sm:flex-row sm:gap-4`, `max-w-xl mx-auto text-center`
- [ ] Bungkus dengan `<RevealWrapper variant="reveal-scale">`
- [ ] Konten teks contrast ≥ 4.5:1 di atas `brand-teal-600` background

---

#### `E2-S1-FE-09` — Page assembly + data fetching + sitemap + robots
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` · `SEO`
*(Sebagian besar tidak berubah dari v1.0 — update section order dan dynamic import)*

- [ ] Update `app/(public)/page.tsx` — assembly semua 7 section dalam urutan yang benar:
  ```tsx
  <HeroSection />
  <StatsBar settings={settings} />
  <ProductsPreview />
  <HowItWorks />  {/* dynamic import — ssr: false */}
  <IndustriesGrid />
  <CredibilitySection />
  <CTASection />
  ```
- [ ] **Dynamic import untuk HowItWorks** (performa — below-fold + heavy Framer Motion):
  ```typescript
  import dynamic from 'next/dynamic'
  const HowItWorks = dynamic(() => import('@/components/sections/HowItWorks'), {
    ssr: false,
    loading: () => <div className="h-screen bg-neutral-100 animate-pulse" />,
  })
  ```
- [ ] Buat atau update `app/sitemap.ts` (lihat v1.0 untuk template)
- [ ] Buat atau update `app/robots.ts` (lihat v1.0 untuk template)
- [ ] Semua `<img>` tag → `<Image>` dari `next/image`
- [ ] `npm run build` → tidak ada error

---

#### `E2-S1-FE-10` — Component: `components/sections/InteractiveDistributionMap.tsx` *(TASK BARU)*
**Priority:** 🟡 MED &emsp; **Tags:** `Frontend` · `Animation`

Sub-komponen SVG map yang dirender di dalam StatsBar Slide 2.

**Konteks:**
- File baru: `components/sections/InteractiveDistributionMap.tsx`
- Harus `'use client'` — butuh `useState` untuk active tooltip
- Menggunakan Framer Motion `AnimatePresence` + `motion.div` untuk tooltip scale+fade
- Data dari `constants/distribution-map.ts` (`E2-S1-CONST-02`)

- [ ] Buat `components/sections/InteractiveDistributionMap.tsx`:

```typescript
// components/sections/InteractiveDistributionMap.tsx
'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DISTRIBUTION_CITIES, type DistributionCity } from '@/constants/distribution-map'

export function InteractiveDistributionMap() {
  const [activeCity, setActiveCity] = useState<DistributionCity | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const handleDotEnter = (city: DistributionCity, e: React.MouseEvent<SVGCircleElement>) => {
    const rect = (e.target as SVGCircleElement).closest('svg')?.getBoundingClientRect()
    setActiveCity(city)
    setTooltipPos({ x: city.cx, y: city.cy - 20 })
  }

  return (
    <div className="relative w-full">
      {/* Label wilayah */}
      <div className="flex justify-between px-8 mb-2 text-xs font-medium text-neutral-400 uppercase tracking-widest">
        <span>Jawa Tengah</span>
        <span>Jawa Timur</span>
      </div>

      <svg
        viewBox="0 0 500 300"
        className="w-full max-h-64"
        aria-label="Peta distribusi CV Reka Cipta Indonesia"
      >
        {/* Background peta — placeholder rect, idealnya diganti SVG path Jawa Timur/Tengah */}
        <rect x="50" y="50" width="400" height="200" rx="12"
              fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1" />

        {/* Garis batas wilayah (approximate) */}
        <line x1="290" y1="50" x2="290" y2="250"
              stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 4" />

        {/* Dot markers */}
        {DISTRIBUTION_CITIES.map((city) => (
          <g key={city.id}>
            {/* Pulse ring */}
            <circle cx={city.cx} cy={city.cy} r="12"
                    fill="#0B7D6E" fillOpacity="0.2"
                    className="animate-ping" style={{ animationDuration: '2s' }} />
            {/* Dot utama */}
            <circle
              cx={city.cx} cy={city.cy} r="7"
              fill="#0B7D6E" stroke="white" strokeWidth="2"
              className="cursor-pointer hover:r-9 transition-all"
              onMouseEnter={(e) => handleDotEnter(city, e)}
              onMouseLeave={() => setActiveCity(null)}
              aria-label={`${city.name}: ${city.tons} ton`}
            />
          </g>
        ))}

        {/* Tooltip (via foreignObject untuk HTML rendering) */}
        <AnimatePresence>
          {activeCity && (
            <motion.foreignObject
              x={Math.min(tooltipPos.x - 60, 380)} y={Math.max(tooltipPos.y - 50, 5)}
              width="120" height="50"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <div className="bg-ink-900 text-white text-xs rounded-lg px-3 py-2 pointer-events-none">
                <div className="font-semibold">{activeCity.name}</div>
                <div className="text-neutral-300">{activeCity.tons} ton</div>
              </div>
            </motion.foreignObject>
          )}
        </AnimatePresence>
      </svg>

      {/* Legenda */}
      <p className="text-center text-xs text-neutral-500 mt-3">
        Hover titik untuk melihat detail distribusi
      </p>
    </div>
  )
}
```

- [ ] Test: hover dot → tooltip muncul dengan nama kota dan volume
- [ ] Test: tooltip tidak overflow keluar SVG viewBox (clamp koordinat)
- [ ] **Future improvement note:** SVG map placeholder rect harus diganti dengan path SVG resmi Jawa Timur/Tengah jika tersedia dari klien. Catat sebagai `// TODO: Replace placeholder with actual Jawa island SVG path`
- [ ] Aksesibilitas: setiap dot memiliki `aria-label`. Keyboard navigation: SVG dots bisa fokus via `tabIndex={0}` + `onFocus` / `onKeyDown` handler.

---

## Layer 4 · QA & Observability

---

#### `E2-S1-QA-01` — Visual review: semua breakpoints ⚠️ *DIREVISI*
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA` · `Frontend`

- [ ] Test di **375px:**
  - Hero: carousel foto tampil, teks tidak overflow, 2 tombol stack vertikal
  - Stats Bar: Slide 1 = 2×2 grid terbaca. Slide 2 = SVG map visible (tidak terlalu kecil)
  - ProductsPreview: snap scroll horizontal berfungsi, kartu terlihat 75% + hint ada kartu berikutnya
  - HowItWorks: panel muncul dari bawah, 50% tinggi, teks terbaca
  - Industries: 2 kolom grid, SVG ikon tampil
  - Credibility marquee: berjalan, item terbaca, gradient fade kiri/kanan tampil
  - CTA: 2 tombol stack vertikal di atas background teal
- [ ] Test di **768px:** HowItWorks panel masih dari bawah atau sudah dari kiri? Verifikasi
- [ ] Test di **1280px:**
  - Products: `grid-cols-5` horizontal
  - HowItWorks: panel dari kiri 50%
  - Industries: 3 kolom
  - Stats Slide 1: 4 kolom horizontal
- [ ] Tidak ada horizontal scroll di semua breakpoint (kecuali ProductsPreview yang memang snap scroll)
- [ ] Screenshot tiap breakpoint → simpan sebagai referensi baseline

---

#### `E2-S1-QA-02` — Content accuracy check ⚠️ *DIREVISI*
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA`

- [ ] Hero: headline **persis** `"Mitra Distribusi Garam SNI Anda: Transparan, Cepat, dan Terverifikasi"`
- [ ] Hero: badge "Tersertifikasi SNI" tampil di atas headline
- [ ] Stats Bar: nilai dari DB — Mitra Aktif `6`, Kota `9`, Distribusi `353`
- [ ] Stats Bar: ubah `partner_count` di Supabase dashboard → refresh halaman setelah cache expired → angka baru tampil
- [ ] Distribution Map: 8 kota muncul sebagai dots. Hover "Surabaya" → tooltip "Surabaya • 180 ton"
- [ ] Products: 5 produk dengan nama, spec, dan badge SNI yang benar
- [ ] Industries: 6 sektor dengan ikon SVG (bukan Lucide icon default)
- [ ] Credibility marquee: 5 klien tampil berulang dalam marquee
- [ ] CTA: tombol primary putih, tombol secondary outline putih, background teal

---

#### `E2-S1-QA-03` — Lighthouse performance check ⚠️ *DIREVISI*
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA` · `Performance`

- [ ] Jalankan Lighthouse → mode Desktop → target: **Performance ≥ 85, Accessibility ≥ 90, SEO ≥ 90**
- [ ] Cek **LCP**: hero image harus ada `priority` prop di Next.js `<Image>` untuk foto pertama carousel
- [ ] Cek **bundle size**: Framer Motion (~50KB). Verifikasi HowItWorks sudah pakai `dynamic` import — tidak masuk initial bundle
- [ ] Jika Performance < 85: cek network tab → apakah Framer Motion di-bundle di initial load? Jika iya → pindahkan ke `dynamic(() => import('framer-motion'), { ssr: false })`
- [ ] Mobile Lighthouse: target Performance ≥ 70 (scroll-driven lebih berat di mobile)
- [ ] Screenshot hasil + simpan sebagai baseline

---

#### `E2-S1-QA-04` — Manual accessibility test ⚠️ *DIREVISI*
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA` · `Accessibility`

- [ ] **Heading hierarchy:** tepat 1 `<h1>` (Hero headline). Section titles `<h2>`. Verifikasi dengan HeadingsMap extension
- [ ] **Keyboard nav:** Tab → fokus ke CTA buttons. Pagination dots Stats Bar bisa diakses via keyboard
- [ ] **Carousel pause:** `prefers-reduced-motion: reduce` → hero carousel berhenti. HowItWorks menampilkan fallback static layout
- [ ] **SVG Map:** setiap dot punya `aria-label` yang deskriptif. Tab ke dot → tooltip muncul via `onFocus`
- [ ] **Marquee:** users yang butuh `prefers-reduced-motion` → marquee berhenti. CSS: `@media (prefers-reduced-motion: reduce) { .marquee-track { animation: none; } }`
- [ ] **AnimatedCounter:** `aria-hidden="true"` atau `aria-live="off"` — tidak mengumumkan setiap angka
- [ ] **Contrast:** teks di atas `brand-teal-600` CTA Section ≥ 4.5:1. Hero text di atas foto+overlay ≥ 4.5:1

---

#### `E2-S1-QA-05` — SEO verification
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA` · `SEO`
*(Tidak berubah dari v1.0)*

- [ ] Source HTML: `<title>` dan `<meta name="description">` benar
- [ ] OG image: `public/og-image.jpg` accessible di staging URL
- [ ] `{staging}/sitemap.xml` → Beranda ada dengan priority 1.0
- [ ] `{staging}/robots.txt` → `/admin` di-disallow
- [ ] HTTP status Beranda: 200

---

#### `E2-S1-QA-06` — Definition of Done: Slice 1 Final Checklist ⚠️ *DIREVISI*
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA` · `Demo`

**Database & Backend:**
- [ ] ☑ Tabel `company_settings` ada dengan 10 rows (termasuk `total_distribution_tons`)
- [ ] ☑ Nilai aktual: `partner_count: 6`, `cities_served: 9`, `total_distribution_tons: 353`
- [ ] ☑ RLS: anonymous SELECT berhasil, INSERT ditolak
- [ ] ☑ FastAPI `GET /api/v1/settings/` → 401 tanpa token
- [ ] ☑ `types/api.ts` sync dengan Pydantic schemas

**Frontend — Fungsionalitas:**
- [ ] ☑ Beranda dapat dibuka di staging tanpa error
- [ ] ☑ Hero: badge SNI tampil, carousel foto berjalan (pause on hover), stagger animasi berjalan
- [ ] ☑ Stats Bar Slide 1: 4 counter animasi (Jenis Garam, Mitra, Kota, Distribusi TON)
- [ ] ☑ Stats Bar Slide 2: peta SVG dengan 8 dots, tooltip on hover berfungsi
- [ ] ☑ Products: snap scroll di mobile, card hover translateY(-4px)
- [ ] ☑ HowItWorks: panel muncul + poin aktif berubah saat scroll
- [ ] ☑ Industries: SVG ikon tampil, hover scale(1.05)
- [ ] ☑ Credibility: marquee berjalan, pause on hover, gradient fade kiri/kanan
- [ ] ☑ CTA: background teal, tombol primary putih, sekunder outline putih

**Frontend — Kualitas:**
- [ ] ☑ Responsif di 375px, 768px, 1280px — tidak ada horizontal scroll (kecuali ProductsPreview)
- [ ] ☑ Lighthouse: Performance ≥ 85, Accessibility ≥ 90, SEO ≥ 90 (desktop)
- [ ] ☑ `prefers-reduced-motion`: carousel tidak auto-play, marquee berhenti, HowItWorks fallback static
- [ ] ☑ HowItWorks menggunakan `dynamic` import (tidak bloat initial bundle)
- [ ] ☑ Tepat 1 `<h1>` di halaman, section titles `<h2>`

**Kode & Dokumentasi:**
- [ ] ☑ `framer-motion` ada di `package.json` + terdokumentasi di `ARCHITECTURE.md §11.4`
- [ ] ☑ `constants/clients.ts` + `constants/distribution-map.ts` ter-commit
- [ ] ☑ CSS additions di `globals.css` terdokumentasi dengan komentar "Tambahan Slice 1 v1.1"
- [ ] ☑ `// TODO(Epic 3)` pada PRODUCTS_PREVIEW static data
- [ ] ☑ `// TODO(Future Epic)` pada links IndustriesGrid

**Demo ke klien:**
- [ ] ☑ Buka Beranda di laptop + mobile — tunjukkan semua 7 section
- [ ] ☑ Demo hero carousel auto-play + pause saat hover
- [ ] ☑ Demo Stats Bar: angka count-up → klik panah ke Slide 2 → hover kota di peta
- [ ] ☑ Demo ProductsPreview: swipe di mobile (snap scroll)
- [ ] ☑ Demo HowItWorks: scroll perlahan → tunjukkan panel + poin aktif berganti
- [ ] ☑ Demo Credibility marquee: pause saat hover

---

---

# FASE PENGERJAAN

Panduan urutan eksekusi task Slice 1. Setiap fase memiliki **pre-requisite** yang harus selesai sebelum fase berikutnya bisa dimulai. Coding agent harus mengikuti urutan ini.

---

## Ikhtisar Semua Fase

| Fase | Nama | Tasks | Pre-req | Outcome |
|:---:|---|---|---|---|
| **0** | Verifikasi & Persiapan | UX-01, UX-02, UX-03, UX-04, UX-05 | Output Epic 1 ready | Semua keputusan desain terdokumentasi |
| **1** | Database Foundation | DB-01, DB-02 | Fase 0 selesai | `company_settings` table + 10 seed rows |
| **2** | Backend & API Contract | BE-01, BE-02, BE-03, CONT-01 | Fase 1 selesai | FastAPI endpoint + TypeScript types sync |
| **3** | Library & Core Animation | LIB-01, ANIM-01, ANIM-02, ANIM-03 | — (parallel dengan Fase 1-2) | Framer Motion + RevealWrapper + AnimatedCounter siap |
| **4** | Static Data Constants | CONST-01, CONST-02, UTIL-01 | — (parallel dengan Fase 1-3) | clients.ts + distribution-map.ts + api.ts |
| **5** | Fondasi Halaman | FE-01 | Fase 1 + Fase 2 selesai | page.tsx scaffold + data fetching + loading skeleton |
| **6** | Above-the-Fold | FE-02, FE-03, FE-10 | Fase 3 + Fase 4 + Fase 5 selesai | Hero carousel + Stats Bar 2-slide + InteractiveMap |
| **7** | Below-the-Fold | FE-04, FE-05, FE-06, FE-07, FE-08 | Fase 3 + Fase 4 selesai | ProductsPreview, HowItWorks, Industries, Credibility, CTA |
| **8** | Assembly & SEO | FE-09 | Fase 6 + Fase 7 selesai | Halaman lengkap + sitemap + dynamic imports |
| **9** | QA & DoD | QA-01–QA-06 | Fase 8 selesai | Halaman siap demo ke klien |

---

## Fase 0 — Verifikasi & Persiapan (Sebelum Coding)

**Tujuan:** Semua keputusan UX terdokumentasi dan disetujui. Tidak ada coding sebelum fase ini selesai.

**Pre-requisite:** Output Epic 1 semua ready (Navbar, Footer, layout wrapper, skeleton components, Tailwind tokens frozen, Supabase client, env.ts).

| Task | Deskripsi | Output |
|---|---|---|
| `E2-S1-UX-01` | Finalisasi spesifikasi Hero Section (badge, carousel, animasi, konten teks final) | Hero spec complete |
| `E2-S1-UX-02` | Finalisasi spesifikasi Stats Bar (2-slide carousel + SVG map spec) | Stats spec complete |
| `E2-S1-UX-03` | Finalisasi spesifikasi Products (snap scroll), HowItWorks (scroll-driven), Industries (SVG icons) | 3 section specs |
| `E2-S1-UX-04` | Finalisasi spesifikasi Credibility (marquee) dan CTA (warna tombol final) | 2 section specs |
| `E2-S1-UX-05` | Metadata SEO final (title, description, OG image path) | Metadata values table |

**Gate Fase 0 → Fase 1:** Semua spec disetujui. Foto hero placeholder tersedia. SVG industri tersedia (atau plan fallback Lucide disetujui).

---

## Fase 1 — Database Foundation

**Tujuan:** Tabel `company_settings` tersedia di Supabase dengan data yang benar. Fondasi data yang dibutuhkan semua fase berikutnya.

**Pre-requisite:** Fase 0 selesai (nilai stats aktual sudah dikonfirmasi: 6, 9, 353).

| Task | Deskripsi | Output |
|---|---|---|
| `E2-S1-DB-01` | Buat tabel `company_settings` + RLS + trigger updated_at | Migration file ter-push |
| `E2-S1-DB-02` | Seed 10 rows data awal (nilai aktual + key `total_distribution_tons` baru) | 10 rows terverifikasi di dashboard |

**Verifikasi sebelum lanjut:** anonymous `SELECT * FROM company_settings` berhasil. anonymous `INSERT` gagal (403). Nilai `partner_count = 6`, `cities_served = 9`, `total_distribution_tons = 353`.

---

## Fase 2 — Backend & API Contract

**Tujuan:** FastAPI endpoint settings tersedia dan TypeScript types sync. Prerequisite untuk admin panel di Slice 3.

**Pre-requisite:** Fase 1 selesai (tabel ada).

| Task | Deskripsi | Output |
|---|---|---|
| `E2-S1-BE-01` | Pydantic schemas: `CompanySettingItem`, `CompanySettingsResponse`, dll. | `backend/schemas/settings.py` |
| `E2-S1-BE-02` | FastAPI router `GET /settings` [AUTH] | `backend/routers/settings.py` |
| `E2-S1-BE-03` | Register settings router di `main.py` | Endpoint muncul di Swagger UI |
| `E2-S1-CONT-01` | Update `types/api.ts` + `ARCHITECTURE.md §16.1` | TypeScript interfaces match Pydantic |

**Verifikasi sebelum lanjut:** `GET /api/v1/settings/` → 401 tanpa token. Swagger UI menampilkan endpoint. `npx tsc --noEmit` tanpa error pada `types/api.ts`.

> **Catatan:** Fase 2 bisa dikerjakan **paralel dengan Fase 3 dan Fase 4** — tidak ada dependency antara ketiganya.

---

## Fase 3 — Library & Core Animation

**Tujuan:** Framer Motion terinstall dan ketiga animation utilities siap dipakai oleh komponen di Fase 6 dan 7.

**Pre-requisite:** Tidak ada (bisa dikerjakan paralel dengan Fase 1 dan 2).

| Task | Deskripsi | Output |
|---|---|---|
| `E2-S1-LIB-01` | Install `framer-motion` + verifikasi bundle impact + update ARCHITECTURE.md | `package.json` diperbarui |
| `E2-S1-ANIM-01` | Hook `hooks/use-scroll-reveal.ts` (IntersectionObserver, untuk CSS-based reveal) | Hook siap digunakan |
| `E2-S1-ANIM-02` | Component `components/animations/RevealWrapper.tsx` | RevealWrapper siap dipakai di section bawah |
| `E2-S1-ANIM-03` | Component `components/animations/AnimatedCounter.tsx` | Counter siap dipakai di StatsBar |

**Urutan dalam Fase 3:** LIB-01 wajib selesai **sebelum** ANIM-01, ANIM-02, ANIM-03 (tapi ketiganya bisa dikerjakan paralel setelah LIB-01).

**Verifikasi sebelum lanjut:** `<RevealWrapper>Test</RevealWrapper>` render tanpa error. `<AnimatedCounter target={50} />` count-up saat masuk viewport. Framer Motion `motion.div` tidak ada TypeScript error.

---

## Fase 4 — Static Data Constants

**Tujuan:** Semua data hardcoded yang dibutuhkan komponen tersedia dalam file constants yang terstruktur.

**Pre-requisite:** Tidak ada (bisa dikerjakan paralel dengan Fase 1, 2, 3).

| Task | Deskripsi | Output |
|---|---|---|
| `E2-S1-CONST-01` | `constants/clients.ts` — 5 klien dengan nama + jenis industri untuk marquee | Data ACTIVE_CLIENTS |
| `E2-S1-CONST-02` | `constants/distribution-map.ts` — 8 kota dengan koordinat SVG + volume | Data DISTRIBUTION_CITIES |
| `E2-S1-UTIL-01` | `lib/api.ts` — typed fetch wrapper (digunakan penuh di Slice 3) | Utility siap |

**Verifikasi sebelum lanjut:** `import { ACTIVE_CLIENTS } from '@/constants/clients'` tidak ada error. Total `tons` dari `DISTRIBUTION_CITIES` mendekati 353.

---

## Fase 5 — Fondasi Halaman

**Tujuan:** Scaffold halaman Beranda siap — page.tsx, metadata, data fetching, dan loading skeleton — sebelum section-section dibangun.

**Pre-requisite:** Fase 1 selesai (DB) + Fase 2 selesai (types/api.ts).

| Task | Deskripsi | Output |
|---|---|---|
| `E2-S1-FE-01` | `app/(public)/page.tsx` + metadata + `getCompanySettings()` + `loading.tsx` | Page scaffold functional, fetch berhasil |

**Verifikasi sebelum lanjut:** Buka `localhost:3000` → loading skeleton tampil lalu halaman kosong (belum ada sections). Tidak ada TypeScript error. `settings.partner_count` dapat di-log sebagai "6" dari Server Component.

---

## Fase 6 — Above-the-Fold Components

**Tujuan:** Komponen yang dilihat pertama kali tanpa scroll — Hero dan Stats Bar. Ini yang paling kritikal untuk kesan pertama dan demo klien.

**Pre-requisite:** Fase 3 (Framer Motion + animasi) + Fase 4 (constants) + Fase 5 (page scaffold) selesai.

**Urutan dalam Fase 6:**

```
FE-10 (InteractiveDistributionMap) → FE-03 (StatsBar — butuh FE-10)
FE-02 (HeroSection) — dapat dikerjakan paralel dengan FE-10
```

| Task | Deskripsi | Output | Dependency |
|---|---|---|---|
| `E2-S1-FE-10` | `InteractiveDistributionMap.tsx` — SVG map + Framer Motion tooltip | Map component siap | CONST-02, LIB-01 |
| `E2-S1-FE-02` | `HeroSection.tsx` + `HeroCarousel.tsx` — badge SNI, carousel, Framer Motion stagger | Hero section lengkap | LIB-01 |
| `E2-S1-FE-03` | `StatsBar.tsx` — 2-slide carousel: AnimatedCounter (Slide 1) + InteractiveMap (Slide 2) | Stats Bar lengkap | ANIM-03, FE-10 |

**Verifikasi sebelum lanjut Fase 7:**
- Hero carousel auto-play berfungsi
- Stats count-up berjalan saat masuk viewport
- Slide map tampil dengan dots dan tooltip

---

## Fase 7 — Below-the-Fold Components

**Tujuan:** Semua 5 section di bawah fold dibangun. Tidak ada dependency satu sama lain — bisa dikerjakan **paralel** jika developer tersedia.

**Pre-requisite:** Fase 3 (animasi) + Fase 4 (constants) selesai. Tidak perlu menunggu Fase 6.

**Urutan rekomendasi (jika dikerjakan sequential, urutkan by complexity):**

| Urutan | Task | Kompleksitas | Deskripsi |
|:---:|---|:---:|---|
| 1 | `E2-S1-FE-06` (IndustriesGrid) | 🟢 Rendah | Grid sederhana + SVG ikon + hover |
| 2 | `E2-S1-FE-08` (CTASection) | 🟢 Rendah | Static section, hanya warna + layout |
| 3 | `E2-S1-FE-04` (ProductsPreview) | 🟡 Sedang | ProductCard + snap scroll mobile |
| 4 | `E2-S1-FE-07` (CredibilitySection) | 🟡 Sedang | Marquee CSS + cloned array + gradient |
| 5 | `E2-S1-FE-05` (HowItWorks) | 🔴 Tinggi | Scroll-driven sticky + Framer Motion useScroll |

**Verifikasi setelah Fase 7:** Setiap komponen dapat dirender secara isolated (tambahkan sementara di page.tsx satu per satu, verifikasi, lalu tambahkan berikutnya).

---

## Fase 8 — Assembly & SEO

**Tujuan:** Menyatukan semua komponen di page.tsx, mengatur dynamic imports, dan memastikan sitemap + robots benar.

**Pre-requisite:** Fase 6 + Fase 7 selesai (semua komponen tersedia).

| Task | Deskripsi | Output |
|---|---|---|
| `E2-S1-FE-09` | Susun semua 7 section di `page.tsx` + `dynamic` import HowItWorks + sitemap + robots | Halaman Beranda lengkap |

**Verifikasi sebelum QA:**
- `npm run build` → berhasil tanpa error
- Semua 7 section tampil saat buka `localhost:3000`
- HowItWorks ada di dynamic import (cek Network tab — tidak masuk initial bundle)

---

## Fase 9 — QA & Definition of Done

**Tujuan:** Verifikasi kualitas, performa, aksesibilitas, dan konten sebelum Slice 1 dinyatakan selesai.

**Pre-requisite:** Fase 8 selesai (halaman deployed ke staging).

| Task | Deskripsi | Gate |
|---|---|---|
| `E2-S1-QA-01` | Visual review 4 breakpoints (375, 768, 1280, 1440px) | Tidak ada overflow/layout rusak |
| `E2-S1-QA-02` | Content accuracy check (headline, stats values, tooltip data) | Konten sesuai wireframe dan DB |
| `E2-S1-QA-03` | Lighthouse performance (≥85 Desktop, ≥70 Mobile) | Score terpenuhi |
| `E2-S1-QA-04` | Manual accessibility (heading hierarchy, keyboard nav, reduced motion) | WCAG AA terpenuhi |
| `E2-S1-QA-05` | SEO verification (metadata, sitemap, robots) | Metadata benar di staging |
| `E2-S1-QA-06` | Final DoD checklist (semua 20+ item ✅) | **Go/No-go untuk Slice 2** |

**Gate Fase 9 → Slice 2:** Semua QA tasks ✅. Demo ke klien sukses. Branch `dev` di-merge ke `main` untuk staging update.

---

## Dependency Graph Ringkas

```
Fase 0 (UX)
    │
    ├──────────────────────────────────────────────────┐
    │                                                  │
Fase 1 (DB)          Fase 3 (Library + Anim)     Fase 4 (Constants)
    │                       │                          │
Fase 2 (Backend)            └────────────┬─────────────┘
    │                                    │
Fase 5 (Page Setup) ◄────────────────────┤
    │                                    │
    └────────────────►  Fase 6 (Above-fold) ◄──────────┘
                                    │
                        Fase 7 (Below-fold) ◄──────────┘ (dari Fase 3+4)
                                    │
                            Fase 8 (Assembly)
                                    │
                            Fase 9 (QA & DoD)
                                    │
                            ✅ Slice 1 Selesai
                                    │
                            Mulai Slice 2 →
```

---

*Epic 2 Task Breakdown Slice 1 v1.1 · CV Reka Cipta Indonesia · Juni 2026*
*Berdasarkan: Wireframe Resmi v1.0 · Epic_Doc1 v1.0 · ARCHITECTURE.md v1.0 · DESIGN_SYSTEM v2.0 · epic1_task_breakdown v1.1*
*Dokumen sebelumnya: `epic2_task_breakdown_slice1_beranda.md` v1.0*
