'use server'

// app/actions/articles.ts
// Epic 6 Admin Slice 1 (E6-ADM-S1-FE-05) — revalidate rute publik setelah
// CRUD artikel. WAJIB include revalidatePath('/') — app/actions/products.ts
// sempat lupa ini dan itu jadi bug production (lihat komentar di file itu),
// slice ini tidak mengulangi kesalahan yang sama (AR-06).

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function revalidateArticleRoutes(slug?: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('UNAUTHORIZED')
  }

  revalidatePath('/')
  revalidatePath('/artikel')
  if (slug) revalidatePath(`/artikel/${slug}`)
  revalidatePath('/sitemap.xml')

  return { revalidated: true, timestamp: new Date().toISOString() }
}
