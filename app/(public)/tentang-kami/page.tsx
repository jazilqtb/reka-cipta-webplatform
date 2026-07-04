import type { Metadata } from 'next'
import { InnerPageHero } from '@/components/sections/InnerPageHero'
import { CompanyTimeline } from '@/components/sections/CompanyTimeline'
import { VisiMisi } from '@/components/sections/VisiMisi'
import { OrgStructure } from '@/components/sections/OrgStructure'
import { LegalDocsGrid } from '@/components/sections/LegalDocsGrid'

export const revalidate = 86400 // 24 jam

export const metadata: Metadata = {
  title: 'Tentang Kami — Sejarah & Legalitas CV Reka Cipta Indonesia',
  description:
    'CV Reka Cipta Indonesia, distributor garam SNI sejak 2020. Legalitas penuh: Akta Notaris, NIB, NPWP, Kemenkumham. Temui tim kami di Surabaya.',
  openGraph: {
    title: 'Tentang Kami — CV Reka Cipta Indonesia',
    description: 'Distributor garam SNI sejak 2020. Profil perusahaan dan dokumen legalitas.',
    images: [{ url: '/og-image.jpg' }],
  },
}

export default function TentangKamiPage() {
  return (
    <main>
      <InnerPageHero
        title="Tentang Kami"
        subtitle="Distributor garam yang membangun kepercayaan melalui transparansi, konsistensi, dan dokumentasi."
        breadcrumb={[{ label: 'Beranda', href: '/' }, { label: 'Tentang Kami' }]}
      />
      <CompanyTimeline />
      <VisiMisi />
      <OrgStructure />
      <LegalDocsGrid />
    </main>
  )
}
