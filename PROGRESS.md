# PROGRESS — Ronde 4 (4 poin revisi)

Ditulis ulang setiap checkpoint.

| CP | Isi | Status |
|---|---|---|
| CP0 | Pengiriman RFQ tidak merespons + jalur kegagalan + catatan API (poin 4) | **SELESAI** |
| CP1 | Admin leads: sembunyikan/hapus + akses layar sempit (poin 2 & 3) | **SELESAI** |
| CP2 | Kedalaman visual: hero & permukaan (poin 1) | **SELESAI** |

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


---

## CP1 — SELESAI (poin 2 & 3 dikerjakan bersamaan, dan memang berakar sama)

### Premis diuji dulu — sebagian benar, mekanismenya berbeda

Dugaan yang diberikan: panel detail tidak dirender di layar sempit,
sehingga tugas tidak bisa diinput.

Yang ditemukan setelah diuji di peramban:

| Dugaan | Hasil |
|---|---|
| Detail lead tidak bisa dibuka di layar sempit | **Tidak terbukti seluruhnya** — rute `/admin/leads/[id]` sudah ada dan terbuka normal pada 960 px |
| Tugas tidak bisa diinput untuk lead tertentu | **TERBUKTI, dan sebabnya bukan responsivitas** |

**Sebab sebenarnya: DUA implementasi detail yang diam-diam berselisih.**
`LeadDetailPanel` (panel samping, hanya dirender mulai `lg:`) memuat
`TaskComposer`. `LeadDetailView` (halaman penuh — satu-satunya jalan di
layar sempit) **tidak pernah mendapatkannya**. Jadi fitur tugas yang
dibangun di CP4 ronde lalu memang tidak bisa dipakai dari layar sempit,
tapi bukan karena panelnya hilang — melainkan karena halaman penggantinya
adalah komponen lain yang tertinggal.

Dibuktikan dengan membaca isi halaman detail yang sudah dirender pada
960 px: ada Informasi RFQ, Status & Aksi, Catatan Admin, Proposal, Histori
Status — dan **tidak ada satu pun kontrol tugas**.

### Cacat kedua yang ditemukan sambil jalan — dan ini yang menjelaskan "orientasi potret"

`useIsMobile(1024)` memutuskan lebar dengan `window.innerWidth < 1024`,
sementara yang menyembunyikan panel adalah kelas `lg:block`. **Dua
pengukur berbeda untuk satu keputusan yang sama.** Saat keduanya
berselisih, klik menyimpan `selectedId` untuk panel yang sedang
disembunyikan CSS → tidak ada apa pun yang muncul.

| Sumber perselisihan | Lebar pita rusak |
|---|---|
| `innerWidth` memuat scrollbar; media query CSS tidak | ~15 px di sekitar 1024 |
| **`lg` Tailwind v4 = `64rem`, bukan `1024px`** — diverifikasi di `node_modules/tailwindcss/theme.css` | font bawaan 20px → `lg` = 1280 px CSS → pita rusak **~256 px** |

Baris kedua yang menentukan, dan ia cocok dengan laporan "masalahnya
orientasi & lebar, bukan sekadar mobile".

Ditutup dengan `hooks/use-media-query.ts` (`useSyncExternalStore` +
`matchMedia`), yang bertanya ke mesin CSS yang **sama**. Breakpointnya
ditulis `64rem`, bukan px. `hooks/use-is-mobile.ts` **dihapus** —
membiarkannya berarti menyediakan jalan untuk melahirkan cacat yang sama
lagi.

### A. Sembunyikan / hapus lead

**Keputusan: arsip sebagai perilaku baku; hapus permanen tersedia tapi
dua langkah.** Alasannya bukan kehati-hatian umum melainkan bentuk data:
`rfqs.legacy_lead_id` memakai `ON DELETE SET NULL`, jadi menghapus
`rfq_leads` meninggalkan baris `rfqs` yang **masih hidup tanpa asal-usul**
— tetap terhitung di statistik, tidak bisa dijelaskan asalnya, dan tidak
terdeteksi sebagai pelanggaran foreign key.

Penjaga "arsipkan dulu" ditegakkan di **fungsi database**, bukan di
tombol. Konfirmasi merusak menuntut **mengetik nama perusahaan**, bukan
"Anda yakin?" — dialog ya/tidak dijawab refleks setelah pemakaian ketiga.
Pembatalan ditawarkan **di dalam notifikasi keberhasilan**.

