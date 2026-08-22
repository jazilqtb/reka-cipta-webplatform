// components/product/ProductHero.tsx
// RONDE Tahap 6 (2026-08) — "samakan DNA desain /produk/[slug] dengan
// Beranda & /produk". Rewrite total dari section putih polos
// (container mx-auto grid md:grid-cols-12) ke Hero gelap yg konsisten
// dgn ProductCatalogHero.tsx: gradient VERTIKAL murni (bukan diagonal —
// pelajaran seam Tahap 5, lihat catatan panjang di ProductCatalogHero),
// sini (ProductBreadcrumb.tsx terpisah DIHAPUS — dulu section putih
// sendiri di atas Hero, sekarang breadcrumb duduk natural di dalam Hero
// gelap yg sama, pola identik dgn ProductCatalogHero.tsx).
//
// Jadi Client Component — panel foto pakai .(mouse-
// tracking, DNA yg sama dgn ProductCard katalog & Beranda), sisanya
// tetap presentasi statis.
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { CaretRightIcon, PackageIcon, SealCheckIcon } from '@phosphor-icons/react/ssr'
import { SectionDivider } from '@/components/decorative/SectionDivider'
import type { Product, ProductCategory } from '@/types/api'

interface ProductHeroProps {
  product: Product
}

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  halus: 'Garam Halus',
  kasar: 'Garam Kasar',
  industri: 'Garam Industri',
}

export function ProductHero({ product }: ProductHeroProps) {
  const paragraphs = product.description?.split('\n\n') ?? []


  return (
    <>
    <section className="relative overflow-hidden surface-depth edge-marine-bottom px-4 pb-14 pt-8 md:pb-20 md:pt-10">

      <div className="relative mx-auto max-w-6xl">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 font-ui text-sm text-brand-teal-300/70">
          <Link href="/" className="link-animated transition-colors hover:text-brand-teal-200">Beranda</Link>
          <CaretRightIcon size={16} weight="bold" aria-hidden="true" />
          <Link href="/produk" className="link-animated transition-colors hover:text-brand-teal-200">Produk</Link>
          <CaretRightIcon size={16} weight="bold" aria-hidden="true" />
          <span aria-current="page" className="text-white/90">{product.name}</span>
        </nav>

        <div className="grid gap-8 md:grid-cols-12 md:gap-10">
          {/* Panel foto — spotlight mouse-tracking, sama DNA dgn kartu
              produk (Beranda & katalog). Frame gelap translusen, bukan
              putih (photo panel di atas Hero gelap). */}
          <div className="md:col-span-5">
            <div
              className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm"
            >
              {product.photo_url ? (
                <Image
                  src={product.photo_url}
                  alt={product.name}
                  fill
                  priority
                  className="relative z-0 object-cover transition-transform duration-500 hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 40vw"
                />
              ) : (
                <div className="relative z-0 flex h-full w-full items-center justify-center">
                  <PackageIcon size={40} weight="duotone" className="text-brand-teal-400/40" aria-hidden="true" />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 md:col-span-7">
            <p className="rule-index font-ui text-brand-teal-300">{CATEGORY_LABELS[product.category]}</p>

            <h1 className="text-balance font-ui text-2xl md:text-3xl font-semibold leading-[1.1] tracking-tight text-white">
              {product.name}
            </h1>
            <p className="mono-tech text-sm text-white/50">{product.code}</p>

            {paragraphs.length > 0 && (
              <div className="space-y-3">
                {paragraphs.map((paragraph, i) => (
                  <p key={i} className="text-pretty text-base leading-relaxed text-white/70">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-5">
              <div className="flex items-center gap-1.5">
                <SealCheckIcon size={16} weight="fill" className={product.is_sni ? 'text-brand-teal-300' : 'text-white/25'} aria-hidden="true" />
                <span className="font-ui text-xs font-medium text-white/50">
                  {product.is_sni ? 'Bersertifikat SNI' : 'Non-SNI'}
                </span>
              </div>
              {product.lab_doc_url && (
                <div className="flex items-center gap-1.5">
                  <span className="font-ui text-xs font-medium text-white/50">Hasil uji laboratorium tersedia untuk diunduh</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
    <SectionDivider variant="curve" fromClassName="fill-ink-900" toClassName="bg-white" flip />
    </>
  )
}
