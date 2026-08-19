// app/admin/suppliers/page.tsx — Halaman Admin Manajemen Supplier (List)
// Epic 5 Admin (E5-ADM-FE-07)
//
// Server Component tipis: auth check sudah di-handle app/admin/layout.tsx.
// Data fetching (FastAPI, auth: true) ada di SupplierListView ('use client')
// — sama pola dengan LeadsKanbanBoard, BUKAN fetch di sini, karena apiFetch
// butuh browser Supabase client yang tidak tersedia di Server Component.

import { Suspense } from 'react'
import { AdminHeader } from '@/components/layout/AdminHeader'
import { SupplierListView } from '@/components/admin/supplier/SupplierListView'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Supplier',
}

export default function AdminSuppliersPage() {
  return (
    <>
      <AdminHeader title="Supplier" />

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="page-transition mx-auto max-w-[1400px] space-y-4">
          <Suspense fallback={<p className="text-sm text-neutral-400">Memuat…</p>}>
            <SupplierListView />
          </Suspense>
        </div>
      </main>
    </>
  )
}
