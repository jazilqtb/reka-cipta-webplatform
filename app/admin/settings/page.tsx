// app/admin/settings/page.tsx — Halaman Admin Pengaturan Kontak
// Epic 2 Slice 3 (E2-S3-AD-01)
//
// Server Component tipis: auth check sudah di-handle app/admin/layout.tsx
// (Epic 1, double guard middleware + layout). Data fetching + form
// interaktif ada di SettingsForm ('use client').

import { AdminHeader } from '@/components/layout/AdminHeader'
import { SettingsForm } from '@/components/admin/SettingsForm'

export const metadata = {
  title: 'Pengaturan Kontak',
}

export default function AdminSettingsPage() {
  return (
    <>
      <AdminHeader title="Pengaturan Kontak" />

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="page-transition mx-auto max-w-3xl space-y-4">
          {/* Kalimat ini DIPERTAHANKAN — beda dari halaman daftar, di sini ia
              menyampaikan konsekuensi yang tidak terbaca dari form manapun:
              menyimpan di sini langsung mengubah situs publik. */}
          <p className="text-sm text-neutral-600">
            Informasi kontak di bawah tampil di halaman publik. Perubahan langsung
            tercermin di Beranda dan halaman Kontak.
          </p>

          <SettingsForm />
        </div>
      </main>
    </>
  )
}
