# Epic 2 Slice 1 — Redesign Bagian 3 & 4

**Untuk Claude Code:** Dokumen ini adalah panduan eksekusi mandiri. Baca seluruh bagian "Konteks Wajib" sebelum mulai eksekusi.

**Project root:** `~/workspace/projects/reka-cipta-website/reka-cipta-platform`
**Branch:** `main`
**Stack:** Next.js 16 (Turbopack), React 19, TypeScript, Tailwind v4 (`@theme`), Base UI (`@base-ui/react`, BUKAN Radix), Framer Motion ^11, Supabase, FastAPI backend (tidak disentuh di redesign ini).

---

## Konteks Wajib (Baca Sebelum Eksekusi)

### Aturan Frozen Files (CLAUDE.md)

```
tailwind.config.ts   ← FROZEN, jangan diedit
globals.css          ← FROZEN, kecuali pengecualian terdokumentasi
components/ui/*      ← FROZEN, jangan diedit langsung
```

Pengecualian `globals.css` yang sudah disetujui:
- `.cta-hero-pulse` (port DS §33.2 ke Tailwind v4, Bagian 6.1)
- `.marquee-track` (FE-07, Bagian 7.2)
- `body { background: #FFFFFF }` (Bagian 1 redesign, sudah dilakukan)

**Aturan untuk Bagian 3 & 4:**
- Boleh menambah class CSS baru di `globals.css` HANYA bila terdokumentasi (komentar + alasan).
- `components/ui/button.tsx` JANGAN diedit. Proyek pakai Base UI yang tidak punya `asChild` Radix-style. Untuk Link dirupakan button, gunakan pola:
  ```tsx
  <Link className={cn(buttonVariants({ variant, size }), 'extra-classes')}>...</Link>
  ```

### Konvensi Penamaan

| Type | Convention |
|---|---|
| React components | `PascalCase.tsx` |
| Hooks | `use-kebab-case.ts` |
| Non-component TS | `kebab-case.ts` |
| Constants | `kebab-case.ts`, exported `SCREAMING_SNAKE_CASE` |

### Brand Tokens yang Tersedia (dari `globals.css` @theme)

```
Warna teal (primer):
  brand-teal-50  #E6FAF8
  brand-teal-100 #C7F2EE
  brand-teal-200 #93E7DC
  brand-teal-300 #52D6C4
  brand-teal-400 #1BBFAA
  brand-teal-500 #0F9E8B
  brand-teal-600 #0B7D6E  ← Primary CTA
  brand-teal-700 #085E52
  brand-teal-800 #064038
  brand-teal-900 #042B26

Ink (heading/dark surfaces):
  ink-700 #173F3A  ← Default heading color
  ink-800 #102E2B
  ink-900 #0A1E1C  ← Dark surfaces (HowItWorks bg)

Sand (accent supplier sections):
  sand-600 #8A6535

Neutral (teks body):
  neutral-50  #F9FAFB
  neutral-100 #F3F4F6
  neutral-200 #E5E7EB
  neutral-300 #D1D5DB
  neutral-400 #9CA3AF
  neutral-500 #6B7280  ← MIN untuk teks (kontras 4.6:1 di atas white)
  neutral-600 #4B5563  ← Body secondary (kontras 7:1)
  neutral-700 #374151  ← Body utama (kontras 9.1:1) — PAKAI INI
  neutral-800 #1F2937
  neutral-900 #111827
```

### Utility CSS Classes Tersedia

`.skeleton`, `.skeleton-teal` (shimmer), `.reveal-up`, `.reveal-scale`, `.reveal-left`, `.reveal-right` (scroll reveal), `.nav-underline`, `.link-animated`, `.bg-brand-gradient`, `.bg-sand-gradient`, `.bg-dot-grid`, `.cta-hero-pulse`, `.marquee-track`, `.mono-tech`, `.card-hover-lift`.

### Status Pengerjaan Sebelumnya

**Sudah selesai (jangan diulang):**
- Bagian 1: Background body → `#FFFFFF`. StatsBar disederhanakan (hapus map, hapus carousel, hanya 4 angka). Padding section dipotong umum dari `py-20/28` → `py-16/20`. Kontras teks ditingkatkan di IndustriesGrid & CredibilitySection.
- Bagian 2: ProductsPreview redesign grid 2+3 (tinggi sama), ProductCard tanpa "Lihat Detail" teks, foto pakai `aspect-square`.

**File yang sudah dihapus dari project:**
- `components/sections/InteractiveDistributionMap.tsx`
- `constants/distribution-map.ts`

**Yang akan dikerjakan di dokumen ini:**
- **Bagian 3:** Hero diperpendek + sub-heading lebih terang + CTASection refresh
- **Bagian 4:** Logo perusahaan terintegrasi di Navbar, Footer, Hero

---

## Pre-Check Sebelum Mulai

Jalankan ini dulu untuk memverifikasi kondisi project siap dikerjakan:

