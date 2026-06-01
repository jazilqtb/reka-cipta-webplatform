# E1-UX-03 — Wireframe Global Footer

**Task:** E1-UX-03  
**Priority:** 🟡 MED  
**Tags:** `Design` · `Frontend`  
**Versi:** 1.0 · Mei 2026  
**Referensi Brand:** Fondasi Brand v1.0 §3.3 (Tagline) · §7.4 (Konsistensi Info Kontak) · PRD §5.1

---

## Prinsip Brand yang Mendasari Desain

| Prinsip | Manifestasi di Footer |
|---|---|
| **Transparansi** | Dokumen legal (badge SNI, NIB) visible di footer — proof point tanpa diminta |
| **Locally Rooted** | Tagline "Garam Lokal, Standar Industri" hadir di kolom logo |
| **Kemitraan Tulus** | Dua kanal kontak WA — kesan tim nyata, bukan nomor hotline anonim |
| **Keandalan** | Info kontak identik dengan yang ada di dokumen legal — konsistensi adalah kepercayaan |

---

## 1. DESKTOP FOOTER (viewport ≥ 768px)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [bg-ink-900 = #0A1E1C]                                                              │
│  [text-neutral-300]                                                                  │
│                                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────────────┐    │
│  │  max-w-7xl mx-auto px-6 pt-12 pb-8                                          │    │
│  │                                                                              │    │
│  │  ┌────────────────────────────────────────────────────────────────────────┐  │    │
│  │  │  grid grid-cols-3 gap-12  ← 3 kolom setara                            │  │    │
│  │  │                                                                        │  │    │
│  │  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐ │  │    │
│  │  │  │  KOLOM 1         │  │  KOLOM 2         │  │  KOLOM 3             │ │  │    │
│  │  │  │  Logo + Tagline  │  │  Navigasi        │  │  Kontak              │ │  │    │
│  │  │  │                  │  │                  │  │                      │ │  │    │
│  │  │  │  🌿 REKA CIPTA   │  │  Navigasi        │  │  Hubungi Kami        │ │  │    │
│  │  │  │     INDONESIA    │  │  ──────────────  │  │  ─────────────────── │ │  │    │
│  │  │  │                  │  │  Beranda         │  │  📍 Jl. Bratang Gede │ │  │    │
│  │  │  │  "Garam Lokal,   │  │  Produk          │  │     III-I No. 16A    │ │  │    │
│  │  │  │   Standar        │  │  Tentang Kami    │  │     Surabaya, Jawa   │ │  │    │
│  │  │  │   Industri."     │  │  Artikel         │  │     Timur            │ │  │    │
│  │  │  │                  │  │  Kalkulator      │  │                      │ │  │    │
│  │  │  │  [tagline italic │  │  Jadi Supplier   │  │  📱 082136096528     │ │  │    │
│  │  │  │   text-sand-400] │  │  Minta Penawaran │  │     (Admin Irwan)    │ │  │    │
│  │  │  │                  │  │                  │  │                      │ │  │    │
│  │  │  │  [text-xs        │  │                  │  │  📱 087839031378     │ │  │    │
│  │  │  │   text-neutral-  │  │                  │  │     (Direktur)       │ │  │    │
│  │  │  │   500 mt-4]      │  │                  │  │                      │ │  │    │
│  │  │  │  Distributor     │  │                  │  │  ✉️ rekaciptaindonesi│ │  │    │
│  │  │  │  garam multi-    │  │                  │  │     aa@gmail.com     │ │  │    │
│  │  │  │  produk SNI      │  │                  │  │                      │ │  │    │
│  │  │  │  untuk industri  │  │                  │  │  [Buka WhatsApp ↗]   │ │  │    │
│  │  │  │  menengah        │  │                  │  │  [CTA text link]     │ │  │    │
│  │  │  │  Indonesia.      │  │                  │  │                      │ │  │    │
│  │  │  └──────────────────┘  └──────────────────┘  └──────────────────────┘ │  │    │
│  │  └────────────────────────────────────────────────────────────────────────┘  │    │
│  │                                                                              │    │
│  │  ┌────────────────────────────────────────────────────────────────────────┐  │    │
│  │  │  border-t border-ink-700  mt-8 pt-6                                   │  │    │
│  │  │  flex items-center justify-between                                     │  │    │
│  │  │                                                                        │  │    │
│  │  │  [KIRI]                              [KANAN]                          │  │    │
│  │  │  ┌──────────────────────────────┐    ┌──────────────────────────────┐ │  │    │
│  │  │  │ [Badge SNI] [Badge NIB]      │    │  © 2025 CV Reka Cipta       │ │  │    │
│  │  │  │ [badge bg-ink-800 rounded    │    │  Indonesia.                 │ │  │    │
│  │  │  │  text-xs text-neutral-400]   │    │  Semua hak dilindungi.      │ │  │    │
│  │  │  └──────────────────────────────┘    └──────────────────────────────┘ │  │    │
│  │  └────────────────────────────────────────────────────────────────────────┘  │    │
│  └──────────────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. MOBILE FOOTER (viewport < 768px) — 1 kolom stacked

