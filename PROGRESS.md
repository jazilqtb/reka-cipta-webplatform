# PROGRESS — Ronde Revisi 17 Poin

Berkas ini ditulis ulang setelah TIAP checkpoint supaya pekerjaan bisa
dilanjutkan kalau sesi terputus. Branch: `feature/OPT-CP0-design-system`.

| CP | Isi | Status |
|---|---|---|
| CP0 | Revisi design system (hue, marquee, tipografi) | **SELESAI** |
| CP1 | Beranda: bug interaksi & layout mobile (5A, 5B, 6, 17) | **SELESAI** |
| CP2 | Beranda: konten, divider, footer (2A, 7, 8, 9, 10) | **SELESAI** |
| CP3 | CMS hero + statistik dinamis (2, 3) | **SELESAI** |
| CP4 | Tentang Kami + CMS-nya (11) | **SELESAI** |
| CP5 | Halaman publik lain (12, 13) | belum |
| CP6 | Admin: CORS LAN + pembersihan UI (14, 15, 16) | belum |

## CP0 — SELESAI

**A. Hue primary teal → marine (biru laut `#125A8C`).**
- `--color-marine-{700,600,500,200,50}` baru; `--color-teal-*` jadi alias.
- steel disetel ulang ke undertone biru; `info` digeser ke indigo supaya
  tidak tertukar dengan primary.
- 14 pasangan kontrak diukur → semua lolos WCAG AA (paling ketat 4,71:1).
- Bundle CSS: nol `#0b7d6e` / `#0f9184` / `rgba(11,125,110`.
- Logo dijadikan monokrom (placeholder, bukan identitas final).
- DESIGN-SYSTEM §2.1/2.2/2.4 diperbarui + **koreksi premis logo yang keliru**.

**B. Amandemen marquee** → DESIGN-SYSTEM §7.1 + `.marquee-partners` di CSS.
Belum dipakai komponen apa pun; dipasang di CP2 poin 8.

**C. Hierarki tipografi.** Diukur pada halaman ter-render: dua H3 ternyata
36px = persis sebesar H2. Diturunkan ke 22px. Skala global TIDAK dinaikkan.
CredibilitySection `<h3>` judul section → `<h2>`.

**Verifikasi:** tsc bersih · build EXIT=0 · lint 7 (baseline) · nol overflow.

## CP1 — SELESAI

**5A gerak vertikal terkunci.** Diukur: keempat deret melapor
`overflow-y: auto` padahal tak satu pun kelas memintanya — spesifikasi CSS
memaksa sumbu `visible` jadi `auto` begitu sumbu lain `auto`. Ditutup dengan
`overflow-y: hidden` + `touch-action: pan-x pinch-zoom` +
`overscroll-behavior-x: contain`. Murni CSS, nol listener JS.

**5B kartu pertama menempel tepi.** Terukur x=0 vs judul x=16 di keempat
deret. Penyebab BUKAN margin/padding (nilainya identik) melainkan
`scroll-snap-align` yang tidak pernah ada di anak-anaknya. Sesudah: x=16.

**6 font deskripsi.** `.mono-tech` dipakai untuk kalimat di dua tempat.
Sesudah: nol prose bergaya mono (terukur).

**Regresi yang saya perkenalkan sendiri lalu perbaiki:** `.carousel-row`
ditulis tanpa `@layer`, sehingga `display:flex` mengalahkan `md:hidden` dan
carousel ponsel ikut tampil di desktop. Jebakan yang sama sudah menggigit
proyek ini 3x → dicatat sebagai anti-pattern #13.

**17 dua kolom — DILEWATI**, alasan di laporan akhir.

DESIGN-SYSTEM: §4.1 (.carousel-row) + anti-pattern #13, #14.

## CP2 — SELESAI

**2A Madura.** 8 penyebutan di kode dibersihkan (hero, 2 meta description,
pilar kepercayaan, CTA supplier, deskripsi produk, profil perusahaan,
timeline). Terukur: 0 di halaman ter-render.
SISA DI DATABASE (bukan kode, masuk ACTION REQUIRED): 2 artikel + tagline
& deskripsi produk "Garam Kasar Petani Premium".