```bash
cd ~/workspace/projects/reka-cipta-website/reka-cipta-platform

echo "━━━ Pre-check status ━━━"

echo ""
echo "[Working tree]"
git status --short
echo ""
echo "[Branch]"
git branch --show-current

echo ""
echo "[Bagian 1 & 2 sudah selesai?]"
grep -q "background: #FFFFFF" app/globals.css && echo "  ✅ Bagian 1 body white" || echo "  ❌ Bagian 1 belum"
grep -q "max-w-3xl grid-cols-2" components/sections/ProductsPreview.tsx && echo "  ✅ Bagian 2 grid 2+3" || echo "  ❌ Bagian 2 belum"

echo ""
echo "[File yang akan diedit ada]"
for f in components/sections/HeroSection.tsx components/sections/HeroCarousel.tsx components/sections/CTASection.tsx components/layout/Navbar.tsx components/layout/Footer.tsx; do
  [ -f "$f" ] && echo "  ✅ $f" || echo "  ❌ MISSING: $f"
done

echo ""
echo "[TypeScript baseline]"
npx tsc --noEmit && echo "  ✅ tsc clean" || echo "  ❌ ada error sebelum mulai"

echo ""
echo "[Build masih ○ Static]"
npm run build 2>&1 | grep -E "^┌|^└" | head -3
```

**Stop kalau ada `❌`. Laporkan ke user sebelum lanjut.**

---

# BAGIAN 3 — Hero Diperpendek + CTASection Refresh

**Tujuan:**
- Poin #8: Hero terlalu panjang vertikal → perpendek, sub-heading lebih terang
- Poin #9: CTASection terlalu flat → tambah visual depth + kurangi white space

**Estimasi:** 25 menit
**File yang dibutuhkan:** `HeroCarousel.tsx`, `HeroSection.tsx`, `CTASection.tsx`

---

## 3.1 — Update `HeroCarousel.tsx`

### Keputusan Desain

**1. Tinggi `min-h-[90vh]` → `min-h-[75vh] md:min-h-[80vh]`.**
Hero saat ini full 90vh terlalu memenuhi layar. 75vh mobile + 80vh desktop memberi ruang stat bar untuk "intip" di bottom — mendorong user scroll lanjut.

**2. Padding `py-24` → `py-16 md:py-20`.**
Padding eksternal lebih ringkas, masih cukup breathing room.

**3. Sub-heading: `text-neutral-200/90` → `text-white/95`.**
Saat ini sub-heading kurang kontras karena `neutral-200` (slate gray) + opacity 90% jadi ~`#D1D5DB` opacity tinggi. Ubah ke `text-white/95` (putih 95%) untuk kontras yang jauh lebih tegas terhadap overlay teal-ink gelap.

**4. Overlay sedikit diperkuat.**
Saat ini `from-ink-900/85 via-ink-900/50 to-ink-900/30`. Saya pertahankan tapi tambahkan overlay tengah lebih konsisten supaya teks terbaca di semua slide tanpa tergantung foto.

**5. Headline `text-4xl md:text-5xl lg:text-6xl` → tetap, tapi `max-w-4xl` → `max-w-3xl`.**
Hero lebih ringkas, headline tidak tersebar terlalu lebar.

### Eksekusi

