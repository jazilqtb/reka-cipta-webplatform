import type { Metadata } from 'next'
import { AboutHero } from '@/components/sections/AboutHero'
import { CompanyTimeline } from '@/components/sections/CompanyTimeline'
import { VisiMisi } from '@/components/sections/VisiMisi'
import { OrgStructure } from '@/components/sections/OrgStructure'
import { AboutCTA } from '@/components/sections/AboutCTA'
import { getAboutTimeline, getAboutMission, getAboutTeam, getAboutVision } from '@/lib/data/about'

export const revalidate = 86400 // 24 jam

export const metadata: Metadata = {
  title: 'Tentang Kami — Sejarah & Legalitas',
  description:
    'CV Reka Cipta Indonesia, distributor garam SNI sejak 2020. Legalitas penuh: Akta Notaris, NIB, NPWP, Kemenkumham. Temui tim kami di Surabaya.',
  openGraph: {
    title: 'Tentang Kami — CV Reka Cipta Indonesia',
    description: 'Distributor garam SNI sejak 2020. Profil perusahaan dan dokumen legalitas.',
    images: [{ url: '/og-image.jpg' }],
  },
}

export default async function TentangKamiPage() {
  const [timeline, mission, team, vision] = await Promise.all([
    getAboutTimeline(),
    getAboutMission(),
    getAboutTeam(),
    getAboutVision(),
  ])

  return (
    <main>
      {/* RONDE Tahap 8: section Legalitas (LegalDocsGrid) DIHAPUS TOTAL —
          klien: "tidak perlu menampilkan dokumen resmi perusahaan di
          antarmuka publik". Komponen pendukungnya (LegalDocsGrid.tsx,
          LegalDocCard.tsx, LegalDocModal.tsx) juga sudah dihapus dari
          repo, bukan cuma disembunyikan dari sini. */}
      <AboutHero />
      <CompanyTimeline timeline={timeline} />
      <VisiMisi vision={vision} mission={mission} />
      <OrgStructure team={team} />
      <AboutCTA />
    </main>
  )
}
