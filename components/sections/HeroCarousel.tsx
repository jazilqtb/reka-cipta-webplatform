// components/sections/HeroCarousel.tsx
// Epic 2 Slice 1 (E2-S1-FE-02) — Client leaf dari HeroSection.
//
// RONDE 6 (2026-08) — evaluasi & eksekusi atas 7 problem statement klien,
// otoritas desain penuh diberikan (lihat pesan klien: "jika kamu punya
// solusi lebih baik, abaikan saran saya"). Untuk Hero, 3 keluhan:
//
// (a) "Statistik angka tidak menambah trust" — DIEVALUASI, TIDAK dihapus
//     total: Fondasi Brand v1.0 Nilai 2 (Keandalan yang Dibuktikan)
//     eksplisit mewajibkan klaim didukung angka spesifik, bukan dihapus.
//     Yang salah bukan datanya, tapi presentasinya (kotak grid 4-sel
//     terasa seperti "modul metrik" terpisah dari narasi). Diganti garis
//     kredensial inline tipis di bawah CTA — tetap ada, tidak lagi berupa
//     blok kartu berat.
// (b) "Gambar terkesan amatir" — DISETUJUI, solusi lebih baik: bukan
//     rombak foto (tidak punya foto baru), tapi ganti ART DIRECTION.
//     Foto floating-panel dgn 2 badge bertumpuk (sticker-bombed) diganti
//     foto full-bleed + gradient overlay menyatu ke layout — pola hero
//     modern yang menutupi kelemahan komposisi foto individual, bukan
//     menonjolkannya. Badge PackageIcon/SealCheckIcon floating dihapus
//     (klaim SNI sudah ada di eyebrow, tidak perlu duplikat).
// (c) "Dark tone kurang cocok" — DISETUJUI: Hero balik ke LIGHT mode
//     (bg-white/salt-50), motion sebelumnya menumpuk 4 section gelap
//     (Hero+Industries+HowItWorks+StagedCTA+Footer) di 8 section total —
//     kini modal disebar: Hero cerah, hanya HowItWorks/Footer tetap gelap
//     utk ritme, StagedCTA juga dicerahkan (lihat StagedCTASection.tsx).
//
// Overlay foto: bg-white/95 solid di mobile (foto nyaris tak terlihat,
// tekstur halus saja) → bg-gradient-to-r di lg+ (teks tetap terbaca,
// foto terlihat penuh di sisi kanan). Satu DOM, murni Tailwind responsive,
// bukan dua struktur berbeda per breakpoint.
//
// Logic TIDAK berubah: autoplay 5s, pause on hover/dot-click/
// reduced-motion/tab-hidden, fallback per-slide on image error.
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRightIcon, SealCheckIcon } from '@phosphor-icons/react/ssr'
import { buttonVariants } from '@/components/ui/button'
import { AnimatedCounter } from '@/components/animations/AnimatedCounter'
import { cn } from '@/lib/utils'
import { heroStyleClass, type HeroContent } from '@/lib/hero-content'
import { heroStatTotal, type HeroStat } from '@/lib/data/hero'

export interface HeroSlide {
  src: string
  alt: string
}

interface HeroCarouselProps {
  slides: HeroSlide[]
  /** Konten hero dari CMS (CP3). Dirender sebagai text node — teks admin
   *  tidak pernah ditafsirkan sebagai markup. */
  hero: HeroContent
  /** Statistik: baseline dari admin + tambahan dari data nyata. */
  stats: HeroStat[]
  autoPlayMs?: number
}



const EASE = [0.25, 0.46, 0.45, 0.94] as const
const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

