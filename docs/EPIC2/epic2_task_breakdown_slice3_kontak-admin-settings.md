# Epic 2 — Profil Perusahaan: SLICE 3 — Halaman Kontak (`/kontak`) + Admin Settings (`/admin/settings`)
## CV Reka Cipta Indonesia · Web Platform & CRM System

> **Versi:** 1.0 &emsp;
> **Slice:** 3 dari 3 &emsp;
> **Prasyarat:** Slice 1 (Beranda) ✅ · Slice 2 (Tentang Kami) ✅ &emsp;
> **Status:** Draft · Juli 2026

---

## Posisi Slice Ini dalam Epic 2

| Slice | Halaman | DB / Storage | Admin CRM | Status |
|---|---|---|---|---|
| Slice 1 | Halaman Beranda (`/`) | Tabel `company_settings` (10 rows seeded) | — | ✅ Selesai |
| Slice 2 | Halaman Tentang Kami (`/tentang-kami`) | Storage bucket `legal-docs` | — | ✅ Selesai |
| **Slice 3** ← *dokumen ini* | **Halaman Kontak (`/kontak`)** | — (pakai `company_settings` yang sudah ada) | **`/admin/settings`** | 🔄 In Progress |

---

## Kenapa Slice 3 Penting Secara Arsitektural

Slice 3 adalah **halaman admin CRUD pertama** di seluruh platform. Semua epic berikutnya (Epic 3 Products, Epic 4 RFQ, Epic 5 Supplier, Epic 6 Articles) akan meng-clone pattern yang dibangun di slice ini:

1. **Server Component wrapper** (server-side auth check via layout) + **Client Component form leaf** (`react-hook-form` + Zod).
2. **Authenticated fetch pattern** via `lib/api.ts` dengan `auth: true` → JWT Bearer ke FastAPI.
3. **Optimistic UI + toast feedback + error handling** untuk operasi mutasi.
4. **Post-save cache invalidation** untuk halaman publik SSG/ISR yang meng-konsumsi data yang sama.

Kualitas execution slice 3 = kualitas execution 4 admin form berikutnya. Prioritaskan **cleanliness of the pattern**, bukan sekadar "form yang jalan".

---

## Prasyarat: Output Slice 1 & 2 yang Dipakai di Slice Ini

| Output | File | Dipakai oleh |
|---|---|---|
| Tabel `company_settings` + 10 rows seeded | Supabase (migration `..._company_settings.sql`) | Public Kontak page (read) + Admin Settings (read+write) |
| RLS Pattern A (public READ, auth WRITE) | Migration | Fetch di Server Component publik tanpa auth |
| `backend/schemas/settings.py` — `CompanySettingItem`, `CompanySettingsResponse`, `CompanySettingUpdate`, `CompanySettingsBulkUpdate` | `backend/schemas/settings.py` | Reuse tanpa perubahan — `PATCH /settings` pakai `CompanySettingsBulkUpdate` |
| `backend/routers/settings.py` — `GET /settings` [AUTH] | `backend/routers/settings.py` | Tambah `PATCH /settings` di file yang sama |
| `types/api.ts` — settings types | `types/api.ts` | Frontend admin form typed via `CompanySettingsBulkUpdate` |
| `lib/supabase/public.ts` — stateless client | `lib/supabase/public.ts` | **WAJIB** untuk Kontak page agar tetap Static (`○`), bukan Dynamic (`ƒ`) |
| `lib/api.ts` — authenticated fetch wrapper | `lib/api.ts` | Admin form PATCH call dengan `auth: true` |
| `lib/wa-link.ts` — `generateWALink(nomor, pesan)` | `lib/wa-link.ts` | WhatsApp button di Kontak page |
| `lib/env.ts` — static env access | `lib/env.ts` | `publicEnv.apiUrl` di client component |
| `InnerPageHero` component | `components/sections/InnerPageHero.tsx` | Page header Kontak dengan title + breadcrumb berbeda |
| shadcn `Dialog` (dari Slice 2) | `components/ui/dialog.tsx` | Tidak dipakai langsung di slice ini — tetap tersedia |
| `RevealWrapper` (dari Slice 1) | `components/animations/RevealWrapper.tsx` | Reveal untuk sections di Kontak page |
| Admin sidebar `ADMIN_NAV` | `constants/admin-navigation.ts` | Entry "Pengaturan" harus sudah ada (Epic 1) — verifikasi sebelum mulai |

---

## Tujuan Slice 3

Setelah slice ini selesai:

**Public:**
- Halaman `/kontak` dapat diakses di staging dengan 4 blok: page header, info kontak + WA buttons, form kontak, Google Maps embed
- Data info kontak (alamat, WA, email, pesan default WA, gmaps URL) dibaca dari `company_settings` — bukan hardcode
- Klik tombol WA → membuka `wa.me/{nomor}?text={pesan_default_WA}` di tab baru
- Submit form kontak → email notifikasi terkirim ke admin via Resend + user melihat konfirmasi inline
- Halaman tetap Static (`○`) di build output — bukan Dynamic

**Admin:**
- Admin login → sidebar menu "Pengaturan" → `/admin/settings`
- Halaman menampilkan form 6 field editable: WA 1, WA 2, Email, Alamat, URL Embed Google Maps, Pesan Default WA
- Field non-editable (partner_count, cities_served, dst.) TIDAK muncul di form ini (mereka akan di-manage otomatis dari CRM di Epic 4)
- Submit form → `PATCH /api/v1/settings` dengan JWT → response 200 → toast "Perubahan berhasil disimpan"
- Perubahan langsung tercermin di halaman publik (`/kontak` dan `/` footer) tanpa deploy ulang — via `revalidatePath()`

**Demo ke klien setelah Slice 3 selesai:** Login sebagai admin → `/admin/settings` → ubah nomor WA 1 dari `082136096528` ke nomor baru → klik Simpan → toast muncul → buka `/kontak` di tab baru → nomor WA baru muncul + tombol WA membuka chat ke nomor baru → buka `/` (Beranda), footer juga menunjukkan nomor baru.

---

## Keputusan Arsitektur Slice 3

| Keputusan | Pilihan | Alasan |
|---|---|---|
| Sumber data Kontak page | Fetch langsung dari Supabase via `lib/supabase/public.ts` di Server Component | Konsisten dengan Slice 1. Preserve Static rendering. RLS public READ mengizinkan tanpa auth. |
| Sumber data Admin Settings page | Fetch dari FastAPI `GET /api/v1/settings` via `lib/api.ts` di Client Component | Konsisten dengan `ARCHITECTURE.md §6.1`: admin ops via FastAPI dengan JWT. Server Component tidak dipakai karena butuh react-hook-form. |
| Rendering strategy Kontak | ISR `revalidate: 3600` | Info kontak jarang berubah tapi bisa. 1 jam cukup, dan setelah admin save akan force revalidate. |
| Rendering strategy Admin Settings | Dynamic (`cache: 'no-store'`) | Konsisten dengan `ARCHITECTURE.md §4.3` untuk semua `/admin/*`. |
| Contact form submit target | FastAPI `POST /api/v1/contact/send` — bukan Next.js Route Handler | Konsisten dengan `ARCHITECTURE.md §6.1`: side-effect eksternal (Resend) via FastAPI. |
| Rate limit contact form | `slowapi`: 5 req/IP/min | Anti-spam dasar. Konsisten dengan pattern login (§7.6). |
| Rate limit admin PATCH | Tidak ada rate limit tambahan | Sudah JWT-protected + admin trusted user. |
| Cache invalidation post-save | Next.js Server Action **atau** Route Handler `/api/revalidate-settings` dipanggil dari client setelah `PATCH` sukses | Kedua pattern OK — pilih Server Action karena lebih native ke Next.js 15 dan tidak perlu secret token untuk internal call. |
| Framework form | `react-hook-form` + `zod` | Konsisten dengan admin login (Epic 1). |
| Notifikasi feedback | shadcn `Sonner` (install baru di slice ini) | Toast lightweight, konsisten dengan shadcn ecosystem. |
| Email destination contact form | Baca `email` key dari `company_settings` **saat submit** (bukan env var) | Konsisten dengan spek: "Admin bisa edit info kontak → langsung terpakai". Kalau admin ubah email di CRM, submission berikutnya masuk ke email baru — tanpa deploy. |
| Google Maps embed | Raw iframe dari `gmaps_embed_url` value | Tidak butuh API key. Field boleh kosong (fallback: sembunyikan section). |
| Field editable di admin | Hanya 6: WA 1, WA 2, Email, Alamat, Gmaps URL, WA default message | Sisanya (`partner_count`, `cities_served`, `total_distribution_tons`, `client_list`) di-lock — akan diatur dari CRM Epic 4 nanti. Tampilkan sebagai read-only info block di bawah form (dokumentasi). |
| Server Action vs Route Handler | Prefer **Server Action** untuk revalidation trigger | Next.js 15 async Server Actions native, tidak perlu bikin endpoint terpisah. Kalau team lebih nyaman Route Handler, itu juga OK. |
| Base UI vs Radix pattern | `<Link className={cn(buttonVariants(...))}>` — **bukan** `<Button asChild><Link>` | Constraint hard dari userMemories: project pakai `@base-ui/react`, `asChild` idiom tidak jalan. |

