# Optimasi Menyeluruh — Laporan Akhir

**Rentang:** Checkpoint 0 → 7 · **Selesai:** 2026-08-21
**Cakupan:** portal publik + seluruh area admin
**Perubahan:** 79 berkas · +1.584 / −830 baris · 9 commit
**Kontrak desain:** [`/DESIGN-SYSTEM.md`](../DESIGN-SYSTEM.md)

---

## 1. Ran / Skipped / Planned / Manual

| CP | Isi | Status | Bukti |
|---|---|---|---|
| 0 | Sistem desain + token | **Ran** | Bundle CSS di-grep: IBM Plex ada; Fraunces/Space Grotesk/Plus Jakarta nol; `#1bbfaa`/`#52d6c4`/`#c7f2ee` nol; `rgba(11,125,110` nol |
| 1 | Portal publik → sistem desain | **Ran** | 6 halaman × 4 viewport lewat CDP: nol overflow, nol teks <12px |
| 2 | Copywriting publik | **Ran** | Teks ter-render diekstrak di 414px, bukan dibaca dari kode |
| 3 | Inventaris + rangka admin | **Ran** | Login sungguhan; teks <12px 31 → 0; preflight CORS 400 → 200 |
| 4 | Leads & RFQ | **Ran** (lihat catatan) | 1440/720/414; perilaku responsif terkonfirmasi |
| 5 | Sistem artikel + SEO | **Ran** | HTML ter-render 2 artikel: canonical, description, JSON-LD ×2 |
| 6 | Dashboard | **Ran** (premis tak tereproduksi) | Metrik tampil benar dengan sesi admin |
| 7 | Halaman sisa + state | **Ran** | Login, settings, 404 admin diverifikasi visual |
| — | Audit responsif akhir | **Ran** | 8 halaman × 4 viewport = 32 kombinasi, **0 pelanggaran** |
| — | Upload OG image terpisah | **Skipped** | Lihat §6 |
| — | Konsolidasi lucide → Phosphor | **Planned** | Butuh keputusan Jazil, lihat §6 |
| — | Migrasi DB destruktif | **Tidak ada** | Nol perubahan skema sepanjang pekerjaan ini |

**Catatan kejujuran CP4:** wireframe Leads sudah dirombak dari nol pada ronde
sebelumnya. Yang dikerjakan di CP4 adalah penerapan sistem desain + penutupan
cacat, bukan perancangan ulang. Merancang ulang lagi akan jadi churn.

**Catatan kejujuran CP6:** "metrik dashboard tidak muncul" **tidak dapat
direproduksi** — angkanya tampil benar. Yang diperbaiki adalah cacat desain
yang membuat kegagalan mustahil dibedakan dari nol yang sah.

---

## 2. Sistem desain yang ditetapkan

Audit terukur atas 166 berkas menemukan: **92 token warna dalam 6 keluarga**,
**4 typeface**, **4 bobot font**, **11 varian radius**, **17 ukuran heading
arbitrer**, **20 ukuran ikon unik**.

Dua temuan yang menjelaskan keluhan "terasa consumer app":

1. **Dua ramp hijau tumpang tindih.** `brand-teal-*` dan `ink-*` sama-sama
   ramp teal 11 langkah; `salt-*` dan `neutral-*` sama-sama abu sejuk.
   Separuh dari 92 token itu duplikat konseptual.
2. **Ujung terang ramp teal jadi bidang besar.** `#1BBFAA`, `#52D6C4`,
   `#C7F2EE`, `crystal #5FE1CB` — mint bersaturasi tinggi. Warnanya tidak
   salah; luasannya yang salah.

Ditambah **bayangan berwarna**: seluruh `--shadow-*` memakai
`rgba(11,125,110,…)`.

### Palet — 3 keluarga, 28 token

- **Steel** (netral, ±90% permukaan) — abu sejuk ber-undertone teal samar,
  rukun dengan primary tanpa terbaca sebagai warna.
- **Teal** (primary, hemat) — 5 langkah, bukan 11. `#0B7D6E` **dipertahankan
  persis**: itu warna logo, mengubahnya membuat situs berselisih dengan berkas
  cetak dan tanda tangan email yang sudah beredar.
- **Ochre** (aksen, sangat hemat) — 3 langkah, jalur supplier saja.

### Typeface — IBM Plex Sans + Plex Mono