**7 Bukti & Dokumentasi.** Ponsel: grid 2x2, kalimat detail disembunyikan
lewat CSS (`hidden sm:block`) — TIDAK dihapus dari DOM karena teks itu
satu-satunya tempat di beranda yang menyebut "SNI 3556:2016" dan "Akta
Notaris, NIB, NPWP", dan Google merayapi versi mobile lebih dulu.

**8 Mitra.** Marquee dikembalikan lewat `.marquee-partners` (42s, berhenti
saat hover/focus, mati di reduced-motion, trek ganda -50%). Kalimat penutup
disembunyikan di ponsel, tetap di DOM.

**9 Divider.** 21 pemakaian di 20 berkas. Geometri diganti di dalam
komponen (sisi lurus + garis rambut), API dipertahankan → nol pemanggil
disentuh. Divider daun di CredibilitySection ikut diluruskan.

**10 Footer.** Motif heksagon+garis diganti satu garis rambut.

**BONUS (temuan visual):** 6 kartu sektor punya 6 gradient berbeda, 3 di
antaranya memakai primary sebagai bidang penuh kartu — melanggar §9 (#9)
dan §2.5 sekaligus. Diseragamkan ke satu permukaan steel-900.

Tinggi beranda mobile: 6509px -> 5961px.
DESIGN-SYSTEM: §4.2 (pembatas), anti-pattern #15.

## CP3 — SELESAI

**Tabel baru:** `hero_content` (migrasi 20260821090000, SUDAH di-push ke
Supabase). Singleton dipaksa lewat PK boolean + CHECK. RLS: publik baca,
tulis hanya `public.is_admin()`.

**Editor** `/admin/hero` — pratinjau langsung memakai KELAS YANG SAMA dengan
halaman publik. Tanpa color picker: admin memilih PERAN (Biasa/Tebal/
Miring/Warna utama), bukan nilai. Batas panjang ditegakkan 3 lapis (form,
Server Action, CHECK constraint).

**Statistik** — baseline dari admin + dinamis dari data nyata:
  Jenis Garam   -> COUNT(products WHERE is_active)      [terbukti +5]
  Mitra Aktif   -> COUNT(rfq_leads WHERE status='deal')
  Kota Dilayani -> COUNT(DISTINCT delivery_city, deal)
  Ton Distribusi-> TIDAK DIPETAKAN (dinyatakan "belum ada sumber")

**Uji fungsional end-to-end LULUS:** simpan di admin -> "Hero diperbarui"
-> teks muncul di H1 halaman publik -> dipulihkan.

DESIGN-SYSTEM: §4.3 permukaan CMS + amandemen §3.4 (italic).

## CP4 — SELESAI

**Tabel baru** (migrasi 20260821100000, SUDAH di-push): `about_timeline`,
`about_mission`, `about_team` + kunci `about_vision` di company_settings +
bucket storage `team-photos` (publik, 2MB, jpeg/png/webp).
RLS ketiganya: publik BACA, tulis/hapus hanya `public.is_admin()`.
Di-seed dari constants/company-profile.ts sehingga halaman tidak pernah
kosong; berkas TS itu kini berperan sebagai cadangan saat query gagal.

**/admin/tentang-kami** — satu editor dipakai tiga daftar (struktur
ketiganya identik). Urut naik/turun pakai tombol, BUKAN drag-and-drop:
DnD tidak bisa dioperasikan keyboard tanpa lapisan panjang, dan di ponsel
bertabrakan dengan gerakan menggulir.

**Timeline:** desktop `grid-cols-3` (dipatok ke jumlah entri yang kebetulan
tiga) -> deret geser `.carousel-row`; ponsel lencana tahun 4px dari tepi ->
16px, sejajar judul (terukur).
**Misi:** accordion `<details>` native — 5 item, 1 terbuka, keyboard OK.
**Tim:** foto lama tetap tampil (path diawali '/' = aset lokal), unggahan
baru ke Supabase Storage.

**Bug yang dicegah React Compiler:** versi pertama memutasi prop `row`
langsung. Diperbaiki dengan callback `patch` — bukan sekadar meredam lint.

DESIGN-SYSTEM: §4.4 accordion, §4.5 foto orang, §4.3 diperluas.
