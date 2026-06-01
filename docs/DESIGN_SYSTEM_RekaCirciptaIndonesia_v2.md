# Design System & UI Style Guide
## CV Reka Cipta Indonesia — Platform Digital
**Versi 2.0 | Mei 2026 | CONFIDENTIAL**

> **Single source of truth** untuk seluruh keputusan visual dan interaksi platform digital Reka Cipta. AI agent (Claude, Cursor, Copilot) harus menerima dokumen ini sebagai konteks sebelum menghasilkan kode UI apapun. Setiap warna, spasi, animasi, dan interaksi didefinisikan di sini.

> **Changelog v2.0:** Warna dasar diubah dari navy-charcoal + biru menjadi **Brand Teal 600** sebagai primary. Sistem motion diperluas secara masif mencakup state matrix, parallax, scroll animations, image effects, background animations, FLIP layout transitions, dan lebih dari 40 micro-interaction patterns.

---

## Daftar Isi

**BAGIAN I — FONDASI**
1. Filosofi Desain
2. Sistem Warna (Teal-First Palette)
3. Sistem Tipografi
4. Sistem Spasi
5. Border Radius & Elevation
6. Ikonografi

**BAGIAN II — MOTION SYSTEM (EXPANDED)**
7. Motion Philosophy & 12 Laws
8. Motion Token System
9. State Matrix — Semua Komponen
10. Micro-interactions Library
11. Hover Effects System
12. Click & Active Effects
13. Form Animation States
14. Feedback & Loading Animations
15. Scroll-triggered Animations
16. Parallax Scrolling System
17. Route & Page Transitions
18. Layout Transitions (FLIP)
19. Image Effects
20. Progress & Loader Animations
21. Background Animations
22. Text & Counter Effects
23. Reduced Motion & Accessibility

**BAGIAN III — KOMPONEN**
24. Button
25. Form Elements
26. Card
27. Badge & Tag
28. Alert & Toast
29. Navigation (Navbar & Sidebar)
30. Table
31. Modal & Dialog
32. Dropdown Menu

**BAGIAN IV — POLA & SISTEM**
33. Pola CTA
34. Layout & Grid System
35. Dark Mode
36. tailwind.config.ts
37. globals.css
38. Panduan AI Agent

---

## 1. Filosofi Desain

### Koneksi ke Fondasi Brand

| Archetype | Dampak pada Sistem Visual |
|---|---|
| **The Caretaker (Pengayom)** | Teal yang hangat dan hidup sebagai warna utama — lebih manusiawi dari navy korporat. UI memberi ruang, tidak memaksa. Animasi yang tenang, bukan agresif. Whitespace lega. |
| **The Sage (Sang Ahli)** | Motion yang purposeful dan terukur. Setiap animasi punya alasan. Presisi dalam tipografi dan spasi. Data teknis ditampilkan dengan kepercayaan diri. |

### Lima Prinsip Visual

**1. Teal sebagai Identitas, Bukan Dekorasi**
Teal bukan pilihan estetika semata — ia mewakili lautan, tambak garam, dan keterhubungan dengan alam Indonesia. Setiap kemunculan teal harus terasa bermakna.

**2. Motion Mendukung Narasi, Bukan Mengalihkan Perhatian**
Animasi scroll reveal muncul saat pengunjung "menemukan" section baru. Hover memberikan konfirmasi bahwa elemen bisa diklik. Setiap gerakan memiliki cerita.

**3. Kepercayaan Dibangun Melalui Konsistensi Mikro**
Token yang sama di seluruh platform. Hover button yang identik di setiap halaman. Border radius yang tidak berubah-ubah. Konsistensi mikro ini membangun kepercayaan secara subliminal.

**4. Lokal Melalui Pilihan Estetika yang Berani**
Teal yang kaya, Deep Ink yang dalam, dan Warm Sand yang hangat — bukan palet Silicon Valley yang steril. Ini mencerminkan identitas Reka Cipta sebagai entitas Indonesia yang bangga.

**5. Responsif pada Setiap Sentuhan**
Tidak ada "dead zone." Setiap interaksi mendapat feedback visual dalam < 100ms. Pengguna selalu tahu apakah aksinya berhasil.

---

## 2. Sistem Warna — Teal-First Palette

### 2.1 Filosofi Warna Baru

**Teal → PRIMARY BRAND** (sebelumnya: aksen)
Mewakili: lautan Indonesia, tambak garam, keberlanjutan, kepercayaan organik. Teal adalah warna yang secara visual lebih hangat dari navy namun tetap profesional. Lebih unik di kategori B2B Indonesia, menjadi diferensiator visual yang kuat.

**Deep Ink → DARK SURFACES** (sebelumnya: navy-charcoal)
Turunan gelap dari teal yang sangat dalam — bukan hitam murni, bukan navy korporat. Memberikan nuansa depth dan profesionalisme tanpa terasa dingin.

**Warm Sand → ACCENT** (baru)
Warna pasir/kristal garam yang hangat. Melengkapi teal secara komplementer, memberikan warmth pada antarmuka yang berpotensi terlalu "dingin" dengan teal dominan. Terinspirasi dari warna garam murni dan pantai-pantai Madura.

**Neutral Cool Gray → STRUCTURAL** (tidak berubah)
Teks, border, background — tetap cool gray untuk keterbacaan optimal.

### 2.2 Palet Primer — Brand Teal ⭐

Token utama untuk identitas merek, semua CTA, button utama, dan elemen aktif.

```
brand-teal-950: #011210   /* Near-black dengan teal undertone */
brand-teal-900: #042B26   /* Heading pada dark background */
brand-teal-800: #064038   /* H1 besar pada background putih */
brand-teal-700: #085E52   /* Heading, emphasis kuat */
brand-teal-600: #0B7D6E   /* ★ BRAND COLOR UTAMA — REFERENSI PRIMER */
brand-teal-500: #0F9E8B   /* Button primary hover */
brand-teal-400: #1BBFAA   /* Border pada dark background, icon aktif */
brand-teal-300: #52D6C4   /* Highlight, underline aktif */
brand-teal-200: #93E7DC   /* Tint background section */
brand-teal-100: #C7F2EE   /* Background chip/badge mitra */
brand-teal-50:  #E6FAF8   /* Background section yang subtle */
```

### 2.3 Palet Dark — Deep Ink

Menggantikan brand-navy. Untuk dark surfaces, heading text, sidebar background, footer.

```
ink-950: #050F0E   /* Terdalam — hampir hitam dengan teal undertone */
ink-900: #0A1E1C   /* Sidebar, dark navbar, footer background */
ink-800: #102E2B   /* Dark section background */
ink-700: #173F3A   /* ★ REFERENSI DARK — heading pada halaman */
ink-600: #1F5249   /* Active dark element */
ink-500: #296B60   /* Border gelap interaktif */
ink-400: #3D8C80   /* Icon pada dark background */
ink-300: #6DB8AD   /* Teks sekunder pada dark background */
ink-200: #A8D8D3   /* Teks tersier pada dark background */
ink-100: #D4EEEB   /* Background subtle pada dark section */
ink-50:  #EAF6F4   /* Background section sangat subtle */
```

### 2.4 Palet Aksen — Warm Sand ☀️

Terinspirasi kristal garam dan pesisir Madura. Untuk highlights, aksen, badge premium, section petani/supplier.

```
sand-950: #1C1208
sand-900: #2E1E0D
sand-800: #4D3318
sand-700: #6B4B25   /* Rich sand — Judul pada section petani */
sand-600: #8A6535   /* ★ AKSEN UTAMA — Badge, highlight */
sand-500: #A88048   /* Hover state aksen */
sand-400: #C8A06A   /* Border aksen */
sand-300: #E0C49A   /* Tint background hangat */
sand-200: #EEDFC4   /* Background subtle warm */
sand-100: #F6EFE1   /* Background section supplier */
sand-50:  #FAF6EF   /* Background halaman warm variant */
```

### 2.5 Palet Netral — Cool Gray (Tidak Berubah)

```
neutral-950: #0A0B0D
neutral-900: #111827   /* Teks utama (body) */
neutral-800: #1F2937   /* Teks heading sekunder */
neutral-700: #374151   /* Teks body, label form */
neutral-600: #4B5563   /* Teks sekunder, placeholder aktif */
neutral-500: #6B7280   /* Placeholder, disabled text */
neutral-400: #9CA3AF   /* Border default */
neutral-300: #D1D5DB   /* Border subtle, divider */
neutral-200: #E5E7EB   /* Background input, surface subtle */
neutral-100: #F3F4F6   /* Background card, surface */
neutral-50:  #F9FAFB   /* Background halaman */
neutral-0:   #FFFFFF   /* Background kartu dan komponen */
```

### 2.6 Warna Semantik (Disesuaikan)

Karena teal-600 kini menjadi primary, warna success digeser ke emerald yang lebih saturated agar tidak bingung dengan brand color.

#### Success (Berhasil / Deal / Aktif)
```
success-900: #064E3B
success-700: #065F46
success-600: #16A34A   /* ★ Diubah: green-600, lebih distinct dari teal */
success-500: #22C55E   /* Hover */
success-100: #DCFCE7
success-50:  #F0FDF4
```

#### Warning (Perhatian / Overdue)
```
warning-900: #78350F
warning-700: #92400E
warning-600: #D97706   /* Default */
warning-500: #F59E0B   /* Hover */
warning-100: #FEF3C7
warning-50:  #FFFBEB
```

#### Danger/Error (Error / Lost / Kritis)
```
danger-900: #7F1D1D
danger-700: #991B1B
danger-600: #DC2626   /* Default */
danger-500: #EF4444   /* Hover */
danger-100: #FEE2E2
danger-50:  #FEF2F2
```

#### Info (Informasi / Netral)
```
info-900: #1E3A8A
info-700: #1D4ED8
info-600: #3B82F6   /* Default */
info-500: #60A5FA   /* Hover */
info-100: #DBEAFE
info-50:  #EFF6FF
```

### 2.7 Status Lead/Mitra (CRM Admin Panel)

```
status-new:         bg #E6FAF8  border #93E7DC  text #085E52   /* Baru — teal family */
status-contacted:   bg #FFF7ED  border #FED7AA  text #9A3412   /* Dihubungi */
status-sample-sent: bg #EFF6FF  border #BAE6FD  text #1E40AF   /* Sampel Dikirim */
status-negotiation: bg #FDF4FF  border #E9D5FF  text #6B21A8   /* Negosiasi */
status-deal:        bg #F0FDF4  border #BBF7D0  text #14532D   /* Deal ✓ */
status-lost:        bg #FFF1F2  border #FECDD3  text #9F1239   /* Tidak Jadi */
```

### 2.8 Panduan Penggunaan Warna

**DO:**
- Gunakan `brand-teal-600` untuk semua button primary, CTA, dan elemen aktif
- Gunakan `ink-700` untuk heading utama halaman publik (H1, H2)
- Gunakan `sand-600` sebagai aksen pada section supplier/petani dan badge premium
- Gunakan `brand-teal-50` sebagai background section yang perlu brand tint
- Gunakan `neutral-900` untuk body text

**DON'T:**
- Jangan gunakan `brand-teal-600` berdampingan dengan `success-600` tanpa separator — terlalu mirip
- Jangan gunakan `sand` tones untuk elemen yang perlu kontras tinggi dengan text — WCAG akan gagal
- Jangan campur tiga palet brand (teal + ink + sand) dalam satu komponen kecil — pilih maksimal dua
- Jangan gunakan `ink-900` sebagai heading pada background teal — kontras tidak cukup

### 2.9 Kontras & Accessibility

```
/* Kombinasi warna yang LULUS WCAG AA (ratio ≥ 4.5:1) */
brand-teal-600 + white:     ratio 4.62:1 ✓ (tepat AA — gunakan font ≥ 16px bold)
brand-teal-700 + white:     ratio 6.84:1 ✓ (AAA)
brand-teal-800 + white:     ratio 9.12:1 ✓ (AAA)
ink-700 + white:            ratio 8.90:1 ✓ (AAA)
sand-600 + white:           ratio 3.82:1 ✗ (gagal — gunakan sand-700 atau lebih gelap)
sand-700 + white:           ratio 5.61:1 ✓ (AA)

/* Focus ring */
ring-focus: 0 0 0 2px #FFFFFF, 0 0 0 4px #0B7D6E  /* brand-teal-600 */
```

---

## 3. Sistem Tipografi

### 3.1 Font Family

**Primary: Plus Jakarta Sans**
- Import: `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap`
- Fallback: `'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif`

**Monospace: JetBrains Mono** _(kode, nomor sertifikat, nilai teknis)_
- Fallback: `'JetBrains Mono', 'Fira Code', monospace`

### 3.2 Typographic Scale

```
/* Display — hero section */
display-2xl: 72px / 80px / 700 / tracking-tight (-0.025em)
display-xl:  60px / 68px / 700 / tracking-tight (-0.02em)
display-lg:  48px / 56px / 700 / tracking-tight (-0.02em)

/* Heading */
text-4xl: 36px / 44px / 700  /* H1 halaman */
text-3xl: 30px / 38px / 700  /* H1 section */
text-2xl: 24px / 32px / 600  /* H2 */
text-xl:  20px / 28px / 600  /* H3 */
text-lg:  18px / 28px / 500  /* H4, subheading */

/* Body */
text-base: 16px / 24px / 400  /* Body default */
text-sm:   14px / 20px / 400  /* Label, secondary */
text-xs:   12px / 16px / 400  /* Caption, hint */
text-2xs:  10px / 14px / 500  /* Overline, badge micro */
```

### 3.3 Spesifikasi per Konteks (Diperbarui)

#### Halaman Publik (Website)

