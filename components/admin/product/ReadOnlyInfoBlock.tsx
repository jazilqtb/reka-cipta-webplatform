// components/admin/product/ReadOnlyInfoBlock.tsx
// Epic 3B Slice 1 (E3B-S1-FE-08 / AR-06) — Info block field locked
// (slug, code, category, id, created_at). Non-interactive, monospace.

import type { Product, ProductCategory } from '@/types/api'

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  halus: 'Garam Halus',
  kasar: 'Garam Kasar',
  industri: 'Garam Industri',
}

interface ReadOnlyInfoBlockProps {
  product: Product
}

export function ReadOnlyInfoBlock({ product }: ReadOnlyInfoBlockProps) {
  const createdAt = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(product.created_at))

  return (
    <div className="bg-neutral-50 border border-dashed border-neutral-300 rounded-xl p-4">
      <p className="text-xs text-neutral-500">
        Kolom berikut tidak bisa diubah dari panel admin. Kalau butuh perubahan, hubungi
        developer.
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-3 mono-tech text-xs text-neutral-600">
        <div>
          <dt className="text-neutral-400">Slug</dt>
          <dd>{product.slug}</dd>
        </div>
        <div>
          <dt className="text-neutral-400">Kode</dt>
          <dd>{product.code}</dd>
        </div>
        <div>
          <dt className="text-neutral-400">Kategori</dt>
          <dd>{CATEGORY_LABELS[product.category]}</dd>
        </div>
        <div>
          <dt className="text-neutral-400">ID Sistem</dt>
          <dd className="truncate" title={product.id}>
            {product.id}
          </dd>
        </div>
        <div>
          <dt className="text-neutral-400">Dibuat</dt>
          <dd>{createdAt}</dd>
        </div>
      </dl>
    </div>
  )
}
