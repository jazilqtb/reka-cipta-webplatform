// lib/article-mapper.ts
// Epic 6 Slice 1 — map row Supabase mentah (ArticleRow) ke Article
// (kontrak yang dipakai komponen), dengan komputasi thumbnail_url dari
// thumbnail_path. Pola identik lib/product-mapper.ts.

import { getPublicStorageUrl } from '@/lib/storage'
import type { Article, ArticleRow } from '@/types/api'

/** String kosong DIPERLAKUKAN SAMA DENGAN belum diisi.
 *
 *  Kolom SEO artikel bertipe nullable, dan seluruh application layer memakai
 *  pola `nilai ?? cadangan`. Tapi `??` hanya menangkap null/undefined — BUKAN
 *  string kosong. Form admin menyimpan '' untuk field opsional yang tidak
 *  disentuh, jadi '' lolos sebagai "nilai yang valid" dan cadangannya tidak
 *  pernah jalan.
 *
 *  Akibat nyata yang terlihat di produksi, bukan hipotesis:
 *    - /artikel/reka-cipta-jembatani-dua-dunia punya canonical_url = ''
 *      -> <link rel="canonical"> HILANG SAMA SEKALI dari halaman
 *    - artikel satunya punya meta_description = ''
 *      -> <meta name="description"> ikut hilang
 *  Keduanya gagal diam-diam: halaman tetap 200, tidak ada error di mana pun.
 *
 *  Dinormalkan di mapper supaya SATU tempat memperbaiki seluruh pembaca
 *  (generateMetadata, JSON-LD, sitemap, form admin). */
function orNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function mapArticleRow(row: ArticleRow): Article {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    category: row.category,
    content: row.content,
    thumbnail_url: row.thumbnail_path
      ? getPublicStorageUrl('article-thumbnails', row.thumbnail_path)
      : null,
    meta_description: orNull(row.meta_description),
    view_count: row.view_count,
    published_at: row.published_at,
    updated_at: row.updated_at ?? null,

    // Checkpoint 3 (2026-08-15) — field SEO. Sengaja dibiarkan null di
    // sini kalau DB null; FALLBACK-nya diterapkan di titik pakai
    // (generateMetadata), BUKAN di mapper ini. Alasannya: mapper tidak
    // tahu base URL situs, dan menyalin `title` ke `meta_title` di sini
    // akan menghapus informasi "admin belum pernah mengisi field ini" —
    // yang dibutuhkan form admin untuk menampilkan placeholder yang benar.
    meta_title: orNull(row.meta_title),
    og_image_url: (() => {
      const path = orNull(row.og_image_path)
      return path ? getPublicStorageUrl('article-thumbnails', path) : null
    })(),
    canonical_url: orNull(row.canonical_url),
  }
}