Alasan: dirancang untuk perusahaan industri (nadanya *engineered*, bukan
ramah-startup); angkanya tenang dan punya varian tabular — halaman ini penuh
spesifikasi (NaCl 97%, ≤0,5% air, 25 kg/sak), dan angka yang goyah merusak
kredibilitas lebih cepat daripada warna yang salah; punya saudara monospace
serasi sehingga data teknis tak perlu keluarga kelima.

### Strategi migrasi — menyetel nilai, bukan mengganti nama

Keputusan paling menentukan. Di Tailwind v4, kelas yang tokennya hilang **tidak
menghasilkan CSS dan tidak memunculkan error** — menghapus `--color-ink-700`
akan membuat 142 judul kehilangan warna diam-diam. Kegagalan persis itu pernah
terjadi di proyek ini. Jadi nama lama dipertahankan sebagai alias ke palet
kanonik: 375 pemakaian radius dan 51 pemakaian bobot 700/800 berpindah tanpa
satu berkas komponen disentuh. **Alias dicabut setelah nama kelas diseragamkan.**

---

## 3. Berkas yang diubah, per checkpoint

**CP0** `DESIGN-SYSTEM.md` (baru), `app/globals.css`

**CP1** 41 berkas — seluruh `components/sections/*`, `components/product/*`,
`components/blocks/*`, `components/article/*`, `Navbar`, `Footer`,
`RevealWrapper`. **Dihapus:** `components/decorative/ParallaxBlob.tsx`,
`components/interactive/Magnetic.tsx`

**CP2** `CredibilitySection`, `HowItWorks`, `IndustriesGrid`,
`StagedCTASection`, `app/globals.css`

**CP3** `AdminShell`, `AdminSidebar`, `AdminHeader`, `app/admin/leads/page.tsx`,
`backend/main.py`, + 18 berkas admin (normalisasi ukuran)

**CP4** `LeadDetailView`, `LeadDetailPanel`, `LeadKanbanCard`,
`app/admin/leads/[id]/page.tsx`, `lib/data/product-names.ts` (baru)

**CP5** `app/(public)/artikel/[slug]/page.tsx`, `lib/article-mapper.ts`,
`types/api.ts`, `ArticleForm`, `RichTextEditor`

**CP6** `app/admin/dashboard/page.tsx`

**CP7** `components/admin/ui/AdminState.tsx` (baru), `SettingsForm`,
`LeadDetailView`, `LeadsWorkspace`, `SupplierListView`, `PromptEditor`,
`WATemplateEditor`, `app/(auth)/admin/login/page.tsx`, `HeroCarousel`

---

## 4. Animasi yang dihapus atau diturunkan

| Apa | Di mana | Kenapa |
|---|---|---|
| **Tombol magnetik** (`Magnetic.tsx`) | HeroCarousel | Mouse-tracking. Dan CTA konversi utama yang menghindar dari kursor adalah cacat kegunaan, bukan selera |
| **Parallax blob** (`ParallaxBlob.tsx`) | 8 pemanggil | Parallax dekoratif |
| **Parallax foto hero** | HeroCarousel | Terlewat di CP1 (ditulis inline). Pada foto latar seluruh hero, gerak itu menyeret teks saat pembaca berusaha membacanya |
| **Sorotan gradient pengikut kursor** | ProductCard ×2, ProductHero | Mouse-tracking yang mengubah warna objek |
| **Pulse tak berhingga CTA** | HeroCarousel | Gerak tak berhingga pada elemen yang tidak memuat |
| **Ring berdenyut langkah** | HowItWorks | Sama; diganti ring statis |
| **Marquee logo mitra** | CredibilitySection | Sama; diganti dinding logo statis |
| **Stagger `delay={i*150}`** | 21 pemanggil | Kartu kelima muncul 1 detik setelah section masuk viewport |
| Overshoot 56% `--ease-spring` | Global | Pantulan itu bahasa aplikasi konsumen |
| `translateY(-4px)` + `shadow-lg` | `.card-hover-lift` | Diturunkan ke −2px + `shadow-md` |
| Scale 1.04 + multiply teal 30% | `.photo-teal-hover` | Mengecat ulang wajah orang; diturunkan ke brightness 1.04 |
| Gradient 3-stop latar section | `.bg-brand-gradient`, `.bg-sand-gradient` | Anti-pattern §9 |

