import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Halaman Tidak Ditemukan',
  robots: 'noindex, nofollow',
}

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="relative min-h-[calc(100vh-64px-200px)] flex items-center justify-center bg-neutral-50 px-4 py-16 md:py-24 overflow-hidden"
    >
      {/* Dot grid background */}
      <div className="bg-dot-grid absolute inset-0 pointer-events-none" />

      <div className="relative z-10 text-center max-w-md space-y-6">
        {/* Angka 404 */}
        <h1
          className="text-3xl md:text-4xl font-bold text-brand-teal-200 select-none leading-none"
          aria-label="Error 404 — Halaman tidak ditemukan"
        >
          404
        </h1>

        {/* Divider */}
        <div className="mx-auto w-16 h-1 bg-brand-teal-600 rounded-full" />

        {/* Pesan */}
        <div className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold text-ink-700">
            Halaman yang kamu cari tidak ditemukan
          </h2>
          <p className="text-base text-neutral-500 leading-relaxed">
            Mungkin alamat yang kamu masukkan salah, atau halaman ini sudah
            dipindahkan ke lokasi baru.
          </p>
        </div>

        {/* CTA */}
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 h-11 px-6 bg-brand-teal-600 text-white text-base font-semibold rounded-md shadow-sm hover:bg-brand-teal-500 hover:shadow-md hover:-translate-y-0.5 active:bg-brand-teal-700 active:scale-[0.97] active:shadow-none focus-visible:outline-none focus-visible:shadow-focus transition-all duration-100"
          >
            <ArrowLeft size={20} aria-hidden="true" />
            Kembali ke Beranda
          </Link>
        </div>

        {/* Alt links */}
        <p className="text-sm text-neutral-400 pt-2">
          Atau coba halaman:{' '}
          <Link href="/produk" className="link-animated text-brand-teal-600 hover:text-brand-teal-700">
            Produk
          </Link>
          <span className="mx-1.5 text-neutral-300">·</span>
          <Link href="/artikel" className="link-animated text-brand-teal-600 hover:text-brand-teal-700">
            Artikel
          </Link>
          <span className="mx-1.5 text-neutral-300">·</span>
          <Link href="/minta-penawaran" className="link-animated text-brand-teal-600 hover:text-brand-teal-700">
            Minta Penawaran
          </Link>
        </p>
      </div>
    </main>
  )
}
