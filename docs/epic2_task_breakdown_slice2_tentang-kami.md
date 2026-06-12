# Epic 2 — Profil Perusahaan: SLICE 2 — Halaman Tentang Kami (`/tentang-kami`)
## CV Reka Cipta Indonesia · Web Platform & CRM System

> **Versi:** 1.0 &emsp;
> **Slice:** 2 dari 3 &emsp;
> **Prasyarat:** Slice 1 (Beranda) selesai dan semua DoD-nya ✅ &emsp;
> **Status:** Draft · Juni 2026

---

## Posisi Slice Ini dalam Epic 2

| Slice | Halaman | Status |
|---|---|---|
| Slice 1 | Halaman Beranda (`/`) — tabel `company_settings`, animasi utilities | ✅ Selesai |
| **Slice 2** ← *dokumen ini* | **Halaman Tentang Kami (`/tentang-kami`) — Storage bucket `legal-docs`, constants data** | 🔄 In Progress |
| Slice 3 | Halaman Kontak (`/kontak`) + Admin `/admin/settings` | ⏳ Berikutnya |

---

## Prasyarat: Output Slice 1 yang Dipakai di Slice Ini

| Output Slice 1 | File | Dipakai oleh |
|---|---|---|
| `RevealWrapper` component | `components/animations/RevealWrapper.tsx` | Semua section Tentang Kami |
| `useScrollReveal` hook | `hooks/use-scroll-reveal.ts` | Dipakai oleh RevealWrapper |
| Supabase server client | `lib/supabase/server.ts` | Route Handler signed URL (pakai `SUPABASE_SERVICE_KEY`) |
| `IndustriesGrid` constants pattern | `components/sections/IndustriesGrid.tsx` | Referensi pattern list-render statis |
| Skeleton components | `components/ui/skeletons/` | Loading state Tentang Kami |
| shadcn `Badge` | `components/ui/badge.tsx` | Jabatan badge pada TeamMember card |

---

## Tujuan Slice 2

Menghadirkan Halaman Tentang Kami yang membuktikan legitimasi dan identitas perusahaan kepada calon mitra. Halaman ini menampilkan sejarah perusahaan, visi dan misi, struktur tim, serta dokumen legalitas yang bisa dilihat langsung dari browser.

Setelah slice ini selesai:
- Halaman `/tentang-kami` dapat diakses di staging dengan semua 4 section tampil
- Dokumen legalitas (Akta Notaris, NIB, NPWP, Kemenkumham) tersimpan di Supabase Storage `legal-docs` (private bucket)
- Klik "Lihat" pada document card → modal terbuka, PDF ditampilkan via signed URL
- Foto tim tampil dengan efek hover yang sesuai Design System
- Halaman sepenuhnya statis (SSG) — tidak ada API call ke FastAPI

**Demo ke klien setelah Slice 2 selesai:** Buka `/tentang-kami` → scroll melewati timeline sejarah → visi misi → tim 4 orang dengan foto → klik "Lihat" pada salah satu dokumen → modal terbuka dengan PDF.

---

## Keputusan Arsitektur Slice 2

Keputusan berikut diambil sebelum task engineering dimulai dan harus terdokumentasi:

| Keputusan | Pilihan | Alasan |
|---|---|---|
| Sumber data konten halaman | Hardcoded di `constants/company-profile.ts` | Timeline, Visi, Misi, Tim = data foundational yang sangat jarang berubah. Tidak perlu DB. |
| Storage dokumen legal | Supabase Storage `legal-docs` (private bucket) | Dokumen ini seharusnya tidak bisa di-link langsung — harus melalui signed URL yang expire |
| Cara generate signed URL | Next.js Route Handler `/api/legal-docs/[filename]` | Memisahkan concern: halaman SSG tetap cache-friendly, signed URL di-generate fresh on-demand per klik |
| Foto tim | `public/images/team/` (static asset) | Foto tim bukan konten yang perlu CMS — cukup commit bersama kode. Supabase Storage tidak perlu untuk ini. |
| Komponen modal | shadcn `<Dialog>` (baru diinstall di slice ini) | Konsisten dengan design system — bukan custom modal |
| Rendering strategy | SSG `revalidate: 86400` | Konten Tentang Kami berubah sangat jarang (sekali setahun atau kurang) |
| CRM Admin | **Tidak ada di Slice 2** | Konten Tentang Kami diupdate via deployment, bukan via admin panel |

---

## Ringkasan Per Layer

| # | Layer | Tasks |
|---|---|:---:|
| 1 | UX & Information Architecture | 5 |
| 2 | User Stories | 4 |
| 3a | Engineering · Storage & Setup | 3 |
| 3b | Engineering · Constants Data | 1 |
| 3c | Engineering · Route Handler | 1 |
| 3d | Engineering · Frontend | 7 |
| 4 | QA & Observability | 5 |
| | **Total Slice 2** | **26** |

---

## Layer 1 · UX & Information Architecture

---

#### `E2-S2-UX-01` — Wireframe Page Header dan Timeline Sejarah Perusahaan
**Priority:** 🔴 HIGH &emsp; **Tags:** `Design` · `Frontend`

Halaman Tentang Kami tidak memiliki hero section besar seperti Beranda — cukup sebuah page header sederhana, lalu langsung ke konten. Timeline adalah section pembuka yang paling emosional.

**Page Header (Inner Page Hero):**
- [ ] Layout: full-width section, tinggi ±280–350px, background solid `ink-900` atau gradient `bg-brand-gradient`
- [ ] Konten: heading besar `"Tentang Kami"` (`<h1>`, putih), sub-teks singkat 1 kalimat tentang identitas perusahaan, breadcrumb opsional (Beranda → Tentang Kami)
- [ ] Komponen ini akan dipakai ulang di Kontak page (Slice 3) dengan konten berbeda — rancang sebagai generic `InnerPageHero` yang menerima props: `title`, `subtitle`, `breadcrumb?`
- [ ] Animasi: headline menggunakan `page-transition` CSS class (dari `globals.css`) untuk smooth masuk

**Timeline Sejarah Perusahaan:**
- [ ] **Data 3 milestone:**
  - `2018` — "Studi Banding di Sentra Garam Madura — Tim RCI melakukan survei langsung ke Kalianget & Sampang untuk memahami ekosistem petani garam lokal."
  - `2019` — "Pendirian UD Kreasi Anak Bangsa — Langkah awal memasuki industri distribusi garam dengan skala usaha dagang perorangan."
  - `2020` — "Transformasi menjadi CV Reka Cipta Indonesia (17 November) — Pendirian resmi badan hukum CV dengan legalitas penuh dari Kemenkumham."
- [ ] Layout desktop: timeline horizontal dengan garis penghubung dan tahun di atas (atau bawah) garis
- [ ] Layout mobile: timeline vertikal dengan garis di kiri dan konten di kanan
- [ ] Setiap node: lingkaran `brand-teal-600` + tahun + judul + deskripsi
- [ ] Animasi: setiap node reveal dengan `reveal-left` (kiri ke kanan) dengan stagger 200ms antar node

> **Output:** Spesifikasi layout dan data timeline yang disepakati sebelum coding

---

#### `E2-S2-UX-02` — Wireframe Visi & Misi
**Priority:** 🔴 HIGH &emsp; **Tags:** `Design` · `Frontend`

Section yang menampilkan identitas aspirasional perusahaan. Visi harus tampil menonjol secara visual.

**Data final (dari Fondasi Brand v1.0):**

*Visi:* "Menjadi distributor garam terpercaya pilihan industri menengah Indonesia, yang dikenal karena konsistensi kualitas, transparansi dokumentasi, dan komitmen jangka panjang terhadap petani lokal."

