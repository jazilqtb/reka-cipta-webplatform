// app/admin/products/[id]/edit/page.tsx — Halaman Admin Edit Produk
// Epic 3B Slice 1 (E3B-S1-FE-04)
//
// Server Component: fetch produk by id + semua produk (untuk autocomplete
// industries) langsung via lib/supabase/server.ts, sama seperti
// /admin/products (Phase 7). notFound() kalau id tidak ada.

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { mapProductRow } from '@/lib/product-mapper'
import { AdminHeader } from '@/components/layout/AdminHeader'
import { ProductEditForm } from '@/components/admin/product/ProductEditForm'
import type { ProductRow } from '@/types/api'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Edit Produk — Admin RCI',
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: productRow, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .limit(1)
    .maybeSingle()

  if (productError || !productRow) notFound()

  const { data: allRows } = await supabase.from('products').select('industries')
  const availableIndustries = [
    ...new Set((allRows ?? []).flatMap((row) => (row.industries as string[]) ?? [])),
  ].sort()

  const product = mapProductRow(productRow as ProductRow)

  return (
    <>
      <AdminHeader title={`Edit: ${product.name}`} breadcrumb="Edit Produk" />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto page-transition">
          <ProductEditForm product={product} availableIndustries={availableIndustries} />
        </div>
      </main>
    </>
  )
}
