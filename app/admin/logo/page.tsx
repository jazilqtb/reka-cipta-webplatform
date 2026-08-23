// app/admin/logo/page.tsx
import { AdminHeader } from '@/components/layout/AdminHeader'
import { AdminPageHeader } from '@/components/admin/ui/AdminPrimitives'
import { LogoEditor } from '@/components/admin/settings/LogoEditor'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_LOGO_DARK, DEFAULT_LOGO_LIGHT } from '@/lib/data/logo'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Logo Situs' }

export default async function AdminLogoPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('company_settings')
    .select('key, value')
    .in('key', ['logo_dark_path', 'logo_light_path'])

  const map = Object.fromEntries((data ?? []).map((r) => [r.key as string, r.value as string]))
  const darkPath = map.logo_dark_path && map.logo_dark_path !== DEFAULT_LOGO_DARK ? map.logo_dark_path : null
  const lightPath = map.logo_light_path && map.logo_light_path !== DEFAULT_LOGO_LIGHT ? map.logo_light_path : null

  return (
    <>
      <AdminHeader title="Logo Situs" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="page-transition mx-auto max-w-3xl space-y-5">
          <AdminPageHeader
            title="Logo Situs"
            description="Logo yang tampil di navbar dan footer di seluruh halaman publik. Perubahan langsung tercermin di situs."
          />
          <LogoEditor initialDarkPath={darkPath} initialLightPath={lightPath} />
        </div>
      </main>
    </>
  )
}
