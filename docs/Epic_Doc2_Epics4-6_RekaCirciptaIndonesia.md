# Dokumen Epic — CV Reka Cipta Indonesia
## Web Platform & CRM System
### Dokumen 2 dari 2 | Epic 4–6
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

## Epic 4 — Sistem RFQ + AI Proposal Generator

**Tujuan Epic:**
Menghadirkan sistem penerimaan permintaan penawaran (RFQ) dari calon mitra secara otomatis, dengan pembuatan proposal profesional menggunakan AI dalam hitungan detik, serta pipeline manajemen leads di panel admin. Ini adalah fitur paling kritikal yang langsung berdampak pada kecepatan konversi penjualan.

**Demo ke klien setelah epic ini:**
Calon mitra mengisi form RFQ → email proposal profesional terkirim otomatis dalam < 30 detik → lead muncul di pipeline Kanban CRM → admin bisa generate pesan WA follow-up dengan satu klik.

---

### A. Customer-Facing Web

#### UI

**Halaman RFQ (`/minta-penawaran`)**

- **Header halaman**: judul "Minta Penawaran Sekarang", sub-teks penjelasan manfaat mengisi form
- **Form RFQ** (single-page dengan scroll, bukan multi-step):

| Field | Tipe Input | Validasi |
|---|---|---|
| Nama Lengkap | Text | Wajib, min. 3 karakter |
| Nama Perusahaan | Text | Wajib |
| Jabatan / Posisi | Text | Opsional |
| Jenis Industri | Dropdown (7 opsi) | Wajib |
| Jenis Garam Dibutuhkan | Multi-checkbox (5 produk) | Wajib, min. 1 pilihan |
| Volume per Bulan | Number input + label "ton" | Wajib, angka positif |
| Frekuensi Pengiriman | Dropdown: Mingguan / Dua Minggu / Bulanan | Wajib |
| Kota Tujuan Pengiriman | Text | Wajib |
| Email | Email input | Wajib, format valid |
| Nomor WhatsApp | Text | Wajib, format 08xx atau +62xx |
| Keterangan Tambahan | Textarea | Opsional, maks 500 karakter |

- Validasi inline: error muncul per field saat user keluar dari field tersebut (blur)
- Tombol submit: label "Kirim & Dapatkan Penawaran", disabled saat loading, tampilkan spinner
- Prefill otomatis: jika user datang dari tombol "Minta Penawaran" di halaman produk, field "Jenis Garam Dibutuhkan" sudah tercentang sesuai produk yang dipilih (via query param `?produk=garam-halus-yodium`)

---

**Halaman Konfirmasi (`/minta-penawaran/terima-kasih`)**

- Ikon centang / animasi sukses ringan
- Judul: "Permintaan Penawaran Anda Berhasil Dikirim!"
- Teks: "Proposal penawaran sudah dikirim ke email Anda. Tim kami akan menghubungi via WhatsApp dalam 1×24 jam."
- Dua tombol: "Kembali ke Beranda" dan "Lihat Produk Lainnya"
- Catatan: halaman ini hanya bisa diakses setelah submit berhasil (redirect), tidak bisa diakses langsung via URL

#### Backend

- **`POST /rfq/generate`** (public endpoint):
  1. Terima dan validasi semua field dari frontend
  2. Insert data ke tabel `rfq_leads` dengan `status = 'new'`
  3. Bangun prompt untuk Anthropic API: data RFQ + profil perusahaan Reka Cipta + instruksi format proposal HTML
  4. Kirim request ke Anthropic Claude API, terima response proposal dalam format HTML
  5. Update `rfq_leads.proposal_html` dengan hasil AI, set `proposal_generated = true`
  6. Kirim email ke calon mitra (via Resend): berisi proposal HTML dalam body email
  7. Kirim notifikasi email ke admin: "RFQ baru dari {nama_perusahaan}"
  8. Return `{ success: true }` ke frontend → frontend redirect ke halaman konfirmasi
  - **Fallback**: Jika Anthropic API timeout atau error → kirim email template statis, set `proposal_generated = false`, tetap return success ke frontend

