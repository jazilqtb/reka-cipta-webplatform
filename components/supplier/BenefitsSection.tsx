// components/supplier/BenefitsSection.tsx
// Epic 5 Customer-Facing (E5-CF-FE-04) — 3 kartu manfaat jadi supplier,
// statis di halaman /jadi-supplier.

import { Globe, Repeat, Scale } from 'lucide-react'
import { RevealWrapper } from '@/components/animations/RevealWrapper'

const BENEFITS = [
  {
    icon: Globe,
    title: 'Distribusi Luas',
    body: 'Produk Anda terhubung ke jaringan buyer industri di seluruh Indonesia melalui CV Reka Cipta.',
  },
  {
    icon: Repeat,
    title: 'Pembelian Rutin',
    body: 'Kontrak jangka panjang dengan volume pembelian tetap setiap bulan.',
  },
  {
    icon: Scale,
    title: 'Harga Adil',
    body: 'Harga negosiasi transparan berbasis kualitas dan kapasitas produksi.',
  },
]

export function BenefitsSection() {
  return (
    <section className="container mx-auto max-w-5xl px-4 py-12 md:py-16">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {BENEFITS.map((benefit, index) => {
          const Icon = benefit.icon
          return (
            <RevealWrapper key={benefit.title} delay={index * 100}>
              <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-6 text-center">
                <div className="inline-flex rounded-full bg-brand-teal-50 p-3">
                  <Icon className="h-6 w-6 text-brand-teal-600" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-ink-700">{benefit.title}</h3>
                <p className="text-sm text-neutral-600">{benefit.body}</p>
              </div>
            </RevealWrapper>
          )
        })}
      </div>
    </section>
  )
}
