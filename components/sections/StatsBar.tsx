// components/sections/StatsBar.tsx
// Epic 2 Slice 1 (E2-S1-FE-03) — REVISI: Single-slide static stats.
//
// Map distribusi (Slide 2) dihapus berdasarkan keputusan desain
// pasca-demo. StatsBar sekarang hanya menampilkan 4 angka:
// - Jenis Garam (statis)
// - Mitra Aktif, Kota Dilayani, Distribusi (TON) — dari DB
//
// Padding section dipersingkat agar tidak banyak white space.
'use client'

import { AnimatedCounter } from '@/components/animations/AnimatedCounter'
import type { CompanySettingsMap } from '@/types/api'

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
  // Stat values — stagger 0/150/300/450ms (Design System §8.4)
  const stats = [
    { label: 'Jenis Garam',       value: 5,                                                          suffix: '',  isStatic: true,  delay: 0 },
    { label: 'Mitra Aktif',       value: toNumber(settings.partner_count, FALLBACK.partner_count),   suffix: '+', isStatic: false, delay: 150 },
    { label: 'Kota Dilayani',     value: toNumber(settings.cities_served, FALLBACK.cities_served),   suffix: '+', isStatic: false, delay: 300 },
    { label: 'Distribusi (TON)',  value: toNumber(settings.total_distribution_tons, FALLBACK.total_distribution_tons), suffix: '', isStatic: false, delay: 450 },
  ]

  return (
    <section
      className="bg-white py-10 md:py-12 border-y border-neutral-100"
      aria-label="Statistik perusahaan"
    >
      <div className="mx-auto max-w-5xl px-4">
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
              <p className="mt-2 text-sm font-semibold text-neutral-700">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
