// app/admin/hero/page.tsx — CP3 (2026-08-21)
import { AdminHeader } from '@/components/layout/AdminHeader'
import { AdminPageHeader } from '@/components/admin/ui/AdminPrimitives'
import { HeroEditor } from '@/components/admin/hero/HeroEditor'
import { HeroStatsEditor } from '@/components/admin/hero/HeroStatsEditor'
import { getHeroContent, getHeroStats } from '@/lib/data/hero'
import { getCompanySettingsMap } from '@/lib/data/settings'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Hero Beranda' }

export default async function AdminHeroPage() {
  const settings = await getCompanySettingsMap()
  const [hero, stats] = await Promise.all([getHeroContent(), getHeroStats(settings)])

  return (
    <>
      <AdminHeader title="Hero Beranda" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="page-transition mx-auto max-w-3xl space-y-6">
          <AdminPageHeader
            title="Hero Beranda"
            description="Bagian paling atas beranda — kalimat pertama yang dibaca calon pembeli."
          />
          <HeroEditor initialHeadline={hero.headline} initialSubheadline={hero.subheadline} />
          <HeroStatsEditor stats={stats} />
        </div>
      </main>
    </>
  )
}