- **Rate limiting**: maksimal 5 RFQ per IP per jam (implementasi via middleware)

#### Database

- Tabel `rfq_leads`:

| Field | Tipe | Nullable | Keterangan |
|---|---|---|---|
| `id` | UUID | NO | Primary key, auto-generated |
| `full_name` | VARCHAR(255) | NO | Nama lengkap calon mitra |
| `company_name` | VARCHAR(255) | NO | Nama perusahaan |
| `position` | VARCHAR(100) | YES | Jabatan/posisi |
| `industry_type` | VARCHAR(100) | NO | Jenis industri |
| `salt_types` | TEXT[] | NO | Array jenis garam dipilih |
| `volume_per_month` | DECIMAL(10,2) | NO | Volume dalam ton/bulan |
| `delivery_frequency` | VARCHAR(50) | NO | weekly / biweekly / monthly |
| `delivery_city` | VARCHAR(100) | NO | Kota tujuan pengiriman |
| `email` | VARCHAR(255) | NO | Email calon mitra |
| `whatsapp` | VARCHAR(20) | NO | Nomor WhatsApp |
| `notes` | TEXT | YES | Keterangan tambahan dari calon mitra |
| `admin_notes` | TEXT | YES | Catatan internal admin |
| `status` | VARCHAR(50) | NO | new / contacted / sample_sent / negotiation / deal / lost |
| `proposal_html` | TEXT | YES | Konten proposal hasil AI |
| `proposal_generated` | BOOLEAN | NO | True jika AI berhasil generate |
| `created_at` | TIMESTAMPTZ | NO | Waktu RFQ masuk |
| `updated_at` | TIMESTAMPTZ | NO | Waktu update terakhir |

- RLS: public hanya bisa INSERT (untuk submit RFQ), admin bisa READ dan WRITE semua

---

### B. CRM / Admin Panel

#### UI

**Halaman Pipeline Leads (`/admin/leads`)**

- **Tampilan Kanban**: 6 kolom status dengan kartu lead yang bisa dipindah:
  1. **Baru** — lead baru masuk, belum dihubungi
  2. **Dihubungi** — sudah ada kontak pertama
  3. **Sampel Dikirim** — sampel fisik sedang/sudah dikirim
  4. **Negosiasi** — diskusi harga dan syarat
  5. **Deal** — sepakat dan jadi mitra aktif
  6. **Tidak Jadi** — lead tidak berlanjut

- Setiap kartu lead menampilkan: nama perusahaan, jenis industri, volume, tanggal masuk, nomor WA (shortcut)
- Drag-and-drop kartu antar kolom untuk update status; tombol dropdown sebagai fallback untuk mobile
- **Panel filter**: filter berdasarkan industri, rentang tanggal masuk
- **Kolom search**: cari berdasarkan nama atau nama perusahaan
- Badge penanda: kartu yang belum diupdate > 3 hari diberi visual penanda (border merah/oranye)

---

**Halaman Detail Lead (`/admin/leads/[id]`)**

- **Informasi RFQ**: semua field dari form (nama, perusahaan, jabatan, industri, jenis garam, volume, frekuensi, kota, email, WA, keterangan)
- **Status & Histori**: dropdown ubah status + tabel histori perubahan status dengan timestamp
- **Catatan Admin**: textarea, auto-save setiap beberapa detik atau saat blur
- **Preview Proposal AI**: section yang menampilkan `proposal_html` dalam iframe atau preview box
- **Panel WA Template**: tombol "Buat Pesan WhatsApp" → buka modal berisi pesan yang sudah terformat → tombol "Buka di WhatsApp" yang generate link `wa.me`

---

**Modal / Panel WA Template Generator**

Template berubah otomatis sesuai status lead saat ini:

