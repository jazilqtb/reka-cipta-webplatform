# E1-UX-08 — Loading Skeleton Pattern Library
## CV Reka Cipta Indonesia · Web Platform

> **Task:** E1-UX-08  
> **Layer:** 1 — UX & Information Architecture  
> **Priority:** 🔵 LOW  
> **Tags:** `Design` · `Frontend`  
> **Status:** Implementation Spec — Siap dikerjakan  
> **Dikerjakan setelah:** E1-SPIKE-06 (shadcn/ui terinstall), E1-ENG-02 (Tailwind terkonfigurasi)  
> **Dikonsumsi oleh:** E1-ENG-26 (Engineering sub-task implementasi)

---

## 1. Tujuan & Konteks

Skeleton loading components adalah komponen UI yang menampilkan *placeholder visual* yang menyerupai bentuk konten nyata saat data sedang di-fetch dari API atau sedang diproses. Ini adalah bagian dari prinsip desain **"Responsif pada Setiap Sentuhan"** dari Design System v2.0: tidak ada *dead zone*, pengguna selalu mendapat feedback visual bahwa sistem bekerja.

### Mengapa Skeleton Penting untuk Reka Cipta

Platform ini melakukan beberapa fetch async yang visible kepada pengguna:

| Halaman / Komponen | Data yang Di-fetch | Skeleton yang Dipakai |
|---|---|---|
| Halaman Produk (`/produk`) | 5 produk dari Supabase | `CardSkeleton` × 5 |
| Halaman Artikel (`/artikel`) | Daftar artikel blog | `CardSkeleton` × 3–6 |
| Detail Produk (`/produk/[slug]`) | Data produk tunggal | `ImageSkeleton` + `TextLineSkeleton` |
| Admin — Tabel Leads | Daftar leads dari API | `TableRowSkeleton` × 8 |
| Admin — Tabel Supplier | Data supplier | `TableRowSkeleton` × 6 |
| Hero Stats Bar | Angka statistik | `TextLineSkeleton` |
| Artikel terkait (sidebar) | Related articles | `CardSkeleton` × 2 |

Tanpa skeleton, semua halaman di atas akan menampilkan blank space atau flash layout saat data datang — pengalaman yang terasa tidak polished dan berpotensi merusak first impression kepada calon mitra B2B.

---

## 2. Referensi Design Token

Semua nilai visual di bawah ini berasal dari **Design System v2.0** dan **`tailwind.config.ts`** yang sudah terkonfigurasi. Engineer **tidak perlu** mendefinisikan warna baru.

### 2.1 Warna Skeleton

```
// Variant default (neutral)
Shimmer light : #F3F4F6   → neutral-100
Shimmer dark  : #E5E7EB   → neutral-200

// Variant teal (untuk background section teal / brand-teal-50)
Shimmer light : #C7F2EE   → brand-teal-100
Shimmer dark  : #93E7DC   → brand-teal-200
```

### 2.2 Border Radius

```
Border radius default : 6px    (rounded, --DEFAULT di tailwind)
Border radius card    : 12px   (rounded-lg)
Border radius image   : 8px    (rounded-md)
Border radius text    : 6px    (rounded)
Border radius full    : 9999px (rounded-full) — untuk avatar/badge
```

### 2.3 CSS Classes Tersedia (dari `globals.css` §7)

```css
/* Sudah tersedia — JANGAN redeclare */
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
  border-radius: 6px;
}
```

---

## 3. Spesifikasi Animasi

### 3.1 Animasi Utama: Horizontal Shimmer

Design System v2.0 mendefinisikan animasi skeleton sebagai **shimmer horizontal** (bukan pulse sederhana). Ini memberikan ilusi gerakan yang lebih natural — seperti cahaya yang bergerak di atas permukaan kristal garam, selaras dengan identitas visual brand Reka Cipta.

```css
/* Keyframe sudah terdefinisi di tailwind.config.ts */
'skeleton-shimmer': {
  '0%':   { backgroundPosition: '-400px 0' },
  '100%': { backgroundPosition: 'calc(400px + 100%) 0' },
}

/* Duration & easing */
Duration : 1.4s
Easing   : ease-in-out
Iteration: infinite
```

### 3.2 Alternatif: Pulse (Fallback Sederhana)

Jika dibutuhkan skeleton di luar konteks yang sudah ada CSS class-nya, ada juga `processing-pulse` dari Tailwind config:

```css
/* Tailwind animation token */
animation-processing: processing-pulse 1.5s ease-in-out infinite;

/* Keyframe */
'processing-pulse': {
  '0%, 100%': { opacity: '1' },
  '50%':      { opacity: '0.5' },
}
```

> **Keputusan arsitektur:** Gunakan **shimmer sebagai default** di semua komponen skeleton ini. Pulse hanya sebagai fallback jika ada kasus khusus yang tidak bisa menggunakan shimmer (misal: elemen dengan `overflow: hidden` yang memotong shimmer pada width yang sangat kecil).

### 3.3 Reduced Motion

Sesuai **§23 Design System** dan **`globals.css` §20**, semua animasi skeleton secara otomatis dinonaktifkan ketika `prefers-reduced-motion: reduce` aktif:

