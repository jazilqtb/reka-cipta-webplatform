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

const BASE_URL = 'https://rekaciptaindonesia.com'

export default function sitemap(): MetadataRoute.Sitemap {
  // Tanggal terakhir update Beranda — sesuai dgn ISR revalidate 3600
  const lastModified = new Date()

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
    // TODO(Slice 3): tambah /kontak priority 0.7
    // TODO(Slice 3): tambah /kontak priority 0.7
    // TODO(Epic 3): tambah /produk priority 0.9 + /produk/[slug] per produk
  ]
}
