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
  }
}
