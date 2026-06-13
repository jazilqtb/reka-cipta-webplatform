// components/sections/CTASection.tsx
// Epic 2 Slice 1 (E2-S1-FE-08) — Wireframe v1.0 §7.
//
// Section CTA pamungkas Beranda. Server Component.
// Pattern Link → buttonVariants (konsisten dgn HeroCarousel —
// proyek pakai Base UI yang tidak punya asChild Radix-style).

import Link from 'next/link'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { RevealWrapper } from '@/components/animations/RevealWrapper'
import { cn } from '@/lib/utils'

export function CTASection() {
  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-brand-teal-600 to-brand-teal-700 px-4 py-20 md:py-28"
      aria-labelledby="cta-heading"
    >
      {/* Decorative blur — aria-hidden, tidak ganggu kontras teks */}
      <div
        className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-brand-teal-400/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-brand-teal-300/15 blur-3xl"
        aria-hidden="true"
      />

      <RevealWrapper variant="reveal-scale">
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <h2
            id="cta-heading"
            className="text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl"
          >
            Siap Jadi Mitra Distribusi?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/85 md:text-lg">
            Diskusikan kebutuhan garam industri Anda dengan tim kami. Dapatkan
            penawaran harga yang transparan dalam kurang dari 2 menit.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/minta-penawaran"
              aria-label="Minta penawaran harga sekarang"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'bg-white text-brand-teal-700 hover:bg-neutral-100 hover:text-brand-teal-800'
              )}
            >
              Minta Penawaran
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/kontak"
              aria-label="Buka halaman kontak"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'border-2 border-white/80 bg-transparent text-white hover:bg-white/10 hover:text-white'
              )}
            >
              <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />
              Hubungi Kami
            </Link>
          </div>
        </div>
      </RevealWrapper>
    </section>
  )
}