```bash
cd ~/workspace/projects/reka-cipta-website/reka-cipta-platform

cat > components/sections/HeroCarousel.tsx << 'EOF'
// components/sections/HeroCarousel.tsx
// Epic 2 Slice 1 (E2-S1-FE-02) — REVISI Bagian 3:
// - Hero diperpendek (min-h-75vh mobile, 80vh desktop)
// - Padding section ringkas (py-16 md:py-20)
// - Sub-heading kontras lebih tinggi (text-white/95)
// - Headline max-w-3xl (lebih ringkas)
//
// Pattern Link + buttonVariants (Base UI tidak punya asChild).
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface HeroSlide {
  src: string
  alt: string
}

interface HeroCarouselProps {
  slides: HeroSlide[]
  autoPlayMs?: number
}

const EASE = [0.25, 0.46, 0.45, 0.94] as const
const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

export function HeroCarousel({ slides, autoPlayMs = 5000 }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [failed, setFailed] = useState<Set<number>>(new Set())
  const prefersReduced = useReducedMotion()
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isPaused || prefersReduced || slides.length <= 1) return
    const tick = () => setCurrent((c) => (c + 1) % slides.length)
    let id = setInterval(tick, autoPlayMs)
    const onVisibility = () => {
      clearInterval(id)
      if (document.visibilityState === 'visible') id = setInterval(tick, autoPlayMs)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [isPaused, prefersReduced, slides.length, autoPlayMs])

  const goTo = useCallback((index: number) => {
    setCurrent(index)
    setIsPaused(true)
    if (resumeTimer.current) clearTimeout(resumeTimer.current)
    resumeTimer.current = setTimeout(() => setIsPaused(false), 6000)
  }, [])

  useEffect(() => () => { if (resumeTimer.current) clearTimeout(resumeTimer.current) }, [])

  const markFailed = useCallback((i: number) => {
    setFailed((prev) => new Set(prev).add(i))
  }, [])

  return (
    <section
      className="relative flex min-h-[75vh] flex-col items-center justify-center overflow-hidden px-4 py-16 md:min-h-[80vh] md:py-20"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Hero"
    >
      {/* Background gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-teal-900 via-ink-900 to-brand-teal-800" aria-hidden="true" />

      {/* Slide images */}
      {slides.map((slide, i) =>
        failed.has(i) ? null : (
          <div
            key={slide.src}
            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            style={{ opacity: i === current ? 1 : 0 }}
            aria-hidden={i !== current}
          >
            <Image
              src={slide.src}
              alt={i === current ? slide.alt : ''}
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
              onError={() => markFailed(i)}
            />
          </div>
        )
      )}

      {/* Overlay gelap utk kontras teks — diperkuat di Bagian 3 */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink-900/90 via-ink-900/65 to-ink-900/45" aria-hidden="true" />

      {/* Konten — stagger fadeInUp */}
      <motion.div
        className="relative z-10 flex max-w-3xl flex-col items-center text-center"
        variants={container}
        initial={prefersReduced ? 'visible' : 'hidden'}
        animate="visible"
      >
        <motion.div variants={item}>
          <span className="inline-block rounded-full border border-brand-teal-300/50 bg-brand-teal-50/15 px-4 py-1.5 text-sm font-semibold text-brand-teal-100 backdrop-blur-sm">
            Tersertifikasi SNI
          </span>
        </motion.div>

        <motion.h1
          variants={item}
          className="mt-6 text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl"
        >
          Mitra Distribusi Garam SNI Anda: Transparan, Cepat, dan Terverifikasi
        </motion.h1>

        <motion.p
          variants={item}
          className="mt-5 max-w-2xl text-base text-white/95 md:text-lg"
        >
          Kami menyediakan 5 pilihan garam bersertifikasi untuk kelancaran
          produksi industri Anda. Mulai dari dokumentasi uji laboratorium hingga
          legalitas perusahaan, semuanya terbuka untuk Anda. Dapatkan penawaran
          harga kurang dari 2 menit.
        </motion.p>

        <motion.div variants={item} className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
          <Link
            href="/minta-penawaran"
            aria-label="Minta penawaran harga sekarang"
            className={cn(
              buttonVariants({ size: 'lg' }),
              'cta-hero-pulse bg-brand-teal-600 text-white hover:bg-brand-teal-500'
            )}
          >
            Minta Penawaran Sekarang
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/produk"
            aria-label="Lihat katalog produk kami"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'lg' }),
              'border-white/70 bg-transparent text-white hover:bg-white/10 hover:text-white'
            )}
          >
            Lihat Produk Kami
          </Link>
        </motion.div>
      </motion.div>

      {/* Pagination dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 z-10 flex gap-2" role="tablist" aria-label="Pilih slide hero">
          {slides.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === current}
              aria-label={`Slide ${i + 1} dari ${slides.length}`}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-6 bg-brand-teal-400'
                  : 'w-2 bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
EOF
echo "✅ HeroCarousel.tsx diperbarui"
```

### Perubahan Ringkas (HeroCarousel)

| Aspek | Sebelumnya | Sekarang |
|---|---|---|
| Tinggi section | `min-h-[90vh]` | `min-h-[75vh] md:min-h-[80vh]` |
| Padding | `py-24` | `py-16 md:py-20` |
| Headline max-width | `max-w-4xl` | `max-w-3xl` |
| Headline margin-top | `mt-6` | `mt-6` (tetap) |
| Sub-heading color | `text-neutral-200/90` | `text-white/95` |
| Sub-heading margin-top | `mt-6` | `mt-5` |
| Badge text color | `text-brand-teal-200` | `text-brand-teal-100` (lebih terang) |
| Badge font-weight | `font-medium` | `font-semibold` |
| CTA margin-top | `mt-8` | `mt-7` |
| Overlay opacity | `/85 /50 /30` | `/90 /65 /45` (lebih kuat) |
| Pagination bottom | `bottom-8` | `bottom-6` |

---

## 3.2 — Update `HeroSection.tsx`

**Catatan kondisi saat ini:** File `HeroSection.tsx` sebelumnya memiliki 4 slide dengan `autoPlayMs={3000}`. Untuk Bagian 3 kita kembalikan ke 3 slide (sesuai Fase 0) dan `autoPlayMs` default (5000) untuk pacing yang lebih baik dengan hero yang lebih pendek.

```bash
cat > components/sections/HeroSection.tsx << 'EOF'
// components/sections/HeroSection.tsx
// Epic 2 Slice 1 (E2-S1-FE-02) — Server wrapper (ARCHITECTURE.md §5.4).
//
// 3 slide hero — sesuai Fase 0. Foto akan disediakan klien
// (public/images/hero/hero-{1,2,3}.jpg). Fallback: HeroCarousel
// menangani onError per slide → gradient teal di-belakang.
import { HeroCarousel, type HeroSlide } from './HeroCarousel'

const HERO_SLIDES: HeroSlide[] = [
  { src: '/images/hero/hero-1.jpg', alt: 'Produk garam industri CV Reka Cipta Indonesia' },
  { src: '/images/hero/hero-2.jpg', alt: 'Proses distribusi garam ke mitra industri' },
  { src: '/images/hero/hero-3.jpg', alt: 'Gudang penyimpanan garam bersertifikasi SNI' },
]

export function HeroSection() {
  return <HeroCarousel slides={HERO_SLIDES} />
}
EOF
echo "✅ HeroSection.tsx diperbarui (3 slide, autoplay default 5s)"
```