| Elemen | Size | Weight | Color (Updated) |
|---|---|---|---|
| Hero headline | 48–60px | 700 | ink-700 |
| Hero subheadline | 20px | 400 | neutral-600 |
| Section heading | 36px | 700 | ink-700 |
| Section label (overline) | 12px | 600 | brand-teal-600, UPPERCASE |
| Body paragraph | 16px | 400 | neutral-700 |
| Card title | 18px | 600 | neutral-900 |
| Button text | 14px | 600 | — |
| Form label | 14px | 500 | neutral-700 |
| Badge/tag | 12px | 600 | — |
| Navigation items | 14px | 500 | neutral-700 |
| Nomor lab/sertifikasi | 13px | 400 | neutral-600, font-mono |

#### Admin Panel (CRM)

| Elemen | Size | Weight | Color |
|---|---|---|---|
| Page title | 24px | 600 | neutral-900 |
| Sidebar active nav | 14px | 600 | brand-teal-300 |
| Stat number | 28px | 700 | neutral-900 |
| Table header | 12px | 600 | neutral-500, UPPERCASE |

---

## 4. Sistem Spasi

_(Tidak berubah dari v1.0)_

```
/* Base: 4px grid */
space-1:  4px  | space-2: 8px   | space-3: 12px  | space-4: 16px
space-5:  20px | space-6: 24px  | space-8: 32px  | space-10: 40px
space-12: 48px | space-16: 64px | space-20: 80px | space-24: 96px

/* Section padding vertikal */
section-sm: py-12 (48px) | section-md: py-16 (64px) | section-lg: py-24 (96px)
```

---

## 5. Border Radius & Elevation

### 5.1 Border Radius Scale _(Tidak berubah)_

```
rounded-sm: 4px | rounded: 6px | rounded-md: 8px | rounded-lg: 12px
rounded-xl: 16px | rounded-2xl: 20px | rounded-full: 9999px
```

### 5.2 Shadow / Elevation System (Diperbarui — tinted teal)

Shadow kini menggunakan teal tint sebagai pengganti navy tint, memberikan nuansa yang lebih organik.

```
/* shadow base: rgba(11, 125, 110, X) — brand-teal-600 tinted */

shadow-none: none
shadow-xs:   0 1px 2px rgba(11,125,110,0.05)
shadow-sm:   0 2px 4px rgba(11,125,110,0.06), 0 1px 2px rgba(11,125,110,0.04)
shadow-md:   0 4px 8px rgba(11,125,110,0.08), 0 2px 4px rgba(11,125,110,0.05)
shadow-lg:   0 8px 16px rgba(11,125,110,0.10), 0 4px 8px rgba(11,125,110,0.06)
shadow-xl:   0 16px 32px rgba(11,125,110,0.12), 0 8px 16px rgba(11,125,110,0.08)
shadow-2xl:  0 24px 48px rgba(11,125,110,0.16)

/* Teal glow — digunakan pada CTA hero dan featured elements */
shadow-glow-sm:  0 0 0 3px rgba(11,125,110,0.15)
shadow-glow-md:  0 0 0 6px rgba(11,125,110,0.12), 0 4px 16px rgba(11,125,110,0.15)
shadow-glow-lg:  0 0 0 8px rgba(11,125,110,0.10), 0 8px 32px rgba(11,125,110,0.20)

/* Focus ring — updated ke teal */
ring-focus:       0 0 0 2px #FFFFFF, 0 0 0 4px #0B7D6E
ring-focus-dark:  0 0 0 2px rgba(255,255,255,0.15), 0 0 0 4px #52D6C4
ring-focus-error: 0 0 0 2px #FFFFFF, 0 0 0 4px #DC2626
```

### 5.3 Border (Diperbarui)

```
border-default: 1px solid #E5E7EB        /* neutral-200 */
border-subtle:  1px solid #F3F4F6        /* neutral-100 */
border-medium:  1px solid #D1D5DB        /* neutral-300 */
border-brand:   1px solid #0B7D6E        /* brand-teal-600 */
border-brand-light: 1px solid #C7F2EE   /* brand-teal-100 */
border-error:   1px solid #DC2626        /* danger-600 */
border-sand:    1px solid #C8A06A        /* sand-400 */
```

---

## 6. Ikonografi _(Diperbarui warna referensi)_

Library: **Lucide Icons** (`lucide-react`), stroke-width 1.5px, outline style.

```
/* Warna icon — updated */
Icon navigasi active:  brand-teal-600
Icon navigasi inactive: neutral-500
Icon brand accent:     brand-teal-500
Icon warm accent:      sand-600
Icon destructive:      danger-600
Icon success:          success-600
```

| Fitur | Icon | Fitur | Icon |
|---|---|---|---|
| Dashboard | LayoutDashboard | Produk | Package |
| Leads/RFQ | ClipboardList | Artikel | BookOpen |
| Pipeline | Kanban | Supplier/Petani | Sprout |
| Proposal AI | FileText | Kalkulator | Calculator |
| SNI Badge | BadgeCheck | Dokumen Legal | Shield |
| WhatsApp | MessageCircle | Pengaturan | Settings |
| Pengiriman | Truck | Filter | SlidersHorizontal |
| Download | Download | Upload | Upload |
| Tambah | Plus | Edit | Pencil |
| Hapus | Trash2 | Cari | Search |
| Notifikasi | Bell | Logout | LogOut |
| Bookmark | Bookmark | Share | Share2 |
| Star/Rating | Star | Heart | Heart |


---

# BAGIAN II — MOTION SYSTEM (EXPANDED)

---

## 7. Motion Philosophy & 12 Laws

### 7.1 Filosofi Utama

Motion pada platform Reka Cipta mengikuti tiga prinsip dasar:

**"Feel the salt"** — Gerakan terinspirasi dari alam: gelombang laut yang tenang, butiran garam yang mengalir, angin di atas tambak. Tidak ada gerakan yang kasar atau mengagetkan.

**"Purposeful, not performative"** — Setiap animasi harus menjawab: "Apakah ini membantu pengguna memahami sesuatu?" Jika tidak, animasi itu tidak perlu ada.

**"Speed signals respect"** — Feedback yang cepat (< 150ms) menunjukkan bahwa sistem menghormati waktu pengguna. Animasi yang terlalu lambat terasa seperti sistem sedang membuat pengguna menunggu.

### 7.2 Dua Belas Hukum Motion Reka Cipta

| # | Hukum | Implementasi |
|---|---|---|
| 1 | **Immediacy** | Feedback visual mulai dalam < 50ms setelah interaksi |
| 2 | **Direction** | Elemen yang "masuk" bergerak ke dalam (fade + slide). Yang "keluar" bergerak ke luar |
| 3 | **Gravity** | Elemen jatuh ke bawah saat dismiss (bottom sheet, toast). Muncul dari bawah |
| 4 | **Spring** | Elemen yang diklik "membal" kembali dengan spring easing — terasa haptic |
| 5 | **Stagger** | Grid items muncul berurutan dengan delay 60–80ms antar item |
| 6 | **Continuity** | Element transitions menjaga posisi relative (shared element) |
| 7 | **Focus** | Dimming background saat modal/overlay — pengguna tahu di mana harus fokus |
| 8 | **Choreography** | Elemen di-animate dalam urutan logis: container dulu, konten setelahnya |
| 9 | **Restraint** | Tidak lebih dari 2 elemen bergerak bersamaan dalam satu viewport |
| 10 | **Consistency** | Button hover yang sama di seluruh halaman, selalu — tidak pernah berbeda |
| 11 | **Depth** | Parallax dan shadow memberi ilusi dimensi — layar terasa bukan flat |
| 12 | **Anticipation** | Animasi sedikit "undershoot" sebelum mencapai posisi final (spring) |

---

## 8. Motion Token System

### 8.1 Duration Tokens

```css
:root {
  /* Perubahan state visual */
  --dur-instant:     50ms;   /* Ripple effect, active press */
  --dur-fast:        100ms;  /* Warna hover, border change */
  --dur-normal:      150ms;  /* Shadow, transform kecil */
  --dur-moderate:    200ms;  /* Dropdown open, tooltip */
  --dur-slow:        300ms;  /* Modal, sidebar toggle, page fade */
  --dur-deliberate:  400ms;  /* Page enter, skeleton exit */
  --dur-story:       600ms;  /* Hero reveal, first load */
  --dur-cinematic:   800ms;  /* Parallax shift, background transition */
  --dur-crawl:      1200ms;  /* Background pattern animation cycle */
  --dur-breathe:    3000ms;  /* Pulsing glow, ambient animation */
}
```

### 8.2 Easing Tokens

```css
:root {
  --ease-linear:      linear;
  --ease-in:          cubic-bezier(0.4, 0, 1, 1);
  --ease-out:         cubic-bezier(0, 0, 0.2, 1);       /* Enter — default */
  --ease-in-out:      cubic-bezier(0.4, 0, 0.2, 1);     /* State changes */
  --ease-spring:      cubic-bezier(0.34, 1.56, 0.64, 1); /* Click/haptic feedback */
  --ease-spring-soft: cubic-bezier(0.25, 1.25, 0.5, 1);  /* Softer spring */
  --ease-decelerate:  cubic-bezier(0.0, 0.0, 0.2, 1);   /* Enter screen */
  --ease-accelerate:  cubic-bezier(0.4, 0.0, 1, 1);     /* Exit screen */
  --ease-anticipate:  cubic-bezier(0.36, -0.18, 0.64, 1.56); /* Overshoot */
  --ease-wave:        cubic-bezier(0.45, 0.05, 0.55, 0.95);  /* Oscillation */
}
```

### 8.3 Spring Physics Parameters

Untuk animasi yang menggunakan JavaScript (Framer Motion / react-spring):

```typescript
// Framer Motion spring configs
export const springs = {
  // Responsive — untuk hover dan small interactions
  snappy: {
    type: 'spring',
    stiffness: 500,
    damping: 30,
    mass: 0.8,
  },
  // Natural — untuk card hover dan medium interactions
  natural: {
    type: 'spring',
    stiffness: 300,
    damping: 25,
    mass: 1,
  },
  // Gentle — untuk modal dan large layout changes
  gentle: {
    type: 'spring',
    stiffness: 200,
    damping: 22,
    mass: 1.2,
  },
  // Bouncy — untuk success feedback dan delightful moments
  bouncy: {
    type: 'spring',
    stiffness: 400,
    damping: 15,
    mass: 0.8,
  },
  // Stiff — untuk sliders dan draggable elements
  stiff: {
    type: 'spring',
    stiffness: 700,
    damping: 40,
    mass: 0.5,
  },
}
```

### 8.4 Stagger Configs

```typescript
// Stagger delays untuk grid reveal
export const staggerConfig = {
  // Card grid 3 kolom
  grid3: {
    staggerChildren: 0.07,
    delayChildren: 0.1,
  },
  // List items
  list: {
    staggerChildren: 0.05,
    delayChildren: 0.05,
  },
  // Feature section (lebih dramatis)
  features: {
    staggerChildren: 0.1,
    delayChildren: 0.2,
  },
  // Stat numbers (harus bersamaan)
  stats: {
    staggerChildren: 0.15,
    delayChildren: 0.3,
  },
}
```

---

## 9. State Matrix — Semua Komponen

### 9.1 State Matrix Universal

Setiap elemen interaktif memiliki hingga 10 state. Tidak semua state ada di setiap komponen.

| State | Trigger | Visual Delta | Duration |
|---|---|---|---|
| `rest` | Default | Tampilan standar | — |
| `hover` | Mouse enter | BG/color/shadow shift | 100ms ease-out |
| `focus-visible` | Keyboard Tab | Focus ring double | 100ms ease-out |
| `active` | Mousedown / Tap | Scale down, color darker | 50ms ease-in |
| `loading` | Async action started | Spinner + opacity 75% | 150ms ease-out |
| `success` | Action completed | Green flash + checkmark | 200ms spring |
| `error` | Validation fail | Shake + red border | 300ms ease-in-out |
| `disabled` | Interaction blocked | Opacity 40%, no-events | — |
| `selected` | Item chosen | BG fill + border highlight | 150ms ease-out |
| `indeterminate` | Partial selection | Dash/line mark | 100ms ease-out |
| `dragging` | DnD in progress | Elevated shadow + scale up | 150ms ease-out |
| `drop-target` | Item hovering over | Dashed border pulse | 100ms ease-in-out |

### 9.2 Per-Component State Matrix

#### Button States

```
PRIMARY BUTTON
rest:       bg-teal-600, text-white, shadow-sm
hover:      bg-teal-500, shadow-md, translateY(-1px)  [100ms ease-out]
focus:      ring-focus (teal), outline-none
active:     bg-teal-700, scale(0.97), shadow-xs       [50ms ease-in]
loading:    bg-teal-600 opacity-75, spinner-white, cursor-wait
success:    bg-success-600, CheckIcon scale-in        [200ms spring]
disabled:   opacity-40, cursor-not-allowed, no-events

OUTLINE BUTTON
rest:       border-2 border-teal-600, text-teal-700, bg-transparent
hover:      bg-teal-50, border-teal-500              [100ms]
focus:      ring-focus
active:     bg-teal-100, scale(0.97)                 [50ms]
disabled:   border-neutral-300, text-neutral-400, opacity-50

GHOST BUTTON
rest:       transparent, text-neutral-700
hover:      bg-neutral-100, text-neutral-900         [100ms]
focus:      ring-focus
active:     bg-neutral-200, scale(0.97)              [50ms]

DESTRUCTIVE BUTTON
rest:       bg-danger-600, text-white
hover:      bg-danger-500, shadow-md                 [100ms]
active:     bg-danger-700, scale(0.97)               [50ms]
```

#### Input Field States

```
rest:         border-neutral-300, bg-white, text-neutral-900
hover:        border-neutral-400                               [100ms]
focus:        border-teal-600, ring-focus-teal, bg-white      [150ms]
filled:       border-neutral-300 (tidak berubah dari rest)
valid:        border-success-600, CheckCircle icon muncul     [150ms spring]
invalid:      border-danger-600, bg-danger-50, shake anim     [300ms]
disabled:     bg-neutral-50, border-neutral-200, cursor-not-allowed
readonly:     bg-neutral-50, border-dashed, cursor-default
```

