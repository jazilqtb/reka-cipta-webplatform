# PROGRESS — Ronde 3 (14 poin revisi)

Branch: `feature/R3-dark-hero-crm`. Ditulis ulang setiap checkpoint.

| CP | Isi | Status |
|---|---|---|
| CP0 | Tema gelap + pembersihan hijau + sembunyikan pilar (4, 6, 5) | **SELESAI** |
| CP1 | Model data Company/Contact (12) | belum |
| CP2 | RFQ volume per produk + satuan + bug navigasi (1) | belum |
| CP3 | Dashboard operasi & distribusi (2, 14) | belum |
| CP4 | Tugas & follow-up (13) | belum |
| CP5 | Admin: foto tim, kompresi, mitra, email, jadwal artikel (7,3,8,9,11) | **SELESAI** |
| CP6 | Performa admin (10) | belum |

## CP0 — SELESAI

**B. "Gradien hijau" — PENYEBAB DITEMUKAN.** Bukan warna dasarnya. Tiap
permukaan gelap punya dua *mesh gradient* radial dengan **rgba hijau lama
yang ditulis LITERAL**: `rgba(15,158,139)`, `rgba(27,191,170)`,
`rgba(4,43,38)`. Karena literal, retune token ronde lalu tidak
menyentuhnya, dan sapuan verifikasi saya waktu itu hanya mencari hex +
`rgba(11,125,110)` sehingga ketiganya lolos. 18 nilai di 10 berkas.
Seluruh mesh dicabut; permukaan jadi solid `.surface-dark`.
Bundle CSS: nol sisa dari 8 pola hijau lama yang diperiksa.

**A. Hero beranda gelap.** `.surface-dark` (steel-900). Overlay foto
dibalik putih→gelap, 55%→68%. Panel kaca putih khusus ponsel dicabut
(tugasnya menjamin kontras teks gelap; tidak relevan lagi).
Navbar TIDAK diubah: ia bar putih opak di atas hero, bukan menumpang
transparan — diverifikasi visual.

**KONTRAS — alat ukur saya sendiri sempat rusak.** Versi pertama mem-parse
`getComputedStyle().color` dengan regex angka; Tailwind v4 mengeluarkan
`oklab(...)` untuk warna beropacity, jadi regex mengambil L/a/b sebagai RGB
dan melaporkan 1,11:1 pada teks yang baik-baik saja. Diperbaiki memakai
canvas. Hasil sesudah perbaikan alat: **1 kegagalan nyata** — kata aksen
hero `marine-600` = 2,39:1 (butuh 3:1). Dipindah ke `marine-200` (10,2:1).
Pratinjau hero di admin ikut dijadikan gelap, karena ia mengklaim
"seperti yang dilihat pengunjung".
Sesudah: **0 kegagalan** di 6 halaman × 414/1440.

**C. Pilar kepercayaan disembunyikan** lewat `constants/homepage-sections.ts`
(satu titik kendali).
**TEMUAN PENTING:** `CredibilitySection.tsx` memuat DUA hal — pilar
kepercayaan DAN marquee mitra. Mematikan seluruh komponen akan ikut
mematikan marquee yang justru diminta dikembalikan ronde lalu. Hanya blok
pilar yang digerbangi; marquee terverifikasi masih tampil.
**KEHILANGAN KLAIM (terukur):** beranda kini TIDAK LAGI memuat "SNI
3556:2016" maupun "Akta Notaris, NIB, NPWP" di mana pun.

DESIGN-SYSTEM: §4.9 permukaan gelap, anti-pattern #16 (literal rgba).

## CP1 — SELESAI (model data Company -> Contact -> RFQ)

**EXPAND** (`20260821110000`): 6 tabel + 3 fungsi normalisasi. ADDITIVE murni.
`companies` · `contacts` · `rfqs` · `rfq_items` · `company_merge_candidates`
· `company_merges`. RLS: TIDAK ada akses publik — ini daftar pelanggan.

**MIGRATE** (`20260821110100`): idempoten lewat `rfqs.legacy_lead_id` UNIQUE.
4 rfq_leads -> 4 rfqs / 4 companies / 4 contacts / 12 rfq_items.
**NOL baris hilang. rfq_leads TETAP UTUH.**
Statistik hero: deal lama=0 baru=0, kota unik lama=0 baru=0 — TIDAK bergeser.

**KEPUTUSAN TERPENTING DI MIGRASI:** rfq_items hasil migrasi TIDAK punya
kuantitas. Baris lama menyimpan SATU volume untuk SEMUA jenis yang dicentang.
Menyalin 90 ton ke 4 jenis = 360 ton (mengarang); membagi rata = mengarang
angka yang tak pernah dikatakan siapa pun. Totalnya disimpan apa adanya di
`rfqs.legacy_total_qty_kg`; itemnya hanya mencatat JENIS.