```css
@media (prefers-reduced-motion: reduce) {
  .skeleton,
  .skeleton-teal {
    animation: none !important;
    background: #F3F4F6 !important;  /* Static neutral background */
  }
}
```

**Tidak ada kode tambahan yang diperlukan** — ini sudah di-handle oleh `globals.css` yang ada.

---

## 4. Arsitektur Komponen

### 4.1 Struktur File

```
/components/
  /ui/
    /skeletons/
      index.ts              ← Barrel export semua skeleton
      TextLineSkeleton.tsx  ← Variant: satu baris teks
      ImageSkeleton.tsx     ← Variant: image placeholder
      CardSkeleton.tsx      ← Variant: card lengkap
      TableRowSkeleton.tsx  ← Variant: baris tabel
```

> **Catatan:** Folder `/components/ui/skeletons/` adalah subdirectory baru di dalam `/components/ui/`. Komponen shadcn/ui base (`<Skeleton />`) berada di `/components/ui/skeleton.tsx` (auto-generated oleh shadcn init).

### 4.2 Dependency Graph

```
shadcn/ui <Skeleton />          ← Base primitive (sudah terinstall via E1-ENG-02)
       │
       ├── TextLineSkeleton.tsx
       ├── ImageSkeleton.tsx
       ├── CardSkeleton.tsx     (uses ImageSkeleton + TextLineSkeleton internally)
       └── TableRowSkeleton.tsx
                │
             index.ts (barrel export)
```

### 4.3 Design Principles Implementasi

1. **Composable** — `CardSkeleton` tidak menulis ulang kode; ia menggunakan `ImageSkeleton` dan `TextLineSkeleton` yang sudah ada.
2. **Typed** — Semua props menggunakan TypeScript dengan nilai default yang sensibel.
3. **Accessible** — Semua skeleton menggunakan `aria-busy="true"` dan `aria-label` yang tepat.
4. **Token-first** — Tidak ada hardcoded color; semua merujuk ke CSS class atau Tailwind token.
5. **Shadcn-based** — Semua menggunakan `<Skeleton />` dari shadcn sebagai base primitive, override dengan `.skeleton` CSS class untuk shimmer animation.

---

## 5. Spesifikasi Per Komponen

---

### 5.1 `TextLineSkeleton`

**Deskripsi:** Placeholder untuk satu baris teks. Bisa digunakan standalone untuk heading, label, atau dirangkai untuk paragraf.

**Visual Reference:**
```
full  : ████████████████████████████████████████  ← 100%
wide  : ███████████████████████████████           ← 75%
mid   : ██████████████████████                    ← 50%
short : ████████████████                          ← 33%
```

**Props:**

| Prop | Type | Default | Keterangan |
|---|---|---|---|
| `width` | `'full' \| 'wide' \| 'mid' \| 'short' \| string` | `'full'` | Lebar skeleton |
| `height` | `'sm' \| 'base' \| 'lg' \| 'xl' \| string` | `'base'` | Tinggi sesuai skala teks |
| `variant` | `'default' \| 'teal'` | `'default'` | Warna shimmer |
| `className` | `string` | `undefined` | Tailwind class override |

**Height Map:**
```
'sm'   → h-3   (12px) — untuk caption/overline
'base' → h-3.5 (14px) — untuk body text (DEFAULT)
'lg'   → h-4   (16px) — untuk subheading
'xl'   → h-5   (20px) — untuk heading section
'2xl'  → h-6   (24px) — untuk heading halaman
```

**Width Map:**
```
'full'  → w-full   (100%)
'wide'  → w-3/4    (75%)
'mid'   → w-1/2    (50%)
'short' → w-1/3    (33%)
```

> Jika value string selain opsi di atas diberikan (misal: `width="60%"`), akan di-apply langsung ke inline style.

---

### 5.2 `ImageSkeleton`

**Deskripsi:** Placeholder untuk gambar/foto. Menampilkan area kosong beranimasi dengan aspect ratio yang terjaga.

**Visual Reference:**
```
aspect-16/9:
┌─────────────────────────────────────┐
│                                     │
│            ░░░░░░░░░░░              │ ← 9/16 dari lebar
│                                     │
└─────────────────────────────────────┘

aspect-1/1 (square):
┌───────────┐
│           │
│  ░░░░░░░  │ ← sama dengan lebar
│           │
└───────────┘
```

**Props:**

| Prop | Type | Default | Keterangan |
|---|---|---|---|
| `aspect` | `'16/9' \| '1/1' \| '4/3' \| '3/2'` | `'16/9'` | Aspect ratio |
| `variant` | `'default' \| 'teal'` | `'default'` | Warna shimmer |
| `rounded` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Border radius |
| `className` | `string` | `undefined` | Tailwind class override |

**Aspect Ratio Map (menggunakan Tailwind `aspect-` utility):**
```
'16/9' → aspect-video  (class Tailwind)
'1/1'  → aspect-square (class Tailwind)
'4/3'  → aspect-[4/3]
'3/2'  → aspect-[3/2]
```

---

### 5.3 `CardSkeleton`

