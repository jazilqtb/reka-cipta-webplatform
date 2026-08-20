// components/article/ArticlePagination.tsx
// Epic 6 Slice 1 (E6-S1-FE-04) — navigasi halaman /artikel.
//
// RONDE Tahap 11 (2026-08) — Design System Rollout (T2): ikon Lucide →
// Phosphor duotone, link teks polos → tombol pill dgn hover-lift.
// Nomor halaman pakai mono-tech (angka = bahasa mono di seluruh situs).
//
// Catatan historis: `.link-arrow`/`.arrow-icon` dulu belum ada di
// globals.css saat file ini dibuat, jadi dipakai `group` +
// `group-hover:translate-x-*` langsung. Class-nya SEKARANG sudah ada
// (ditambahkan di ronde Homepage Redesign), tapi pola group-hover di
// sini tetap dipertahankan — arah panah kiri/kanan berbeda, dan
// `.arrow-icon` hanya mendefinisikan geser ke KANAN.

import Link from 'next/link'
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react/ssr'
import { cn } from '@/lib/utils'

interface Props {
  currentPage: number
  totalPages: number
  buildHref: (page: number) => string
}

const BASE = 'font-ui group inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-200'
const ENABLED = 'border-ink-900/15 text-brand-teal-700 hover:-translate-y-0.5 hover:bg-brand-teal-50 hover:shadow-sm'
const DISABLED = 'pointer-events-none border-ink-900/[0.06] text-neutral-300'

export function ArticlePagination({ currentPage, totalPages, buildHref }: Props) {
  if (totalPages <= 1) return null

  const isFirst = currentPage <= 1
  const isLast = currentPage >= totalPages

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 py-10">
      <Link
        href={buildHref(currentPage - 1)}
        aria-disabled={isFirst}
        tabIndex={isFirst ? -1 : undefined}
        className={cn(BASE, isFirst ? DISABLED : ENABLED)}
      >
        <CaretLeftIcon
          size={16}
          weight="bold"
          className="transition-transform duration-200 group-hover:-translate-x-0.5"
          aria-hidden="true"
        />
        Sebelumnya
      </Link>

      <span className="font-ui text-sm text-neutral-500">
        Halaman <span className="mono-tech font-bold text-ink-700">{currentPage}</span> dari{' '}
        <span className="mono-tech font-bold text-ink-700">{totalPages}</span>
      </span>

      <Link
        href={buildHref(currentPage + 1)}
        aria-disabled={isLast}
        tabIndex={isLast ? -1 : undefined}
        className={cn(BASE, isLast ? DISABLED : ENABLED)}
      >
        Berikutnya
        <CaretRightIcon
          size={16}
          weight="bold"
          className="transition-transform duration-200 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </div>
  )
}
