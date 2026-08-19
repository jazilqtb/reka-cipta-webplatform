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
import { LeadsWorkspace } from '@/components/admin/lead/LeadsWorkspace'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Leads & RFQ',
}

export default function AdminLeadsPage() {
  return (
    <>
      <AdminHeader title="Leads & RFQ" />

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="page-transition mx-auto max-w-[1600px]">
          {/* Kalimat pengantar lama ("Drag kartu antar kolom…") dihapus:
              instruksinya sudah tidak benar sejak Kanban bukan tampilan
              utama, dan toolbar di bawah sudah menjelaskan dirinya sendiri. */}
          <Suspense fallback={<p className="text-sm text-neutral-400">Memuat…</p>}>
            <LeadsWorkspace />
          </Suspense>
        </div>
      </main>
    </>
  )
}
