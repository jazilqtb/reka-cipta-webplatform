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

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import type { ArticleCategory } from '@/types/api'

const TABS: Array<{ value: ArticleCategory | 'all'; label: string }> = [
  { value: 'all', label: 'Semua' },
  { value: 'education', label: 'Wawasan Industri' },
  { value: 'company_news', label: 'Berita Perusahaan' },
]

export function CategoryTabs() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeCategory = searchParams.get('category') ?? 'all'

  function handleTabClick(value: string) {
    const params = new URLSearchParams(searchParams)
    if (value === 'all') {
      params.delete('category')
    } else {
      params.set('category', value)
    }
    params.delete('page') // reset ke halaman 1 saat ganti kategori
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <div className="overflow-x-auto">
      <div className="no-scrollbar inline-flex gap-1 rounded-full border border-ink-900/10 bg-white p-1 font-ui">
        {TABS.map((tab) => {
          const isActive = activeCategory === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleTabClick(tab.value)}
              aria-pressed={isActive}
              className={`relative shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:shadow-focus ${
                isActive ? 'text-white' : 'text-ink-700/60 hover:text-ink-700'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="article-category-pill"
                  className="absolute inset-0 rounded-full bg-brand-teal-600"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
