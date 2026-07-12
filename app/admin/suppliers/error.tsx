'use client'

// Epic 5 Admin (E5-ADM-FE-11) — Error boundary /admin/suppliers.
// Sama pola dengan app/(public)/jadi-supplier/error.tsx — retry via
// reset() re-render, tanpa manual Sentry.captureException (Next.js Sentry
// SDK sudah auto-instrument error boundary ini).

export default function AdminSuppliersError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="p-6 text-center">
      <h1 className="mb-4 text-2xl font-semibold text-ink-700">Gagal memuat halaman</h1>
      <p className="mb-6 text-neutral-600">Silakan coba lagi atau kembali ke daftar supplier.</p>
      <button
        onClick={reset}
        className="rounded-md bg-brand-teal-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-teal-500"
      >
        Coba lagi
      </button>
    </main>
  )
}
