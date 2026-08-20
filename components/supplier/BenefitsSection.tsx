// components/supplier/BenefitsSection.tsx
// Epic 5 Customer-Facing (E5-CF-FE-04) — 3 kartu manfaat jadi supplier,
// statis di halaman /jadi-supplier.
//
// RONDE Tahap 11 (2026-08) — Design System Rollout (T4): ikon Lucide →
// Phosphor duotone + hover-scale, kartu → .panel-card (hover lift +
// soft shadow, tanpa border menyala), ditambah heading eyebrow+italic
// (sebelumnya grid kartu muncul tanpa judul section sama sekali).
// Aksen sand-* dipakai konsisten dgn strip supplier di Beranda —
// CLAUDE.md mendedikasikan sand sbg "Accent (supplier sections)".

import { GlobeHemisphereWestIcon, RepeatIcon, ScalesIcon } from '@phosphor-icons/react/ssr'
import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import { RevealWrapper } from '@/components/animations/RevealWrapper'

interface Benefit {
  icon: PhosphorIcon
  title: string
  body: string
}

const BENEFITS: Benefit[] = [
  {
    icon: GlobeHemisphereWestIcon,
    title: 'Distribusi Luas',
    body: 'Produk Anda terhubung ke jaringan buyer industri di seluruh Indonesia melalui CV Reka Cipta.',
  },
  {
    icon: RepeatIcon,
    title: 'Pembelian Rutin',
    body: 'Kontrak jangka panjang dengan volume pembelian tetap setiap bulan.',
  },
  {
    icon: ScalesIcon,
    title: 'Harga Adil',
    body: 'Harga negosiasi transparan berbasis kualitas dan kapasitas produksi.',
  },
]

export function BenefitsSection() {
  return (
    <section className="bg-white px-4 py-14 md:py-20">
      <div className="mx-auto max-w-5xl">
        <RevealWrapper className="text-center">
          <p className="rule-index font-ui justify-center text-sand-700">Manfaat Kemitraan</p>
          <h2 className="mt-3 font-ui text-2xl font-semibold text-ink-700 md:text-3xl">
            Kenapa Bermitra <span className="font-medium text-sand-600">dengan Kami</span>
          </h2>
        </RevealWrapper>

        <div className="mt-8 grid grid-cols-1 gap-5 md:mt-10 md:grid-cols-3">
          {BENEFITS.map((benefit, index) => {
            const Icon = benefit.icon
            return (
              <RevealWrapper key={benefit.title} variant="reveal-up" delay={index * 80}>
                <div className="panel-card group flex h-full flex-col items-center gap-3 rounded-2xl p-6 text-center">
                  <Icon
                    size={40}
                    weight="duotone"
                    className="text-sand-600 transition-transform duration-300 group-hover:scale-110"
                    aria-hidden="true"
                  />
                  <h3 className="font-ui text-base font-bold text-ink-700">{benefit.title}</h3>
                  <p className="text-pretty text-sm leading-relaxed text-neutral-600">{benefit.body}</p>
                </div>
              </RevealWrapper>
            )
          })}
        </div>
      </div>
    </section>
  )
}