*5 Poin Misi (dari Fondasi Brand — CATATAN: Epic Doc menyebut "4 poin", tapi Fondasi Brand v1.0 mendefinisikan 5 poin misi yang valid):*
1. Jaminan kualitas yang bisa diverifikasi
2. Kemitraan yang adil dengan petani
3. Respons yang tidak membuat menunggu
4. Distribusi yang menjangkau
5. Peningkatan standar yang berkelanjutan

- [ ] Spesifikasikan layout: dua kolom di desktop (Visi kiri, Misi kanan) atau satu kolom stacked
- [ ] **Visi:** tampil menonjol — font besar (`text-2xl md:text-3xl`), italic, warna `ink-700`, dengan tanda kutip visual (elemen dekoratif `"`) berwarna `brand-teal-600`
- [ ] **Misi:** list 5 poin dengan ikon `CheckCircle` dari Lucide React, warna `brand-teal-600`
- [ ] Background section: `bg-teal-50` atau `bg-sand-50/30` — beda dari Timeline section di atas
- [ ] Animasi: Visi menggunakan `reveal-blur` (lebih dramatis), Misi menggunakan `reveal-up` dengan `reveal-stagger`

---

#### `E2-S2-UX-03` — Wireframe Struktur Organisasi (Team Cards)
**Priority:** 🟡 MED &emsp; **Tags:** `Design` · `Frontend`

4 kartu tim yang menampilkan foto, nama, dan jabatan.

**Data 4 anggota tim (dari company profile):**

| Nama | Jabatan | File foto |
|---|---|---|
| Widril Fakki | Komisaris | `public/images/team/widril-fakki.jpg` |
| Abdul Majid Abdillah | Direktur | `public/images/team/abdul-majid.jpg` |
| Salman Al Halili | Manager Keuangan | `public/images/team/salman-al-halili.jpg` |
| Irwan Sugianto | Manager Pemasaran | `public/images/team/irwan-sugianto.jpg` |

**Spesifikasi card:**
- [ ] Foto: aspect ratio 1:1 (square), border-radius `rounded-xl`, ukuran 240×240px atau sesuai grid. **Wajib sediakan fallback** jika foto belum ada: avatar initial (huruf pertama nama) dengan `bg-teal-600 text-white rounded-xl`
- [ ] **Hover effect:** gunakan `.photo-teal-hover` dari Design System §19.5. CSS ini belum ada di `globals.css` — task engineering akan menambahkannya (lihat `E2-S2-FE-05`). Effect: foto sedikit zoom + overlay teal tipis opacity 0.3 saat hover
- [ ] Nama: `font-semibold text-ink-700`, di bawah foto
- [ ] Jabatan: shadcn `<Badge>` variant outline dengan warna `teal`, di bawah nama
- [ ] Grid: `grid-cols-2 md:grid-cols-4` dengan gap
- [ ] Animasi: setiap card `reveal-scale` dengan stagger 100ms

---

#### `E2-S2-UX-04` — Wireframe Dokumen Legalitas (grid + modal behavior)
**Priority:** 🔴 HIGH &emsp; **Tags:** `Design` · `Frontend` · `Security`

Section paling teknis di Tentang Kami — dokumen tersimpan di private bucket, ditampilkan via signed URL dalam modal.

**Data 4 dokumen:**

| Nama Tampil | Filename di Bucket | Nomor/Info |
|---|---|---|
| Akta Notaris | `akta-notaris.pdf` | Dokumen pendirian |
| NIB (Nomor Induk Berusaha) | `nib.pdf` | No. `0280010102479` |
| NPWP Perusahaan | `npwp.pdf` | `96.674.473.2-609.000` |
| Status Hukum Kemenkumham | `kemenkumham.pdf` | Legalitas penuh |

**Grid card spec:**
- [ ] 4 kartu dalam `grid-cols-2 md:grid-cols-4`
- [ ] Setiap kartu: thumbnail placeholder (ikon `FileText` dari Lucide, `bg-neutral-100 rounded-xl`, ukuran 120×160px) + nama dokumen + nomor (jika ada) + tombol "Lihat" (Button variant outline)
- [ ] Thumbnail: bisa gunakan gambar statis dari `public/images/legal-thumbnails/` jika tersedia — jika tidak, pakai ikon placeholder

**Modal behavior (penting untuk UX):**
- [ ] Klik tombol "Lihat" → komponen Client Component (`LegalDocModal`) memanggil `GET /api/legal-docs/{filename}`
- [ ] Selama fetch URL (loading): tombol "Lihat" berubah ke disabled state + spinner kecil
- [ ] Setelah URL kembali: modal shadcn `<Dialog>` terbuka dengan:
  - Header: nama dokumen
  - Body: `<iframe src={signedUrl} ...>` dengan fallback link jika iframe tidak bisa render
  - Footer: tombol "Unduh" (link ke signedUrl, target blank) + tombol "Tutup"
- [ ] Modal size: `max-w-3xl`, tinggi konten `min-h-[70vh]` agar dokumen terlihat cukup jelas
- [ ] Error state: jika fetch URL gagal → tampilkan toast atau error inline di dalam modal

---

#### `E2-S2-UX-05` — SEO metadata spec untuk Tentang Kami
**Priority:** 🟡 MED &emsp; **Tags:** `SEO` · `Frontend`

- [ ] **`<title>`:** `Tentang Kami — Sejarah & Legalitas CV Reka Cipta Indonesia`
- [ ] **`<meta description>`:** Maks 160 karakter. Contoh: "CV Reka Cipta Indonesia, distributor garam SNI sejak 2020. Legalitas penuh: Akta Notaris, NIB, NPWP, Kemenkumham. Temui tim kami di Surabaya."
- [ ] **`canonical`:** URL production `/tentang-kami`
- [ ] **Open Graph:** `og:title`, `og:description`, `og:image` (gunakan `public/og-image.jpg` dari Beranda atau buat yang khusus), `og:type: website`
- [ ] **Structured data (opsional tapi direkomendasikan):** `Organization` schema JSON-LD — memberikan informasi terstruktur ke Google tentang identitas perusahaan:
  ```json
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "CV Reka Cipta Indonesia",
    "foundingDate": "2020-11-17",
    "address": { "@type": "PostalAddress", "addressLocality": "Surabaya", "addressCountry": "ID" }
  }
  ```
- [ ] Update `app/sitemap.ts` (dibuat di Slice 1): tambahkan `/tentang-kami` dengan `priority: 0.8`, `changeFrequency: 'yearly'`

---

## Layer 2 · User Stories

---

#### `E2-S2-US-01` — Visitor memahami perjalanan dan asal-usul perusahaan
**Priority:** 🟡 MED &emsp; **Tags:** `Frontend` · `Content`

*As a prospective buyer, I want to understand the history of RCI so that I can judge whether they are an established, trustworthy company.*

**Acceptance Criteria:**
- [ ] Timeline 3 milestone tampil dalam urutan kronologis (2018, 2019, 2020)
- [ ] Setiap milestone memiliki tahun, judul, dan deskripsi yang benar sesuai `constants/company-profile.ts`
- [ ] Di mobile: timeline vertikal, teks terbaca tanpa horizontal scroll
- [ ] Animasi timeline berjalan saat section masuk viewport (sekali saja)

---

#### `E2-S2-US-02` — Visitor memahami visi dan misi perusahaan
**Priority:** 🟡 MED &emsp; **Tags:** `Frontend` · `Content`

