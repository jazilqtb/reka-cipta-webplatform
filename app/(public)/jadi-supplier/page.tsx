// app/(public)/jadi-supplier/page.tsx — Halaman Jadi Supplier (/jadi-supplier)
// Epic 5 Customer-Facing (E5-CF-FE-06)
//
// Rendering : Static full — form pakai konstanta hardcoded, tidak fetch
//             produk dari DB (AR-07), jadi tidak perlu revalidate.

import type { Metadata } from 'next'
import { PlantIcon, HandshakeIcon } from '@phosphor-icons/react/ssr'
import { PageHero } from '@/components/sections/PageHero'
import { SectionDivider } from '@/components/decorative/SectionDivider'
import { RevealWrapper } from '@/components/animations/RevealWrapper'
import { BenefitsSection } from '@/components/supplier/BenefitsSection'
import { SupplierRegistrationForm } from '@/components/supplier/SupplierRegistrationForm'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Jadi Supplier',
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
      <PageHero
        eyebrow="Kemitraan Supplier"
        title="Pasok Garam Anda ke"
        titleAccent="Jaringan Industri Kami"
        subtitle="Kami bermitra dengan petani dan produsen garam lokal untuk memenuhi permintaan industri yang terus bertumbuh."
        breadcrumbLabel="Jadi Supplier"
        credentials={[
          {
            icon: <PlantIcon size={16} weight="duotone" className="text-brand-teal-300" aria-hidden="true" />,
            label: 'Terbuka untuk Petani & Produsen Lokal',
          },
          {
            icon: <HandshakeIcon size={16} weight="duotone" className="text-brand-teal-300" aria-hidden="true" />,
            label: 'Verifikasi 2–3 Hari Kerja',
          },
        ]}
      />

      <BenefitsSection />

      {/* Form — latar salt-50 supaya panel form (putih) punya kontras
          lembut, bukan putih di atas putih spt sebelumnya. */}
      <section className="bg-salt-50 px-4 py-14 md:py-20">
        <div className="mx-auto max-w-3xl">
          <RevealWrapper className="text-center">
            <p className="rule-index font-ui justify-center text-sand-700">Formulir Pendaftaran</p>
            <h2 className="mt-3 font-ui text-2xl font-semibold text-ink-700 md:text-3xl">
              Daftarkan <span className="italic font-medium text-sand-600">Usaha Garam</span> Anda
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-pretty text-neutral-600">
              Isi data usaha Anda di bawah ini. Tim kemitraan kami akan meninjau dan menghubungi Anda.
            </p>
          </RevealWrapper>

          <div className="mt-8 md:mt-10">
            <SupplierRegistrationForm />
          </div>
        </div>
      </section>

      <SectionDivider variant="diagonal" fromClassName="fill-salt-50" toClassName="bg-ink-900" />
    </main>
  )
}
