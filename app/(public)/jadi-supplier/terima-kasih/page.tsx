// app/(public)/jadi-supplier/terima-kasih/page.tsx — Halaman konfirmasi
// setelah submit pendaftaran supplier.
// Epic 5 Customer-Facing (E5-CF-FE-07)
//
// Rendering : Static full — tidak ada data fetch, revalidate = false.
// Access    : Accept direct URL access (AR-04, sama pola dengan
//             /minta-penawaran/terima-kasih) — halaman ini tidak leak
//             data apapun, cuma static content, jadi TIDAK ada access
//             control (sessionStorage/cookie/referrer check). robots
//             noindex supaya tidak muncul di Google search.

import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export const revalidate = false

export const metadata: Metadata = {
  title: 'Pendaftaran Berhasil | CV Reka Cipta Indonesia',
  robots: { index: false, follow: false },
}

export default function TerimaKasihSupplierPage() {
  return (
    <main className="container mx-auto max-w-2xl px-4 py-16 text-center md:py-24">
      <CheckCircle className="mx-auto mb-6 h-20 w-20 text-brand-teal-600" strokeWidth={1.5} aria-hidden="true" />
      <h1 className="mb-4 text-3xl font-bold text-ink-700 md:text-4xl">
        Pendaftaran Berhasil Dikirim!
      </h1>
      <p className="mb-2 text-lg text-neutral-700">
        Terima kasih atas ketertarikan Anda menjadi mitra supplier CV Reka Cipta.
      </p>
      <p className="mb-8 text-lg text-neutral-700">
        Tim kami akan menghubungi Anda via WhatsApp dalam <strong>2–3 hari kerja</strong> untuk proses verifikasi.
      </p>
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/" className={cn(buttonVariants({ variant: 'default', size: 'lg' }))}>
          Kembali ke Beranda
        </Link>
        <Link href="/tentang-kami" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
          Lihat Tentang Kami
        </Link>
      </div>
    </main>
  )
}
