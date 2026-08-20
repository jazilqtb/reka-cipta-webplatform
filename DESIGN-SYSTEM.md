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

Abu sejuk dengan undertone teal yang sangat samar, supaya rukun dengan
primary tanpa pernah terbaca sebagai warna.

| Token | Hex | Dipakai untuk |
|---|---|---|
| `steel-50` | `#F7F8F8` | Latar halaman |
| `steel-100` | `#EFF1F1` | Latar section bergantian, baris tabel zebra |
| `steel-200` | `#E1E5E5` | **Garis & pembatas** — nilai default untuk semua border |
| `steel-300` | `#C7CDCD` | Garis pada keadaan hover, border input |
| `steel-400` | `#9AA3A3` | Ikon nonaktif, teks placeholder |
| `steel-500` | `#6E7878` | Teks sekunder di atas terang |
| `steel-600` | `#525C5C` | Teks bantu, label |
| `steel-700` | `#3A4342` | Teks isi |
| `steel-800` | `#252D2C` | Judul |
| `steel-900` | `#161C1C` | Latar gelap — sidebar, footer |
| `steel-950` | `#0C1111` | Latar gelap paling dalam |

### 2.2 Teal — primary, hemat (≈8% permukaan)

Lima langkah. Ramp 11 langkah dipangkas karena tujuh di antaranya hanya
lahir dari kebiasaan menyalin skala Tailwind, bukan dari kebutuhan nyata.

| Token | Hex | Dipakai untuk |
|---|---|---|
| `teal-700` | `#075247` | Teks link di atas terang, keadaan `:active` |
| `teal-600` | `#0B7D6E` | **Isi tombol primary, ring fokus, indikator aktif** |
| `teal-500` | `#0F9184` | Hover tombol primary |
| `teal-200` | `#B4CFCA` | Border badge/chip berstatus |
| `teal-50` | `#EDF3F2` | Latar badge/chip, baris tabel tersorot |

`#0B7D6E` dipertahankan tanpa perubahan: itu warna logo, dan mengubahnya
berarti membuat situs berselisih dengan berkas cetak dan tanda tangan email
yang sudah beredar.

**Yang dihapus dari ramp lama:** `teal-400` `#1BBFAA`, `teal-300` `#52D6C4`,
`teal-100` `#C7F2EE`, dan `crystal-400` `#5FE1CB`. Semuanya mint
bersaturasi tinggi — sumber utama kesan "cerah/friendly" yang dikeluhkan.

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

`success` `#15803D` · `warning` `#B45309` · `danger` `#B91C1C` · `info` `#1D4ED8`
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
  **24px** judul section. Tidak ada ukuran lain.
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

---

## 10. Peta implementasi

| Lapis | Tempat | Aturan |
|---|---|---|
| Primitif | `app/globals.css` → `@theme` | Satu-satunya tempat nilai desain hidup |
| Semantik shadcn | `app/globals.css` → `:root` + `@theme inline` | Dipetakan ke primitif, bukan nilai lepas |
| Komponen | `components/**` | Hanya kelas utility. Nol nilai literal |

`tailwind.config.ts` sengaja tetap kosong — Tailwind v4 membaca token dari
CSS, dan dua sumber kebenaran lebih buruk daripada satu.
