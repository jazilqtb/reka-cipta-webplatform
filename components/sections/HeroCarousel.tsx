// components/sections/HeroCarousel.tsx
// Epic 2 Slice 1 (E2-S1-FE-02) — Client leaf dari HeroSection.
//
// Tanggung jawab: carousel crossfade + autoplay + pagination dots
// + stagger Framer Motion untuk teks (wireframe §1).
// - Autoplay 5s; pause saat hover, dot diklik, reduced-motion,
//   atau tab tidak terlihat (visibilitychange).
// - Foto absen (keputusan Fase 0): onError per slide → layer
//   bg-brand-teal-900 di belakang selalu jadi fallback.
//
// Catatan refactor: CTA Link memakai class `buttonVariants(...)`
// langsung, bukan `<Button asChild>`. Alasan: proyek pakai Base UI
// (`@base-ui/react`) yang tidak punya pattern asChild seperti Radix.
// Menambahkan asChild = melanggar aturan frozen components/ui/.
// Pattern ini juga idiomatik shadcn untuk anchor (lihat dokumentasi
// shadcn → "Using as a Link").
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

// Stagger sesuai wireframe: badge → headline → sub → CTA,
// easing cubic-bezier(0.25, 0.46, 0.45, 0.94)
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

  // Autoplay — berhenti saat paused / reduced motion / tab hidden
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

  // Klik dot: pindah slide + jeda autoplay 6 detik
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

      {/* Overlay gelap diperkuat untuk kontras teks */}
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
