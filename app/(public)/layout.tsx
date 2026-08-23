import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { createPublic } from '@/lib/supabase/public'
import { getLogoUrls } from '@/lib/data/logo'
import type { CompanySettingsMap } from '@/types/api'

// Epic 2 Slice 3 — Navbar & Footer sebelumnya baca data kontak hardcode
// dari constants/navigation.ts (gap dari Epic 1, baru ketahuan saat QA
// Slice 3: perubahan admin di /admin/settings tidak pernah tercermin di
// keduanya). Sekarang fetch company_settings di sini (Server Component,
// createPublic supaya semua halaman anak tetap Static), pass sebagai props.

const FALLBACK_SETTINGS: CompanySettingsMap = {
  whatsapp_1: '082136096528',
  whatsapp_2: '087839031378',
  email: 'rekaciptaindonesiaa@gmail.com',
  address: 'Jl. Bratang Gede III-I No. 16A, Ngagel Rejo, Wonokromo, Surabaya 60245',
}

async function getLayoutSettings(): Promise<CompanySettingsMap> {
  try {
    const supabase = createPublic()
    const { data, error } = await supabase
      .from('company_settings')
      .select('key, value')
      .in('key', ['whatsapp_1', 'whatsapp_2', 'email', 'address'])

    if (error || !data || data.length === 0) {
      console.error('[PublicLayout] Gagal fetch company_settings:', error?.message)
      return FALLBACK_SETTINGS
    }

    return Object.fromEntries(data.map((row) => [row.key, row.value]))
  } catch (err) {
    console.error('[PublicLayout] Exception saat fetch company_settings:', err)
    return FALLBACK_SETTINGS
  }
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [settings, logo] = await Promise.all([getLayoutSettings(), getLogoUrls()])

  return (
    <>
      <Navbar whatsapp1={settings.whatsapp_1} email={settings.email} logoSrc={logo.light} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer
        address={settings.address}
        whatsapp1={settings.whatsapp_1}
        whatsapp2={settings.whatsapp_2}
        email={settings.email}
        logoSrc={logo.dark}
      />
    </>
  )
}
