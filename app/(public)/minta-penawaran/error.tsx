'use client'

// Epic 4 Customer-Facing (E4-CF-FE-10) — Error boundary /minta-penawaran.
// Muncul kalau fetch products gagal saat page load. Retry button re-render
// server component via reset().

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