**Deskripsi:** Placeholder untuk card konten lengkap — digunakan untuk `ProductCard`, `ArticleCard`, atau card umum lainnya. Menyerupai struktur card sesungguhnya secara visual.

**Visual Reference:**
```
┌─────────────────────────────────────┐
│                                     │
│           [Image 16:9]              │ ← ImageSkeleton
│                                     │
├─────────────────────────────────────┤
│  ░░░░░░░░░░░░░░░░░░░░░              │ ← TextLine (75%, xl)
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░     │ ← TextLine (100%, base)
│  ░░░░░░░░░░░░░░░░░░░              │ ← TextLine (50%, base)
│  ░░░░░░░░░░░░░░░░                   │ ← TextLine (33%, sm) — opsional badge/label
└─────────────────────────────────────┘
```

**Props:**

| Prop | Type | Default | Keterangan |
|---|---|---|---|
| `imageAspect` | `'16/9' \| '1/1' \| '4/3'` | `'16/9'` | Aspect ratio image placeholder |
| `lines` | `number` | `3` | Jumlah text line (1–5) |
| `showFooter` | `boolean` | `false` | Tampilkan baris footer (badge/label) |
| `variant` | `'default' \| 'teal'` | `'default'` | Warna shimmer |
| `className` | `string` | `undefined` | Tailwind class override |

> **Catatan:** `lines` mengontrol jumlah `TextLineSkeleton` di bawah image. Default 3 sesuai dengan struktur `ProductCard` dan `ArticleCard` yang ada (judul + 2 baris deskripsi). Maksimum 5 untuk mencegah card terlalu tinggi.

---

### 5.4 `TableRowSkeleton`

**Deskripsi:** Placeholder untuk satu baris tabel di Admin Panel. Dirancang untuk tabel Leads, Supplier, Produk, dan Artikel di CRM.

**Visual Reference:**
```
┌──────────┬─────────────────┬──────────────┬───────────┬───────────┐
│ ░░░░░░░  │  ░░░░░░░░░░░░   │  ░░░░░░░░░   │  ░░░░░░   │  ░░░░░░   │
└──────────┴─────────────────┴──────────────┴───────────┴───────────┘
           h-12 (48px)
```

**Props:**

| Prop | Type | Default | Keterangan |
|---|---|---|---|
| `columns` | `number` | `5` | Jumlah kolom (sesuai tabel target) |
| `columnWidths` | `string[]` | `auto-calculated` | Array width per kolom misal `['10%','30%','20%','20%','20%']` |
| `variant` | `'default' \| 'teal'` | `'default'` | Warna shimmer |
| `className` | `string` | `undefined` | Tailwind class override |

**Panduan `columnWidths` per tabel:**

```
Tabel Leads:
  Col 1 (No/ID)           → 8%
  Col 2 (Nama Perusahaan) → 28%
  Col 3 (Kontak)          → 20%
  Col 4 (Status)          → 16%
  Col 5 (Tgl Masuk)       → 28%

Tabel Supplier:
  Col 1 (Nama/Usaha)      → 30%
  Col 2 (Lokasi)          → 25%
  Col 3 (Produk)          → 20%
  Col 4 (Status)          → 15%
  Col 5 (Aksi)            → 10%

Tabel Produk:
  Col 1 (Foto)            → 10%
  Col 2 (Nama Produk)     → 35%
  Col 3 (Kategori)        → 20%
  Col 4 (Status)          → 15%
  Col 5 (Aksi)            → 20%
```

> Jika `columnWidths` tidak diberikan, lebar tiap kolom adalah `100% / columns`.

---

## 6. Implementasi Kode Lengkap

### 6.0 Prerequisite: Shadcn `<Skeleton />` Base

Pastikan shadcn Skeleton sudah terinstall (dari E1-ENG-02). File ini seharusnya sudah ada di:

**`/components/ui/skeleton.tsx`** (auto-generated oleh shadcn)

```tsx
// /components/ui/skeleton.tsx
// Auto-generated by: npx shadcn@latest add skeleton
// JANGAN EDIT FILE INI — edit di wrapper komponen kita

import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
```

> **Catatan penting:** Kita tidak akan menggunakan `animate-pulse` dari shadcn secara langsung. Wrapper component kita akan menggunakan CSS class `.skeleton` dari `globals.css` (shimmer) yang lebih sesuai dengan Design System v2.0. Namun kita tetap menggunakan shadcn `<Skeleton />` sebagai base DOM element agar tetap konsisten dengan penggunaan shadcn di seluruh project.

---

### 6.1 `TextLineSkeleton.tsx`