#### Card States

```
rest:        bg-white, border-neutral-200, shadow-sm
hover:       shadow-md, translateY(-2px), border-neutral-300  [150ms ease-out]
active:      translateY(0), shadow-xs, scale(0.995)           [50ms ease-in]
selected:    border-teal-600 (2px), bg-teal-50, shadow-glow-sm [150ms]
loading:     skeleton shimmer overlay
error:       border-danger-200, bg-danger-50
```

#### Checkbox States

```
rest (unchecked):  border-neutral-300, bg-white (16x16px, r4px)
hover (unchecked): border-teal-400, bg-teal-50                [100ms]
focus:             ring-focus
checked:           bg-teal-600, border-teal-600, checkmark draw [150ms ease-out]
hover (checked):   bg-teal-500                                 [100ms]
indeterminate:     bg-teal-600, dash/minus icon               [150ms]
disabled:          bg-neutral-100, border-neutral-300, opacity-60
```

#### Table Row States

```
rest:       bg-white, border-b border-neutral-100
hover:      bg-neutral-50, transition all 100ms
selected:   bg-teal-50, border-l-3 border-teal-600
active (click): bg-teal-100 flash [50ms] → bg-teal-50
overdue-3d: bg-warning-50, border-l-3 border-warning-500
overdue-7d: bg-danger-50, border-l-3 border-danger-600
```

#### Kanban Card States

```
rest:      bg-white, rounded-lg, shadow-sm, border-neutral-200
hover:     shadow-md, translateY(-2px)                [150ms]
dragging:  scale(1.03), shadow-xl, rotate(1.5deg), z-50, cursor-grabbing [100ms spring]
drag-over: border-dashed border-teal-400, bg-teal-50  [100ms]
drop:      scale(1) rotate(0), shadow-sm, bg-white    [300ms spring]
```

---

## 10. Micro-interactions Library

### 10.1 Checkbox Check Animation

```css
/* SVG path di-animate dengan stroke-dashoffset */
.checkbox-track {
  transition: background-color 100ms ease, border-color 100ms ease;
}

.checkbox-check {
  stroke-dasharray: 18;
  stroke-dashoffset: 18;
  transition: stroke-dashoffset 160ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.checkbox-check.is-checked {
  stroke-dashoffset: 0;
}

/* Background fill bersamaan dengan check draw */
.checkbox-bg.is-checked {
  animation: checkbox-fill 100ms ease forwards;
}
@keyframes checkbox-fill {
  from { transform: scale(0.8); }
  to   { transform: scale(1); }
}
```

### 10.2 Toggle / Switch

```css
.toggle-track {
  width: 40px; height: 22px;
  border-radius: 11px;
  background: #D1D5DB; /* neutral-300 */
  transition: background-color 150ms cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
}

.toggle-track.is-on {
  background: #0B7D6E; /* brand-teal-600 */
}

.toggle-thumb {
  width: 18px; height: 18px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  transform: translateX(2px);
  transition: transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toggle-track.is-on .toggle-thumb {
  transform: translateX(20px);
}

/* Hover: track lebar sedikit (breathing effect) */
.toggle-track:hover {
  box-shadow: 0 0 0 3px rgba(11,125,110,0.15);
}
```

### 10.3 Radio Button Selection

```css
.radio-outer {
  width: 18px; height: 18px;
  border-radius: 50%;
  border: 2px solid #D1D5DB;
  transition: border-color 100ms ease, box-shadow 100ms ease;
}

.radio-inner {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #0B7D6E; /* teal-600 */
  transform: scale(0);
  transition: transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1);
  margin: auto;
}

.radio-outer.is-selected {
  border-color: #0B7D6E;
}

.radio-outer.is-selected .radio-inner {
  transform: scale(1);
}
```

### 10.4 Accordion / Collapsible

```css
.accordion-header {
  cursor: pointer;
  user-select: none;
}

.accordion-icon {
  transition: transform 200ms cubic-bezier(0, 0, 0.2, 1);
}

.accordion-header.is-open .accordion-icon {
  transform: rotate(180deg);
}

/* Height animation menggunakan CSS grid trick */
.accordion-body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 250ms cubic-bezier(0, 0, 0.2, 1);
}

.accordion-body.is-open {
  grid-template-rows: 1fr;
}

.accordion-inner {
  overflow: hidden;
}
```

### 10.5 Select / Dropdown Trigger

```css
.select-chevron {
  transition: transform 200ms cubic-bezier(0, 0, 0.2, 1),
              color 100ms ease;
}

.select-trigger.is-open .select-chevron {
  transform: rotate(180deg);
  color: #0B7D6E; /* teal-600 saat open */
}

.select-trigger {
  transition: border-color 100ms ease, box-shadow 100ms ease;
}

.select-trigger.is-open {
  border-color: #0B7D6E;
  box-shadow: var(--ring-focus);
}
```

### 10.6 Tabs Switching

```css
/* Animated indicator — underline slide */
.tabs-indicator {
  position: absolute;
  bottom: 0;
  height: 2px;
  background: #0B7D6E; /* teal-600 */
  border-radius: 2px;
  transition: left 200ms cubic-bezier(0.4, 0, 0.2, 1),
              width 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-item {
  color: #6B7280; /* neutral-500 */
  transition: color 150ms ease;
}

.tab-item.is-active {
  color: #085E52; /* teal-700 */
  font-weight: 600;
}

/* Tab content crossfade */
.tab-panel {
  animation: tab-fade-in 200ms ease-out both;
}

@keyframes tab-fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### 10.7 Copy to Clipboard

```css
.copy-btn {
  position: relative;
  overflow: hidden;
}

.copy-icon, .check-icon {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  transition: opacity 150ms ease, transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.check-icon {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.6);
  color: #16A34A; /* success-600 */
}

.copy-btn.is-copied .copy-icon {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.6);
}

.copy-btn.is-copied .check-icon {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}
```

### 10.8 Star Rating Micro-interaction

```css
.star {
  cursor: pointer;
  transition: transform 100ms cubic-bezier(0.34, 1.56, 0.64, 1),
              color 100ms ease;
  color: #D1D5DB; /* neutral-300 */
}

.star:hover,
.star.is-filled {
  color: #F59E0B; /* warning-500 — amber/gold */
  transform: scale(1.2);
}

