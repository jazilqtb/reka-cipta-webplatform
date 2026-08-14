// app/admin/error.tsx
// CHECKPOINT 1 (2026-08-15) — error boundary root untuk SELURUH /admin/*.
//
// MASALAH YANG DITUTUP: audit menemukan hanya ADA SATU error.tsx di
// seluruh surface admin (app/admin/suppliers/error.tsx). Semua halaman
// admin lain adalah Server Component async yang menyentuh Supabase —
// artinya semuanya bisa melempar error — dan tanpa boundary di sini,
// error apa pun naik ke boundary global: layar crash penuh, tanpa
// sidebar, tanpa jalan kembali.
'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { WarningIcon, ArrowCounterClockwiseIcon, SquaresFourIcon } from '@phosphor-icons/react/ssr'
import { AdminCard, adminButtonClass } from '@/components/admin/ui/AdminPrimitives'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log ke konsol server/klien. Sentry sudah terpasang di proyek ini
    // dan menangkap unhandled error secara otomatis.
    console.error('[admin] unhandled error:', error)
  }, [error])

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <AdminCard className="w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-danger-50">
          <WarningIcon size={22} weight="duotone" className="text-danger-600" aria-hidden="true" />
        </div>

        <h1 className="font-ui text-lg font-bold text-ink-700">Terjadi kesalahan</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Halaman ini gagal dimuat. Coba muat ulang — jika masih gagal, kembali ke dashboard.
        </p>

        {/* digest = ID error dari Next.js, aman ditampilkan (bukan stack
            trace, tidak membocorkan detail internal) dan sangat membantu
            saat mencocokkan dengan log Sentry. */}
        {error.digest && (
          <p className="mono-tech mt-3 text-xs text-neutral-400">Ref: {error.digest}</p>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className={adminButtonClass("primary")}
          >
            <ArrowCounterClockwiseIcon size={15} weight="bold" aria-hidden="true" />
            Coba lagi
          </button>
          <Link
            href="/admin/dashboard"
            className={adminButtonClass("secondary")}
          >
            <SquaresFourIcon size={15} weight="duotone" aria-hidden="true" />
            Ke Dashboard
          </Link>
        </div>
      </AdminCard>
    </main>
  )
}
