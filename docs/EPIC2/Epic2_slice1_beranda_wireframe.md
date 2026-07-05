# 📄 Spesifikasi Wireframe & Interaksi: Halaman Beranda (Homepage)
**Status:** `SOURCE OF TRUTH` v1.0  
**Referensi Teknis:** ARCHITECTURE.md (`components/sections/`), Epic Doc 2 (Epic 2 — Profil Perusahaan), Design System v2.0  
**Catatan Prioritas:** Semua keputusan UI/UX harus merujuk langsung ke dokumen ini. Jika terdapat detail teknis yang belum tercakup (warna heksadesimal, `border-radius`, easing curve, breakpoint spesifik), gunakan `Design System v2.0` atau `ARCHITECTURE.md §11` sebagai fallback.

---

## 🎯 1. Hero Section
**Komponen:** `components/sections/HeroSection.tsx`  
**Layout:** Centered alignment (flex-col, items-center, text-center). Container max-width standar (`max-w-7xl`).

### 📝 Konten & Hierarki
| Elemen | Teks / Nilai | Gaya / Posisi |
|--------|--------------|---------------|
| Badge | `Tersertifikasi SNI` | Pill-shaped, background `brand-teal-50`, text `brand-teal-600`, border tipis, muncul paling atas |
| Headline (H1) | `Mitra Distribusi Garam SNI Anda: Transparan, Cepat, dan Terverifikasi` | Font-weight `700`, ukuran responsif (`text-4xl md:text-5xl lg:text-6xl`), warna `ink-900` |
| Sub-headline | `Kami menyediakan 5 pilihan garam bersertifikasi untuk kelancaran produksi industri Anda. Mulai dari dokumentasi uji laboratorium hingga legalitas perusahaan, semuanya terbuka untuk Anda. Dapatkan penawaran harga kurang dari 2 menit.` | Font-weight `400`, warna `neutral-600`, max-width `2xl` untuk keterbacaan optimal |
| CTA Primary | `Minta Penawaran Sekarang` | Warna `brand-teal-600`, hover `brand-teal-500`, shadow subtle, link ke `/minta-penawaran` |
| CTA Secondary | `Lihat Produk Kami` | Style `outline`/`ghost`, border `brand-teal-600`, link ke `/produk` |

### 🖼️ Hero Visual
- **Mekanisme:** Image carousel dengan transisi `crossfade` (opacity + slight scale).
- **Kontrol:** Pagination dots di bagian bawah visual (aktif: solid `brand-teal-600`, non-aktif: `neutral-300`).
- **Auto-play:** Interval 5 detik, pause saat hover atau dot diklik.
- **Overlay:** Gradient fade dari bawah ke atas (`bg-gradient-to-t from-background to-transparent`) agar teks tetap terbaca.

### ✨ Animasi & Interaksi
- **Teks Masuk:** `fadeInUp` dengan `staggerChildren` (Badge → Headline → Sub-headline → CTAs).
- **Easing:** `cubic-bezier(0.25, 0.46, 0.45, 0.94)`.
- **Responsif:** Di mobile (`<768px`), layout tetap centered, padding dikurangi, font size menyesuaikan, carousel dots dipindahkan ke bawah gambar.

---

## 📊 2. Stats Bar
**Komponen:** `components/sections/StatsBar.tsx`  
**Layout:** Full-width container, background `neutral-50` atau `brand-teal-50`. Carousel wrapper dengan tombol navigasi `<` `>`.

### 📑 Slide 1: Rekap Statistik (Default)
| Stat | Label | Nilai Awal | Sumber Data |
|------|-------|------------|-------------|
| 1 | Jenis Garam | `5` | Statis / `company_settings` |
| 2 | Mitra Aktif | `6` | Dinamis (CRM) |
| 3 | Kota Dilayani | `9` | Dinamis (CRM) |
| 4 | Jumlah Distribusi (TON) | `353` | Dinamis (CRM) |

- **Grid:** Desktop `4 kolom` (grid-cols-4), Tablet `2×2` atau narrow 4, Mobile `2×2` (grid-cols-2).
- **Animasi Angka:** Gunakan `AnimatedCounter` (referensi `E2-S1-ANIM-03`). Trigger: saat masuk viewport (`IntersectionObserver`). Stagger delay: `0ms → 150ms → 300ms → 450ms` (`staggerConfig.stats`).
- **Sistem:** Nilai harus dapat diedit via `/admin/settings` atau tabel stats terpisah.

