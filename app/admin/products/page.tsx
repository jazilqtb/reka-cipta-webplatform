// app/admin/products/page.tsx — Halaman Admin Katalog Produk
// Epic 3B Slice 1 (E3B-S1-FE-01)
//
// Server Component: fetch langsung via lib/supabase/server.ts (cookie
// session), BUKAN lewat FastAPI/apiFetch — apiFetch butuh browser client
// (lib/supabase/client.ts) yang tidak jalan di Server Component. RLS
// "Authenticated can read all products" (products_rls.sql) mengizinkan
// user login baca semua baris termasuk is_active=false.

import { createClient } from '@/lib/supabase/server'
import { mapProductRow } from '@/lib/product-mapper'
import { AdminHeader } from '@/components/layout/AdminHeader'
import { ProductsAdminList } from '@/components/admin/product/ProductsAdminList'
import type { ProductRow } from '@/types/api'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Katalog Produk',
}

export default async function AdminProductsPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[AdminProducts] Gagal fetch products:', error.message)
  }

  const products = (data ?? []).map((row) => mapProductRow(row as ProductRow))
  const activeCount = products.filter((p) => p.is_active).length
  const inactiveCount = products.length - activeCount

  return (
    <>
      <AdminHeader title="Katalog Produk" breadcrumb="Produk" />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6 page-transition">
          <p className="text-sm text-neutral-600">
            {products.length} produk ({activeCount} aktif, {inactiveCount} nonaktif)
          </p>

          <ProductsAdminList products={products} />
        </div>
      </main>
    </>
  )
}
