// components/product/ProductGrid.tsx
// RONDE Tahap 4 (2026-08) — grid katalog /produk.
// Mobile (poin 4): grid-cols-2 rapi sejak breakpoint terkecil (opsi yg
// diminta klien) — BUKAN stack 1-kolom lama yg berat men-scroll, dan
// BUKAN horizontal-swipe (itu pola utk PREVIEW teaser di Beranda; di
// sini pengunjung memang sedang browsing katalog LENGKAP, jadi grid yg
// langsung menampilkan semua produk lebih sesuai — swipe justru
// menyembunyikan sebagian produk di balik gestur tambahan).
import { PackageIcon } from '@phosphor-icons/react/ssr'
import { ProductCard } from './ProductCard'
import { RevealWrapper } from '@/components/animations/RevealWrapper'
import type { Product } from '@/types/api'

interface ProductGridProps {
  products: Product[]
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <PackageIcon size={40} weight="duotone" className="text-neutral-300" aria-hidden="true" />
        <p className="text-neutral-600">Belum ada produk di kategori ini.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-6">
      {products.map((product, index) => (
        <RevealWrapper key={product.id} variant="reveal-up" delay={index * 60}>
          <ProductCard product={product} />
        </RevealWrapper>
      ))}
    </div>
  )
}
