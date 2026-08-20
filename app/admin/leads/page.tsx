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
import { createPublic } from '@/lib/supabase/public'
import { LeadsWorkspace } from '@/components/admin/lead/LeadsWorkspace'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Leads & RFQ',
}

/** slug -> nama produk, diambil DI SERVER.
 *  RFQ menyimpan salt_types sebagai slug produk. Menerjemahkannya dengan
 *  menebak dari slug akan salah untuk "garam-ghpt" (nama sebenarnya
 *  "Garam Halus Pakan Ternak"), jadi petanya diambil dari tabel products.
 *  Hanya 5 baris, dan halaman ini sudah force-dynamic. */
async function getProductNames(): Promise<Record<string, string>> {
  try {
    const supabase = createPublic()
    const { data, error } = await supabase.from('products').select('slug, name')
    if (error || !data) return {}
    return Object.fromEntries(data.map((p) => [p.slug as string, p.name as string]))
  } catch {
    return {}
  }
}

export default async function AdminLeadsPage() {
  const productNames = await getProductNames()

  return (
    <>
      <AdminHeader title="Leads & RFQ" />

      {/* Satu-satunya halaman admin dengan main `overflow-hidden`, bukan
          `overflow-y-auto`: split-view punya DUA area gulir sendiri (daftar
          dan panel detail). Kalau halamannya ikut bisa digulir, operator
          dapat tiga scrollbar bersarang dan posisi baca yang mudah hilang. */}
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 md:p-6">
        <div className="page-transition mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col">
          {/* Kalimat pengantar lama ("Drag kartu antar kolom…") dihapus:
              instruksinya sudah tidak benar sejak Kanban bukan tampilan
              utama, dan toolbar di bawah sudah menjelaskan dirinya sendiri. */}
          <Suspense fallback={<p className="text-sm text-neutral-400">Memuat…</p>}>
            <LeadsWorkspace productNames={productNames} />
          </Suspense>
        </div>
      </main>
    </>
  )
}
