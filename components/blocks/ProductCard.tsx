// components/blocks/ProductCard.tsx
// Epic 2 Slice 1 (E2-S1-FE-04) — Kartu produk reusable.
//
// Server Component. Foto via next/image dgn fallback gradient+icon
// jika file belum ada (Fase 0: foto produk pending dari klien).
// Hover: class .card-hover-lift dari globals.css (Design System §11.2).
//
// Badge SNI: <span> custom, bukan shadcn <Badge> — menghindari
// install komponen baru hanya utk 1 pemakaian. Jika Slice 2/3
// butuh Badge, install sekalian lalu refactor.

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
        'card-hover-lift group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white',
        className
      )}
    >
      {/* Foto — aspect 4:3, fallback gradient+icon jika imagePath kosong/error */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-brand-teal-50 to-brand-teal-100">
        {imagePath ? (
          <Image
            src={imagePath}
            alt={`Foto produk ${name}`}
            fill
            sizes="(max-width: 768px) 75vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          // Fallback ikon — saat foto belum tersedia dari klien
          <div className="flex h-full w-full items-center justify-center">
            <Package2
              className="h-12 w-12 text-brand-teal-600/40"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </div>
        )}

        {/* Badge SNI — overlay di pojok kanan atas */}
        {is_sni && (
          <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-brand-teal-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            SNI
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-balance text-base font-semibold leading-tight text-ink-700">
          {name}
        </h3>
        <p className="mono-tech text-xs text-neutral-500">{spec}</p>

        {/* CTA "Lihat Detail →" — opacity transition on hover */}
        <span className="mt-auto pt-2 text-sm font-medium text-neutral-500 opacity-70 transition-all duration-200 group-hover:text-brand-teal-600 group-hover:opacity-100">
          Lihat Detail →
        </span>
      </div>
    </Link>
  )
}