.star.is-filled {
  animation: star-pop 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes star-pop {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.3); }
  100% { transform: scale(1.15); }
}
```

### 10.9 Number Input Increment/Decrement

```css
/* Saat nilai naik, angka "flip" ke atas */
@keyframes number-up {
  from { transform: translateY(4px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}

/* Saat nilai turun, angka "flip" ke bawah */
@keyframes number-down {
  from { transform: translateY(-4px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}

.number-value.animating-up   { animation: number-up 150ms ease-out; }
.number-value.animating-down { animation: number-down 150ms ease-out; }

/* Tombol +/- */
.inc-dec-btn:active {
  transform: scale(0.85);
  transition: transform 50ms ease-in;
}
```

### 10.10 File Upload / Drag & Drop

```css
.dropzone {
  border: 2px dashed #D1D5DB;
  border-radius: 12px;
  transition: border-color 150ms ease,
              background-color 150ms ease,
              transform 150ms ease;
}

.dropzone:hover {
  border-color: #0B7D6E; /* teal-600 */
  background: #E6FAF8;   /* teal-50 */
}

.dropzone.drag-active {
  border-color: #0B7D6E;
  background: #C7F2EE; /* teal-100 */
  transform: scale(1.01);
  box-shadow: 0 0 0 4px rgba(11,125,110,0.15);
}

/* Icon dalam dropzone */
.dropzone-icon {
  transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1),
              color 150ms ease;
}

.dropzone.drag-active .dropzone-icon {
  transform: translateY(-4px) scale(1.1);
  color: #0B7D6E;
}

/* Upload progress fill */
.upload-progress-track {
  background: #E6FAF8;
  border-radius: 9999px;
  overflow: hidden;
}

.upload-progress-fill {
  background: linear-gradient(90deg, #0B7D6E, #0F9E8B);
  border-radius: 9999px;
  height: 100%;
  transition: width 200ms ease-out;
}
```

### 10.11 Stepper (Multi-step Form)

```css
/* Step connector line */
.step-connector {
  height: 2px;
  background: #E5E7EB; /* neutral-200 */
  flex: 1;
  transition: background-color 400ms ease;
}

.step-connector.is-completed {
  background: #0B7D6E; /* teal-600 */
}

/* Step circle */
.step-circle {
  width: 36px; height: 36px;
  border-radius: 50%;
  border: 2px solid #D1D5DB;
  background: white;
  display: flex; align-items: center; justify-content: center;
  transition: all 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.step-circle.is-active {
  border-color: #0B7D6E;
  background: #0B7D6E;
  color: white;
  box-shadow: 0 0 0 4px rgba(11,125,110,0.2);
}

.step-circle.is-completed {
  border-color: #0B7D6E;
  background: #0B7D6E;
  color: white;
  /* checkmark SVG menggantikan nomor */
}

/* Number/check crossfade saat step complete */
.step-number { transition: opacity 150ms ease, transform 150ms ease; }
.step-check  { transition: opacity 150ms ease, transform 150ms ease; opacity: 0; }
.step-circle.is-completed .step-number { opacity: 0; transform: scale(0.5); }
.step-circle.is-completed .step-check  { opacity: 1; transform: scale(1); }
```

### 10.12 Tooltip Reveal

```css
.tooltip {
  pointer-events: none;
  opacity: 0;
  transform: translateY(4px) scale(0.95);
  transform-origin: top center;
  transition: opacity 150ms ease,
              transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tooltip-trigger:hover .tooltip,
.tooltip-trigger:focus-visible .tooltip {
  opacity: 1;
  transform: translateY(0) scale(1);
  transition-delay: 200ms; /* Delay sebelum muncul — mencegah flicker */
}
```

### 10.13 Notification Bell Shake

```css
/* Saat ada notifikasi baru */
@keyframes bell-ring {
  0%   { transform: rotate(0deg); }
  10%  { transform: rotate(15deg); }
  20%  { transform: rotate(-12deg); }
  30%  { transform: rotate(10deg); }
  40%  { transform: rotate(-8deg); }
  50%  { transform: rotate(6deg); }
  60%  { transform: rotate(-4deg); }
  70%  { transform: rotate(2deg); }
  100% { transform: rotate(0deg); }
}

.bell-icon.has-notification {
  animation: bell-ring 600ms cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  transform-origin: top center;
}

/* Badge pulse */
.notification-badge {
  animation: badge-pulse 2s ease-in-out infinite;
}

@keyframes badge-pulse {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.15); }
}
```

---

## 11. Hover Effects System

### 11.1 Navigation Hover

```css
/* Navbar item */
.nav-link {
  position: relative;
  color: #4B5563; /* neutral-600 */
  transition: color 100ms ease;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -2px; left: 0; right: 0;
  height: 2px;
  background: #0B7D6E; /* teal-600 */
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 2px;
}

.nav-link:hover {
  color: #085E52; /* teal-700 */
}

.nav-link:hover::after,
.nav-link.is-active::after {
  transform: scaleX(1);
}

/* Sidebar item */
.sidebar-item {
  border-radius: 8px;
  transition: background-color 100ms ease, color 100ms ease;
}

.sidebar-item:hover {
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.95);
}
```

### 11.2 Card Hover Effects (4 Varian)

```css
/* Varian 1: Lift (default — digunakan produk, lead card) */
.card-hover-lift {
  transition: transform 200ms var(--ease-out),
              box-shadow 200ms var(--ease-out),
              border-color 200ms var(--ease-out);
}
.card-hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(11,125,110,0.10), 0 4px 8px rgba(11,125,110,0.06);
  border-color: #93E7DC; /* teal-200 */
}

/* Varian 2: Glow (digunakan untuk featured/highlight card) */
.card-hover-glow {
  transition: box-shadow 300ms ease;
}
.card-hover-glow:hover {
  box-shadow: 0 0 0 2px #0B7D6E,
              0 8px 24px rgba(11,125,110,0.20);
}

/* Varian 3: Scale (digunakan untuk product card yang compact) */
.card-hover-scale {
  transition: transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.card-hover-scale:hover {
  transform: scale(1.02);
}

/* Varian 4: Reveal (CTA atau info tersembunyi muncul) */
.card-hover-reveal .card-cta {
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 200ms ease,
              transform 200ms var(--ease-out);
}
.card-hover-reveal:hover .card-cta {
  opacity: 1;
  transform: translateY(0);
}
```

### 11.3 Link Hover Animation

```css
/* Underline draw dari kiri ke kanan */
.link-animated {
  position: relative;
  color: #0B7D6E; /* teal-600 */
  text-decoration: none;
}

.link-animated::after {
  content: '';
  position: absolute;
  bottom: -1px; left: 0;
  width: 100%; height: 1.5px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 200ms ease;
}

.link-animated:hover::after {
  transform: scaleX(1);
  transform-origin: left;
}

/* Arrow slide right */
.link-arrow .arrow-icon {
  transform: translateX(0);
  transition: transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1);
  display: inline-block;
}

.link-arrow:hover .arrow-icon {
  transform: translateX(4px);
}
```

### 11.4 Icon Button Hover

```css
.icon-btn {
  border-radius: 8px;
  padding: 8px;
  color: #6B7280; /* neutral-500 */
  transition: background-color 100ms ease,
              color 100ms ease,
              transform 100ms ease;
}

.icon-btn:hover {
  background: #E6FAF8; /* teal-50 */
  color: #0B7D6E;       /* teal-600 */
}

.icon-btn:hover .icon {
  transform: scale(1.1);
}

/* Destructive icon btn */
.icon-btn-danger:hover {
  background: #FEF2F2; /* danger-50 */
  color: #DC2626;       /* danger-600 */
}
```

---

## 12. Click & Active Effects

### 12.1 Ripple Effect (Material-style)

```css
.ripple-container {
  position: relative;
  overflow: hidden;
}

.ripple-effect {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: scale(0);
  animation: ripple-expand 500ms cubic-bezier(0, 0, 0.2, 1) forwards;
  pointer-events: none;
}

@keyframes ripple-expand {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
```

```typescript
// JavaScript untuk mengukur posisi klik dan membuat ripple
function createRipple(event: React.MouseEvent<HTMLElement>) {
  const button = event.currentTarget;
  const circle = document.createElement('span');
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
  circle.style.top  = `${event.clientY - button.offsetTop - radius}px`;
  circle.classList.add('ripple-effect');

  button.appendChild(circle);
  setTimeout(() => circle.remove(), 600);
}
```

### 12.2 Press / Scale Down

```css
/* Global: semua button */
.btn:active {
  transform: scale(0.97);
  transition: transform 50ms ease-in;
}

/* Card clickable */
.card-clickable:active {
  transform: translateY(0) scale(0.99);
  box-shadow: 0 1px 2px rgba(11,125,110,0.05);
  transition: all 50ms ease-in;
}

/* Icon button */
.icon-btn:active {
  transform: scale(0.88);
  transition: transform 50ms ease-in;
}

/* Tailwind implementation: */
/* class="active:scale-[0.97] active:transition-none" */
```

### 12.3 Color Flash Feedback

```css
/* Flash hijau saat aksi sukses */
@keyframes success-flash {
  0%   { background-color: inherit; }
  25%  { background-color: #DCFCE7; } /* success-100 */
  100% { background-color: inherit; }
}

.success-flash {
  animation: success-flash 600ms ease-out;
}

/* Flash merah saat error */
@keyframes error-flash {
  0%   { background-color: inherit; }
  25%  { background-color: #FEE2E2; } /* danger-100 */
  100% { background-color: inherit; }
}

.error-flash {
  animation: error-flash 600ms ease-out;
}
```

---

## 13. Form Animation States

### 13.1 Floating Label

```css
/* Label mengapung saat input di-focus atau terisi */
.form-group {
  position: relative;
  padding-top: 20px; /* Ruang untuk label mengapung */
}

.floating-label {
  position: absolute;
  top: 28px;
  left: 14px;
  color: #9CA3AF; /* neutral-400 */
  font-size: 14px;
  font-weight: 400;
  pointer-events: none;
  transition: top 150ms ease,
              font-size 150ms ease,
              color 150ms ease,
              font-weight 150ms ease;
  transform-origin: left;
}

.form-group:focus-within .floating-label,
.form-group.is-filled .floating-label {
  top: 4px;
  font-size: 11px;
  font-weight: 500;
  color: #0B7D6E; /* teal-600 */
  letter-spacing: 0.02em;
}
```

### 13.2 Shake Animation (Validasi Error)

```css
@keyframes form-shake {
  0%, 100% { transform: translateX(0); }
  10%, 50%, 90% { transform: translateX(-5px); }
  30%, 70% { transform: translateX(5px); }
}

.input-error {
  animation: form-shake 400ms cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  border-color: #DC2626 !important;
  background-color: #FEF2F2;
}

/* Error message slide in */
.error-message {
  opacity: 0;
  transform: translateY(-4px);
  animation: error-reveal 200ms ease-out 50ms both;
}

@keyframes error-reveal {
  to { opacity: 1; transform: translateY(0); }
}
```

### 13.3 Success Validation

```css
/* Input berhasil divalidasi */
.input-success {
  border-color: #16A34A; /* success-600 */
  background: white;
  transition: border-color 150ms ease;
}

.input-success-icon {
  opacity: 0;
  transform: scale(0.5) rotate(-20deg);
  animation: check-appear 250ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes check-appear {
  to { opacity: 1; transform: scale(1) rotate(0deg); }
}
```

### 13.4 Password Strength Meter

```css
.strength-bar-track {
  height: 4px;
  border-radius: 9999px;
  background: #E5E7EB; /* neutral-200 */
  overflow: hidden;
}

.strength-bar-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 300ms ease, background-color 300ms ease;
}

.strength-0 { width: 0%; }
.strength-1 { width: 25%; background: #DC2626; }  /* danger-600 */
.strength-2 { width: 50%; background: #D97706; }  /* warning-600 */
.strength-3 { width: 75%; background: #CA8A04; }  /* yellow */
.strength-4 { width: 100%; background: #16A34A; } /* success-600 */

/* Label teks */
.strength-label {
  transition: color 300ms ease;
  font-size: 12px; font-weight: 500;
}
```

### 13.5 Character Counter

```css
.char-counter {
  font-size: 11px;
  color: #9CA3AF; /* neutral-400 */
  transition: color 150ms ease;
}

.char-counter.is-warning { color: #D97706; } /* 80%+ */
.char-counter.is-danger  { color: #DC2626; } /* 100% */

/* Bounce saat mendekati limit */
.char-counter.is-limit-reached {
  animation: char-bounce 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes char-bounce {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.2); }
}
```

### 13.6 Form Submit Sequence

```css
/* Step 1: Button berubah loading */
/* Step 2: Seluruh form overlay dengan shimmer */
.form-submitting {
  position: relative;
  pointer-events: none;
}

.form-submitting::after {
  content: '';
  position: absolute; inset: 0;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(1px);
  border-radius: inherit;
  animation: form-overlay-in 200ms ease;
}

/* Step 3: Success state — form collapse, success message expand */
.form-success-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  animation: success-reveal 400ms cubic-bezier(0, 0, 0.2, 1);
}

@keyframes success-reveal {
  from { opacity: 0; transform: translateY(16px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* Checkmark circle animation */
.success-circle {
  width: 64px; height: 64px;
  border-radius: 50%;
  background: #16A34A;
  animation: circle-pop 400ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes circle-pop {
  0%   { transform: scale(0); opacity: 0; }
  70%  { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}
```

---

## 14. Feedback & Loading Animations

### 14.1 Skeleton Loading System

```css
/* Shimmer base */
@keyframes skeleton-shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: calc(400px + 100%) 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #F3F4F6 25%,
    #E5E7EB 37%,
    #F3F4F6 63%
  );
  background-size: 400px 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
  border-radius: 6px;
}

/* Teal-tinted skeleton (untuk background teal) */
.skeleton-teal {
  background: linear-gradient(
    90deg,
    #C7F2EE 25%,
    #93E7DC 37%,
    #C7F2EE 63%
  );
  background-size: 400px 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
}

/* Skeleton Shapes */
.skeleton-text     { height: 14px; width: 100%; }
.skeleton-text-sm  { height: 12px; width: 70%; }
.skeleton-title    { height: 24px; width: 50%; }
.skeleton-circle   { border-radius: 50%; }
.skeleton-badge    { height: 22px; width: 64px; border-radius: 9999px; }
.skeleton-button   { height: 40px; border-radius: 8px; }
.skeleton-card     { height: 200px; border-radius: 12px; }
.skeleton-avatar   { width: 40px; height: 40px; border-radius: 50%; }
```

### 14.2 Spinner Types

```css
/* Type 1: Border spinner (default dalam button) */
@keyframes spin { to { transform: rotate(360deg); } }

.spinner {
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
}

.spinner-dark {
  border-color: rgba(11,125,110,0.2);
  border-top-color: #0B7D6E;
}

.spinner-sm { width: 14px; height: 14px; border-width: 1.5px; }
.spinner-lg { width: 24px; height: 24px; border-width: 2.5px; }
.spinner-xl { width: 36px; height: 36px; border-width: 3px; }

/* Type 2: Dot pulse (untuk loading state ringan) */
@keyframes dot-bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40%            { transform: scale(1.0); opacity: 1; }
}

.dot-pulse { display: flex; gap: 4px; align-items: center; }
.dot-pulse span {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #0B7D6E;
  animation: dot-bounce 1.2s ease-in-out infinite;
}
.dot-pulse span:nth-child(2) { animation-delay: 0.2s; }
.dot-pulse span:nth-child(3) { animation-delay: 0.4s; }

/* Type 3: Line dash (untuk full-page loading) */
@keyframes line-stretch {
  0%   { left: 0; width: 10%; }
  50%  { left: 30%; width: 60%; }
  100% { left: 100%; width: 10%; }
}

.line-loader {
  height: 3px;
  background: #E6FAF8;
  position: relative; overflow: hidden;
}

.line-loader::after {
  content: '';
  position: absolute;
  height: 100%;
  background: linear-gradient(90deg, #0B7D6E, #0F9E8B);
  border-radius: 9999px;
  animation: line-stretch 1.4s ease-in-out infinite;
}
```

### 14.3 Progress Bar Types

```css
/* Type 1: Linear deterministic */
.progress-track {
  height: 8px;
  background: #E6FAF8; /* teal-50 */
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #0B7D6E 0%, #1BBFAA 100%);
  border-radius: 9999px;
  transition: width 400ms cubic-bezier(0, 0, 0.2, 1);
  position: relative;
}

/* Shimmer overlay pada progress fill */
.progress-fill::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
  animation: progress-sheen 1.5s ease-in-out infinite;
}

@keyframes progress-sheen {
  from { transform: translateX(-100%); }
  to   { transform: translateX(100%); }
}

/* Type 2: Linear indeterminate */
@keyframes indeterminate {
  0%   { left: -35%; right: 100%; }
  60%  { left: 100%; right: -90%; }
  100% { left: 100%; right: -90%; }
}

.progress-indeterminate {
  height: 4px;
  background: #E6FAF8;
  position: relative; overflow: hidden;
}

.progress-indeterminate::after {
  content: '';
  position: absolute; top: 0; bottom: 0;
  background: linear-gradient(90deg, #0B7D6E, #1BBFAA);
  animation: indeterminate 2s ease-in-out infinite;
}

/* Type 3: Circular progress */
.circular-progress {
  width: 48px; height: 48px;
  border-radius: 50%;
  background: conic-gradient(
    #0B7D6E calc(var(--progress, 0) * 1%),
    #E6FAF8 0
  );
  transition: background 400ms ease;
}

/* Type 4: Stepped progress (wizard form) */
.step-progress {
  display: flex; gap: 4px;
}

.step-segment {
  flex: 1;
  height: 4px;
  border-radius: 9999px;
  background: #E5E7EB; /* neutral-200 */
  transition: background-color 300ms ease;
}

.step-segment.is-done {
  background: #0B7D6E;
}
```

### 14.4 Empty State Animation

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 64px 32px;
  animation: empty-reveal 400ms cubic-bezier(0, 0, 0.2, 1) both;
}

@keyframes empty-reveal {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Icon gentle float */
.empty-icon {
  color: #D1D5DB; /* neutral-300 */
  animation: icon-float 3s ease-in-out infinite;
}

@keyframes icon-float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-6px); }
}
```

---

## 15. Scroll-triggered Animations

### 15.1 Intersection Observer — Implementasi

```typescript
// hooks/useScrollReveal.ts
import { useEffect, useRef } from 'react'

interface RevealOptions {
  threshold?: number    // 0-1, berapa persen elemen terlihat sebelum trigger
  rootMargin?: string   // Margin sebelum masuk viewport
  once?: boolean        // Trigger sekali atau setiap kali masuk viewport
}

export function useScrollReveal(options: RevealOptions = {}) {
  const {
    threshold = 0.15,
    rootMargin = '0px 0px -60px 0px', // Trigger 60px sebelum masuk viewport
    once = true,
  } = options

  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible')
          if (once) observer.unobserve(el)
        } else if (!once) {
          el.classList.remove('is-visible')
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin, once])

  return ref
}
```

### 15.2 Reveal Animation Library

```css
/* Base state — semua elemen reveal dimulai tersembunyi */
.reveal,
.reveal-up,
.reveal-down,
.reveal-left,
.reveal-right,
.reveal-scale,
.reveal-blur {
  opacity: 0;
  transition-property: opacity, transform, filter;
  transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
}

/* Reveal Up (paling umum digunakan) */
.reveal-up    { transform: translateY(32px); transition-duration: 500ms; }
.reveal-down  { transform: translateY(-20px); transition-duration: 400ms; }
.reveal-left  { transform: translateX(32px); transition-duration: 400ms; }
.reveal-right { transform: translateX(-32px); transition-duration: 400ms; }
.reveal-scale { transform: scale(0.92); transition-duration: 400ms; }
.reveal-blur  { transform: translateY(16px); filter: blur(4px); transition-duration: 500ms; }

/* Active state (ditambahkan oleh IntersectionObserver) */
.reveal.is-visible,
.reveal-up.is-visible,
.reveal-down.is-visible,
.reveal-left.is-visible,
.reveal-right.is-visible,
.reveal-scale.is-visible,
.reveal-blur.is-visible {
  opacity: 1;
  transform: none;
  filter: none;
}

/* Stagger delays untuk children dalam container */
.reveal-stagger > *:nth-child(1)  { transition-delay: 0ms; }
.reveal-stagger > *:nth-child(2)  { transition-delay: 70ms; }
.reveal-stagger > *:nth-child(3)  { transition-delay: 140ms; }
.reveal-stagger > *:nth-child(4)  { transition-delay: 210ms; }
.reveal-stagger > *:nth-child(5)  { transition-delay: 280ms; }
.reveal-stagger > *:nth-child(6)  { transition-delay: 350ms; }

/* Section headline reveal dengan word-by-word */
.reveal-words span {
  display: inline-block;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 400ms ease, transform 400ms cubic-bezier(0, 0, 0.2, 1);
}

.reveal-words.is-visible span:nth-child(1) { opacity: 1; transform: none; transition-delay: 0ms; }
.reveal-words.is-visible span:nth-child(2) { opacity: 1; transform: none; transition-delay: 60ms; }
.reveal-words.is-visible span:nth-child(3) { opacity: 1; transform: none; transition-delay: 120ms; }
```

### 15.3 Number Counter (Stat Animation)

```typescript
// components/AnimatedCounter.tsx
import { useEffect, useRef, useState } from 'react'
import { useScrollReveal } from '@/hooks/useScrollReveal'

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

interface Props {
  target: number
  duration?: number  // ms
  prefix?: string    // "Rp", "$", dll
  suffix?: string    // "+", " ton", dll
  decimals?: number
}

export function AnimatedCounter({
  target, duration = 1500, prefix = '', suffix = '', decimals = 0
}: Props) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return
    let start: number | null = null

    const animate = (timestamp: number) => {
      if (!start) start = timestamp
      const elapsed = timestamp - start
      const progress = Math.min(elapsed / duration, 1)
      setCount(Math.floor(easeOutCubic(progress) * target))
      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [isVisible, target, duration])

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString('id-ID', { minimumFractionDigits: decimals })}{suffix}
    </span>
  )
}
```

### 15.4 Scroll Progress Bar

```css
/* Reading progress — fixed bar di top halaman artikel */
.reading-progress {
  position: fixed;
  top: 0; left: 0;
  height: 3px;
  background: linear-gradient(90deg, #0B7D6E, #1BBFAA);
  border-radius: 0 3px 3px 0;
  z-index: 9999;
  transition: width 50ms linear;
}
```

```typescript
// hooks/useReadingProgress.ts
export function useReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement
      const total = scrollHeight - clientHeight
      setProgress(total > 0 ? (scrollTop / total) * 100 : 0)
    }
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return progress
}
```

### 15.5 Sticky Section Indicator (Dot Navigation)

```css
.section-dots {
  position: fixed;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 100;
}

.section-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #D1D5DB; /* neutral-300 */
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.section-dot.is-active {
  background: #0B7D6E; /* teal-600 */
  transform: scale(1.4);
}

.section-dot:hover:not(.is-active) {
  background: #0F9E8B; /* teal-500 */
  transform: scale(1.2);
}
```

### 15.6 Scroll-triggered Skill/Progress Bars

```css
.skill-bar-fill {
  width: 0%;
  transition: width 800ms cubic-bezier(0, 0, 0.2, 1) var(--delay, 0ms);
}

.skill-bar-fill.is-visible {
  width: var(--target-width);
}
```

---

## 16. Parallax Scrolling System

### 16.1 Filosofi Parallax Reka Cipta

Parallax digunakan secara **deliberate dan tertahan** — bukan di setiap halaman. Target penggunaan:
- Hero section website publik (kedalaman dramatik)
- Section "Tentang Kami" (foto petani dengan depth)
- Background dekoratif (tidak di konten utama)

**Maksimum 3 layer parallax per viewport.** Lebih dari itu terasa berlebihan dan mengganggu keterbacaan.

### 16.2 CSS Parallax (Simple, No JS)

```css
/* Container */
.parallax-container {
  perspective: 1px;
  height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
}

/* Layer yang bergerak lambat (background) */
.parallax-far {
  transform: translateZ(-2px) scale(3);
  /* Bergerak 1/3 kecepatan scroll */
}

/* Layer yang bergerak sedang (midground) */
.parallax-mid {
  transform: translateZ(-1px) scale(2);
  /* Bergerak 1/2 kecepatan scroll */
}

/* Layer normal (foreground) */
.parallax-near {
  transform: translateZ(0);
  /* Bergerak normal */
}
```

### 16.3 JavaScript Parallax (Precise Control)

```typescript
// hooks/useParallax.ts
import { useEffect, useRef } from 'react'

interface ParallaxConfig {
  speed: number    // 0.1 = sangat lambat, 1 = normal, 2 = cepat
  direction?: 'vertical' | 'horizontal'
}

export function useParallax({ speed, direction = 'vertical' }: ParallaxConfig) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const handleScroll = () => {
      const { top } = el.getBoundingClientRect()
      const offset = window.scrollY
      const parallaxValue = (offset - top) * speed

      if (direction === 'vertical') {
        el.style.transform = `translateY(${parallaxValue}px)`
      } else {
        el.style.transform = `translateX(${parallaxValue}px)`
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [speed, direction])

  return ref
}

// Penggunaan:
// const heroImageRef = useParallax({ speed: 0.3 })
// <img ref={heroImageRef} ... />
```

### 16.4 Parallax Layers di Hero Section

```
/* 3 layer depth untuk hero website publik */

Layer 1 (terdalam, paling lambat — speed: 0.1):
  → Gradient background atau pattern abstrak kristal garam
  → Tidak berisi teks atau informasi penting

Layer 2 (menengah — speed: 0.25):
  → Foto tambak garam atau visual brand
  → Diblur sedikit (blur: 0.5px) untuk menguatkan ilusi kedalaman

Layer 3 (permukaan, normal — speed: 0):
  → Headline, subheadline, CTA button
  → Tidak ada parallax — teks harus tetap mudah dibaca

Catatan: Layer 1 dan 2 menggunakan will-change: transform
untuk optimasi rendering GPU.
```

---

## 17. Route & Page Transitions

### 17.1 NProgress-style Loading Bar

```css
/* Top loading bar saat navigasi antar halaman */
.nprogress-bar {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #0B7D6E, #1BBFAA);
  z-index: 9999;
  border-radius: 0 3px 3px 0;
}

/* Animasi fill tak terduga (terasa natural) */
@keyframes nprogress-fill {
  0%   { width: 0%; opacity: 1; }
  10%  { width: 30%; }
  50%  { width: 65%; }
  75%  { width: 80%; }
  95%  { width: 95%; }
  100% { width: 100%; opacity: 0; }
}

.nprogress-bar.is-loading {
  animation: nprogress-fill 2s ease-out forwards;
}
```

```typescript
// Implementasi Next.js 14 App Router
// app/layout.tsx
'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function NavigationProgress() {
  const pathname = usePathname()

  useEffect(() => {
    const bar = document.querySelector('.nprogress-bar') as HTMLElement
    if (bar) {
      bar.classList.add('is-loading')
      const timer = setTimeout(() => {
        bar.classList.remove('is-loading')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [pathname])

  return <div className="nprogress-bar" />
}
```

### 17.2 Page Enter Animation

```css
/* Semua halaman masuk dengan fade + slide up */
@keyframes page-enter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-wrapper {
  animation: page-enter 350ms cubic-bezier(0, 0, 0.2, 1) both;
}

/* Admin panel: sliding dari kiri (perubahan route antar section) */
@keyframes admin-page-enter {
  from {
    opacity: 0;
    transform: translateX(8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.admin-content {
  animation: admin-page-enter 250ms cubic-bezier(0, 0, 0.2, 1);
}
```

### 17.3 Framer Motion Page Transition (Full)

```typescript
// components/PageTransition.tsx
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  enter:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

---

## 18. Layout Transitions (FLIP)

### 18.1 Teori FLIP

**FLIP = First, Last, Invert, Play**
Teknik untuk animasi layout yang smooth tanpa performa drop.

```
1. FIRST:   Rekam posisi/ukuran awal elemen (getBoundingClientRect)
2. LAST:    Jalankan perubahan layout (reorder, filter, dll)
3. INVERT:  Hitung selisih dan terapkan kebalikannya sebagai transform
4. PLAY:    Animate dari "inverted" ke "normal" → terasa seperti bergerak ke posisi baru
```

### 18.2 Grid/List View Toggle

```css
/* Switch antara tampilan grid dan list */
.product-grid {
  display: grid;
  transition: grid-template-columns 300ms cubic-bezier(0, 0, 0.2, 1);
}

/* Grid view: 3 kolom */
.product-grid.view-grid {
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

/* List view: 1 kolom */
.product-grid.view-list {
  grid-template-columns: 1fr;
  gap: 12px;
}

/* Item dalam grid: animasi saat switch view */
.product-item {
  transition: all 300ms cubic-bezier(0, 0, 0.2, 1);
  animation: grid-item-appear 300ms ease-out both;
}

@keyframes grid-item-appear {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}
```

### 18.3 List Reorder Animation

```typescript
// Framer Motion untuk drag-and-drop reorder
import { Reorder } from 'framer-motion'

// Komponen:
<Reorder.Group
  axis="y"
  values={items}
  onReorder={setItems}
  style={{ listStyle: 'none' }}
>
  {items.map(item => (
    <Reorder.Item
      key={item.id}
      value={item}
      whileDrag={{
        scale: 1.02,
        boxShadow: '0 8px 16px rgba(11,125,110,0.15)',
        rotate: 0.5,
        zIndex: 50,
      }}
      transition={springs.natural}
    />
  ))}
</Reorder.Group>
```

### 18.4 Add / Remove List Item

```css
/* Item baru muncul */
@keyframes list-item-enter {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.97);
    max-height: 0;
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    max-height: 200px;
  }
}

/* Item dihapus keluar */
@keyframes list-item-exit {
  from {
    opacity: 1;
    transform: translateX(0);
    max-height: 200px;
  }
  to {
    opacity: 0;
    transform: translateX(32px);
    max-height: 0;
    margin: 0;
    padding: 0;
  }
}

.list-item-entering { animation: list-item-enter 300ms cubic-bezier(0, 0, 0.2, 1); }
.list-item-exiting  { animation: list-item-exit 250ms cubic-bezier(0.4, 0, 1, 1); }
```

### 18.5 Kanban Card Move Animation

```typescript
// Framer Motion untuk drag-and-drop Kanban
const cardVariants = {
  dragging: {
    scale: 1.04,
    rotate: 1.5,
    boxShadow: '0 16px 32px rgba(11,125,110,0.20)',
    zIndex: 100,
    cursor: 'grabbing',
  },
  normal: {
    scale: 1,
    rotate: 0,
    boxShadow: '0 2px 4px rgba(11,125,110,0.06)',
    zIndex: 1,
    cursor: 'grab',
    transition: springs.gentle,
  },
}
```

---

## 19. Image Effects

### 19.1 Ken Burns Effect (Foto di Hero)

```css
/* Slow zoom dan pan — digunakan pada background foto hero */
@keyframes ken-burns {
  0%   { transform: scale(1.0) translate(0, 0); }
  100% { transform: scale(1.12) translate(-2%, 1%); }
}

.hero-image-kenburns {
  animation: ken-burns 12s ease-in-out infinite alternate;
  will-change: transform;
}
```

### 19.2 Hover: Zoom + Overlay

```css
.image-zoom-container {
  overflow: hidden;
  border-radius: 12px;
  position: relative;
}

.image-zoom {
  transition: transform 500ms cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%; height: 100%;
  object-fit: cover;
}

.image-zoom-container:hover .image-zoom {
  transform: scale(1.05);
}

/* Overlay gradient muncul saat hover */
.image-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(
    to top,
    rgba(11, 125, 110, 0.7) 0%,
    rgba(11, 125, 110, 0.2) 50%,
    transparent 100%
  );
  opacity: 0;
  transition: opacity 300ms ease;
}

.image-zoom-container:hover .image-overlay {
  opacity: 1;
}
```

### 19.3 Hover: Caption Reveal dari Bawah

```css
.image-caption-container {
  position: relative;
  overflow: hidden;
}

.image-caption {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  padding: 16px;
  background: linear-gradient(to top, rgba(8,64,56,0.95) 0%, transparent 100%);
  color: white;
  transform: translateY(100%);
  transition: transform 300ms cubic-bezier(0, 0, 0.2, 1);
}

.image-caption-container:hover .image-caption {
  transform: translateY(0);
}
```

### 19.4 Hover: 3D Tilt Effect

```typescript
// hooks/useTilt.ts
export function useTilt(intensity: number = 10) {
  const ref = useRef<HTMLElement>(null)

  const handleMouseMove = (e: MouseEvent) => {
    const el = ref.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotateX = ((y - centerY) / centerY) * -intensity
    const rotateY = ((x - centerX) / centerX) * intensity

    el.style.transform =
      `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`
  }

  const handleMouseLeave = () => {
    if (ref.current) {
      ref.current.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale(1)'
      ref.current.style.transition = 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)'
    }
  }

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.transition = 'transform 100ms ease'
    el.addEventListener('mousemove', handleMouseMove)
    el.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      el.removeEventListener('mousemove', handleMouseMove)
      el.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [intensity])

  return ref
}
```

### 19.5 Hover: Color Overlay Teal

```css
/* Digunakan pada foto tim / petani di halaman Tentang Kami */
.photo-teal-hover {
  position: relative;
  overflow: hidden;
}

.photo-teal-hover img {
  transition: filter 400ms ease, transform 400ms ease;
}

.photo-teal-hover::after {
  content: '';
  position: absolute; inset: 0;
  background: #0B7D6E; /* teal-600 */
  mix-blend-mode: multiply;
  opacity: 0;
  transition: opacity 300ms ease;
}

.photo-teal-hover:hover img {
  transform: scale(1.04);
  filter: grayscale(20%);
}

.photo-teal-hover:hover::after {
  opacity: 0.3;
}
```

---

## 20. Progress & Loader Animations

### 20.1 Page Loading Bar (NProgress) — sudah di Bagian 17.1

### 20.2 AI Proposal Generator — Loading Experience

```css
/* Khusus: loading saat AI sedang membuat proposal (bisa 10-30 detik) */

/* Step indicator berurutan */
.ai-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ai-step {
  display: flex;
  align-items: center;
  gap: 12px;
  opacity: 0.3;
  transition: opacity 300ms ease, transform 300ms ease;
}

.ai-step.is-active {
  opacity: 1;
  transform: translateX(4px);
}

.ai-step.is-done {
  opacity: 0.7;
}

/* Pulsing text "Sedang memproses..." */
@keyframes processing-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}

.processing-text {
  animation: processing-pulse 1.5s ease-in-out infinite;
  color: #0B7D6E;
  font-weight: 500;
}

/* Wave dots */
.wave-dots { display: flex; gap: 3px; }
.wave-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: #0B7D6E;
  animation: wave 1.2s ease-in-out infinite;
}
.wave-dot:nth-child(2) { animation-delay: 0.15s; }
.wave-dot:nth-child(3) { animation-delay: 0.30s; }

@keyframes wave {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-6px); }
}
```

---

## 21. Background Animations

### 21.1 Animated Gradient Shift

```css
/* Digunakan di hero section atau CTA section besar */
@keyframes gradient-shift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.bg-gradient-animated {
  background: linear-gradient(
    135deg,
    #064038,    /* teal-800 */
    #0B7D6E,    /* teal-600 */
    #0F9E8B,    /* teal-500 */
    #085E52     /* teal-700 */
  );
  background-size: 300% 300%;
  animation: gradient-shift 8s ease infinite;
}

/* Versi lebih subtle (background section saja) */
.bg-gradient-subtle {
  background: linear-gradient(
    135deg,
    #E6FAF8 0%,   /* teal-50 */
    #FAF6EF 50%,  /* sand-50 */
    #E6FAF8 100%
  );
  background-size: 200% 200%;
  animation: gradient-shift 12s ease infinite;
}
```

### 21.2 Moving Dot Grid Pattern

```css
/* Pattern background abstrak — digunakan sebagai texture */
.bg-dot-grid {
  position: relative;
}

.bg-dot-grid::before {
  content: '';
  position: absolute; inset: 0;
  background-image: radial-gradient(
    circle at 1px 1px,
    rgba(11,125,110,0.12) 1px,
    transparent 0
  );
  background-size: 24px 24px;
  animation: dot-grid-drift 20s linear infinite;
  pointer-events: none;
}

@keyframes dot-grid-drift {
  from { background-position: 0 0; }
  to   { background-position: 24px 24px; }
}

/* Varian yang lebih halus untuk dark background */
.bg-dot-grid-dark::before {
  background-image: radial-gradient(
    circle at 1px 1px,
    rgba(255,255,255,0.06) 1px,
    transparent 0
  );
}
```

### 21.3 Wave Effect (Separator Antar Section)

```css
/* SVG wave separator */
.wave-separator {
  position: relative;
  overflow: hidden;
  height: 80px;
}

.wave-separator svg {
  position: absolute;
  bottom: 0;
  animation: wave-move 6s linear infinite;
  width: 200%;
}

@keyframes wave-move {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}

/* Wave path SVG yang digunakan:
<svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg">
  <path d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,15 1440,30 L1440,60 L0,60 Z" fill="#0B7D6E"/>
  <path d="M1440,30 C1080,60 720,0 360,30 C180,45 60,15 0,30 L0,60 L1440,60 Z" fill="#0B7D6E" opacity="0.5"/>
</svg>
*/
```

### 21.4 Salt Crystal Particles ✦ (Brand-Specific)

Efek unik yang terinspirasi kristal garam — particle kecil berbentuk diamond/square yang melayang.

```css
/* Container */
.salt-particles {
  position: absolute; inset: 0;
  overflow: hidden;
  pointer-events: none;
}

/* Individual particle */
.salt-particle {
  position: absolute;
  width: 4px; height: 4px;
  background: rgba(255, 255, 255, 0.6);
  /* Bentuk kristal: square yang dirotasi 45° */
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  animation: salt-float var(--duration, 6s) var(--delay, 0s) ease-in-out infinite;
}

@keyframes salt-float {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.6;
  }
  90% {
    opacity: 0.4;
  }
  100% {
    transform: translateY(-100px) rotate(180deg);
    opacity: 0;
  }
}

/* Distribusi: 12 partikel dengan posisi random */
/* Contoh: */
/* .salt-particle:nth-child(1)  { left: 10%; --duration: 7s; --delay: 0s; } */
/* .salt-particle:nth-child(2)  { left: 25%; --duration: 5s; --delay: 1s; } */
/* ... dst */
```

```typescript
// SaltParticles.tsx — auto-generate partikel
export function SaltParticles({ count = 12 }: { count?: number }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 90 + 5}%`,
    top:  `${Math.random() * 90 + 5}%`,
    duration: `${4 + Math.random() * 5}s`,
    delay:    `${Math.random() * 4}s`,
    size:     `${2 + Math.random() * 4}px`,
    opacity:  0.3 + Math.random() * 0.4,
  }))

  return (
    <div className="salt-particles" aria-hidden="true">
      {particles.map(p => (
        <div
          key={p.id}
          className="salt-particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            '--duration': p.duration,
            '--delay': p.delay,
            opacity: p.opacity,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
```

### 21.5 Glassmorphism Blur Blobs

```css
/* Digunakan sebagai background ambient di hero atau CTA section */
.blob-container {
  position: absolute; inset: 0;
  overflow: hidden;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}

.blob {
  position: absolute;
  border-radius: 50%;
  opacity: 0.4;
  animation: blob-drift var(--dur, 8s) var(--delay, 0s) ease-in-out infinite alternate;
}

.blob-primary {
  width: 400px; height: 400px;
  background: #0B7D6E; /* teal-600 */
  top: -100px; left: -100px;
  --dur: 10s;
}

.blob-secondary {
  width: 300px; height: 300px;
  background: #1BBFAA; /* teal-400 */
  bottom: -50px; right: -50px;
  --dur: 8s; --delay: 2s;
}

.blob-accent {
  width: 200px; height: 200px;
  background: #8A6535; /* sand-600 */
  top: 40%; left: 50%;
  --dur: 12s; --delay: 1s;
}

@keyframes blob-drift {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(30px, -20px) scale(1.08); }
}
```

### 21.6 Noise Texture Overlay

```css
/* Menambahkan texture grain untuk kesan artisanal/lokal */
.noise-texture::after {
  content: '';
  position: absolute; inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
  pointer-events: none;
  opacity: 0.4;
}
```

---

## 22. Text & Counter Effects

### 22.1 Typewriter Effect

```css
/* Digunakan pada headline hero untuk emphasis */
.typewriter {
  overflow: hidden;
  border-right: 2px solid #0B7D6E; /* cursor */
  white-space: nowrap;
  animation:
    typing 2s steps(30, end),
    cursor-blink 0.8s step-end infinite;
}

@keyframes typing {
  from { width: 0; }
  to   { width: 100%; }
}

@keyframes cursor-blink {
  0%, 100% { border-color: #0B7D6E; }
  50%       { border-color: transparent; }
}
```

### 22.2 Text Gradient Animation

```css
/* Headline dengan gradient bergerak */
.text-gradient-animated {
  background: linear-gradient(
    90deg,
    #085E52,   /* teal-700 */
    #0B7D6E,   /* teal-600 */
    #1BBFAA,   /* teal-400 */
    #0B7D6E,   /* teal-600 */
    #085E52    /* teal-700 */
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: text-gradient-flow 4s linear infinite;
}

@keyframes text-gradient-flow {
  to { background-position: 200% center; }
}
```

### 22.3 Word-by-Word Reveal

```typescript
// components/RevealText.tsx
export function RevealText({ text, className }: { text: string; className?: string }) {
  const words = text.split(' ')

  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: i * 0.06,
            ease: [0, 0, 0.2, 1],
          }}
          viewport={{ once: true, margin: '-50px' }}
          style={{ display: 'inline-block', marginRight: '0.25em' }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  )
}
```

---

## 23. Reduced Motion & Accessibility

### 23.1 Implementasi Wajib

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Skeleton: tetap tampil tapi tanpa shimmer */
  .skeleton {
    animation: none !important;
    background: #F3F4F6 !important;
  }

  /* Parallax: matikan sepenuhnya */
  [data-parallax] { transform: none !important; }

  /* Salt particles: sembunyikan */
  .salt-particles { display: none !important; }

  /* Background blobs: sembunyikan */
  .blob-container { display: none !important; }

  /* Gradient animation: beku di posisi awal */
  .bg-gradient-animated { animation: none !important; background-position: 0% 50% !important; }

  /* Progress bar: tampilkan final state langsung */
  .nprogress-bar { animation: none !important; width: 100% !important; }
}
```

### 23.2 JavaScript Reduced Motion Check

```typescript
// Cek sebelum menjalankan animasi berat (parallax, particles)
const prefersReducedMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

if (!prefersReducedMotion) {
  // Inisialisasi parallax, particles, dll
}
```

### 23.3 Focus Management

```css
/* Focus ring teal — konsisten di seluruh platform */
:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px #FFFFFF, 0 0 0 4px #0B7D6E;
  border-radius: 4px;
}

/* Pada dark background */
.dark-bg :focus-visible {
  box-shadow: 0 0 0 2px rgba(0,0,0,0.2), 0 0 0 4px #52D6C4;
}

/* Error state */
.input-error:focus-visible {
  box-shadow: 0 0 0 2px #FFFFFF, 0 0 0 4px #DC2626;
}

/* Jangan pernah hapus focus ring */
/* DILARANG: :focus { outline: none; } */
```


---

# BAGIAN III — KOMPONEN

---

## 24. Komponen: Button

### 24.1 Varian

| Varian | Penggunaan | Token Warna |
|---|---|---|
| `primary` | CTA utama | teal-600 → hover teal-500 |
| `secondary` | Aksi penting kedua | ink-700 → hover ink-600 |
| `outline` | Aksi sekunder | border teal-600, text teal-700 |
| `ghost` | Aksi tersier | transparent → neutral-100 |
| `sand` | Aksen lokal/petani | sand-600 → hover sand-500 |
| `destructive` | Hapus, batalkan | danger-600 → danger-500 |
| `link` | Inline teks | teal-600, underline |

### 24.2 Size

```
btn-xs:  h-7  px-2.5 py-1.5 text-xs  gap-1   icon-14px
btn-sm:  h-8  px-3   py-2   text-sm  gap-1.5 icon-16px
btn-md:  h-10 px-4   py-2.5 text-sm  gap-2   icon-18px ← DEFAULT
btn-lg:  h-12 px-5   py-3   text-base gap-2   icon-20px
btn-xl:  h-14 px-6   py-3.5 text-lg  gap-2.5 icon-22px
```

### 24.3 State Spesifikasi

```
PRIMARY (teal-based)
rest:     bg-teal-600 text-white shadow-sm
hover:    bg-teal-500 shadow-md -translate-y-0.5     [100ms ease-out]
focus:    ring-focus (teal)
active:   bg-teal-700 scale-[0.97] shadow-none       [50ms ease-in]
loading:  opacity-75 cursor-wait spinner-white
success:  bg-success-600 (flash 600ms) → kembali ke teal
disabled: opacity-40 cursor-not-allowed

OUTLINE (teal border)
rest:     border-2 border-teal-600 text-teal-700 bg-transparent
hover:    bg-teal-50 border-teal-500               [100ms]
active:   bg-teal-100 scale-[0.97]                 [50ms]
disabled: border-neutral-300 text-neutral-400

SAND (supplier/petani CTA)
rest:     bg-sand-600 text-white shadow-sm
hover:    bg-sand-500 shadow-md -translate-y-0.5   [100ms]
active:   bg-sand-700 scale-[0.97]                 [50ms]
```

---

## 25. Komponen: Form Elements

### 25.1 Text Input

```
rest:     border-neutral-300 bg-white text-neutral-900 rounded-[6px]
hover:    border-neutral-400                              [100ms]
focus:    border-teal-600 ring-focus-teal                [150ms]
valid:    border-success-600 + CheckCircle icon          [150ms spring]
invalid:  border-danger-600 bg-danger-50 + shake anim   [300ms]
disabled: bg-neutral-50 border-neutral-200 text-neutral-400

padding:   px-3.5 py-2.5
font-size: 14px, neutral-900
placeholder: neutral-400
border-radius: 6px
```

### 25.2 Label, Helper Text, Error

```
label:          14px / 500 / neutral-700 / mb-1.5
helper text:    12px / 400 / neutral-500 / mt-1.5
error message:  12px / 500 / danger-600 / mt-1.5 + AlertCircle icon 14px
success note:   12px / 500 / success-600 / mt-1.5 + CheckCircle icon 14px
required mark:  ' *' warna danger-500, font-weight 400
```

### 25.3 Select

```
Sama dengan text input + chevron icon kanan
padding-right: 40px
chevron rotasi 180° saat open [200ms ease]
```

### 25.4 Checkbox & Radio

```
Checkbox:
  Size: 16x16px, r4px
  Unchecked: border-neutral-300, bg-white
  Checked: bg-teal-600 border-teal-600, SVG checkmark draw [160ms spring]
  Hover: border-teal-400, bg-teal-50 [100ms]

Radio:
  Size: 18x18px, r50%
  Unchecked: border-neutral-300
  Checked: border-teal-600, inner dot 8px teal-600 scale(0 → 1) [180ms spring]
```

### 25.5 Toggle

```
Off:  track bg-neutral-300, thumb translateX(2px)
On:   track bg-teal-600, thumb translateX(20px) [180ms spring]
Hover (on): track bg-teal-500, glow shadow
Hover (off): track bg-neutral-400
```

---

## 26. Komponen: Card

### 26.1 Varian

```
DEFAULT:     bg-white border-neutral-200 shadow-sm rounded-lg
ELEVATED:    bg-white shadow-md rounded-xl (no border)
FLAT:        bg-white border-neutral-200 (no shadow)
INTERACTIVE: hover lift + shadow up [150ms ease-out]
HIGHLIGHT:   border-l-4 border-teal-600, bg-teal-50
WARM:        border-l-4 border-sand-600, bg-sand-50
```

### 26.2 Card Interaktif — States

```
rest:     bg-white border-neutral-200 shadow-sm
hover:    shadow-md -translate-y-1 border-teal-200   [150ms ease-out]
active:   translate-y-0 scale-[0.995] shadow-xs      [50ms ease-in]
selected: border-teal-600 (2px) bg-teal-50 shadow-glow-sm [150ms]
```

### 26.3 Card Produk Garam

```
header: nama + badge SNI (teal-100 bg, teal-800 text)
body: deskripsi + key specs (font-mono untuk nilai)
footer: CTA primary + link unduh

key specs table:
  header row: bg-teal-50
  font values: JetBrains Mono 13px neutral-600
  padding: 8px 12px
```

---

## 27. Komponen: Badge & Tag

### 27.1 Badge

```
SNI Certified:    bg-teal-100  text-teal-800    border-teal-200
Status Baru:      bg-teal-50   text-teal-700    border-teal-200
Status Dihubungi: bg-warning-50 text-warning-700 border-warning-200
Status Sampel:    bg-info-50   text-info-700    border-info-200
Status Negosiasi: bg-purple-50 text-purple-700  border-purple-200
Status Deal:      bg-success-50 text-success-700 border-success-200
Status Lost:      bg-danger-50  text-danger-700  border-danger-200
Sand Premium:     bg-sand-100  text-sand-700    border-sand-300

Dimensi: h-6 px-2.5 rounded-full text-xs font-semibold
```

### 27.2 Chip / Tag (removable)

```
bg-teal-100 text-teal-800 rounded-full h-7 px-3 text-sm font-medium
× button: text-teal-400 hover:text-teal-800 [100ms]
Remove animation: fade-out + scale-down [150ms ease-in]
```

---

## 28. Komponen: Alert & Toast

### 28.1 Inline Alert

```
info:    bg-info-50    border-l-4 border-info-500    icon InfoIcon info-600
success: bg-success-50 border-l-4 border-success-500 icon CheckCircle success-600
warning: bg-warning-50 border-l-4 border-warning-500 icon AlertTriangle warning-600
error:   bg-danger-50  border-l-4 border-danger-500  icon XCircle danger-600

padding: 12px 16px, rounded-lg, flex gap-3
title: 14px font-semibold
body: 14px font-normal
```

### 28.2 Toast

```
Position: fixed bottom-6 right-6 z-[9999]
Size: max-w-[360px], bg-white, border-neutral-200
      rounded-xl, shadow-lg, p-4, flex gap-3

Enter: toast-in 300ms decelerate (slide dari kanan)
Exit:  toast-out 200ms accelerate (slide ke kanan)

Auto-dismiss: success/info 4s, warning 6s, error tidak auto

Progress bar: h-[3px] bottom-0 bg-teal-600 shrink dari 100%→0% selama durasi
```

---

## 29. Komponen: Navigation

### 29.1 Navbar Publik

```
height: 64px, sticky top-0, z-[1000]
bg: white | white/95 backdrop-blur (saat scroll > 8px) [200ms]
border-bottom: neutral-100 | neutral-200 (saat scroll) [200ms]

Logo: h-9 kiri
Nav items: text-sm/500/neutral-600 → hover teal-700 [100ms]
           underline slide dari kiri saat hover/active
CTA: btn-sm primary (teal-600) di kanan
Hamburger: < 768px, MenuIcon 24px neutral-700
Mobile drawer: right slide [300ms decelerate] + backdrop
```

### 29.2 Admin Sidebar

```
Width: 240px (expanded) / 64px (collapsed)
Background: ink-900 (#0A1E1C)

Logo area: h-16, px-5, border-b rgba(255,255,255,0.07)
Section label: 10px/600/rgba(white,0.35)/UPPERCASE/tracking-wider
Nav item: h-10, px-3, mx-2, r8px, gap-2.5
           text: rgba(white,0.65) / 14px / 500
  hover:   bg rgba(white,0.08) text rgba(white,0.9)    [100ms]
  active:  bg teal-600 text white font-semibold
  icon:    18px, opacity 0.75 (inactive) / 1 (active)

Collapse btn: bottom, ChevronLeft/Right icon
              sidebar transition: width 250ms ease-in-out
```

---

## 30. Komponen: Table, Modal, Dropdown

### 30.1 Table

```
Container: border-neutral-200 rounded-xl overflow-hidden

Header row: bg-neutral-50, border-b neutral-200
  th: 12px/600/neutral-500/UPPERCASE/tracking-wide, p-3 px-4
  Sort icon: ChevronUpDown neutral-400 → teal-600 [100ms]

Body row:
  td: 14px neutral-900, p-3.5 px-4, border-b neutral-100
  rest:     bg-white
  hover:    bg-neutral-50                [100ms]
  selected: bg-teal-50, border-l-3 teal-600
  overdue:  bg-warning-50, border-l-3 warning-500

Action column: opacity-0 → opacity-100 saat row hover [100ms]
Empty state: py-16 text-center, float icon animation
```

### 30.2 Modal

```
Backdrop: rgba(0,0,0,0.5) backdrop-blur(2px), z-9000
          animate: fade-in 200ms ease-out

Modal box: bg-white rounded-xl shadow-xl
           max-w: 480px/560px/760px
           animate: scale(0.96)+translateY(8px) → normal [250ms decelerate]

Header: px-6 py-5 border-b neutral-200
Body: px-6 py-5
Footer: px-6 py-4 border-t neutral-200, flex justify-end gap-2

Konfirmasi destruktif:
  - Confirm button disabled 500ms sebelum bisa diklik
  - Body jelaskan konsekuensi aksi dengan jelas
```

### 30.3 Dropdown Menu

```
Container: bg-white border-neutral-200 rounded-[10px]
           shadow-lg, p-1, min-w-[180px]
           animate: dropdown-in 150ms ease-out

Item: px-3 py-2 r6px text-sm text-neutral-700
      hover: bg-neutral-100 text-neutral-900 [100ms]
      active: bg-neutral-200

Destructive item: text-danger-600, hover: bg-danger-50
Divider: h-px bg-neutral-200, mx-[-4px], my-1
```

---

# BAGIAN IV — POLA & SISTEM

---

## 33. Pola CTA

### 33.1 Tier CTA (Dari Fondasi Brand)

| Tier | Persona | CTA | Varian Button | Friction |
|---|---|---|---|---|
| 1 | Pengunjung baru | "Unduh Spesifikasi Teknis" | secondary (ink) + Download icon | Zero — PDF langsung |
| 2 | Pengunjung tertarik | "Minta Sampel Gratis" | outline (teal) + Package icon | Low — nama + email |
| 3 | Siap bernegosiasi | "Dapatkan Penawaran" | primary (teal) + ArrowRight | Medium — form RFQ |
| 4 | Langsung kontak | "Chat via WhatsApp" | green (#25D366) + MessageCircle | Instan |
| 5 | Petani/supplier | "Daftarkan Usaha Garam" | sand variant + Sprout | Low |

### 33.2 Hero CTA — Pulsing Glow Animation

```css
/* Hanya untuk CTA utama di hero section */
@keyframes cta-hero-pulse {
  0%, 100% {
    box-shadow: 0 4px 8px rgba(11,125,110,0.20);
  }
  50% {
    box-shadow: 0 4px 8px rgba(11,125,110,0.20),
                0 0 0 6px rgba(11,125,110,0.12),
                0 0 0 12px rgba(11,125,110,0.06);
  }
}

.cta-hero-primary {
  animation: cta-hero-pulse 3s ease-in-out infinite;
}
```

---

## 34. Layout & Grid System

```
Container max-width: 1280px, px: 16px(mobile) / 24px(tablet) / 32px(desktop)
Narrow container (artikel, form): max-w-3xl (768px)

Breakpoints: sm:640px / md:768px / lg:1024px / xl:1280px / 2xl:1536px

Z-index stack:
  content: 0 | sticky table header: 10 | sticky navbar: 20
  dropdown/tooltip: 30 | sidebar mobile overlay: 40
  modal backdrop: 50 | modal content: 60 | toast: 9999
```

---

## 35. Dark Mode (Admin Panel Only)

```css
:root {
  --bg-page:     #F9FAFB;
  --bg-surface:  #FFFFFF;
  --text-primary: #111827;
  --border:      #E5E7EB;
}

.dark {
  --bg-page:     #0A1E1C;  /* ink-900 derived */
  --bg-surface:  #102E2B;  /* ink-800 */
  --text-primary: #F0FDFA;  /* teal-50 tinted white */
  --border:      #1F5249;   /* ink-600 */
  --teal-primary: #1BBFAA; /* teal-400 — lebih terang untuk dark bg */
}
```

---

## 36. tailwind.config.ts (Final — Teal-First)

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── PRIMARY: Brand Teal ──────────────────
        'brand-teal': {
          950: '#011210', 900: '#042B26', 800: '#064038',
          700: '#085E52', 600: '#0B7D6E', 500: '#0F9E8B',
          400: '#1BBFAA', 300: '#52D6C4', 200: '#93E7DC',
          100: '#C7F2EE', 50:  '#E6FAF8',
        },
        // ── DARK: Deep Ink ───────────────────────
        'ink': {
          950: '#050F0E', 900: '#0A1E1C', 800: '#102E2B',
          700: '#173F3A', 600: '#1F5249', 500: '#296B60',
          400: '#3D8C80', 300: '#6DB8AD', 200: '#A8D8D3',
          100: '#D4EEEB', 50:  '#EAF6F4',
        },
        // ── ACCENT: Warm Sand ────────────────────
        'sand': {
          950: '#1C1208', 900: '#2E1E0D', 800: '#4D3318',
          700: '#6B4B25', 600: '#8A6535', 500: '#A88048',
          400: '#C8A06A', 300: '#E0C49A', 200: '#EEDFC4',
          100: '#F6EFE1', 50:  '#FAF6EF',
        },
        // ── SEMANTIC ─────────────────────────────
        success: {
          900: '#064E3B', 700: '#065F46', 600: '#16A34A',
          500: '#22C55E', 100: '#DCFCE7', 50:  '#F0FDF4',
        },
        warning: {
          900: '#78350F', 700: '#92400E', 600: '#D97706',
          500: '#F59E0B', 100: '#FEF3C7', 50:  '#FFFBEB',
        },
        danger: {
          900: '#7F1D1D', 700: '#991B1B', 600: '#DC2626',
          500: '#EF4444', 100: '#FEE2E2', 50:  '#FEF2F2',
        },
        info: {
          900: '#1E3A8A', 700: '#1D4ED8', 600: '#3B82F6',
          500: '#60A5FA', 100: '#DBEAFE', 50:  '#EFF6FF',
        },
      },

      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        'xs':  ['0.75rem',  { lineHeight: '1rem' }],
        'sm':  ['0.875rem', { lineHeight: '1.25rem' }],
        'base':['1rem',     { lineHeight: '1.5rem' }],
        'lg':  ['1.125rem', { lineHeight: '1.75rem' }],
        'xl':  ['1.25rem',  { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem',   { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.375rem' }],
        '4xl': ['2.25rem',  { lineHeight: '2.75rem' }],
        '5xl': ['3rem',     { lineHeight: '3.5rem' }],
        '6xl': ['3.75rem',  { lineHeight: '4.25rem' }],
      },

      boxShadow: {
        /* Teal-tinted shadows */
        'xs':   '0 1px 2px rgba(11,125,110,0.05)',
        'sm':   '0 2px 4px rgba(11,125,110,0.06), 0 1px 2px rgba(11,125,110,0.04)',
        DEFAULT:'0 4px 8px rgba(11,125,110,0.08), 0 2px 4px rgba(11,125,110,0.05)',
        'md':   '0 4px 8px rgba(11,125,110,0.08), 0 2px 4px rgba(11,125,110,0.05)',
        'lg':   '0 8px 16px rgba(11,125,110,0.10), 0 4px 8px rgba(11,125,110,0.06)',
        'xl':   '0 16px 32px rgba(11,125,110,0.12), 0 8px 16px rgba(11,125,110,0.08)',
        '2xl':  '0 24px 48px rgba(11,125,110,0.16)',
        /* Teal glow variants */
        'glow-sm': '0 0 0 3px rgba(11,125,110,0.15)',
        'glow-md': '0 0 0 6px rgba(11,125,110,0.12), 0 4px 16px rgba(11,125,110,0.15)',
        'glow-lg': '0 0 0 8px rgba(11,125,110,0.10), 0 8px 32px rgba(11,125,110,0.20)',
        /* Focus rings */
        'focus':       '0 0 0 2px #FFFFFF, 0 0 0 4px #0B7D6E',
        'focus-dark':  '0 0 0 2px rgba(0,0,0,0.2), 0 0 0 4px #52D6C4',
        'focus-error': '0 0 0 2px #FFFFFF, 0 0 0 4px #DC2626',
        'none': 'none',
      },

      transitionTimingFunction: {
        'spring':      'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spring-soft': 'cubic-bezier(0.25, 1.25, 0.5, 1)',
        'decelerate':  'cubic-bezier(0.0, 0.0, 0.2, 1)',
        'accelerate':  'cubic-bezier(0.4, 0.0, 1, 1)',
        'standard':    'cubic-bezier(0.4, 0.0, 0.2, 1)',
        'anticipate':  'cubic-bezier(0.36, -0.18, 0.64, 1.56)',
      },

      transitionDuration: {
        '50': '50ms', '100': '100ms', '150': '150ms',
        '200': '200ms', '300': '300ms', '400': '400ms',
        '600': '600ms', '800': '800ms',
      },

      animation: {
        'skeleton':      'skeleton-shimmer 1.4s ease-in-out infinite',
        'spin-fast':     'spin 0.65s linear infinite',
        'dot-bounce':    'dot-bounce 1.2s ease-in-out infinite',
        'fade-in':       'fade-in 200ms ease-out',
        'slide-up':      'slide-up 350ms cubic-bezier(0, 0, 0.2, 1)',
        'slide-left':    'slide-left 300ms cubic-bezier(0, 0, 0.2, 1)',
        'scale-in':      'scale-in 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'cta-pulse':     'cta-hero-pulse 3s ease-in-out infinite',
        'icon-float':    'icon-float 3s ease-in-out infinite',
        'gradient-flow': 'gradient-shift 8s ease infinite',
        'ken-burns':     'ken-burns 12s ease-in-out infinite alternate',
        'wave':          'wave-move 6s linear infinite',
        'bell-ring':     'bell-ring 600ms cubic-bezier(0.36, 0.07, 0.19, 0.97) both',
        'blob-drift':    'blob-drift 8s ease-in-out infinite alternate',
        'salt-float':    'salt-float 6s ease-in-out infinite',
        'processing':    'processing-pulse 1.5s ease-in-out infinite',
        'badge-pulse':   'badge-pulse 2s ease-in-out infinite',
      },

      keyframes: {
        'skeleton-shimmer': {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: 'calc(400px + 100%) 0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-left': {
          from: { opacity: '0', transform: 'translateX(8px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { transform: 'scale(0.92)', opacity: '0' },
          to:   { transform: 'scale(1)', opacity: '1' },
        },
        'cta-hero-pulse': {
          '0%, 100%': { boxShadow: '0 4px 8px rgba(11,125,110,0.20)' },
          '50%': { boxShadow: '0 4px 8px rgba(11,125,110,0.20), 0 0 0 6px rgba(11,125,110,0.12), 0 0 0 12px rgba(11,125,110,0.06)' },
        },
        'icon-float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-6px)' },
        },
        'gradient-shift': {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'ken-burns': {
          '0%':   { transform: 'scale(1.0) translate(0, 0)' },
          '100%': { transform: 'scale(1.12) translate(-2%, 1%)' },
        },
        'wave-move': {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
        'bell-ring': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '10%, 50%, 90%': { transform: 'rotate(15deg)' },
          '30%, 70%': { transform: 'rotate(-12deg)' },
        },
        'blob-drift': {
          from: { transform: 'translate(0, 0) scale(1)' },
          to:   { transform: 'translate(30px, -20px) scale(1.08)' },
        },
        'salt-float': {
          '0%':   { transform: 'translateY(0) rotate(0deg)', opacity: '0' },
          '10%':  { opacity: '0.6' },
          '90%':  { opacity: '0.4' },
          '100%': { transform: 'translateY(-100px) rotate(180deg)', opacity: '0' },
        },
        'processing-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.5' },
        },
        'badge-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%':       { transform: 'scale(1.15)' },
        },
        'dot-bounce': {
          '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: '0.4' },
          '40%':            { transform: 'scale(1.0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}

export default config
```

---

## 37. globals.css (Final — Teal-First)

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* ─── CSS Design Tokens ─────────────────────────── */
:root {
  /* PRIMARY — Teal */
  --color-primary:       #0B7D6E;
  --color-primary-hover: #0F9E8B;
  --color-primary-dark:  #085E52;
  --color-primary-light: #E6FAF8;

  /* DARK — Ink */
  --color-dark:          #173F3A;
  --color-dark-surface:  #0A1E1C;

  /* ACCENT — Sand */
  --color-accent:        #8A6535;
  --color-accent-light:  #FAF6EF;

  /* Surface */
  --bg-page:     #F9FAFB;
  --bg-surface:  #FFFFFF;
  --bg-subtle:   #F3F4F6;

  /* Text */
  --text-primary:   #111827;
  --text-secondary: #4B5563;
  --text-muted:     #9CA3AF;

  /* Border */
  --border-default: #E5E7EB;
  --border-brand:   #0B7D6E;
  --border-error:   #DC2626;

  /* Focus */
  --ring-focus:       0 0 0 2px #FFFFFF, 0 0 0 4px #0B7D6E;
  --ring-focus-dark:  0 0 0 2px rgba(0,0,0,0.2), 0 0 0 4px #52D6C4;
  --ring-focus-error: 0 0 0 2px #FFFFFF, 0 0 0 4px #DC2626;

  /* Motion */
  --dur-fast:     100ms;
  --dur-normal:   150ms;
  --dur-moderate: 200ms;
  --dur-slow:     300ms;
  --ease-out:     cubic-bezier(0, 0, 0.2, 1);
  --ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Dark mode (admin panel) */
.dark {
  --bg-page:     #0A1E1C;
  --bg-surface:  #102E2B;
  --bg-subtle:   #1F5249;
  --text-primary:   #F0FDFA;
  --text-secondary: #6DB8AD;
  --text-muted:     #3D8C80;
  --border-default: #1F5249;
  --color-primary:  #1BBFAA;
}

/* ─── Base ───────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; }

html {
  font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

body {
  background: var(--bg-page);
  color: var(--text-primary);
}

/* ─── Focus ─────────────────────────────────────── */
*:focus { outline: none; }

*:focus-visible {
  outline: none;
  box-shadow: var(--ring-focus);
  border-radius: 4px;
}

/* ─── Scrollbar ──────────────────────────────────── */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: #D1D5DB;
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover { background: #9CA3AF; }

/* ─── Skeleton ───────────────────────────────────── */
.skeleton {
  background: linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 37%, #F3F4F6 63%);
  background-size: 400px 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
  border-radius: 6px;
}

.skeleton-teal {
  background: linear-gradient(90deg, #C7F2EE 25%, #93E7DC 37%, #C7F2EE 63%);
  background-size: 400px 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
}

/* ─── Monospace tech ─────────────────────────────── */
.mono-tech {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 0.8125rem;
  color: #374151;
}

/* ─── Reveal animations ──────────────────────────── */
.reveal-up {
  opacity: 0;
  transform: translateY(32px);
  transition: opacity 500ms var(--ease-out), transform 500ms var(--ease-out);
}
.reveal-up.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.reveal-scale {
  opacity: 0;
  transform: scale(0.93);
  transition: opacity 400ms var(--ease-out), transform 400ms var(--ease-out);
}
.reveal-scale.is-visible {
  opacity: 1;
  transform: scale(1);
}

/* ─── Nav underline ──────────────────────────────── */
.nav-underline {
  position: relative;
}
.nav-underline::after {
  content: '';
  position: absolute;
  bottom: -2px; left: 0; right: 0;
  height: 2px;
  background: #0B7D6E;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 200ms var(--ease-out);
  border-radius: 2px;
}
.nav-underline:hover::after,
.nav-underline.active::after {
  transform: scaleX(1);
}

/* ─── Accordion grid trick ───────────────────────── */
.accordion-body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 250ms var(--ease-out);
}
.accordion-body.is-open {
  grid-template-rows: 1fr;
}
.accordion-inner { overflow: hidden; }

/* ─── Page transition ────────────────────────────── */
.page-transition {
  animation: slide-up 350ms var(--ease-out);
}

/* ─── Link animated ──────────────────────────────── */
.link-animated {
  position: relative;
  color: #0B7D6E;
  text-decoration: none;
}
.link-animated::after {
  content: '';
  position: absolute;
  bottom: -1px; left: 0;
  width: 100%; height: 1.5px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 200ms var(--ease-out);
}
.link-animated:hover::after {
  transform: scaleX(1);
  transform-origin: left;
}

/* ─── Gradient animated background ──────────────── */
.bg-brand-animated {
  background: linear-gradient(135deg, #064038, #0B7D6E, #0F9E8B, #085E52);
  background-size: 300% 300%;
  animation: gradient-shift 8s ease infinite;
}

/* ─── Salt particles ─────────────────────────────── */
.salt-particles { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.salt-particle {
  position: absolute;
  background: rgba(255,255,255,0.6);
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  animation: salt-float var(--salt-dur, 6s) var(--salt-delay, 0s) ease-in-out infinite;
}

/* ─── Reading progress bar ───────────────────────── */
.reading-progress {
  position: fixed;
  top: 0; left: 0;
  height: 3px;
  background: linear-gradient(90deg, #0B7D6E, #1BBFAA);
  border-radius: 0 3px 3px 0;
  z-index: 9999;
  transition: width 50ms linear;
}

/* ─── Dot grid pattern ───────────────────────────── */
.bg-dot-grid::before {
  content: '';
  position: absolute; inset: 0;
  background-image: radial-gradient(circle at 1px 1px, rgba(11,125,110,0.1) 1px, transparent 0);
  background-size: 24px 24px;
  animation: dot-grid-drift 20s linear infinite;
  pointer-events: none;
}
@keyframes dot-grid-drift {
  from { background-position: 0 0; }
  to   { background-position: 24px 24px; }
}

/* ─── Image hover effects ────────────────────────── */
.img-zoom { transition: transform 500ms cubic-bezier(0.4, 0, 0.2, 1); }
.img-zoom-container:hover .img-zoom { transform: scale(1.05); }

.img-teal-overlay { position: absolute; inset: 0; background: #0B7D6E; mix-blend-mode: multiply; opacity: 0; transition: opacity 300ms; }
.img-teal-container:hover .img-teal-overlay { opacity: 0.3; }

/* ─── Prose (artikel) ────────────────────────────── */
.prose-brand {
  --tw-prose-headings: #173F3A;
  --tw-prose-links: #0B7D6E;
  --tw-prose-bold: #111827;
  --tw-prose-body: #374151;
  --tw-prose-quote-borders: #C7F2EE;
  --tw-prose-code: #085E52;
  --tw-prose-code-bg: #E6FAF8;
}

/* ─── Reduced motion ─────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .skeleton, .skeleton-teal { animation: none !important; background: #F3F4F6 !important; }
  [data-parallax]     { transform: none !important; }
  .salt-particles     { display: none !important; }
  .blob-container     { display: none !important; }
  .bg-brand-animated  { animation: none !important; }
  .bg-dot-grid::before { animation: none !important; }
}
```

---

## 38. Panduan AI Agent

### 38.1 Instruksi untuk Claude, Cursor, Copilot

Ketika menghasilkan kode UI untuk CV Reka Cipta Indonesia:

1. **Warna primer adalah `brand-teal-600` (#0B7D6E)** — bukan navy, bukan biru generik
2. **Heading dan dark elements** menggunakan `ink-700` (#173F3A) — bukan `neutral-900`
3. **Aksen warm** menggunakan `sand-600` (#8A6535) — untuk supplier section, badge premium
4. **Semua button primary** class: `bg-brand-teal-600 hover:bg-brand-teal-500 text-white`
5. **Focus ring** wajib: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-teal-600`
6. **Active state** wajib: `active:scale-[0.97] active:transition-none`
7. **Animasi masuk** elemen: class `reveal-up` + JavaScript IntersectionObserver
8. **Skeleton** loading: class `.skeleton` dari globals.css
9. **Font stack**: `font-sans` (Plus Jakarta Sans), `font-mono` (JetBrains Mono untuk nilai teknis)

### 38.2 Cheat Sheet Token Paling Sering

```
/* Heading */          text-ink-700 text-4xl font-bold tracking-tight
/* Body text */        text-neutral-700 text-base leading-relaxed
/* Section label */    text-brand-teal-600 text-xs font-semibold uppercase tracking-wider
/* Link */             text-brand-teal-600 hover:text-brand-teal-700 link-animated

/* Button primary */   bg-brand-teal-600 hover:bg-brand-teal-500 active:bg-brand-teal-700
                       text-white font-semibold rounded-md shadow-sm hover:shadow-md
                       transition-all duration-100 ease-decelerate active:scale-[0.97]
                       focus-visible:outline-none focus-visible:shadow-focus

/* Button outline */   border-2 border-brand-teal-600 text-brand-teal-700
                       hover:bg-brand-teal-50 active:bg-brand-teal-100 rounded-md

/* Input */            border border-neutral-300 rounded focus:border-brand-teal-600
                       focus:shadow-focus focus:outline-none bg-white text-neutral-900
                       placeholder:text-neutral-400 px-3.5 py-2.5 text-sm
                       hover:border-neutral-400 transition-colors duration-100

/* Card */             bg-white border border-neutral-200 rounded-lg shadow-sm
                       hover:shadow-md hover:-translate-y-0.5 hover:border-teal-200
                       transition-all duration-150 ease-decelerate

/* Badge SNI */        bg-brand-teal-100 text-brand-teal-800 border border-teal-200
                       rounded-full px-2.5 py-0.5 text-xs font-semibold

/* Badge Sand */       bg-sand-100 text-sand-700 border border-sand-300
                       rounded-full px-2.5 py-0.5 text-xs font-semibold

/* Skeleton */         skeleton (class dari globals.css)
/* Page bg */          bg-neutral-50
/* Surface/card */     bg-white
/* Section teal */     bg-brand-teal-50
/* Section sand */     bg-sand-50
/* Sidebar dark */     bg-ink-900
```

### 38.3 Konvensi Folder Komponen

```
/components/
  /ui/          ← shadcn/ui base components (jangan edit langsung)
  /brand/       ← komponen yang menggunakan brand tokens secara spesifik
    Button.tsx, Card.tsx, Badge.tsx, etc.
  /sections/    ← section-level halaman publik
    HeroSection.tsx, ProductsSection.tsx, CTASection.tsx
  /blocks/      ← reusable content blocks
    ProductCard.tsx, TeamMember.tsx, StatCard.tsx
  /forms/       ← form kompleks
    RFQForm.tsx, SupplierForm.tsx
  /animations/  ← komponen animasi
    SaltParticles.tsx, AnimatedCounter.tsx, RevealText.tsx
  /layout/      ← layout global
    Navbar.tsx, Footer.tsx, AdminSidebar.tsx
  /admin/       ← admin panel components
    LeadCard.tsx, LeadKanban.tsx, ProposalPreview.tsx
```

---

*Design System v2.0 | CV Reka Cipta Indonesia | Mei 2026*
*Direvisi dari v1.0: Warna dasar teal-first + motion system expanded (23 subseksi motion)*
*Fondasi: Brand Foundation Document v1.0*
*Untuk pertanyaan: koordinasikan dengan developer utama sebelum override token*

