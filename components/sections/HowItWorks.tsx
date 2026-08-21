// components/sections/HowItWorks.tsx
// Epic 2 Slice 1 (E2-S1-FE-05) — Wireframe v1.0 §4.
// RONDE 4 (2026-08), revisi 11 poin klien:
// - Bentuk: tab button (.notch) & panel (.notch-both/.notch-lg) balik ke
//   rounded-xl/rounded-2xl. Badge ikon (.facet-frame/-lg) → .icon-hex
//   (satu-satunya bentuk potong tersisa di beranda).
// - Latar panel: .bg-dot-grid (dot generik) → .bg-salt-texture (kisi
//   garis terfaset, konsisten dgn seluruh beranda).
// - Ikon: Lucide → Phosphor duotone.
// - Tipografi: H2 & H3 pindah ke font-ui (Fraunces kini hanya H1 hero).
//
// Interaksi TIDAK berubah dari sebelumnya: tablist interaktif, klik
// langkah mana pun untuk lompat, auto-cycle saat idle, berhenti saat
// interaksi/reduced-motion/tab tersembunyi.
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import { ChatTextIcon, ListChecksIcon, FlaskIcon, TruckIcon } from '@phosphor-icons/react/ssr'
import { RevealWrapper } from '@/components/animations/RevealWrapper'
import { cn } from '@/lib/utils'

interface Step {
  num: number
  title: string
  desc: string
  icon: PhosphorIcon
}

const STEPS: Step[] = [
  {
    num: 1,
    title: 'Hubungi Kami',
    desc: 'Sampaikan kebutuhan garam industri Anda melalui WhatsApp atau form kontak. Tim kami merespons dalam 1×24 jam.',
    icon: ChatTextIcon,
  },
  {
    num: 2,
    title: 'Konsultasi Kebutuhan',
    desc: 'Diskusi mendalam tentang spesifikasi (NaCl%, granulasi), volume bulanan, dan jadwal pengiriman yang sesuai.',
    icon: ListChecksIcon,
  },
  {
    num: 3,
    title: 'Pengiriman Sampel',
    desc: 'Kami kirimkan sampel produk untuk diuji di laboratorium Anda. Pastikan kualitas sebelum kontrak.',
    icon: FlaskIcon,
  },
  {
    num: 4,
    title: 'Distribusi Rutin',
    desc: 'Setelah deal, kami atur jadwal distribusi berkala dengan dokumentasi lengkap dan tepat waktu.',
    icon: TruckIcon,
  },
]

const AUTOPLAY_MS = 4800
const EASE = [0.25, 0.46, 0.45, 0.94] as const

export default function HowItWorks() {
  const prefersReduced = useReducedMotion()
  const [activeStep, setActiveStep] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-cycle — sama pola dengan HeroCarousel (autoplay + pause on
  // interaction/hidden-tab/reduced-motion) demi konsistensi UX.
  useEffect(() => {
    if (isPaused || prefersReduced) return

    const tick = () => setActiveStep((s) => (s + 1) % STEPS.length)
    let id = setInterval(tick, AUTOPLAY_MS)

    const onVisibility = () => {
      clearInterval(id)
      if (document.visibilityState === 'visible') id = setInterval(tick, AUTOPLAY_MS)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [isPaused, prefersReduced])

  const selectStep = useCallback((index: number) => {
    setActiveStep(index)
    setIsPaused(true)
    if (resumeTimer.current) clearTimeout(resumeTimer.current)
    resumeTimer.current = setTimeout(() => setIsPaused(false), 9000)
  }, [])

  useEffect(() => () => { if (resumeTimer.current) clearTimeout(resumeTimer.current) }, [])

  const active = STEPS[activeStep]
  const ActiveIcon = active.icon

  return (
    <section
      className="bg-ink-900 px-4 py-14 md:py-20"
      aria-labelledby="howitworks-heading"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="mx-auto max-w-6xl">
        <RevealWrapper>
          <div className="mb-8 text-center md:mb-12">
            <p className="rule-index font-ui justify-center text-brand-teal-300">
              Alur Kemitraan
            </p>
            <h2
              id="howitworks-heading"
              className="mt-3 text-balance font-ui text-2xl md:text-3xl font-semibold leading-tight text-white"
            >
              Cara Kami <span className="font-medium text-brand-teal-300">Bekerja</span>
            </h2>
            {/* REDUNDANSI (CP2): subtitle "…dalam empat langkah" dihapus —
                empat langkah bernomor terpampang tepat di bawahnya. */}
          </div>
        </RevealWrapper>

        <div className="grid gap-5 md:grid-cols-[minmax(0,340px)_1fr] md:gap-10 lg:gap-14">
          {/* Tablist langkah */}
          <div role="tablist" aria-label="4 langkah proses kerja" className="flex flex-col gap-2">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              const isActive = i === activeStep
              return (
                <button
                  key={step.num}
                  id={`howitworks-tab-${step.num}`}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  aria-controls="howitworks-panel"
                  onClick={() => selectStep(i)}
                  className={cn(
                    'group rounded-xl border px-4 py-3 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:shadow-focus-dark',
                    isActive
                      ? 'border-brand-teal-400/30 bg-white/[0.06]'
                      : 'border-white/[0.06] hover:bg-white/[0.03]'
                  )}
                >
                  <div className="flex items-center gap-3.5">
                    {/* RONDE 6: badge .icon-hex dihapus — ikon aktif dapat
                        wash lingkaran lembut (bukan frame bersudut) +
                        pulse-ring, ikon nonaktif polos tanpa latar sama
                        sekali (lebih organik, bukan "tempelan" generik). */}
                    <span
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-300',
                        isActive
                          ? ' bg-brand-teal-500 text-white'
                          : 'text-white/45 group-hover:text-white/70'
                      )}
                    >
                      <Icon size={20} weight="duotone" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'font-ui text-xs font-bold uppercase tracking-wide transition-colors duration-300',
                          isActive ? 'text-brand-teal-300' : 'text-white/35'
                        )}
                      >
                        Langkah {step.num}
                      </p>
                      <p
                        className={cn(
                          'font-ui truncate font-semibold transition-colors duration-300',
                          isActive ? 'text-base text-white' : 'text-sm text-white/55'
                        )}
                      >
                        {step.title}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar — hanya saat aktif & autoplay berjalan */}
                  {isActive && !prefersReduced && !isPaused && (
                    <div className="mt-2.5 h-0.5 w-full overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        key={activeStep}
                        className="h-full bg-brand-teal-400"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: AUTOPLAY_MS / 1000, ease: 'linear' }}
                      />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Panel konten aktif. Radial glow dicabut di CP0 ronde 3 —
              rgba-nya hijau lama yang ditulis literal, dan gradien sebagai
              latar melanggar §9. Kini panel solid tipis di atas bidang
              gelap, dibedakan hanya oleh garis dan sedikit terang. */}
          <div
            id="howitworks-panel"
            role="tabpanel"
            aria-labelledby={`howitworks-tab-${active.num}`}
            className="relative overflow-hidden rounded-md border border-white/10 bg-white/[0.04] p-8 md:p-12"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeStep}
                initial={prefersReduced ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReduced ? undefined : { opacity: 0, y: -14 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="relative z-10"
              >
                <ActiveIcon size={40} weight="duotone" className="mb-6 text-marine-200" aria-hidden="true" />
                <p className="mono-tech text-xs text-white/40">
                  Langkah {String(active.num).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
                </p>
                <h3 className="mt-2 font-ui text-lg font-semibold text-white md:text-xl">
                  {active.title}
                </h3>
                <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-white/75">
                  {active.desc}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
