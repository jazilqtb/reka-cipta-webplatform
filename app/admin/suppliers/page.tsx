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
  title: 'Manajemen Supplier — Admin RCI',
}

export default function AdminSuppliersPage() {
  return (
    <>
      <AdminHeader title="Manajemen Supplier" breadcrumb="Supplier" />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-[1440px] space-y-4 page-transition">
          <p className="text-sm text-neutral-600">
            Kelola pendaftaran supplier dari form Jadi Supplier. Klik baris untuk lihat detail.
          </p>

          <Suspense fallback={<p className="text-sm text-neutral-400">Memuat...</p>}>
            <SupplierListView />
          </Suspense>
        </div>
      </main>
    </>
  )
}
