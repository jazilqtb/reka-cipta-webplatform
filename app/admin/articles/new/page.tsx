// app/admin/articles/new/page.tsx
// Epic 6 Admin Slice 1 (E6-ADM-S1-FE-07)

import { AdminHeader } from '@/components/layout/AdminHeader'
import { ArticleForm } from '@/components/admin/article/ArticleForm'

export const metadata = { title: 'Tambah Artikel' }

export default function NewArticlePage() {
  return (
    <>
      <AdminHeader title="Tambah Artikel Baru" breadcrumb="Artikel / Tambah" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="page-transition">
          <ArticleForm mode="create" />
        </div>
      </main>
    </>
  )
}
