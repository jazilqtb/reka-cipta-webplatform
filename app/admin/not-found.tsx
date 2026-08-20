// app/admin/not-found.tsx
// CHECKPOINT 1 (2026-08-15) — 404 khusus /admin/*.
//
// MASALAH YANG DITUTUP: audit menemukan NOL not-found.tsx di admin.
// Tanpa file ini, notFound() dari rute dinamis admin
// (/admin/leads/[id], /admin/products/[id]/edit, /admin/articles/[id]/edit,
// /admin/suppliers/[id]) jatuh ke 404 global bergaya situs PUBLIK —
// pengguna admin tiba-tiba melihat halaman bernuansa marketing, tanpa
// sidebar, tanpa cara kembali ke pekerjaannya.

import Link from 'next/link'
import { FileMagnifyingGlassIcon, SquaresFourIcon } from '@phosphor-icons/react/ssr'
import { AdminCard, adminButtonClass } from '@/components/admin/ui/AdminPrimitives'

export default function AdminNotFound() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <AdminCard className="w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
          <FileMagnifyingGlassIcon size={20} weight="duotone" className="text-neutral-500" aria-hidden="true" />
        </div>

        <h1 className="font-ui text-lg font-bold text-ink-700">Data tidak ditemukan</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Item yang Anda cari sudah dihapus, atau tautannya tidak valid.
        </p>

        <div className="mt-6">
          <Link
            href="/admin/dashboard"
            className={adminButtonClass("primary")}
          >
            <SquaresFourIcon size={16} weight="duotone" aria-hidden="true" />
            Kembali ke Dashboard
          </Link>
        </div>
      </AdminCard>
    </main>
  )
}
