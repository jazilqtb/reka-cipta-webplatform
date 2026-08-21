# DESIGN-SYSTEM.md — CV Reka Cipta Indonesia

**Status:** authoritative. Supersedes `docs/DESIGN_SYSTEM_RekaCirciptaIndonesia_v2.md`
(kept for history only).
**Implementasi tunggal:** `app/globals.css` → blok `@theme`. Tidak ada nilai
desain yang boleh hidup di luar file itu.
**Ditetapkan:** 2026-08-20 · Checkpoint 0 dari optimasi menyeluruh.

---

## 0. Kenapa sistem ini ada — temuan audit

Audit token dijalankan pada 166 file `.tsx/.ts` di `app/` + `components/`.
Angka di bawah ini terukur, bukan kesan.

| Dimensi | Temuan | Batas sistem baru |
|---|---|---|
| Token warna di `@theme` | **92** entri `--color-*` | **28** |
| Nilai hex unik di `globals.css` | **73** | 28 |
| Keluarga warna | **6** (`brand-teal`, `ink`, `sand`, `salt`, `neutral`, `crystal`) | **3** |
| Typeface dimuat | **4** (Fraunces, Space Grotesk, Plus Jakarta Sans, JetBrains Mono) | **1 keluarga + mono-nya** |
| Font weight terpakai | **4** (500, 600, 700, 800) | **3** (400, 500, 600) |
| Ukuran font terpakai | **8** | 7 |
| Varian border-radius | **11** | **2** (+ `full` khusus) |
| Warna hardcoded di komponen | **0** | 0 — dipertahankan |

**Dua temuan yang paling menjelaskan keluhan "terasa consumer app":**

1. **Dua ramp hijau yang tumpang tindih.** `brand-teal-*` dan `ink-*`
   sama-sama ramp 11 langkah bernuansa teal. `salt-*` dan `neutral-*`
   sama-sama abu sejuk. Setengah dari 92 token itu duplikat konseptual —
   dan ketika dua ramp mirip dipakai berdampingan, mata membaca "banyak
   warna" alih-alih "satu identitas".

2. **Ujung terang ramp teal dipakai sebagai bidang besar.**
   `#1BBFAA`, `#52D6C4`, `#93E7DC`, `#C7F2EE` dan `crystal-400` `#5FE1CB`
   adalah mint/aqua bersaturasi tinggi. Warna itu sendiri tidak salah —
   yang salah adalah luasannya. Aksen mint seluas 4px terbaca presisi;
   seluas satu section terbaca aplikasi konsumen.

Ditambah **bayangan berwarna**: seluruh `--shadow-*` memakai
`rgba(11,125,110,…)` — teal-tinted. Bayangan berwarna adalah penanda tren
consumer/SaaS yang paling cepat dikenali, dan pada bidang besar ia membuat
permukaan tampak "melayang" alih-alih "terpasang".

---

## 1. Prinsip

Empat kalimat yang mengatur setiap keputusan turunannya.

1. **Netral yang mendominasi, brand yang menandai.** Halaman dibangun dari
   abu-baja dan putih. Teal muncul hanya di tempat yang menuntut tindakan
   atau menandai status.
2. **Hierarki dari ukuran dan ruang, bukan dari warna.** Kalau sebuah
   elemen perlu menonjol, besarkan atau beri ruang — jangan warnai.
3. **Geometri yang tegas.** Sudut kecil, garis tipis, sisi lurus. Bahan
   industri tidak membulat.
4. **Gerak melayani orientasi, bukan dekorasi.** Animasi hanya boleh
   menjelaskan perubahan keadaan. Yang menunda akses informasi dilarang.

**Audiens yang dilayani:** staf purchasing/procurement, QC, dan produsen
makanan. Mereka datang untuk memverifikasi spesifikasi dan meminta harga —
bukan untuk menikmati situsnya. Setiap keputusan di bawah ini mengasumsikan
pembaca sedang membandingkan kita dengan dua pemasok lain di tab sebelah.

---

## 2. Palet

Tiga keluarga. Tidak ada yang keempat.

### 2.1 Steel — netral, dominan (≈90% permukaan)

Abu sejuk dengan undertone **biru** yang sangat samar, supaya rukun dengan
primary tanpa pernah terbaca sebagai warna. Undertone netral wajib
mengikuti primary: abu ber-undertone teal di sebelah primary biru terbaca
sebagai dua suhu warna yang berselisih. Disetel ulang 2026-08-21 bersama
pergantian hue.

| Token | Hex | Dipakai untuk |
|---|---|---|
| `steel-50` | `#F7F8FA` | Latar halaman |
| `steel-100` | `#EEF0F4` | Latar section bergantian, baris tabel zebra |
| `steel-200` | `#E0E4EA` | **Garis & pembatas** — nilai default untuk semua border |
| `steel-300` | `#C5CBD5` | Garis pada keadaan hover, border input |
| `steel-400` | `#98A0AD` | Ikon nonaktif, teks placeholder |
| `steel-500` | `#6C7482` | Teks sekunder di atas terang |
| `steel-600` | `#505863` | Teks bantu, label |
| `steel-700` | `#3A414B` | Teks isi |
| `steel-800` | `#242A31` | Judul |
| `steel-900` | `#151A1F` | Latar gelap — sidebar, footer |
| `steel-950` | `#0B0E12` | Latar gelap paling dalam |

