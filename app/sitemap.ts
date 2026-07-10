// app/sitemap.ts
// Epic 2 Slice 1 (E2-S1-FE-09) — Auto-generate /sitemap.xml.
//
// Konvensi Next.js App Router: tersedia di
// https://rekaciptaindonesia.com/sitemap.xml
//
// PENTING: Hanya cantumkan halaman yang BENAR-BENAR ada agar
// Google tidak menurunkan trust karena 404. Tambahkan URL baru
// saat halaman selesai dibuat (Slice 2: /tentang-kami, Slice 3:
// /kontak, Epic 3: /produk dan /produk/[slug]).

import type { MetadataRoute } from 'next'
import { createPublic } from '@/lib/supabase/public'

const BASE_URL = 'https://rekaciptaindonesia.com'

async function getProductDetailUrls(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublic()
  const { data, error } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('is_active', true)

  if (error || !data) {
    console.error('[sitemap] Gagal fetch products:', error?.message)
    return []
  }

  return data.map((product) => ({
    url: `${BASE_URL}/produk/${product.slug}`,
    lastModified: new Date(product.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Tanggal terakhir update Beranda — sesuai dgn ISR revalidate 3600
  const lastModified = new Date()
  const productDetailUrls = await getProductDetailUrls()

  return [
    {
      url: BASE_URL,
      lastModified,
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/tentang-kami`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/kontak`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/produk`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/minta-penawaran`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    ...productDetailUrls,
  ]
}
