// app/(public)/minta-penawaran/terima-kasih/page.tsx
// Epic 4 Customer-Facing (E4-CF-FE-05) — Halaman konfirmasi setelah submit RFQ.
//
// Rendering : Static full — tidak ada data fetch, revalidate = false.
// Access    : Accept direct URL access (AR-04/R-21). Halaman ini tidak
//             leak data apapun — cuma static content — jadi TIDAK ada
//             access control (sessionStorage/cookie/referrer check).
//             robots noindex supaya tidak muncul di Google search.

import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export const revalidate = false

export const metadata: Metadata = {
  title: 'Terima Kasih | CV Reka Cipta Indonesia',
  robots: { index: false, follow: false },
}

export default function TerimaKasihPage() {
  return (
    <main className="container mx-auto max-w-2xl px-4 py-16 text-center md:py-24">
      <CheckCircle className="mx-auto mb-6 h-20 w-20 text-brand-teal-600" strokeWidth={1.5} aria-hidden="true" />
      <h1 className="mb-4 text-3xl font-bold text-ink-700 md:text-4xl">
        Permintaan Penawaran Anda Berhasil Dikirim!
      </h1>
      <p className="mb-2 text-lg text-neutral-700">Proposal khusus sedang disiapkan tim kami.</p>
      <p className="mb-8 text-lg text-neutral-700">
        Anda akan dihubungi via WhatsApp dalam <strong>1×24 jam</strong>.
      </p>
      <p className="mb-10 text-sm text-neutral-500">Cek juga inbox email Anda untuk konfirmasi.</p>
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/" className={cn(buttonVariants({ variant: 'default', size: 'lg' }))}>
          Kembali ke Beranda
        </Link>
        <Link href="/produk" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
          Lihat Produk Lainnya
        </Link>
      </div>
    </main>
  )
}
