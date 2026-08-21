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

/* generateMetadata menggantikan objek `metadata` statis (CP5, 2026-08-21).
 *
 * DUA CACAT SEO PADA PAGINATION YANG SUDAH TAYANG:
 *
 * 1. Kanonik halaman 2+ menunjuk ke /artikel. Itu memberi tahu Google
 *    bahwa isi halaman 2 adalah DUPLIKAT halaman 1 — dan artikel yang
 *    hanya muncul di halaman 2 berisiko tidak pernah terindeks sama
 *    sekali. Sekarang tiap halaman kanonik ke dirinya sendiri.
 * 2. Tidak ada rel="prev"/rel="next", jadi tidak ada yang memberi tahu
 *    perayap bahwa halaman-halaman ini satu rangkaian.
 *
 * Sitemap TIDAK diubah: ia memuat setiap artikel satu per satu (lihat
 * app/sitemap.ts), bukan halaman daftarnya — jadi penemuan artikel tidak
 * pernah bergantung pada pagination ini. */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams
  const pageNum = Number(params.page)
  const page = Number.isInteger(pageNum) && pageNum > 1 ? pageNum : 1
  const category = VALID_CATEGORIES.includes(params.category as ArticleCategory)
    ? (params.category as ArticleCategory)
    : undefined

  const qs = new URLSearchParams()
  if (category) qs.set('category', category)
  if (page > 1) qs.set('page', String(page))
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  const self = `${SITE_URL}/artikel${suffix}`

  return {
    ...BASE_METADATA,
    title: page > 1 ? `Artikel & Berita — Halaman ${page}` : BASE_METADATA.title,
    alternates: { canonical: self },
    openGraph: { ...BASE_METADATA.openGraph, url: self },
  }
}

const SITE_URL = 'https://rekaciptaindonesia.com'

const BASE_METADATA: Metadata = {
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

  function absHref(page: number) {
    const qs = new URLSearchParams()
    if (validCategory) qs.set('category', validCategory)
    if (page > 1) qs.set('page', String(page))
    const q = qs.toString()
    return `${SITE_URL}/artikel${q ? `?${q}` : ''}`
  }

  return (
    <main>
      {/* rel=prev/next. React 19 mengangkat <link> ini ke <head>.
          Jujur soal bobotnya: Google menyatakan sejak 2019 tidak lagi
          memakai rel=prev/next sebagai sinyal indeks — Bing masih. Yang
          benar-benar menentukan adalah kanonik per-halaman di
          generateMetadata di atas; ini pelengkap murah, bukan perbaikan
          utamanya. */}
      {validPage > 1 && <link rel="prev" href={absHref(validPage - 1)} />}
      {validPage < totalPages && <link rel="next" href={absHref(validPage + 1)} />}

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