Migrasi `20260822140000` (ADDITIVE) + `20260822150000` (perbaikan
penjaga). Kolom arsip ditulis di **dua** tabel — `rfq_leads` (dibaca
daftar) dan `rfqs` (dibaca statistik) — dalam satu fungsi. Menandai satu
saja akan membuat lead hilang dari daftar tapi tetap terhitung di angka.

**CACAT YANG SAYA PERKENALKAN SENDIRI LALU PERBAIKI (1).** Penjaga
pertama saya menulis `IF NOT public.is_admin()`. `is_admin()` membaca
`auth.uid()`, yang **NULL pada koneksi service-role** — dan FastAPI justru
memakai service-role key. Jadi penjaga itu tidak menyaring penyalahguna;
ia menyaring satu-satunya pemanggil yang sah. Setiap upaya menyembunyikan
ditolak. Ketahuan karena jalur kegagalannya sekarang **terlihat** (CP0):
tombol ditekan → "Gagal menyembunyikan lead." Kalau CP0 belum dikerjakan,
cacat ini akan tampil sebagai tombol yang diam.

**CACAT YANG SAYA PERKENALKAN SENDIRI LALU PERBAIKI (2).** Angka chip
"Arsip" mula-mula diambil lewat permintaan KEDUA dari peramban
(`?archived=true`) — satu round-trip browser → Railway → Supabase penuh
(terukur ~1 detik dari mesin ini) ditambahkan ke **setiap** pembukaan
halaman leads, demi satu angka yang jarang dilihat. Itu persis pola yang
dibongkar CP6 ronde lalu. Dipindahkan ke jawaban yang sama
(`archived_count` di `RFQLeadListResponse`). Diverifikasi lewat
`performance.getEntriesByType('resource')`: halaman leads kini memanggil
**satu** endpoint, bukan dua.

### B. Akses di layar sempit

`TaskComposer` **dan** aksi arsip dipasang di `LeadDetailView` (halaman
detail). Aturan yang sekarang mengikat ditulis di DESIGN-SYSTEM §4.16:
setiap aksi entitas wajib ada di halaman detail; panel samping adalah
jalan pintas, bukan tempat satu-satunya.

Terverifikasi pada halaman ter-render 960 px: blok **"Follow-up"**
(dengan pilihan cepat Besok / 3 hari / 1 minggu) dan blok **"Kelola
lead"** kini ada di halaman detail.

### Verifikasi integritas & statistik — diukur, bukan diasumsikan

Statistik hero diukur lewat **kunci anon** (jalur publik sungguhan, bukan
service key — kesalahan yang sudah menutupi cacat dua kali di ronde 3):

| | Sebelum | Sesudah 2 lead diarsipkan |
|---|---|---|
| `active_products` | 5 | 5 |
| `deal_count` | 0 | 0 |
| `city_count` | 0 | 0 |
| `shipped_kg` | 90.041 | 90.041 |
| `shipment_rows` | 2 | 2 |

**Tidak bergeser satu angka pun** — sesuai harapan, karena kedua lead yang
diarsipkan berstatus `lost`, bukan `deal`.

Integritas data, sesudah dua arsip **dan** satu penghapusan permanen
sungguhan:

| Pemeriksaan | Hasil |
|---|---|
| `rfqs` menunjuk lead yang sudah hilang | **0** |
| `rfqs` terputus (`legacy_lead_id = NULL`) | **0** |
| `rfq_items` yatim | **0** |
| `lead_status_history` yatim | **0** |
| Tanda arsip `rfq_leads` vs `rfqs` berselisih | **0 dari 5** |

Penjaga penghapusan permanen diuji satu per satu:

| Percobaan | Hasil |
|---|---|
| Purge lead yang masih AKTIF | **Ditolak** — "arsipkan dulu sebelum menghapus permanen" |
| Purge sesudah diarsipkan | Berhasil |
| Purge lead yang sudah tidak ada | **Ditolak** — "lead tidak ditemukan" |

`companies`/`contacts` sengaja **tidak** ikut terhapus: satu perusahaan
bisa punya beberapa RFQ, dan menghapusnya bersama satu lead akan membuang
riwayat RFQ lain milik perusahaan yang sama.

**Lead uji `wergew` dan `ewrgwerg` kini DIARSIPKAN, bukan dihapus** —
keputusan itu milik Jazil, dan tombol Hapus permanen sudah tersedia di
halaman detail masing-masing. Lead uji yang **saya** buat sendiri
(`PT Uji Kirim Sejahtera`) sudah saya hapus permanen sekaligus sebagai
pembuktian jalur itu.