| Status Lead | Isi Template WA |
|---|---|
| Baru (setelah RFQ masuk) | Konfirmasi penerimaan, info proposal sudah dikirim via email |
| Dihubungi (follow-up 2 hari) | Tanya apakah proposal sudah diterima, ada pertanyaan |
| Sampel Dikirim | Konfirmasi pengiriman, nomor resi, estimasi tiba |
| Sampel Sudah Diterima | Follow-up feedback kualitas sampel |
| Negosiasi | Template berisi poin penawaran yang bisa dikustomisasi sebelum kirim |

- Setelah generate: preview pesan dalam kotak teks yang bisa diedit manual
- Tombol "Buka di WhatsApp" → buka `wa.me/{nomor_wa_lead}?text={pesan_encoded}`

#### Backend

- `GET /rfq/leads` — list semua leads, support query param: `status`, `industry`, `date_from`, `date_to`, `search` [AUTH]
- `GET /rfq/leads/{id}` — detail satu lead beserta histori status [AUTH]
- `PATCH /rfq/leads/{id}` — update status dan/atau admin_notes, otomatis catat histori [AUTH]
- `POST /rfq/wa-template` — body: `{ lead_id, status }` → return string pesan WA yang sudah diformat [AUTH]

#### Database

- Tabel `rfq_leads` (sama seperti di bagian A)
- Tabel `lead_status_history` (dibuat di epic ini):

| Field | Tipe | Keterangan |
|---|---|---|
| `id` | UUID | Primary key |
| `lead_id` | UUID | Foreign key ke `rfq_leads.id` |
| `from_status` | VARCHAR(50) | Status sebelumnya |
| `to_status` | VARCHAR(50) | Status setelah perubahan |
| `changed_at` | TIMESTAMPTZ | Waktu perubahan |

- RLS: hanya admin yang bisa READ dan WRITE kedua tabel

---

### Definition of Done — Epic 4

- [ ] Form RFQ dapat diisi lengkap dan disubmit
- [ ] Halaman konfirmasi tampil setelah submit berhasil
- [ ] Email proposal terkirim ke alamat email calon mitra (isi proposal sesuai data yang diinput)
- [ ] Notifikasi email masuk ke admin saat ada RFQ baru
- [ ] Lead baru muncul di kolom "Baru" pada pipeline Kanban CRM
- [ ] Admin bisa memindahkan lead antar kolom (drag-drop atau dropdown)
- [ ] Histori perubahan status tercatat dengan timestamp
- [ ] Tombol "Buat Pesan WA" menghasilkan pesan yang sesuai status lead
- [ ] Link WhatsApp membuka WA dengan pesan yang sudah terformat
- [ ] Rate limiting aktif (coba submit lebih dari 5x dalam 1 jam dari IP yang sama)
- [ ] Fallback berjalan jika Anthropic API gagal (email template statis tetap terkirim)
- [ ] Prefill produk dari halaman produk berfungsi di form RFQ

---
---

## Epic 5 — Pendaftaran Supplier

**Tujuan Epic:**
Menyediakan jalur formal bagi petani dan produsen garam untuk mendaftar sebagai supplier melalui website. Admin menerima notifikasi otomatis dan bisa mengelola data supplier dari panel CRM termasuk update status kemitraan.

**Demo ke klien setelah epic ini:**
Supplier mengisi form pendaftaran → data tersimpan → admin menerima email notifikasi → data supplier muncul di panel manajemen → admin bisa update status dan generate pesan WA follow-up.

---

### A. Customer-Facing Web

#### UI

**Halaman Jadi Supplier (`/jadi-supplier`)**

- **Section penjelasan manfaat**: mengapa bermitra dengan Reka Cipta (distribusi luas, pembelian rutin, harga adil)
- **Form Pendaftaran Supplier**:

| Field | Tipe Input | Validasi |
|---|---|---|
| Nama / Nama Usaha | Text | Wajib |
| Kota | Text | Wajib |
| Provinsi | Text | Wajib |
| Jenis Garam Tersedia | Multi-checkbox: Kasar Petani, Halus Yodium, Halus Non-Yodium, Industri (SPO/M), GHPT | Wajib, min. 1 pilihan |
| Kapasitas per Bulan | Number input | Wajib, angka positif |
| Satuan Kapasitas | Dropdown: Ton / Kwintal / Kg | Wajib |
| Nomor WhatsApp | Text | Wajib, format 08xx atau +62xx |
| Email | Email input | Opsional |
| Keterangan Tambahan | Textarea | Opsional |

- Submit → redirect ke halaman konfirmasi

**Halaman Konfirmasi Supplier (`/jadi-supplier/terima-kasih`)**

- Pesan sukses
- Informasi: "Pendaftaran Anda sudah kami terima. Tim kami akan menghubungi via WhatsApp dalam 2–3 hari kerja."
- Tombol "Kembali ke Beranda"

#### Backend

- **`POST /supplier/register`** (public endpoint):
  1. Validasi semua field
  2. Insert ke tabel `supplier_registrations` dengan `status = 'new'`
  3. Kirim notifikasi email ke admin via Resend: "Supplier baru mendaftar: {business_name}"
  4. Return `{ success: true }` ke frontend

#### Database

- Tabel `supplier_registrations`:

| Field | Tipe | Nullable | Keterangan |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `business_name` | VARCHAR(255) | NO | Nama / nama usaha supplier |
| `location_city` | VARCHAR(100) | NO | Kota asal |
| `location_province` | VARCHAR(100) | NO | Provinsi asal |
| `salt_types_available` | TEXT[] | NO | Jenis garam yang tersedia |
| `capacity_per_month` | DECIMAL(10,2) | NO | Kapasitas produksi |
| `capacity_unit` | VARCHAR(20) | NO | ton / kwintal / kg |
| `whatsapp` | VARCHAR(20) | NO | Nomor WhatsApp |
| `email` | VARCHAR(255) | YES | Email supplier |
| `additional_notes` | TEXT | YES | Keterangan tambahan |
| `admin_notes` | TEXT | YES | Catatan internal admin |
| `status` | VARCHAR(50) | NO | new / verified / active / inactive |
| `created_at` | TIMESTAMPTZ | NO | Waktu pendaftaran |
| `updated_at` | TIMESTAMPTZ | NO | Waktu update terakhir |

- RLS: public bisa INSERT (untuk pendaftaran), admin bisa READ dan WRITE semua

---

### B. CRM / Admin Panel

#### UI

**Halaman Daftar Supplier (`/admin/suppliers`)**

- Tabel list supplier dengan kolom: nama usaha, kota + provinsi, jenis garam, kapasitas, status, tanggal daftar
- Badge status berwarna: Baru (biru), Diverifikasi (kuning), Aktif (hijau), Tidak Aktif (abu)
- Filter berdasarkan status
- Search berdasarkan nama usaha atau lokasi
- Tombol "Lihat Detail" per baris

---

**Halaman Detail Supplier (`/admin/suppliers/[id]`)**

- Semua data dari form pendaftaran (read-only display)
- **Update Status**: dropdown (Baru → Diverifikasi → Aktif → Tidak Aktif) + tombol "Simpan Status"
- **Catatan Admin**: textarea, auto-save saat blur
- **Panel WA Template**: tombol "Buat Pesan WA" → modal pesan follow-up yang sudah terformat → tombol "Buka di WhatsApp"

Template WA untuk supplier:

| Trigger | Isi Template |
|---|---|
| Supplier baru (status: Baru) | Konfirmasi penerimaan pendaftaran, info langkah selanjutnya |
| Verifikasi (status: Diverifikasi) | Informasi bahwa data sedang diverifikasi, butuh dokumen tambahan |
| Aktif (status: Aktif) | Selamat bergabung sebagai mitra supplier, info proses pembelian pertama |