*As a procurement manager, I want to read the company's mission so that I know if their values align with my company's supplier standards.*

**Acceptance Criteria:**
- [ ] Visi ditampilkan secara menonjol secara visual — tidak boleh sama formatnya dengan list misi
- [ ] Semua 5 poin misi ditampilkan lengkap dengan teks yang sesuai Fondasi Brand v1.0
- [ ] Konten tidak ada typo atau kalimat yang terpotong di mobile

---

#### `E2-S2-US-03` — Visitor melihat siapa orang di balik perusahaan
**Priority:** 🟡 MED &emsp; **Tags:** `Frontend`

*As a buyer, I want to see the people behind RCI so that I feel more comfortable building a business relationship.*

**Acceptance Criteria:**
- [ ] Semua 4 anggota tim tampil dengan nama dan jabatan yang benar
- [ ] Jika foto tersedia: foto tampil dalam card dengan hover effect
- [ ] Jika foto belum tersedia: avatar initial (inisial nama) tampil sebagai fallback — **halaman tidak boleh broken hanya karena foto belum ada**
- [ ] Jabatan tampil dalam format yang konsisten (shadcn Badge)

---

#### `E2-S2-US-04` — Visitor memverifikasi legalitas perusahaan
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` · `Security`

*As a procurement manager doing vendor due diligence, I want to view RCI's official legal documents so that I can verify they are a legitimate registered company.*

**Acceptance Criteria:**
- [ ] 4 dokumen legal tampil dalam grid dengan judul dan nomor yang benar
- [ ] Klik "Lihat" pada Akta Notaris → modal terbuka dengan dokumen ter-render
- [ ] Klik "Lihat" pada NIB → modal terbuka dengan dokumen NIB (nomor `0280010102479` terlihat jelas)
- [ ] Selama loading signed URL: tombol "Lihat" menampilkan loading state (tidak freeze atau error)
- [ ] Signed URL hanya valid 1 jam — setelah expired, klik "Lihat" ulang akan generate URL baru
- [ ] Tombol "Unduh" di modal berfungsi dan mengunduh PDF

---

## Layer 3 · Engineering Sub-tasks

Urutan pengerjaan wajib: **3a (Storage & Setup) → 3b (Constants) → 3c (Route Handler) → 3d (Frontend)**

---

### 3a — Storage & Setup

#### `E2-S2-STG-01` — Buat bucket `legal-docs` via migration + RLS
**Priority:** 🔴 HIGH &emsp; **Tags:** `Database` · `Storage` · `Blocker`

Membuat Supabase Storage bucket untuk dokumen legalitas yang bersifat private (tidak bisa diakses langsung via URL publik).

**Konteks:**
- Bucket ini sudah direncanakan di `ARCHITECTURE.md §13.3`: `legal-docs → ❌ private (signed URL), auth write`
- Signed URL dibuat via Route Handler menggunakan `SUPABASE_SERVICE_KEY` (server-only, tidak pernah expose ke browser)
- Semua perubahan schema via migration file — aturan keras dari `ARCHITECTURE.md §13.4`

- [ ] Buat migration baru: `npx supabase migration new create_legal_docs_bucket`
- [ ] Tulis SQL berikut:

```sql
-- Buat storage bucket legal-docs (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'legal-docs',
  'legal-docs',
  false,          -- private: tidak bisa diakses via URL langsung
  10485760,       -- 10MB max file size
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: hanya authenticated user yang bisa upload
CREATE POLICY "auth_insert_legal_docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'legal-docs');

-- RLS: hanya authenticated user yang bisa read (untuk admin)
-- Note: Public download menggunakan signed URL via service role — bypass RLS
CREATE POLICY "auth_read_legal_docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'legal-docs');

-- RLS: hanya authenticated user yang bisa hapus
CREATE POLICY "auth_delete_legal_docs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'legal-docs');
```

- [ ] Apply migration: `npx supabase db push`
- [ ] Verifikasi di Supabase dashboard → Storage → bucket `legal-docs` muncul dengan ikon kunci (private)
- [ ] Test: coba akses URL langsung `https://{project}.supabase.co/storage/v1/object/public/legal-docs/test.pdf` → harus return 400/403 (bukan 200)

> **Output:** File `supabase/migrations/{timestamp}_create_legal_docs_bucket.sql` ter-commit ke Git

---

#### `E2-S2-STG-02` — Upload dokumen legal + siapkan folder foto tim
**Priority:** 🔴 HIGH &emsp; **Tags:** `Storage` · `Content`

Upload file aktual ke storage dan siapkan struktur folder untuk foto tim.

**Upload ke Supabase Storage (bucket `legal-docs`):**

File yang harus di-upload dengan nama PERSIS seperti ini (karena dipakai oleh Route Handler whitelist):

| Filename di bucket | Dokumen |
|---|---|
| `akta-notaris.pdf` | Akta Notaris pendirian CV |
| `nib.pdf` | Nomor Induk Berusaha (NIB) |
| `npwp.pdf` | NPWP Perusahaan |
| `kemenkumham.pdf` | Status Hukum Kemenkumham |

- [ ] Dapatkan file PDF dokumen dari klien/pemilik perusahaan
- [ ] Upload via Supabase dashboard → Storage → `legal-docs` → Upload files
- [ ] Verifikasi semua 4 file ter-upload dengan nama yang benar (case-sensitive)
- [ ] **Jika dokumen belum tersedia:** buat PDF placeholder sementara per dokumen (cukup 1 halaman dengan teks "PLACEHOLDER — {nama dokumen}") — halaman tidak boleh broken saat demo

**Siapkan folder foto tim di `public/`:**
- [ ] Buat folder `public/images/team/`
- [ ] Dapatkan foto dari klien untuk ke-4 anggota tim. Nama file yang diharapkan:
  - `widril-fakki.jpg`
  - `abdul-majid.jpg`
  - `salman-al-halili.jpg`
  - `irwan-sugianto.jpg`
- [ ] Optimasi foto: resize ke max 400×400px, compress ke < 100KB menggunakan tools seperti `squoosh.app` atau `sharp` CLI
- [ ] **Jika foto belum tersedia:** buat folder dan `public/images/team/.gitkeep` saja — komponen `TeamMember` akan gunakan fallback avatar initials otomatis

**Legal doc thumbnail (opsional):**
- [ ] Buat folder `public/images/legal-thumbnails/`
- [ ] Jika tersedia: simpan thumbnail gambar (jpg) dari setiap dokumen untuk preview sebelum modal dibuka. Nama: `akta-notaris.jpg`, `nib.jpg`, `npwp.jpg`, `kemenkumham.jpg`
- [ ] Jika tidak tersedia: komponen `LegalDocCard` akan gunakan ikon placeholder

---

#### `E2-S2-SETUP-01` — Install shadcn `Dialog` dan `AspectRatio`
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` · `Blocker`

Dialog dibutuhkan untuk modal dokumen legal. AspectRatio dibutuhkan untuk iframe PDF preview yang proporsional.

**Konteks:**
- shadcn/ui components dari Epic 1 yang sudah terinstall: `Button Input Label Form Card Skeleton Badge Separator DropdownMenu` (dari `ARCHITECTURE.md §11.3`)
- Component shadcn yang baru diinstall di Epic 2 Slice 2: `Dialog`, `AspectRatio`
- **JANGAN** edit file di `components/ui/` secara langsung — ini adalah komponen shadcn yang di-generate

- [ ] Install: `npx shadcn@latest add dialog`
- [ ] Install: `npx shadcn@latest add aspect-ratio`
- [ ] Verifikasi: file `components/ui/dialog.tsx` dan `components/ui/aspect-ratio.tsx` muncul
- [ ] Update `ARCHITECTURE.md §11.3` — tambahkan `Dialog AspectRatio` ke daftar komponen shadcn yang terinstall
- [ ] Smoke test: render `<Dialog><DialogTrigger>Open</DialogTrigger><DialogContent>Test</DialogContent></Dialog>` di halaman development → pastikan modal terbuka/tutup dengan benar

---

### 3b — Constants Data

#### `E2-S2-CONST-01` — Buat `constants/company-profile.ts`
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` · `Content` · `Blocker`

Semua data statis Tentang Kami terpusat di satu file constants untuk kemudahan update dan konsistensi konten.

**Konteks:**
- File baru: `constants/company-profile.ts`
- Naming convention: file `kebab-case.ts`, exported arrays/objects `SCREAMING_SNAKE_CASE` (dari `ARCHITECTURE.md §9.2`)
- Data ini adalah single source of truth — tidak ada data konten yang hardcode di komponen

- [ ] Buat `constants/company-profile.ts`:

```typescript
// constants/company-profile.ts
// Single source of truth untuk semua data statis halaman Tentang Kami
// Update file ini untuk mengubah konten halaman — tidak perlu edit komponen

// ─── Timeline Sejarah ─────────────────────────────────────────────────────
export interface TimelineMilestone {
  year: number
  title: string
  description: string
}

export const COMPANY_TIMELINE: TimelineMilestone[] = [
  {
    year: 2018,
    title: 'Studi Banding di Sentra Garam Madura',
    description:
      'Tim melakukan survei langsung ke Kalianget & Sampang untuk memahami ekosistem petani garam lokal dan membuka jaringan kemitraan pertama.',
  },
  {
    year: 2019,
    title: 'Pendirian UD Kreasi Anak Bangsa',
    description:
      'Langkah awal memasuki industri distribusi garam dengan skala usaha dagang perorangan, membangun pengalaman operasional dan kepercayaan mitra pertama.',
  },
  {
    year: 2020,
    title: 'Transformasi menjadi CV Reka Cipta Indonesia',
    description:
      'Pendirian resmi badan hukum CV pada 17 November 2020, dengan legalitas penuh dari Kemenkumham. Tonggak komitmen jangka panjang dalam industri distribusi garam nasional.',
  },
]

// ─── Visi & Misi ─────────────────────────────────────────────────────────
// Sumber: Fondasi Brand v1.0
export const COMPANY_VISION =
  'Menjadi distributor garam terpercaya pilihan industri menengah Indonesia, yang dikenal karena konsistensi kualitas, transparansi dokumentasi, dan komitmen jangka panjang terhadap petani lokal.'

export interface MissionPoint {
  title: string
  description: string
}

export const COMPANY_MISSION: MissionPoint[] = [
  {
    title: 'Jaminan kualitas yang bisa diverifikasi',
    description:
      'Menyediakan portofolio garam multi-produk yang terstandarisasi SNI, lengkap dengan dokumentasi hasil uji laboratorium yang dapat diakses oleh setiap mitra kapan saja.',
  },
  {
    title: 'Kemitraan yang adil dengan petani',
    description:
      'Membangun hubungan distribusi yang konsisten dan adil dengan petani garam lokal di sentra produksi Madura dan Sampang, sebagai bentuk komitmen terhadap keberlanjutan rantai pasok domestik.',
  },
  {
    title: 'Respons yang tidak membuat menunggu',
    description:
      'Merespons setiap kebutuhan mitra — dari pertanyaan awal hingga penawaran harga — dengan standar kecepatan dan transparansi tertinggi.',
  },
  {
    title: 'Distribusi yang menjangkau',
    description:
      'Membangun jaringan distribusi yang efisien untuk menjamin ketersediaan garam berkualitas di wilayah-wilayah yang dibutuhkan mitra, tidak hanya di Surabaya dan sekitarnya.',
  },
  {
    title: 'Peningkatan standar yang berkelanjutan',
    description:
      'Terus meningkatkan standar dokumentasi, sertifikasi, dan layanan seiring pertumbuhan perusahaan — karena standar hari ini adalah minimum masa depan.',
  },
]

// ─── Struktur Organisasi ─────────────────────────────────────────────────
export interface TeamMember {
  name: string
  position: string
  photoPath: string  // relative to public/ — contoh: '/images/team/widril-fakki.jpg'
  initials: string   // fallback jika foto tidak tersedia
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    name: 'Widril Fakki',
    position: 'Komisaris',
    photoPath: '/images/team/widril-fakki.jpg',
    initials: 'WF',
  },
  {
    name: 'Abdul Majid Abdillah',
    position: 'Direktur',
    photoPath: '/images/team/abdul-majid.jpg',
    initials: 'AM',
  },
  {
    name: 'Salman Al Halili',
    position: 'Manager Keuangan',
    photoPath: '/images/team/salman-al-halili.jpg',
    initials: 'SH',
  },
  {
    name: 'Irwan Sugianto',
    position: 'Manager Pemasaran',
    photoPath: '/images/team/irwan-sugianto.jpg',
    initials: 'IS',
  },
]

// ─── Dokumen Legalitas ────────────────────────────────────────────────────
export interface LegalDocument {
  id: string          // unique key, dipakai sebagai filename di bucket
  title: string       // nama tampil di UI
  subtitle?: string   // nomor dokumen jika ada
  filename: string    // nama file di Supabase Storage bucket 'legal-docs'
  thumbnailPath?: string  // path ke thumbnail di public/ (opsional)
}

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    id: 'akta-notaris',
    title: 'Akta Notaris',
    subtitle: 'Pendirian CV',
    filename: 'akta-notaris.pdf',
    thumbnailPath: '/images/legal-thumbnails/akta-notaris.jpg',
  },
  {
    id: 'nib',
    title: 'NIB',
    subtitle: 'No. 0280010102479',
    filename: 'nib.pdf',
    thumbnailPath: '/images/legal-thumbnails/nib.jpg',
  },
  {
    id: 'npwp',
    title: 'NPWP Perusahaan',
    subtitle: '96.674.473.2-609.000',
    filename: 'npwp.pdf',
    thumbnailPath: '/images/legal-thumbnails/npwp.jpg',
  },
  {
    id: 'kemenkumham',
    title: 'Status Hukum Kemenkumham',
    subtitle: 'Legalitas Penuh',
    filename: 'kemenkumham.pdf',
    thumbnailPath: '/images/legal-thumbnails/kemenkumham.jpg',
  },
]
```

- [ ] Verifikasi tidak ada TypeScript error: `npx tsc --noEmit`
- [ ] Export semua types yang dibutuhkan dari `types/index.ts` atau import langsung dari constants file di komponen

---

### 3c — Route Handler

#### `E2-S2-RH-01` — Route Handler: `GET /api/legal-docs/[filename]`
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` · `Security` · `Blocker`

Next.js Route Handler yang men-generate signed URL untuk dokumen legal dari private bucket. Dipanggil oleh Client Component `LegalDocModal` saat user klik "Lihat".

**Konteks:**
- File baru: `app/api/legal-docs/[filename]/route.ts`
- Menggunakan `SUPABASE_SERVICE_KEY` (bukan anon key) — service role dapat bypass RLS dan generate signed URL untuk private bucket
- `SUPABASE_SERVICE_KEY` adalah server-only env var — **tidak pernah ada `NEXT_PUBLIC_` prefix** (dari `ARCHITECTURE.md §10.1`)
- Whitelist filenames wajib: mencegah path traversal attack — hanya 4 filename valid yang diizinkan
- Signed URL expiry: `3600` detik (1 jam) — cukup untuk satu sesi review dokumen

**Implementasi:**

- [ ] Buat folder: `app/api/legal-docs/[filename]/`
- [ ] Buat file `app/api/legal-docs/[filename]/route.ts`:

```typescript
// app/api/legal-docs/[filename]/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Whitelist: HANYA filename ini yang valid — mencegah path traversal
const VALID_FILENAMES = [
  'akta-notaris.pdf',
  'nib.pdf',
  'npwp.pdf',
  'kemenkumham.pdf',
]

// Service role client — HANYA di server, JANGAN pernah expose ke client
// Menggunakan supabase langsung (bukan createClient dari @supabase/ssr)
// karena ini Route Handler yang butuh service role bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!  // server-only — tidak pernah NEXT_PUBLIC_
)

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  const { filename } = params

  // Security: validasi filename ada di whitelist
  if (!VALID_FILENAMES.includes(filename)) {
    return NextResponse.json(
      { error: 'Document not found', code: 'INVALID_FILENAME' },
      { status: 404 }
    )
  }

  const { data, error } = await supabaseAdmin.storage
    .from('legal-docs')
    .createSignedUrl(filename, 3600) // 1 jam expiry

  if (error || !data?.signedUrl) {
    console.error('[legal-docs] Failed to create signed URL:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil dokumen', code: 'SIGNED_URL_ERROR' },
      { status: 500 }
    )
  }

  // Cache response singkat: 5 menit di browser (signed URL valid 1 jam)
  return NextResponse.json(
    { url: data.signedUrl },
    {
      headers: {
        'Cache-Control': 'private, max-age=300',
      },
    }
  )
}
```

- [ ] Test di local: `curl http://localhost:3000/api/legal-docs/nib.pdf` → harus return `{ url: "https://..." }` dengan signed URL
- [ ] Test invalid filename: `curl http://localhost:3000/api/legal-docs/../../etc/passwd` → harus return 404
- [ ] Test di staging: URL dari response harus bisa dibuka di browser dan menampilkan PDF
- [ ] Verifikasi: signed URL expired setelah 1 jam — URL yang sama tidak bisa diakses lagi setelah expire

