// app/admin/tentang-kami/page.tsx — CP4 (2026-08-21)
import { AdminHeader } from '@/components/layout/AdminHeader'
import { AdminPageHeader } from '@/components/admin/ui/AdminPrimitives'
import { AboutWorkspace } from '@/components/admin/about/AboutWorkspace'
import { createPublic } from '@/lib/supabase/public'
import { getAboutVision } from '@/lib/data/about'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Tentang Kami' }

/** Dibaca MENTAH (bukan lewat lib/data/about.ts) karena panel admin butuh
 *  `photo_path` apa adanya dan `id` asli — bukan bentuk yang sudah dipetakan
 *  untuk tampilan publik. */
async function readRaw(table: string, cols: string) {
  const supabase = createPublic()
  const { data, error } = await supabase.from(table).select(cols).order('sort_order', { ascending: true })
  if (error || !data) return []
  return data as unknown as Record<string, unknown>[]
}

export default async function AdminAboutPage() {
  const [vision, timeline, mission, team] = await Promise.all([
    getAboutVision(),
    readRaw('about_timeline', 'id, year, title, description, sort_order'),
    readRaw('about_mission', 'id, title, description, sort_order'),
    readRaw('about_team', 'id, name, position, photo_path, sort_order'),
  ])

  return (
    <>
      <AdminHeader title="Tentang Kami" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="page-transition mx-auto max-w-3xl space-y-6">
          <AdminPageHeader
            title="Tentang Kami"
            description="Isi halaman /tentang-kami. Perubahan langsung tercermin di situs publik."
          />
          <AboutWorkspace vision={vision} timeline={timeline} mission={mission} team={team} />
        </div>
      </main>
    </>
  )
}