---

## Ringkasan Per Layer

| # | Layer | Tasks |
|---|---|:---:|
| 1 | UX & Information Architecture | 6 |
| 2 | User Stories | 5 |
| 3a | Engineering · Backend (Schemas + Endpoints + Service) | 5 |
| 3b | Engineering · API Contract | 1 |
| 3c | Engineering · Frontend Public (Kontak) | 6 |
| 3d | Engineering · Frontend Admin (Settings) | 4 |
| 3e | Engineering · Cache Invalidation | 1 |
| 4 | QA & Observability | 6 |
| | **Total Slice 3** | **34** |

---

## Layer 1 · UX & Information Architecture

---

#### `E2-S3-UX-01` — Wireframe Halaman Kontak: Info Block + WA Buttons
**Priority:** 🔴 HIGH &emsp; **Tags:** `Design` · `Frontend`

Halaman Kontak reuse `InnerPageHero` dari Slice 2. Setelah hero, section utama adalah kombinasi Info Kontak (kiri) + Form Kontak (kanan) dalam grid 2 kolom desktop.

**InnerPageHero (reuse):**
- [ ] Props:
  - `title="Hubungi Kami"`
  - `subtitle="Tim kami siap membantu kebutuhan distribusi garam industri Anda. Hubungi via WhatsApp, email, atau kirim pesan langsung dari halaman ini."`
  - `breadcrumb=[{ label: 'Beranda', href: '/' }, { label: 'Hubungi Kami' }]`

**Info Kontak Block (kolom kiri, desktop):**
- [ ] Section heading: `<h2>` "Informasi Kontak" — style konsisten dengan section headings di Beranda/Tentang Kami (`text-3xl font-bold text-ink-900`)
- [ ] 3 baris info dalam vertical list:
  1. **Alamat** — ikon `MapPin` (Lucide) `text-brand-teal-600` + teks alamat lengkap dari `company_settings.address`
  2. **Email** — ikon `Mail` + teks email dari `company_settings.email`, sebagai `<a href="mailto:...">` dengan class `link-animated`
  3. **Jam Operasional** (hardcoded, bukan dari DB) — ikon `Clock` + teks "Senin — Sabtu · 08:00 — 17:00 WIB"

**WhatsApp Buttons Block (di bawah info):**
- [ ] Sub-heading: "Chat langsung via WhatsApp"
- [ ] 2 tombol WA, satu per nomor — layout `flex flex-col gap-3 md:flex-row`
- [ ] Setiap tombol:
  - Style: `bg-green-500 hover:bg-green-600 text-white` (warna WA authentic — override brand teal di sini karena expected UX pattern)
  - Konten: ikon `MessageCircle` (Lucide) atau SVG WhatsApp + teks `"WA {nomor terformat}"` (format: `+62 821-3609-6528`)
  - `href`: hasil `generateWALink(nomor, wa_default_message)` — pesan dari `company_settings.wa_default_message`
  - `target="_blank" rel="noopener noreferrer"`
  - **Pattern penting:** ini `<Link>` (bukan Button asChild) — pakai `<Link className={cn(buttonVariants({ ... }), "bg-green-500 hover:bg-green-600")}>` sesuai constraint Base UI

**Layout desktop:**
- [ ] Grid `grid-cols-1 md:grid-cols-5 gap-8`
- [ ] Info + WA Block: `md:col-span-2`
- [ ] Form: `md:col-span-3`

**Layout mobile:**
- [ ] Stack vertikal — Info dulu, Form di bawah

**Animasi:**
- [ ] Bungkus Info Block dengan `<RevealWrapper variant="reveal-left">`
- [ ] Bungkus Form Block dengan `<RevealWrapper variant="reveal-right">`

> **Output:** Spesifikasi visual & data flow untuk Info + WA block yang disepakati sebelum coding.

---

#### `E2-S3-UX-02` — Wireframe Form Kontak
**Priority:** 🔴 HIGH &emsp; **Tags:** `Design` · `Frontend`

Form kontak sederhana dengan validasi client-side. Submit → API call → toast + reset form.

**Field spec:**

| Field | Label | Type | Required | Validasi Zod |
|---|---|---|:---:|---|
| `name` | Nama Lengkap | `text` | ✅ | `min(2, "Nama minimal 2 karakter").max(100)` |
| `email` | Email | `email` | ✅ | `email("Format email tidak valid")` |
| `phone` | Nomor WhatsApp | `tel` | ⬜ | `regex(/^(\+62\|62\|0)8\d{8,12}$/, "Format WA Indonesia tidak valid").optional().or(z.literal(''))` |
| `message` | Pesan | `textarea` | ✅ | `min(10, "Pesan minimal 10 karakter").max(1000, "Maks 1000 karakter")` |

**UI spec:**
- [ ] Card wrapper: `bg-white border border-neutral-200 rounded-2xl p-6 md:p-8 shadow-sm`
- [ ] Section heading: `<h2>` "Kirim Pesan"
- [ ] Field structure per input: `<Label>` + `<Input>` + `<p className="text-sm text-error-500">` untuk error message
- [ ] Field `message`: `<Textarea>` dengan `rows={5}`
- [ ] Character counter di field message (right-aligned bawah): `{message.length}/1000`
- [ ] Submit button: full width di mobile, right-aligned di desktop. Text: "Kirim Pesan"
  - State normal: `bg-brand-teal-600 text-white`
  - State loading: disabled + spinner + text "Mengirim..."
  - State success: sekali sukses form ter-reset + toast muncul
- [ ] Field wajib ditandai dengan tanda `*` merah di sebelah label

**Feedback:**
- [ ] Sukses: toast success (shadcn Sonner) — "Pesan Anda berhasil terkirim. Kami akan merespons dalam 1 × 24 jam kerja."
- [ ] Error validasi: inline di bawah field (dari zod)
- [ ] Error server (5xx / network): toast destructive — "Gagal mengirim pesan. Silakan coba lagi atau hubungi via WhatsApp."
- [ ] Error rate limit (429): toast warning — "Terlalu banyak permintaan. Silakan tunggu beberapa saat."

**Accessibility:**
- [ ] Setiap input punya `id` unik dan `<Label htmlFor={...}>`
- [ ] Error message pakai `aria-describedby={errorId}` di input
- [ ] Loading state pakai `aria-busy="true"` di form

> **Output:** Spesifikasi form + validasi + feedback pattern.

---

#### `E2-S3-UX-03` — Wireframe Google Maps Embed
**Priority:** 🟡 MED &emsp; **Tags:** `Design` · `Frontend`

Section paling bawah di halaman Kontak. Iframe embed Google Maps dari URL yang tersimpan di `company_settings.gmaps_embed_url`.

- [ ] Section heading: `<h2>` "Lokasi Kantor Kami"
- [ ] Sub-teks (opsional): "Kunjungi kami di kantor pusat Surabaya."
- [ ] Iframe container: `aspect-video md:aspect-[16/7] rounded-2xl overflow-hidden border border-neutral-200 shadow-sm`
- [ ] Iframe: `src={gmaps_embed_url}` `width="100%"` `height="100%"` `loading="lazy"` `referrerPolicy="no-referrer-when-downgrade"` `allowFullScreen`
- [ ] Iframe `title="Peta lokasi kantor CV Reka Cipta Indonesia"` — untuk aksesibilitas
- [ ] **Fallback jika `gmaps_embed_url` kosong/null:** tampilkan placeholder box dengan ikon `MapPin` besar + teks alamat + tombol "Buka di Google Maps" yang link ke `https://www.google.com/maps/search/?api=1&query={encodeURIComponent(address)}`. **Halaman tidak boleh broken kalau field embed URL kosong.**
- [ ] Animasi: `<RevealWrapper variant="reveal-up">`

**Security note:**
- [ ] `gmaps_embed_url` di-input admin adalah URL iframe embed Google Maps (dimulai dengan `https://www.google.com/maps/embed?pb=...`). **JANGAN** render URL sembarangan sebagai `<iframe src=...>` tanpa validasi minimal.
- [ ] Di komponen render, tambah runtime check: jika `!gmaps_embed_url.startsWith('https://www.google.com/maps/embed')`, treat sebagai kosong → tampilkan fallback. Validasi kedua di admin form (task `E2-S3-AD-02`).

> **Output:** Iframe embed dengan fallback graceful.

---

#### `E2-S3-UX-04` — Wireframe Admin Settings Page
**Priority:** 🔴 HIGH &emsp; **Tags:** `Design` · `Frontend` · `Admin`

Halaman admin pertama yang mengedit data. Layout mengikuti `AdminHeader` + `main` yang sudah ada dari Epic 1.

**Page Layout:**
- [ ] `AdminHeader`: `title="Pengaturan Kontak"`, `breadcrumb=[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Pengaturan' }]`
- [ ] Deskripsi singkat di bawah header (`<p className="text-sm text-neutral-600 mb-6">`):
  > "Kelola informasi kontak yang tampil di halaman publik. Perubahan akan langsung tercermin di halaman Kontak dan Beranda."

