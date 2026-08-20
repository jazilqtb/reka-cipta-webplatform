// components/product/ProductCTA.tsx
// RONDE Tahap 6 (2026-08) — "samakan DNA desain /produk/[slug]": CTA
// bg-brand-teal-50 datar diganti panel gradient teal gelap, DNA IDENTIK
// dgn StagedCTASection.tsx Beranda (gradient VERTIKAL — bukan diagonal,
// pelajaran seam Tahap 5 — kartu solid, ikon telanjang + hover-scale,
// tanpa border-hover). Ini section TERAKHIR sebelum Footer di halaman
// ini, jadi sekaligus bawa 2 <SectionDivider> sendiri (masuk dari
// bg-white section sebelumnya, keluar ke Footer ink-900) — pola sama
// dgn StagedCTASection yg menutup diri sendiri krn Footer dirender di
// layout.tsx bersama, bukan lewat page.tsx per-halaman.
import Link from 'next/link'
import { FlaskIcon, HandshakeIcon, ArrowRightIcon } from '@phosphor-icons/react/ssr'
import { RevealWrapper } from '@/components/animations/RevealWrapper'
import { SectionDivider } from '@/components/decorative/SectionDivider'
import type { Product } from '@/types/api'

interface ProductCTAProps {
  product: Product
}

export function ProductCTA({ product }: ProductCTAProps) {
  const sampleHref = `/kontak?produk=${product.slug}&intent=sample`
  const quotationHref = `/minta-penawaran?produk=${product.slug}`

  return (
    <>
    <SectionDivider variant="wave" fromClassName="fill-white" toClassName="bg-brand-teal-700" />
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-teal-700 to-brand-teal-800 px-4 py-14 md:py-20">
      <div className="relative mx-auto max-w-3xl text-center">
        <RevealWrapper>
          <p className="rule-index font-ui justify-center text-brand-teal-200">Langkah Berikutnya</p>
          <h2 className="mt-3 text-balance font-ui text-2xl md:text-3xl font-semibold leading-tight text-white">
            Tertarik dengan <span className="font-medium text-brand-teal-200">{product.name}</span>?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-white/70">
            Tim kami siap membantu dengan sampel produk untuk diuji langsung, atau penawaran
            harga sesuai kebutuhan volume Anda.
          </p>
        </RevealWrapper>

        <RevealWrapper variant="reveal-up" delay={100}>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={sampleHref}
              className="font-ui group inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-ink-900/30 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink-900/45"
            >
              <FlaskIcon size={20} weight="duotone" className="transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
              Minta Sampel
            </Link>
            <Link
              href={quotationHref}
              className="font-ui group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-teal-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-teal-50"
            >
              <HandshakeIcon size={20} weight="duotone" className="transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
              Dapatkan Penawaran
              <ArrowRightIcon size={16} weight="bold" className="arrow-icon" aria-hidden="true" />
            </Link>
          </div>
        </RevealWrapper>
      </div>
    </section>
    <SectionDivider variant="wave" fromClassName="fill-brand-teal-800" toClassName="bg-ink-900" flip />
    </>
  )
}
