// lib/product-mapper.ts
// Epic 3 Slice 1 — map row Supabase mentah (ProductRow) ke Product
// (kontrak yang dipakai komponen), dengan komputasi photo_url/lab_doc_url
// dari photo_path/lab_doc_path. Dipakai Server Component yang fetch
// products langsung dari Supabase (bukan lewat FastAPI).

import { getPublicStorageUrl } from '@/lib/storage'
import type { Product, ProductRow } from '@/types/api'

export function mapProductRow(row: ProductRow): Product {
  const { photo_path, lab_doc_path, ...rest } = row
  return {
    ...rest,
    photo_url: photo_path ? getPublicStorageUrl('product-photos', photo_path) : null,
    lab_doc_url: lab_doc_path ? getPublicStorageUrl('lab-docs', lab_doc_path) : null,
  }
}