**Form Card:**
- [ ] Card `bg-white rounded-2xl border border-neutral-200 p-6 md:p-8`
- [ ] Card heading: "Informasi Kontak"
- [ ] 6 field editable (spec di tabel di bawah)
- [ ] Footer form: tombol "Simpan Perubahan" (kanan) + tombol "Batal" (kiri, secondary) — Batal me-reset form ke server state

**Field Editable (6 field):**

| Key di `company_settings` | Label | Type | Validasi Zod | Placeholder |
|---|---|---|---|---|
| `whatsapp_1` | Nomor WhatsApp Utama | `tel` | `regex(/^0\d{9,13}$/, "Format: 08xxxxxxxxxx")` | `082136096528` |
| `whatsapp_2` | Nomor WhatsApp Alternatif | `tel` | `regex(/^0\d{9,13}$/).or(z.literal(''))` — opsional | `087839031378` |
| `email` | Email Kontak | `email` | `email("Format email tidak valid")` | `contact@example.com` |
| `address` | Alamat Kantor | `textarea (2 rows)` | `min(10).max(500)` | `Jl. ...` |
| `gmaps_embed_url` | URL Embed Google Maps | `url` | `startsWith("https://www.google.com/maps/embed").or(z.literal(''))` | `https://www.google.com/maps/embed?pb=...` |
| `wa_default_message` | Pesan Default WhatsApp | `textarea (3 rows)` | `min(10).max(300)` | `Halo, saya ingin...` |

- [ ] Field `gmaps_embed_url` — di bawahnya tambah helper text kecil: "Cara mendapat URL: buka Google Maps → cari alamat → Bagikan → Sematkan peta → salin URL dari atribut `src` di HTML."
- [ ] Field `wa_default_message` — helper: "Pesan ini akan otomatis terisi ketika pelanggan klik tombol WhatsApp di halaman Kontak."

**Read-only Info Block (di bawah form):**
- [ ] Card `bg-neutral-50 border border-dashed border-neutral-300 rounded-xl p-4`
- [ ] Heading: `<p className="text-sm font-semibold text-neutral-700">` "Statistik Dinamis (Read-only)"
- [ ] Sub-teks: "Nilai berikut ditampilkan di Beranda dan akan diatur otomatis dari CRM setelah Epic 4 selesai. Untuk sementara, hubungi developer jika perlu update."
- [ ] Grid 2×2 menampilkan 4 stat (nilai dari `company_settings`, tidak editable): Mitra Aktif, Kota Dilayani, Total Distribusi (TON), Daftar Klien
- [ ] **Alasan design:** Menghindari kebingungan admin — mereka lihat semua data di satu tempat, tapi jelas mana yang boleh diubah manual dan mana yang datang dari CRM.

**Feedback:**
- [ ] Loading state saat GET data awal: skeleton form (pakai `TextLineSkeleton` × 6)
- [ ] Saat submit: tombol Simpan disabled + text "Menyimpan..."
- [ ] Sukses: toast success — "Perubahan berhasil disimpan. Halaman publik telah diperbarui."
- [ ] Error 4xx: toast + error inline di field yang gagal validasi (jika backend validation error)
- [ ] Error 5xx: toast destructive — "Gagal menyimpan. Silakan coba lagi. Jika berulang, hubungi developer."
- [ ] Error auth (401): redirect ke `/admin/login` (via middleware — seharusnya tidak sampai sini)

> **Output:** Spesifikasi form + read-only info block + feedback pattern lengkap.

---

#### `E2-S3-UX-05` — SEO Metadata untuk Halaman Kontak
**Priority:** 🟡 MED &emsp; **Tags:** `SEO` · `Frontend`

- [ ] `<title>`: "Hubungi Kami — CV Reka Cipta Indonesia Distributor Garam Surabaya"
- [ ] `<meta description>`: Maks 160 karakter. Contoh: "Hubungi CV Reka Cipta Indonesia untuk kebutuhan distribusi garam industri Anda. Kantor Surabaya, respons kurang dari 24 jam. Chat WA langsung."
- [ ] `canonical`: `https://rekaciptaindonesia.com/kontak`
- [ ] Open Graph:
  - `og:title`: "Hubungi CV Reka Cipta Indonesia"
  - `og:description`: sama dengan meta description
  - `og:image`: `/og-image.jpg` (reuse dari halaman lain)
  - `og:type`: `website`
- [ ] **Structured data — `ContactPage` + `LocalBusiness`:**
  ```json
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "CV Reka Cipta Indonesia",
    "address": { "@type": "PostalAddress", "streetAddress": "...", "addressLocality": "Surabaya", ... },
    "telephone": "+6282136096528",
    "email": "rekaciptaindonesiaa@gmail.com",
    "openingHours": "Mo-Sa 08:00-17:00"
  }
  ```
  Value alamat/telp/email di-inject dari `company_settings` saat render (server-side).
- [ ] Update `app/sitemap.ts`: tambah `/kontak` dengan `priority: 0.9`, `changeFrequency: 'monthly'`

**Admin page:**
- [ ] `<title>` untuk `/admin/settings`: "Pengaturan Kontak — Admin RCI"
- [ ] Halaman admin harus `noindex, nofollow` (sudah di-handle via `app/robots.ts` dari Epic 1)

---

#### `E2-S3-UX-06` — Loading & Error States (Kontak + Admin Settings)
**Priority:** 🟡 MED &emsp; **Tags:** `Design` · `Frontend`

**`app/(public)/kontak/loading.tsx`:**
- [ ] Skeleton hero (dark bg placeholder h-72)
- [ ] Grid 2 kolom: kiri = 3 baris skeleton info; kanan = card skeleton form (5 field skeleton)
- [ ] Skeleton iframe placeholder (`aspect-video bg-neutral-200 rounded-2xl`)

**`app/(public)/kontak/error.tsx`:** *(TIDAK dibuat khusus — pakai `app/error.tsx` global)*

**`app/admin/settings/` — no separate loading.tsx** — pakai `app/admin/loading.tsx` yang sudah ada dari Epic 1 (TableRowSkeleton × 8, atau ganti pattern skeleton dalam client component sendiri saat GET pending)

**Error handling khusus admin:**
- [ ] Jika GET awal gagal (network / 5xx): tampilkan retry button di tengah page dengan pesan "Gagal memuat pengaturan. [Coba Lagi]"

---

## Layer 2 · User Stories

---

#### `E2-S3-US-01` — Visitor melihat informasi kontak dan menghubungi via WhatsApp
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend`

*As a potential buyer visiting the contact page, I want to quickly see how to reach RCI, so I can start a conversation without friction.*

**Acceptance Criteria:**
- [ ] Halaman `/kontak` menampilkan alamat lengkap, email, dan 2 nomor WhatsApp dari `company_settings`
- [ ] Klik tombol "WA {nomor}" → tab baru terbuka ke `wa.me/...` dengan pesan default sudah pre-filled
- [ ] Kalau admin update nomor WA di panel → dalam < 1 menit, halaman `/kontak` menampilkan nomor baru (post-revalidation)
- [ ] Klik email → membuka aplikasi email default dengan `To:` sudah terisi (mailto link)

---

#### `E2-S3-US-02` — Visitor mengirim pesan via form kontak
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` · `Backend`

*As a procurement manager, I want to send a detailed inquiry through the contact form, so I can start a formal communication without opening WhatsApp.*

**Acceptance Criteria:**
- [ ] Form validasi client-side: nama < 2 char → error; email invalid → error; message < 10 char → error
- [ ] Submit dengan data valid → button loading state → dalam ≤ 5 detik toast sukses muncul → form ter-reset
- [ ] Admin menerima email di alamat `company_settings.email` dengan subject "Pesan Kontak Baru dari {nama}" berisi semua field yang di-submit
- [ ] Email body meliputi: nama, email, WA (jika diisi), pesan, timestamp, IP address (opsional untuk debug)
- [ ] Rate limit: submit 6× cepat dari IP yang sama → request ke-6 dapat toast warning "Terlalu banyak permintaan"

---

#### `E2-S3-US-03` — Visitor melihat lokasi kantor via peta
**Priority:** 🟡 MED &emsp; **Tags:** `Frontend`

*As a visitor considering a physical visit, I want to see the office location on a map, so I know the exact address and can plan a trip.*

**Acceptance Criteria:**
- [ ] Iframe Google Maps ter-render dengan lokasi kantor Surabaya
- [ ] Kalau `gmaps_embed_url` kosong: fallback UI muncul dengan tombol "Buka di Google Maps" yang langsung menuju pencarian alamat
- [ ] Iframe punya `title` yang deskriptif untuk aksesibilitas
- [ ] Iframe lazy-load — tidak block LCP halaman

---