**Yang DIPERTAHANKAN dan alasannya:** `skeleton-shimmer 1.4s infinite`
(diizinkan eksplisit §7 — indikator memuat); titik status; indikator carousel;
lingkaran bernomor timeline (penanda simpul, bukan container).

---

## 5. Keputusan besar yang saya ambil sendiri

1. **IBM Plex Sans**, bukan mempertahankan salah satu dari empat typeface yang
   ada. Lihat §2.
2. **Migrasi lewat penyetelan nilai token**, bukan penggantian nama kelas.
   Lihat §2 — ini yang mencegah 142 judul kehilangan warna diam-diam.
3. **Batas stagger ditegakkan di `RevealWrapper`** (`MAX_DELAY_MS = 120`),
   bukan dititipkan ke disiplin 21 pemanggil. Pemanggil ke-22 akan melanggar
   lagi kalau hanya dititipkan.
4. **Target sentuh 44px lewat satu selektor `group/button`**, bukan menyunting
   `components/ui/button.tsx` (beku) dan bukan menambal 20+ pemanggil.
5. **Rangka admin `h-dvh overflow-hidden`.** Keempat belas halaman sudah
   menulis `flex-1 overflow-y-auto` — mereka *mengharapkan* rangka setinggi
   layar. Saya memenuhi asumsi yang sudah ada, bukan memaksakan yang baru.
6. **Angka respons diseragamkan ke 1×24 jam**, bukan ke "hitungan menit" —
   itu angka yang dipakai jalur transaksi sungguhan, tempat janji yang meleset
   paling mahal.
7. **Marquee → dinding logo statis**, bukan sekadar mematikan animasinya:
   tanpa gerak, salinan kedua daftar hanya mengulang nama yang sama dan mask
   gradient hanya menutupi nama yang diam.
8. **`AdminState` bernada tiga** (`empty` / `error` / `missing`), bukan satu.
   Ketiganya berarti hal berbeda dan menuntut jalan keluar berbeda.
9. **Dashboard diisi "RFQ terbaru"**, bukan widget metrik tambahan. Angka
   memberi tahu *ada berapa*; daftar itu memberi tahu *siapa*.
10. **Slug artikel & strategi redirect tidak disentuh** — sudah benar dari
    ronde sebelumnya (dibekukan sejak terbit, slug lama dicatat, redirect 308).

---

## 6. ACTION REQUIRED — daftar periksa untuk Jazil

### Mendesak

- [ ] **Redeploy Railway.** `backend/main.py` berubah (perbaikan CORS). Sampai
      di-rebuild, perbaikan itu belum berlaku di produksi.
- [ ] **Periksa `ALLOWED_ORIGINS` di Railway.** Kalau ditulis dengan spasi
      setelah koma (`https://a.com, https://b.com`), sebelum perbaikan ini
      origin kedua **diblokir diam-diam** — preflight balas 400 dan browser
      hanya bilang "network error". Perbaikannya sudah masuk kode; yang perlu
      Anda lakukan hanya memastikan deploy-nya jalan.
- [ ] **Matikan signup publik di Supabase.** Terverifikasi masih aktif
      (`disable_signup=false`). Masih menggantung sejak audit sebelumnya.
- [ ] **Rotasi `ADMIN_TEST_PASSWORD`.** Sudah dipakai lintas sesi.

### Data produksi (bukan kode — saya sengaja tidak menyentuhnya)

- [ ] **Deskripsi produk "Garam Halus Yodium" berakhir dengan kata `ciba`** —
      teks sampah yang tampil di beranda. Perbaiki lewat `/admin/products`.
- [ ] **Lead uji `wergew` dan `ewrgwerg`** masih ada di produksi, dan sekarang
      jauh lebih terlihat karena daftar leadnya padat.
- [ ] **`meta_description` artikel Rembang kosong.** Sekarang otomatis
      memakai kalimat pembuka artikel — benar, tapi deskripsi yang ditulis
      khusus akan lebih baik.

### Keputusan yang bukan milik saya

- [ ] **Dua pustaka ikon hidup berdampingan:** `lucide-react` (10 berkas) dan
      `@phosphor-icons/react` (56 berkas). Menyatukannya ke Phosphor akan
      *menghapus* satu pustaka, bukan menambah — tapi tetap mengubah tampilan
      ikon di 10 berkas, dan Anda menyatakan ikon di luar cakupan. **Saya tidak
      menyentuhnya.** Kalau Anda setuju, ini pekerjaan sekali jalan.