---

## 3.3 — Update `CTASection.tsx`

### Keputusan Desain

CTASection saat ini terlalu flat. Tambahkan **3 elemen depth** tanpa berlebihan:

**1. Pattern dot grid sebagai tekstur background.**
Pakai class `.bg-dot-grid` yang sudah ada di `globals.css`. Memberi tekstur subtle.

**2. Card container untuk konten.**
Bungkus heading + CTA dalam container `bg-white/5 backdrop-blur-sm` dengan border halus. Memberi konten visual focus.

**3. Ikon visual sebelum heading.**
Tambah `<MessageCircle>` atau ikon "handshake" sebagai entry visual. Mengisi white space tanpa menambah teks.

**4. Padding sedikit dipotong + decorative blur dipertahankan.**
`py-20 md:py-28` → `py-16 md:py-20` agar lebih ringkas.

**5. Sub-teks lebih kontras.**
`text-white/85` → `text-white/95`.

### Eksekusi

```bash
cat > components/sections/CTASection.tsx << 'EOF'
// components/sections/CTASection.tsx
// Epic 2 Slice 1 (E2-S1-FE-08) — REVISI Bagian 3:
// - Padding lebih ringkas (py-16 md:py-20)
// - Container card dgn bg-white/5 backdrop-blur utk visual focus
// - Pattern dot grid sebagai tekstur subtle
// - Sub-teks lebih kontras (text-white/95)
// - Tambah ikon Sparkles sebagai entry visual

import Link from 'next/link'
import { ArrowRight, MessageCircle, Sparkles } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { RevealWrapper } from '@/components/animations/RevealWrapper'
import { cn } from '@/lib/utils'

export function CTASection() {
  return (
    <section
      className="bg-dot-grid relative overflow-hidden bg-gradient-to-br from-brand-teal-600 via-brand-teal-700 to-brand-teal-800 px-4 py-16 md:py-20"
      aria-labelledby="cta-heading"
    >
      {/* Decorative blur — dipertahankan untuk depth */}
      <div
        className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-brand-teal-400/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-brand-teal-300/20 blur-3xl"
        aria-hidden="true"
      />

      <RevealWrapper variant="reveal-scale">
        <div className="relative z-10 mx-auto max-w-3xl">
          {/* Card container — bg-white/5 + backdrop-blur untuk visual focus */}
          <div className="rounded-3xl border border-white/15 bg-white/[0.07] p-8 backdrop-blur-md md:p-12">
            {/* Ikon entry */}
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-teal-400/20 backdrop-blur-sm">
              <Sparkles className="h-7 w-7 text-brand-teal-100" strokeWidth={2} aria-hidden="true" />
            </div>

            <h2
              id="cta-heading"
              className="text-center text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl"
            >
              Siap Jadi Mitra Distribusi?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-base text-white/95 md:text-lg">
              Diskusikan kebutuhan garam industri Anda dengan tim kami. Dapatkan
              penawaran harga yang transparan dalam kurang dari 2 menit.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/minta-penawaran"
                aria-label="Minta penawaran harga sekarang"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'bg-white text-brand-teal-700 hover:bg-neutral-100 hover:text-brand-teal-800'
                )}
              >
                Minta Penawaran
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/kontak"
                aria-label="Buka halaman kontak"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'lg' }),
                  'border-2 border-white/70 bg-transparent text-white hover:bg-white/10 hover:text-white'
                )}
              >
                <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                Hubungi Kami
              </Link>
            </div>
          </div>
        </div>
      </RevealWrapper>
    </section>
  )
}
EOF
echo "✅ CTASection.tsx diperbarui"
```

### Perubahan Ringkas (CTASection)

| Aspek | Sebelumnya | Sekarang |
|---|---|---|
| Padding | `py-20 md:py-28` | `py-16 md:py-20` |
| Background | Gradient 2-stop (`from-600 to-700`) | Gradient 3-stop (`from-600 via-700 to-800`) + `bg-dot-grid` |
| Container | Konten direct di section | Card `bg-white/[0.07] backdrop-blur-md` |
| Border container | — | `border border-white/15` |
| Padding container | — | `p-8 md:p-12` |
| Rounded container | — | `rounded-3xl` |
| Ikon entry | — | `<Sparkles>` dalam kotak teal-400/20 |
| Heading max-width | `max-w-2xl` | `max-w-3xl` |
| Sub-teks color | `text-white/85` | `text-white/95` |
| Decorative blur size | `h-64 w-64` | `h-72 w-72` (sedikit lebih besar) |
| Decorative blur opacity | `/20 /15` | `/25 /20` (sedikit lebih terlihat) |

---

## 3.4 — Verifikasi Bagian 3

```bash
echo "━━━ TypeScript & Build ━━━"
npx tsc --noEmit && echo "✅ tsc clean"
npm run build 2>&1 | grep -E "^┌|^├|^└|Error|error" | head -10
```