### 2.2 Marine — primary, hemat (≈8% permukaan)

Lima langkah. Ramp 11 langkah dipangkas karena tujuh di antaranya hanya
lahir dari kebiasaan menyalin skala Tailwind, bukan dari kebutuhan nyata.

| Token | Hex | Dipakai untuk |
|---|---|---|
| `marine-700` | `#0C3F63` | Teks link di atas terang, keadaan `:active` |
| `marine-600` | `#125A8C` | **Isi tombol primary, ring fokus, indikator aktif** |
| `marine-500` | `#1A6EA8` | Hover tombol primary |
| `marine-200` | `#B3C9DA` | Border badge/chip, aksen teks di atas latar gelap |
| `marine-50` | `#EDF2F7` | Latar badge/chip, baris tabel tersorot |

#### KOREKSI (2026-08-21) — kenapa hue-nya berganti dari teal

Versi dokumen ini sebelumnya menyatakan `#0B7D6E` dipertahankan karena
*"itu warna logo, dan mengubahnya berarti membuat situs berselisih dengan
berkas cetak dan tanda tangan email yang sudah beredar."*

**Premis itu keliru dan kalimatnya dicabut.** Logo yang terpasang di situs
adalah placeholder; identitas visual final belum ada, dan tidak ada berkas
cetak atau tanda tangan email yang perlu diselaraskan. Tidak pernah ada
kendala yang menahan penggantian hue — yang ada hanyalah alasan yang
terdengar meyakinkan dan tidak pernah diperiksa. Dicatat di sini apa
adanya supaya ronde berikutnya tidak mewarisi lagi.

#### Kenapa biru laut

Dipilih dari kesesuaian dengan pembacanya, bukan dari warisan:

- **Hijau-teal membawa muatan yang salah.** Pada kategori produk pangan
  dan bahan baku, hijau dibaca sebagai *organik / alami / ramah lingkungan*.
  Yang dijual di sini adalah konsistensi mutu dan kelengkapan dokumen uji —
  janji tentang presisi, bukan tentang alam.
- **Biru adalah warna sektor yang dilayani.** Water treatment, pengolahan
  pangan, dan laboratorium mutu memakai biru sebagai warna alat, seragam,
  dan sertifikat. Ia terbaca sebagai lingkungan kerja pembacanya sendiri.
- **Biru laut menyambung ke asal produk tanpa mengklaim tempat.** Garam
  datang dari laut di mana pun tambaknya berada — hue ini menyampaikan
  provenance tanpa mengunci diri ke satu daerah (lihat §12).
- **Dipilih deep, bukan azure.** `#125A8C` gelap dan hanya bersaturasi
  sedang. Biru cerah adalah warna SaaS; biru dalam adalah warna industri.

#### Kontras — diverifikasi, bukan diperkirakan

Empat belas pasangan pemakaian nyata diukur sebelum nilai ini ditetapkan.
Yang paling ketat: teks putih di atas `marine-500` (hover tombol) = **5,47:1**,
dan `steel-500` di atas putih = **4,71:1**. Semuanya melewati WCAG AA.

#### Penamaan token

Keluarga ini dulu bernama `teal`. Nama lama **tetap hidup sebagai alias**
(`--color-teal-*` → `--color-marine-*`, dan `--color-brand-teal-*` mengikuti
lewat rantai yang sama), karena di Tailwind v4 kelas yang tokennya hilang
tidak menghasilkan CSS **dan tidak memunculkan error**. Alias dicabut
bersama alias `ink`/`sand`/`salt` setelah nama kelas di komponen
diseragamkan.

**Yang dihapus:** seluruh ramp teal lama. Nol literal `#0B7D6E` /
`#0F9184` / `rgba(11,125,110,…)` tersisa di bundle CSS — diverifikasi
dengan meng-grep hasil build, bukan dengan membaca kode.

### 2.3 Ochre — aksen, sangat hemat (≈2% permukaan)

Tiga langkah. Menandai jalur supplier dan peringatan lunak. Jangan dipakai
untuk apa pun yang lain.

| Token | Hex | Dipakai untuk |
|---|---|---|
| `ochre-700` | `#6B4B25` | Teks di atas `ochre-50` |
| `ochre-600` | `#8A6535` | Ikon & garis aksen |
| `ochre-50` | `#F5F1EA` | Latar blok supplier |

### 2.4 Semantik — status saja

Empat peran × 3 langkah = 12 token. Dipakai **hanya** untuk mengomunikasikan
hasil sistem (berhasil / perhatian / gagal / informasi). Tidak pernah dipakai
sebagai warna dekoratif.