> **Output:** `app/api/legal-docs/[filename]/route.ts` ter-commit. Endpoint tervalidasi dan aman.

---

### 3d — Frontend

Semua task frontend dikerjakan setelah 3a, 3b, 3c selesai.

---

#### `E2-S2-FE-01` — Setup folder, `page.tsx`, metadata, dan `loading.tsx`
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` · `Blocker`

Membuat folder route baru dan menyiapkan semua file page-level.

**Konteks:**
- Folder belum ada — perlu dibuat: `app/(public)/tentang-kami/`
- Rendering strategy: SSG dengan `revalidate: 86400` (24 jam) — sesuai `ARCHITECTURE.md §4.3`
- TIDAK ada data fetch dari Supabase atau FastAPI di page.tsx ini — semua data dari `constants/company-profile.ts`
- Karena data semua statis, `loading.tsx` cukup sederhana

- [ ] Buat folder `app/(public)/tentang-kami/`
- [ ] Buat `app/(public)/tentang-kami/page.tsx`:

```typescript
// app/(public)/tentang-kami/page.tsx
import type { Metadata } from 'next'
import { InnerPageHero } from '@/components/sections/InnerPageHero'
import { CompanyTimeline } from '@/components/sections/CompanyTimeline'
import { VisiMisi } from '@/components/sections/VisiMisi'
import { OrgStructure } from '@/components/sections/OrgStructure'
import { LegalDocsGrid } from '@/components/sections/LegalDocsGrid'