```
┌──────────────────────────────────────────────┐
│  [bg-ink-900]                                │
│  max-w-full px-5 pt-10 pb-6                  │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │  flex flex-col gap-8                │    │
│  │                                      │    │
│  │  ── KOLOM 1 — Logo & Tagline ──      │    │
│  │  ┌──────────────────────────────┐   │    │
│  │  │  🌿 REKA CIPTA INDONESIA     │   │    │
│  │  │                              │   │    │
│  │  │  "Garam Lokal,               │   │    │
│  │  │   Standar Industri."         │   │    │
│  │  │  [italic text-sand-400]      │   │    │
│  │  │                              │   │    │
│  │  │  Distributor garam multi-    │   │    │
│  │  │  produk SNI untuk industri   │   │    │
│  │  │  menengah Indonesia.         │   │    │
│  │  └──────────────────────────────┘   │    │
│  │                                      │    │
│  │  ── KOLOM 2 — Navigasi ──            │    │
│  │  ┌──────────────────────────────┐   │    │
│  │  │  Navigasi                    │   │    │
│  │  │  ──────────────────          │   │    │
│  │  │  Beranda                     │   │    │
│  │  │  Produk                      │   │    │
│  │  │  Tentang Kami                │   │    │
│  │  │  Artikel                     │   │    │
│  │  │  Kalkulator                  │   │    │
│  │  │  Jadi Supplier               │   │    │
│  │  │  Minta Penawaran             │   │    │
│  │  └──────────────────────────────┘   │    │
│  │                                      │    │
│  │  ── KOLOM 3 — Kontak ──              │    │
│  │  ┌──────────────────────────────┐   │    │
│  │  │  Hubungi Kami                │   │    │
│  │  │  ──────────────────          │   │    │
│  │  │  📍 Jl. Bratang Gede III-I   │   │    │
│  │  │     No. 16A, Surabaya        │   │    │
│  │  │                              │   │    │
│  │  │  📱 082136096528             │   │    │
│  │  │  📱 087839031378             │   │    │
│  │  │  ✉️ rekaciptaindonesiaa@...  │   │    │
│  │  │                              │   │    │
│  │  │  [Buka WhatsApp ↗]           │   │    │
│  │  └──────────────────────────────┘   │    │
│  │                                      │    │
│  │  ── BOTTOM BAR ──                    │    │
│  │  ┌──────────────────────────────┐   │    │
│  │  │  border-t border-ink-700     │   │    │
│  │  │  pt-5 flex flex-col gap-3    │   │    │
│  │  │                              │   │    │
│  │  │  [Badge SNI]  [Badge NIB]    │   │    │
│  │  │                              │   │    │
│  │  │  © 2025 CV Reka Cipta        │   │    │
│  │  │  Indonesia.                  │   │    │
│  │  └──────────────────────────────┘   │    │
│  └──────────────────────────────────┘    │    │
└──────────────────────────────────────────┘
```

---

## 3. SPESIFIKASI DETAIL

