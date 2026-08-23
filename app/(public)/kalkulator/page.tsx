// app/(public)/kalkulator/page.tsx
// Epic 6 Slice 2 (E6-S2-FE-04) — Kalkulator Kebutuhan Garam. Statis, tanpa
// data fetch server-side (SSG default), tidak ada `revalidate` karena tidak
// ada konten dari DB — konsisten CLAUDE.md ("/kalkulator: SSG, client-side
// logic only").

import type { Metadata } from 'next'
import { LightningIcon, SealCheckIcon } from '@phosphor-icons/react/ssr'
import { PageHero } from '@/components/sections/PageHero'
import { SectionDivider } from '@/components/decorative/SectionDivider'
import { CalculatorIntro } from '@/components/calculator/CalculatorIntro'
import { CalculatorForm } from '@/components/calculator/CalculatorForm'
import { SITE_URL } from '@/lib/site-url'

export const metadata: Metadata = {
  title: 'Kalkulator Kebutuhan Garam',
  description:
    'Estimasikan kebutuhan garam industri Anda dan dapatkan rekomendasi produk yang sesuai dalam hitungan detik.',
  alternates: {
    canonical: `${SITE_URL}/kalkulator`,
  },
  openGraph: {
    title: 'Kalkulator Kebutuhan Garam — CV Reka Cipta Indonesia',
    description:
      'Estimasikan kebutuhan garam industri Anda dan dapatkan rekomendasi produk yang sesuai dalam hitungan detik.',
    url: `${SITE_URL}/kalkulator`,
    type: 'website',
  },
}

export default function KalkulatorPage() {
  return (
    <main>
      <PageHero
        eyebrow="Kalkulator Kebutuhan"
        title="Perkirakan Kebutuhan Garam Anda"
        titleAccent="Sebelum Meminta Penawaran"
        subtitle="Masukkan jenis industri dan kapasitas produksi — kami hitungkan estimasi volume beserta produk yang sesuai."
        breadcrumbLabel="Kalkulator"
        credentials={[
          {
            icon: <LightningIcon size={16} weight="duotone" className="text-brand-teal-300" aria-hidden="true" />,
            label: 'Hasil Instan, Tanpa Perlu Isi Data Diri',
          },
          {
            icon: <SealCheckIcon size={16} weight="duotone" className="text-brand-teal-300" aria-hidden="true" />,
            label: 'Rekomendasi Produk Bersertifikat SNI',
          },
        ]}
      />

      <section className="bg-white px-4 py-14 md:py-20">
        <CalculatorIntro />
      </section>

      {/* Form + hasil — latar salt-50 memisahkan "alat hitung" dari
          penjelasan di atasnya tanpa perlu garis pembatas. */}
      <section className="bg-salt-50 px-4 py-14 md:py-20">
        <CalculatorForm />
      </section>

      <SectionDivider variant="curve" fromClassName="fill-salt-50" toClassName="bg-ink-900" />
    </main>
  )
}
