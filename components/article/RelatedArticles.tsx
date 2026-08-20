// components/article/RelatedArticles.tsx
// Epic 6 Slice 1 (E6-S1-FE-06) — 3 artikel kategori sama di halaman detail.
//
// RONDE Tahap 11 (2026-08) — Design System Rollout (T3): heading pakai
// pola eyebrow + aksen italic, latar bg-salt-50 (dibedakan dari kolom
// baca bg-white di atasnya), stagger reveal, + SectionDivider penutup ke
// Footer. Query data (getRelatedArticles) TIDAK disentuh.

import { ArticleCard } from '@/components/blocks/ArticleCard'
import { RevealWrapper } from '@/components/animations/RevealWrapper'
import { SectionDivider } from '@/components/decorative/SectionDivider'
import { getRelatedArticles } from '@/lib/data/articles'
import type { ArticleCategory } from '@/types/api'

interface Props {
  category: ArticleCategory
  excludeSlug: string
}

export async function RelatedArticles({ category, excludeSlug }: Props) {
  const related = await getRelatedArticles(category, excludeSlug, 3)

  // Tidak ada artikel terkait → tetap render divider supaya transisi
  // kolom baca (bg-white) ke Footer (ink-900) tidak jadi garis lurus.
  if (related.length === 0) {
    return <SectionDivider variant="wave" fromClassName="fill-white" toClassName="bg-ink-900" />
  }

  return (
    <>
      <section className="bg-salt-50 px-4 py-14 md:py-20">
        <div className="mx-auto max-w-6xl">
          <RevealWrapper>
            <p className="rule-index font-ui text-brand-teal-600">Bacaan Lain</p>
            <h2 className="mt-3 font-ui text-2xl font-semibold text-ink-700 md:text-3xl">
              Artikel <span className="font-medium text-brand-teal-600">Terkait</span>
            </h2>
          </RevealWrapper>

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {related.map((article, i) => (
              <RevealWrapper key={article.id} variant="reveal-up" delay={i * 70}>
                <ArticleCard article={article} className="h-full" />
              </RevealWrapper>
            ))}
          </div>
        </div>
      </section>
      <SectionDivider variant="wave" fromClassName="fill-salt-50" toClassName="bg-ink-900" />
    </>
  )
}
