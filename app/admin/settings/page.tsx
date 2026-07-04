// app/admin/settings/page.tsx — Halaman Admin Pengaturan Kontak
// Epic 2 Slice 3 (E2-S3-AD-01)
//
// Server Component tipis: auth check sudah di-handle app/admin/layout.tsx
// (Epic 1, double guard middleware + layout). Data fetching + form
// interaktif ada di SettingsForm ('use client').

import { AdminHeader } from '@/components/layout/AdminHeader'
import { SettingsForm } from '@/components/admin/SettingsForm'

export const metadata = {
  title: 'Pengaturan Kontak — Admin RCI',
}

export default function AdminSettingsPage() {
  return (
    <>
      <AdminHeader title="Pengaturan Kontak" breadcrumb="Pengaturan" />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6 page-transition">
          <p className="text-sm text-neutral-600">
            Kelola informasi kontak yang tampil di halaman publik. Perubahan akan langsung
            tercermin di halaman Kontak dan Beranda.
          </p>

          <SettingsForm />
        </div>
      </main>
    </>
  )
}
