// components/article/CategoryTabs.tsx
// Epic 6 Slice 1 (E6-S1-FE-03) — filter kategori /artikel, sinkron URL
// (?category=), pola tab-underline-slide (Design System §10.6).

'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { ArticleCategory } from '@/types/api'

const TABS: Array<{ value: ArticleCategory | 'all'; label: string }> = [
  { value: 'all', label: 'Semua' },
  { value: 'education', label: 'Edukasi Garam' },
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
    <div className="relative flex gap-6 overflow-x-auto border-b border-neutral-200">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => handleTabClick(tab.value)}
          className={`relative shrink-0 pb-3 text-sm font-medium transition-colors ${
            activeCategory === tab.value ? 'text-brand-teal-700' : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          {tab.label}
          {activeCategory === tab.value && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-teal-600" />
          )}
        </button>
      ))}
    </div>
  )
}