**CONTRACT**: `supabase/pending-approval/CONTRACT_20260821_drop_rfq_leads.sql`
— TIDAK dijalankan, di luar folder migrations. Blast radius + sabuk pengaman
tertulis di dalamnya. **ROLLBACK** juga disediakan.

**DEDUPLIKASI — ambang disetel dari PENGUKURAN, bukan tebakan.**
Ambang awal 0,72 melewatkan justru kasus yang diminta: `maju jaya` vs
`maju jya` = 0,583. Diukur 7 pasangan; jurang antara salah-ketik (0,58–0,86)
dan benar-benar-beda (<=0,28) lebar, jadi ambang turun ke 0,50.
Empat sinyal berbobot: domain email kerja 0,95 > nama identik 0,85 >
telepon sama + nama berkerabat 0,80 > kemiripan nama >=0,50.
Penyedia email gratis DISARING — 2 lead ber-@gmail.com terbukti TIDAK
tergabung.
**Penggabungan otomatis TIDAK ADA di jalur kode mana pun.** Fungsi hanya
mengusulkan; `merge_companies()` menuntut is_admin() dan mencatat snapshot
supaya bisa dibatalkan lewat `undo_company_merge()`.

**BUKTI END-TO-END:** RFQ dikirim lewat endpoint sungguhan dengan nama
"PT. Mitracomm Ekasarana" (titik berbeda dari yang sudah ada) -> ditempatkan
di perusahaan yang SUDAH ADA (rfq=2), bukan membuat perusahaan kelima.
Satuan terkonversi: 40 ton -> 40.000 kg; 200 sak_50 -> 10.000 kg.

**Halaman baru** `/admin/perusahaan`: daftar perusahaan + jumlah RFQ,
tinjauan duplikat, riwayat penggabungan + tombol batalkan.

DESIGN-SYSTEM: §4.10 satuan & kuantitas, §4.3 diperluas.

## CP2 — SELESAI (RFQ per produk + satuan + bug jeda)

**1A/1B volume per jenis + satuan.** Terverifikasi di 414px: centang 2 jenis
-> 2 baris volume muncul, opsi satuan `kg | ton | sak (25 kg) | sak (50 kg)`,
field volume tunggal lama sudah tidak ada.
Kontainer SENGAJA tidak ditawarkan (bobot berubah menurut jenis & cara muat).
Setiap kuantitas disimpan DUA KALI: bentuk asli + kanonik kg.

**1C BUG JEDA 2-3 DETIK — DIUKUR, bukan ditebak. Dua sebab, bukan satu.**

Sebab A (backend): endpoint submit melakukan TUJUH round-trip Supabase
berurutan. Satu round-trip dari mesin ini terukur 374-1045 ms.
  SEBELUM: 1,87 / 2,06 / 3,18 s (n=3, end-to-end)
  SESUDAH: hanya 1 round-trip tersisa — 261 / 289 / 691 ms (n=6)
Semua pekerjaan non-esensial (penempatan CRM, nama produk, email admin,
kirim email) dipindah ke BackgroundTasks.

Sebab B (frontend): `isSubmitting` react-hook-form menjadi false BEGITU
onSubmit selesai, sementara router.push() belum merender halaman tujuan.
Indikator mati lebih dulu, layar berganti kemudian. Ditutup dengan
`isLeaving` yang tidak pernah direset (komponen ikut hilang saat navigasi)
+ `router.prefetch` halaman tujuan.

BUG YANG SAYA PERKENALKAN SENDIRI LALU PERBAIKI: tugas latar mula-mula
ditulis `async def` sambil memanggil klien supabase yang SINKRON — itu
membekukan event loop dan membuat satu permintaan melonjak ke 6,1 detik.
Dipindah ke `asyncio.to_thread`.

DUA KALI alat ukur saya menipu: `.test` ditolak pydantic (mengukur 422),
lalu rate limit 5/jam (mengukur 429). Keduanya ketahuan karena angkanya
mustahil (3,6 ms untuk sebuah insert).

## CP3 — SELESAI (distribusi: janji vs realisasi)

**DIAGNOSIS DITERIMA, dan benar:** sistem tidak menyimpan realisasi
distribusi sama sekali. Yang kurang ENTITASNYA, bukan grafiknya.

**Dua tabel baru** (`20260821120000`, ADDITIVE, diterapkan):
`supply_commitments` (janji berulang per periode) + `shipments` (realisasi
bertanggal, dengan supplier). Kapasitas supplier TIDAK dibuat tabel baru —
sudah ada di `supplier_registrations.capacity_per_month`.