```tsx
/**
 * TextLineSkeleton.tsx
 * ─────────────────────────────────────────────────
 * CV Reka Cipta Indonesia — Design System v2.0
 * Task: E1-UX-08 (via E1-ENG-26)
 *
 * Skeleton placeholder untuk satu baris teks.
 * Menggunakan class .skeleton dari globals.css (shimmer animation).
 * ─────────────────────────────────────────────────
 */

import { cn } from "@/lib/utils"

// ── Types ────────────────────────────────────────

type TextWidth = 'full' | 'wide' | 'mid' | 'short' | string
type TextHeight = 'sm' | 'base' | 'lg' | 'xl' | '2xl' | string
type SkeletonVariant = 'default' | 'teal'

interface TextLineSkeletonProps {
  /** Lebar skeleton: 'full'=100%, 'wide'=75%, 'mid'=50%, 'short'=33%, atau CSS value */
  width?: TextWidth
  /** Tinggi sesuai text scale: 'sm'=12px, 'base'=14px, 'lg'=16px, 'xl'=20px, '2xl'=24px */
  height?: TextHeight
  /** Variant warna: 'default'=neutral, 'teal'=brand teal */
  variant?: SkeletonVariant
  className?: string
}

// ── Width Map ────────────────────────────────────

const WIDTH_MAP: Record<string, string> = {
  full:  'w-full',
  wide:  'w-3/4',
  mid:   'w-1/2',
  short: 'w-1/3',
}

const HEIGHT_MAP: Record<string, string> = {
  sm:   'h-3',    // 12px
  base: 'h-3.5',  // 14px — DEFAULT
  lg:   'h-4',    // 16px
  xl:   'h-5',    // 20px
  '2xl':'h-6',    // 24px
}

// ── Component ────────────────────────────────────

export function TextLineSkeleton({
  width = 'full',
  height = 'base',
  variant = 'default',
  className,
}: TextLineSkeletonProps) {
  // Resolve width: named token atau raw CSS value
  const widthClass = WIDTH_MAP[width] ?? undefined
  const widthStyle = !WIDTH_MAP[width] ? { width } : undefined

  // Resolve height: named token atau raw CSS value
  const heightClass = HEIGHT_MAP[height] ?? undefined
  const heightStyle = !HEIGHT_MAP[height] ? { height } : undefined

  const shimmerClass = variant === 'teal' ? 'skeleton-teal' : 'skeleton'

  return (
    <div
      className={cn(
        shimmerClass,
        widthClass,
        heightClass,
        className
      )}
      style={{ ...widthStyle, ...heightStyle }}
      role="status"
      aria-label="Memuat konten..."
      aria-busy="true"
    />
  )
}
```

---

### 6.2 `ImageSkeleton.tsx`

```tsx
/**
 * ImageSkeleton.tsx
 * ─────────────────────────────────────────────────
 * CV Reka Cipta Indonesia — Design System v2.0
 * Task: E1-UX-08 (via E1-ENG-26)
 *
 * Skeleton placeholder untuk gambar/foto dengan
 * aspect ratio yang terjaga.
 * ─────────────────────────────────────────────────
 */

import { cn } from "@/lib/utils"

// ── Types ────────────────────────────────────────

type AspectRatio = '16/9' | '1/1' | '4/3' | '3/2'
type RoundedSize = 'none' | 'sm' | 'md' | 'lg' | 'xl'
type SkeletonVariant = 'default' | 'teal'

interface ImageSkeletonProps {
  /** Aspect ratio container: '16/9', '1/1', '4/3', atau '3/2' */
  aspect?: AspectRatio
  /** Border radius */
  rounded?: RoundedSize
  /** Variant warna: 'default'=neutral, 'teal'=brand teal */
  variant?: SkeletonVariant
  className?: string
}

// ── Aspect Ratio Map ─────────────────────────────

const ASPECT_MAP: Record<AspectRatio, string> = {
  '16/9': 'aspect-video',    // Tailwind built-in: 16/9
  '1/1':  'aspect-square',   // Tailwind built-in: 1/1
  '4/3':  'aspect-[4/3]',    // Custom ratio
  '3/2':  'aspect-[3/2]',    // Custom ratio
}

const ROUNDED_MAP: Record<RoundedSize, string> = {
  none: 'rounded-none',
  sm:   'rounded-sm',     // 4px
  md:   'rounded-md',     // 8px — DEFAULT
  lg:   'rounded-lg',     // 12px
  xl:   'rounded-xl',     // 16px
}

// ── Component ────────────────────────────────────

export function ImageSkeleton({
  aspect = '16/9',
  rounded = 'md',
  variant = 'default',
  className,
}: ImageSkeletonProps) {
  const shimmerClass = variant === 'teal' ? 'skeleton-teal' : 'skeleton'

  return (
    <div
      className={cn(
        shimmerClass,
        ASPECT_MAP[aspect],
        ROUNDED_MAP[rounded],
        'w-full',
        className
      )}
      role="status"
      aria-label="Memuat gambar..."
      aria-busy="true"
    />
  )
}
```

---

### 6.3 `CardSkeleton.tsx`