**Expected:** `┌ ○ /` masih Static, tidak ada error.

```bash
echo ""
echo "━━━ SSR Check ━━━"
npm run dev &
sleep 6

curl -s http://localhost:3000/ | python3 -c "
import sys, re
html = sys.stdin.read()

checks = [
  ('Hero headline ter-SSR',           'Mitra Distribusi Garam SNI' in html),
  ('CTASection heading',              'Siap Jadi Mitra Distribusi' in html),
  ('CTA Primary link',                '/minta-penawaran' in html),
  ('CTA Secondary link',              '/kontak' in html),
  ('Tepat 1 <h1>',                    len(re.findall(r'<h1[\s>]', html)) == 1),
  ('Card container CTASection',       'bg-white/[0.07]' in html or 'backdrop-blur-md' in html),
]

for label, ok in checks:
  print(f\"{'✅' if ok else '❌'} {label}\")
"

kill %1 2>/dev/null
```

### Checklist Visual Manual (Wajib)

```bash
npm run dev &
sleep 6
echo "🌐 http://localhost:3000"
```

**Hero:**
```
[ ] Tinggi hero lebih pendek (75vh mobile, 80vh desktop)
[ ] Stats bar "intip" di bawah hero saat halaman pertama load (sebelum scroll)
[ ] Sub-heading lebih putih, terbaca jelas
[ ] Badge "Tersertifikasi SNI" lebih bold
[ ] CTA "Minta Penawaran" tetap berdenyut (cta-hero-pulse)
[ ] Headline tidak terlalu lebar (max-w-3xl)
[ ] Layout responsive 375px → 768px → 1280px → 1440px
```

**CTASection:**
```
[ ] Section tidak lagi flat — ada card container di tengah
[ ] Card pakai bg semi-transparan + blur (backdrop-blur)
[ ] Border halus di sekeliling card
[ ] Ada ikon Sparkles di atas heading (kotak rounded teal)
[ ] Sub-teks terbaca jelas (white/95)
[ ] Tombol Primary putih + Secondary outline tetap functional
[ ] Padding section lebih ringkas — tidak banyak ruang kosong
[ ] Decorative blur di kiri-atas dan kanan-bawah sedikit lebih terlihat
[ ] Pattern dot grid samar terlihat di background
```

```bash
kill %1 2>/dev/null
```

---

## 3.5 — Commit Bagian 3

```bash
git add components/sections/HeroCarousel.tsx \
        components/sections/HeroSection.tsx \
        components/sections/CTASection.tsx

git commit -m "refactor(epic2/s1): bagian 3 - hero pendek + CTA refresh

Hero (HeroCarousel + HeroSection):
- min-h: 90vh → 75vh mobile, 80vh desktop (stats 'intip' di bawah)
- Padding section: py-24 → py-16 md:py-20
- Sub-heading: text-neutral-200/90 → text-white/95 (kontras tegas)
- Badge: text-brand-teal-200 font-medium → teal-100 font-semibold
- Headline max-w-4xl → max-w-3xl (lebih ringkas)
- Overlay diperkuat: /85 /50 /30 → /90 /65 /45
- HeroSection: kembali ke 3 slide + autoplay default 5s

CTASection:
- Padding: py-20 md:py-28 → py-16 md:py-20
- Background: gradient 3-stop + bg-dot-grid (tekstur subtle)
- Card container: bg-white/[0.07] backdrop-blur-md + border-white/15
  + rounded-3xl + padding p-8 md:p-12 (memberi visual focus)
- Ikon entry: Sparkles dalam kotak teal-400/20 sebelum heading
- Sub-teks: text-white/85 → text-white/95
- Decorative blur diperbesar dan diperkuat opacity-nya
- Tetap pakai Link + buttonVariants (Base UI safe)"
```

---

# BAGIAN 4 — Logo Perusahaan Terintegrasi

**Tujuan:**
- Poin #10: Logo perusahaan di Navbar (kiri atas), Footer (kolom branding), opsional di Hero

**Estimasi:** 20 menit
**File yang dibutuhkan:** `Navbar.tsx`, `Footer.tsx`, dan **file logo PNG dari user**.

---

## 4.1 — Lokasi File Logo (PENTING — Beri Tahu User)

**User akan menempatkan logo di lokasi berikut:**

```
public/
└── logo/
    ├── logo-light.png    ← Logo untuk background TERANG (Navbar, sections putih)
    └── logo-dark.png     ← Logo untuk background GELAP (Footer ink-900)
```

**Spesifikasi file:**
- Format: PNG dengan background transparan
- Resolusi minimal: 512px lebar (lebih besar lebih baik, akan di-scale Next/Image)
- Aspect ratio: bebas, tapi disarankan landscape (mis. 4:1) untuk Navbar
- File size: < 100KB ideal (PNG dengan transparansi tipikal 20-50KB)

**Jika user hanya punya satu versi logo:**
- Default: gunakan satu file untuk kedua tempat, taruh di `public/logo/logo-light.png`
- Footer akan menggunakan logo yang sama tapi dengan styling fallback (mis. `brightness-0 invert` filter untuk membuat logo putih) — sudah ditangani di kode.

