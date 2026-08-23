'use server'

// app/actions/products.ts
// Epic 3B Slice 1 (E3B-S1-FE-09) — Server Action revalidate halaman publik
// produk setelah admin PUT /products/{id} sukses. Pattern identik
// app/admin/settings/actions.ts (Epic 2 Slice 3).

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function revalidateProductRoutes(slug: string) {
  // Server Action bisa dipanggil dari mana saja di server, jadi perlu
  // double-check auth di sini (bukan cuma andalkan middleware/layout).
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('UNAUTHORIZED')
  }

  revalidatePath('/')
  revalidatePath('/produk')
  revalidatePath(`/produk/${slug}`, 'page')
  revalidatePath('/sitemap.xml')
  // Catatan: AR-03 awalnya skip revalidate('/') dgn asumsi Beranda tidak
  // reference produk spesifik. Asumsi itu salah — ProductsPreview di
  // Beranda memang render data produk (fixed bareng bug "homepage tidak
  // ikut ter-update" pasca Slice 1 QA).

  return { revalidated: true, timestamp: new Date().toISOString() }
}