#### `E2-S3-US-04` — Admin mengedit info kontak dari panel
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` · `Backend` · `Admin`

*As an admin, I want to update the company's contact info (WA, email, address) without asking a developer, so we can respond fast to operational changes.*

**Acceptance Criteria:**
- [ ] Login sebagai admin → sidebar → klik "Pengaturan" → `/admin/settings`
- [ ] Halaman menampilkan 6 field editable dengan value saat ini pre-filled
- [ ] Ubah nilai di 1 atau lebih field → klik Simpan → dalam ≤ 3 detik toast sukses muncul
- [ ] Buka `/kontak` di tab baru (atau refresh) → nilai baru muncul
- [ ] Buka `/` (Beranda) di tab baru → footer menampilkan nilai baru (footer baca dari `company_settings` yang sama)
- [ ] Klik tombol "Batal" → form ter-reset ke nilai server (bukan default kosong)

---

#### `E2-S3-US-05` — Admin memahami mana field yang bisa diedit dan tidak
**Priority:** 🟡 MED &emsp; **Tags:** `Frontend` · `Content` · `Admin`

*As an admin, I want to see all data that's stored about the company, but understand clearly which fields I can safely edit, so I don't accidentally break statistics displayed on the homepage.*

**Acceptance Criteria:**
- [ ] Form utama menampilkan 6 field editable dengan label jelas
- [ ] Di bawah form ada info block "Statistik Dinamis (Read-only)" yang menampilkan 4 stat: Mitra Aktif, Kota Dilayani, Total Distribusi TON, Daftar Klien
- [ ] Info block jelas menyatakan bahwa nilai ini akan diatur otomatis dari CRM di Epic 4
- [ ] Info block secara visual berbeda (dashed border, neutral background) — tidak mungkin dikira input yang bisa diedit

---

## Layer 3 · Engineering Sub-tasks

Urutan pengerjaan wajib: **3a Backend → 3b Contract → 3c Frontend Public → 3d Frontend Admin → 3e Cache Invalidation**

---

### 3a — Backend (Schemas + Endpoints + Service)

---

#### `E2-S3-BE-01` — Pydantic Schemas: `ContactRequest`, `ContactResponse`
**Priority:** 🔴 HIGH &emsp; **Tags:** `Backend` · `Blocker`

Membuat schema untuk endpoint `POST /contact/send`.

**Konteks:**
- File baru: `backend/schemas/contact.py`
- Reuse pattern dari `backend/schemas/settings.py` (Slice 1)
- Update `backend/schemas/__init__.py` untuk expose class baru

**Implementasi:**
- [ ] Buat `backend/schemas/contact.py`:
  ```python
  from pydantic import BaseModel, EmailStr, Field
  from typing import Optional
  from datetime import datetime

  class ContactRequest(BaseModel):
      name: str = Field(..., min_length=2, max_length=100)
      email: EmailStr
      phone: Optional[str] = Field(None, pattern=r'^(\+62|62|0)8\d{8,12}$')
      message: str = Field(..., min_length=10, max_length=1000)

  class ContactResponse(BaseModel):
      success: bool
      message: str
      submitted_at: datetime
  ```
- [ ] Tambah `from .contact import ContactRequest, ContactResponse` di `backend/schemas/__init__.py`
- [ ] Verifikasi: `python -c "from schemas import ContactRequest, ContactResponse; print('OK')"` di `backend/` folder tidak error
- [ ] Pastikan `pydantic[email]` sudah ada di `requirements.txt` (untuk `EmailStr`). Kalau belum, install: `pip install "pydantic[email]"` lalu update `requirements.txt`

> **Output:** `backend/schemas/contact.py` ter-commit.

---

#### `E2-S3-BE-02` — Service: Resend Email Wrapper
**Priority:** 🔴 HIGH &emsp; **Tags:** `Backend` · `Blocker`

Wrapper Resend API untuk mengirim email notifikasi. Dipakai di `POST /contact/send` sekarang dan akan direuse di Epic 4 (RFQ notification) & Epic 5 (Supplier registration).

**Konteks:**
- File baru: `backend/services/email_service.py` (folder `services/` sudah ada dari Epic 1)
- Env var: `RESEND_API_KEY` — sudah didokumentasi di `ARCHITECTURE.md §10.2` tapi verifikasi di Railway
- Package: `resend` (Python SDK)

**Implementasi:**
- [ ] Tambah `resend` ke `backend/requirements.txt` (versi terbaru, minimal `>=0.7.0`)
- [ ] Install: `pip install resend`
- [ ] Buat `backend/services/email_service.py`:
  ```python
  import resend
  import logging
  from typing import Optional
  from core.config import settings

  logger = logging.getLogger(__name__)
  resend.api_key = settings.RESEND_API_KEY

  DEFAULT_FROM = "CV Reka Cipta Indonesia <no-reply@rekaciptaindonesia.com>"
  # NOTE: Domain harus ter-verify di Resend dashboard.
  # Untuk staging: pakai onboarding@resend.dev (default Resend testing domain)

  class EmailService:
      @staticmethod
      def send_contact_notification(
          to_email: str,
          from_name: str,
          from_email: str,
          phone: Optional[str],
          message: str,
      ) -> dict:
          """Kirim email notifikasi ke admin dari form kontak.

          Return: { id: str } jika sukses. Raise Exception jika gagal.
          """
          html_body = f"""
          <h2>Pesan Kontak Baru</h2>
          <p><strong>Nama:</strong> {from_name}</p>
          <p><strong>Email:</strong> <a href="mailto:{from_email}">{from_email}</a></p>
          <p><strong>WhatsApp:</strong> {phone or '(tidak diisi)'}</p>
          <p><strong>Pesan:</strong></p>
          <blockquote style="border-left:3px solid #0B7D6E;padding-left:12px;margin:12px 0;">
            {message.replace(chr(10), '<br>')}
          </blockquote>
          <hr>
          <p style="color:#666;font-size:12px;">Pesan ini dikirim dari form kontak di rekaciptaindonesia.com/kontak</p>
          """
          try:
              response = resend.Emails.send({
                  "from": DEFAULT_FROM,
                  "to": to_email,
                  "reply_to": from_email,
                  "subject": f"[Kontak Web] Pesan baru dari {from_name}",
                  "html": html_body,
              })
              logger.info("contact_email_sent", extra={"resend_id": response.get("id")})
              return response
          except Exception as e:
              logger.error("contact_email_failed", extra={"error": str(e)})
              raise
  ```
- [ ] **Domain verification:** Untuk production, tambah note di README.md backend: "Verifikasi domain `rekaciptaindonesia.com` di Resend dashboard sebelum go-live. Sampai itu selesai, kirim dari `onboarding@resend.dev` (default testing)."
- [ ] Update `backend/services/__init__.py` (buat jika belum ada) untuk expose `EmailService`
- [ ] Verifikasi startup FastAPI: `uvicorn main:app --reload` — tidak ada import error

**Sentry integration:**
- [ ] Exception di dalam `send_contact_notification` akan otomatis ter-capture Sentry via `FastApiIntegration` (dari Epic 1) — verifikasi tidak ada double capture

> **Output:** `backend/services/email_service.py` ter-commit + `resend` di requirements.

---

#### `E2-S3-BE-03` — Router: `POST /contact/send`
**Priority:** 🔴 HIGH &emsp; **Tags:** `Backend` · `Blocker`

Endpoint publik (tanpa auth) untuk submit form kontak. Baca alamat email tujuan dari `company_settings`.

**Konteks:**
- File baru: `backend/routers/contact.py`
- Rate limit via `slowapi`: 5 request per IP per menit (sama dengan pattern login)
- Fetch `email` key dari `company_settings` via `core.supabase` — bukan hardcode env var
- Baca IP client dari header `X-Forwarded-For` (Railway di belakang proxy)

**Implementasi:**
- [ ] Buat `backend/routers/contact.py`:
  ```python
  from fastapi import APIRouter, Depends, HTTPException, Request
  from slowapi import Limiter
  from slowapi.util import get_remote_address
  from datetime import datetime, timezone
  import logging

  from schemas.contact import ContactRequest, ContactResponse
  from services.email_service import EmailService
  from core.supabase import get_supabase

  router = APIRouter(prefix="/contact", tags=["contact"])
  limiter = Limiter(key_func=get_remote_address)
  logger = logging.getLogger(__name__)

  @router.post("/send", response_model=ContactResponse)
  @limiter.limit("5/minute")
  async def send_contact(request: Request, payload: ContactRequest):
      # 1. Ambil email tujuan dari company_settings
      supabase = get_supabase()
      settings_result = supabase.table("company_settings") \
          .select("value") \
          .eq("key", "email") \
          .single() \
          .execute()

      admin_email = settings_result.data.get("value") if settings_result.data else None
      if not admin_email:
          logger.error("contact_missing_admin_email")
          raise HTTPException(500, detail="Email tujuan tidak terkonfigurasi. Hubungi administrator.")

      # 2. Kirim email
      try:
          EmailService.send_contact_notification(
              to_email=admin_email,
              from_name=payload.name,
              from_email=payload.email,
              phone=payload.phone,
              message=payload.message,
          )
      except Exception as e:
          logger.error("contact_send_failed", extra={"error": str(e)})
          raise HTTPException(500, detail="Gagal mengirim pesan. Silakan coba lagi atau hubungi via WhatsApp.")

      return ContactResponse(
          success=True,
          message="Pesan Anda berhasil terkirim.",
          submitted_at=datetime.now(timezone.utc),
      )
  ```
- [ ] Register router di `backend/main.py`:
  ```python
  from routers.contact import router as contact_router
  app.include_router(contact_router, prefix="/api/v1")
  ```
- [ ] Verifikasi Swagger UI: `http://localhost:8000/docs` — endpoint `POST /api/v1/contact/send` muncul, tanpa lock icon (public), request body schema benar

