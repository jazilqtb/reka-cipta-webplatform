// app/admin/suppliers/[id]/page.tsx — Halaman Admin Detail Supplier
// Epic 5 Admin (E5-ADM-FE-10)
//
// Server Component tipis: hanya teruskan `id`. Fetch detail (FastAPI,
// auth: true) + interaksi (status update, auto-save notes, WA template) ada
// di SupplierDetailView ('use client') — apiFetch butuh browser Supabase
// client, tidak bisa dipanggil dari Server Component.

import { AdminHeader } from '@/components/layout/AdminHeader'
import { SupplierDetailView } from '@/components/admin/supplier/SupplierDetailView'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Detail Supplier',
}

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <>
      <AdminHeader title="Detail Supplier" breadcrumb="Supplier" />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl page-transition">
          <SupplierDetailView supplierId={id} />
        </div>
      </main>
    </>
  )
}