**Jika file belum tersedia saat eksekusi:**
- Komponen akan render placeholder text "RCI" (initial) sebagai fallback.
- Tidak akan crash. User bisa drop logo PNG kapan saja, refresh, dan logo otomatis terlihat.

Sebelum lanjut, buat folder logo:

```bash
mkdir -p public/logo
cat > public/logo/README.md << 'EOF'
# Logo CV Reka Cipta Indonesia

Tempatkan file logo di sini dengan nama berikut:

- `logo-light.png` — Logo untuk background terang (Navbar, sections putih)
- `logo-dark.png` — Logo untuk background gelap (Footer)

Spesifikasi:
- Format: PNG dengan background transparan
- Resolusi minimal: 512px lebar
- Aspect ratio: bebas, landscape (4:1) ideal untuk Navbar
- File size: < 100KB

Jika hanya punya satu versi, taruh sebagai `logo-light.png`. Footer
akan otomatis menggunakan file yang sama dengan filter CSS untuk
menyesuaikan ke background gelap.
EOF
echo "✅ public/logo/ folder dibuat dengan README"
```

---

## 4.2 — Buat Komponen `Logo.tsx`

Komponen reusable yang menangani fallback (text initials) jika file logo belum ada.

```bash
mkdir -p components/brand

cat > components/brand/Logo.tsx << 'EOF'
// components/brand/Logo.tsx
// Epic 2 Slice 1 (Bagian 4) — Logo perusahaan reusable.
//
// Pemakaian:
//   <Logo variant="light" />  ← untuk bg terang (Navbar)
//   <Logo variant="dark" />   ← untuk bg gelap (Footer)
//
// File logo:
//   public/logo/logo-light.png  ← bg terang
//   public/logo/logo-dark.png   ← bg gelap (atau pakai light + filter)
//
// Fallback: jika file belum ada, render "RCI" text dengan styling brand.

'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface LogoProps {
  variant?: 'light' | 'dark'
  /** Logo dibungkus <Link> ke '/' jika true. Default true. */
  asLink?: boolean
  /** Tinggi logo dalam px. Default 40. Lebar otomatis menyesuaikan. */
  height?: number
  className?: string
}

export function Logo({
  variant = 'light',
  asLink = true,
  height = 40,
  className,
}: LogoProps) {
  const [imgError, setImgError] = useState(false)

  // Path file logo berdasarkan variant
  const src = variant === 'dark' ? '/logo/logo-dark.png' : '/logo/logo-light.png'

  // Fallback styling untuk text "RCI"
  const fallbackTextClass = variant === 'dark'
    ? 'text-white'
    : 'text-brand-teal-700'

  const content = imgError ? (
    // Fallback: text initial "RCI" dengan styling brand
    <div
      className={cn(
        'flex items-center justify-center font-extrabold tracking-tight',
        fallbackTextClass,
        className
      )}
      style={{ height, fontSize: height * 0.6 }}
      aria-label="CV Reka Cipta Indonesia"
    >
      RCI
    </div>
  ) : (
    // Logo image dengan Next/Image
    <Image
      src={src}
      alt="CV Reka Cipta Indonesia"
      height={height}
      width={height * 4} // asumsi aspect 4:1, akan di-fit oleh height
      onError={() => setImgError(true)}
      className={cn(
        'h-auto w-auto object-contain',
        className
      )}
      style={{ height, maxHeight: height }}
      priority
    />
  )

  if (!asLink) return content

  return (
    <Link
      href="/"
      aria-label="Kembali ke beranda CV Reka Cipta Indonesia"
      className="inline-flex items-center"
    >
      {content}
    </Link>
  )
}
EOF
echo "✅ components/brand/Logo.tsx dibuat"
```

---

## 4.3 — Update `Navbar.tsx`

**Asumsi struktur Navbar saat ini** (perlu Anda baca file aktual dulu): kemungkinan Navbar memiliki area kiri untuk logo/brand dan area kanan untuk navigation links. Pendekatan saya: cari tempat logo/brand text saat ini, ganti dengan komponen `<Logo>`.

**Eksekusi:**

```bash
echo "━━━ Inspeksi struktur Navbar.tsx saat ini ━━━"
cat components/layout/Navbar.tsx
```

**Setelah inspeksi**, edit Navbar mengikuti pola:

1. Tambah import `Logo`: `import { Logo } from '@/components/brand/Logo'`
2. Cari tempat brand text atau placeholder logo saat ini (mungkin ada teks "CV Reka Cipta Indonesia" atau placeholder)
3. Ganti dengan `<Logo variant="light" height={36} />` (40 px untuk desktop, 36 px untuk mobile akan diatur via Tailwind)

**Karena saya tidak punya isi Navbar.tsx terbaru, lakukan ini:**

- **Jika Navbar punya** elemen seperti `<Link href="/">CV Reka Cipta Indonesia</Link>` atau placeholder `<div className="logo">...</div>`:
  Ganti dengan `<Logo variant="light" height={36} />`

