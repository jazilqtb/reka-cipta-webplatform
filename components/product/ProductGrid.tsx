import type { Product } from '@/types/api'
import { ProductCard } from './ProductCard'

interface ProductGridProps {
  products: Product[]
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-neutral-600">Belum ada produk di kategori ini.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
