// components/blocks/ArticleCard.tsx
// Epic 6 Slice 1 (E6-S1-FE-02) — kartu artikel generic, dipakai di /artikel
// (grid), RelatedArticles (detail page), dan Slice 3 (homepage section).
// Seluruh kartu adalah <Link> klikable, pola sama ProductCard.

import Link from 'next/link'
import Image from 'next/image'
import { BookOpen } from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { getArticleExcerpt } from '@/lib/article-content'
import { cn } from '@/lib/utils'
import type { Article } from '@/types/api'

const CATEGORY_LABEL: Record<Article['category'], string> = {
  education: 'Edukasi Garam',
  company_news: 'Berita Perusahaan',
}

const CATEGORY_BADGE_CLASS: Record<Article['category'], string> = {
  education: 'bg-brand-teal-50 text-brand-teal-700',
  company_news: 'bg-sand-100 text-sand-700',
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
      className={cn(
        'card-hover-lift group block overflow-hidden rounded-lg border border-neutral-200 bg-white',
        className
      )}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-neutral-100">
        {article.thumbnail_url ? (
          <Image
            src={article.thumbnail_url}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 90vw, (max-width: 1024px) 45vw, 30vw"
            className="object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-teal-50 to-brand-teal-100">
            <BookOpen className="h-10 w-10 text-brand-teal-400" strokeWidth={1.5} aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="space-y-2 p-4">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
            CATEGORY_BADGE_CLASS[article.category]
          )}
        >
          {CATEGORY_LABEL[article.category]}
        </span>
        <h3 className="line-clamp-2 text-lg font-semibold text-neutral-900">{article.title}</h3>
        {dateLabel && <p className="text-xs text-neutral-500">{dateLabel}</p>}
        <p className="line-clamp-2 text-sm text-neutral-600">{excerpt}</p>
      </div>
    </Link>
  )
}
