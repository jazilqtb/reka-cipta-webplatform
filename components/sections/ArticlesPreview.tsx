// components/sections/ArticlesPreview.tsx
// Epic 6 Slice 3 (E6-S3-FE-01) — section homepage "Wawasan & Kabar
// Terbaru".
//
// RONDE 6 (2026-08) — evaluasi & eksekusi 2 keluhan klien:
// (a) "Tab filter tidak relevan" — DISETUJUI. Toggle Terbaru/Terbanyak
//     Dilihat (ArticlesPreviewTabs.tsx, kini dihapus) dievaluasi: ini
//     preview homepage, bukan halaman /artikel penuh — pengunjung baru
//     tidak datang dengan preferensi sorting, dan 2 tab utk 3 kartu
//     adalah overhead keputusan yang tidak perlu di titik ini. Preview
//     kini tampilkan `articles` (3 artikel terbaru) langsung, tanpa
//     toggle. Konsekuensi: page.tsx tidak lagi memanggil
//     getMostViewedArticles() untuk homepage (fetch yang datanya tidak
//     dipakai dihapus — bukan "menyentuh data layer", murni page.tsx
//     memilih fetch mana yang dipanggil).
// (b) "Mobile: daftar vertikal memakan tempat" — DISETUJUI. Grid
//     vertikal 1-kolom diganti horizontal scroll/swipe (pola sama dgn
//     ProductsPreview sebelum Ronde 6 — di sini kebalikannya cocok
//     karena ArticleCard punya thumbnail 16:9 yang lebih enak di-scan
//     berjajar horizontal daripada digrid 2-kolom sempit).
//
// AR-03: return null total kalau 0 artikel published — homepage tidak
// boleh terasa "kosong/rusak" untuk section yang murni tambahan.

import Link from 'next/link'
import { ArrowRightIcon } from '@phosphor-icons/react/ssr'
import { ArticleCard } from '@/components/blocks/ArticleCard'
import { RevealWrapper } from '@/components/animations/RevealWrapper'
import type { Article } from '@/types/api'

interface Props {
  articles: Article[]
}

export function ArticlesPreview({ articles }: Props) {
  if (articles.length === 0) {
    return null
  }

  // RONDE Tahap 8: .bg-salt-grain (kisi garis tipis) dicabut — klien
  // tidak suka motif garis apa pun di Beranda. bg-salt-50 solid saja.
  return (
    <section className="bg-salt-50 py-14 md:py-20" aria-label="Artikel dan berita terbaru">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="rule-index font-ui justify-center text-brand-teal-600">
            Publikasi
          </p>
          <h2 className="mt-3 text-balance font-ui text-2xl md:text-3xl font-semibold leading-tight text-ink-700">
            Wawasan &amp; Kabar <span className="font-medium text-brand-teal-600">Terbaru</span>
          </h2>
          {/* RONDE Tahap 8: "bukan sekadar mengisi halaman" — frasa
              reaktif/defensif, pola yg sama dgn keluhan copywriting
              /produk sebelumnya. Diganti pernyataan positif langsung. */}
          <p className="mt-3 text-pretty text-base text-neutral-600">
            Catatan teknis dan standar mutu dari praktik lapangan.
          </p>
        </div>

        {/* Desktop: grid 3-kolom statis */}
        <div className="mt-8 hidden gap-6 md:mt-12 md:grid md:grid-cols-3">
          {articles.map((article, i) => (
            <RevealWrapper key={article.id} variant="reveal-up" delay={i * 80}>
              <ArticleCard article={article} />
            </RevealWrapper>
          ))}
        </div>

        {/* Mobile (RONDE 6): horizontal scroll/swipe, bukan stack
            vertikal yang memakan tinggi halaman. */}
        <div
          className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 md:hidden"
          style={{ scrollbarWidth: 'none' }}
          aria-label="Geser untuk lihat artikel lain"
        >
          {articles.map((article) => (
            <div key={article.id} className="w-[82vw] shrink-0 snap-start">
              <ArticleCard article={article} />
            </div>
          ))}
          <div className="w-2 shrink-0" aria-hidden="true" />
        </div>

        <div className="mt-8 text-center md:mt-10">
          <Link
            href="/artikel"
            className="link-arrow font-ui text-sm font-semibold text-brand-teal-600 hover:text-brand-teal-700"
          >
            Lihat Semua Artikel
            <ArrowRightIcon weight="bold" className="arrow-icon h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
