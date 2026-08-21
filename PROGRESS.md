# PROGRESS — Ronde Revisi 17 Poin

Berkas ini ditulis ulang setelah TIAP checkpoint supaya pekerjaan bisa
dilanjutkan kalau sesi terputus. Branch: `feature/OPT-CP0-design-system`.

| CP | Isi | Status |
|---|---|---|
| CP0 | Revisi design system (hue, marquee, tipografi) | **SELESAI** |
| CP1 | Beranda: bug interaksi & layout mobile (5A, 5B, 6, 17) | **SELESAI** |
| CP2 | Beranda: konten, divider, footer (2A, 7, 8, 9, 10) | belum |
| CP3 | CMS hero + statistik dinamis (2, 3) | belum |
| CP4 | Tentang Kami + CMS-nya (11) | belum |
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