**Testing:**
- [ ] Test 200: `curl -X POST http://localhost:8000/api/v1/contact/send -H "Content-Type: application/json" -d '{"name":"Test User","email":"test@example.com","message":"Halo, ini test pesan."}'` → return `{ success: true, ... }`
- [ ] Test 422 (validasi): kirim `{"name":"a","email":"invalid","message":""}` → return 422 dengan detail per field
- [ ] Test 429 (rate limit): submit 6× dalam < 1 menit → request ke-6 return 429 dengan `Retry-After` header
- [ ] Test 500 (email fail simulation): temporary rusakkan `RESEND_API_KEY` di `.env` → submit → return 500 dengan pesan generik (bukan expose internal error)

> **Output:** `backend/routers/contact.py` + registered di `main.py`.

---

#### `E2-S3-BE-04` — Router: `PATCH /settings` — Update Company Settings
**Priority:** 🔴 HIGH &emsp; **Tags:** `Backend` · `Blocker`

Endpoint terlindungi JWT untuk update sebagian atau semua field di `company_settings`. Payload: `CompanySettingsBulkUpdate` (sudah ada dari Slice 1).

**Konteks:**
- File yang diupdate: `backend/routers/settings.py` (sudah ada dari Slice 1 dengan `GET /`)
- Reuse `CompanySettingsBulkUpdate` schema (sudah ada di `backend/schemas/settings.py` dari Slice 1)
- Reuse dependency `get_current_user` dari `backend/dependencies/auth.py` (Epic 1)
- Update dilakukan dalam transaction: semua key sukses atau semua fail

**Implementasi:**
- [ ] Tambah handler `PATCH /` di `backend/routers/settings.py`:
  ```python
  from schemas.settings import (
      CompanySettingItem,
      CompanySettingsResponse,
      CompanySettingsBulkUpdate,
  )
  from dependencies.auth import get_current_user
  from core.supabase import get_supabase

  @router.patch("/", response_model=CompanySettingsResponse)
  async def update_settings(
      payload: CompanySettingsBulkUpdate,
      current_user = Depends(get_current_user),
  ):
      """
      Update satu atau lebih field di company_settings.
      Payload: { updates: [{ key: "email", value: "..." }, ...] }
      Hanya key yang whitelist yang boleh diupdate — mencegah admin
      accidentally atau intentionally mengubah field statistik.
      """
      EDITABLE_KEYS = {
          "whatsapp_1",
          "whatsapp_2",
          "email",
          "address",
          "gmaps_embed_url",
          "wa_default_message",
      }

      # Validasi: semua key di payload harus ada di whitelist
      invalid_keys = [u.key for u in payload.updates if u.key not in EDITABLE_KEYS]
      if invalid_keys:
          raise HTTPException(
              422,
              detail=f"Field berikut tidak boleh diubah dari panel: {', '.join(invalid_keys)}"
          )

      supabase = get_supabase()

      # Update per row — Supabase Python SDK tidak native support batch update
      # via satu statement, jadi loop dengan try/except
      updated_items = []
      for update in payload.updates:
          try:
              result = supabase.table("company_settings") \
                  .update({"value": update.value}) \
                  .eq("key", update.key) \
                  .execute()
              if not result.data:
                  raise HTTPException(404, detail=f"Key '{update.key}' tidak ditemukan di database.")
              updated_items.append(CompanySettingItem(**result.data[0]))
          except HTTPException:
              raise
          except Exception as e:
              logger.error("settings_update_failed", extra={"key": update.key, "error": str(e)})
              raise HTTPException(500, detail=f"Gagal update key '{update.key}'.")

      logger.info("settings_updated", extra={"user_id": current_user.id, "keys": [u.key for u in payload.updates]})

      # Return semua settings terbaru (biar frontend refresh state)
      all_settings = supabase.table("company_settings").select("*").execute()
      return CompanySettingsResponse(
          items=[CompanySettingItem(**item) for item in all_settings.data]
      )
  ```
- [ ] Verifikasi Swagger UI: endpoint `PATCH /api/v1/settings/` muncul dengan lock icon (auth required)

**Testing:**
- [ ] Test 200: login as admin, dapatkan JWT, curl PATCH dengan Bearer token, payload `{ updates: [{ key: "whatsapp_1", value: "081234567890" }] }` → return 200 dengan semua items terbaru
- [ ] Test 401: PATCH tanpa Authorization header → return 401
- [ ] Test 422 (whitelist violation): payload `{ updates: [{ key: "partner_count", value: "999" }] }` → return 422 dengan pesan tentang field tidak boleh diubah
- [ ] Test 404: payload dengan key yang tidak ada di DB (misal typo `"whatapp_1"` — tapi tidak akan sampai sini karena whitelist duluan)

> **Output:** `backend/routers/settings.py` updated dengan `PATCH /`.

---

#### `E2-S3-BE-05` — Env Var Verification: `RESEND_API_KEY` di Railway
**Priority:** 🔴 HIGH &emsp; **Tags:** `Backend` · `Config` · `Blocker`

