// app/admin/mitra/page.tsx — CP5 ronde 3
import { AdminHeader } from '@/components/layout/AdminHeader'
import { AdminPageHeader } from '@/components/admin/ui/AdminPrimitives'
import { PartnersEditor } from '@/components/admin/partner/PartnersEditor'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Mitra Distribusi' }

export default async function AdminMitraPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('partners')
    .select('id, name, industry, logo_path, sort_order')
    .order('sort_order', { ascending: true })

  return (
    <>
      <AdminHeader title="Mitra Distribusi" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="page-transition mx-auto max-w-3xl space-y-5">
          <AdminPageHeader
            title="Mitra Distribusi"
            description="Logo dan nama yang berjalan di marquee beranda. Urutan di sini menentukan urutan tampil."
          />
          <PartnersEditor
            initial={(data ?? []).map((r) => ({
              id: r.id as string,
              name: r.name as string,
              industry: (r.industry as string) ?? '',
              logo_path: (r.logo_path as string | null) ?? null,
            }))}
          />
        </div>
      </main>
    </>
  )
}
