// lib/data/articles.ts
// Epic 6 Slice 1 — fungsi query terpusat untuk tabel articles, Direct
// Supabase (AR-01), dipakai lintas halaman (/artikel, /artikel/[slug]) dan
// lintas slice (Slice 3 homepage section). Setiap fungsi try/catch →
// console.error → fallback kosong, pola identik getProductsPreview di
// app/(public)/page.tsx.

import { createPublic } from '@/lib/supabase/public'
import { mapArticleRow } from '@/lib/article-mapper'
import type { Article, ArticleCategory, ArticleRow } from '@/types/api'

const ARTICLES_PER_PAGE = 6

interface GetPublishedArticlesParams {
  category?: ArticleCategory
  page?: number
}

interface GetPublishedArticlesResult {
  articles: Article[]
  total: number
  totalPages: number
}

export async function getPublishedArticles(
  params: GetPublishedArticlesParams = {}
): Promise<GetPublishedArticlesResult> {
  const page = params.page && params.page > 0 ? params.page : 1
  const from = (page - 1) * ARTICLES_PER_PAGE
  const to = from + ARTICLES_PER_PAGE - 1

  try {
    const supabase = createPublic()
    let query = supabase
      .from('articles')
      .select('*', { count: 'exact' })
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .range(from, to)

    if (params.category) {
      query = query.eq('category', params.category)
    }

    const { data, error, count } = await query

    if (error || !data) {
      console.error('[Articles] Gagal fetch published articles:', error?.message)
      return { articles: [], total: 0, totalPages: 0 }
    }

    const total = count ?? 0
    return {
      articles: data.map((row) => mapArticleRow(row as ArticleRow)),
      total,
      totalPages: Math.max(1, Math.ceil(total / ARTICLES_PER_PAGE)),
    }
  } catch (err) {
    console.error('[Articles] Exception saat fetch published articles:', err)
    return { articles: [], total: 0, totalPages: 0 }
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const supabase = createPublic()
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .limit(1)
      .maybeSingle()

    if (error || !data) return null
    return mapArticleRow(data as ArticleRow)
  } catch (err) {
    console.error('[Articles] Exception saat fetch article by slug:', err)
    return null
  }
}

export async function getLatestArticles(limit = 3): Promise<Article[]> {
  try {
    const supabase = createPublic()
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error || !data) return []
    return data.map((row) => mapArticleRow(row as ArticleRow))
  } catch (err) {
    console.error('[Articles] Exception saat fetch latest articles:', err)
    return []
  }
}

export async function getMostViewedArticles(limit = 3): Promise<Article[]> {
  try {
    const supabase = createPublic()
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('is_published', true)
      .order('view_count', { ascending: false })
      .limit(limit)

    if (error || !data) return []
    return data.map((row) => mapArticleRow(row as ArticleRow))
  } catch (err) {
    console.error('[Articles] Exception saat fetch most viewed articles:', err)
    return []
  }
}

export async function getRelatedArticles(
  category: ArticleCategory,
  excludeSlug: string,
  limit = 3
): Promise<Article[]> {
  try {
    const supabase = createPublic()
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('is_published', true)
      .eq('category', category)
      .neq('slug', excludeSlug)
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error || !data) return []
    return data.map((row) => mapArticleRow(row as ArticleRow))
  } catch (err) {
    console.error('[Articles] Exception saat fetch related articles:', err)
    return []
  }
}

export async function getAllPublishedSlugsForSitemap(): Promise<
  Array<{ slug: string; published_at: string | null }>
> {
  try {
    const supabase = createPublic()
    const { data, error } = await supabase
      .from('articles')
      .select('slug, published_at')
      .eq('is_published', true)

    if (error || !data) return []
    return data as Array<{ slug: string; published_at: string | null }>
  } catch (err) {
    console.error('[Articles] Exception saat fetch slugs untuk sitemap:', err)
    return []
  }
}

/** Slug lama -> slug terkini, untuk redirect permanen.
 *
 *  Dipanggil HANYA ketika sebuah slug tidak ditemukan di tabel articles,
 *  jadi ia tidak menambah query pada jalur normal — nol biaya untuk 99%
 *  request. Dua langkah karena article_slug_history hanya menyimpan
 *  article_id, bukan slug terkini: menyimpannya akan basi begitu slug
 *  diubah untuk kedua kalinya.
 */
export async function getCurrentSlugForOldSlug(oldSlug: string): Promise<string | null> {
  try {
    const supabase = createPublic()
    const { data: history, error: histErr } = await supabase
      .from('article_slug_history')
      .select('article_id')
      .eq('old_slug', oldSlug)
      .limit(1)
      .maybeSingle()

    if (histErr || !history) return null

    const { data: article, error: artErr } = await supabase
      .from('articles')
      .select('slug, is_published')
      .eq('id', history.article_id)
      .limit(1)
      .maybeSingle()

    // Artikelnya sudah tidak terbit -> jangan alihkan ke halaman yang juga
    // akan 404. Biarkan 404 di sini, itu jawaban yang jujur.
    if (artErr || !article || !article.is_published) return null
    return article.slug as string
  } catch (err) {
    console.error('[Articles] Exception saat cek riwayat slug:', err)
    return null
  }
}