```tsx
/**
 * CardSkeleton.tsx
 * ─────────────────────────────────────────────────
 * CV Reka Cipta Indonesia — Design System v2.0
 * Task: E1-UX-08 (via E1-ENG-26)
 *
 * Skeleton placeholder untuk card konten lengkap.
 * Menyerupai struktur ProductCard dan ArticleCard.
 * Digunakan di /produk, /artikel, dan halaman terkait.
 * ─────────────────────────────────────────────────
 */

import { cn } from "@/lib/utils"
import { ImageSkeleton } from "./ImageSkeleton"
import { TextLineSkeleton } from "./TextLineSkeleton"

// ── Types ────────────────────────────────────────

type AspectRatio = '16/9' | '1/1' | '4/3'
type SkeletonVariant = 'default' | 'teal'

interface CardSkeletonProps {
  /** Aspect ratio image placeholder di bagian atas card */
  imageAspect?: AspectRatio
  /** Jumlah text line di bawah image (1–5) */
  lines?: number
  /** Tampilkan baris footer (misal: badge/label placeholder) */
  showFooter?: boolean
  /** Variant warna shimmer */
  variant?: SkeletonVariant
  className?: string
}

// ── Text Line Config ──────────────────────────────
// Pola lebar text line menyerupai struktur card nyata:
// Baris 1 = judul (wide/75%)
// Baris 2 = deskripsi pertama (full)
// Baris 3 = deskripsi kedua (mid/50%)
// Baris 4 = detail tambahan (wide)
// Baris 5 = tag/info akhir (short/33%)

const LINE_PATTERNS: Array<{
  width: 'full' | 'wide' | 'mid' | 'short'
  height: 'sm' | 'base' | 'lg' | 'xl'
}> = [
  { width: 'wide',  height: 'xl'   }, // Judul
  { width: 'full',  height: 'base' }, // Deskripsi 1
  { width: 'mid',   height: 'base' }, // Deskripsi 2
  { width: 'wide',  height: 'base' }, // Detail
  { width: 'short', height: 'sm'   }, // Tag/info
]

// ── Component ────────────────────────────────────

export function CardSkeleton({
  imageAspect = '16/9',
  lines = 3,
  showFooter = false,
  variant = 'default',
  className,
}: CardSkeletonProps) {
  // Clamp lines antara 1 dan 5
  const lineCount = Math.min(Math.max(lines, 1), 5)
  const activeLines = LINE_PATTERNS.slice(0, lineCount)

  return (
    <div
      className={cn(
        'bg-white border border-neutral-200 rounded-lg overflow-hidden',
        'shadow-sm',
        className
      )}
      role="status"
      aria-label="Memuat card konten..."
      aria-busy="true"
    >
      {/* Image Placeholder */}
      <ImageSkeleton
        aspect={imageAspect}
        rounded="none"       // Card image tidak pakai border-radius (kontainer card sudah ada)
        variant={variant}
      />

      {/* Content Body */}
      <div className="p-4 flex flex-col gap-2.5">
        {activeLines.map((line, index) => (
          <TextLineSkeleton
            key={index}
            width={line.width}
            height={line.height}
            variant={variant}
          />
        ))}

        {/* Optional Footer: badge/label area */}
        {showFooter && (
          <div className="flex items-center gap-2 mt-1 pt-3 border-t border-neutral-100">
            {/* Badge placeholder */}
            <div className={cn(
              variant === 'teal' ? 'skeleton-teal' : 'skeleton',
              'h-5 w-16 rounded-full'
            )} />
            {/* Secondary badge */}
            <div className={cn(
              variant === 'teal' ? 'skeleton-teal' : 'skeleton',
              'h-5 w-12 rounded-full'
            )} />
          </div>
        )}
      </div>
    </div>
  )
}
```

---

### 6.4 `TableRowSkeleton.tsx`

```tsx
/**
 * TableRowSkeleton.tsx
 * ─────────────────────────────────────────────────
 * CV Reka Cipta Indonesia — Design System v2.0
 * Task: E1-UX-08 (via E1-ENG-26)
 *
 * Skeleton placeholder untuk satu baris tabel
 * di Admin Panel (CRM).
 * Tinggi 48px sesuai spesifikasi E1-UX-08.
 * ─────────────────────────────────────────────────
 */

import { cn } from "@/lib/utils"

// ── Types ────────────────────────────────────────

type SkeletonVariant = 'default' | 'teal'

interface TableRowSkeletonProps {
  /** Jumlah kolom */
  columns?: number
  /** Array lebar per kolom. Jika tidak diisi, lebar equal dibagi rata. */
  columnWidths?: string[]
  /** Variant warna shimmer */
  variant?: SkeletonVariant
  className?: string
}

// ── Preset Column Configs ─────────────────────────

export const TABLE_COLUMN_PRESETS = {
  /**
   * Tabel Leads (Admin CRM)
   * No | Nama Perusahaan | Kontak | Status | Tgl Masuk
   */
  leads: ['8%', '28%', '20%', '16%', '28%'],

  /**
   * Tabel Supplier
   * Nama/Usaha | Lokasi | Produk | Status | Aksi
   */
  supplier: ['30%', '25%', '20%', '15%', '10%'],

  /**
   * Tabel Produk
   * Foto | Nama Produk | Kategori | Status | Aksi
   */
  products: ['10%', '35%', '20%', '15%', '20%'],

  /**
   * Tabel Artikel
   * Thumbnail | Judul | Kategori | Status | Tgl
   */
  articles: ['10%', '40%', '20%', '15%', '15%'],
} as const

// ── Helpers ──────────────────────────────────────

function getColumnWidths(columns: number, widths?: string[]): string[] {
  if (widths && widths.length === columns) {
    return widths
  }
  // Equal distribution fallback
  const equal = `${Math.floor(100 / columns)}%`
  return Array(columns).fill(equal)
}

// ── Component ────────────────────────────────────

export function TableRowSkeleton({
  columns = 5,
  columnWidths,
  variant = 'default',
  className,
}: TableRowSkeletonProps) {
  const widths = getColumnWidths(columns, columnWidths)
  const shimmerClass = variant === 'teal' ? 'skeleton-teal' : 'skeleton'

  return (
    <div
      className={cn(
        'flex items-center',
        'h-12',                           // 48px — sesuai spesifikasi E1-UX-08
        'px-4',                           // Horizontal padding sejajar dengan table header
        'border-b border-neutral-100',    // Separator antar baris
        'bg-white',
        className
      )}
      role="status"
      aria-label="Memuat data baris..."
      aria-busy="true"
    >
      {widths.map((width, index) => (
        <div
          key={index}
          className="flex items-center pr-4"
          style={{ width }}
        >
          {/* Cell content skeleton — tinggi 14px menyerupai teks tabel */}
          <div
            className={cn(shimmerClass, 'h-3.5 w-4/5')}
          />
        </div>
      ))}
    </div>
  )
}
```

