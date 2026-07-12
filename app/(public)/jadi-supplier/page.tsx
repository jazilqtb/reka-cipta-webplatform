// app/(public)/jadi-supplier/page.tsx — Halaman Jadi Supplier (/jadi-supplier)
// Epic 5 Customer-Facing (E5-CF-FE-06)
//
// Rendering : Static full — form pakai konstanta hardcoded, tidak fetch
//             produk dari DB (AR-07), jadi tidak perlu revalidate.

import type { Metadata } from 'next'
import { InnerPageHero } from '@/components/sections/InnerPageHero'
import { BenefitsSection } from '@/components/supplier/BenefitsSection'
import { SupplierRegistrationForm } from '@/components/supplier/SupplierRegistrationForm'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Jadi Supplier | CV Reka Cipta Indonesia',
  description:
    'Bermitra dengan CV Reka Cipta sebagai supplier garam. Daftarkan usaha Anda dan bergabung dengan jaringan supplier terpercaya di Indonesia.',
  alternates: {
    canonical: 'https://rekaciptaindonesia.com/jadi-supplier',
  },
  openGraph: {
    title: 'Jadi Supplier — CV Reka Cipta Indonesia',
    description: 'Bermitra dengan distributor garam industri terpercaya di Indonesia.',
    url: 'https://rekaciptaindonesia.com/jadi-supplier',
    type: 'website',
  },
}

export default function JadiSupplierPage() {
  return (
    <main>
      <InnerPageHero
        title="Jadi Supplier Reka Cipta"
        subtitle="Bermitra dengan distributor garam industri terpercaya di Indonesia"
        breadcrumb={[
          { label: 'Beranda', href: '/' },
          { label: 'Jadi Supplier' },
        ]}
      />
      <BenefitsSection />
      <section className="container mx-auto max-w-3xl px-4 py-4 md:py-8">
        <SupplierRegistrationForm />
      </section>
    </main>
  )
}