- **Jika Navbar belum punya** slot logo (hanya nav items):
  Tambah di awal `<nav>` atau di flex container utama:
  ```tsx
  <Logo variant="light" height={36} />
  ```
  Pastikan parent container pakai `flex justify-between` agar logo di kiri dan nav links di kanan.

**Contoh patch yang umum** (sesuaikan dengan struktur aktual):

```tsx
// SEBELUM (contoh):
<header>
  <Link href="/">
    <span className="text-xl font-bold">CV Reka Cipta Indonesia</span>
  </Link>
  <nav>...</nav>
</header>

// SESUDAH:
import { Logo } from '@/components/brand/Logo'

<header>
  <Logo variant="light" height={36} />
  <nav>...</nav>
</header>
```

Kemudian verifikasi:
```bash
grep -q "from '@/components/brand/Logo'" components/layout/Navbar.tsx && echo "✅ Logo terimport" || echo "❌ belum"
grep -q "<Logo" components/layout/Navbar.tsx && echo "✅ Logo dipakai" || echo "❌ belum"
```

---

## 4.4 — Update `Footer.tsx`

Pendekatan sama dengan Navbar, tapi pakai `variant="dark"`.

```bash
echo "━━━ Inspeksi struktur Footer.tsx saat ini ━━━"
cat components/layout/Footer.tsx
```

**Patch yang umum:**

- Footer biasanya punya struktur grid 3 kolom: Brand info kiri, Quick links tengah, Kontak kanan.
- Di kolom **Brand info** (kiri), tambahkan `<Logo>` di atas tagline:

```tsx
// SEBELUM (contoh):
<div>
  <h3 className="text-xl font-bold">CV Reka Cipta Indonesia</h3>
  <p>Distributor garam SNI Surabaya</p>
</div>

// SESUDAH:
import { Logo } from '@/components/brand/Logo'

<div>
  <Logo variant="dark" height={48} asLink={false} />
  <p className="mt-3 text-white/80">Distributor garam SNI Surabaya</p>
</div>
```

**Catatan tentang `variant="dark"`:** Jika user hanya menyediakan satu file (`logo-light.png`), kode akan tetap mencoba load `logo-dark.png` dulu. Jika 404, `onError` akan fallback ke text "RCI". Bila user ingin pakai logo light di footer dengan filter:

**Alternatif untuk satu logo file:** Edit komponen Footer manual setelah update untuk membungkus Logo dengan filter:
```tsx
<div className="brightness-0 invert">
  <Logo variant="light" height={48} asLink={false} />
</div>
```
Filter ini membuat logo light (warna teal/gelap) menjadi putih.

---

## 4.5 — Update `HeroCarousel.tsx` (Opsional — Logo di Hero)

User di permintaan #10 menyebut "memasukkan logo ke web". Hero adalah tempat yang umum tapi tidak wajib. Opsi:

**Opsi A — Skip (rekomendasi).** Logo di Navbar sudah cukup. Hero fokus pada CTA dan messaging.

**Opsi B — Logo kecil di bagian atas-tengah Hero.** Misalnya logo 48-60px di atas headline, sebagai brand reinforcement.

**Jika user minta Opsi B:**

Di `HeroCarousel.tsx`, sebelum `<motion.div variants={item}>` yang berisi badge SNI, tambahkan:

```tsx
import { Logo } from '@/components/brand/Logo'

// Di dalam motion.div container utama, sebelum item badge:
<motion.div variants={item} className="mb-6">
  <Logo variant="dark" height={48} asLink={false} />
</motion.div>
```

Catatan: `variant="dark"` di sini karena Hero punya background gelap, butuh logo yang terlihat putih/terang. Jika logo file dark belum ada, fallback "RCI" putih akan muncul.

**Default eksekusi: Skip Opsi B.** Hanya kerjakan jika user minta eksplisit.

---

## 4.6 — Verifikasi Bagian 4

```bash
echo "━━━ TypeScript & Build ━━━"
npx tsc --noEmit && echo "✅ tsc clean"
npm run build 2>&1 | grep -E "^┌|^├|^└|Error|error" | head -10
```

**Expected:** `┌ ○ /` masih Static, tidak ada error.

```bash
echo ""
echo "━━━ Komponen Logo terbentuk ━━━"
[ -f components/brand/Logo.tsx ] && echo "✅ Logo.tsx ada" || echo "❌ MISSING"

echo ""
echo "━━━ Logo terimport di Navbar & Footer ━━━"
grep -q "from '@/components/brand/Logo'" components/layout/Navbar.tsx && echo "✅ Navbar import Logo" || echo "❌ Navbar belum"
grep -q "from '@/components/brand/Logo'" components/layout/Footer.tsx && echo "✅ Footer import Logo" || echo "❌ Footer belum"

echo ""
echo "━━━ Folder logo siap untuk file PNG ━━━"
[ -d public/logo ] && echo "✅ public/logo/ ada" || echo "❌ MISSING"
[ -f public/logo/README.md ] && echo "✅ README petunjuk file ada" || echo "❌ MISSING"
```

### Checklist Visual Manual

```bash
npm run dev &
sleep 6
echo "🌐 http://localhost:3000"
```