- [ ] Buka Railway dashboard → project backend RCI → Variables tab
- [ ] Verifikasi `RESEND_API_KEY` sudah ter-set dengan value dari Resend dashboard (staging & production keys terpisah)
- [ ] Jika belum ada:
  1. Buka [resend.com](https://resend.com) → login akun proyek
  2. API Keys → Create API Key → nama "RCI Staging" → copy value
  3. Paste di Railway `RESEND_API_KEY`
  4. Redeploy service
- [ ] Verifikasi startup FastAPI di Railway logs: tidak ada error `pydantic.ValidationError: RESEND_API_KEY field required` (dari `pydantic-settings` validation di `core/config.py`)
- [ ] Buka `/health` atau `/docs` di Railway URL → responsive
- [ ] Update `backend/.env.example`: pastikan `RESEND_API_KEY=re_xxx` ada sebagai template

> **Output:** Backend deploy sukses dengan Resend key ter-set.

---

### 3b — API Contract

---

#### `E2-S3-CONT-01` — Update `types/api.ts` dengan Contact Types
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` · `Backend` · `Blocker`

Sinkronisasi TypeScript types dengan Pydantic schemas baru.

**Konteks:**
- File yang diupdate: `types/api.ts`
- Reference: `ARCHITECTURE.md §16.1` — pattern manual sync per aturan wajib

- [ ] Tambah interface berikut ke `types/api.ts`:
  ```typescript
  // Slice 3 — Contact Form
  export interface ContactRequest {
    name: string
    email: string
    phone?: string
    message: string
  }

  export interface ContactResponse {
    success: boolean
    message: string
    submitted_at: string // ISO 8601
  }
  ```
- [ ] Verifikasi tidak ada TypeScript error: `npx tsc --noEmit`
- [ ] Update `ARCHITECTURE.md §16.1` — tambah baris di tabel:
  ```markdown
  | `class ContactRequest` | `interface ContactRequest` |
  | `class ContactResponse` | `interface ContactResponse` |
  ```

> **Output:** `types/api.ts` selaras dengan backend + `ARCHITECTURE.md` updated.

---

### 3c — Frontend Public (Kontak Page)

Semua task frontend publik dikerjakan setelah 3a dan 3b selesai.

---

#### `E2-S3-FE-01` — Setup folder, `page.tsx`, metadata, `loading.tsx`
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` · `Blocker`

**Konteks:**
- Folder belum ada — perlu dibuat: `app/(public)/kontak/`
- Rendering strategy: ISR `revalidate: 3600` (1 jam) — data dari `company_settings` bisa berubah kalau admin edit
- Data fetch: `lib/supabase/public.ts` untuk preserve Static rendering di build output
- **Jangan** pakai `lib/supabase/server.ts` — akan bikin route Dynamic (`ƒ`)

**Implementasi:**
- [ ] Buat folder `app/(public)/kontak/`
- [ ] Buat `app/(public)/kontak/page.tsx`:
  - Server Component
  - Export `revalidate = 3600`
  - Export `metadata` sesuai spek `E2-S3-UX-05`
  - Fetch data: `supabasePublic.from('company_settings').select('key, value')`
  - Transform hasil ke object: `settingsMap = { whatsapp_1: '...', ... }`
  - Render: `<InnerPageHero />`, `<ContactSection />` (grid 2 kolom), `<GMapsEmbed />`
  - `<InnerPageHero />` reuse dari Slice 2 dengan props sesuai `E2-S3-UX-01`
  - Inject JSON-LD LocalBusiness schema via `<Script type="application/ld+json">` di dalam page
- [ ] Buat `app/(public)/kontak/loading.tsx` sesuai spek `E2-S3-UX-06`
- [ ] Update `app/sitemap.ts`: tambah entry `/kontak` dengan `priority: 0.9`, `changeFrequency: 'monthly'`
- [ ] Verifikasi: `npm run build` — output menampilkan `/kontak` sebagai `○` (Static), bukan `ƒ` (Dynamic)
- [ ] Verifikasi lokal: `http://localhost:3000/kontak` render tanpa error

---

#### `E2-S3-FE-02` — Component: `components/sections/ContactInfo.tsx`
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend`

Server Component yang render info alamat + email + jam operasional. Props: `settingsMap`.

- [ ] Buat `components/sections/ContactInfo.tsx`
- [ ] Props interface:
  ```typescript
  interface ContactInfoProps {
    address: string
    email: string
  }
  ```
- [ ] Render 3 baris info dengan ikon Lucide (`MapPin`, `Mail`, `Clock`) sesuai spek `E2-S3-UX-01`
- [ ] Jam operasional hardcoded: "Senin — Sabtu · 08:00 — 17:00 WIB"
- [ ] Email pakai `<a href={\`mailto:${email}\`} className="link-animated">`
- [ ] Bungkus dengan `<RevealWrapper variant="reveal-left">`

---

#### `E2-S3-FE-03` — Component: `components/sections/WhatsAppButtons.tsx`
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend`

Server Component. Render 2 tombol WA yang link ke `wa.me/...`.

- [ ] Buat `components/sections/WhatsAppButtons.tsx`
- [ ] Props:
  ```typescript
  interface WhatsAppButtonsProps {
    whatsapp1: string
    whatsapp2?: string
    defaultMessage: string
  }
  ```
- [ ] Import `generateWALink` dari `lib/wa-link.ts`
- [ ] Untuk setiap nomor: render `<Link>` (bukan `<Button asChild>`) dengan class:
  ```tsx
  <Link
    href={generateWALink(whatsapp1, defaultMessage)}
    target="_blank"
    rel="noopener noreferrer"
    className={cn(
      buttonVariants({ size: 'lg' }),
      "bg-green-500 hover:bg-green-600 text-white gap-2"
    )}
  >
    <MessageCircle className="w-5 h-5" aria-hidden="true" />
    WA {formatPhoneDisplay(whatsapp1)}
  </Link>
  ```
- [ ] Helper `formatPhoneDisplay(nomor)`: `082136096528` → `+62 821-3609-6528` (utility function baru di `lib/utils.ts` atau inline)
- [ ] Sembunyikan tombol WA 2 jika `!whatsapp2 || whatsapp2 === ''`
- [ ] Wajib pakai pattern `<Link className={cn(buttonVariants(...))}>` — bukan `<Button asChild>` (constraint Base UI dari userMemories)

---

#### `E2-S3-FE-04` — Component: `components/forms/ContactForm.tsx` (`'use client'`)
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` · `Blocker`

Form kontak dengan react-hook-form + Zod, submit ke FastAPI.

**Konteks:**
- File baru: `components/forms/ContactForm.tsx`
- `'use client'` — pakai `useState`, `react-hook-form`, dan event handler
- shadcn `Form` sudah terinstall dari Epic 1 (`components/ui/form.tsx`)
- shadcn `Textarea` — cek apakah sudah terinstall. Jika belum: `npx shadcn@latest add textarea` (atau equivalent untuk Base UI setup di project ini — cek dokumentasi shadcn config)
- shadcn `Sonner` (toast) — install jika belum: `npx shadcn@latest add sonner`, lalu mount `<Toaster />` di `app/layout.tsx` root

**Implementasi:**
- [ ] Cek shadcn config di project — konfirmasi Textarea dan Sonner tersedia
- [ ] Buat `components/forms/ContactForm.tsx`:
  ```tsx
  'use client'
  import { useForm } from 'react-hook-form'
  import { zodResolver } from '@hookform/resolvers/zod'
  import { z } from 'zod'
  import { toast } from 'sonner'
  import { apiFetch } from '@/lib/api'
  import type { ContactRequest, ContactResponse } from '@/types/api'
  // + shadcn Form components, Button, Input, Textarea

  const contactSchema = z.object({
    name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
    email: z.string().email('Format email tidak valid'),
    phone: z
      .string()
      .regex(/^(\+62|62|0)8\d{8,12}$/, 'Format WA Indonesia tidak valid')
      .optional()
      .or(z.literal('')),
    message: z.string().min(10, 'Pesan minimal 10 karakter').max(1000),
  })

  type ContactFormValues = z.infer<typeof contactSchema>

  export function ContactForm() {
    const form = useForm<ContactFormValues>({
      resolver: zodResolver(contactSchema),
      defaultValues: { name: '', email: '', phone: '', message: '' },
    })

    async function onSubmit(values: ContactFormValues) {
      try {
        await apiFetch<ContactResponse>('/contact/send', {
          method: 'POST',
          body: JSON.stringify(values),
          // auth: false — endpoint publik
        })
        toast.success('Pesan Anda berhasil terkirim. Kami akan merespons dalam 1 × 24 jam kerja.')
        form.reset()
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan'
        if (errorMessage.includes('429')) {
          toast.warning('Terlalu banyak permintaan. Silakan tunggu beberapa saat.')
        } else {
          toast.error('Gagal mengirim pesan. Silakan coba lagi atau hubungi via WhatsApp.')
        }
      }
    }

    return (
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        {/* ... field-field dengan Form component shadcn */}
      </form>
    )
  }
  ```
- [ ] Implement 4 field (name, email, phone, message) dengan Zod validation + inline error message
- [ ] Character counter di field `message`: `{form.watch('message')?.length ?? 0}/1000`
- [ ] Submit button: pakai `form.formState.isSubmitting` untuk loading state
- [ ] Tombol disabled saat submitting: `disabled={form.formState.isSubmitting}`
- [ ] Handling 429 dari FastAPI: `apiFetch` throw error dengan message yang menyertakan status code — check dan kasih toast warning

**Testing lokal:**
- [ ] Fill form dengan data valid → submit → verifikasi toast success + form reset
- [ ] Fill `name: "a"` → verifikasi error inline muncul
- [ ] Submit tanpa fill required → verifikasi field required error muncul
- [ ] Submit 6× cepat → verifikasi toast warning rate limit

---

#### `E2-S3-FE-05` — Component: `components/sections/GMapsEmbed.tsx`
**Priority:** 🟡 MED &emsp; **Tags:** `Frontend`

Server Component. Render iframe Google Maps atau fallback.

- [ ] Buat `components/sections/GMapsEmbed.tsx`
- [ ] Props:
  ```typescript
  interface GMapsEmbedProps {
    embedUrl: string
    address: string  // untuk fallback link Google Maps
  }
  ```
- [ ] Validasi URL: `const isValid = embedUrl?.startsWith('https://www.google.com/maps/embed')`
- [ ] Jika valid: render iframe dengan spek dari `E2-S3-UX-03`
- [ ] Jika tidak valid: render fallback box dengan ikon `MapPin` besar + address + tombol "Buka di Google Maps"
  - Tombol: `<Link>` dengan `href={\`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}\`}` `target="_blank" rel="noopener noreferrer"`
- [ ] Bungkus dengan `<RevealWrapper variant="reveal-up">`

---

#### `E2-S3-FE-06` — Assembly Halaman Kontak + Heading Hierarchy Verification
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` · `SEO`

Memastikan semua section terakit dengan benar dan struktur semantik HTML terjaga.

- [ ] Verifikasi urutan section di `app/(public)/kontak/page.tsx`:
  ```
  <InnerPageHero />         ← <h1> "Hubungi Kami" di dalam komponen ini
  <section className="...">
    <ContactInfo />         ← <h2> "Informasi Kontak"
    <WhatsAppButtons />     ← <h3> "Chat langsung via WhatsApp" (sub dari h2 di atas)
    <ContactForm />         ← <h2> "Kirim Pesan"
  </section>
  <GMapsEmbed />            ← <h2> "Lokasi Kantor Kami"
  ```
- [ ] Verifikasi heading tidak ada yang skip level
- [ ] Verifikasi tepat satu `<h1>` di seluruh halaman
- [ ] Test: `npm run build` → tidak ada error TypeScript, tidak ada missing module
- [ ] Verifikasi: halaman dapat diakses di `http://localhost:3000/kontak`
- [ ] Verifikasi `ARCHITECTURE.md §5.3`: tambah baris mapping untuk Kontak
  ```markdown
  | `app/(public)/kontak/page.tsx` | Server | Data dari Supabase via public client, ISR |
  | `components/forms/ContactForm.tsx` | 'use client' | react-hook-form, useState, toast |
  ```

---

### 3d — Frontend Admin (Settings Page)

---

#### `E2-S3-AD-01` — Setup: `app/admin/settings/page.tsx` + Loading Wrapper
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` · `Admin` · `Blocker`

Halaman admin settings. Layout menggunakan `app/admin/layout.tsx` yang sudah ada dari Epic 1 (auth check + AdminSidebar + AdminHeader).

**Konteks:**
- Folder belum ada: `app/admin/settings/` — perlu dibuat
- Rendering: Dynamic (default untuk `/admin/*`)
- Karena butuh interaksi form → **Client Component**, tapi kita pakai pola Server Wrapper + Client Leaf:
  - `page.tsx` = Server Component tipis. Render `<AdminHeader />` + `<SettingsForm />` (client leaf).
  - `SettingsForm` = `'use client'`, fetch data initial di dalamnya.

**Implementasi:**
- [ ] Buat folder `app/admin/settings/`
- [ ] Buat `app/admin/settings/page.tsx`:
  ```tsx
  import { AdminHeader } from '@/components/layout/AdminHeader'
  import { SettingsForm } from '@/components/admin/SettingsForm'

  export const metadata = {
    title: 'Pengaturan Kontak — Admin RCI',
  }

  export default function AdminSettingsPage() {
    return (
      <>
        <AdminHeader
          title="Pengaturan Kontak"
          breadcrumb={[
            { label: 'Dashboard', href: '/admin/dashboard' },
            { label: 'Pengaturan' },
          ]}
        />
        <p className="text-sm text-neutral-600 mb-6">
          Kelola informasi kontak yang tampil di halaman publik. Perubahan akan langsung
          tercermin di halaman Kontak dan Beranda.
        </p>
        <SettingsForm />
      </>
    )
  }
  ```
- [ ] Verifikasi: `/admin/settings` bisa diakses setelah login. Jika belum login → redirect ke `/admin/login` (via middleware Epic 1)

---

#### `E2-S3-AD-02` — Component: `components/admin/SettingsForm.tsx` (`'use client'`)
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` · `Admin` · `Blocker`

Component utama admin — fetch data awal, render form, submit ke `PATCH /settings`.

**Konteks:**
- File baru: `components/admin/SettingsForm.tsx`
- Fetch initial via `apiFetch<CompanySettingsResponse>('/settings/', { auth: true })` — pakai `GET` yang sudah ada dari Slice 1
- Submit via `apiFetch<CompanySettingsResponse>('/settings/', { method: 'PATCH', body: JSON.stringify({...}), auth: true })`
- Setelah sukses: panggil Server Action `revalidateSettings()` (dibuat di task `E2-S3-CACHE-01`)

**Zod schema untuk validasi form (mirror validasi backend):**
```typescript
const settingsSchema = z.object({
  whatsapp_1: z.string().regex(/^0\d{9,13}$/, 'Format: 08xxxxxxxxxx'),
  whatsapp_2: z.string().regex(/^0\d{9,13}$/, 'Format: 08xxxxxxxxxx').or(z.literal('')),
  email: z.string().email('Format email tidak valid'),
  address: z.string().min(10).max(500),
  gmaps_embed_url: z
    .string()
    .startsWith('https://www.google.com/maps/embed', 'URL harus dimulai dengan https://www.google.com/maps/embed')
    .or(z.literal('')),
  wa_default_message: z.string().min(10).max(300),
})
```

**State management:**
- [ ] `useState` untuk `isLoading` (initial fetch)
- [ ] `useState` untuk `readOnlyData` — untuk 4 stat non-editable yang di-tampilkan di info block
- [ ] `useForm` dengan `defaultValues` di-set setelah initial fetch selesai
- [ ] Setelah initial fetch: `form.reset(fetchedValues)` untuk populate form

**Implementasi outline:**
- [ ] Buat `components/admin/SettingsForm.tsx`
- [ ] `useEffect` untuk fetch data initial saat mount
- [ ] Loading state: tampilkan 6 skeleton (`TextLineSkeleton`) sesuai spek
- [ ] Error state saat fetch fail: tombol "Coba Lagi"
- [ ] Render form dengan 6 field editable (`whatsapp_1`, `whatsapp_2`, `email`, `address`, `gmaps_embed_url`, `wa_default_message`)
- [ ] Helper text di bawah `gmaps_embed_url` sesuai spek
- [ ] Helper text di bawah `wa_default_message` sesuai spek
- [ ] Section terpisah di bawah form: "Statistik Dinamis (Read-only)" dengan 4 data non-editable
- [ ] Footer form: tombol "Batal" (kiri, reset form ke server state) + "Simpan Perubahan" (kanan, primary)
- [ ] Submit handler:
  ```typescript
  async function onSubmit(values: SettingsFormValues) {
    // Transform ke CompanySettingsBulkUpdate payload
    const updates = Object.entries(values).map(([key, value]) => ({ key, value }))
    try {
      const response = await apiFetch<CompanySettingsResponse>('/settings/', {
        method: 'PATCH',
        body: JSON.stringify({ updates }),
        auth: true,
      })
      toast.success('Perubahan berhasil disimpan. Halaman publik telah diperbarui.')
      // Trigger revalidation halaman publik
      await revalidateSettings() // Server Action dari task berikutnya
      // Update form state ke value baru
      const newValues = settingsResponseToFormValues(response)
      form.reset(newValues)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      if (msg.includes('401')) {
        // Middleware akan handle — tapi safety fallback
        window.location.href = '/admin/login'
        return
      }
      toast.error('Gagal menyimpan. Silakan coba lagi. Jika berulang, hubungi developer.')
    }
  }
  ```
- [ ] Helper `settingsResponseToFormValues(response)`: transform `{ items: [{ key, value }, ...] }` → `{ whatsapp_1: '...', email: '...', ... }`

**Testing lokal:**
- [ ] Buka `/admin/settings` (login dulu) → verifikasi form muncul dengan value ter-load
- [ ] Ubah nilai `whatsapp_1` → klik Simpan → verifikasi toast success
- [ ] Buka `/kontak` di tab baru → verifikasi nilai baru muncul (mungkin perlu hard refresh sekali)
- [ ] Buka `/` → verifikasi footer nilai baru muncul
- [ ] Test validasi client: masukkan `whatsapp_1: "123"` → verifikasi error inline muncul
- [ ] Test 422 dari backend: manipulate payload di DevTools untuk kirim key non-editable (misal `partner_count`) → verifikasi backend reject dengan 422

---

#### `E2-S3-AD-03` — Verifikasi Sidebar Menu Entry
**Priority:** 🟡 MED &emsp; **Tags:** `Frontend` · `Admin`

- [ ] Buka `constants/admin-navigation.ts` (Epic 1)
- [ ] Verifikasi entry untuk "Pengaturan" dengan `href="/admin/settings"` sudah ada. Jika belum, tambahkan:
  ```typescript
  { label: 'Pengaturan', href: '/admin/settings', icon: 'Settings' }
  ```
- [ ] Test: navigasi dari sidebar → klik "Pengaturan" → landing di `/admin/settings`
- [ ] Test active state: saat berada di `/admin/settings`, entry sidebar "Pengaturan" harus highlight (sudah di-handle oleh `AdminSidebar` dari Epic 1)

---

#### `E2-S3-AD-04` — Empty State + Retry State
**Priority:** 🟡 MED &emsp; **Tags:** `Frontend` · `Admin`

Bagi jika terjadi kondisi anomali (misal DB kosong, atau fetch fail).

- [ ] Case: fetch initial return 0 items (unlikely karena Slice 1 seed 10 rows, tapi safety) → tampilkan pesan "Data belum ter-seed. Hubungi developer."
- [ ] Case: fetch fail (network error / 5xx) → tampilkan card dengan pesan "Gagal memuat pengaturan" + tombol "Coba Lagi" (memanggil ulang fetch)
- [ ] Case: submit fail berulang → toast tetap muncul tapi form tidak ter-reset (user bisa retry tanpa kehilangan input)

---

### 3e — Cache Invalidation

---

#### `E2-S3-CACHE-01` — Server Action untuk Revalidate Halaman Publik Setelah Save
**Priority:** 🔴 HIGH &emsp; **Tags:** `Frontend` · `Blocker`

Setelah admin klik Simpan dan `PATCH /settings` sukses, panggil Server Action yang me-revalidate `/` dan `/kontak` sehingga next visitor melihat data baru tanpa nunggu ISR expire (1 jam).

**Konteks:**
- File baru: `app/admin/settings/actions.ts`
- Server Action native Next.js 15 — tidak perlu Route Handler terpisah
- Pattern: `'use server'` file dengan async function yang dipanggil dari Client Component
- Alternative: `POST /api/revalidate-settings` Route Handler dengan secret token — pattern ini lebih explicit tapi butuh env var extra. Prefer Server Action.

**Implementasi:**
- [ ] Buat `app/admin/settings/actions.ts`:
  ```typescript
  'use server'
  import { revalidatePath } from 'next/cache'
  import { createClient } from '@/lib/supabase/server'

  export async function revalidateSettings() {
    // Verifikasi user authenticated — Server Action bisa dipanggil dari mana saja
    // di server, jadi kita perlu double-check
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('UNAUTHORIZED')
    }

    // Revalidate halaman publik yang meng-konsumsi company_settings
    revalidatePath('/')
    revalidatePath('/kontak')

    return { revalidated: true, timestamp: new Date().toISOString() }
  }
  ```
- [ ] Import di `SettingsForm.tsx`: `import { revalidateSettings } from '@/app/admin/settings/actions'`
- [ ] Panggil `await revalidateSettings()` setelah `PATCH /settings` sukses (sebelum toast success)
- [ ] Handling error: jika `revalidateSettings()` throw → still show success toast untuk save (karena data sudah ter-save di DB), tapi tambah warning: "Perubahan tersimpan. Halaman publik mungkin butuh beberapa saat untuk update."

**Testing:**
- [ ] Ubah `whatsapp_1` di admin → Simpan → verifikasi `/kontak` menampilkan nilai baru **tanpa hard refresh** (biasanya dalam 1-2 detik)
- [ ] Ubah lagi → verifikasi Beranda footer juga update

---

## Layer 4 · QA & Observability

---

#### `E2-S3-QA-01` — Visual Review Kontak: Semua Breakpoints
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA` · `Frontend`

- [ ] Test di **375px** (iPhone SE):
  - `InnerPageHero`: title tidak overflow, breadcrumb terbaca
  - Info + Form: stack vertikal, info dulu, form di bawah — semua terbaca
  - WA buttons: stack vertikal, full width, tap target ≥ 44px
  - Form: field-field full width, submit button full width
  - GMaps embed: aspect-ratio proporsional, tidak terpotong
- [ ] Test di **768px** (tablet):
  - Info + Form: masih stack atau sudah 2 kolom sesuai design
  - WA buttons: horizontal side-by-side
- [ ] Test di **1280px** (laptop):
  - Grid 2 kolom sesuai `E2-S3-UX-01`
  - Whitespace cukup, tidak crowded
- [ ] Tidak ada horizontal scroll di semua breakpoint
- [ ] GMaps iframe responsive dan lazy-load

---

#### `E2-S3-QA-02` — Visual Review Admin Settings: Semua Breakpoints
**Priority:** 🟡 MED &emsp; **Tags:** `QA` · `Admin`

- [ ] Test di **375px**: form field-field stack vertikal, semua terbaca, submit button full width
- [ ] Test di **768px**: form tetap 1 kolom, tapi textarea `address` dan `wa_default_message` cukup lebar
- [ ] Test di **1280px**: form card `max-w-3xl mx-auto` (atau sesuai design), whitespace cukup
- [ ] Sidebar collapse/expand di mobile berfungsi (dari Epic 1)
- [ ] Info block "Statistik Dinamis" jelas terpisah secara visual dari form

---

#### `E2-S3-QA-03` — Contact Form: End-to-End Test
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA` · `Backend`

- [ ] Fill form dengan data valid → submit → toast sukses muncul dalam ≤ 5 detik → form reset
- [ ] Cek inbox admin (`rekaciptaindonesiaa@gmail.com` atau apa pun yang tersimpan di `company_settings.email`) → email masuk dengan subject "[Kontak Web] Pesan baru dari {nama}"
- [ ] Email body meliputi: nama, email, WA (jika diisi), pesan, format HTML rapih
- [ ] Reply-to header: email harus balik ke email pengirim (`payload.email`), bukan ke `from`
- [ ] Test invalid: submit tanpa fill required → validation error inline, tidak submit ke server
- [ ] Test rate limit: submit 6× berturut-turut cepat → request ke-6 dapat 429 → toast warning
- [ ] Test server down: temporary matikan Railway backend → submit → toast error network → user bisa retry setelah backend hidup

---

#### `E2-S3-QA-04` — Admin Settings: End-to-End Test
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA` · `Admin` · `Security`

- [ ] Test flow full: login → sidebar → Pengaturan → form ter-load dengan value saat ini → ubah 2 field → Simpan → toast sukses
- [ ] Verifikasi database: buka Supabase Dashboard → table editor → `company_settings` → verifikasi 2 field yang diubah punya `value` dan `updated_at` yang baru
- [ ] Buka `/kontak` di incognito → nilai baru muncul (revalidate sudah trigger)
- [ ] Buka `/` di incognito → footer nilai baru muncul
- [ ] Test tanpa login: buka `/admin/settings` di incognito → redirect ke `/admin/login` (middleware Epic 1)
- [ ] Test JWT expired: manipulasi cookie session di DevTools untuk set exp ke masa lalu → refresh → redirect login
- [ ] Test whitelist backend: buka DevTools → intercept PATCH request → tambah `{ key: "partner_count", value: "999" }` ke payload → verifikasi backend reject 422 dan tidak update DB
- [ ] Test optimistic UX: klik Simpan → button jadi disabled + text "Menyimpan..." selama request → tidak bisa double-submit
- [ ] Test Batal button: ubah field → klik Batal → form kembali ke server state (bukan default kosong)

---

#### `E2-S3-QA-05` — Lighthouse + Manual Accessibility
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA` · `Performance` · `Accessibility`

**Halaman Kontak:**
- [ ] Lighthouse: **Performance ≥ 85, Accessibility ≥ 90, SEO ≥ 90, Best Practices ≥ 90**
- [ ] Semua form field punya `<Label>` dengan `htmlFor`
- [ ] Error message pakai `aria-describedby`
- [ ] Submit button pakai `aria-busy="true"` saat loading
- [ ] Keyboard navigation: Tab → semua field bisa dicapai → Enter di submit → focus tidak lompat aneh
- [ ] Screen reader test (VoiceOver / NVDA): baca semua field label + error dengan jelas
- [ ] Iframe Google Maps punya `title` yang deskriptif
- [ ] JSON-LD LocalBusiness schema ter-render di source HTML (verifikasi via View Source)
- [ ] `alt` text ada di semua image dekoratif (icon Lucide OK karena `aria-hidden="true"`)

**Halaman Admin Settings:**
- [ ] Tidak perlu Lighthouse SEO (`noindex`) — tapi Accessibility ≥ 90
- [ ] Keyboard-navigable: Tab → semua field → Save → Cancel
- [ ] Form validation error di-announce dengan `role="alert"` atau `aria-live="polite"`

---

#### `E2-S3-QA-06` — Definition of Done: Slice 3 Final Checklist
**Priority:** 🔴 HIGH &emsp; **Tags:** `QA` · `Demo`

Semua item berikut harus ✅ sebelum Slice 3 dinyatakan selesai dan Epic 2 dinyatakan **DONE**.

**Backend:**
- [ ] ☑ `POST /api/v1/contact/send` berjalan di Railway production
- [ ] ☑ `PATCH /api/v1/settings/` berjalan di Railway production
- [ ] ☑ `RESEND_API_KEY` ter-set di Railway (staging + production)
- [ ] ☑ Rate limit contact form berfungsi (test 6× → 429)
- [ ] ☑ Whitelist admin update berfungsi (test key non-editable → 422)
- [ ] ☑ Structured logging: request masuk terlogging dengan status, path, IP di Railway logs
- [ ] ☑ Sentry: verifikasi tidak ada error uncaught yang bocor. Uji: trigger error paksa → muncul di Sentry dashboard

**Frontend Public:**
- [ ] ☑ Halaman `/kontak` di build output tercatat sebagai `○` Static (bukan `ƒ` Dynamic)
- [ ] ☑ 4 section tampil: InnerPageHero, ContactInfo + WA Buttons, ContactForm, GMapsEmbed
- [ ] ☑ WA buttons pakai `<Link className={cn(buttonVariants(...))}>` — bukan `asChild` (verifikasi via View Source atau code review)
- [ ] ☑ Klik WA button → tab baru terbuka ke `wa.me/...` dengan pesan default
- [ ] ☑ Form kontak submit → toast sukses + email masuk ke inbox admin
- [ ] ☑ GMaps embed tampil (atau fallback kalau `gmaps_embed_url` kosong)
- [ ] ☑ Halaman responsif di 375/768/1280
- [ ] ☑ JSON-LD `LocalBusiness` schema di source HTML

**Frontend Admin:**
- [ ] ☑ `/admin/settings` protected — unauthenticated user redirect ke login
- [ ] ☑ Form ter-load dengan value dari `GET /settings`
- [ ] ☑ 6 field editable, 4 field read-only di info block terpisah
- [ ] ☑ Submit → toast sukses + revalidate halaman publik
- [ ] ☑ Batal button reset form ke server state
- [ ] ☑ Sidebar "Pengaturan" entry aktif saat di `/admin/settings`

**Kualitas Kode:**
- [ ] ☑ `types/api.ts` sync dengan Pydantic schemas (ContactRequest, ContactResponse)
- [ ] ☑ `ARCHITECTURE.md §16.1` updated dengan mapping baru
- [ ] ☑ `ARCHITECTURE.md §5.3` updated dengan mapping direktif kontak + settings
- [ ] ☑ `app/sitemap.ts` updated: `/kontak` entry ditambah
- [ ] ☑ Lighthouse Kontak: Performance ≥ 85, Accessibility ≥ 90, SEO ≥ 90
- [ ] ☑ Tidak ada TypeScript error: `npx tsc --noEmit`
- [ ] ☑ Tidak ada ESLint warning yang baru dibanding Slice 2
- [ ] ☑ Build sukses: `npm run build` + backend `uvicorn main:app` startup bersih
- [ ] ☑ Semua file baru ter-commit ke Git

**Demo ke klien:**
- [ ] ☑ Buka `/kontak` di staging → tunjukkan semua section
- [ ] ☑ Klik WA button → tunjukkan tab baru terbuka ke chat
- [ ] ☑ Submit form kontak dengan email admin di depan klien → tunjukkan email masuk
- [ ] ☑ Login sebagai admin → buka `/admin/settings` → ubah pesan default WA → Simpan → buka `/kontak` di tab baru → tunjukkan WA button sekarang membawa pesan baru
- [ ] ☑ Ubah nomor WA di admin → tunjukkan footer Beranda dan halaman Kontak update tanpa deploy

---

---

*Epic 2 Task Breakdown Slice 3 · CV Reka Cipta Indonesia · Juli 2026*
*Berdasarkan: Epic_Doc1 v1.0 · ARCHITECTURE.md v1.0 · Slice 1 & Slice 2 outputs*
*Slice sebelumnya: `epic2_task_breakdown_slice2_tentang-kami.md`*
*Slice ini menutup Epic 2 — next: Epic 3 (Katalog Produk)*