### 🗺️ Slide 2: Interactive Point Map
- **Wilayah:** Jawa Timur & Jawa Tengah.
- **Visual:** Peta stylized berbasis titik-titik (`dot-matrix`/`vector SVG`). Titik distribusi aktif berwarna `brand-teal-600`, latar peta `neutral-200`.
- **Interaksi:** 
  - Hover/Klik pada titik → muncul tooltip/popup: `[Nama Kota] • [X Ton Distribusi]`.
  - Tooltip menggunakan `framer-motion` scale + fade.
- **Navigasi:** Tombol panah kiri/kanan untuk berpindah slide. Auto-slide interval 8 detik.

---

## 🧂 3. Product Preview Grid
**Komponen:** `components/sections/ProductsPreview.tsx` → `components/blocks/ProductCard.tsx`  
**Layout:** Horizontal scroll container di mobile, `grid-cols-5` di desktop, gap `lg`.

### 📦 Struktur Kartu Produk (×5)
| Elemen | Detail |
|--------|--------|
| Foto | Aspect ratio `4:3`, object-cover, border-radius `sm`, shadow-sm |
| Nama Produk | Font-weight `600`, ukuran `lg` |
| Spesifikasi Singkat | 1 baris, font-size `sm`, warna `neutral-500` (contoh: `NaCl 98.3% • SPO/M`) |
| Tombol Navigasi | Teks `Lihat Detail →`, style `text-sm`, opacity `60%`, hover `100%` + underline, link ke `/produk/[slug]` |

- **Interaksi:** Kartu hover → `transform: translateY(-4px)`, shadow meningkat.
- **Responsif:** Mobile → horizontal snap scroll (`overflow-x-auto`, `snap-x`), scroll indicator dots opsional.

---

## ⚙️ 4. Cara Kerja (How It Works)
**Komponen:** `components/sections/HowItWorks.tsx`  
**Konsep:** Scroll-driven sticky progress section.

### 🖼️ Struktur Visual
1. **Background Image:** Full-width, tinggi `100vh`, tetap (`sticky` atau `fixed`), menampilkan foto kegiatan perusahaan.
2. **Overlay Panel:** Background solid (`neutral-50` atau `brand-teal-50`).
   - Desktop: Muncul dari kiri, menutupi `50%` lebar gambar.
   - Mobile: Muncul dari bawah, menutupi `50%` tinggi gambar.
   - Animasi masuk: `slideIn` dengan `ease-out` saat panel masuk viewport.

### 📝 Konten dalam Panel
- **Heading:** `Cara Kami Bekerja` (atau penyesuaian sesuai Fondasi Brand §3.2).
- **Sub-teks:** 1 paragraf singkat menjelaskan pendekatan kerja (transparan, terukur, responsif).
- **4 Poin Proses:**
  1. Hubungi Kami
  2. Konsultasi Kebutuhan
  3. Pengiriman Sampel
  4. Distribusi Rutin *(catatan: dikoreksi dari "Ruin" → "Rutin")*

### 🔄 Interaksi Scroll-Driven
- **Mekanisme:** Setiap scroll `25%` dari section tinggi → mengaktifkan 1 poin.
- **State Aktif:** Heading poin membesar, warna `ink-900`, muncul deskripsi singkat di bawahnya.
- **State Tidak Aktif:** Opacity `40%`, ukuran font normal.
- **Progress Line:** Garis vertikal di samping kiri poin, panjang penuh section. Segmen aktif berubah warna `brand-teal-600`, non-aktif `neutral-200`.
- **Teknis:** Gunakan `useScroll` + `useTransform` (Framer Motion) atau `IntersectionObserver` dengan threshold bertingkat.

---

## 🏭 5. Industri yang Dilayani
**Komponen:** `components/sections/IndustriesGrid.tsx`  
**Layout:** `grid-cols-3` (desktop), `grid-cols-2` (mobile), gap `lg`. Total 6 item.

