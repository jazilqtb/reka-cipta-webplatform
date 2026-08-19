// app/admin/leads/[id]/page.tsx — Halaman Admin Detail Lead
// Epic 4B Slice 1 (E4B-S1-FE-08)
//
// Server Component tipis: hanya teruskan `id`. Fetch detail (FastAPI,
// auth: true) + interaksi (status update, auto-save notes) ada di
// LeadDetailView ('use client') — apiFetch butuh browser Supabase client,
// tidak bisa dipanggil dari Server Component (lihat komentar lib/api.ts).

import { AdminHeader } from '@/components/layout/AdminHeader'
import { LeadDetailView } from '@/components/admin/lead/LeadDetailView'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Detail Lead',
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <>
      <AdminHeader title="Detail Lead" breadcrumb="Leads & RFQ" />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto page-transition">
          <LeadDetailView leadId={id} />
        </div>
      </main>
    </>
  )
}
