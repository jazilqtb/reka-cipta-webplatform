# Dokumen Epic — CV Reka Cipta Indonesia
## Web Platform & CRM System
### Dokumen 1 dari 2 | Epic 1–3
**Metode:** MDD (Module-Driven Development) + Vertical Slicing
**Versi:** 1.0 | Mei 2026
**Status:** Draft

---

> **Cara membaca dokumen ini:**
> Setiap Epic dirancang agar bisa selesai secara mandiri dan langsung bisa ditunjukkan ke klien.
> Setiap Epic memiliki dua sisi: **A. Customer Web** (halaman publik) dan **B. CRM Admin Panel**.
> Masing-masing sisi memuat panduan **UI**, **Backend**, dan **Database**.
> Dokumen ini adalah panduan perancangan level menengah — bukan spesifikasi teknis final.

---

## Epic 1 — Fondasi Project & Global Layout

**Tujuan Epic:**
Menyiapkan seluruh infrastruktur teknis dan elemen antarmuka global yang menjadi fondasi semua epic berikutnya. Setelah epic ini selesai, proyek memiliki struktur folder yang baku, koneksi database aktif, sistem autentikasi admin berfungsi, dan layout global (navbar + footer) sudah tampil di website publik.

**Demo ke klien setelah epic ini:**
Website dapat dibuka di URL staging. Navbar dan footer tampil dengan benar di mobile & desktop. Halaman login admin dapat diakses dan berfungsi.

---

### A. Customer-Facing Web

#### UI
- **Global Navbar**
  - Logo perusahaan di kiri
  - Menu navigasi: Beranda, Produk, Tentang Kami, Artikel, Kalkulator, Minta Penawaran, Jadi Supplier
  - CTA button "Minta Penawaran" di kanan (aksen warna biru)
  - Sticky saat scroll ke bawah
  - Hamburger menu untuk viewport mobile (< 768px)

- **Global Footer**
  - Kolom kiri: logo + tagline singkat perusahaan
  - Kolom tengah: link navigasi utama
  - Kolom kanan: informasi kontak (alamat, nomor WA, email)
  - Baris bawah: badge SNI, badge NIB, copyright

- **Halaman 404**
  - Pesan error sederhana, sesuai brand
  - Tombol "Kembali ke Beranda"

- **Komponen loading skeleton global**
  - Dipakai di seluruh halaman saat data sedang dimuat