`success` `#15803D` · `warning` `#B45309` · `danger` `#B91C1C` · `info` `#3E3175`

**`info` digeser dari biru ke indigo (2026-08-21).** Sejak primary menjadi
biru laut, badge berstatus "info" berwarna biru tidak lagi bisa dibedakan
dari elemen primary — dan status yang tertukar dengan tombol adalah
kegagalan makna, bukan sekadar selera.
Masing-masing dengan pasangan `-50` (latar) dan `-200` (garis).

Nilai teks sengaja diambil dari langkah gelap (700) supaya kontras di atas
latar `-50`-nya melewati WCAG AA tanpa perlu diperiksa kasus per kasus.

### 2.5 Aturan pemakaian

- Latar halaman **selalu** `steel-50` atau putih. Tidak ada gradient teal
  seluas viewport.
- Teal tidak pernah menjadi latar bidang yang lebih besar dari sebuah
  tombol, badge, atau bilah 4px — **kecuali** satu blok CTA penutup per
  halaman.
- Latar gelap memakai `steel-900`, bukan teal gelap.
- Dua warna aksen tidak pernah bertemu dalam satu komponen.

---

## 3. Tipografi

### 3.1 Satu keluarga

**IBM Plex Sans** untuk seluruh antarmuka. **IBM Plex Mono** untuk angka
lab, nomor sertifikat, kode produk, dan SKU.

Alasan pemilihan:

- Dirancang untuk perusahaan teknologi/industri — nadanya *engineered*,
  bukan ramah-startup. Itu persis jarak yang perlu ditempuh dari keadaan
  sekarang.
- Angkanya jelas dan punya varian tabular. Halaman ini penuh spesifikasi
  (NaCl 97%, kadar air ≤0,5%, 25 kg/sak); angka yang goyah merusak
  kredibilitas lebih cepat daripada warna yang salah.
- Punya saudara monospace yang serasi, jadi data teknis bisa memakai mono
  tanpa memasukkan keluarga kelima.
- Tersedia di Google Fonts.

**Empat typeface diturunkan menjadi satu keluarga.** Yang dilepas:

| Dilepas | Alasan |
|---|---|
| Fraunces (display serif) | Serif dekoratif dengan optical sizing — bahasa editorial/konsumen. Hanya dipakai 7×, biayanya satu permintaan font penuh. |
| Space Grotesk (UI) | Grotesk dengan karakter berciri khas (`g`, `a`). Kepribadiannya bersaing dengan isi, dan angkanya kalah tenang dari Plex. |
| Plus Jakarta Sans (body) | Humanis membulat — sumber langsung kesan "friendly consumer app" pada teks isi. |

Token `font-display` dan `font-ui` **tetap ada** dan sekarang menunjuk ke
IBM Plex Sans. 226 pemakaian di komponen tidak perlu disentuh, dan tidak ada
kelas yang mati diam-diam.

### 3.2 Skala — rasio 1.25, tujuh langkah

| Token | Ukuran | Line-height | Peran |
|---|---|---|---|
| `text-xs` | 12px | 1.5 | Meta, label tabel, caption |
| `text-sm` | 14px | 1.55 | **Default antarmuka** |
| `text-base` | 16px | 1.65 | **Default teks isi** |
| `text-lg` | 18px | 1.55 | Lead paragraph, judul kartu |
| `text-xl` | 22px | 1.35 | H3 |
| `text-2xl` | 28px | 1.25 | H2 |
| `text-3xl` | 36px | 1.15 | H1 halaman dalam |
| `text-4xl` | 45px | 1.1 | H1 hero — **satu per halaman** |

`text-5xl` ke atas ditiadakan. Judul di atas 45px pada layar desktop
memaksa baris yang terlalu pendek dan mendorong isi penting ke bawah lipatan.

#### AMANDEMEN (2026-08-21) — hierarki heading ditegakkan, skala TIDAK dinaikkan

Keluhan: di desktop, nama produk di katalog terbaca sama besar atau lebih
besar daripada heading section. Diukur pada halaman ter-render, bukan dibaca
dari kode:

| Elemen | Sebelum | Sesudah |
|---|---|---|
| H2 "5 Pilihan Garam Bersertifikasi" | 36px | 36px |
| H3 nama produk unggulan | **36px** | 22px |
| H3 judul panel langkah (HowItWorks) | **36px** | 22px |
| H3 nama produk di kartu grid | 18px | 18px |
| H3 nama produk di kartu carousel (mobile) | **14px** | 16px |

Dua H3 ternyata **persis sebesar H2** di section yang sama, dan nama produk
yang identik tampil di tiga ukuran berbeda tergantung kartunya.

**Skala global sengaja TIDAK dinaikkan.** Setelah rasionya benar, H2 36px
memimpin dengan jelas (36 : 22 = 1,64) dan H1 45px tetap di puncak. Menaikkan
skala untuk menutupi hierarki yang rusak akan memperbesar masalahnya, bukan
menyelesaikannya. Batas 45px di §3.2 tetap berlaku.