#### Backend

- `GET /supplier` — list semua supplier, support filter `status` dan query `search` [AUTH]
- `GET /supplier/{id}` — detail satu supplier [AUTH]
- `PATCH /supplier/{id}` — update `status` dan/atau `admin_notes` [AUTH]
- `POST /supplier/wa-template` — body: `{ supplier_id, status }` → return string pesan WA terformat [AUTH]

#### Database

- Tabel `supplier_registrations` (sama seperti di bagian A)
- RLS: hanya admin yang bisa READ dan WRITE

---

### Definition of Done — Epic 5

- [ ] Form pendaftaran supplier dapat diisi dan disubmit
- [ ] Halaman konfirmasi tampil setelah submit berhasil
- [ ] Data supplier tersimpan di Supabase
- [ ] Admin menerima email notifikasi saat ada supplier baru mendaftar
- [ ] Data supplier baru muncul di halaman `/admin/suppliers` dengan status "Baru"
- [ ] Admin bisa filter supplier berdasarkan status
- [ ] Admin bisa update status supplier dari detail halaman
- [ ] Catatan admin tersimpan dengan benar
- [ ] Tombol WA template menghasilkan pesan yang sesuai status supplier

---
---

## Epic 6 — Konten & Tools (Artikel + Kalkulator Garam)

**Tujuan Epic:**
Menambahkan dua fitur pendukung yang meningkatkan nilai website: Artikel sebagai mesin SEO dan edukasi industri (dikelola admin via CMS), serta Kalkulator Kebutuhan Garam sebagai qualifying tool yang membantu calon mitra dan mendorong konversi ke form RFQ.

**Demo ke klien setelah epic ini:**
Admin bisa membuat dan mempublish artikel dari panel CRM. Artikel tampil di halaman publik. Kalkulator menghasilkan estimasi kebutuhan garam dan mengarahkan user ke form RFQ dengan data pre-filled.

---

### A. Customer-Facing Web

#### UI

**Halaman Daftar Artikel (`/artikel`)**

- Grid artikel: setiap kartu berisi thumbnail, badge kategori (Edukasi / Berita Perusahaan), judul, tanggal publish, preview 2 baris teks
- Filter tab di atas: Semua | Edukasi Garam | Berita Perusahaan
- Pagination: 6 artikel per halaman, tombol "Sebelumnya" dan "Berikutnya"

---

**Halaman Detail Artikel (`/artikel/[slug]`)**

- Thumbnail besar di bagian atas
- Judul artikel (H1), badge kategori, tanggal publish
- Konten artikel (render HTML dari rich text editor)
- Meta tags SEO: `<title>`, `<meta description>`, Open Graph image
- Section "Artikel Terkait": 3 kartu artikel dari kategori yang sama

---

**Halaman Kalkulator Garam (`/kalkulator`)**

- **Penjelasan singkat**: cara kerja kalkulator, untuk siapa, dan manfaatnya

- **Form Input**:

| Input | Tipe | Opsi |
|---|---|---|
| Jenis Industri | Dropdown | Makanan & Minuman, Pengasinan Ikan, Water Treatment, Pakan Ternak, Pulp & Kertas, Penyamakan Kulit, Lainnya |
| Kapasitas Produksi | Number input | — |
| Satuan Kapasitas | Dropdown | ton/hari, ton/minggu, ton/bulan |
| Jenis Produk yang Diproduksi | Dropdown dinamis | Muncul setelah industri dipilih, sub-opsi per industri |

- **Output Hasil** (muncul setelah klik "Hitung Kebutuhan"):
  - Estimasi kebutuhan garam: "**X – Y ton per bulan**"
  - Rekomendasi produk Reka Cipta: 1–2 produk yang paling sesuai
  - Penjelasan singkat mengapa produk tersebut direkomendasikan

