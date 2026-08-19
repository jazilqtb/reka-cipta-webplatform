// components/blocks/ArticleCard.tsx
// Epic 6 Slice 1 (E6-S1-FE-02) — kartu artikel generic, dipakai di /artikel
// (grid), RelatedArticles (detail page), dan Slice 3 (homepage section).
// Seluruh kartu adalah <Link> klikable, pola sama ProductCard.
//
// RONDE Tahap 11 (2026-08) — Design System Rollout (T2):
// - rounded-lg + border-neutral-200 → .panel-card rounded-2xl (bahasa
//   kartu tunggal di seluruh situs; hover = lift + soft shadow, TANPA
//   border menyala — aturan Ronde 7).
// - Ikon Lucide BookOpen → Phosphor duotone.
// - Badge kategori → .tag-pill (bahasa badge teks kecil situs).
// - COPYWRITING: "Edukasi Garam" → "Wawasan Industri". Klien menilai
//   frasa lama kurang profesional & terlalu menyatakan intensi
//   "mengedukasi" pembaca. Label ini dipakai di DUA tempat (badge di
//   sini + tab di CategoryTabs.tsx) — keduanya diubah bersamaan supaya
//   tidak ada label yang saling bertentangan. Konsekuensi yang
//   DISENGAJA: badge di section Artikel Beranda ikut berubah, karena
//   memang komponen yang sama.

import Link from 'next/link'
import Image from 'next/image'
import { BookOpenIcon } from '@phosphor-icons/react/ssr'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { getArticleExcerpt } from '@/lib/article-excerpt'
import { cn } from '@/lib/utils'
import type { Article } from '@/types/api'

const CATEGORY_LABEL: Record<Article['category'], string> = {
  education: 'Wawasan Industri',
  company_news: 'Berita Perusahaan',
}

const CATEGORY_BADGE_CLASS: Record<Article['category'], string> = {
  education: 'border-brand-teal-600/20 bg-brand-teal-50 text-brand-teal-700',
  company_news: 'border-sand-600/20 bg-sand-100 text-sand-700',
}

interface ArticleCardProps {
  article: Article
  className?: string
}

export function ArticleCard({ article, className }: ArticleCardProps) {
  const excerpt = getArticleExcerpt(article)
  const dateLabel = article.published_at
    ? format(new Date(article.published_at), 'd MMMM yyyy', { locale: idLocale })
    : null

  return (
    <Link
      href={`/artikel/${article.slug}`}
      aria-label={`Baca artikel ${article.title}`}
      className={cn('panel-card group block h-full overflow-hidden rounded-2xl', className)}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-brand-teal-50 to-brand-teal-100">
        {article.thumbnail_url ? (
          <Image
            src={article.thumbnail_url}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 90vw, (max-width: 1024px) 45vw, 30vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BookOpenIcon size={40} weight="duotone" className="text-brand-teal-600/40" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 p-4 sm:p-5">
        <span
          className={cn(
            'font-ui inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
            CATEGORY_BADGE_CLASS[article.category]
          )}
        >
          {CATEGORY_LABEL[article.category]}
        </span>
        <h3 className="font-ui line-clamp-2 text-balance text-base font-bold leading-snug text-ink-700 transition-colors group-hover:text-brand-teal-700 md:text-lg">
          {article.title}
        </h3>
        {dateLabel && <p className="mono-tech text-xs text-neutral-500">{dateLabel}</p>}
        <p className="line-clamp-2 text-pretty text-sm leading-relaxed text-neutral-600">{excerpt}</p>
      </div>
    </Link>
  )
}
