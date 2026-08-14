// lib/article-mapper.ts
// Epic 6 Slice 1 — map row Supabase mentah (ArticleRow) ke Article
// (kontrak yang dipakai komponen), dengan komputasi thumbnail_url dari
// thumbnail_path. Pola identik lib/product-mapper.ts.

import { getPublicStorageUrl } from '@/lib/storage'
import type { Article, ArticleRow } from '@/types/api'

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
    meta_description: row.meta_description,
    view_count: row.view_count,
    published_at: row.published_at,

    // Checkpoint 3 (2026-08-15) — field SEO. Sengaja dibiarkan null di
    // sini kalau DB null; FALLBACK-nya diterapkan di titik pakai
    // (generateMetadata), BUKAN di mapper ini. Alasannya: mapper tidak
    // tahu base URL situs, dan menyalin `title` ke `meta_title` di sini
    // akan menghapus informasi "admin belum pernah mengisi field ini" —
    // yang dibutuhkan form admin untuk menampilkan placeholder yang benar.
    meta_title: row.meta_title ?? null,
    og_image_url: row.og_image_path
      ? getPublicStorageUrl('article-thumbnails', row.og_image_path)
      : null,
    canonical_url: row.canonical_url ?? null,
  }
}
