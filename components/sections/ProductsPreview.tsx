// components/sections/ProductsPreview.tsx
// Epic 2 Slice 1 (E2-S1-FE-04) — REVISI Bagian 2: Grid 2+3.
//
// Wireframe baru (sesuai referensi visual klien):
// - Baris 1: 2 kartu (lebih lebar) — max-w-3xl + grid-cols-2
// - Baris 2: 3 kartu (normal) — max-w-7xl + grid-cols-3
// - Mobile: tetap horizontal snap scroll (UX mobile lebih natural)
// - Hapus "Lihat Semua Produk" CTA (5 produk = total katalog)
//
// Tinggi kartu konsisten via aspect-square di ProductCard.

import { ProductCard, type ProductCardData } from '@/components/blocks/ProductCard'
import { RevealWrapper } from '@/components/animations/RevealWrapper'
import type { Product } from '@/types/api'

// Fallback kalau fetch produk gagal/kosong — identik seed asli, supaya
// section tidak blank total (konsisten pola fallback company_settings).
const FALLBACK_PRODUCTS: ProductCardData[] = [
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

function toCardData(product: Product): ProductCardData {
  return {
    slug: product.slug,
    name: product.name,
    spec: product.tagline ?? '',
    imagePath: product.photo_url ?? undefined,
    is_sni: product.is_sni,
  }
}

interface ProductsPreviewProps {
  products: Product[]
}

export function ProductsPreview({ products }: ProductsPreviewProps) {
  const items = products.length > 0 ? products.map(toCardData) : FALLBACK_PRODUCTS

  // Split: 2 baris atas + 3 baris bawah
  const TOP_ROW = items.slice(0, 2)
  const BOTTOM_ROW = items.slice(2, 5)

  return (
    <section
      className="bg-white px-4 py-16 md:py-20"
      aria-labelledby="products-heading"
    >
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <RevealWrapper>
          <div className="mb-10 text-center md:mb-12">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-teal-600">
              Katalog Produk
            </p>
            <h2 id="products-heading" className="text-3xl font-bold text-ink-700 md:text-4xl lg:text-5xl">
              5 Pilihan Garam Bersertifikasi
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-neutral-700">
              Dari garam halus food-grade beryodium hingga garam kasar industri
              dengan kandungan NaCl tinggi.
            </p>
          </div>
        </RevealWrapper>

        {/* ── DESKTOP: Grid 2+3 ─────────────────────────────── */}
        <div className="hidden md:block">
          {/* Baris 1: 2 kartu lebar */}
          <div className="mx-auto mb-6 grid max-w-3xl grid-cols-2 gap-6">
            {TOP_ROW.map((product, index) => (
              <RevealWrapper key={product.slug} variant="reveal-up" delay={index * 80}>
                <ProductCard {...product} className="h-full" />
              </RevealWrapper>
            ))}
          </div>

          {/* Baris 2: 3 kartu normal */}
          <div className="mx-auto grid max-w-5xl grid-cols-3 gap-6">
            {BOTTOM_ROW.map((product, index) => (
              <RevealWrapper key={product.slug} variant="reveal-up" delay={(index + 2) * 80}>
                <ProductCard {...product} className="h-full" />
              </RevealWrapper>
            ))}
          </div>
        </div>

        {/* ── MOBILE: Horizontal snap scroll ────────────────── */}
        <div
          className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-4 md:hidden"
          style={{ scrollbarWidth: 'none' }}
          aria-label="Geser untuk lihat semua produk"
        >
          {items.map((product) => (
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
      </div>
    </section>
  )
}
