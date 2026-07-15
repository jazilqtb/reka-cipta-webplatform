// app/admin/articles/[id]/edit/page.tsx
// Epic 6 Admin Slice 1 (E6-ADM-S1-FE-07)

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { mapArticleRow } from '@/lib/article-mapper'
import { AdminHeader } from '@/components/layout/AdminHeader'
import { ArticleForm } from '@/components/admin/article/ArticleForm'
import type { ArticleAdmin, ArticleRow } from '@/types/api'

export const metadata = { title: 'Edit Artikel — Admin RCI' }

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('articles').select('*').eq('id', id).limit(1).maybeSingle()

  if (!data) notFound()

  const row = data as ArticleRow
  const article: ArticleAdmin = {
    ...mapArticleRow(row),
    is_published: row.is_published,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }

  return (
    <>
      <AdminHeader title="Edit Artikel" breadcrumb={`Artikel / ${article.title}`} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="page-transition">
          <ArticleForm mode="edit" initialData={article} />
        </div>
      </main>
    </>
  )
}
