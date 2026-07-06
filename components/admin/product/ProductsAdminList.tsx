// components/admin/product/ProductsAdminList.tsx
// Epic 3B Slice 1 (E3B-S1-FE-02) — Tabel katalog produk admin.
// Server Component: tidak butuh interactivity (Edit navigate via Link,
// bukan mutation inline).

import { ProductAdminRow } from './ProductAdminRow'
import type { Product } from '@/types/api'

interface ProductsAdminListProps {
  products: Product[]
}

export function ProductsAdminList({ products }: ProductsAdminListProps) {
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center text-sm text-neutral-500">
        Belum ada produk.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 border-b border-neutral-200">
          <tr className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
            <th className="px-4 py-3 w-[76px]">Foto</th>
            <th className="px-4 py-3">Nama Produk</th>
            <th className="px-4 py-3">Kode</th>
            <th className="px-4 py-3">Kategori</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Urutan</th>
            <th className="px-4 py-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {products.map((product) => (
            <ProductAdminRow key={product.id} product={product} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