### Container & Background
```
OUTER CONTAINER:
  className: "bg-ink-900"    ← #0A1E1C — dark teal profesional
  Alasan: ink-900 lebih warm daripada pure black — konsisten 
  dengan brand "berakar lokal" bukan corporate dingin

INNER WRAPPER:
  className: "max-w-7xl mx-auto px-6 pt-12 pb-8"
  Mobile: "px-5 pt-10 pb-6"
```

### Kolom 1 — Logo & Tagline
```
LOGO + WORDMARK:
  className: "flex items-center gap-2 mb-4"
  <Image src="/logo-white.svg" alt="Reka Cipta Indonesia" h-8 />
  Wordmark: "text-white font-bold text-base"

TAGLINE:
  Text: "Garam Lokal, Standar Industri."
  className: "text-sand-400 italic text-sm font-medium leading-relaxed mb-3"
  Alasan sand-400: evokes kristal garam & Madura — warm anchor 
  di tengah dark surface

DESKRIPSI SINGKAT:
  className: "text-neutral-500 text-xs leading-relaxed"
  Text: "Distributor garam multi-produk bersertifikasi SNI 
         untuk industri menengah Indonesia. 
         Bermitra dengan petani lokal Madura sejak 2018."
```

### Kolom 2 — Navigasi
```
HEADING:
  Text: "Navigasi"
  className: "text-neutral-300 text-xs font-semibold uppercase 
              tracking-widest mb-4"

DIVIDER:
  className: "w-8 h-px bg-brand-teal-700 mb-4"

NAV LINKS (subset dari navbar — tanpa CTA):
  Items: Beranda · Produk · Tentang Kami · Artikel · 
         Kalkulator · Jadi Supplier · Minta Penawaran

  Item className: "text-neutral-400 text-sm 
                   hover:text-brand-teal-400 
                   transition-colors duration-150 
                   block py-1"
  
  "Minta Penawaran" diberi sedikit aksen:
    className: "text-brand-teal-400 text-sm font-medium 
                hover:text-brand-teal-300 
                block py-1"
```

### Kolom 3 — Kontak
```
HEADING:
  Text: "Hubungi Kami"
  className: "text-neutral-300 text-xs font-semibold uppercase 
              tracking-widest mb-4"

DIVIDER:
  className: "w-8 h-px bg-brand-teal-700 mb-4"

ALAMAT:
  className: "flex items-start gap-2 text-neutral-400 text-sm mb-3"
  Icon: MapPinIcon (Heroicons) w-4 h-4 mt-0.5 text-neutral-500 flex-shrink-0
  Text: "Jl. Bratang Gede III-I No. 16A
         Surabaya, Jawa Timur"

NOMOR WA (×2):
  className: "flex items-center gap-2 text-neutral-400 text-sm mb-2"
  Icon: PhoneIcon w-4 h-4 text-neutral-500
  
  WA 1 (klik → buka WA):
    <a href="https://wa.me/6282136096528" 
       target="_blank" rel="noopener noreferrer"
       className="hover:text-brand-teal-400 transition-colors duration-150">
      082136096528
    </a>

  WA 2:
    <a href="https://wa.me/6287839031378">087839031378</a>

EMAIL:
  className: "flex items-center gap-2 text-neutral-400 text-sm mb-4"
  Icon: EnvelopeIcon w-4 h-4 text-neutral-500
  <a href="mailto:rekaciptaindonesiaa@gmail.com"
     className="hover:text-brand-teal-400 transition-colors duration-150">
    rekaciptaindonesiaa@gmail.com
  </a>

CTA LINK — BUKA WHATSAPP:
  className: "inline-flex items-center gap-1.5 
              text-brand-teal-400 text-sm font-medium 
              hover:text-brand-teal-300 
              transition-colors duration-150"
  Text: "Chat via WhatsApp"
  Icon: ArrowTopRightOnSquareIcon w-3 h-3
  href: "https://wa.me/6282136096528?text=Halo+Reka+Cipta,+saya+ingin+bertanya+tentang..."
```