**Aturan turunan yang sekarang mengikat:**
- H2 section: `text-2xl md:text-3xl` (28 / 36px). Satu per section.
- H3 judul kartu & panel: **maksimal** `text-lg md:text-xl` (18 / 22px).
- Judul kartu tidak pernah melebihi 60% ukuran H2 di section yang sama.
- Varian `compact` (kartu carousel sempit di ponsel) boleh turun satu langkah
  ke `text-base` (16px), tapi tidak lebih rendah — 14px membuat nama produk
  terbaca seperti metadata, bukan seperti judul.
- Judul yang berperan sebagai judul section ditulis `<h2>`, bukan `<h3>`
  yang dibesarkan — CredibilitySection melanggar ini dan sudah dibetulkan.

### 3.3 Weight — tiga

`400` teks isi · `500` label & elemen antarmuka · `600` judul

`font-bold` dan `font-extrabold` **dipetakan ulang ke 600**. Keduanya masih
bisa ditulis di komponen tanpa error, tapi hanya menghasilkan tiga bobot
nyata. Ini memangkas 51 pemakaian bobot 700/800 tanpa menyentuh satu file
komponen pun.

### 3.4 Aturan

- Tidak ada italic dekoratif. Italic hanya untuk kutipan dan istilah asing.
- Tidak ada `uppercase` + `tracking-widest` di luar eyebrow, dan eyebrow
  maksimal satu per section.
- Angka teknis, kode produk, dan nomor sertifikat memakai `font-mono` dengan
  `font-variant-numeric: tabular-nums`.
- Panjang baris teks isi dibatasi `max-w-[68ch]`.

---

## 4. Border radius — dua nilai

| Token | Nilai | Dipakai untuk |
|---|---|---|
| `radius-sm` | **4px** | Badge, chip, input, elemen kecil |
| `radius-md` | **6px** | Kartu, panel, tombol, modal, semua container |

Dilaksanakan dengan **menyetel ulang nilai token**, bukan dengan mengganti
kelas di 375 tempat:

```
--radius-sm  4px   --radius-lg  6px    --radius-3xl 8px
--radius-md  4px   --radius-xl  6px
--radius     4px   --radius-2xl 8px
```

Artinya 108 pemakaian `rounded-xl` (dulu 12px) dan 79 pemakaian
`rounded-2xl` (dulu 16px) langsung mengecil ke 6–8px tanpa satu pun file
komponen berubah. Penyeragaman nama kelas dikerjakan bertahap di CP1–CP7.

**`rounded-full` diizinkan hanya untuk:** avatar, titik indikator status,
dan spinner. Dilarang untuk tombol, kartu, input, badge, dan container mana
pun. 45 pemakaian ditinjau satu per satu mulai CP1.

---

## 4.1 Deret geser horizontal (`.carousel-row`)

Satu pola untuk **semua** deret geser: katalog produk, Sektor yang Kami
Layani, Langkah Berikutnya, dan Artikel Terbaru. Ditetapkan 2026-08-21
setelah keempatnya ditemukan menyalin rangkaian kelas yang sama — sehingga
setiap perbaikan harus diulang empat kali, dan terlewat.

**Kapan dipakai:** daftar sejenis yang di ponsel tidak muat berdampingan dan
urutannya tidak penting (produk, sektor, artikel, jalur CTA).

**Kapan TIDAK dipakai:** apa pun yang harus dibaca berurutan atau
dibandingkan berdampingan — tabel spesifikasi, langkah proses, harga.

**Yang dijamin pola ini:**

| Properti | Nilai | Kenapa |
|---|---|---|
| `overflow-y` | `hidden` **eksplisit** | `overflow-x: auto` memaksa sumbu `visible` menjadi `auto`. Tanpa baris ini setiap deret jadi wadah gulir dua sumbu, dan di layar sentuh browser bisa menyerap gerakan vertikal jari alih-alih menggulirkan halaman |
| `touch-action` | `pan-x pinch-zoom` | Menyatakan tegas: deret ini hanya melayani gerak mendatar; sisanya milik halaman |
| `overscroll-behavior-x` | `contain` | Menggeser sampai ujung tidak merambat jadi navigasi "kembali" |
| `scroll-snap-align` pada **anak** | `start` | Wadah dengan `snap-type: mandatory` tanpa titik snap di anaknya punya posisi diam yang tidak terdefinisi — itulah sebab kartu pertama tampak menempel tepi layar |
| `scroll-padding-left` | `= gutter` | Titik snap jatuh di gutter, sejajar judul section, bukan di tepi layar |

**Dibungkus `@layer components` — wajib.** Lihat §9 anti-pattern #13.

## 4.2 Pembatas antar-section (`SectionDivider`)

**Bentuk resmi: sisi LURUS.** Perpindahan warna latar, ditambah garis rambut
`steel-200` ketika kedua sisi sama-sama terang.

