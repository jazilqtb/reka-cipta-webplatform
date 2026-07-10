// app/admin/leads/page.tsx — Halaman Admin Pipeline Leads (Kanban)
// Epic 4B Slice 1 (E4B-S1-FE-02)
//
// Server Component tipis: auth check sudah di-handle app/admin/layout.tsx.
// Data fetching (FastAPI, auth: true) + interaksi drag-drop ada di
// LeadsKanbanBoard ('use client') — sama pola dengan SettingsForm
// (Epic 2 Slice 3), BUKAN fetch di sini, karena apiFetch butuh browser
// Supabase client yang tidak tersedia di Server Component.

import { Suspense } from 'react'
import { AdminHeader } from '@/components/layout/AdminHeader'
import { LeadsKanbanBoard } from '@/components/admin/lead/LeadsKanbanBoard'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Pipeline Leads — Admin RCI',
}

export default function AdminLeadsPage() {
  return (
    <>
      <AdminHeader title="Pipeline Leads" breadcrumb="Leads & RFQ" />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[1440px] mx-auto space-y-4 page-transition">
          <p className="text-sm text-neutral-600">
            Kelola leads dari form Minta Penawaran. Drag kartu antar kolom untuk update status.
          </p>

          <Suspense fallback={<p className="text-sm text-neutral-400">Memuat...</p>}>
            <LeadsKanbanBoard />
          </Suspense>
        </div>
      </main>
    </>
  )
}