export const revalidate = 86400 // 24 jam

export const metadata: Metadata = {
  title: 'Tentang Kami — Sejarah & Legalitas CV Reka Cipta Indonesia',
  description:
    'CV Reka Cipta Indonesia, distributor garam SNI sejak 2020. Legalitas penuh: Akta Notaris, NIB, NPWP, Kemenkumham. Temui tim kami di Surabaya.',
  openGraph: {
    title: 'Tentang Kami — CV Reka Cipta Indonesia',
    description: 'Distributor garam SNI sejak 2020. Profil perusahaan dan dokumen legalitas.',
    images: [{ url: '/og-image.jpg' }],
  },
}

export default function TentangKamiPage() {
  return (
    <main>
      <InnerPageHero
        title="Tentang Kami"
        subtitle="Distributor garam yang membangun kepercayaan melalui transparansi, konsistensi, dan dokumentasi."
        breadcrumb={[{ label: 'Beranda', href: '/' }, { label: 'Tentang Kami' }]}
      />
      <CompanyTimeline />
      <VisiMisi />
      <OrgStructure />
      <LegalDocsGrid />
    </main>
  )
}
```

- [ ] Buat `app/(public)/tentang-kami/loading.tsx`:

```typescript
// app/(public)/tentang-kami/loading.tsx
import { TextLineSkeleton } from '@/components/ui/skeletons'