**YANG SENGAJA TIDAK DIBANGUN:** stok/inventaris/gudang (Jazil distributor,
bukan pabrik; angka yang tidak pernah dihitung akan salah dalam sebulan lalu
dipercaya setahun), purchase order, invoice, harga.

**BUG SERIUS YANG DITEMUKAN DI SEPANJANG JALAN:** `getHeroStats` membaca
`rfqs`/`shipments` dengan anon key, sementara RLS-nya admin-only. PostgREST
mengembalikan NOL BARIS, bukan error — jadi statistik dinamis beranda
SELALU 0 tanpa tanda apa pun. Verifikasi CP1 saya lolos karena memakai
service key yang melewati RLS. Pelajarannya: memverifikasi jalur publik
dengan kunci istimewa = tidak memverifikasi jalur publik.
Ditutup dengan `get_public_hero_stats()` SECURITY DEFINER yang hanya
mengembalikan ANGKA agregat.

**"Ton Distribusi" AKHIRNYA punya sumber.** Terbukti: 353 baseline + 70 ton
dari 2 pengiriman = 423 di halaman ter-render. (Data demo lalu dihapus.)

**Sempat terlihat seperti bug, ternyata bukan:** build melaporkan 0
pengiriman padahal DB punya 2. Sebabnya Next.js men-cache `fetch` global
dan supabase-js memakainya — respons ter-cache dari sebelum data ada.
Terbukti setelah .next/cache/fetch-cache dibersihkan.

**Ekspor** CSV (BOM UTF-8 utk Excel) + JSON, keduanya menghormati satuan
kanonik kg dan menyertakan periode. Terverifikasi lewat sesi admin nyata.

DESIGN-SYSTEM: §4.11 tabel padat & grafik, §4.3 diperluas.

## CP4 — SELESAI (tugas & follow-up)

**Tabel `tasks`** (`20260821140000`, ADDITIVE, diterapkan). Tugas melekat
pada TEPAT SATU entitas lewat lima kolom FK nullable + CHECK — BUKAN pola
polimorfik (entity_type, entity_id), yang tidak bisa dijaga foreign key dan
akan meninggalkan baris yatim saat induknya dihapus.
Constraint kedua menjaga `completed_at` dan `status` tidak berselisih.

