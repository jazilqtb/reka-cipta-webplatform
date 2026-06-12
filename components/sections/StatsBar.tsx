// components/sections/StatsBar.tsx
// Epic 2 Slice 1 (E2-S1-FE-03) — Stats Bar 2-slide carousel.
//
// Slide 1: 4 stat (AnimatedCounter — kecuali "Jenis Garam" yang
//          statis, sesuai UX-02). Nilai dinamis dari company_settings.
// Slide 2: InteractiveDistributionMap (FE-10).
//
// Keputusan implementasi:
// - Slide ditumpuk via CSS Grid (grid-area 1/1) → tinggi container
//   = slide tertinggi → ZERO layout shift saat pindah slide (CLS).
// - toNumber(): nilai DB string diparse defensif, fallback = seed
//   Fase 1 (6/9/353) — perluasan acceptance criteria US-02.
// - Auto-slide 8s; pause: hover / interaksi (12s) / reduced-motion /
//   tab hidden. Konsisten dengan HeroCarousel.
// - Slide non-aktif: aria-hidden + inert (fokus keyboard tidak
//   masuk ke konten tersembunyi).
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useReducedMotion } from 'framer-motion'
import { AnimatedCounter } from '@/components/animations/AnimatedCounter'
import { InteractiveDistributionMap } from '@/components/sections/InteractiveDistributionMap'
import type { CompanySettingsMap } from '@/types/api'

const AUTO_SLIDE_MS = 8000
const MANUAL_PAUSE_MS = 12000
const SLIDE_COUNT = 2

// Fallback = seed Fase 1 (DB-02). Jangan ubah tanpa menyamakan
// FALLBACK_SETTINGS di app/(public)/page.tsx dan seed migration.
const FALLBACK = { partner_count: 6, cities_served: 9, total_distribution_tons: 353 }

function toNumber(raw: string | undefined, fallback: number): number {
  const n = Number.parseInt((raw ?? '').trim(), 10)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

interface StatsBarProps {
  settings: CompanySettingsMap
}

export function StatsBar({ settings }: StatsBarProps) {
  const [slide, setSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const prefersReduced = useReducedMotion()
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Stat values — stagger 0/150/300/450ms (Design System §8.4)
  const stats = [
    { label: 'Jenis Garam',       value: 5,                                                          suffix: '',  isStatic: true,  delay: 0 },
    { label: 'Mitra Aktif',       value: toNumber(settings.partner_count, FALLBACK.partner_count),   suffix: '+', isStatic: false, delay: 150 },
    { label: 'Kota Dilayani',     value: toNumber(settings.cities_served, FALLBACK.cities_served),   suffix: '+', isStatic: false, delay: 300 },
    { label: 'Distribusi (TON)',  value: toNumber(settings.total_distribution_tons, FALLBACK.total_distribution_tons), suffix: '', isStatic: false, delay: 450 },
  ]

  // Auto-slide — berhenti saat paused / reduced motion / tab hidden
  useEffect(() => {
    if (isPaused || prefersReduced) return
    const tick = () => setSlide((s) => (s + 1) % SLIDE_COUNT)
    let id = setInterval(tick, AUTO_SLIDE_MS)
    const onVisibility = () => {
      clearInterval(id)
      if (document.visibilityState === 'visible') id = setInterval(tick, AUTO_SLIDE_MS)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [isPaused, prefersReduced])

  // Interaksi manual → pindah + jeda autoplay
  const goTo = useCallback((target: number) => {
    setSlide(((target % SLIDE_COUNT) + SLIDE_COUNT) % SLIDE_COUNT)
    setIsPaused(true)
    if (resumeTimer.current) clearTimeout(resumeTimer.current)
    resumeTimer.current = setTimeout(() => setIsPaused(false), MANUAL_PAUSE_MS)
  }, [])

  useEffect(() => () => { if (resumeTimer.current) clearTimeout(resumeTimer.current) }, [])

  return (
    <section
      className="bg-brand-teal-50/60 py-14 md:py-20"
      aria-label="Statistik dan jangkauan distribusi perusahaan"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className="relative mx-auto max-w-5xl px-4"
        role="region"
        aria-roledescription="carousel"
        aria-label="Statistik perusahaan — 2 tampilan"
      >
        {/* ── Slide stack: grid-area 1/1, tinggi = slide tertinggi ── */}
        <div className="grid">
          {/* Slide 1 — Stats */}
          <div
            className="transition-opacity duration-500 [grid-area:1/1]"
            style={{ opacity: slide === 0 ? 1 : 0, pointerEvents: slide === 0 ? 'auto' : 'none' }}
            aria-hidden={slide !== 0}
            inert={slide !== 0}
          >
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col items-center justify-center text-center">
                  {s.isStatic ? (
                    <span className="text-4xl font-extrabold text-brand-teal-600 md:text-5xl">
                      {s.value}{s.suffix}
                    </span>
                  ) : (
                    <AnimatedCounter
                      target={s.value}
                      suffix={s.suffix}
                      staggerDelay={s.delay}
                      className="text-4xl font-extrabold text-brand-teal-600 md:text-5xl"
                    />
                  )}
                  <p className="mt-2 text-sm font-medium text-neutral-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Slide 2 — Peta distribusi */}
          <div
            className="transition-opacity duration-500 [grid-area:1/1]"
            style={{ opacity: slide === 1 ? 1 : 0, pointerEvents: slide === 1 ? 'auto' : 'none' }}
            aria-hidden={slide !== 1}
            inert={slide !== 1}
          >
            <InteractiveDistributionMap />
          </div>
        </div>

        {/* ── Navigasi panah ── */}
        <button
          type="button"
          onClick={() => goTo(slide - 1)}
          aria-label="Tampilan sebelumnya"
          className="absolute -left-1 top-1/2 -translate-y-1/2 rounded-full border border-neutral-200 bg-white p-2 text-neutral-500 shadow-sm transition-colors hover:border-brand-teal-300 hover:text-brand-teal-600 md:-left-4"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => goTo(slide + 1)}
          aria-label="Tampilan berikutnya"
          className="absolute -right-1 top-1/2 -translate-y-1/2 rounded-full border border-neutral-200 bg-white p-2 text-neutral-500 shadow-sm transition-colors hover:border-brand-teal-300 hover:text-brand-teal-600 md:-right-4"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* ── Pagination dots ── */}
        <div className="mt-8 flex justify-center gap-2" role="tablist" aria-label="Pilih tampilan statistik">
          {['Statistik', 'Peta distribusi'].map((label, i) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={slide === i}
              aria-label={label}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                slide === i ? 'w-6 bg-brand-teal-600' : 'w-2 bg-neutral-300 hover:bg-neutral-400'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
