// components/product/ProductCard.tsx
// RONDE Tahap 4 (2026-08) — kartu katalog /produk, dirombak total supaya
// DNA-nya identik dgn kartu produk Beranda (components/blocks/ProductCard.tsx):
// .panel-card + .(mouse-tracking, poin UMUM), badge SNI
// solid-fill (.tag-pill-dark, kontras terjamin), TANPA border-hover
// (dihapus permanen dari .panel-card sejak Ronde 7 — "merusak estetika"),
// tipografi proporsional (bukan "tempelan").
//
// SENGAJA komponen terpisah dari blocks/ProductCard.tsx (dipakai preview
// 5-produk di Beranda) — kartu katalog ini butuh field lebih kaya (kode
// produk, tagline, kategori dari CategoryFilterTabs) yang tidak relevan
// utk preview homepage yg serba ringkas. Bahasa visual SAMA, data yg
// ditampilkan beda sesuai konteks halaman.
'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PackageIcon, ArrowRightIcon } from '@phosphor-icons/react/ssr'
import type { Product } from '@/types/api'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const ref = useRef<HTMLAnchorElement>(null)


  return (
    <Link
      ref={ref}
      href={`/produk/${product.slug}`}
      aria-label={`Lihat detail produk ${product.name}`}
      className="panel-card group flex h-full flex-col overflow-hidden rounded-2xl"
    >
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-brand-teal-50 to-brand-teal-100 sm:aspect-[4/3]">
        {product.photo_url ? (
          <Image
            src={product.photo_url}
            alt={`Foto produk ${product.name}`}
            fill
            sizes="(max-width: 640px) 46vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <PackageIcon size={40} weight="duotone" className="text-brand-teal-600/40" aria-hidden="true" />
          </div>
        )}

        {product.is_sni && (
          <span className="tag-pill-dark absolute right-3 top-3 z-10">SNI</span>
        )}
      </div>

      {/* Body — RONDE Tahap 4: sama disiplin tipografi dgn kartu Beranda
          (Ronde 7): ukuran responsif, gap longgar, warna (bukan cuma
          ukuran) yg membedakan hierarki nama↔kode↔tagline. Tagline &
          link "Lihat Spesifikasi" disembunyikan di mobile (poin 4:
          "sembunyikan deskripsi panjang, foto+nama saja") — kartu tetap
          full di sm+ ke atas. */}
      <div className="relative z-10 flex flex-1 flex-col gap-1.5 p-3 sm:p-5">
        <h3 className="font-ui text-balance text-sm font-bold leading-snug text-ink-700 transition-colors group-hover:text-brand-teal-700 sm:text-base md:text-lg">
          {product.name}
        </h3>
        <p className="mono-tech text-xs text-neutral-500">{product.code}</p>

        {product.tagline && (
          <p className="hidden text-pretty text-sm leading-relaxed text-neutral-600 sm:line-clamp-2 sm:block">
            {product.tagline}
          </p>
        )}

        <span className="link-arrow font-ui mt-auto hidden items-center gap-1.5 pt-2 text-sm font-semibold text-brand-teal-600 group-hover:text-brand-teal-700 sm:inline-flex">
          Lihat Spesifikasi
          <ArrowRightIcon weight="bold" className="arrow-icon h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}
