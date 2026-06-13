// components/sections/HowItWorks.tsx
// Epic 2 Slice 1 (E2-S1-FE-05) — Wireframe v1.0 §4.
//
// Scroll-driven sticky section yang menampilkan 4 langkah proses
// distribusi. Saat user scroll melewati section ini, panel teks
// tetap di tempat (sticky) sementara background image juga diam.
// Step aktif berubah berdasarkan scrollYProgress.
//
// KEPUTUSAN DESAIN (lihat panduan Fase 7.3 lengkap):
// - useScroll + useTransform (bukan IO berlapis) — interpolasi mulus
// - Sticky strategy: outer 400vh + inner 100vh sticky
// - Step activation via useMotionValueEvent (4× re-render, bukan
//   interpolasi opacity per frame — lebih efisien)
// - Desktop: panel dari kiri 50%; Mobile: dari bawah 50%
// - Reduced motion: fallback static 4-step grid
// - Foto background pending (Fase 0) — fallback gradient teal gelap
'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import {
  motion,
  useScroll,
  useMotionValueEvent,
  useReducedMotion,
} from 'framer-motion'
import { MessageSquare, ListChecks, FlaskConical, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Data 4 langkah proses ────────────────────────────────────
interface Step {
  num: number
  title: string
  desc: string
  icon: typeof MessageSquare
}

const STEPS: Step[] = [
  {
    num: 1,
    title: 'Hubungi Kami',
    desc: 'Sampaikan kebutuhan garam industri Anda melalui WhatsApp atau form kontak. Tim kami merespons dalam 1×24 jam.',
    icon: MessageSquare,
  },
  {
    num: 2,
    title: 'Konsultasi Kebutuhan',
    desc: 'Diskusi mendalam tentang spesifikasi (NaCl%, granulasi), volume bulanan, dan jadwal pengiriman yang sesuai.',
    icon: ListChecks,
  },
  {
    num: 3,
    title: 'Pengiriman Sampel',
    desc: 'Kami kirimkan sampel produk untuk diuji di laboratorium Anda. Pastikan kualitas sebelum kontrak.',
    icon: FlaskConical,
  },
  {
    num: 4,
    title: 'Distribusi Rutin',
    desc: 'Setelah deal, kami atur jadwal distribusi berkala dengan dokumentasi lengkap dan tepat waktu.',
    icon: Truck,
  },
]

// ─── Fallback layout — reduced motion atau SSR ────────────────
function HowItWorksStatic() {
  return (
    <section className="bg-ink-900 px-4 py-20 text-white md:py-28" aria-labelledby="howitworks-heading">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center md:mb-16">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-teal-300">
            Proses Kerja Kami
          </p>
          <h2 id="howitworks-heading" className="text-3xl font-bold md:text-4xl">
            Cara Kami Bekerja
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            Empat langkah sederhana, transparan, dan terukur untuk membangun
            kemitraan distribusi jangka panjang.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => {
            const Icon = step.icon
            return (
              <div
                key={step.num}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-teal-600/20 text-brand-teal-300">
                  <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <p className="mb-1 text-xs font-bold text-brand-teal-300">
                  LANGKAH {step.num}
                </p>
                <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-white/70">{step.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── Komponen utama: scroll-driven sticky ─────────────────────
export default function HowItWorks() {
  const prefersReduced = useReducedMotion()
  const [activeStep, setActiveStep] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  // Update activeStep berdasarkan scrollYProgress
  // 0.000–0.249 → step 0, 0.250–0.499 → step 1, dst.
  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const next = Math.min(Math.floor(latest * STEPS.length), STEPS.length - 1)
    setActiveStep(next)
  })

  // Reduced motion → fallback static layout
  if (prefersReduced) {
    return <HowItWorksStatic />
  }

  return (
    <>
      {/* SR-only daftar lengkap utk screen reader — selalu terbaca,
          tidak bergantung pada scroll position */}
      <div className="sr-only">
        <h2>Cara Kami Bekerja — 4 Langkah</h2>
        <ol>
          {STEPS.map((s) => (
            <li key={s.num}>
              <strong>Langkah {s.num} — {s.title}:</strong> {s.desc}
            </li>
          ))}
        </ol>
      </div>

      {/* Outer container — tinggi = jumlah step × 100vh.
          Pakai aria-hidden krn isinya dekoratif (SR sudah baca ol di atas). */}
      <section
        ref={containerRef}
        className="relative bg-ink-900"
        style={{ height: `${STEPS.length * 100}vh` }}
        aria-hidden="true"
      >
        {/* Inner sticky — diam saat outer di-scroll */}
        <div className="sticky top-0 flex h-screen w-full overflow-hidden">
          {/* ── Background image layer ─────────────────────── */}
          <div className="absolute inset-0">
            {/* Foto background — TODO klien sediakan how-it-works-bg.jpg.
                Jika file tidak ada, onError tidak relevan untuk fill mode
                Next/Image — sebagai gantinya, gradient di belakang. */}
            <div className="absolute inset-0 bg-gradient-to-br from-ink-900 via-brand-teal-900 to-ink-900" />
            <Image
              src="/images/how-it-works-bg.jpg"
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-40"
              priority={false}
              // Saat file tidak ada, Next/Image diam-diam fail; gradient
              // di div di atasnya tetap menjadi background visual.
            />
            {/* Overlay gelap utk kontras teks */}
            <div className="absolute inset-0 bg-gradient-to-r from-ink-900/95 via-ink-900/70 to-ink-900/40 md:from-ink-900/95 md:via-ink-900/85 md:to-transparent" />
          </div>

          {/* ── Panel konten ───────────────────────────────── */}
          {/* Desktop: kiri 50%, Mobile: bawah 50% */}
          <div className="relative z-10 flex h-full w-full flex-col justify-end md:w-1/2 md:justify-center md:p-12 lg:p-16">
            <div className="bg-ink-900/80 p-6 backdrop-blur-md md:rounded-2xl md:bg-ink-900/60 md:p-10">
              {/* Header section */}
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-teal-300">
                Proses Kerja Kami
              </p>
              <h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">
                Cara Kami Bekerja
              </h2>

              {/* Step list dengan progress line */}
              <div className="relative flex gap-4">
                {/* Progress line — vertikal di kiri step list */}
                <div className="relative flex w-1 shrink-0 flex-col">
                  <div className="absolute inset-0 rounded-full bg-white/15" />
                  <motion.div
                    className="absolute left-0 right-0 top-0 rounded-full bg-brand-teal-400"
                    style={{
                      scaleY: scrollYProgress,
                      transformOrigin: 'top',
                      height: '100%',
                    }}
                  />
                </div>

                {/* Steps */}
                <ol className="flex w-full flex-col gap-4 md:gap-5">
                  {STEPS.map((step, i) => {
                    const Icon = step.icon
                    const isActive = i === activeStep
                    return (
                      <motion.li
                        key={step.num}
                        animate={{
                          opacity: isActive ? 1 : 0.35,
                          scale: isActive ? 1 : 0.96,
                        }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="flex gap-3"
                      >
                        <div
                          className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors duration-300',
                            isActive
                              ? 'bg-brand-teal-500 text-white'
                              : 'bg-white/10 text-white/60'
                          )}
                        >
                          <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                        </div>
                        <div className="flex-1">
                          <p className={cn(
                            'text-xs font-bold uppercase tracking-wide transition-colors duration-300',
                            isActive ? 'text-brand-teal-300' : 'text-white/40'
                          )}>
                            Langkah {step.num}
                          </p>
                          <h3 className={cn(
                            'mt-0.5 font-semibold transition-all duration-300',
                            isActive ? 'text-lg text-white md:text-xl' : 'text-base text-white/70'
                          )}>
                            {step.title}
                          </h3>
                          {/* Description hanya muncul saat aktif */}
                          <motion.p
                            initial={false}
                            animate={{
                              height: isActive ? 'auto' : 0,
                              opacity: isActive ? 1 : 0,
                              marginTop: isActive ? 8 : 0,
                            }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="overflow-hidden text-sm leading-relaxed text-white/70"
                          >
                            {step.desc}
                          </motion.p>
                        </div>
                      </motion.li>
                    )
                  })}
                </ol>
              </div>

              {/* Step counter — kanan bawah */}
              <p className="mt-6 text-right text-xs font-mono text-white/40">
                {String(activeStep + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
