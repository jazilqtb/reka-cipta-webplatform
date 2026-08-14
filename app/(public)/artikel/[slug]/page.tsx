// app/(public)/artikel/[slug]/page.tsx
// Epic 6 Slice 1 (E6-S1-FE-08) — detail artikel, SEO + JSON-LD.
//
// dynamicParams TIDAK di-set false (default true, AR-02) — beda sengaja
// dari pola /produk/[slug]: artikel akan terus bertambah pasca-launch via
// Admin Panel epic mendatang tanpa redeploy, jadi slug baru harus tetap
// accessible via on-demand ISR fallback.
//
// RONDE Tahap 11 (2026-08) — Design System Rollout (T3):
// - Breadcrumb dipindah ke DALAM Hero gelap (pola semua halaman lain),
//   <ArticleBreadcrumb> terpisah dihapus pemakaiannya dari sini.
// - Judul + meta pindah ke Hero; badan artikel jadi kolom baca bersih.
// - Foto thumbnail jadi panel rounded-2xl di dalam kolom baca, BUKAN
//   strip 21:9 full-bleed yang memotong komposisi foto.
// - .prose-brand sekarang BENAR-BENAR ada (baru didefinisikan di
//   globals.css ronde ini — sebelumnya no-op total, lihat catatan di
//   sana), jadi isi artikel akhirnya punya tipografi baca yang layak.
// - COPYWRITING: label "Edukasi Garam" (hardcode di file ini) →
//   "Wawasan Industri", disamakan dgn ArticleCard & CategoryTabs.
// Data fetching, sanitizer, view tracker, JSON-LD TIDAK disentuh.

import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { CalendarBlankIcon } from '@phosphor-icons/react/ssr'
import { getArticleBySlug } from '@/lib/data/articles'
import { sanitizeArticleContent } from '@/lib/article-content'
import { createPublic } from '@/lib/supabase/public'
import { PageHero } from '@/components/sections/PageHero'
import { ArticleViewTracker } from '@/components/article/ArticleViewTracker'
import { RelatedArticles } from '@/components/article/RelatedArticles'
import type { Article } from '@/types/api'

export const revalidate = 3600

const CATEGORY_LABEL: Record<Article['category'], string> = {
  education: 'Wawasan Industri',
  company_news: 'Berita Perusahaan',
}

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

  // CHECKPOINT 3 (2026-08-15) — field SEO per-artikel dgn FALLBACK.
  // Kolomnya nullable (migrasi 20260815091000), jadi tiap nilai punya
  // jalur cadangan. Konsekuensinya: 6 artikel lama tetap punya metadata
  // yang benar tanpa perlu backfill apa pun.
  const seoTitle = article.meta_title ?? article.title
  const canonical =
    article.canonical_url ?? `https://rekaciptaindonesia.com/artikel/${article.slug}`
  // og:image ideal 1200x630; thumbnail kartu 16:9 — beda rasio, jadi
  // og_image_url dipisah. Kalau belum diisi, thumbnail tetap jauh lebih
  // baik daripada tidak ada gambar sama sekali di social card.
  const ogImage = article.og_image_url ?? article.thumbnail_url

  return {
    title: `${seoTitle} | CV Reka Cipta Indonesia`,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: seoTitle,
      description,
      type: 'article',
      url: canonical,
      publishedTime: article.published_at ?? undefined,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: seoTitle,
      description,
      images: ogImage ? [ogImage] : undefined,
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

      <PageHero
        eyebrow={CATEGORY_LABEL[article.category]}
        title={article.title}
        breadcrumbLabel={article.title}
        breadcrumbParent={{ label: 'Artikel', href: '/artikel' }}
        credentials={
          dateLabel
            ? [
                {
                  icon: (
                    <CalendarBlankIcon
                      size={16}
                      weight="duotone"
                      className="text-brand-teal-300"
                      aria-hidden="true"
                    />
                  ),
                  label: `Dipublikasikan ${dateLabel}`,
                },
              ]
            : undefined
        }
      />

      <article className="bg-white px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          {article.thumbnail_url && (
            <div className="relative mb-10 aspect-video w-full overflow-hidden rounded-2xl border border-ink-900/10 bg-gradient-to-br from-brand-teal-50 to-brand-teal-100">
              <Image
                src={article.thumbnail_url}
                alt={article.title}
                fill
                priority
                sizes="(max-width: 768px) 92vw, 768px"
                className="object-cover"
              />
            </div>
          )}

          {/* .prose-brand: max-w 68ch, leading 1.75, heading font-ui —
              lihat definisi & alasannya di globals.css Tahap 11 */}
          <div
            className="prose-brand mx-auto"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </div>
      </article>

      <RelatedArticles category={article.category} excludeSlug={article.slug} />
    </main>
  )
}