```
[ ] Navbar: logo terlihat di kiri (atau text "RCI" jika file belum ada)
[ ] Logo bisa diklik → kembali ke beranda /
[ ] Footer: logo terlihat di kolom branding (variant dark)
[ ] Console tidak ada error 404 yang mengganggu user experience
    (404 untuk logo PNG yang belum ada akan terdeteksi onError → fallback)
[ ] Logo responsive di mobile (375px) dan desktop (1280px+)
```

```bash
kill %1 2>/dev/null
```

---

## 4.7 — Commit Bagian 4

```bash
git add components/brand/Logo.tsx \
        components/layout/Navbar.tsx \
        components/layout/Footer.tsx \
        public/logo/

git commit -m "feat(epic2/s1): bagian 4 - logo perusahaan terintegrasi

Komponen baru:
- components/brand/Logo.tsx: reusable logo dgn variant light/dark
  - asLink prop: default true (membungkus dgn <Link href='/'>)
  - height prop: default 40px, auto-scale lebar (asumsi 4:1 aspect)
  - Fallback: text 'RCI' dgn styling brand jika PNG belum ada
  - onError handler: graceful degradation

Asset placeholder:
- public/logo/ folder dgn README.md panduan untuk klien
  - logo-light.png (utk bg terang: Navbar)
  - logo-dark.png (utk bg gelap: Footer)
  - Fallback file: jika hanya 1 versi, taruh sbg logo-light.png
    + edit Footer utk pakai filter brightness-0 invert

Integrasi:
- Navbar: Logo variant='light' height={36} di kiri header
- Footer: Logo variant='dark' height={48} di kolom branding
  (asLink={false} agar tidak nested link dgn quick links)

Catatan: file PNG logo aktual akan diupload klien ke public/logo/.
Hingga itu, fallback 'RCI' text yang muncul — tidak akan crash."
```

---

# Verifikasi Akhir & Status

## Gate Check Final

```bash
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  GATE CHECK — REDESIGN BAGIAN 3 & 4"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "[Bagian 3 — Hero & CTA]"
grep -q "min-h-\[75vh\]" components/sections/HeroCarousel.tsx && echo "  ✅ Hero pendek (75vh)" || echo "  ❌"
grep -q "text-white/95" components/sections/HeroCarousel.tsx && echo "  ✅ Sub-heading kontras" || echo "  ❌"
grep -q "bg-dot-grid" components/sections/CTASection.tsx && echo "  ✅ CTA pattern dot-grid" || echo "  ❌"
grep -q "Sparkles" components/sections/CTASection.tsx && echo "  ✅ CTA ikon Sparkles" || echo "  ❌"
grep -q "backdrop-blur-md" components/sections/CTASection.tsx && echo "  ✅ CTA card container" || echo "  ❌"

echo ""
echo "[Bagian 4 — Logo]"
[ -f components/brand/Logo.tsx ] && echo "  ✅ Logo.tsx" || echo "  ❌"
[ -d public/logo ] && echo "  ✅ public/logo/ folder" || echo "  ❌"
grep -q "Logo" components/layout/Navbar.tsx && echo "  ✅ Logo di Navbar" || echo "  ❌"
grep -q "Logo" components/layout/Footer.tsx && echo "  ✅ Logo di Footer" || echo "  ❌"

echo ""
echo "[Build & types]"
npx tsc --noEmit > /dev/null 2>&1 && echo "  ✅ tsc clean" || echo "  ❌"
npm run build 2>&1 | grep "┌ ○ /" > /dev/null && echo "  ✅ Beranda ○ Static" || echo "  ❌"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

## Push ke Vercel

Setelah semua commit:

```bash
git log --oneline -10
git push origin main
```

Tunggu Vercel deployment (~2 menit), verifikasi di `https://reka-cipta-webplatform.vercel.app`.

---

# Catatan untuk User

## File Logo PNG

Setelah eksekusi Bagian 4 selesai, **user perlu menempatkan file logo di lokasi berikut**:

```
public/logo/logo-light.png    ← untuk Navbar (background terang)
public/logo/logo-dark.png     ← untuk Footer (background gelap)
```

**Jika user hanya punya satu versi logo:**
- Taruh sebagai `public/logo/logo-light.png`
- Edit `components/layout/Footer.tsx` untuk membungkus `<Logo>` dengan filter:
  ```tsx
  <div className="brightness-0 invert">
    <Logo variant="light" height={48} asLink={false} />
  </div>
  ```
  Filter ini akan membuat logo light (warna teal) menjadi putih.

**Spesifikasi file:**
- Format: PNG dengan background transparan
- Resolusi minimal: 512px lebar
- Aspect ratio: landscape (4:1) ideal
- File size: < 100KB

**Hingga file logo tersedia:** website akan menampilkan placeholder text "RCI" sebagai fallback. Tidak akan crash, tidak akan blocking.

## Setelah File Logo Tersedia

Cukup drop file ke folder, hard refresh browser. Tidak perlu rebuild manual. Tapi untuk production di Vercel, perlu commit + push:

```bash
git add public/logo/logo-light.png public/logo/logo-dark.png
git commit -m "feat: tambah logo perusahaan PNG"
git push origin main
```
