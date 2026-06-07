import Link from 'next/link'
import { ArrowRight, BadgeCheck } from 'lucide-react'

export const metadata = {
  title: 'CV Reka Cipta Indonesia — Distributor Garam Industri Bersertifikat SNI',
}

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero placeholder */}
      <section className="relative bg-brand-gradient min-h-[60vh] flex items-center justify-center px-4 overflow-hidden">
        <div className="bg-dot-grid absolute inset-0 opacity-20 pointer-events-none" />
        <div className="relative z-10 text-center space-y-6 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 rounded-full text-sm text-white/90 font-medium">
            <BadgeCheck size={16} aria-hidden="true" />
            Tersertifikasi SNI
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-[56px] font-bold text-white leading-tight">
            Garam Lokal,{' '}
            <span className="text-brand-teal-200">Standar Industri</span>
          </h1>

          <p className="text-lg text-white/80 leading-relaxed max-w-xl mx-auto">
            Distributor garam bersertifikat SNI untuk kebutuhan industri
            makanan, perikanan, dan kimia di seluruh Indonesia.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/minta-penawaran"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-white text-brand-teal-700 text-base font-semibold rounded-md shadow-md hover:bg-brand-teal-50 hover:-translate-y-0.5 active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus transition-all duration-100"
            >
              Minta Penawaran
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link
              href="/produk"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-transparent text-white border border-white/40 text-base font-semibold rounded-md hover:bg-white/10 active:scale-[0.97] focus-visible:outline-none transition-all duration-100"
            >
              Lihat Produk
            </Link>
          </div>
        </div>
      </section>

      {/* Placeholder sections */}
      <section className="py-16 px-4 bg-neutral-50 text-center">
        <p className="text-neutral-400 text-sm font-mono">
          [ Konten halaman beranda — akan diimplementasi di Epic 2 ]
        </p>
      </section>
    </div>
  )
}
