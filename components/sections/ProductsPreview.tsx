// components/sections/ProductsPreview.tsx
// Epic 2 Slice 1 (E2-S1-FE-04) — Wireframe v1.0 §3.
//
// Server Component. 5 produk hardcoded sementara — akan diganti
// fetch dari GET /api/v1/products saat Epic 3 selesai.
//
// Layout: grid-cols-5 desktop, horizontal snap scroll di mobile.
// Setiap card 75vw di mobile agar terlihat "ada lebih" — preview
// hint mendorong user untuk swipe.

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ProductCard, type ProductCardData } from '@/components/blocks/ProductCard'
import { RevealWrapper } from '@/components/animations/RevealWrapper'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// TODO(Epic 3): Replace dgn fetch dari GET /api/v1/products
const PRODUCTS_PREVIEW: ProductCardData[] = [
  {
    slug: 'garam-halus-yodium',
    name: 'Garam Halus PRO YD',
    spec: 'NaCl ≥97.0% • Beryodium',
    imagePath: '/images/products/garam-halus-yodium.jpg',
    is_sni: true,
  },
  {
    slug: 'garam-halus-non-yodium',
    name: 'Garam Halus PRO L',
    spec: 'NaCl ≥97.0% • Non-yodium',
    imagePath: '/images/products/garam-halus-non-yodium.jpg',
    is_sni: false,
  },
  {
    slug: 'garam-kasar-industri',
    name: 'Garam Kasar SPO/M',
    spec: 'NaCl ≥96.0% • Kasar SPO/M',
    imagePath: '/images/products/garam-kasar-industri.jpg',
    is_sni: true,
  },
  {
    slug: 'garam-kasar-petani',
    name: 'Garam Kasar Petani Premium',
    spec: 'NaCl ≥94.0% • Kasar',
    imagePath: '/images/products/garam-kasar-petani.jpg',
    is_sni: false,
  },
  {
    slug: 'garam-ghpt',
    name: 'Garam Halus Pakan Ternak',
    spec: 'NaCl ≥95.0% • GHPT',
    imagePath: '/images/products/garam-ghpt.jpg',
    is_sni: false,
  },
]

export function ProductsPreview() {
  return (
    <section
      className="bg-neutral-50 px-4 py-20 md:py-28"
      aria-labelledby="products-heading"
    >
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <RevealWrapper>
          <div className="mb-12 text-center md:mb-16">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-teal-600">
              Katalog Produk
            </p>
            <h2 id="products-heading" className="text-3xl font-bold text-ink-700 md:text-4xl">
              5 Pilihan Garam Bersertifikasi
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-neutral-600">
              Dari garam halus food-grade beryodium hingga garam kasar industri
              dengan kandungan NaCl tinggi.
            </p>
          </div>
        </RevealWrapper>

        {/* Desktop: grid 5 kolom (hidden di mobile) */}
        <div className="hidden grid-cols-5 gap-6 md:grid">
          {PRODUCTS_PREVIEW.map((product, index) => (
            <RevealWrapper key={product.slug} variant="reveal-up" delay={index * 80}>
              <ProductCard {...product} className="h-full" />
            </RevealWrapper>
          ))}
        </div>

        {/* Mobile: horizontal snap scroll */}
        <div
          className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-4 md:hidden"
          style={{ scrollbarWidth: 'none' }}
          aria-label="Geser untuk lihat semua produk"
        >
          {PRODUCTS_PREVIEW.map((product) => (
            <div
              key={product.slug}
              className="w-[75vw] shrink-0 snap-start"
            >
              <ProductCard {...product} className="h-full" />
            </div>
          ))}
          {/* Spacer kanan agar card terakhir punya margin saat di-snap */}
          <div className="w-2 shrink-0" aria-hidden="true" />
        </div>

        {/* CTA "Lihat Semua Produk" */}
        <div className="mt-10 text-center md:mt-14">
          <Link
            href="/produk"
            aria-label="Lihat semua produk garam kami"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'lg' }),
              'border-brand-teal-600 text-brand-teal-600 hover:bg-brand-teal-50'
            )}
          >
            Lihat Semua Produk
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
