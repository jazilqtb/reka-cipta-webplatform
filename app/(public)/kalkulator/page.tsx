// app/(public)/kalkulator/page.tsx
// Epic 6 Slice 2 (E6-S2-FE-04) — Kalkulator Kebutuhan Garam. Statis, tanpa
// data fetch server-side (SSG default), tidak ada `revalidate` karena tidak
// ada konten dari DB — konsisten CLAUDE.md ("/kalkulator: SSG, client-side
// logic only").

import type { Metadata } from 'next'
import { InnerPageHero } from '@/components/sections/InnerPageHero'
import { CalculatorIntro } from '@/components/calculator/CalculatorIntro'
import { CalculatorForm } from '@/components/calculator/CalculatorForm'

export const metadata: Metadata = {
  title: 'Kalkulator Kebutuhan Garam | CV Reka Cipta Indonesia',
  description:
    'Estimasikan kebutuhan garam industri Anda dan dapatkan rekomendasi produk yang sesuai dalam hitungan detik.',
  alternates: {
    canonical: 'https://rekaciptaindonesia.com/kalkulator',
  },
  openGraph: {
    title: 'Kalkulator Kebutuhan Garam — CV Reka Cipta Indonesia',
    description:
      'Estimasikan kebutuhan garam industri Anda dan dapatkan rekomendasi produk yang sesuai dalam hitungan detik.',
    url: 'https://rekaciptaindonesia.com/kalkulator',
    type: 'website',
  },
}

export default function KalkulatorPage() {
  return (
    <main>
      <InnerPageHero
        title="Kalkulator Kebutuhan Garam"
        subtitle="Estimasi kebutuhan garam industri Anda dalam hitungan detik"
      />
      <section className="px-4 py-12">
        <CalculatorIntro />
        <div className="mt-10">
          <CalculatorForm />
        </div>
      </section>
    </main>
  )
}