---

### 6.5 `index.ts` — Barrel Export

```ts
/**
 * /components/ui/skeletons/index.ts
 * ─────────────────────────────────────────────────
 * Barrel export untuk semua skeleton components.
 * Task: E1-UX-08
 *
 * Usage:
 *   import { CardSkeleton, TextLineSkeleton } from '@/components/ui/skeletons'
 * ─────────────────────────────────────────────────
 */

export { TextLineSkeleton }     from './TextLineSkeleton'
export { ImageSkeleton }        from './ImageSkeleton'
export { CardSkeleton }         from './CardSkeleton'
export { TableRowSkeleton, TABLE_COLUMN_PRESETS } from './TableRowSkeleton'

// Re-export types untuk penggunaan di luar
export type { } // intentionally empty — types diekspor via component files
```

---

## 7. Contoh Penggunaan

### 7.1 Halaman Produk — Grid Skeleton

```tsx
// /app/produk/page.tsx
// Digunakan saat data produk sedang di-fetch dari Supabase

import { Suspense } from 'react'
import { CardSkeleton } from '@/components/ui/skeletons'
import { ProductGrid } from '@/components/sections/ProductGrid'

// ── Loading Fallback ──────────────────────────────

function ProductGridSkeleton() {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      aria-label="Memuat katalog produk"
    >
      {/* 5 products — sesuai jumlah produk Reka Cipta */}
      {Array.from({ length: 5 }).map((_, i) => (
        <CardSkeleton
          key={i}
          imageAspect="16/9"
          lines={3}
          showFooter={true}    // Badge SNI placeholder
        />
      ))}
    </div>
  )
}

// ── Page ─────────────────────────────────────────

export default function ProdukPage() {
  return (
    <main>
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductGrid />
      </Suspense>
    </main>
  )
}
```

### 7.2 Halaman Artikel — Grid Skeleton

```tsx
// /app/artikel/page.tsx

import { CardSkeleton } from '@/components/ui/skeletons'

function ArticleGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <CardSkeleton
          key={i}
          imageAspect="16/9"
          lines={3}        // Judul + 2 baris excerpt
        />
      ))}
    </div>
  )
}
```

### 7.3 Admin — Tabel Leads

```tsx
// /app/admin/leads/page.tsx

import { TableRowSkeleton, TABLE_COLUMN_PRESETS } from '@/components/ui/skeletons'

function LeadsTableSkeleton() {
  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden">
      {/* Table Header (statis, tidak di-skeleton) */}
      <div className="flex items-center h-10 px-4 bg-neutral-50 border-b border-neutral-200">
        {['#', 'Nama Perusahaan', 'Kontak', 'Status', 'Tgl Masuk'].map(col => (
          <div
            key={col}
            className="pr-4 text-xs font-semibold text-neutral-500 uppercase tracking-wide"
            style={{ width: TABLE_COLUMN_PRESETS.leads[['#', 'Nama Perusahaan', 'Kontak', 'Status', 'Tgl Masuk'].indexOf(col)] }}
          >
            {col}
          </div>
        ))}
      </div>

      {/* Skeleton Rows */}
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRowSkeleton
          key={i}
          columns={5}
          columnWidths={[...TABLE_COLUMN_PRESETS.leads]}
        />
      ))}
    </div>
  )
}
```

### 7.4 TextLineSkeleton — Hero Stats Bar

```tsx
// Untuk Stats section di Homepage saat data sedang di-fetch

import { TextLineSkeleton } from '@/components/ui/skeletons'

function StatsSkeleton() {
  return (
    <div className="flex flex-wrap gap-8 justify-center">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <TextLineSkeleton width="short" height="2xl" />  {/* Angka besar */}
          <TextLineSkeleton width="mid" height="sm" />     {/* Label */}
        </div>
      ))}
    </div>
  )
}
```

### 7.5 Teal Variant — Section dengan Background Teal