### Bottom Bar
```
CONTAINER:
  className: "border-t border-ink-700 mt-8 pt-6"
  Desktop: "flex items-center justify-between"
  Mobile: "flex flex-col gap-3"

BADGES KIRI (desktop) / ATAS (mobile):
  <div className="flex items-center gap-2">

  BADGE SNI:
    className: "inline-flex items-center gap-1 
                px-2.5 py-1 rounded-full 
                bg-ink-800 border border-ink-600 
                text-neutral-400 text-xs font-medium"
    Text: "✓ SNI Certified"

  BADGE NIB:
    className: "inline-flex items-center gap-1 
                px-2.5 py-1 rounded-full 
                bg-ink-800 border border-ink-600 
                text-neutral-400 text-xs font-medium"
    Text: "📋 NIB 0280010102479"

COPYRIGHT KANAN (desktop) / BAWAH (mobile):
  className: "text-neutral-500 text-xs"
  Text: "© {new Date().getFullYear()} CV Reka Cipta Indonesia. 
         Semua hak dilindungi."
```

---

## 4. COLOR DECISIONS — Rationale

| Element | Color Token | Hex | Alasan |
|---|---|---|---|
| Footer background | `ink-900` | `#0A1E1C` | Dark teal — profesional, warm, brand-consistent |
| Tagline | `sand-400` | `#C8A06A` | Evokes garam kristal & Madura — warms dark surface |
| Nav links | `neutral-400` | `#9CA3AF` | Readable tapi tidak mendominasi |
| Links hover | `brand-teal-400` | `#1BBFAA` | Brand identity tetap hadir di dark surface |
| Section headings | `neutral-300` | `#D1D5DB` | Sedikit lebih terang dari links — hierarki jelas |
| Dividers | `brand-teal-700` | `#085E52` | Subtle brand color pada dark bg |
| Border bottom bar | `ink-700` | `#173F3A` | Subtle separator — tidak terlalu kontras |
| Badges | `ink-800 / ink-600` | — | Elevated badge, tidak terlalu mencolok tapi terlihat |

---

## 5. RESPONSIVE BEHAVIOR

```
BREAKPOINTS:
  Mobile:  < 768px   → flex flex-col gap-8 (stacked single column)
  Desktop: ≥ 768px   → grid grid-cols-3 gap-12

COLUMN WIDTHS (desktop):
  Kolom 1 (Logo): ~30% — lebih luas untuk breathing room tagline
  Kolom 2 (Nav):  ~25%
  Kolom 3 (Kontak): ~35% — konten paling padat

MOBILE ADJUSTMENTS:
  - Urutan kolom tetap: Logo → Nav → Kontak → Bottom bar
  - Bottom bar: flex-col (badges di atas, copyright di bawah)
  - Padding: px-5 (lebih rapat dari desktop px-6)
```

---

## 6. ACCESSIBILITY

| Requirement | Implementasi |
|---|---|
| Footer landmark | `<footer aria-label="Footer">` |
| Contact links | Text yang deskriptif, bukan hanya angka |
| External links | `target="_blank"` + `rel="noopener noreferrer"` + visual indicator ↗ |
| WA links | `aria-label="Hubungi via WhatsApp 082136096528"` |
| Color contrast | Semua text pada bg-ink-900 memenuhi WCAG AA (ratio ≥ 4.5:1) |
| Heading hierarchy | Kolom headings pakai `<h3>` — tidak skip dari `<h2>` di parent |

---

## 7. CATATAN IMPLEMENTASI

1. **Component:** `/components/layout/Footer.tsx` — Server Component (tidak ada interactivity)
2. **Data source:** Info kontak dari `/constants/company.ts` — satu sumber untuk konsistensi
3. **Logo:** Gunakan versi logo putih `/public/logo-white.svg` untuk dark background
4. **WA link format:** `https://wa.me/62XXX` — gunakan format 62 (kode Indonesia), bukan 0
5. **Year dynamic:** `{new Date().getFullYear()}` bukan hardcode — tidak perlu update manual tiap tahun
6. **Brand alignment:** Tagline "Garam Lokal, Standar Industri" muncul di footer sesuai §7.4 Fondasi Brand

---

*Wireframe E1-UX-03 · CV Reka Cipta Indonesia · Mei 2026*
