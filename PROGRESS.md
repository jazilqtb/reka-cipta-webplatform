# PROGRESS — Ronde Revisi 17 Poin

Berkas ini ditulis ulang setelah TIAP checkpoint supaya pekerjaan bisa
dilanjutkan kalau sesi terputus. Branch: `feature/OPT-CP0-design-system`.

| CP | Isi | Status |
|---|---|---|
| CP0 | Revisi design system (hue, marquee, tipografi) | **SELESAI** |
| CP1 | Beranda: bug interaksi & layout mobile (5A, 5B, 6, 17) | belum |
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