- **CTA setelah hasil muncul**:
  - Tombol: "Minta Penawaran untuk X Ton/Bulan" → ke `/minta-penawaran?volume=X&produk={slug_produk_rekomendasi}`
  - Tombol: "Hitung Ulang" → reset form

- **Logika kalkulasi**: dijalankan sepenuhnya di frontend (JavaScript), tidak perlu backend. Berupa mapping rule-based:
  - Industri + kapasitas → faktor konversi → range estimasi ton garam/bulan
  - Industri → rekomendasi jenis garam

#### Backend

- `GET /articles` — list artikel yang `is_published = true`, support query param: `category`, `page`, `limit` (public)
- `GET /articles/{slug}` — detail satu artikel by slug (public)
- Kalkulator: tidak memerlukan backend, semua logika di frontend JavaScript
- Server-side rendering (SSR) via Next.js untuk halaman artikel (keperluan SEO)

#### Database

- Tabel `articles`:

| Field | Tipe | Nullable | Keterangan |
|---|---|---|---|
| `id` | UUID | NO | Primary key |
| `title` | VARCHAR(500) | NO | Judul artikel |
| `slug` | VARCHAR(500) | NO | URL-friendly, unique |
| `category` | VARCHAR(50) | NO | education / company_news |
| `content` | TEXT | NO | Konten HTML artikel |
| `thumbnail_url` | TEXT | YES | URL gambar thumbnail dari Storage |
| `meta_description` | VARCHAR(300) | YES | Meta description untuk SEO |
| `is_published` | BOOLEAN | NO | Default: false |
| `published_at` | TIMESTAMPTZ | YES | Set saat is_published = true |
| `created_at` | TIMESTAMPTZ | NO | Auto-generated |
| `updated_at` | TIMESTAMPTZ | NO | Auto-update |

- Supabase Storage bucket: `article-thumbnails` (public read)
- RLS: public bisa READ artikel yang `is_published = true`, admin bisa READ dan WRITE semua

---

### B. CRM / Admin Panel

#### UI

**Halaman Manajemen Artikel (`/admin/articles`)**

- Tabel list semua artikel (draft dan published): judul, kategori, status (Draft / Published), tanggal update
- Tombol "Buat Artikel Baru" di kanan atas
- Per baris: toggle publish/unpublish langsung, tombol "Edit", tombol "Hapus" (dengan konfirmasi)

---

**Halaman Buat Artikel (`/admin/articles/new`) dan Edit Artikel (`/admin/articles/[id]/edit`)**

- **Field**:
  - Judul (text input) — slug di-generate otomatis dari judul, bisa diedit manual
  - Kategori (select: Edukasi Garam / Berita Perusahaan)
  - Meta Description (textarea, maks 300 karakter + counter)
  - Upload Thumbnail → Supabase Storage

- **Rich Text Editor** (gunakan Tiptap atau Quill):
  - Toolbar: Bold, Italic, Heading (H2, H3), Bullet list, Numbered list, Link, Image insert (upload ke Storage)
  - Output: HTML string yang disimpan di field `content`

- **Footer Form**:
  - Toggle: "Publish sekarang" / "Simpan sebagai Draft"
  - Tombol "Simpan"
  - Konfirmasi: "Artikel berhasil disimpan"

#### Backend

- `GET /articles` (admin) — semua artikel termasuk draft [AUTH]
- `POST /articles` — buat artikel baru, auto-generate slug dari title, default `is_published = false` [AUTH]
- `PUT /articles/{id}` — update semua field artikel [AUTH]
- `DELETE /articles/{id}` — hapus artikel (soft delete atau hard delete) [AUTH]
- `PATCH /articles/{id}/publish` — toggle `is_published`, jika true set `published_at = now()` [AUTH]
- Upload handler thumbnail: terima file → upload ke `article-thumbnails` → return public URL

#### Database

- Tabel `articles` (sama seperti di bagian A)
- RLS: public SELECT dengan filter `is_published = true`, admin full access

---

