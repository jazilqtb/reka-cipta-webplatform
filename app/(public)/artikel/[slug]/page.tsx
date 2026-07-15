// app/(public)/artikel/[slug]/page.tsx
// Epic 6 Slice 1 (E6-S1-FE-08) — detail artikel, SEO + JSON-LD.
//
// dynamicParams TIDAK di-set false (default true, AR-02) — beda sengaja
// dari pola /produk/[slug]: artikel akan terus bertambah pasca-launch via
// Admin Panel epic mendatang tanpa redeploy, jadi slug baru harus tetap
// accessible via on-demand ISR fallback.

import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { getArticleBySlug } from '@/lib/data/articles'
import { sanitizeArticleContent } from '@/lib/article-content'
import { createPublic } from '@/lib/supabase/public'
import { ArticleBreadcrumb } from '@/components/article/ArticleBreadcrumb'
import { ArticleViewTracker } from '@/components/article/ArticleViewTracker'
import { RelatedArticles } from '@/components/article/RelatedArticles'
import type { Article } from '@/types/api'

export const revalidate = 3600

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const supabase = createPublic()
  const { data } = await supabase.from('articles').select('slug').eq('is_published', true)
  return (data ?? []).map((row) => ({ slug: row.slug as string }))
}

const getArticle = cache(async (slug: string): Promise<Article | null> => getArticleBySlug(slug))

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)

  if (!article) {
    return { title: 'Artikel tidak ditemukan | CV Reka Cipta Indonesia' }
  }

  const description = article.meta_description ?? undefined

  return {
    title: `${article.title} | CV Reka Cipta Indonesia`,
    description,
    alternates: {
      canonical: `https://rekaciptaindonesia.com/artikel/${article.slug}`,
    },
    openGraph: {
      title: article.title,
      description,
      type: 'article',
      url: `https://rekaciptaindonesia.com/artikel/${article.slug}`,
      images: article.thumbnail_url ? [{ url: article.thumbnail_url }] : undefined,
    },
  }
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = await getArticle(slug)

  if (!article) notFound()

  const sanitizedContent = sanitizeArticleContent(article.content)
  const dateLabel = article.published_at
    ? format(new Date(article.published_at), 'd MMMM yyyy', { locale: idLocale })
    : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    image: article.thumbnail_url ?? undefined,
    datePublished: article.published_at ?? undefined,
    description: article.meta_description ?? undefined,
    author: { '@type': 'Organization', name: 'CV Reka Cipta Indonesia' },
    publisher: { '@type': 'Organization', name: 'CV Reka Cipta Indonesia' },
  }

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticleViewTracker slug={article.slug} />
      <ArticleBreadcrumb articleTitle={article.title} />
      {article.thumbnail_url && (
        <div className="relative mt-4 aspect-[21/9] w-full bg-neutral-100">
          <Image src={article.thumbnail_url} alt={article.title} fill priority className="object-cover" />
        </div>
      )}
      <article className="mx-auto max-w-3xl px-4 py-12">
        <span className="inline-flex items-center rounded-full bg-brand-teal-50 px-2.5 py-0.5 text-xs font-semibold text-brand-teal-700">
          {article.category === 'education' ? 'Edukasi Garam' : 'Berita Perusahaan'}
        </span>
        <h1 className="mt-3 text-4xl font-bold text-ink-700">{article.title}</h1>
        {dateLabel && <p className="mt-2 text-sm text-neutral-500">{dateLabel}</p>}
        <div className="prose-brand mt-8" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
      </article>
      <RelatedArticles category={article.category} excludeSlug={article.slug} />
    </main>
  )
}
