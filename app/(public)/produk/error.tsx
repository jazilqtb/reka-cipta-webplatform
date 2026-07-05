'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export default function ProdukError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <main className="container mx-auto px-4 py-16 text-center">
      <h1 className="mb-4 text-2xl font-semibold text-ink-700">
        Terjadi kesalahan memuat katalog
      </h1>
      <p className="mb-6 text-neutral-600">
        Kami sedang memperbaiki masalah ini. Silakan coba lagi.
      </p>
      <button type="button" onClick={reset} className={cn(buttonVariants({ variant: 'default' }))}>
        Coba lagi
      </button>
    </main>
  )
}
