// app/admin/articles/page.tsx — Halaman Admin Manajemen Artikel
// Epic 6 Admin Slice 1 (E6-ADM-S1-FE-03)
//
// Server Component: fetch langsung via lib/supabase/server.ts (cookie
// session), BUKAN lewat FastAPI/apiFetch — pola sama Products Admin
// (lihat AR-02 task breakdown). RLS "Authenticated can read all articles"
// (articles_rls.sql, Epic 6 CF Slice 1) mengizinkan user login baca semua
// baris termasuk draft.

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/layout/AdminHeader'
import { ArticlesAdminList } from '@/components/admin/article/ArticlesAdminList'
import type { ArticleAdminRowData } from '@/components/admin/article/ArticleAdminRow'
import type { ArticleRow } from '@/types/api'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Manajemen Artikel — Admin RCI',
}

export default async function AdminArticlesPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('articles')
    .select('id, title, slug, category, is_published, updated_at')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('[AdminArticles] Gagal fetch articles:', error.message)
  }

  const articles: ArticleAdminRowData[] = (data ?? []).map((row) => {
    const typed = row as Pick<ArticleRow, 'id' | 'title' | 'slug' | 'category' | 'is_published' | 'updated_at'>
    return {
      id: typed.id,
      title: typed.title,
      slug: typed.slug,
      category: typed.category,
      is_published: typed.is_published,
      updated_at: typed.updated_at,
    }
  })
  const publishedCount = articles.filter((a) => a.is_published).length

  return (
    <>
      <AdminHeader title="Manajemen Artikel" breadcrumb="Artikel" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-6xl space-y-6 page-transition">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-600">
              {articles.length} artikel ({publishedCount} published, {articles.length - publishedCount} draft)
            </p>
            <Link
              href="/admin/articles/new"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-teal-600 px-3 text-sm font-medium text-white hover:bg-brand-teal-500"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Tambah Artikel Baru
            </Link>
          </div>
          <ArticlesAdminList articles={articles} />
        </div>
      </main>
    </>
  )
}
