// components/article/CategoryTabs.tsx
// Epic 6 Slice 1 (E6-S1-FE-03) — filter kategori /artikel, sinkron URL
// (?category=).
//
// RONDE Tahap 11 (2026-08) — Design System Rollout (T2): tab-underline
// diganti segmented pill control + indikator SLIDE (Framer Motion
// layoutId) — pola identik CategoryFilterTabs.tsx di /produk, supaya
// dua halaman berfilter di situs ini tidak punya dua bahasa interaksi
// yang berbeda.
//
// COPYWRITING: "Edukasi Garam" → "Wawasan Industri" (lihat catatan di
// ArticleCard.tsx — label yang sama juga dipakai sbg badge kartu,
// keduanya diubah bersamaan).
//
// CATATAN z-index (pelajaran dari bug CategoryFilterTabs /produk):
// indikator pill TIDAK boleh pakai `-z-10`. Tombol tab `relative` tanpa
// z-index sendiri tidak membentuk stacking context, jadi z-index
// NEGATIF pada child-nya bocor ke parent dan pill tenggelam di balik
// background list. Urutan DOM (indikator dulu, label kemudian) + label
// `relative z-10` sudah cukup.

'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ARTICLE_CATEGORY_LABEL } from '@/constants/articleCategories'
import type { ArticleCategory } from '@/types/api'

const TABS: Array<{ value: ArticleCategory | 'all'; label: string }> = [
  { value: 'all', label: 'Semua' },
  { value: 'education', label: ARTICLE_CATEGORY_LABEL.education },
  { value: 'company_news', label: ARTICLE_CATEGORY_LABEL.company_news },
]

export function CategoryTabs() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeCategory = searchParams.get('category') ?? 'all'

  function hrefFor(value: string) {
    const params = new URLSearchParams(searchParams)
    if (value === 'all') {
      params.delete('category')
    } else {
      params.set('category', value)
    }
    params.delete('page')
    return `${pathname}${params.toString() ? `?${params.toString()}` : ''}`
  }

  return (
    <div className="overflow-x-auto">
      <div className="no-scrollbar inline-flex gap-1 rounded-md border border-ink-900/10 bg-white p-1 font-ui">
        {TABS.map((tab) => {
          const isActive = activeCategory === tab.value
          return (
            <Link
              key={tab.value}
              href={hrefFor(tab.value)}
              scroll={false}
              aria-pressed={isActive}
              className={`relative flex shrink-0 items-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:shadow-focus ${
                isActive ? 'text-white' : 'text-ink-700/60 hover:text-ink-700'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="article-category-pill"
                  className="absolute inset-0 rounded-md bg-brand-teal-600"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
