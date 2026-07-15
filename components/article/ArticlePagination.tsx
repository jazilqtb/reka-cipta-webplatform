// components/article/ArticlePagination.tsx
// Epic 6 Slice 1 (E6-S1-FE-04) — navigasi halaman /artikel.
//
// Design System §11.3 mendefinisikan class `.link-arrow`/`.arrow-icon`,
// tapi class ini TIDAK ada di globals.css (frozen file, gap yang sama
// dengan `.card-hover-lift` — lihat Catatan Penutup
// epic6_task_breakdown_slice1_artikel-berita.md). Dipakai `group` +
// `group-hover:translate-x-*` Tailwind langsung supaya slide-arrow
// benar-benar berfungsi, bukan class yang diam-diam no-op.

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  currentPage: number
  totalPages: number
  buildHref: (page: number) => string
}

export function ArticlePagination({ currentPage, totalPages, buildHref }: Props) {
  if (totalPages <= 1) return null

  const isFirst = currentPage <= 1
  const isLast = currentPage >= totalPages

  return (
    <div className="flex items-center justify-center gap-4 py-8">
      <Link
        href={buildHref(currentPage - 1)}
        aria-disabled={isFirst}
        tabIndex={isFirst ? -1 : undefined}
        className={cn(
          'group inline-flex items-center gap-1 text-sm font-medium',
          isFirst ? 'pointer-events-none text-neutral-300' : 'text-brand-teal-600'
        )}
      >
        <ChevronLeft
          className="h-4 w-4 transition-transform duration-150 group-hover:-translate-x-1"
          aria-hidden="true"
        />
        Sebelumnya
      </Link>
      <span className="text-sm text-neutral-500">
        Halaman {currentPage} dari {totalPages}
      </span>
      <Link
        href={buildHref(currentPage + 1)}
        aria-disabled={isLast}
        tabIndex={isLast ? -1 : undefined}
        className={cn(
          'group inline-flex items-center gap-1 text-sm font-medium',
          isLast ? 'pointer-events-none text-neutral-300' : 'text-brand-teal-600'
        )}
      >
        Berikutnya
        <ChevronRight
          className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1"
          aria-hidden="true"
        />
      </Link>
    </div>
  )
}
