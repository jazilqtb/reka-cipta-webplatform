// components/calculator/CalculatorIntro.tsx
// Epic 6 Slice 2 (E6-S2-FE-03) — penjelasan singkat cara kerja kalkulator.

import { ClipboardList, Calculator, Sparkles } from 'lucide-react'

const STEPS = [
  {
    icon: ClipboardList,
    title: '1. Pilih Industri',
    description: 'Pilih jenis industri dan produk yang Anda produksi.',
  },
  {
    icon: Calculator,
    title: '2. Masukkan Kapasitas',
    description: 'Masukkan kapasitas produksi bulanan, mingguan, atau harian Anda.',
  },
  {
    icon: Sparkles,
    title: '3. Dapatkan Estimasi',
    description: 'Terima estimasi kebutuhan garam dan rekomendasi produk yang sesuai.',
  },
]

export function CalculatorIntro() {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-base text-neutral-600">
        Belum yakin berapa volume garam yang Anda butuhkan? Kalkulator ini membantu
        mengestimasi kebutuhan garam industri Anda dalam hitungan detik, berdasarkan
        jenis industri dan kapasitas produksi.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.title} className="space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-teal-50">
              <step.icon className="h-6 w-6 text-brand-teal-600" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-neutral-900">{step.title}</p>
            <p className="text-sm text-neutral-600">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