### TEMUAN YANG SENGAJA TIDAK SAYA PERBAIKI DIAM-DIAM

`rfq_leads.status` dan `rfqs.status` **berselisih**. Panel admin membaca
`rfq_leads` dan menampilkan "Deal 2"; `get_public_hero_stats()` membaca
`rfqs` dan mendapat `deal_count = 0`. Perubahan status lewat
`PATCH /rfq/leads/{id}` hanya menulis `rfq_leads` dan tidak pernah
merambat ke `rfqs`.

Artinya statistik "deal" di beranda **sudah salah sebelum ronde ini**.
Memperbaikinya akan mengubah angka yang tampil di publik dari 0 menjadi 2
— dan checkpoint ini justru bertugas memastikan angka **tidak berubah
diam-diam**. Jadi ia dicatat ke ACTION REQUIRED, bukan dibetulkan
sembunyi-sembunyi.

### Berkas yang berubah di CP1

| Berkas | Perubahan |
|---|---|
| `supabase/migrations/20260822140000_lead_archive.sql` | **BARU**, additive, diterapkan |
| `supabase/migrations/20260822150000_lead_archive_service_role.sql` | **BARU**, perbaikan penjaga, diterapkan |
| `hooks/use-media-query.ts` | **BARU** — `matchMedia`, breakpoint `rem` |
| `hooks/use-is-mobile.ts` | **DIHAPUS** |
| `components/admin/lead/LeadArchiveActions.tsx` | **BARU** |
| `components/admin/lead/LeadDetailView.tsx` | + TaskComposer, + aksi arsip |
| `components/admin/lead/LeadDetailPanel.tsx` | + aksi arsip |
| `components/admin/lead/LeadsWorkspace.tsx` | Arsip sebagai kumpulan terpisah, `useIsLgUp` |
| `components/admin/lead/LeadsToolbar.tsx` | Chip Arsip + pemisah |
| `components/admin/lead/LeadsKanbanBoard.tsx` | `matchMedia` |
| `backend/routers/rfq.py` | 3 endpoint arsip + `archived` filter + `archived_count` |
| `backend/schemas/rfq.py` | `archived_at`, `archived_reason`, `archived_count`, `LeadArchiveRequest` |
| `backend/main.py` | Pencatatan jadi fire-and-forget (lihat di bawah) |
| `lib/api.ts`, `types/api.ts` | Kontrak dicerminkan |

### Perbaikan tambahan yang lahir dari CP1: pencatatan CP0 sempat menahan jawaban

Middleware CP0 versi pertama menulis `await log_request(...)` **sebelum**
`return response` — menaruh satu round-trip Supabase penuh di jalur
jawaban. Diukur: permintaan yang dicatat melonjak ke **182–604 ms** (n=3).
Sesudah dijadikan fire-and-forget: **3–8 ms** (n=6, pembacaan pertama
24 ms dibuang sebagai pemanasan). Pengamat tidak boleh memperlambat yang
diamati.


---

## CP2 — SELESAI (poin 1)

### Cara keluar dari tabrakan aturan

Penilaian Jazil sah, tapi bertabrakan dengan tiga ketetapan yang sudah
disahkan (§9 #9 gradien dilarang sebagai latar section, §2.5 primary bukan
bidang besar, dan CP2 ronde 2 yang justru menyeragamkan enam gradien kartu
sektor).

Jalan keluarnya bukan memilih salah satu, melainkan **memisahkan dua hal
yang selama ini tercampur**:

- **Gradien sebagai PENANDA** — dua warna berbeda yang menarik perhatian
  ke bidangnya sendiri. **Tetap dilarang.**
- **Gradien sebagai KEDALAMAN** — dua langkah BERSEBELAHAN dari SATU ramp.
  Mata membacanya sebagai bidang bervolume, bukan sebagai warna.

### Batas angka — supaya tidak melebar sendiri di ronde berikutnya

| Perangkat | Langit-langit |
|---|---|
| Gradien satu keluarga | **ΔL\* ≤ 6,0**, stop bersebelahan, maks 2 stop, vertikal |
| Kisi garis rambut | opasitas **≤ 0,06**, 1px, jarak ≥ 48px |
| Garis tepi aksen | **≤ 4px**, dan wajib **≥ 3:1** terhadap permukaannya |
| Tekstur/noise | opasitas **≤ 0,035** |
| Lantai overlay foto | **0,58** |

