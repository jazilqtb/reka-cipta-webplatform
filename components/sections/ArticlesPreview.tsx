// components/sections/ArticlesPreview.tsx
// Epic 6 Slice 3 (E6-S3-FE-01) — section homepage "Wawasan & Kabar
// Terbaru", disisipkan tepat di bawah <StatsBar> (lihat app/(public)/page.tsx).
//
// AR-03: return null total kalau 0 artikel published (bukan empty state
// eksplisit seperti /artikel) — homepage tidak boleh terasa "kosong/rusak"
// untuk section yang murni tambahan.
//
// CTA "Lihat Semua Artikel": Design System §11.3 mendefinisikan class
// `.link-arrow`/`.arrow-icon`, tapi class ini TIDAK ada di globals.css
// (frozen file, gap yang sama dengan `.card-hover-lift` — lihat Catatan
// Penutup epic6_task_breakdown_slice1_artikel-berita.md). Dipakai `group` +
// `group-hover:translate-x-*` Tailwind langsung supaya arrow slide
// benar-benar berfungsi.

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ArticlesPreviewTabs } from './ArticlesPreviewTabs'
import type { Article } from '@/types/api'

interface Props {
  latestArticles: Article[]
  mostViewedArticles: Article[]
}

export function ArticlesPreview({ latestArticles, mostViewedArticles }: Props) {
  if (latestArticles.length === 0 && mostViewedArticles.length === 0) {
    return null
  }

  return (
    <section className="bg-white py-16 md:py-24" aria-label="Artikel dan berita terbaru">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-2xs font-semibold uppercase tracking-wide text-brand-teal-600">
            Artikel &amp; Berita
          </p>
          <h2 className="mt-2 text-3xl font-bold text-ink-700">Wawasan &amp; Kabar Terbaru</h2>
          <p className="mt-3 text-base text-neutral-600">
            Edukasi seputar garam industri dan kabar terbaru dari CV Reka Cipta Indonesia.
          </p>
        </div>

        <div className="mt-10">
          <ArticlesPreviewTabs latestArticles={latestArticles} mostViewedArticles={mostViewedArticles} />
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/artikel"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand-teal-600 hover:text-brand-teal-700"
          >
            Lihat Semua Artikel
            <ArrowRight
              className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </section>
  )
}
