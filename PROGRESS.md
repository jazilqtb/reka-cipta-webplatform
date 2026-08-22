# PROGRESS — Ronde 4 (4 poin revisi)

Ditulis ulang setiap checkpoint.

| CP | Isi | Status |
|---|---|---|
| CP0 | Pengiriman RFQ tidak merespons + jalur kegagalan + catatan API (poin 4) | **SELESAI** |
| CP1 | Admin leads: sembunyikan/hapus + akses layar sempit (poin 2 & 3) | belum |
| CP2 | Kedalaman visual: hero & permukaan (poin 1) | belum |

---

## CP0 — SELESAI

### A. Hipotesis utama DIUJI, dan TIDAK TERBUKTI

Hipotesis yang diberikan: frontend baru mengirim payload bentuk baru ke
backend bentuk lama (Railway belum di-deploy, uvicorn lokal tanpa
`--reload`), ditolak 422/400/500, dan layar diam karena tidak ada
penanganan error.

**Diuji lebih dulu, sebelum satu baris pun diubah. Hasilnya: bukan itu.**

Bukti yang menjatuhkannya — formulir diisi lengkap dan benar di peramban
sungguhan, lalu tombol ditekan:

| Yang diperiksa | Hasil |
|---|---|
| Permintaan ke `/rfq/submit` | **NOL.** Tidak ada permintaan sama sekali |
| Pesan konsol | kosong |
| Perubahan tampilan | tidak ada |

Payload **tidak pernah meninggalkan peramban**, jadi bentuk backend tidak
mungkin menjadi sebabnya. Dua butir ACTION REQUIRED ronde 3 itu memang
nyata dan tetap perlu dikerjakan, tapi keduanya **bukan** penyebab poin 4.

Diperiksa juga: uvicorn lokal :8001 ternyata **sudah** berjalan dengan
`--reload` dan skema barunya sudah termuat — `openapi.json` menampilkan
`items` di `RFQSubmitRequest`. Butir #2 ronde 3 sudah tidak berlaku.

### B. Sebab sebenarnya — REGRESI CP2 RONDE 3, murni sisi kode

`volume_per_month` berhenti menjadi isian pengguna di CP2 ronde 3 (diganti
volume per jenis garam), dan sejak itu nilainya DIHITUNG di dalam
`onSubmit`. Tapi ia **tetap tertinggal di skema Zod** sebagai
`z.number().positive()`, sementara `defaultValues` mengisinya `0`.

Urutannya yang mematikan: `handleSubmit` memvalidasi **sebelum** memanggil
`onSubmit`. Jadi perhitungan yang mengisi field itu tidak pernah tercapai.
Validasi selalu gagal pada `volume_per_month = 0`, `onSubmit` tidak pernah
dijalankan — dan karena tidak ada satu pun input `volume_per_month` di
layar, pesan errornya tidak punya tempat untuk muncul.

Dibuktikan dua kali, terpisah:

1. **Isolasi skema** — skema Zod dijalankan terhadap isi form yang persis
   seperti saat pengguna mengisi semuanya dengan benar:
   `too_small` pada `path: ["volume_per_month"]`, satu-satunya kegagalan.
2. **DOM halaman ter-render** — `input[name="volume_per_month"]` tidak ada
   di seluruh formulir. Nol.

**Berapa bagian kode vs deploy: 100% kode, 0% deploy.** Perbaikannya
tersedia begitu kode ini di-deploy; tidak ada langkah infrastruktur yang
diperlukan untuk membetulkan poin 4 itu sendiri.

**Sejak kapan:** sejak commit CP2 ronde 3 (`d3d5f9b`, 2026-08-21) — kecuali
untuk pengunjung yang datang dari /kalkulator lewat `?volume=`, yang
kebetulan mengisi field itu dengan angka > 0 sehingga jalur mereka lolos.
Itu menjelaskan kenapa cacatnya tidak tertangkap ronde lalu: verifikasi CP2
memeriksa tampilan baris volume (dan itu memang benar), sementara verifikasi
end-to-end CP1 memanggil **endpoint** langsung, bukan formulirnya.

### C. Cacat kelasnya ikut ditutup, bukan hanya kasusnya

Bug ini mahal bukan karena bugnya, melainkan karena tidak ada jalur
kegagalan yang terlihat. Bug yang sama dengan pesan di layar akan
dilaporkan dalam sehari.

`components/forms/SubmitFeedback.tsx` (baru) — keadaan kegagalan yang
MENETAP di atas formulir, dengan lima nada yang dibedakan mengikuti
kosakata AdminState §4.8: `invalid` · `server` · `blocked` (tidak pernah
sampai ke server) · `rate_limit` · `timeout`.

Dipasang di **ketiga** formulir publik: RFQ, Jadi Supplier, dan Kontak.
Ketiganya sebelumnya hanya memunculkan toast di pojok kanan bawah, yang
hilang sendiri dan jauh dari tombol yang baru ditekan.

Yang dijamin sekarang:

- `handleSubmit(onSubmit, **onInvalid**)` — cabang kedua ini yang selama
  ini tidak ada. Field apa pun yang ditolak **disebut namanya**, termasuk
  field yang tidak punya kontrol di layar. Kelasnya tertutup, bukan
  kasusnya.
- Kegagalan **tidak pernah** menghapus isian. `reset()` hanya ada di jalur
  berhasil.
- `blocked` menyebut **kedua** kemungkinan (jaringan / server tak
  terhubung) alih-alih menebak "periksa koneksi" — browser sengaja tidak
  membedakan server mati, jaringan putus, dan CORS ditolak.
- "Coba lagi" tidak ditawarkan pada `rate_limit` — menyuruh orang
  mengulang hal yang pasti gagal.

