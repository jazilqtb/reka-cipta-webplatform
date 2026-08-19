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
import { ProductsWorkspace } from '@/components/admin/product/ProductsWorkspace'
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

  return (
    <>
      <AdminHeader title="Produk" />

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="page-transition mx-auto max-w-[1400px]">
          {/* Kalimat hitungan ("5 produk (5 aktif, 0 nonaktif)") dihapus:
              chip status di ProductsWorkspace sudah menyampaikan angka yang
              sama sambil sekaligus bisa diklik untuk menyaring. */}
          <ProductsWorkspace products={products} />
        </div>
      </main>
    </>
  )
}