Ditetapkan 2026-08-21, menggantikan tiga `<path>` SVG melengkung (`wave`,
`curve`, `diagonal`) setinggi 40–80px yang dipakai **21 kali di 20 berkas**.
Lengkungan setinggi 80px bukan aksen kecil — ia salah satu bentuk terbesar
di halaman, dan ia melawan §1.3 secara langsung.

**Aturan:**
- Kedua sisi terang → garis rambut `steel-200` di tepi atas.
- Salah satu sisi gelap (`ink/steel-800/900/950`) → **tanpa garis**.
  Perpindahan warnanya sendiri sudah menjadi pembatas; menambah garis di
  situ hanya derau.
- Tinggi membawa jarak antar-section: `wave` 40/56px · `curve` 32/48px ·
  `diagonal` 24/40px. Nama variannya dipertahankan hanya demi kompatibilitas
  21 pemanggil dan **tidak lagi berarti bentuk**.

**Kenapa tidak dihapus saja:** pembatas ini juga membawa jarak. Menghapus
komponennya membuat dua bidang warna bertumbukan tanpa napas. Yang dibuang
lengkungannya, bukan ruangnya.

**Dilarang:** pembatas melengkung, bergelombang, miring, atau berbentuk apa
pun selain garis lurus — lihat §9 anti-pattern #15.

## 4.3 Permukaan yang bisa disunting non-teknis (CMS)

Ditetapkan 2026-08-21. Daftar ini **tertutup**: apa pun yang tidak tercantum
di sini tidak boleh dibuka ke CMS tanpa menambahkannya dulu ke dokumen ini.

| Permukaan | Yang bisa diubah | Yang TIDAK bisa diubah |
|---|---|---|
| Hero beranda | Teks headline & sub-headline; label gaya per potongan | Ukuran, jenis huruf, tata letak, warna sebagai nilai |
| Angka statistik hero | Angka **dasar** tiap statistik | Label, urutan, cara angka dinamisnya dihitung |
| Tentang Kami — Visi | Teks satu paragraf (maks 400 karakter) | Tata letak, ukuran kutipan |
| Tentang Kami — Perjalanan | Tahun, judul, keterangan; tambah/hapus/urutkan | Bentuk garis waktu, perilaku geser |
| Tentang Kami — Misi | Judul & uraian tiap poin; tambah/hapus/urutkan | Bahwa tampilannya accordion |
| Tentang Kami — Tim | Nama, jabatan, foto; tambah/hapus/urutkan | Rasio foto, bentuk kisi, gaya fallback inisial |

### Gaya yang diekspos, dan kenapa hanya empat

`Biasa` · `Tebal` · `Miring` · `Warna utama`

Admin memilih **peran**, bukan nilai. Tidak ada color picker, dan itu
keputusan yang disengaja: kebebasan warna di CMS adalah cara tercepat
sistem desain ini runtuh lagi. Dalam tiga bulan akan ada empat biru yang
hampir sama, satu merah yang bukan `danger`, dan tak seorang pun tahu mana
yang benar.

Karena yang tersimpan adalah peran, pergantian hue primary dari teal ke
marine (§2.2) **tidak menyentuh satu pun konten tersimpan** — "Warna utama"
tetap berarti warna utama.

### AMANDEMEN §3.4 — italic di CMS

§3.4 menyatakan "tidak ada italic dekoratif; italic hanya untuk kutipan dan
istilah asing". `Miring` tetap diekspos ke CMS karena istilah asing memang
sering muncul di kalimat hero (*food grade*, *water treatment*), dan itu
justru pemakaian yang sah menurut §3.4. Petunjuk di panel admin menyebutkan
batas itu. Yang tidak bisa dicegah oleh sistem adalah admin memakainya untuk
menekankan — itu risiko yang diterima sadar, dan `Tebal` disediakan sebagai
jalan yang lebih benar untuk penekanan.

### Bentuk penyimpanan

Deret potongan `{ text, style }` di kolom JSONB — **bukan HTML**. Teks admin
tidak pernah ditafsirkan sebagai markup: ia dirender sebagai text node dan
`style` dicocokkan ke daftar tetap. Ini lebih kuat daripada menyimpan HTML
lalu menyaringnya, karena tidak ada penyaring yang bisa gagal — tidak pernah
ada HTML.

Batas panjang ditegakkan **tiga kali**: di form, di Server Action, dan di
`CHECK` constraint tabel. Masing-masing melindungi jalur masuk yang berbeda;
form bisa dilewati, action bisa dipanggil langsung, tabel tidak bisa dihindari.

## 4.4 Accordion

Ditetapkan 2026-08-21 (poin misi di /tentang-kami).

**Dibangun di atas `<details>`/`<summary>` native, bukan div + `useState`.**
Elemen native sudah membawa peran ARIA, keadaan expanded, fokus keyboard,
Enter/Space, dan — yang paling sering terlupa — **pencarian dalam halaman**:
Ctrl+F membuka `<details>` yang tertutup untuk menampilkan hasilnya.
Menirunya dengan div menuntut menulis ulang semuanya, dan bagian terakhir
itu praktis tidak pernah ditulis ulang.

