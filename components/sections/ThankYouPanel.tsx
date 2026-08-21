// components/sections/ThankYouPanel.tsx
// RONDE Tahap 11 (2026-08) — Design System Rollout (T1/T5/T8).
//
// Success state bersama untuk /minta-penawaran/terima-kasih dan
// /jadi-supplier/terima-kasih. Sebelumnya kedua halaman itu adalah
// <main> putih polos dgn ikon Lucide statis — tidak punya Hero, tidak
// punya divider, tidak punya DNA desain apa pun.
//
// Checkmark beranimasi memakai Framer Motion (`pathLength`) — BUKAN
// Lottie: tidak ada file .json brand yang tersedia, dan menambah
// dependency + aset eksternal hanya untuk satu centang adalah biaya
// yang tidak sepadan. SVG stroke-draw memberi hasil yang sama
// halusnya, nol aset, dan otomatis ikut warna brand.
//
// prefers-reduced-motion dihormati: animasi dilewati, centang langsung
// tampil utuh (bukan hilang).
'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRightIcon } from '@phosphor-icons/react/ssr'
import { RevealWrapper } from '@/components/animations/RevealWrapper'
import { SectionDivider } from '@/components/decorative/SectionDivider'

export interface NextStep {
  title: string
  desc: string
}

interface ThankYouPanelProps {
  eyebrow: string
  title: string
  titleAccent?: string
  subtitle: string
  steps: NextStep[]
  primaryCta: { label: string; href: string }
  secondaryCta: { label: string; href: string }
}

const EASE = [0.25, 0.46, 0.45, 0.94] as const

export function ThankYouPanel({
  eyebrow,
  title,
  titleAccent,
  subtitle,
  steps,
  primaryCta,
  secondaryCta,
}: ThankYouPanelProps) {
  const prefersReduced = useReducedMotion()

  return (
    <>
      <section className="relative overflow-hidden surface-dark px-4 pb-16 pt-16 md:pb-24 md:pt-24">

        <div className="relative mx-auto max-w-2xl text-center">
          {/* Checkmark beranimasi — lingkaran menggambar dulu, lalu centang */}
          <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center">
            <svg viewBox="0 0 52 52" className="h-20 w-20" aria-hidden="true" fill="none">
              <motion.circle
                cx="26"
                cy="26"
                r="23"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-brand-teal-400/40"
                initial={prefersReduced ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, ease: EASE }}
              />
              <motion.path
                d="M15 27 L23 34 L37 19"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-brand-teal-300"
                initial={prefersReduced ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, ease: EASE, delay: prefersReduced ? 0 : 0.45 }}
              />
            </svg>
          </div>

          <p className="rule-index font-ui justify-center text-brand-teal-300">{eyebrow}</p>

          <h1 className="mt-3 text-balance font-ui text-2xl md:text-3xl font-semibold leading-tight text-white">
            {title}
            {titleAccent && (
              <>
                {' '}
                <span className="font-medium text-brand-teal-300">{titleAccent}</span>
              </>
            )}
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-white/70 md:text-lg">
            {subtitle}
          </p>
        </div>
      </section>

      <SectionDivider variant="curve" fromClassName="fill-ink-900" toClassName="bg-white" flip />

      {/* Next Steps — informasi konkret, bukan sekadar "terima kasih" */}
      <section className="bg-white px-4 py-14 md:py-20">
        <div className="mx-auto max-w-4xl">
          {/* text-center WAJIB di elemen PEMBUNGKUS: .rule-index adalah
              inline-flex, jadi `text-center` pada <p>-nya sendiri hanya
              memusatkan isi di dalamnya, bukan elemennya terhadap kolom.
              Pola ini sama dgn StagedCTASection/IndustriesGrid. */}
          <RevealWrapper className="text-center">
            <p className="rule-index font-ui justify-center text-brand-teal-600">
              Langkah Selanjutnya
            </p>
            <h2 className="mt-3 font-ui text-2xl font-semibold text-ink-700 md:text-3xl">
              Apa yang <span className="font-medium text-brand-teal-600">Terjadi</span> Berikutnya
            </h2>
          </RevealWrapper>

          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {steps.map((step, i) => (
              <RevealWrapper key={step.title} variant="reveal-up" delay={i * 80}>
                <li className="panel-card flex h-full flex-col rounded-2xl p-5">
                  <span className="mono-tech flex h-8 w-8 items-center justify-center rounded-full bg-brand-teal-600 text-xs font-bold text-white">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-ui mt-4 text-base font-bold text-ink-700">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{step.desc}</p>
                </li>
              </RevealWrapper>
            ))}
          </ol>

          <RevealWrapper variant="reveal-up" delay={260}>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href={primaryCta.href}
                className="font-ui group inline-flex items-center justify-center gap-2 rounded-xl bg-brand-teal-600 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-teal-500 focus-visible:outline-none focus-visible:shadow-focus"
              >
                {primaryCta.label}
                <ArrowRightIcon size={16} weight="bold" className="arrow-icon" aria-hidden="true" />
              </Link>
              <Link
                href={secondaryCta.href}
                className="font-ui inline-flex items-center justify-center gap-2 rounded-xl border border-ink-900/15 px-5 py-3 text-sm font-semibold text-ink-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-salt-50 focus-visible:outline-none focus-visible:shadow-focus"
              >
                {secondaryCta.label}
              </Link>
            </div>
          </RevealWrapper>
        </div>
      </section>

      {/* Penutup ke Footer (ink-900) — fill-white match bg section di atas */}
      <SectionDivider variant="wave" fromClassName="fill-white" toClassName="bg-ink-900" flip />
    </>
  )
}