export default function TentangKamiLoading() {
  return (
    <div className="min-h-screen">
      {/* Page hero skeleton */}
      <div className="h-72 bg-ink-900 animate-pulse" />
      {/* Content skeletons */}
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <TextLineSkeleton key={i} width={i % 3 === 0 ? '50%' : '100%'} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] Update `app/sitemap.ts` (dari Slice 1): tambahkan `/tentang-kami` entry:
  ```typescript
  { url: 'https://rekaciptaindonesia.com/tentang-kami', changeFrequency: 'yearly', priority: 0.8 },
  ```

---

#### `E2-S2-FE-02` — Component: `components/sections/InnerPageHero.tsx`
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` · `Reusable`

Generic page header untuk semua halaman inner (Tentang Kami, Kontak, dll.). Didesain untuk digunakan ulang di Slice 3 (Kontak).

**Konteks:**
- File baru: `components/sections/InnerPageHero.tsx`
- Server Component (tidak butuh client-side interactivity)
- Background: `bg-ink-900` (`#0A1E1C`) atau `bg-brand-gradient` — sesuai keputusan E2-S2-UX-01
- Breadcrumb: opsional — jika prop `breadcrumb` diberikan, tampilkan. Gunakan Next.js `<Link>` untuk setiap item

**Implementasi:**
- [ ] Buat `components/sections/InnerPageHero.tsx`:

```typescript
// components/sections/InnerPageHero.tsx
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string  // jika tidak ada href, ini adalah halaman saat ini (tidak di-link)
}

interface InnerPageHeroProps {
  title: string
  subtitle?: string
  breadcrumb?: BreadcrumbItem[]
  className?: string
}

export function InnerPageHero({ title, subtitle, breadcrumb, className }: InnerPageHeroProps) {
  return (
    <section
      className={cn(
        'bg-ink-900 text-white py-16 md:py-24 px-4',
        'page-transition',  // CSS class dari globals.css — smooth page enter
        className
      )}
    >
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        {breadcrumb && breadcrumb.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-sm text-teal-300/70">
            {breadcrumb.map((item, index) => (
              <span key={index} className="flex items-center gap-1">
                {index > 0 && <ChevronRight className="w-3 h-3" aria-hidden="true" />}
                {item.href ? (
                  <Link href={item.href} className="hover:text-teal-200 transition-colors link-animated">
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-white">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{title}</h1>

        {/* Subtitle */}
        {subtitle && (
          <p className="mt-4 text-lg text-teal-100/80 max-w-2xl">{subtitle}</p>
        )}
      </div>
    </section>
  )
}
```

- [ ] Verifikasi: komponen bisa dirender di Tentang Kami **dan** akan bisa digunakan di `/kontak` di Slice 3 cukup dengan mengganti props

---

#### `E2-S2-FE-03` — Component: `components/sections/CompanyTimeline.tsx`
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend`

Timeline sejarah perusahaan dengan 3 milestone.

**Konteks:**
- File baru: `components/sections/CompanyTimeline.tsx`
- Data dari `COMPANY_TIMELINE` di `constants/company-profile.ts`
- Server Component (semua data statis)
- Animasi: gunakan `RevealWrapper` dari Slice 1 (`components/animations/RevealWrapper.tsx`)

**Implementasi:**
- [ ] Buat `components/sections/CompanyTimeline.tsx`
- [ ] Import `COMPANY_TIMELINE` dari `@/constants/company-profile`
- [ ] **Desktop layout:** horizontal timeline — garis lurus (`border-t-2 border-dashed border-teal-200`) membentang full width, di atasnya terdapat 3 node yang dibagi rata. Setiap node: lingkaran teal + tahun (atas garis) + judul + deskripsi (bawah garis)
- [ ] **Mobile layout:** vertikal — garis vertikal di kiri (`border-l-2 border-teal-200`), setiap milestone sebagai card di kanan garis
- [ ] Node visual: `w-12 h-12 rounded-full bg-brand-teal-600 text-white font-bold text-lg flex items-center justify-center`
- [ ] Section heading: `<h2>` "Perjalanan Kami" atau "Sejarah Singkat"
- [ ] Bungkus setiap milestone dengan `<RevealWrapper variant="reveal-left" delay={index * 200}>`
- [ ] Verifikasi: 3 milestone tampil dengan tahun, judul, deskripsi yang benar dari constants

---

#### `E2-S2-FE-04` — Component: `components/sections/VisiMisi.tsx`
**Priority:** 🟡 MED &emsp; **Tags:** `Frontend`

Section Visi & Misi dengan Visi menonjol secara visual dan Misi sebagai list terstruktur.

**Konteks:**
- File baru: `components/sections/VisiMisi.tsx`
- Data dari `COMPANY_VISION` dan `COMPANY_MISSION` di `constants/company-profile.ts`
- Server Component
- Elemen dekoratif kutipan: gunakan karakter `❝` atau SVG quote mark berwarna `brand-teal-600`

**Implementasi:**
- [ ] Buat `components/sections/VisiMisi.tsx`
- [ ] Layout desktop: 2 kolom (`grid-cols-1 md:grid-cols-2 gap-12`) — Visi kiri, Misi kanan
- [ ] Layout mobile: 1 kolom — Visi atas, Misi bawah
- [ ] **Visi block:**
  ```
  ┌──────────────────────────────────────────────┐
  │  ❝  (dekoratif, brand-teal-600, text-4xl)   │
  │                                              │
  │  [teks visi] (text-xl italic ink-700)        │
  │                                              │
  └──────────────────────────────────────────────┘
  ```
  Background: `bg-teal-50 rounded-2xl p-8`
- [ ] **Misi list:**
  - Section label: `MISI KAMI` (all caps, `text-xs tracking-widest text-teal-600`)
  - List 5 poin: setiap item `flex gap-3` — ikon `CheckCircle` Lucide `text-teal-600 shrink-0` + text (judul bold + deskripsi di bawahnya)
  - Background `bg-neutral-50 rounded-2xl p-8` atau transparent
- [ ] Bungkus Visi block dengan `<RevealWrapper variant="reveal-left">` dan Misi block dengan `<RevealWrapper variant="reveal-right">` untuk efek dramatis
- [ ] Verifikasi: 5 poin misi tampil lengkap dari constants (bukan 4 seperti yang tertulis di Epic Doc lama — gunakan data Fondasi Brand v1.0)

---

#### `E2-S2-FE-05` — Block + Section: `TeamMember.tsx` dan `OrgStructure.tsx`
**Priority:** 🟡 MED &emsp; **Tags:** `Frontend`

Dua komponen: satu reusable block card per anggota, satu section yang merender grid semua anggota.

**Konteks:**
- File baru 1: `components/blocks/TeamMember.tsx`
- File baru 2: `components/sections/OrgStructure.tsx`
- Data dari `TEAM_MEMBERS` di `constants/company-profile.ts`
- `TeamMember.tsx` = **Server Component** (foto via Next.js Image, tidak ada interaktivitas)
- Hover effect `.photo-teal-hover` dari Design System §19.5 — CSS ini perlu ditambahkan ke `globals.css`. **CEK DULU** apakah class ini sudah ada di `globals.css` yang current. Jika belum, tambahkan:

```css
/* Di globals.css — tambahkan di bagian Custom Effects */
/* Sumber: Design System v2.0 §19.5 */
.photo-teal-hover { position: relative; overflow: hidden; }
.photo-teal-hover img { transition: filter 400ms ease, transform 400ms ease; }
.photo-teal-hover::after {
  content: '';
  position: absolute; inset: 0;
  background: #0B7D6E;
  mix-blend-mode: multiply;
  opacity: 0;
  transition: opacity 300ms ease;
  border-radius: inherit;
}
.photo-teal-hover:hover img { transform: scale(1.04); filter: grayscale(20%); }
.photo-teal-hover:hover::after { opacity: 0.3; }
```

**PERHATIAN:** `globals.css` adalah file FROZEN (`ARCHITECTURE.md §11.1`). Penambahan ini diizinkan karena sudah terdefinisi di Design System v2.0 — ini bukan token baru, melainkan implementasi yang belum dimasukkan. **Dokumentasikan perubahan ini** dengan komentar `/* Tambahan Slice 2 — Design System §19.5 */` dan update changelog `ARCHITECTURE.md`.

**Implementasi `TeamMember.tsx`:**
- [ ] Buat `components/blocks/TeamMember.tsx`
- [ ] Props: `member: TeamMember` (tipe dari `constants/company-profile.ts`)
- [ ] Foto: gunakan Next.js `<Image>` dengan `src={member.photoPath}`, `width=240`, `height=240`, `className="object-cover rounded-xl"`
- [ ] **Fallback avatar**: wrap `<Image>` dengan error handler — gunakan prop `onError` atau buat komponen yang mengecek file existence di server side. Alternatif sederhana: tambahkan `className` kondisional dan render div initial jika `photoPath` berakhiran `.jpg` dan file tidak ada. Cara paling mudah: buat dua elemen — `<Image>` hidden jika error, div avatar initials sebagai fallback yang muncul. Implementasi dengan `useState` jika Client Component diperlukan, atau gunakan Next.js `placeholder="blur"` dengan SVG blur placeholder.
- [ ] Wrap foto dengan `<div className="photo-teal-hover">`
- [ ] Nama: `<p className="font-semibold text-ink-700 mt-3">` 
- [ ] Jabatan: `<Badge variant="outline" className="text-teal-700 border-teal-300 mt-1">`

**Implementasi `OrgStructure.tsx`:**
- [ ] Buat `components/sections/OrgStructure.tsx`
- [ ] Import `TEAM_MEMBERS` dari constants dan render `<TeamMember>` per anggota
- [ ] Grid: `grid-cols-2 md:grid-cols-4 gap-6`
- [ ] Section heading: `<h2>` "Tim Kami" — center aligned
- [ ] Setiap card bungkus dengan `<RevealWrapper variant="reveal-scale" delay={index * 100}>`

---

#### `E2-S2-FE-06` — Client Components: `LegalDocCard.tsx` dan `LegalDocModal.tsx`
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` · `Security`

Dua Client Components untuk menampilkan grid dokumen legalitas dan modal viewer. Ini adalah satu-satunya Client Component di halaman Tentang Kami.

**Konteks:**
- File baru 1: `components/blocks/LegalDocCard.tsx` — satu kartu dokumen
- File baru 2: `components/sections/LegalDocsGrid.tsx` — section yang berisi grid card
- Keduanya harus `'use client'` karena menggunakan `useState` dan event handlers
- Memanggil `GET /api/legal-docs/{filename}` untuk mendapatkan signed URL
- Menggunakan shadcn `<Dialog>` yang sudah diinstall di `E2-S2-SETUP-01`
- Tipe `LegalDocument` diimport dari `@/constants/company-profile`

**Implementasi `LegalDocCard.tsx`:**
- [ ] Buat `components/blocks/LegalDocCard.tsx`

```typescript
// components/blocks/LegalDocCard.tsx
'use client'
import { useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { LegalDocModal } from '@/components/blocks/LegalDocModal'
import type { LegalDocument } from '@/constants/company-profile'

interface LegalDocCardProps {
  doc: LegalDocument
}

export function LegalDocCard({ doc }: LegalDocCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLihat = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/legal-docs/${doc.filename}`)
      if (!res.ok) throw new Error('Gagal mengambil dokumen')
      const data = await res.json()
      setSignedUrl(data.url)
      setIsModalOpen(true)
    } catch (err) {
      setError('Dokumen tidak dapat dimuat. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-col items-center gap-3 p-4 border border-neutral-200 rounded-xl bg-white hover:border-teal-200 transition-colors">
        {/* Thumbnail */}
        <div className="w-full aspect-[3/4] bg-neutral-100 rounded-lg overflow-hidden flex items-center justify-center">
          {doc.thumbnailPath ? (
            <Image
              src={doc.thumbnailPath}
              alt={`Thumbnail ${doc.title}`}
              width={180} height={240}
              className="w-full h-full object-cover"
              onError={(e) => {
                // fallback ke ikon jika thumbnail tidak ada
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : null}
          <FileText className="w-12 h-12 text-neutral-400" aria-hidden="true" />
        </div>

        {/* Info */}
        <div className="text-center">
          <p className="font-semibold text-sm text-ink-700">{doc.title}</p>
          {doc.subtitle && (
            <p className="text-xs text-neutral-500 mt-0.5 font-mono">{doc.subtitle}</p>
          )}
        </div>

        {/* Error */}
        {error && <p className="text-xs text-red-500 text-center">{error}</p>}

        {/* CTA */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleLihat}
          disabled={isLoading}
          className="w-full"
          aria-label={`Lihat dokumen ${doc.title}`}
        >
          {isLoading ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Memuat...</>
          ) : (
            'Lihat'
          )}
        </Button>
      </div>

      {/* Modal — hanya render jika URL sudah tersedia */}
      {signedUrl && (
        <LegalDocModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={doc.title}
          signedUrl={signedUrl}
          filename={doc.filename}
        />
      )}
    </>
  )
}
```

**Implementasi `LegalDocModal.tsx`:**
- [ ] Buat `components/blocks/LegalDocModal.tsx`:

```typescript
// components/blocks/LegalDocModal.tsx
'use client'
import { ExternalLink } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface LegalDocModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  signedUrl: string
  filename: string
}

export function LegalDocModal({ isOpen, onClose, title, signedUrl, filename }: LegalDocModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-neutral-200">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden px-6 py-4" style={{ minHeight: '60vh' }}>
          <iframe
            src={signedUrl}
            className="w-full h-full rounded-lg border border-neutral-200"
            style={{ minHeight: '60vh' }}
            title={`Dokumen ${title}`}
          />
          {/* Fallback link jika iframe tidak bisa render PDF */}
          <p className="text-xs text-neutral-500 mt-2 text-center">
            Dokumen tidak tampil?{' '}
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="link-animated"
            >
              Buka di tab baru <ExternalLink className="w-3 h-3 inline" />
            </a>
          </p>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-neutral-200">
          <a
            href={signedUrl}
            download={filename}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">Unduh PDF</Button>
          </a>
          <Button variant="ghost" size="sm" onClick={onClose}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**Implementasi `LegalDocsGrid.tsx`:**
- [ ] Buat `components/sections/LegalDocsGrid.tsx`:

```typescript
// components/sections/LegalDocsGrid.tsx
'use client'
import { LEGAL_DOCUMENTS } from '@/constants/company-profile'
import { LegalDocCard } from '@/components/blocks/LegalDocCard'
import { RevealWrapper } from '@/components/animations/RevealWrapper'

export function LegalDocsGrid() {
  return (
    <section className="py-16 md:py-24 px-4 bg-neutral-50">
      <div className="max-w-5xl mx-auto">
        <RevealWrapper>
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-teal-600 uppercase mb-2">Legalitas</p>
            <h2 className="text-3xl font-bold text-ink-700">Dokumen Resmi Perusahaan</h2>
            <p className="mt-3 text-neutral-600">
              Seluruh dokumen legalitas tersedia untuk keperluan verifikasi vendor Anda.
            </p>
          </div>
        </RevealWrapper>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {LEGAL_DOCUMENTS.map((doc, index) => (
            <RevealWrapper key={doc.id} variant="reveal-scale" delay={index * 100}>
              <LegalDocCard doc={doc} />
            </RevealWrapper>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] Verifikasi: import chain berfungsi — `LegalDocsGrid` → `LegalDocCard` → `LegalDocModal`
- [ ] Test end-to-end lokal: klik "Lihat" → request ke Route Handler → URL kembali → modal terbuka dengan PDF

---

#### `E2-S2-FE-07` — Assembly halaman dan verifikasi heading hierarchy
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` · `SEO`

Memastikan semua section terakit dengan benar dan struktur semantik HTML terjaga.

- [ ] Verifikasi urutan section di `app/(public)/tentang-kami/page.tsx`:
  ```
  <InnerPageHero />    ← <h1> di dalam komponen ini
  <CompanyTimeline />  ← <h2> "Perjalanan Kami"
  <VisiMisi />         ← <h2> "Visi" dan "Misi Kami" (sebagai sub-judul, bukan baru h2)
  <OrgStructure />     ← <h2> "Tim Kami"
  <LegalDocsGrid />    ← <h2> "Dokumen Resmi Perusahaan"
  ```
- [ ] Verifikasi heading tidak ada yang skip level (H1 → H2, bukan H1 → H3)
- [ ] Verifikasi tepat satu `<h1>` di seluruh halaman (ada di `InnerPageHero`)
- [ ] Test: `npm run build` → tidak ada error TypeScript, tidak ada missing module
- [ ] Verifikasi: halaman dapat diakses di `http://localhost:3000/tentang-kami`
- [ ] Verifikasi struktural: `ARCHITECTURE.md §5.3` — tambahkan baris mapping untuk Tentang Kami:
  ```markdown
  | `app/(public)/tentang-kami/page.tsx` | Server | Semua data dari constants, SSG |
  ```

---

## Layer 4 · QA & Observability

---

#### `E2-S2-QA-01` — Visual review: semua breakpoints
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA` · `Frontend`

- [ ] Test di **375px** (iPhone SE):
  - `InnerPageHero`: title tidak overflow, breadcrumb bisa dibaca
  - Timeline: tampil vertikal (bukan horizontal) — tidak ada overflow horizontal
  - Visi & Misi: satu kolom — teks terbaca, tidak terpotong
  - OrgStructure: 2 kolom grid — 4 kartu dalam 2 baris. Foto/avatar tidak terpotong
  - LegalDocsGrid: 2 kolom grid — tombol "Lihat" terbaca dan bisa diklik dengan jari
  - Modal: terbuka full screen atau near-full di mobile, iframe cukup besar untuk baca PDF
- [ ] Test di **768px** (tablet):
  - Timeline: desktop layout (horizontal) atau masih vertikal jika belum sesuai
  - Dokumen: 4 kolom horizontal
- [ ] Test di **1280px** (laptop):
  - Semua section tampil dengan whitespace yang cukup
  - VisiMisi: 2 kolom side-by-side
- [ ] Tidak ada horizontal scroll di semua breakpoint

---

#### `E2-S2-QA-02` — Content accuracy check
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA` · `Content`

- [ ] Timeline: tahun 2018, 2019, 2020 tampil dengan deskripsi yang benar
- [ ] Visi: teks sesuai Fondasi Brand v1.0 (kata per kata — ini adalah identitas brand)
- [ ] Misi: **5 poin** tampil semua (bukan 4) — verifikasi poin ke-5 "Peningkatan standar yang berkelanjutan" muncul
- [ ] Tim: 4 nama dan jabatan benar — Widril Fakki (Komisaris), Abdul Majid Abdillah (Direktur), Salman Al Halili (Manager Keuangan), Irwan Sugianto (Manager Pemasaran)
- [ ] Legal docs: 4 dokumen tampil, nomor NIB `0280010102479` dan NPWP `96.674.473.2-609.000` benar (tidak ada typo)

---

#### `E2-S2-QA-03` — Legal docs modal: end-to-end test
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA` · `Security`

- [ ] Klik "Lihat" pada Akta Notaris → loading spinner muncul → modal terbuka → PDF ter-render di iframe
- [ ] Klik "Lihat" pada NIB → modal terbuka dengan dokumen NIB yang benar (bukan Akta Notaris)
- [ ] Klik "Unduh PDF" di modal → file ter-download ke komputer
- [ ] Klik "Tutup" → modal tertutup, state di-reset
- [ ] Buka halaman → klik "Lihat" NIB → salin signed URL dari Network tab DevTools → tunggu 1 jam → paste URL di browser baru → harus return error (URL expired)
- [ ] Test error state: simulasi dengan temporarily mengganti filename di browser DevTools (intercept request) → modal menampilkan error message, bukan blank atau crash
- [ ] Test aksesibilitas modal: ketika modal terbuka, focus harus pindah ke dalam modal. Ketika modal ditutup, focus kembali ke tombol "Lihat" yang membukanya (focus management — bawaan shadcn Dialog)
- [ ] Security test: akses langsung `{staging}/api/legal-docs/../../etc/passwd` → harus return 404, bukan 500

---

#### `E2-S2-QA-04` — Lighthouse dan manual accessibility
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA` · `Performance` · `Accessibility`

- [ ] Jalankan Lighthouse di staging → target: **Performance ≥ 85, Accessibility ≥ 90, SEO ≥ 90**
- [ ] Verifikasi `<title>` dan `<meta description>` tampil benar di browser tab
- [ ] Cek **alt text**: semua foto tim punya `alt="Foto {nama}"`. Ikon dekoratif punya `aria-hidden="true"`
- [ ] Cek **heading hierarchy**: tepat 1 `<h1>`, semua section titles `<h2>`, tidak ada skip level
- [ ] Keyboard navigation: Tab → semua tombol "Lihat" bisa dicapai → Enter membuka modal → Tab di dalam modal → focus ke iframe, Unduh, Tutup → Escape menutup modal
- [ ] Verifikasi `Organization` JSON-LD schema ada di source HTML (jika diimplementasikan di `E2-S2-UX-05`)
- [ ] Verifikasi halaman ter-cache dengan benar: `revalidate: 86400` aktif (cek response header `Cache-Control`)

---

#### `E2-S2-QA-05` — Definition of Done: Slice 2 Final Checklist
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA` · `Demo`

Semua item berikut harus ✅ sebelum Slice 2 dinyatakan selesai dan Slice 3 dimulai.

**Storage & Backend:**
- [ ] ☑ Supabase Storage bucket `legal-docs` ada dan bersifat private (tidak bisa diakses via URL publik)
- [ ] ☑ 4 dokumen PDF ter-upload dengan nama yang benar: `akta-notaris.pdf`, `nib.pdf`, `npwp.pdf`, `kemenkumham.pdf`
- [ ] ☑ Route Handler `/api/legal-docs/[filename]` berjalan dan whitelist berfungsi (invalid filename → 404)
- [ ] ☑ Signed URL yang di-generate dapat digunakan untuk membuka PDF di browser

**Constants & Data:**
- [ ] ☑ `constants/company-profile.ts` dibuat dengan semua data: Timeline (3), Visi, Misi (5), Tim (4), Dokumen (4)
- [ ] ☑ Data di file constants sesuai dengan Fondasi Brand v1.0 (terutama 5 poin misi)

**Frontend — Fungsionalitas:**
- [ ] ☑ Halaman `/tentang-kami` dapat dibuka di staging tanpa error
- [ ] ☑ 4 section tampil: Timeline, Visi Misi, Org Structure, Dokumen Legalitas
- [ ] ☑ Animasi scroll reveal berjalan di semua section (RevealWrapper dari Slice 1)
- [ ] ☑ Klik "Lihat" pada dokumen → modal terbuka dengan PDF yang benar
- [ ] ☑ Tombol "Unduh" di modal berfungsi
- [ ] ☑ TeamMember card: foto tampil (jika ada) atau fallback avatar initial tampil

**Frontend — Kualitas:**
- [ ] ☑ Halaman responsif di 375px, 768px, 1280px — tidak ada horizontal scroll
- [ ] ☑ Lighthouse: Performance ≥ 85, Accessibility ≥ 90, SEO ≥ 90
- [ ] ☑ Tepat satu `<h1>` di halaman, semua section title `<h2>`
- [ ] ☑ `.photo-teal-hover` CSS ditambahkan ke `globals.css` dan terdokumentasi di ARCHITECTURE.md

**Kode & Dokumentasi:**
- [ ] ☑ `ARCHITECTURE.md §11.3` diupdate: `Dialog AspectRatio` ditambahkan ke daftar shadcn
- [ ] ☑ `ARCHITECTURE.md §5.3` diupdate: mapping direktif `tentang-kami/page.tsx`
- [ ] ☑ `app/sitemap.ts` diupdate: `/tentang-kami` entry ditambahkan
- [ ] ☑ `InnerPageHero` siap digunakan ulang di Slice 3 (kontak) — props interface sudah sesuai
- [ ] ☑ Semua komponen baru ter-commit ke Git

**Demo ke klien:**
- [ ] ☑ Buka `/tentang-kami` → tunjukkan 4 section dengan scroll
- [ ] ☑ Demo modal dokumen: klik "Lihat NIB" → modal terbuka dengan NIB — tunjukkan nomor `0280010102479` terlihat
- [ ] ☑ Tunjukkan bahwa URL dokumen tidak bisa diakses langsung (coba buka bucket URL → error)

---

---

*Epic 2 Task Breakdown Slice 2 · CV Reka Cipta Indonesia · Juni 2026*
*Berdasarkan: Epic_Doc1 v1.0 · Fondasi_Brand v1.0 · ARCHITECTURE.md v1.0 · DESIGN_SYSTEM v2.0*
*Slice sebelumnya: `epic2_task_breakdown_slice1_beranda.md`*
*Slice berikutnya: `epic2_task_breakdown_slice3_kontak.md`*