**Angkanya menolak sesuatu, bukan merestui apa pun:**

| Kandidat | Hasil |
|---|---|
| steel-900 → steel-950 = ΔL\* **5,1** | **lolos** |
| steel-800 → steel-900 = ΔL\* **7,8** | **DITOLAK** |
| marine-600 di atas steel-900 = **2,39:1** | **DITOLAK** sebagai garis tepi |
| marine-500 di atas steel-900 = **3,20:1** | **lolos** |

### Sifat aman yang membuat ini tidak bisa merusak kontras

Stop bawah gradien LEBIH GELAP daripada permukaan lama, jadi kontras hanya
bisa NAIK: putih 17,51 → 19,34 · steel-200 13,72 → 15,15 · marine-200
10,24 → 11,31. Angka terburuknya tetap angka steel-900 yang lama — dan
itulah yang dipakai sebagai dasar seluruh pengukuran ulang.

### A. Hero beranda terlalu gelap — 68% → 60%

**ALAT UKUR SAYA MENIPU DUA KALI DI CHECKPOINT INI. Keduanya ketahuan
karena angkanya diperiksa, bukan dipercaya.**

**Tipuan 1 — perkiraan warna foto.** Saya menghitung alpha aman memakai
warna langit (#C8D4DE) dan menyimpulkan 55% lolos dengan margin (5,73:1).
Saat foto itu benar-benar di-sampel lewat canvas, titik paling terang di
belakang area teks ternyata **PUTIH MURNI** (dinding gedung) — dan pada
55% kontrasnya cuma **4,28:1, GAGAL AA**.

Kurva terukur pada putih murni:

| alpha | 0,54 | 0,56 | **0,58** | 0,60 | 0,68 (lama) |
|---|---|---|---|---|---|
| kontras | 4,13 | 4,42 | **4,74** | **5,08** | 6,80 |

Dipakai **0,60**. Lantai 0,58 ditetapkan di §2.6.

**Tipuan 2 — komposit ganda.** Penyapu kontras pertama saya mengisi kanvas
dengan HITAM lebih dulu lalu membaca warnanya, sehingga warna beropacity
sudah terkomposit di atas hitam — lalu saya mengkompositnya LAGI di atas
steel-900. Hasilnya melaporkan **3 kegagalan palsu** di /produk
(`text-white/50` dibaca 4,43 padahal sebenarnya 5,25). Saya nyaris
mengubah 20 berkas untuk memperbaiki masalah yang tidak ada. Diperbaiki
dengan `clearRect` (transparan) + `getImageData` yang memang
un-premultiplied.

### B. Hero halaman lain — satu perlakuan, bukan enam variasi

`.surface-depth` (baru) dipasang di **tujuh** permukaan: hero
/produk, /produk/[slug], /tentang-kami, /kontak, PageHero generik
(/kalkulator, /jadi-supplier, /artikel, /minta-penawaran), panel hasil
kalkulator, dan halaman terima kasih.

**`.surface-dark` TIDAK dihapus, dan itu keputusan.** Hero beranda tetap
memakainya: di sana kedalaman datang dari FOTO. Menumpuk gradien + kisi di
atas foto hanya menumpuk dua bahasa yang saling menutupi.

### C. Kartu sektor & Alur Kerja — apa yang berbeda dari ronde 2

Ronde 2 membuang enam gradien kartu sektor. Ini **bukan berputar balik**,
dan bedanya bisa disebut persis:

| | Ronde 2 (dibuang) | Ronde 4 (sekarang) |
|---|---|---|
| Jumlah warna | 6 gradien BERBEDA per kartu | 1 perlakuan, sama untuk keenamnya |
| Keluarga warna | dua warna berlainan per gradien | satu keluarga, dua langkah bersebelahan |
| ΔL\* | besar (mencolok) | **5,1** |
| Fungsi | membedakan kartu satu dari lainnya | memberi VOLUME; kartu tetap setara |
| Melanggar | §9 #9 dan §2.5 | tidak melanggar keduanya |

Yang dibuang ronde 2 adalah gradien sebagai **pembeda identitas**; yang
ditambahkan sekarang adalah gradien sebagai **bahan permukaan**. Keenam
kartu tetap identik satu sama lain — itu justru syaratnya.

Ditambah: garis rambut tepi (0,08) yang memisahkan kartu dari latar putih
dan dari tetangganya, dan bilah aksen marine-500 2px × 28px sebagai jangkar
— jawaban atas "kenapa tidak biru" tanpa mengecat satu bidang pun.

Section Alur Kerja: `bg-ink-900` → `.surface-depth`. Sekaligus menutup
pemakaian alias `ink-900` di permukaan yang seharusnya `steel-900` (§4.9).

### Kritik desain sesudah CP2 — dan satu hal ditarik kembali

Pertanyaannya: apakah kedalaman baru ini mengembalikan kesan consumer app?

**Temuan: tidak — tapi ada satu elemen yang memang consumer, dan ia sudah
ada di sana sebelum saya menyentuhnya.** Di seluruh section Alur Kerja yang
baru diberi kedalaman, sinyal "consumer app" paling keras bukan gradien
atau kisinya, melainkan **badge lingkaran terisi 40px** pada langkah aktif.

Itu sudah melanggar §4 sejak dulu (`rounded-full` hanya untuk avatar,
titik status, spinner — bukan container) dan §1.3 ("bahan industri tidak
membulat"). Diganti `rounded-sm`. Diverifikasi terprogram pada halaman
ter-render: **nol container ber-radius penuh** tersisa di seluruh
`.surface-depth` dan `.card-depth`.

### Verifikasi — diukur pada halaman ter-render

Kontras diukur terhadap **stop TERANG** (steel-900) sebagai kasus terburuk:

| Halaman | Elemen diperiksa | Gagal | Kontras minimum |
|---|---|---|---|
| `/` (hero + 6 kartu + Alur Kerja) | 45 | **0** | 6,03 |
| `/produk` | 10 | **0** | 5,25 |
| `/produk/garam-halus-yodium` | 9 | **0** | 5,25 |
| `/tentang-kami` | 9 | **0** | 5,25 |
| `/kontak` | 8 | **0** | 5,25 |
| `/minta-penawaran` | 8 | **0** | 5,25 |
| `/minta-penawaran/terima-kasih` | 4 | **0** | 8,99 |

Dua kegagalan NYATA ditemukan dan diperbaiki di sepanjang jalan (keduanya
sudah ada sebelum ronde ini, di section yang saya sentuh):
`text-white/35` pada eyebrow langkah = **3,21:1**, dan `text-white/40` pada
penghitung langkah = **3,81:1**. Keduanya dinaikkan ke `/55` (dan eyebrow
aktif ke `marine-200`, token yang disahkan §4.9).

Pemeriksaan lain: **nol** overflow horizontal di seluruh halaman di atas ·
**nol** hex/rgba literal di komponen (satu-satunya kecocokan adalah warna
yang disebut di dalam KOMENTAR yang mendokumentasikan pengukuran) · **nol**
animasi terlarang baru · **nol** dependensi sirkular (madge, 239 berkas).

### Berkas yang berubah di CP2

| Berkas | Perubahan |
|---|---|
| `app/globals.css` | `--color-hairline-grid/edge` di `@theme`; `.surface-depth`, `.card-depth`, `.edge-marine-bottom` di `@layer components` |
| `components/sections/HeroCarousel.tsx` | Overlay 68% → 60% (diukur) |
| `components/sections/HowItWorks.tsx` | `.surface-depth`; 3 perbaikan kontras; badge tidak lagi bulat |
| `components/sections/IndustriesGrid.tsx` | `.card-depth` + bilah aksen marine |
| `PageHero · AboutHero · ContactHero · ProductHero · ProductCatalogHero · ThankYouPanel · CalculatorResult` | `.surface-depth` + garis tepi marine |

### YANG TIDAK DIVERIFIKASI — terus terang

Pengujian pada viewport **414 / 720 / 1024 / 1440 tidak dijalankan.**
Permukaan peramban otomatis di lingkungan ini terkunci pada 960 px CSS —
`resize_window` melapor berhasil tapi `innerWidth` tidak bergerak — dan
jalur alternatifnya (memuat halaman di dalam iframe berukuran tetap,
tempat media query dievaluasi terhadap viewport iframe) diblokir oleh
`X-Frame-Options: DENY`. Saya **tidak** melemahkan header keamanan itu
demi sebuah pengujian.

Yang BISA saya jalankan sebagai gantinya: audit statis atas seluruh berkas
yang diubah untuk lebar/`min-width` literal yang bisa meluber di 414 px.
Satu-satunya `min-w-[720px]` berada di dalam `overflow-x-auto` (pola §4.11
yang memang disahkan); sisanya pra-ada dan bukan dari ronde ini.
**Pemeriksaan viewport ini perlu dilakukan manual** — masuk ACTION REQUIRED.
