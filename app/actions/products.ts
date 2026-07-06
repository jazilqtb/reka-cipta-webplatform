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

  revalidatePath('/produk')
  revalidatePath(`/produk/${slug}`)
  revalidatePath('/sitemap.xml')
  // '/' tidak di-invalidate — Beranda tidak reference produk spesifik (AR-03)

  return { revalidated: true, timestamp: new Date().toISOString() }
}
