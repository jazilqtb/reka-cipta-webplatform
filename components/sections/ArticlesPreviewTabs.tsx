// components/sections/ArticlesPreviewTabs.tsx
// Epic 6 Slice 3 (E6-S3-FE-02) — toggle Terbaru/Terbanyak Dilihat di
// homepage. State lokal (bukan URL-sync seperti CategoryTabs Slice 1) —
// toggle homepage tidak perlu shareable link per tab, kebutuhan beda
// dengan filter /artikel meski visual mirip (lihat catatan di dokumen
// task breakdown Slice 3, sengaja tidak diekstrak jadi 1 shared component).

'use client'

import { useState } from 'react'
import { ArticleCard } from '@/components/blocks/ArticleCard'
import type { Article } from '@/types/api'

interface Props {
  latestArticles: Article[]
  mostViewedArticles: Article[]
}

type TabValue = 'latest' | 'most_viewed'

export function ArticlesPreviewTabs({ latestArticles, mostViewedArticles }: Props) {
  const [activeTab, setActiveTab] = useState<TabValue>('latest')
  const articles = activeTab === 'latest' ? latestArticles : mostViewedArticles

  return (
    <div>
      <div className="relative flex justify-center gap-6 border-b border-neutral-200">
        <TabButton label="Terbaru" isActive={activeTab === 'latest'} onClick={() => setActiveTab('latest')} />
        <TabButton
          label="Terbanyak Dilihat"
          isActive={activeTab === 'most_viewed'}
          onClick={() => setActiveTab('most_viewed')}
        />
      </div>

      {articles.length === 0 ? (
        <p className="py-10 text-center text-sm text-neutral-500">Belum ada data untuk kategori ini.</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  )
}

function TabButton({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative pb-3 text-sm font-medium transition-colors ${
        isActive ? 'text-brand-teal-700' : 'text-neutral-500 hover:text-neutral-700'
      }`}
    >
      {label}
      {isActive && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-teal-600" />}
    </button>
  )
}
