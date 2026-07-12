'use client'

// Epic 5 Customer-Facing (E5-CF-FE-08) — Error boundary /jadi-supplier.
// Sama pola dengan app/(public)/minta-penawaran/error.tsx — retry via
// reset() re-render, tanpa manual Sentry.captureException (Next.js
// Sentry SDK sudah auto-instrument error boundary ini).

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="container mx-auto px-4 py-16 text-center">
      <h1 className="mb-4 text-2xl font-semibold text-ink-700">Gagal memuat halaman</h1>
      <p className="mb-6 text-neutral-600">Silakan coba lagi atau hubungi kami langsung.</p>
      <button
        onClick={reset}
        className="rounded-md bg-brand-teal-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-teal-500"
      >
        Coba lagi
      </button>
    </main>
  )
}