| Aspek | Ketetapan |
|---|---|
| Banyak terbuka | **Boleh.** Poin misi bukan pilihan yang saling meniadakan; pembaca yang membandingkan dua poin tidak boleh dipaksa menutup salah satunya. Atribut `name` (accordion eksklusif) sengaja tidak dipakai |
| Keadaan awal | Item pertama terbuka — supaya bagian itu tidak terbaca sebagai daftar judul kosong |
| Ikon | `CaretDown`, berputar 180° saat terbuka |
| Durasi | 150ms `ease-out` — transisi keadaan, bukan animasi masuk |
| Keyboard | Ditangani native. Jangan menambah handler `onKeyDown` |

**Kapan dipakai:** daftar berisi judul yang bisa berdiri sendiri, dengan
uraian yang panjangnya menghalangi kalau ditampilkan sekaligus.
**Kapan TIDAK:** informasi yang harus dibaca semua (spesifikasi, harga,
langkah proses), atau daftar berisi kurang dari tiga item.

## 4.5 Foto orang

Rasio **1:1**, maksimal **2 MB**, format JPG/PNG/WebP. Dipotong dari tengah
(`object-cover`). Anggota tanpa foto tampil dengan **inisial namanya** di
atas bidang primary — entri baru tidak pernah kosong, dan admin tidak
terpaksa mengunggah foto seadanya hanya supaya kisinya rapi.

Batas ukuran dan jenis ditegakkan dua kali: di komponen unggah (pesan cepat)
dan di konfigurasi bucket Supabase (tidak bisa dilewati dari klien mana pun).

## 4.6 Pagination

Dipakai di `/artikel`. Pola: nomor halaman + Sebelumnya/Berikutnya, 6 item
per halaman.

**Kontrak SEO — tiga aturan yang mengikat:**

1. **Tiap halaman kanonik ke DIRINYA SENDIRI**, bukan ke halaman 1.
   Meng-kanonik-kan halaman 2 ke halaman 1 memberi tahu mesin pencari bahwa
   isinya duplikat — dan artikel yang hanya muncul di halaman 2 berisiko
   tidak pernah terindeks. Cacat ini nyata ada di situs ini sampai
   2026-08-21.
2. **Sitemap memuat setiap artikel satu per satu**, bukan halaman daftarnya.
   Penemuan artikel tidak boleh bergantung pada pagination.
3. `rel="prev"`/`rel="next"` disertakan sebagai pelengkap. Bobotnya kecil —
   Google menyatakan sejak 2019 tidak lagi memakainya sebagai sinyal indeks;
   Bing masih. Kanonik per-halaman yang menentukan.

Halaman kedua dan seterusnya memakai judul `— Halaman N` agar tidak
bertabrakan sebagai judul duplikat di hasil pencarian.

## 4.8 Varian keadaan admin (`AdminState`)

Empat nada. Ketiganya yang pertama ditetapkan sebelumnya; `blocked`
ditambahkan 2026-08-21.

| Nada | Artinya | Jalan keluar yang ditawarkan |
|---|---|---|
| `empty` | Sistem sehat, datanya memang belum ada | Tidak ada — netral |
| `error` | Server MENJAWAB dengan galat | "Coba lagi" (primary) |
| `missing` | Alamatnya salah atau basi | "Kembali ke daftar" |
| `blocked` | Permintaan **tidak pernah sampai** ke server | "Coba lagi" (sekunder) + penjelasan alamat |

**Kenapa `blocked` dipisah dari `error`.** `TypeError: Failed to fetch`
adalah satu pesan untuk beberapa kegagalan yang sangat berbeda: server mati,
jaringan putus, **dan preflight CORS ditolak**. Browser sengaja tidak
membedakannya demi keamanan. Selama ini semuanya ditampilkan sebagai
"periksa koneksi" — dan itu menyesatkan: saat panel dibuka dari ponsel lewat
IP jaringan lokal, koneksinya baik-baik saja; yang ditolak adalah origin-nya.
Pesan yang salah membuat orang mencari masalah di tempat yang salah.

Karena browser tidak memberi tahu yang mana, teksnya **menyebut kedua
kemungkinan** alih-alih menebak satu. Dan tombolnya diturunkan ke sekunder:
menyuruh orang "coba lagi" pada kegagalan CORS berarti menyuruhnya
mengulang hal yang pasti gagal.

## 4.7 Pola form admin

Ditetapkan 2026-08-21 setelah `/admin/email-templates` dinilai "tidak
profesional". Yang ditemukan bukan satu cacat besar melainkan lima kecil
yang menumpuk — dan semuanya berulang di form admin lain, sehingga polanya
ditulis di sini agar form berikutnya tidak lahir ad-hoc lagi.

**Aturan:**