```tsx
// Di dalam section dengan bg-brand-teal-50 atau bg-brand-teal-600

import { CardSkeleton } from '@/components/ui/skeletons'

// Saat background gelap/teal, gunakan variant="teal"
function TealSectionSkeleton() {
  return (
    <div className="bg-brand-teal-50 p-8 rounded-2xl">
      <CardSkeleton variant="teal" imageAspect="16/9" lines={2} />
    </div>
  )
}
```

### 7.6 ImageSkeleton — Detail Produk

```tsx
// /app/produk/[slug]/page.tsx

import { ImageSkeleton, TextLineSkeleton } from '@/components/ui/skeletons'

function ProductDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Foto produk */}
      <ImageSkeleton aspect="1/1" rounded="lg" />

      {/* Detail konten */}
      <div className="flex flex-col gap-4">
        <TextLineSkeleton width="wide" height="2xl" />   {/* Nama produk */}
        <TextLineSkeleton width="short" />               {/* Badge SNI */}
        <div className="flex flex-col gap-2 mt-2">
          <TextLineSkeleton width="full" />              {/* Deskripsi 1 */}
          <TextLineSkeleton width="full" />              {/* Deskripsi 2 */}
          <TextLineSkeleton width="mid" />               {/* Deskripsi 3 */}
        </div>
      </div>
    </div>
  )
}
```

---

## 8. Pola Penggunaan dengan `<Suspense>`

### 8.1 Cara yang Benar (Next.js App Router)

Skeleton components dirancang untuk digunakan sebagai `fallback` pada `<Suspense>` boundary di Next.js App Router.

```tsx
// Pattern standar: bungkus async component dengan Suspense + skeleton fallback
<Suspense fallback={<CardSkeleton lines={3} />}>
  <AsyncProductCard slug={slug} />
</Suspense>
```

### 8.2 Dengan `loading.tsx` (App Router Convention)

```tsx
// /app/produk/loading.tsx
// Next.js App Router secara otomatis menampilkan ini saat halaman loading

import { CardSkeleton } from '@/components/ui/skeletons'

export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-16">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </main>
  )
}
```

### 8.3 Untuk Client Components (useState loading pattern)

```tsx
// Untuk komponen yang melakukan client-side fetch
'use client'

import { useState, useEffect } from 'react'
import { TableRowSkeleton, TABLE_COLUMN_PRESETS } from '@/components/ui/skeletons'

export function LeadsTable() {
  const [isLoading, setIsLoading] = useState(true)
  const [leads, setLeads] = useState([])

  useEffect(() => {
    fetchLeads().then(data => {
      setLeads(data)
      setIsLoading(false)
    })
  }, [])

  if (isLoading) {
    return (
      <>
        {Array.from({ length: 8 }).map((_, i) => (
          <TableRowSkeleton
            key={i}
            columns={5}
            columnWidths={[...TABLE_COLUMN_PRESETS.leads]}
          />
        ))}
      </>
    )
  }

  return <>{/* Render actual leads */}</>
}
```

---

## 9. Accessibility

### 9.1 Implementasi ARIA

Semua skeleton components menggunakan atribut ARIA yang tepat:

```tsx
// Pattern yang digunakan di semua skeleton
<div
  role="status"
  aria-label="Memuat konten..."
  aria-busy="true"
/>
```

**Penjelasan:**
- `role="status"`: Menginformasikan screen reader bahwa ini adalah region status/loading
- `aria-label`: Text deskriptif untuk screen reader (dalam Bahasa Indonesia sesuai target audiens)
- `aria-busy="true"`: Menandai bahwa elemen ini dalam keadaan loading

### 9.2 Screen Reader Behavior

Screen reader akan mengumumkan ketika skeleton muncul dan menghilang:
- Saat muncul: "Memuat konten..." / "Memuat gambar..." / "Memuat data baris..."
- Saat hilang (konten nyata muncul): Screen reader membaca konten nyata yang menggantikan skeleton

### 9.3 Reduced Motion (Otomatis)

Sudah di-handle oleh `globals.css`. Engineer tidak perlu menambahkan logika tambahan.

---

## 10. Catatan Implementasi untuk Engineer (E1-ENG-26)

### 10.1 Checklist Implementasi

```
□ Buat folder /components/ui/skeletons/
□ Buat TextLineSkeleton.tsx (copy dari §6.1)
□ Buat ImageSkeleton.tsx (copy dari §6.2)
□ Buat CardSkeleton.tsx (copy dari §6.3)
□ Buat TableRowSkeleton.tsx (copy dari §6.4)
□ Buat index.ts barrel export (copy dari §6.5)
□ Verifikasi: class .skeleton dan .skeleton-teal ada di globals.css
□ Verifikasi: keyframe skeleton-shimmer ada di tailwind.config.ts
□ Smoke test: render satu dari setiap variant di test page
□ Verifikasi: animasi berjalan benar di browser
□ Verifikasi: animasi berhenti di mode prefers-reduced-motion
□ Hapus test page
```

### 10.2 Verifikasi Cepat (Smoke Test)

Tambahkan sementara ke `/app/page.tsx` atau route mana pun, verifikasi, lalu hapus:

```tsx
// TEMPORARY SMOKE TEST — HAPUS SETELAH VERIFIKASI
import {
  TextLineSkeleton,
  ImageSkeleton,
  CardSkeleton,
  TableRowSkeleton,
  TABLE_COLUMN_PRESETS
} from '@/components/ui/skeletons'

export default function SmokeTest() {
  return (
    <div className="p-8 flex flex-col gap-12 max-w-2xl">
      <section>
        <h2 className="text-sm font-semibold mb-4 text-neutral-500 uppercase">TextLineSkeleton</h2>
        <div className="flex flex-col gap-3">
          <TextLineSkeleton width="full" height="2xl" />
          <TextLineSkeleton width="wide" height="xl" />
          <TextLineSkeleton width="full" height="base" />
          <TextLineSkeleton width="mid" height="base" />
          <TextLineSkeleton width="short" height="sm" />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-4 text-neutral-500 uppercase">ImageSkeleton</h2>
        <div className="flex flex-col gap-4">
          <ImageSkeleton aspect="16/9" />
          <div className="w-48"><ImageSkeleton aspect="1/1" /></div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-4 text-neutral-500 uppercase">CardSkeleton</h2>
        <div className="grid grid-cols-2 gap-4">
          <CardSkeleton lines={3} />
          <CardSkeleton lines={3} showFooter={true} />
          <CardSkeleton variant="teal" lines={2} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-4 text-neutral-500 uppercase">TableRowSkeleton</h2>
        <div className="border border-neutral-200 rounded-xl overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRowSkeleton
              key={i}
              columns={5}
              columnWidths={[...TABLE_COLUMN_PRESETS.leads]}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
```

### 10.3 Potensi Issues & Solusi

| Issue | Penyebab | Solusi |
|---|---|---|
| Shimmer tidak terlihat | Class `.skeleton` tidak ada di `globals.css` | Pastikan `globals.css` sudah di-import di root layout |
| Shimmer terpotong | Parent container memiliki `overflow: hidden` | Hapus `overflow: hidden` dari parent ATAU gunakan pulse variant |
| Border radius tidak konsistent | Class `skeleton` sudah punya `border-radius: 6px` | Override dengan `className="rounded-lg"` atau class lain yang lebih spesifik |
| Tinggi CardSkeleton tidak sesuai | `lines` prop terlalu tinggi | Set `lines={3}` sebagai default dan sesuaikan per use case |
| Aspect ratio tidak terjaga di mobile | Parent tidak punya width yang terdefinisi | Pastikan parent `div` punya `w-full` |

---

## 11. Acceptance Criteria — Verifikasi

Sesuai task E1-UX-08, semua item berikut harus ✅ sebelum task dinyatakan done:

```
□ Variant TextLineSkeleton: satu baris teks — full/75%/50% lebar — berfungsi
□ Variant CardSkeleton: card dengan image placeholder atas + 3 text lines bawah — berfungsi
□ Variant ImageSkeleton: aspect ratio 16:9 dan 1:1 — terjaga di semua viewport
□ Variant TableRowSkeleton: 5 kolom — tinggi 48px — berfungsi
□ Animasi shimmer berjalan smooth di Chrome, Firefox, Safari
□ Animasi berhenti ketika prefers-reduced-motion: reduce aktif
□ Semua komponen dapat diakses keyboard (role="status" terdaftar)
□ Semua komponen di-export dari barrel index.ts
□ Tidak ada TypeScript error (strict mode)
□ Smoke test visual berhasil untuk semua 4 variant
```

---

## 12. Design Decisions & Rationale

| Keputusan | Alasan |
|---|---|
| **Shimmer > Pulse** | Shimmer (horizontal gradient sweep) lebih premium dan sesuai Design System v2.0 §7. Pulse terlalu generik. Task spec menyebut "pulse" sebagai referensi perilaku, bukan keharusan teknis. |
| **CSS class vs Tailwind animate-pulse** | Class `.skeleton` sudah terdefinisi di `globals.css` dengan warna brand yang tepat. Lebih DRY daripada menduplikasi warna di setiap komponen. |
| **Composite CardSkeleton** | `CardSkeleton` menggunakan `ImageSkeleton` + `TextLineSkeleton` (composable), bukan menulis ulang. Ini menjamin konsistensi animasi dan memudahkan perubahan di satu tempat. |
| **`TABLE_COLUMN_PRESETS`** | Export preset kolom agar developer tidak perlu menghafal/menghitung ulang lebar kolom untuk setiap tabel. Single source of truth. |
| **Clamp `lines` 1–5** | Mencegah card yang terlalu tinggi dan tidak realistis. 5 baris adalah maksimum yang masih mempertahankan estetika card. |
| **`aria-label` Bahasa Indonesia** | Target pengguna platform adalah mitra industri Indonesia. Screen reader Indonesia lebih natural dengan label BI. |

---

*E1-UX-08 Implementation Spec · CV Reka Cipta Indonesia · Design System v2.0*  
*Referensi: DESIGN_SYSTEM_RekaCirciptaIndonesia_v2.md §7 (Skeleton) · §23 (Reduced Motion) · §26 (Card) · tailwind.config.ts · globals.css*