- [ ] **Upload OG image terpisah belum dibuat.** `og_image_path` ada di DB,
      tapi belum ada alur unggahnya. **Dampaknya kecil**: `og:image` sudah
      benar lewat fallback ke thumbnail — yang hilang hanya kemampuan
      mengoptimalkan rasio 1200×630 secara terpisah dari thumbnail 16:9.
      Butuh endpoint FastAPI baru + UI.
- [ ] **Alias token kompatibilitas** (`brand-teal-*`, `ink-*`, `sand-*`,
      `salt-*`, `neutral-*`, `crystal-*`) masih hidup di `globals.css`.
      Aman selamanya, tapi ronde berikutnya sebaiknya menyeragamkan nama kelas
      di komponen lalu mencabut aliasnya.

### Data untuk copywriting — "(needs data dari Jazil)"

- [ ] **Berapa lama sebenarnya penawaran terkirim?** Beranda sempat
      menjanjikan "hitungan menit" di satu tempat dan "1×24 jam" di tempat
      lain — pada halaman yang sama. Saya seragamkan ke 1×24 jam sebagai
      angka konservatif. Kalau median sebenarnya benar-benar lebih cepat,
      itu keunggulan yang sekarang **tidak** Anda klaim.
- [ ] **Apakah "1×24 jam" itu terukur atau aspiratif?**

### Tidak ada yang menunggu

- **TODO-VERIFY:** nihil. Backend bisa dijalankan lokal, jadi perbaikan CORS
  diverifikasi sungguhan (preflight 400 → 200 dengan `.env` yang sama persis).
- **Migrasi DB destruktif:** nihil. Nol perubahan skema.
- **Aset placeholder:** nihil. Tidak ada aset baru dibuat.

---

## 7. Ringkasan perubahan struktural

**Modul baru (2):**
- `lib/data/product-names.ts` — peta slug→nama produk. Dipisah karena tadinya
  fungsi privat di `app/admin/leads/page.tsx`, sehingga halaman detail tidak
  bisa memakainya dan operator di ponsel membaca slug mentah.
- `components/admin/ui/AdminState.tsx` — satu bentuk untuk 14 keadaan
  kosong/gagal/tidak-ditemukan yang sebelumnya ditulis sendiri-sendiri.

**Modul dihapus (2):** `components/decorative/ParallaxBlob.tsx`,
`components/interactive/Magnetic.tsx` (+ direktori `components/interactive/`)

**Dependensi sirkular:** **0.** Diperiksa terhadap pekerjaan saya sendiri
dengan menelusuri seluruh graf import `@/` di `app/`, `components/`, `lib/`,
`hooks/`, `constants/`, `types/`. Kedua modul baru adalah daun murni — tidak
ada yang mengimpor balik ke pemanggilnya.

**Kontrak API:** `Article.updated_at` ditambahkan ke `types/api.ts`. Kolomnya
sudah ada di tabel sejak migrasi pertama (dengan trigger auto-update) dan sudah
dikirim backend — hanya tidak pernah diteruskan ke kontrak publik. Murni
aditif; tidak ada perubahan Pydantic yang perlu dicerminkan.

---

## Verifikasi akhir

```
tsc --noEmit          bersih
next build            EXIT=0, 26 halaman
eslint                7 masalah — baseline, nol di berkas yang diubah
audit responsif       8 halaman × 4 viewport = 32 kombinasi, 0 pelanggaran
sweep animasi         onMouseMove 0 · clientX 0 · useScroll 0
                      useTransform 0 · useSpring 0 · parallax 0
dependensi sirkular   0
```

### Yang TIDAK diverifikasi

- **Perangkat sungguhan.** Semua audit responsif memakai emulasi Chrome lewat
  CDP. Itu memberi viewport dan `pointer: coarse` yang benar, tapi bukan jempol
  sungguhan di layar sungguhan.
- **Produksi.** Semua verifikasi berjalan di build lokal. Perilaku Vercel +
  Railway belum diperiksa untuk ronde ini.
- **Gejala dashboard yang Anda laporkan.** Tidak dapat direproduksi di sini.
