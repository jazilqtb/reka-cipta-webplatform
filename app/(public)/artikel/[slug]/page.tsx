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

import { ARTICLE_CATEGORY_LABEL } from '@/constants/articleCategories'
import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import Image from 'next/image'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { CalendarBlankIcon } from '@phosphor-icons/react/ssr'
import { getArticleBySlug, getCurrentSlugForOldSlug } from '@/lib/data/articles'
import { sanitizeArticleContent } from '@/lib/article-content'
import { createPublic } from '@/lib/supabase/public'
import { PageHero } from '@/components/sections/PageHero'
import { ArticleViewTracker } from '@/components/article/ArticleViewTracker'
import { RelatedArticles } from '@/components/article/RelatedArticles'
import type { Article } from '@/types/api'
import { getArticleExcerpt } from '@/lib/article-excerpt'

/** Basis URL absolut. Sebelumnya ditulis literal di generateMetadata dan
 *  sekarang dibutuhkan juga oleh dua blok JSON-LD; satu konstanta supaya
 *  ketiganya tidak bisa berselisih. */
const SITE_URL = 'https://rekaciptaindonesia.com'

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
    return { title: 'Artikel tidak ditemukan' }
  }

  /* Cadangan dari isi artikel sendiri kalau meta_description kosong.
   * Setelah mapper menormalkan '' menjadi null (lihat lib/article-mapper.ts),
   * artikel yang kolomnya kosong jadi TIDAK punya <meta name="description">
   * sama sekali — jujur, tapi berarti Google menyusun cuplikannya sendiri
   * dari potongan halaman mana pun. getArticleExcerpt memakai kalimat
   * pembuka artikel itu sendiri, jadi tidak ada klaim baru yang dikarang.
   * Fungsi ini sengaja hidup di modul terpisah tanpa sentuhan DOM — jangan
   * ganti dengan sesuatu dari lib/article-content.ts (jsdom). */
  const description = article.meta_description ?? getArticleExcerpt(article)

  // CHECKPOINT 3 (2026-08-15) — field SEO per-artikel dgn FALLBACK.
  // Kolomnya nullable (migrasi 20260815091000), jadi tiap nilai punya
  // jalur cadangan. Konsekuensinya: 6 artikel lama tetap punya metadata
  // yang benar tanpa perlu backfill apa pun.
  const seoTitle = article.meta_title ?? article.title
  const canonical =
    article.canonical_url ?? `${SITE_URL}/artikel/${article.slug}`
  // og:image ideal 1200x630; thumbnail kartu 16:9 — beda rasio, jadi
  // og_image_url dipisah. Kalau belum diisi, thumbnail tetap jauh lebih
  // baik daripada tidak ada gambar sama sekali di social card.
  const ogImage = article.og_image_url ?? article.thumbnail_url

  return {
    title: seoTitle,
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

  // CP3 — sebelum menyerah 404, cek apakah slug ini pernah dipakai artikel
  // yang slug-nya sudah diganti. Kalau ya, alihkan permanen supaya tautan
  // lama dan peringkat pencariannya ikut pindah, bukan mati.
  //
  // permanentRedirect() menghasilkan 308, bukan 301. Untuk request GET
  // keduanya sama-sama "permanen" dan diperlakukan setara oleh mesin
  // pencari; bedanya 308 melarang metode request berubah, yang justru
  // lebih ketat dan tidak relevan di sini.
  if (!article) {
    const currentSlug = await getCurrentSlugForOldSlug(slug)
    if (currentSlug && currentSlug !== slug) {
      permanentRedirect(`/artikel/${currentSlug}`)
    }
    notFound()
  }

  const sanitizedContent = sanitizeArticleContent(article.content)
  const dateLabel = article.published_at
    ? format(new Date(article.published_at), 'd MMMM yyyy', { locale: idLocale })
    : null

  const canonical = article.canonical_url ?? `${SITE_URL}/artikel/${article.slug}`

  /* JSON-LD Article — dilengkapi di CP5.
   *
   * Versi sebelumnya sah secara sintaks tapi TIDAK MEMENUHI SYARAT rich
   * result Article Google, karena tiga hal:
   *   1. `publisher` tanpa `logo`. Google mensyaratkan publisher.logo
   *      berupa ImageObject; tanpa itu artikel tidak pernah dipertimbangkan.
   *   2. Tidak ada `dateModified`. Sinyal kesegaran untuk artikel yang
   *      diperbarui — kolomnya sudah ada di DB sejak awal, hanya tidak
   *      pernah diteruskan ke kontrak publik (lihat types/api.ts).
   *   3. Tidak ada `mainEntityOfPage`, jadi data terstruktur tidak pernah
   *      terikat ke URL kanonik halamannya.
   * `headline` dipotong 110 karakter: Google mengabaikan Article yang
   * headline-nya lebih panjang dari itu, dan judul artikel terpanjang di
   * situs ini sudah 103 karakter — jaraknya tipis. */
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title.slice(0, 110),
    image: article.og_image_url ?? article.thumbnail_url ?? undefined,
    datePublished: article.published_at ?? undefined,
    dateModified: article.updated_at ?? article.published_at ?? undefined,
    description: article.meta_description ?? undefined,
    inLanguage: 'id-ID',
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    author: { '@type': 'Organization', name: 'CV Reka Cipta Indonesia' },
    publisher: {
      '@type': 'Organization',
      name: 'CV Reka Cipta Indonesia',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo/logo-light.png`,
        width: 2816,
        height: 1536,
      },
    },
  }

  /* BreadcrumbList — halaman ini SUDAH menampilkan breadcrumb ke pembaca
   * (Beranda > Artikel > judul) tapi tidak pernah memberi tahu mesin
   * pencari. Menambahkannya membuat SERP menampilkan jalur, bukan URL
   * mentah, dan itu meningkatkan klik untuk hasil non-peringkat-satu. */
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Beranda', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Artikel', item: `${SITE_URL}/artikel` },
      { '@type': 'ListItem', position: 3, name: article.title, item: canonical },
    ],
  }

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ArticleViewTracker slug={article.slug} />

      <PageHero
        eyebrow={ARTICLE_CATEGORY_LABEL[article.category]}
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
