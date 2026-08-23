// app/robots.ts
// Epic 2 Slice 1 (E2-S1-FE-09) — Auto-generate /robots.txt.
//
// Konvensi Next.js App Router: file ini akan tersedia di
// https://rekaciptaindonesia.com/robots.txt
//
// Rule:
// - Allow / dan semua halaman publik
// - Disallow /admin/* (area kerja, bukan publik)
// - Disallow /api/* (jika di kemudian hari Next route handlers
//   dipakai — saat ini tidak, tapi safety net)
// - Sitemap reference: /sitemap.xml

import type { MetadataRoute } from 'next'
import { SITE_URL as BASE_URL } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