#### Backend
- Setup project Next.js 14 App Router
- Konfigurasi Tailwind CSS + shadcn/ui sebagai design system
- Setup environment variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`
- Layout global (`/app/layout.tsx`) yang menyertakan Navbar dan Footer
- Setup FastAPI project di folder terpisah: struktur router, middleware, dan konfigurasi CORS

#### Database
- Setup project Supabase (PostgreSQL instance)
- Aktifkan Row Level Security (RLS) secara global di semua tabel
- Belum ada tabel fungsional di epic ini — hanya konfigurasi koneksi dan RLS policy dasar
- Buat Supabase Storage: persiapkan bucket struktur untuk epic berikutnya

---

### B. CRM / Admin Panel

#### UI
- **Halaman Login Admin** (`/admin/login`)
  - Form: input email + input password
  - Logo perusahaan di tengah atas
  - Tombol "Masuk"
  - Tidak ada link registrasi (akun dibuat manual oleh developer)

- **Global Admin Layout** (dipakai semua halaman admin)
  - Sidebar kiri: logo, menu navigasi (Dashboard, Leads & RFQ, Supplier, Artikel, Produk, Pengaturan), nama user aktif, tombol logout
  - Header atas: judul halaman saat ini, breadcrumb opsional
  - Area konten utama di kanan

- **Redirect logic**
  - Sudah login → otomatis redirect ke `/admin/dashboard`
  - Belum login → otomatis redirect ke `/admin/login`
  - Dashboard placeholder untuk epic ini: hanya tampilkan "Dashboard — segera hadir"

#### Backend
- Konfigurasi Supabase Auth (provider: email + password)
- Middleware autentikasi: semua route `/admin/*` kecuali `/admin/login` wajib memiliki session aktif
- Endpoint autentikasi:
  - `POST /auth/login` — verifikasi email & password via Supabase Auth, return JWT
  - `POST /auth/logout` — invalidasi session
  - `GET /auth/me` — return data user aktif dari token [AUTH]

#### Database
- Supabase Auth: tabel `auth.users` (built-in, dikelola Supabase)
- RLS Policy dasar: semua tabel hanya bisa diakses oleh `auth.uid()` yang valid
- Seed: 1 akun admin awal (email + password, dibuat manual via Supabase dashboard)

---

### Definition of Done — Epic 1
- [ ] Website dapat diakses di URL staging (Vercel)
- [ ] Navbar tampil dengan benar di mobile dan desktop
- [ ] Footer tampil dengan benar di mobile dan desktop
- [ ] Halaman 404 berfungsi untuk URL yang tidak dikenal
- [ ] Halaman `/admin/login` dapat diakses
- [ ] Login dengan akun admin berhasil dan redirect ke dashboard
- [ ] Logout berfungsi dan redirect ke halaman login
- [ ] Koneksi Supabase aktif dan terverifikasi

---
---

## Epic 2 — Profil Perusahaan (Homepage + Tentang Kami + Kontak)

**Tujuan Epic:**
Menghadirkan identitas digital lengkap perusahaan melalui tiga halaman utama. Homepage sebagai first impression, Tentang Kami sebagai bukti kredibilitas dan legalitas, dan Kontak sebagai pintu komunikasi langsung. Admin dapat mengedit informasi kontak tanpa bantuan developer.

**Demo ke klien setelah epic ini:**
Tiga halaman dapat dibuka dan konten sesuai company profile. Tombol WhatsApp langsung membuka chat WA. Form kontak mengirim email notifikasi ke admin. Admin bisa edit info kontak dari panel.

---

### A. Customer-Facing Web

#### UI

**Halaman Beranda (`/`)**

- **Hero Section**
  - Headline: "Distributor Garam Bersertifikasi SNI untuk Kebutuhan Industri Anda"
  - Sub-headline: penjelasan singkat peran sebagai distributor (bukan produsen)
  - CTA utama: tombol "Minta Penawaran Sekarang" → ke `/minta-penawaran`
  - CTA sekunder: tombol "Lihat Produk Kami" → ke `/produk`
  - Background: foto/ilustrasi produk garam

- **Stats Bar**
  - 4 angka kepercayaan: Jenis Garam (5), Mitra Aktif (label dinamis), Kota Dilayani, Tahun Berdiri (2020)

- **Product Preview Grid**
  - Grid 5 kartu produk: foto, nama produk, badge SNI
  - Tombol "Lihat Semua Produk" → ke `/produk`

- **Cara Kerja (Infografis 4 Langkah)**
  - Langkah 1: Hubungi Kami
  - Langkah 2: Konsultasi Kebutuhan
  - Langkah 3: Pengiriman Sampel
  - Langkah 4: Distribusi Rutin
  - Desain: ikon + nomor langkah + teks deskripsi singkat

- **Industri yang Dilayani**
  - Grid ikon 6 sektor: Makanan & Minuman, Pengasinan Ikan, Water Treatment, Pakan Ternak, Pulp & Kertas, Penyamakan Kulit

- **Credibility Section**
  - Logo / nama klien aktif (PT. Surabaya Mekabox, PT. Sejati Tritunggal Indah, dst.)
  - Badge SNI dan NIB
  - Kutipan singkat tentang sertifikasi

- **CTA Section Penutup**
  - Judul: "Siap Jadi Mitra Distribusi?"
  - Tombol: "Minta Penawaran" dan "Hubungi Kami"

---

**Halaman Tentang Kami (`/tentang-kami`)**

- **Timeline Sejarah Perusahaan**
  - 2018: Studi banding di Kalianget & Sampang
  - 2019: Pendirian UD Kreasi Anak Bangsa
  - 2020: Transformasi menjadi CV Reka Cipta Indonesia (17 November)

- **Visi & Misi**
  - Visi: tampil menonjol dengan desain yang kuat
  - Misi: 4 poin misi dari company profile

- **Struktur Organisasi**
  - Foto + nama + jabatan: Komisaris (Widril Fakki), Direktur (Abdul Majid Abdillah), Manager Keuangan (Salman Al Halili), Manager Pemasaran (Irwan Sugianto)

- **Dokumen Legalitas**
  - Grid 4 dokumen: Akta Notaris, NIB (No. 0280010102479), NPWP (96.674.473.2-609.000), Status Hukum Kemenkumham
  - Setiap dokumen: thumbnail gambar + tombol "Lihat" (buka modal/lightbox)

---

**Halaman Kontak (`/kontak`)**

- **Informasi Kontak**
  - Alamat: Jl. Bratang Gede III-I No. 16A, Ngagel Rejo, Wonokromo, Surabaya 60245
  - Nomor WA: 082136096528 dan 087839031378
  - Email: rekaciptaindonesiaa@gmail.com

- **Tombol WhatsApp**
  - Dua tombol per nomor, langsung membuka `wa.me/{nomor}?text={pesan_template}`
  - Pesan template default: "Halo, saya ingin mengetahui lebih lanjut tentang produk garam CV Reka Cipta Indonesia."

- **Form Email Kontak**
  - Field: nama, email, nomor WA (opsional), pesan
  - Submit → kirim email ke admin via Resend
  - Konfirmasi inline: "Pesan Anda berhasil terkirim."

- **Google Maps Embed**
  - Iframe embed lokasi kantor

#### Backend
- Halaman Beranda dan Tentang Kami: konten sebagian besar statis di kode, sebagian (info kontak) diambil dari tabel `company_settings`
- `POST /contact/send` — endpoint menerima data form kontak, kirim email ke admin via Resend API
- Fungsi utilitas: `generateWALink(nomor, pesan)` → return URL `wa.me`
- Server-side rendering (SSR) via Next.js untuk semua halaman publik (keperluan SEO)

#### Database
- Tabel `company_settings` (dibuat di epic ini):

| Field | Tipe | Keterangan |
|---|---|---|
| `id` | UUID | Primary key |
| `key` | VARCHAR(100) | Nama konfigurasi |
| `value` | TEXT | Nilai konfigurasi |
| `updated_at` | TIMESTAMPTZ | Waktu update terakhir |

  - Contoh rows awal (seed): `whatsapp_1`, `whatsapp_2`, `email`, `address`, `gmaps_embed_url`, `wa_default_message`

---

### B. CRM / Admin Panel

#### UI
- **Halaman Pengaturan Kontak (`/admin/settings`)**
  - Form edit per item: Nomor WA 1, Nomor WA 2, Email, Alamat, URL Embed Google Maps, Pesan WA Default
  - Tombol "Simpan" per field (atau satu tombol simpan semua)
  - Konfirmasi: "Perubahan berhasil disimpan"

#### Backend
- `GET /settings` — ambil semua key-value dari `company_settings` [AUTH]
- `PATCH /settings` — update satu atau beberapa key sekaligus [AUTH]

#### Database
- Tabel `company_settings` (sama seperti di bagian A)
- RLS: public hanya bisa READ, admin bisa READ dan WRITE

---

### Definition of Done — Epic 2
- [ ] Halaman Beranda tampil lengkap dan responsif (mobile + desktop)
- [ ] Halaman Tentang Kami menampilkan sejarah, visi misi, struktur organisasi, dan dokumen legal (bisa dibuka/diperbesar)
- [ ] Halaman Kontak: tombol WA membuka WhatsApp dengan pesan template
- [ ] Form kontak mengirim email notifikasi ke alamat admin
- [ ] Google Maps embed tampil di halaman kontak
- [ ] Admin bisa mengedit info kontak di `/admin/settings`
- [ ] Perubahan info kontak dari admin tercermin di halaman publik tanpa deploy ulang

---
---

## Epic 3 — Katalog Produk

**Tujuan Epic:**
Menampilkan seluruh portofolio 5 produk garam secara profesional dengan spesifikasi teknis lengkap dan dokumen hasil uji laboratorium yang dapat diunduh. Admin dapat memperbarui konten produk, foto, dan dokumen lab tanpa bantuan developer.

**Demo ke klien setelah epic ini:**
Semua 5 produk tampil dengan foto dan spesifikasi teknis. Dokumen lab dapat diunduh. Admin bisa mengedit deskripsi, spesifikasi, foto, dan dokumen lab dari panel CRM.

---

### A. Customer-Facing Web

#### UI

**Halaman Daftar Produk (`/produk`)**

- Grid 5 kartu produk, setiap kartu berisi:
  - Foto produk
  - Nama produk dan kode (misal: PRO YD, SPO/M)
  - Badge "SNI" jika bersertifikat
  - Tagline singkat / kegunaan utama
  - Tombol "Lihat Detail"
- Filter tab opsional di atas grid: Semua | Garam Halus | Garam Kasar | Garam Industri

---

**Halaman Detail Produk (`/produk/[slug]`)**

Lima halaman dengan slug masing-masing:
1. `/produk/garam-halus-yodium` — Garam Halus PRO YD
2. `/produk/garam-halus-non-yodium` — Garam Halus PRO L
3. `/produk/garam-kasar-industri` — Garam Kasar SPO/M
4. `/produk/garam-kasar-petani` — Garam Kasar Petani Premium
5. `/produk/garam-ghpt` — Garam Halus Pakan Ternak (GHPT)

Setiap halaman detail berisi:
- Foto produk (ukuran besar, di kiri)
- Di kanan: nama produk, kode produk, badge SNI
- Deskripsi produk (paragraf)
- **Tabel Spesifikasi Teknis** (data dari hasil uji lab):
  - Contoh kolom: Parameter | Satuan | Hasil | Metode/Standar
  - Data sesuai dokumen lab per produk (kadar NaCl, kadar air, KIO3, warna, bau, dll.)
- **Kegunaan per Industri**: list ikon + nama industri yang relevan
- **Tombol Unduh Dokumen Lab** (PDF) — link ke file di Supabase Storage
- **CTA Section**:
  - Tombol "Minta Sampel" → ke form RFQ dengan produk ini pre-selected
  - Tombol "Dapatkan Penawaran" → ke form RFQ dengan produk ini pre-selected

#### Backend
- `GET /products` — ambil semua produk aktif, return array (public, no auth)
- `GET /products/{slug}` — ambil detail satu produk by slug (public, no auth)
- File PDF hasil lab dan foto produk disimpan di Supabase Storage
- URL file tersimpan di field `photo_url` dan `lab_doc_url` di tabel `products`
- Server-side rendering untuk SEO (Next.js)

#### Database
- Tabel `products`:

| Field | Tipe | Keterangan |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | VARCHAR(255) | Nama produk |
| `slug` | VARCHAR(255) | URL-friendly, unique |
| `code` | VARCHAR(50) | Kode produk (PRO YD, SPO/M, dll.) |
| `tagline` | VARCHAR(300) | Tagline singkat |
| `description` | TEXT | Deskripsi panjang produk |
| `specs` | JSONB | Spesifikasi teknis: `{nacl_pct, water_pct, kio3_ppm, color, smell, ...}` |
| `industries` | TEXT[] | Daftar industri yang dilayani |
| `is_sni` | BOOLEAN | Badge SNI tampil atau tidak |
| `photo_url` | TEXT | URL foto di Supabase Storage |
| `lab_doc_url` | TEXT | URL PDF dokumen lab di Supabase Storage |
| `updated_at` | TIMESTAMPTZ | Waktu update terakhir |

- Supabase Storage buckets:
  - `product-photos` — foto produk (public read)
  - `lab-docs` — PDF hasil uji lab (public read)
- RLS: semua user bisa READ, hanya admin yang bisa WRITE
- Seed data: 5 produk lengkap beserta spesifikasi dari company profile

---

### B. CRM / Admin Panel

#### UI

**Halaman Daftar Produk Admin (`/admin/products`)**
- List 5 produk: thumbnail foto, nama produk, kode, tombol "Edit"
- Tidak ada tombol tambah produk (produk sudah fixed 5 jenis, tidak perlu ditambah via CMS)

**Halaman Edit Produk (`/admin/products/[id]/edit`)**
- Form edit yang berisi:
  - Nama produk (text input)
  - Tagline (text input)
  - Deskripsi (textarea panjang)
  - Spesifikasi teknis: field input per parameter (kadar NaCl %, kadar air %, KIO3 ppm, dll.) — field-field ini muncul sesuai jenis produk
  - Industri yang dilayani: multi-checkbox
  - Upload foto produk → replace foto lama di Supabase Storage
  - Upload dokumen PDF hasil lab → replace file lama di Supabase Storage
  - Toggle SNI badge (on/off)
- Tombol "Simpan Perubahan"
- Konfirmasi: "Produk berhasil diperbarui"

#### Backend
- `GET /products` (admin) — sama dengan publik tapi termasuk metadata [AUTH]
- `PUT /products/{id}` — update semua field produk [AUTH]
- Upload handler: terima file dari form → upload ke Supabase Storage → return public URL → simpan URL ke tabel

#### Database
- Tabel `products` (sama seperti di atas)
- RLS Storage: bucket `product-photos` dan `lab-docs` — public untuk READ, hanya authenticated user untuk WRITE

---

### Definition of Done — Epic 3
- [ ] Halaman `/produk` menampilkan 5 produk dalam grid yang responsif
- [ ] Setiap halaman `/produk/[slug]` menampilkan detail produk lengkap dengan tabel spesifikasi
- [ ] Tombol unduh PDF membuka/mengunduh dokumen lab yang benar per produk
- [ ] Tombol "Minta Sampel" dan "Dapatkan Penawaran" mengarah ke form RFQ (Epic 4) dengan produk sudah pre-selected
- [ ] Admin bisa mengedit deskripsi dan spesifikasi produk dari panel
- [ ] Admin bisa mengganti foto produk via upload
- [ ] Admin bisa mengganti dokumen PDF lab via upload
- [ ] Perubahan dari admin langsung tercermin di halaman publik

---

## Ringkasan Dokumen 1

| Epic | Halaman Customer | Halaman Admin | Tabel Database |
|---|---|---|---|
| Epic 1 — Fondasi | Navbar, Footer, 404 | Login, Layout Admin | `auth.users` (built-in) |
| Epic 2 — Profil | Beranda, Tentang Kami, Kontak | Pengaturan Kontak | `company_settings` |
| Epic 3 — Produk | Daftar Produk, Detail Produk ×5 | Edit Produk | `products` |

**Dokumen 2 dari 2** mencakup:
- Epic 4 — Sistem RFQ + AI Proposal Generator
- Epic 5 — Pendaftaran Supplier
- Epic 6 — Artikel & Kalkulator Garam

---
*CV Reka Cipta Indonesia | Epic Document v1.0 | Doc 1 of 2*
