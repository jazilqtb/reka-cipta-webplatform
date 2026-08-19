// app/admin/articles/page.tsx — Halaman Admin Manajemen Artikel
// Epic 6 Admin Slice 1 (E6-ADM-S1-FE-03)
//
// Server Component: fetch langsung via lib/supabase/server.ts (cookie
// session), BUKAN lewat FastAPI/apiFetch — pola sama Products Admin
// (lihat AR-02 task breakdown). RLS "Authenticated can read all articles"
// (articles_rls.sql, Epic 6 CF Slice 1) mengizinkan user login baca semua
// baris termasuk draft.

import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/layout/AdminHeader'
import { ArticlesWorkspace, type ArticleRowData } from '@/components/admin/article/ArticlesWorkspace'
import type { ArticleRow } from '@/types/api'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Manajemen Artikel',
}

export default async function AdminArticlesPage() {
  const supabase = await createClient()
  // view_count ikut diambil: pada 100+ artikel, "mana yang benar-benar
  // dibaca" adalah salah satu cara paling berguna untuk mengurutkan.
  const { data, error } = await supabase
    .from('articles')
    .select('id, title, slug, category, is_published, view_count, updated_at')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('[AdminArticles] Gagal fetch articles:', error.message)
  }

  const articles: ArticleRowData[] = (data ?? []).map((row) => {
    const t = row as Pick<
      ArticleRow,
      'id' | 'title' | 'slug' | 'category' | 'is_published' | 'view_count' | 'updated_at'
    >
    return {
      id: t.id,
      title: t.title,
      slug: t.slug,
      category: t.category,
      is_published: t.is_published,
      view_count: t.view_count ?? 0,
      updated_at: t.updated_at,
    }
  })

  return (
    <>
      <AdminHeader title="Artikel" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="page-transition mx-auto max-w-[1400px]">
          <ArticlesWorkspace initialArticles={articles} />
        </div>
      </main>
    </>
  )
}