**Terverifikasi di UI nyata:** 4 kelompok tampil benar — Terlewat (merah,
"terlewat 3 hari"), Jatuh tempo hari ini (amber), Akan datang ("5 hari
lagi"), Tanpa tenggat. Induk tiap tugas ikut tertulis.
Dashboard menampilkan "TUGAS TERLEWAT & HARI INI · 3" di ATAS RFQ terbaru.

**Pengingat tanpa penjadwal:** berbasis tampilan di dua tempat yang pasti
dibuka admin. Batasnya dinyatakan terus terang di dokumen dan di kode:
kalau panel tidak dibuka, tidak ada yang mengingatkan. Rancangan pengingat
email masuk ACTION REQUIRED — tidak dipasang diam-diam.

**Composer dipasang di panel detail lead**, tepat saat operator melihat
leadnya — tugas yang dibuat dari halaman terpisah kehilangan konteks.

DESIGN-SYSTEM: §4.12 tugas & pengingat.

## CP5 — SELESAI (5 perbaikan admin: 7, 3, 8, 9, 11)

**Poin 7 — upload foto tim gagal (bug nyata, direproduksi).** Bukan dugaan:
diulang sebagai admin ter-autentikasi dengan PNG 85 byte dan mendapat
`new row violates row-level security policy` (403). Sebabnya bucket
`team-photos` dibuat lewat Storage API di ronde sebelumnya tanpa satu pun
kebijakan `storage.objects`. Migrasi `20260822090000` menambahkannya
memakai `public.is_admin()` — BUKAN sekadar peran `authenticated`, karena
pendaftaran publik Supabase masih terbuka dan `authenticated` saat ini
berarti "siapa pun yang mau mendaftar". Terverifikasi utuh:
upload → baca (200) → hapus.

**Poin 3 — kompresi gambar.** `lib/image-compress.ts` dipasang di keempat
jalur upload. Dua penjaga yang disengaja: SVG dan GIF dilewatkan apa adanya
(mengompresnya merusak vektor dan membuang animasi), dan hasil kompresi
DIBUANG kalau ternyata lebih besar dari aslinya — yang terjadi pada PNG
kecil dengan sedikit warna.

**Poin 8 — mitra jadi CRUD, marquee membaca DB.** Menemukan cacat nyata
saat diuji pada 2 mitra: trek gandanya hanya 946px sedangkan viewport
1440px, jadi ada celah kosong yang berputar. Diperbaiki dengan
`min-w-[100vw]` per salinan. Diuji pada 2 dan 15 mitra.

**Poin 9 — penyunting email & WhatsApp.** Kolom "Body (HTML)" dihapus;
admin sekarang menulis teks biasa dan `textToHtml()` yang menyusun HTML-nya
— sekaligus menutup jalur injeksi, karena `&`, `<`, `>` di-escape sebelum
dibungkus paragraf. Lebar wadah `max-w-4xl` (896px, terpusat) diganti
`w-full max-w-[1600px]`.

Ukur dulu, baru simpulkan: setelah dilebarkan, penyunting WhatsApp yang
satu kolom menghasilkan `<textarea>` **1550px** di layar 1920 — sekitar 200
karakter per baris, yang justru dilarang §3.4. Jadi langkah 2 dan 3
dijadikan dua kolom berdampingan. Hasil terukur pada halaman ter-render:

| Viewport | Wadah | Kolom penyunting |
|---|---|---|
| 1280 | 976px | 451px |
| 1440 | 1136px | 531px |
| 1920 | 1600px (batas aktif) | 763px |

Angkanya identik antara penyunting Email dan WhatsApp — disengaja.

**Poin 11 — penjadwalan terbit, tanpa penjadwal eksternal.** Ditegakkan di
**RLS** (`20260822110000`), bukan di query. Ada TUJUH tempat di kode yang
menyaring `is_published` untuk pembaca publik; menambal ketujuhnya berarti
menyisakan yang kedelapan untuk dilupakan — dan kebocoran seperti itu tidak
memunculkan error, artikel yang belum waktunya cuma diam-diam masuk sitemap.

Diverifikasi dengan **kunci anon** (bukan service key — kesalahan yang
sempat menutupi cacat di CP1). Artikel dijadwalkan ke 2027:

| Jalur baca | Baris bocor |
|---|---|
| daftar artikel | 0 |
| akses langsung ke slug | 0 |
| sitemap | 0 |
| artikel terkait | 0 |
| terpopuler | 0 |
| `select=*` tanpa filter apa pun | 0 |

Lalu jadwalnya dimundurkan ke masa lalu → artikel langsung terlihat, tanpa
cron dan tanpa campur tangan siapa pun.

Diuji juga **end-to-end lewat API sungguhan** (instance uvicorn terpisah,
JWT admin nyata): `08:00+07:00` tersimpan sebagai `01:00Z` — konversi zona
waktu benar. Ini bukan detail kosmetik: kalau offset tidak ikut terkirim,
server (UTC) dan admin (WIB) berselisih 7 jam dan artikel terbit di hari
yang salah.

Dua cacat cache ditemukan dan ditutup di jalan yang sama:
`app/sitemap.ts` sama sekali TIDAK punya `revalidate`, jadi ia beku sejak
build — artikel terjadwal tidak akan pernah masuk sitemap sampai deploy
berikutnya. Dan `/artikel/[slug]` memakai 3600 sementara `/artikel` memakai
300, yang berarti artikel muncul di daftar sampai 55 menit sebelum halaman
detailnya berhenti 404. Keduanya kini seragam 300 (sitemap 3600).

Status terbit jadi TIGA keadaan (`lib/publish-schedule.ts`) — artikel
terjadwal punya `is_published = true`, jadi membaca kolom itu apa adanya
akan menampilkan "Terbit" hijau untuk artikel yang belum bisa dibuka
siapa pun.

**Satu penyimpangan sistem desain yang saya buat sendiri lalu perbaiki:**
teks bantuan sempat memakai `text-[11px]`, di bawah dasar skala (12px) dan
melanggar aturan nol nilai literal. Diganti `text-xs`.

DESIGN-SYSTEM: amandemen §4.7 (aturan 7 lebar wadah + aturan 8 "melebarkan
wadah mewajibkan kolom kedua", dengan angka terukur), dan §4.13 baru
(tiga keadaan status terbit).

Mutu: `tsc` 0 error, build sukses, lint 7 masalah — sama dengan garis dasar
sebelum CP5 (2 error sisanya ada di `AnimatedCounter.tsx` dan `Navbar.tsx`,
keduanya bawaan lama, bukan dari checkpoint ini).

**Perlu tindakan Jazil:** backend lokal di port 8001 berjalan TANPA
`--reload`, jadi ia masih memuat kode lama; dan Railway perlu deploy ulang
agar `published_at` diterima di produksi. Sampai itu dilakukan, penjadwalan
bekerja di database tapi form admin produksi belum bisa mengirimkannya.