**Bug jeda 2–3 detik CP2 diperiksa: tidak terdampak, dan tidak berpindah.**
Mekanisme `isLeaving` + `router.prefetch` utuh. Yang ditemukan justru
sebaliknya: form supplier **tidak pernah** mendapat perbaikan itu di ronde
lalu — indikatornya mati sebelum halaman tujuan tampil. Sekarang disamakan.

### D. Catatan API yang bisa dipantau — `/admin/log`

Tabel `api_request_log` (migrasi `20260822130000`, **ADDITIVE**, sudah
diterapkan) + middleware FastAPI + halaman admin.

| Aspek | Ketetapan |
|---|---|
| Yang dicatat | Waktu, metode, path, status, durasi, sebab saat gagal, konteks non-pribadi |
| Yang dicatat saja | Semua permintaan yang MENGUBAH data + semua jawaban >= 400 |
| GET yang berhasil | **Tidak dicatat** — CP6 mengukur bahwa biaya panel adalah jumlah round-trip; mencatat tiap pembacaan berarti memperlambat hal yang diamati |
| Tidak pernah dicatat | Token, header `Authorization`, isi konfigurasi, body mentah, nama/email/telepon pengirim |
| IP | Dipotong ke blok `/24` |
| Retensi | 30 hari **atau** 5.000 baris terbaru, mana pun lebih ketat |
| Akses | RLS `is_admin()`. Tidak ada policy INSERT/UPDATE/DELETE untuk peran mana pun — catatan yang bisa disunting pembacanya bukan catatan |
| Infrastruktur baru | **Nol.** Tanpa agregator log, tanpa cron — pemangkasan menumpang pada penulisan (`random() < 0.02`) |

Larangan pencatatan ditegakkan lewat **bentuk, bukan kedisiplinan**:
`log_request()` tidak menerima objek `Request` sama sekali, jadi tidak ada
jalan bagi pemanggil menyerahkan sesuatu yang bocor.

**Batas dinyatakan jujur, dan tertulis di halamannya sendiri:** kegagalan
yang terjadi SEBELUM permintaan meninggalkan peramban tidak akan pernah
muncul di sini — dan justru kelas itulah yang menjadi poin 4. Penutupnya
adalah keadaan kegagalan di formulir (C), bukan halaman ini. Keduanya
diperlukan; tidak ada satu pun yang cukup sendirian.

### E. Verifikasi end-to-end — dijalankan, bukan diasumsikan

RFQ sungguhan dikirim lewat formulir di peramban:

| Langkah | Hasil |
|---|---|
| Formulir kosong ditekan kirim | Ringkasan menetap: "Ada isian yang belum benar — Nama Lengkap, Nama Perusahaan, Jenis Garam Dibutuhkan, Volume per jenis garam, Kota Tujuan, Email, WhatsApp", fokus ke field pertama |
| Formulir lengkap ditekan kirim | `POST /rfq/submit` → **201**, 1.232 ms |
| Halaman terima kasih | Tampil |
| `companies` | `PT Uji Kirim Sejahtera` dibuat |
| `contacts` | `Budi Santoso` dibuat, terikat ke company |
| `rfqs` | dibuat, `company_id` + `contact_id` terisi |
| `rfq_items` | `garam-halus-yodium`, quantity 40, unit `ton`, **`quantity_kg` = 40000** — satuan kanonik benar |
| `/admin/leads` | Lead muncul di urutan teratas: "40 ton/bulan · Surabaya" |
| `/admin/log` | Dua baris: 201 (dengan konteks `items: 1 · company: PT Uji Kirim Sejahtera`) dan 422 dari uji jalur gagal |

Jalur gagal diuji sengaja: payload tidak valid ke endpoint → **422**,
tercatat sebagai "isi permintaan ditolak validasi".

> **Catatan kejujuran — alat ukur saya sendiri sempat menipu.** Pembacaan
> pertama saya melaporkan `rfq_items` KOSONG untuk RFQ baru, dan saya
> hampir mencatatnya sebagai bug kedua. Sebabnya query saya sendiri:
> `order=id.desc` pada kolom yang tipenya **UUID**, bukan urutan waktu.
> Diurutkan ulang dengan `created_at` — barisnya ada, dan nilainya benar.
> Percobaan insert manual untuk memastikan justru ditolak `23505 duplicate
> key`, yang membuktikan barisnya memang sudah ada.

### Berkas yang berubah di CP0

| Berkas | Perubahan |
|---|---|
| `lib/validation/rfq-schema.ts` | `volume_per_month` dicabut dari skema form — **inti perbaikannya** |
| `components/rfq/RFQForm.tsx` | `onInvalid`, keadaan kegagalan, prefill `?volume=` masuk ke baris item |
| `components/forms/SubmitFeedback.tsx` | **BARU** — lima nada kegagalan |
| `components/supplier/SupplierRegistrationForm.tsx` | Keadaan kegagalan + `isLeaving` |
| `components/forms/ContactForm.tsx` | Keadaan kegagalan |
| `backend/core/request_log.py` | **BARU** — penulis catatan |
| `backend/main.py` | Middleware pencatat |
| `backend/routers/rfq.py` | Konteks non-pribadi ke catatan |
| `lib/data/api-log.ts` | **BARU** |
| `components/admin/log/ApiLogTable.tsx` | **BARU** — tabel padat §4.11 |
| `app/admin/log/page.tsx` | **BARU** |
| `constants/adminNavigation.ts` | Menu "Catatan API" |
| `supabase/migrations/20260822130000_api_request_log.sql` | **BARU**, additive, diterapkan |

Mutu: `tsc --noEmit` 0 error · `next build` EXIT=0.