### Definition of Done — Epic 6

- [ ] Halaman `/artikel` menampilkan daftar artikel yang sudah dipublish
- [ ] Filter kategori berfungsi (Edukasi / Berita)
- [ ] Pagination berfungsi (6 artikel per halaman)
- [ ] Halaman detail artikel tampil dengan konten lengkap
- [ ] SEO meta tags terpasang di halaman detail artikel (bisa dicek via "View Page Source")
- [ ] Admin bisa membuat artikel baru dengan rich text editor
- [ ] Admin bisa upload thumbnail
- [ ] Admin bisa publish dan unpublish artikel
- [ ] Admin bisa menghapus artikel dengan konfirmasi
- [ ] Artikel yang dipublish langsung muncul di halaman publik
- [ ] Kalkulator menghasilkan estimasi kebutuhan garam berdasarkan input
- [ ] Rekomendasi produk muncul sesuai jenis industri
- [ ] Tombol CTA kalkulator mengarah ke form RFQ dengan volume dan produk pre-filled

---

## Ringkasan Dokumen 2

| Epic | Halaman Customer | Halaman Admin | Tabel Database |
|---|---|---|---|
| Epic 4 — RFQ + AI | Form RFQ, Konfirmasi RFQ | Pipeline Leads (Kanban), Detail Lead | `rfq_leads`, `lead_status_history` |
| Epic 5 — Supplier | Form Supplier, Konfirmasi Supplier | Daftar Supplier, Detail Supplier | `supplier_registrations` |
| Epic 6 — Konten & Tools | Daftar Artikel, Detail Artikel, Kalkulator Garam | Manajemen Artikel (CRUD) | `articles` |

---

## Ringkasan Global Semua Epic

| # | Epic | Prioritas | Estimasi Kompleksitas |
|---|---|---|---|
| 1 | Fondasi & Global Layout | Wajib pertama | Rendah |
| 2 | Profil Perusahaan | Tinggi | Rendah–Sedang |
| 3 | Katalog Produk | Tinggi | Sedang |
| 4 | RFQ + AI Proposal | Sangat Tinggi | Tinggi |
| 5 | Pendaftaran Supplier | Sedang | Rendah–Sedang |
| 6 | Konten & Tools | Sedang | Sedang |

### Urutan Pengerjaan yang Disarankan
Epic dikerjakan secara berurutan: **1 → 2 → 3 → 4 → 5 → 6**

Rasionalisasi:
- Epic 1 adalah prasyarat semua epic lain (fondasi teknis dan layout global)
- Epic 2 dan 3 menghadirkan identitas digital perusahaan — penting untuk kredibilitas klien
- Epic 4 adalah fitur paling kritikal secara bisnis — dikerjakan setelah website punya wajah
- Epic 5 melengkapi sisi supplier setelah sisi pembeli (RFQ) sudah ada
- Epic 6 adalah fitur pendukung SEO dan konversi — dikerjakan terakhir

### Tabel Database Keseluruhan

| Tabel | Dibuat di Epic | Keterangan |
|---|---|---|
| `auth.users` | Epic 1 | Built-in Supabase Auth |
| `company_settings` | Epic 2 | Key-value store info kontak |
| `products` | Epic 3 | Katalog 5 produk garam |
| `rfq_leads` | Epic 4 | Data permintaan penawaran |
| `lead_status_history` | Epic 4 | Histori perubahan status lead |
| `supplier_registrations` | Epic 5 | Data pendaftaran supplier |
| `articles` | Epic 6 | Konten artikel dan berita |

### Supabase Storage Buckets

| Bucket | Dibuat di Epic | Akses |
|---|---|---|
| `product-photos` | Epic 3 | Public read, admin write |
| `lab-docs` | Epic 3 | Public read, admin write |
| `article-thumbnails` | Epic 6 | Public read, admin write |

---
*CV Reka Cipta Indonesia | Epic Document v1.0 | Doc 2 of 2*