export function HeroCarousel({ slides, hero, stats: heroStats, autoPlayMs = 5500 }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [failed, setFailed] = useState<Set<number>>(new Set())
  const prefersReduced = useReducedMotion()
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sectionRef = useRef<HTMLElement>(null)

  // RONDE Tahap 3 — poin UMUM "Parallax & Scroll Tracking". Hanya layer
  // Parallax foto hero DICABUT (CP7). Terlewat saat ParallaxBlob dihapus di
  // CP1 karena yang ini ditulis inline di sini, bukan lewat komponen
  // bersama. Rentangnya kecil (±26px) dan terasa halus, tapi kategorinya
  // tetap "parallax dekoratif" — DILARANG oleh DESIGN-SYSTEM §7. Dan pada
  // foto yang menjadi latar SELURUH hero, gerak itu menyeret teks di
  // atasnya secara visual justru saat pembaca berusaha membacanya.

  /* Angka = baseline dari admin + tambahan dari data nyata. Dihitung di
     server (lib/data/hero.ts), bukan di sini, supaya komponen ini tetap
     hanya menggambar. `isStatic` kini berarti "tidak punya sumber dinamis
     yang sah" — lihat catatan Ton Distribusi di lib/data/hero.ts. */
  const stats = heroStats.map((s, i) => ({
    label: s.label,
    value: heroStatTotal(s),
    suffix: s.suffix,
    isStatic: s.dynamic === null,
    delay: i * 100,
  }))

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
      ref={sectionRef}
      className="relative overflow-hidden bg-salt-50"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Hero"
    >
      {/* Foto full-bleed — background penuh section, bukan panel mengambang.
          Overlay: solid di mobile, gradient reveal di lg+ (lihat catatan
          atas file). Foto kini DIAM — parallax-nya dicabut di CP7. */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0">
          {slides.map((slide, i) =>
            failed.has(i) ? null : (
              <div
                key={slide.src}
                className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
                style={{ opacity: i === current ? 1 : 0 }}
              >
                <Image
                  src={slide.src}
                  alt=""
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className="object-cover"
                  onError={() => markFailed(i)}
                />
              </div>
            )
          )}
        </div>
        {/* RONDE 7: overlay sebelumnya terlalu kuat (foto nyaris hilang).
            Dikurangi — zona teks (0–35%) tetap solid utk keterbacaan,
            tapi meluruh jauh lebih cepat sehingga foto jelas terlihat di
            sisi kanan & tengah. Mobile: /95 → /55 (foto lebih terlihat,
            teks tetap aman krn latar section sendiri sudah terang).
            RONDE Tahap 3: di mobile foto ternyata JADI terlalu dominan
            lagi & menelan teks (keluhan baru, potret 9:16) — overlay flat
            TIDAK dinaikkan lagi (sudah pernah "terlalu kuat" sebelumnya),
            solusinya glass panel khusus mobile di sekitar blok teks (lihat
            di bawah) — legibility datang dari blur lokal, bukan menutup
            foto secara global lagi. */}
        <div className="absolute inset-0 bg-white/55 lg:bg-gradient-to-r lg:from-white lg:from-35% lg:via-white/45 lg:via-55% lg:to-white/5" />
        {/* Fade bawah — batas Hero jangan garis lurus, foto meluruh halus
            ke warna dasar section (salt-50) di 3 baris terakhir. */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-salt-50 to-transparent md:h-36" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:py-16 lg:py-20">
        {/* RONDE Tahap 3 (poin HERO): panel kaca KHUSUS mobile/potret —
            fix legibility tanpa menaikkan overlay foto secara global lagi
            (sudah pernah kebalikannya jadi keluhan di Ronde 7). rounded-3xl
            + backdrop-blur-md + bg-white/60 memberi kontras terjamin apa
            pun kecerahan foto di baliknya, sekaligus tetap "nuansa cerah"
            (bukan overlay gelap). Netral di sm+ (bg/blur/padding dilepas),
            layout desktop 100% tidak berubah. */}
        <div className="rounded-3xl bg-white/60 p-5 backdrop-blur-md sm:rounded-none sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <motion.div
          variants={container}
          initial={prefersReduced ? 'visible' : 'hidden'}
          animate="visible"
          className="max-w-2xl"
        >
          <motion.div variants={item} className="rule-index font-ui inline-flex items-center gap-1.5 text-brand-teal-600">
            <SealCheckIcon size={16} weight="fill" aria-hidden="true" className="text-brand-teal-600" />
            Distributor Bersertifikasi SNI
          </motion.div>

          {/* RONDE 7: filosofi tipografi "Katalog Produk" (aksen italic
              berwarna pada kata kunci, dalam typeface yang sama) diterapkan
              di sini juga — Fraunces italic utk H1 (satu-satunya section
              yang memang memakai Fraunces), bukan menambah font baru.
              RONDE Tahap 8: "tanpa ribet" (register kasual/slang) diganti
              — copywriting Beranda dinilai klien "terlalu AI-generated,
              kaku/hiperbolis". Diksi B2B yang lebih berwibawa, konsisten
              dgn tone "Standar yang Konsisten" yg sudah dipakai di Hero
              /produk. */}
          {/* Headline dari CMS. Tiap span dirender sebagai TEXT NODE dan
              kelasnya diambil dari daftar tertutup heroStyleClass() — admin
              memilih PERAN ("primary"), bukan warna. Itulah yang mencegah
              CMS merusak sistem desain, dan sekaligus menutup jalur
              HTML-injection: tidak pernah ada HTML untuk disuntik. */}
          <motion.h1
            variants={item}
            className="mt-5 text-balance font-display text-3xl md:text-4xl font-semibold leading-[1.06] tracking-tight text-ink-900"
          >
            {hero.headline.map((span, i) => (
              <span key={i} className={heroStyleClass(span.style)}>
                {span.text}
              </span>
            ))}
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-5 max-w-xl text-pretty text-base md:text-lg leading-relaxed text-ink-700/80"
          >
            {hero.subheadline.map((span, i) => (
              <span key={i} className={heroStyleClass(span.style)}>
                {span.text}
              </span>
            ))}
          </motion.p>

          <motion.div variants={item} className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
            {/* RONDE Tahap 3 — poin UMUM "Mouse Tracking/Hover": CTA
                utama bereaksi mengikuti kursor (magnetic-hover), elemen
                paling sering disorot pengunjung di seluruh beranda. */}
              <Link
                href="/minta-penawaran"
                aria-label="Minta penawaran harga sekarang"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'font-ui rounded-md bg-brand-teal-600 text-white hover:bg-brand-teal-500'
                )}
              >
                Minta Penawaran Sekarang
                <ArrowRightIcon weight="bold" className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            <Link
              href="/produk"
              aria-label="Lihat lima produk garam kami"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'font-ui rounded-xl border-ink-900/20 bg-white/70 text-ink-900 hover:bg-white hover:text-ink-900'
              )}
            >
              Lihat 5 Produk Garam
            </Link>
          </motion.div>

          {/* Garis kredensial — pengganti kotak statistik 4-sel. Data sama
              (angka tetap ada, Fondasi Brand Nilai 2 wajib spesifik &
              terverifikasi), tapi disajikan sebagai satu baris tipis
              beraksen mono, bukan blok kartu terpisah dari narasi. */}
          <motion.div
            variants={item}
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-ink-900/10 pt-5"
            aria-label="Statistik perusahaan"
          >
            {stats.map((s) => (
              <div key={s.label} className="flex items-baseline gap-1.5">
                {s.isStatic ? (
                  <span className="mono-tech text-base font-bold text-brand-teal-700">
                    {s.value}{s.suffix}
                  </span>
                ) : (
                  <AnimatedCounter
                    target={s.value}
                    suffix={s.suffix}
                    staggerDelay={s.delay}
                    className="mono-tech text-base font-bold text-brand-teal-700"
                  />
                )}
                <span className="font-ui text-xs font-medium text-ink-900/50">{s.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
        </div>
      </div>

      {/* Pagination — pojok kanan bawah, kecil & tidak mengganggu foto */}
      {slides.length > 1 && (
        <div
          className="relative z-10 mx-auto flex max-w-7xl justify-end gap-2 px-4 pb-6 lg:absolute lg:bottom-6 lg:right-8 lg:justify-start lg:pb-0"
          role="tablist"
          aria-label="Pilih foto hero"
        >
          {slides.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === current}
              aria-label={`Foto ${i + 1} dari ${slides.length}`}
              onClick={() => goTo(i)}
              /* Area sentuh 44px lewat padding + kotak transparan, sementara
                 titiknya tetap 6px. Membesarkan titiknya sendiri akan
                 mengubah indikator jadi deretan tombol yang berebut
                 perhatian dengan CTA di sebelahnya. */
              className={`relative flex h-11 items-center px-1.5 transition-all duration-300 before:block before:h-1.5 before:rounded-full before:transition-all before:duration-300 ${
                i === current
                  ? 'before:w-7 before:bg-brand-teal-600'
                  : 'before:w-1.5 before:bg-ink-900/20 hover:before:bg-ink-900/40'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
