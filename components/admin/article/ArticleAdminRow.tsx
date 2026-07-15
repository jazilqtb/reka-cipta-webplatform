'use client'

// components/admin/article/ArticleAdminRow.tsx
// Epic 6 Admin Slice 1 (E6-ADM-S1-FE-04) — beda dari ProductAdminRow (full
// Server Component): baris ini Client Component karena butuh tombol toggle
// publish + hapus yang mutasi state langsung dari list.

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { toggleArticlePublish, deleteArticle, ApiFetchError } from '@/lib/api'
import type { ArticleCategory } from '@/types/api'

const CATEGORY_LABEL: Record<ArticleCategory, string> = {
  education: 'Edukasi Garam',
  company_news: 'Berita Perusahaan',
}

export interface ArticleAdminRowData {
  id: string
  title: string
  slug: string
  category: ArticleCategory
  is_published: boolean
  updated_at: string
}

export function ArticleAdminRow({ article }: { article: ArticleAdminRowData }) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  async function handleTogglePublish() {
    setIsPending(true)
    try {
      await toggleArticlePublish(article.id, { is_published: !article.is_published })
      toast.success(article.is_published ? 'Artikel di-unpublish' : 'Artikel di-publish')
      router.refresh()
    } catch (err) {
      if (err instanceof ApiFetchError && err.status === 401) router.push('/admin/login')
      else toast.error('Gagal mengubah status publish')
    } finally {
      setIsPending(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Hapus artikel "${article.title}"? Tindakan tidak bisa dibatalkan.`)) return
    setIsPending(true)
    try {
      await deleteArticle(article.id)
      toast.success('Artikel dihapus')
      router.refresh()
    } catch (err) {
      if (err instanceof ApiFetchError && err.status === 401) router.push('/admin/login')
      else toast.error('Gagal menghapus artikel')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <tr className="transition-colors duration-100 hover:bg-neutral-50">
      <td className="px-4 py-3">
        <Link
          href={`/admin/articles/${article.id}/edit`}
          className="font-medium text-ink-700 hover:text-brand-teal-600"
        >
          {article.title}
        </Link>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center rounded bg-brand-teal-50 px-2 py-0.5 text-xs font-medium text-brand-teal-700">
          {CATEGORY_LABEL[article.category]}
        </span>
      </td>
      <td className="px-4 py-3">
        {article.is_published ? (
          <span className="inline-flex items-center rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
            Published
          </span>
        ) : (
          <span className="inline-flex items-center rounded bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600">
            Draft
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-neutral-500">
        {format(new Date(article.updated_at), 'd MMM yyyy, HH:mm', { locale: idLocale })}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="inline-flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleTogglePublish}
            disabled={isPending}
            title={article.is_published ? 'Unpublish' : 'Publish'}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-neutral-300 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
          >
            {article.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <Link
            href={`/admin/articles/${article.id}/edit`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-neutral-300 text-neutral-600 hover:bg-neutral-50"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-danger-200 text-danger-600 hover:bg-danger-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}
