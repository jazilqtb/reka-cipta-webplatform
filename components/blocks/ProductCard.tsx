// components/blocks/ProductCard.tsx
// Epic 2 Slice 1 (E2-S1-FE-04) — REVISI Bagian 2:
// Hapus "Lihat Detail →" — kartu tetap klikable (full <Link>).
// Foto pakai aspect-square (konsisten lintas baris grid 2+3).
//
// Hover: .card-hover-lift (translateY(-4px) + shadow). Affordance
// klik diberikan oleh hover state, tidak perlu teks "Lihat Detail".

import Image from 'next/image'
import Link from 'next/link'
import { Package2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ProductCardData {
  slug: string
  name: string
  spec: string         // contoh: "NaCl ≥97.0% • Beryodium"
  imagePath?: string   // /images/products/{slug}.jpg
  is_sni: boolean
}

interface ProductCardProps extends ProductCardData {
  className?: string
}

export function ProductCard({
  slug,
  name,
  spec,
  imagePath,
  is_sni,
  className,
}: ProductCardProps) {
  return (
    <Link
      href={`/produk/${slug}`}
      aria-label={`Lihat detail produk ${name}`}
      className={cn(
        'card-hover-lift group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white',
        className
      )}
    >
      {/* Foto — aspect-square untuk konsistensi tinggi lintas grid */}
      <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-brand-teal-50 to-brand-teal-100">
        {imagePath ? (
          <Image
            src={imagePath}
            alt={`Foto produk ${name}`}
            fill
            sizes="(max-width: 768px) 90vw, (max-width: 1024px) 50vw, 30vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package2
              className="h-16 w-16 text-brand-teal-600/40"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </div>
        )}

        {/* Badge SNI — overlay di pojok kanan atas */}
        {is_sni && (
          <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-brand-teal-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            SNI
          </span>
        )}
      </div>

      {/* Body — flex-1 agar mengisi sisa ruang */}
      <div className="flex flex-1 flex-col gap-1 p-5">
        <h3 className="text-balance text-base font-bold leading-tight text-ink-700 md:text-lg">
          {name}
        </h3>
        <p className="mono-tech text-xs text-neutral-700">
          {spec}
        </p>
      </div>
    </Link>
  )
}