| Sektor |
|--------|
| Makanan dan Minuman |
| Pengasinan Ikan |
| Water Treatment |
| Pakan Ternak |
| Pulp & Kertas |
| Penyamakan Kulit |

### 🎨 Komponen Item
- **Ikon:** SVG line-art, ukuran `48×48px`, stroke `brand-teal-600`.
- **Teks:** Font-weight `500`, alignment center.
- **Hover:** `scale(1.05)`, background `neutral-50`, icon fill subtle.
- **Aksi:** Klik → navigasi ke halaman detail sektor *(route placeholder: `/industri/[slug]` atau modal detail)*.

---

## 🤝 6. Credibility Section (Mitra & Klien)
**Komponen:** `components/sections/CredibilitySection.tsx`  
**Layout:** Full-width marquee, padding vertikal `py-16`.

### 📜 Konten Marquee
- **Item:** Logo perusahaan + Nama + Jenis Industri (dalam 1 kotak).
- **Daftar (Contoh):** PT. Surabaya Mekabox, PT. Sejati Tritunggal Indah, PT. Cakrawala Cemerlang Box, Unit Pengolahan Garam KKP, dll.

### 🎞️ Animasi & Styling
- **Marquee:** Infinite horizontal scroll ke kiri (`translateX(0) → translateX(-50%)`). Kecepatan konstan `20s/loop`.
- **Pause:** `animation-play-state: paused` saat hover.
- **Kotak Item:** 
  - Background sama dengan section (`bg-white` atau `bg-neutral-50`).
  - Border: `none`.
  - Shadow: Hanya atas & samping (`shadow-sm`), bawah memudar menggunakan `linear-gradient` overlay dari shadow → transparan (`h-8`, opacity fade `75% → 0%`).
  - Padding internal `px-6 py-4`, gap antar item `8`.
- **Duplikasi:** Clone set item pertama ke akhir array untuk seamless loop.

---

## 📣 7. CTA Section Penutup
**Komponen:** `components/sections/CTASection.tsx`  
**Layout:** Centered, padding `py-20`, background `brand-teal-600` atau gradient `teal → dark-teal`.

### 📝 Konten
| Elemen | Teks | Gaya | Link |
|--------|------|------|------|
| Heading (H2) | `Siap Jadi Mitra Distribusi?` | `text-3xl md:text-4xl`, warna `white`, font-weight `700` | — |
| CTA Primary | `Minta Penawaran` | Background `white`, text `brand-teal-600`, hover `bg-neutral-100` | `/minta-penawaran` |
| CTA Secondary | `Hubungi Kami` | Border `white`, text `white`, hover `bg-white/10` | `/kontak` |

- **Responsif:** Mobile → tombol stacked vertikal (`flex-col`), desktop → horizontal (`flex-row`), gap `4`.
- **Margin:** Auto, max-width `xl`.

---

## 🛠️ Catatan Implementasi untuk Developer

| Aspek | Panduan Teknis |
|-------|----------------|
| **Komponen** | Semua section terdaftar di `components/sections/`. Gunakan barrel export di `index.ts`. |
| **Animasi** | Gunakan `Framer Motion` untuk scroll-triggered, hover, dan carousel. Referensi `E2-S1-ANIM-03` untuk `AnimatedCounter`. |
| **Data Dinamis** | Stats & Credibility: fetch dari Supabase (`company_settings` / tabel baru). Cache SSG/ISR sesuai `ARCHITECTURE.md §6`. |
| **Responsif** | Breakpoint standar Tailwind: `sm` (640), `md` (768), `lg` (1024), `xl` (1280). Mobile-first approach. |
| **Aksesibilitas** | Semua CTA & link harus memiliki `aria-label`. Counter harus memiliki `aria-live="polite"`. Map tooltip harus navigable via keyboard. |
| **Fallback** | Jika animasi berat, tambahkan `prefers-reduced-motion` media query → disable transform, tampilkan static layout. |

---
📥 **Dokumen ini siap digunakan sebagai acuan utama pengembangan frontend.**  
Jika terdapat ambiguitas teknis (misal: easing curve spesifik, token warna fallback, atau struktur JSON untuk stats), konsultasikan ke `ARCHITECTURE.md` atau `Design System v2.0` sesuai hierarki yang telah ditetapkan.