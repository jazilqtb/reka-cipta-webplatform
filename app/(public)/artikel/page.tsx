// app/(public)/artikel/page.tsx
// Epic 6 Slice 1 (E6-S1-FE-05) — daftar artikel, ISR revalidate 300 per
// CLAUDE.md. searchParams di-await (Next.js 15), validasi enum defense in
// depth (AR-07, pola sama R-58 Epic 5 Admin).
//
// RONDE Tahap 11 (2026-08) — Design System Rollout (T2): <InnerPageHero>
// generik diganti <PageHero>, section putih polos diberi gradasi solid
// halus (salt-50 → white) — bukan motif garis. Logika filter/pagination
// (validasi enum, buildHref, await searchParams) TIDAK disentuh.

import type { Metadata } from 'next'
import { NewspaperIcon } from '@phosphor-icons/react/ssr'
import { PageHero } from '@/components/sections/PageHero'
import { CategoryTabs } from '@/components/article/CategoryTabs'
import { ArticleCard } from '@/components/blocks/ArticleCard'
import { ArticlePagination } from '@/components/article/ArticlePagination'
import { RevealWrapper } from '@/components/animations/RevealWrapper'
import { SectionDivider } from '@/components/decorative/SectionDivider'
import { getPublishedArticles } from '@/lib/data/articles'
import type { ArticleCategory } from '@/types/api'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Artikel & Berita',
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
      <PageHero
        eyebrow="Artikel & Berita"
        title="Wawasan Industri Garam dari"
        titleAccent="Praktik Lapangan"
        subtitle="Catatan teknis, standar mutu, dan kabar terbaru seputar distribusi garam industri di Indonesia."
        breadcrumbLabel="Artikel"
        dividerTo="bg-salt-50"
        credentials={[
          {
            icon: <NewspaperIcon size={16} weight="duotone" className="text-brand-teal-300" aria-hidden="true" />,
            label: 'Diperbarui Berkala oleh Tim Kami',
          },
        ]}
      />

      {/* Gradasi solid sangat halus — bukan motif garis (D10 TASK-PLAN) */}
      <section className="bg-gradient-to-b from-salt-50 to-white px-4 py-12 md:py-16">
        <div className="mx-auto max-w-7xl">
          <CategoryTabs />

          {articles.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-5 md:mt-10 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article, i) => (
                <RevealWrapper key={article.id} variant="reveal-up" delay={i * 60}>
                  <ArticleCard article={article} className="h-full" />
                </RevealWrapper>
              ))}
            </div>
          )}

          <ArticlePagination currentPage={validPage} totalPages={totalPages} buildHref={buildHref} />
        </div>
      </section>

      {/* Penutup ke Footer (ink-900) — fill-white match tepi bawah
          gradient section di atas (…to-white), bukan garis lurus. */}
      <SectionDivider variant="wave" fromClassName="fill-white" toClassName="bg-ink-900" />
    </main>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <NewspaperIcon size={40} weight="duotone" className="text-neutral-300" aria-hidden="true" />
      <p className="font-ui text-lg font-semibold text-ink-700">
        Belum ada artikel yang dipublikasikan
      </p>
      <p className="text-sm text-neutral-600">
        Nantikan wawasan industri dan kabar terbaru dari CV Reka Cipta Indonesia.
      </p>
    </div>
  )
}
