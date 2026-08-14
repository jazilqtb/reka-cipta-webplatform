// components/calculator/CalculatorIntro.tsx
// Epic 6 Slice 2 (E6-S2-FE-03) — penjelasan singkat cara kerja kalkulator.
//
// RONDE Tahap 11 (2026-08) — Design System Rollout (T6): ikon Lucide →
// Phosphor duotone, 3 langkah jadi kartu bento compact dgn nomor
// mono-tech (pola sama Next Steps di ThankYouPanel), hover-scale ikon.
// Mobile: grid 3-kolom dipertahankan tapi jadi baris ringkas (ikon +
// teks sejajar) supaya tidak menumpuk vertikal panjang — poin
// "mobile-friendly, sekompak mungkin" dari klien.

import { ClipboardTextIcon, CalculatorIcon, SparkleIcon } from '@phosphor-icons/react/ssr'
import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import { RevealWrapper } from '@/components/animations/RevealWrapper'

interface Step {
  icon: PhosphorIcon
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    icon: ClipboardTextIcon,
    title: 'Pilih Industri',
    description: 'Pilih jenis industri dan produk yang Anda produksi.',
  },
  {
    icon: CalculatorIcon,
    title: 'Masukkan Kapasitas',
    description: 'Isi kapasitas produksi bulanan, mingguan, atau harian Anda.',
  },
  {
    icon: SparkleIcon,
    title: 'Dapatkan Estimasi',
    description: 'Terima estimasi kebutuhan garam dan rekomendasi produk.',
  },
]

export function CalculatorIntro() {
  return (
    <div className="mx-auto max-w-4xl">
      <RevealWrapper className="text-center">
        <p className="rule-index font-ui justify-center text-brand-teal-600">Cara Kerja</p>
        <h2 className="mt-3 font-ui text-2xl font-semibold text-ink-700 md:text-3xl">
          Tiga Langkah, <span className="italic font-medium text-brand-teal-600">Hitungan Detik</span>
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-pretty text-neutral-600">
          Estimasi kebutuhan garam industri Anda berdasarkan jenis industri dan kapasitas produksi.
        </p>
      </RevealWrapper>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {STEPS.map((step, i) => {
          const Icon = step.icon
          return (
            <RevealWrapper key={step.title} variant="reveal-up" delay={i * 80}>
              {/* Mobile: baris (ikon kiri, teks kanan) → padat.
                  sm+: kolom (ikon atas) → kartu bento klasik. */}
              <div className="panel-card group flex h-full items-start gap-3.5 rounded-2xl p-4 sm:flex-col sm:items-center sm:gap-2 sm:p-5 sm:text-center">
                <Icon
                  size={26}
                  weight="duotone"
                  className="mt-0.5 shrink-0 text-brand-teal-600 transition-transform duration-300 group-hover:scale-110 sm:mt-0"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-ui text-sm font-bold text-ink-700">
                    <span className="mono-tech mr-1.5 text-brand-teal-600">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {step.title}
                  </p>
                  <p className="mt-1 text-pretty text-sm leading-relaxed text-neutral-600">
                    {step.description}
                  </p>
                </div>
              </div>
            </RevealWrapper>
          )
        })}
      </div>
    </div>
  )
}
