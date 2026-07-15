// components/article/RelatedArticles.tsx
// Epic 6 Slice 1 (E6-S1-FE-06) — 3 artikel kategori sama di halaman detail.

import { ArticleCard } from '@/components/blocks/ArticleCard'
import { getRelatedArticles } from '@/lib/data/articles'
import type { ArticleCategory } from '@/types/api'

interface Props {
  category: ArticleCategory
  excludeSlug: string
}

export async function RelatedArticles({ category, excludeSlug }: Props) {
  const related = await getRelatedArticles(category, excludeSlug, 3)

  if (related.length === 0) return null

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <h2 className="mb-6 text-2xl font-bold text-ink-700">Artikel Terkait</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {related.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  )
}