1. **Kelompokkan dengan `<fieldset>` + `<legend>`.** Bukan kosmetik:
   pembaca layar mengumumkan `legend` saat fokus masuk ke grup, jadi
   pengelompokannya ikut terdengar. Beri nomor kalau grupnya adalah
   **langkah** (`1 · Status lead`), jangan diberi nomor kalau hanya kategori.
2. **Setiap kontrol punya `<label>` yang terlihat**, bukan hanya kalimat
   pengantar di kepala kartu. Label yang jauh dari kolomnya sama saja
   dengan tidak ada label.
3. **Kontrol yang bisa diklik harus mengatakannya.** Chip placeholder dulu
   tampil sebagai deretan kotak abu tanpa petunjuk apa pun bahwa mengkliknya
   menyalin isinya.
4. **Pratinjau menyebutkan datanya.** "Pratinjau" saja tidak cukup — sebut
   bahwa penandanya sudah diganti data contoh, supaya tidak dikira teks asli.
5. **Aksi merusak tidak setara dengan aksi menyimpan.** Simpan = tombol
   primary. "Kembalikan ke bawaan" = tautan teks, dipisah garis, di sisi
   berlawanan. Keduanya dulu tampil sebagai tombol berukuran sama, padahal
   satu menyimpan pekerjaan dan satu membuangnya.
6. Lebar kolom teks panjang mengikuti isinya: teks berformat (HTML,
   template) memakai `font-mono`; kalimat biasa tidak.

## 5. Spacing — grid 8px

Langkah yang disahkan: **8 · 16 · 24 · 32 · 40 · 48 · 64 · 80 · 96**
(Tailwind `2 · 4 · 6 · 8 · 10 · 12 · 16 · 20 · 24`).

Setengah langkah **4px** (`1`) diizinkan hanya untuk jarak ikon–teks di
dalam satu baris. Langkah `3` (12px), `5` (20px), `7` (28px), `9` (36px),
`11` (44px) tidak disahkan untuk kode baru.

Irama section: `py-16` di mobile, `py-24` di desktop.

---

## 6. Elevasi

Bayangan **netral**, bukan teal. Tiga langkah, itu saja.

| Token | Nilai | Dipakai untuk |
|---|---|---|
| `shadow-sm` | `0 1px 2px rgba(12,17,17,.06)` | Kartu dalam keadaan diam |
| `shadow-md` | `0 2px 6px rgba(12,17,17,.08)` | Dropdown, popover |
| `shadow-lg` | `0 8px 24px rgba(12,17,17,.12)` | Modal, drawer |

`shadow-xl` dan `shadow-glow-md` dihapus. Glow adalah dekorasi.

**Pemisah utama antar permukaan adalah garis `steel-200`, bukan bayangan.**
Bayangan hanya untuk yang benar-benar melayang di atas halaman.

---

## 7. Motion policy

### DIIZINKAN

| Pola | Durasi | Easing |
|---|---|---|
| Transisi keadaan (hover, focus, active, checked) | 120–160ms | `ease-out` |
| Fade/slide masuk saat elemen memasuki viewport | 250ms, geser ≤12px | `ease-out` |
| Skeleton & indikator memuat | 1.4s loop | `linear` |
| Buka/tutup dropdown, modal, drawer | 180ms | `ease-out` |
| Transisi halaman | ≤200ms, fade saja | `ease-out` |

Semuanya berhenti total di bawah `prefers-reduced-motion: reduce`.

### 7.1 AMANDEMEN (2026-08-21) — marquee logo mitra

Larangan "animasi berulang tak berhingga" di bawah, dan anti-pattern #7,
**diberi satu pengecualian yang disahkan**: marquee auto-scroll pada dinding
logo mitra di section Mitra Distribusi.

Alasannya berdiri sendiri, bukan pelonggaran umum: daftar logo mitra tidak
membawa informasi yang harus dibaca berurutan — pembaca menangkap "ada
beberapa perusahaan nyata" dalam sekali lihat. Gerak lambat di sana tidak
menunda akses ke informasi apa pun, dan pada layar sempit ia justru
menampilkan mitra yang jika diam akan terpotong di tepi.

Empat syarat mengikat. **Ketiadaan salah satunya membatalkan pengecualian:**

1. Berhenti saat `hover` **dan** `focus-within` — pengguna keyboard ikut dilayani.
2. Berhenti total di `prefers-reduced-motion: reduce`.
3. Kecepatan tenang — satu putaran **42 detik**, bukan gerak yang menarik mata.
4. Tidak ada logo terpotong: trek digandakan tepat 2× lalu bergeser −50%,
   sehingga sambungannya tidak pernah terlihat.

Marquee dan auto-scroll di **tempat lain tetap dilarang**. Pengecualian ini
tidak berlaku untuk carousel produk, timeline, testimoni, atau apa pun yang
isinya perlu dibaca.

### DILARANG

- **Mouse-tracking apa pun** yang mengubah posisi, bentuk, ukuran, atau
  warna sebuah objek. Termasuk tombol magnetik, kartu yang miring mengikuti
  kursor, dan sorotan gradient yang mengikuti kursor.
