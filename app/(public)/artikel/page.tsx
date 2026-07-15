// app/(public)/artikel/page.tsx
// Epic 6 Slice 1 (E6-S1-FE-05) — daftar artikel, ISR revalidate 300 per
// CLAUDE.md. searchParams di-await (Next.js 15), validasi enum defense in
// depth (AR-07, pola sama R-58 Epic 5 Admin).

import type { Metadata } from 'next'
import { InnerPageHero } from '@/components/sections/InnerPageHero'
import { CategoryTabs } from '@/components/article/CategoryTabs'
import { ArticleCard } from '@/components/blocks/ArticleCard'
import { ArticlePagination } from '@/components/article/ArticlePagination'
import { getPublishedArticles } from '@/lib/data/articles'
import type { ArticleCategory } from '@/types/api'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Artikel & Berita | CV Reka Cipta Indonesia',
  description:
    'Wawasan industri garam, standar SNI, dan kabar terbaru dari CV Reka Cipta Indonesia.',
  alternates: {
    canonical: 'https://rekaciptaindonesia.com/artikel',
  },
  openGraph: {
    title: 'Artikel & Berita — CV Reka Cipta Indonesia',
    description:
      'Wawasan industri garam, standar SNI, dan kabar terbaru dari CV Reka Cipta Indonesia.',
    url: 'https://rekaciptaindonesia.com/artikel',
    type: 'website',
  },
}

const VALID_CATEGORIES: ArticleCategory[] = ['education', 'company_news']

interface Props {
  searchParams: Promise<{ category?: string; page?: string }>
}

export default async function ArtikelListPage({ searchParams }: Props) {
  const params = await searchParams

  const validCategory: ArticleCategory | undefined = VALID_CATEGORIES.includes(
    params.category as ArticleCategory
  )
    ? (params.category as ArticleCategory)
    : undefined

  const pageNum = Number(params.page)
  const validPage = Number.isInteger(pageNum) && pageNum > 0 ? pageNum : 1

  const { articles, totalPages } = await getPublishedArticles({
    category: validCategory,
    page: validPage,
  })

  function buildHref(page: number) {
    const qs = new URLSearchParams()
    if (validCategory) qs.set('category', validCategory)
    if (page > 1) qs.set('page', String(page))
    const query = qs.toString()
    return `/artikel${query ? `?${query}` : ''}`
  }

  return (
    <main>
      <InnerPageHero
        title="Artikel & Berita"
        subtitle="Wawasan industri garam dan kabar terbaru dari CV Reka Cipta Indonesia"
      />
      <section className="mx-auto max-w-7xl px-4 py-12">
        <CategoryTabs />
        {articles.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
        <ArticlePagination currentPage={validPage} totalPages={totalPages} buildHref={buildHref} />
      </section>
    </main>
  )
}

function EmptyState() {
  return (
    <div className="py-16 text-center text-neutral-500">
      <p className="text-lg font-medium">Belum ada artikel yang dipublikasikan</p>
      <p className="mt-1 text-sm">
        Nantikan konten edukasi dan berita terbaru dari CV Reka Cipta Indonesia
      </p>
    </div>
  )
}
