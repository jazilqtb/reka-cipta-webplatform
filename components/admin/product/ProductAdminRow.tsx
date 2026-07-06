// components/admin/product/ProductAdminRow.tsx
// Epic 3B Slice 1 (E3B-S1-FE-03)

import Image from 'next/image'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import type { Product, ProductCategory } from '@/types/api'

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  halus: 'Garam Halus',
  kasar: 'Garam Kasar',
  industri: 'Garam Industri',
}

interface ProductAdminRowProps {
  product: Product
}

export function ProductAdminRow({ product }: ProductAdminRowProps) {
  return (
    <tr
      className={[
        'transition-colors duration-100 hover:bg-neutral-50 focus-within:ring-2 focus-within:ring-brand-teal-600',
        product.is_active ? '' : 'opacity-60 grayscale',
      ].join(' ')}
    >
      <td className="px-4 py-3">
        <div className="relative h-[60px] w-[60px] overflow-hidden rounded-md bg-neutral-100">
          {product.photo_url ? (
            <Image src={product.photo_url} alt={product.name} fill className="object-cover" sizes="60px" />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-neutral-400">
              N/A
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <Link
          href={`/admin/products/${product.id}/edit`}
          className="font-medium text-ink-700 hover:text-brand-teal-600"
        >
          {product.name}
        </Link>
        {product.tagline && (
          <p className="text-xs text-neutral-500 line-clamp-1">{product.tagline}</p>
        )}
      </td>
      <td className="px-4 py-3 font-mono text-xs text-neutral-600">{product.code}</td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center rounded bg-brand-teal-50 px-2 py-0.5 text-xs font-medium text-brand-teal-700">
          {CATEGORY_LABELS[product.category]}
        </span>
      </td>
      <td className="px-4 py-3">
        {product.is_active ? (
          <span className="inline-flex items-center rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
            Aktif
          </span>
        ) : (
          <span className="inline-flex items-center rounded bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600">
            Nonaktif
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right text-neutral-600">{product.sort_order}</td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/admin/products/${product.id}/edit`}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-neutral-300 text-xs font-medium text-neutral-700 hover:bg-neutral-50 focus-visible:outline-none focus-visible:shadow-focus transition-colors duration-100"
        >
          <Pencil size={14} aria-hidden="true" />
          Edit
        </Link>
      </td>
    </tr>
  )
}