- **Parallax dekoratif** — elemen latar yang bergerak dengan kecepatan
  berbeda dari scroll.
- **Morphing shape**, blob yang berubah bentuk, mesh gradient beranimasi.
- **Animasi berulang tak berhingga** pada elemen yang tidak sedang memuat —
  pulse, glow berdenyut, ring yang mengembang, marquee.
- **Animasi yang menunda akses informasi**: reveal berantai dengan delay
  bertingkat, hero yang harus selesai beranimasi sebelum teks terbaca.
- Durasi > 300ms untuk transisi keadaan apa pun.

---

## 8. Ikonografi

**Di luar cakupan pekerjaan ini — icon pack tidak diganti.**
Set yang dipakai sekarang (`@phosphor-icons/react`) dipertahankan apa adanya.

Yang dinormalkan hanya ukuran dan warnanya:

- Ukuran: **16px** sebaris dengan teks · **20px** tombol & item navigasi ·
  **24px** judul section · **40px** ilustrasi empty-state. Tidak ada ukuran
  lain. (Audit CP1 menemukan **20 ukuran unik** di portal publik — 11, 12,
  14, 17, 18, 19, 22, 26, 28, 30, 32, 36, 48, 56, 64, 80 dan seterusnya —
  semuanya disnap ke tangga empat langkah ini.)
- Warna: mewarisi `currentColor`. Ikon tidak pernah punya warna sendiri
  di luar `steel-400` (nonaktif) dan `teal-600` (aktif).
- Weight: `regular` untuk antarmuka, `duotone` hanya untuk ilustrasi
  section publik.

---

## 9. Anti-patterns — daftar larangan eksplisit

Ditulis supaya kesalahan yang sama tidak lahir kembali di ronde berikutnya.

1. **Jangan menambah keluarga warna.** Butuh warna baru berarti butuh
   diskusi, bukan token baru.
2. **Jangan memakai ujung terang ramp teal sebagai bidang besar.** Mint di
   atas 4px terbaca konsumen.
3. **Jangan memakai bayangan berwarna.** Bayangan itu abu-abu.
4. **Jangan menambah typeface.** Empat sudah pernah dicoba; hasilnya
   ketidakmenyatuan yang jadi alasan dokumen ini ditulis.
5. **Jangan memakai bobot 700/800.** Hierarki dari ukuran.
6. **Jangan `rounded-full` pada container.** Hanya avatar, titik status,
   spinner.
7. **Jangan menambah animasi berulang tak berhingga** untuk menarik
   perhatian. Kalau sesuatu penting, letakkan lebih tinggi di halaman.
8. **Jangan menulis nilai desain langsung di komponen** — tidak ada hex,
   tidak ada `text-[13px]`, tidak ada `rounded-[10px]`. Kalau tokennya
   belum ada, tambahkan tokennya.
9. **Jangan memakai gradient sebagai latar section.** Warna solid, dipisah
   garis.
10. **Jangan menaruh teks di atas foto tanpa lapisan gelap** minimal
    `rgba(12,17,17,.55)`. Kontras diperiksa di mobile, bukan di desktop.
11. **Jangan membuat subtitle lebih dari satu kalimat.** Lebih dari itu,
    ia teks isi dan harus diperlakukan begitu.
12. **Jangan mengulang pesan yang sama di dua section berdampingan.**
13. **Jangan menulis kelas komponen di luar `@layer`.** CSS tak berlapis
    MENGALAHKAN utility Tailwind yang berlapis, jadi `md:hidden` atau
    `sm:px-0` di pemanggil diam-diam tidak berlaku. Jebakan ini sudah
    menggigit proyek ini **tiga kali**: `.bg-salt-texture`, `.prose-brand`
    (teks editor terkurung 68ch), dan `.carousel-row` (carousel versi ponsel
    ikut tampil di desktop 1440px). Setiap kelas komponen baru di
    `globals.css` wajib berada di dalam `@layer components`.
15. **Jangan memakai pembatas section melengkung** — wave, curve, blob,
    atau miring. Bentuk industri bersisi lurus. Lihat §4.2.
14. **Jangan memakai `.mono-tech` untuk kalimat.** Monospace hanya untuk
    nilai teknis: kode produk, angka lab, nomor sertifikat. Kalimat bergaya
    monospace terbaca seperti keluaran terminal — itulah sebab keluhan
    "font deskripsi produk tidak menyatu".

---

## 10. Peta implementasi

| Lapis | Tempat | Aturan |
|---|---|---|
| Primitif | `app/globals.css` → `@theme` | Satu-satunya tempat nilai desain hidup |
| Semantik shadcn | `app/globals.css` → `:root` + `@theme inline` | Dipetakan ke primitif, bukan nilai lepas |
| Komponen | `components/**` | Hanya kelas utility. Nol nilai literal |

`tailwind.config.ts` sengaja tetap kosong — Tailwind v4 membaca token dari
CSS, dan dua sumber kebenaran lebih buruk daripada satu.
