import Link from 'next/link'
import { ArrowRight, MessageCircle, Sparkles } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { RevealWrapper } from '@/components/animations/RevealWrapper'
import { cn } from '@/lib/utils'

export function CTASection() {
  return (
    <section
      className="bg-dot-grid relative overflow-hidden bg-gradient-to-br from-brand-teal-600 via-brand-teal-700 to-brand-teal-800 px-4 py-16 md:py-20"
      aria-labelledby="cta-heading"
    >
      {/* Decorative blur */}
      <div
        className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-brand-teal-400/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-brand-teal-300/20 blur-3xl"
        aria-hidden="true"
      />

      <RevealWrapper variant="reveal-scale">
        <div className="relative z-10 mx-auto max-w-3xl">
          {/* Card container — visual focus */}
          <div className="rounded-3xl border border-white/15 bg-white/[0.07] p-8 backdrop-blur-md md:p-12">
            {/* Ikon entry */}
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-teal-400/20 backdrop-blur-sm">
              <Sparkles className="h-7 w-7 text-brand-teal-100" strokeWidth={2} aria-hidden="true" />
            </div>

            <h2
              id="cta-heading"
              className="text-center text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl"
            >
              Siap Jadi Mitra Distribusi?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-base text-white/95 md:text-lg">
              Diskusikan kebutuhan garam industri Anda dengan tim kami. Dapatkan
              penawaran harga yang transparan dalam kurang dari 2 menit.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
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
                  'border-2 border-white/70 bg-transparent text-white hover:bg-white/10 hover:text-white'
                )}
              >
                <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                Hubungi Kami
              </Link>
            </div>
          </div>
        </div>
      </RevealWrapper>
    </section>
  )
}
