// components/admin/article/ArticlesAdminList.tsx
// Epic 6 Admin Slice 1 (E6-ADM-S1-FE-04) — Tabel artikel admin. Server
// Component (pola sama ProductsAdminList), delegasi tiap baris ke
// ArticleAdminRow (Client Component, butuh mutasi toggle/hapus).

import { ArticleAdminRow, type ArticleAdminRowData } from './ArticleAdminRow'

interface ArticlesAdminListProps {
  articles: ArticleAdminRowData[]
}

export function ArticlesAdminList({ articles }: ArticlesAdminListProps) {
  if (articles.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
        Belum ada artikel. Klik &ldquo;Tambah Artikel Baru&rdquo; untuk mulai.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50">
          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
            <th className="px-4 py-3">Judul</th>
            <th className="px-4 py-3">Kategori</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Update Terakhir</th>
            <th className="px-4 py-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {articles.map((article) => (
            <ArticleAdminRow key={article.id} article={article} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
