// components/blocks/ProductCard.tsx
// Epic 2 Slice 1 (E2-S1-FE-04) — REVISI Bagian 2, lalu RONDE 4 (2026-08):
// rounded-2xl konsisten (bukan notch — lihat aturan bentuk Ronde 4 di
// globals.css), badge SNI jadi .tag-pill-dark (pil bulat), ikon fallback
// Phosphor duotone, nama produk pakai font-ui.
//
// Hover: .card-hover-lift (translateY(-4px) + shadow). Affordance
// klik diberikan oleh hover state, tidak perlu teks "Lihat Detail".
//
// RONDE Tahap 3 (2026-08):
// - Jadi Client Component (sebelumnya Server) — dibutuhkan utk
//   mouse-tracking spotlight highlight (.spotlight-card, poin UMUM
//   "Mouse Tracking/Hover"). Komponen ini leaf kecil murni presentasi,
//   tidak ada fetch/logic server yang hilang dgn konversi ini.
// - Prop `compact` baru — dipakai KHUSUS di carousel horizontal mobile
//   ProductsPreview (poin 3 Katalog Produk: "sembunyikan deskripsi,
//   hanya foto + nama produk agar lebih compact"). Grid desktop/tablet
//   tetap pakai varian penuh (compact=false, default).

'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PackageIcon } from '@phosphor-icons/react/ssr'
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
  /** Sembunyikan spec & padat-kan body — dipakai di carousel mobile */
  compact?: boolean
}

export function ProductCard({
  slug,
  name,
  spec,
  imagePath,
  is_sni,
  className,
  compact = false,
}: ProductCardProps) {
  const ref = useRef<HTMLAnchorElement>(null)

  // Spotlight mouse-tracking — set posisi kursor relatif thd kartu ke
  // custom property CSS, dibaca .spotlight-card::before di globals.css.
  // Tidak pakai state React (akan re-render tiap gerakan mouse, mahal);
  // langsung tulis ke style DOM node, pola standar utk animasi 60fps.
  function handleMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const xPct = ((e.clientX - rect.left) / rect.width) * 100
    const yPct = ((e.clientY - rect.top) / rect.height) * 100
    el.style.setProperty('--spot-x', `${xPct}%`)
    el.style.setProperty('--spot-y', `${yPct}%`)
  }

  return (
    <Link
      ref={ref}
      href={`/produk/${slug}`}
      aria-label={`Lihat detail produk ${name}`}
      onMouseMove={handleMouseMove}
      className={cn(
        'panel-card spotlight-card group flex flex-col overflow-hidden rounded-2xl',
        className
      )}
    >
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
            <PackageIcon
              size={64}
              weight="duotone"
              className="text-brand-teal-600/40"
              aria-hidden="true"
            />
          </div>
        )}

        {/* Badge SNI — pil bulat, sekarang fill solid (lihat catatan
            kontras di globals.css .tag-pill-dark, Tahap 3). */}
        {is_sni && (
          <span className="tag-pill-dark absolute right-3 top-3 z-10">
            SNI
          </span>
        )}
      </div>

      {/* Body — RONDE 7: gap & padding dilonggarkan sedikit, line-height
          & tracking dinormalkan (sebelumnya leading-tight + tracking-tight
          terlalu rapat, terasa "tempelan"). Hierarki nama↔spec diperjelas
          lewat warna (neutral-500, bukan -700) bukan cuma ukuran.
          RONDE Tahap 3: compact=true (carousel mobile) → padding lebih
          rapat & spec disembunyikan, biar kartu ringkas discan cepat. */}
      <div className={cn('relative z-10 flex flex-1 flex-col gap-1.5', compact ? 'p-3' : 'p-4 sm:p-5')}>
        <h3 className={cn(
          'font-ui text-balance font-bold leading-snug text-ink-700',
          compact ? 'line-clamp-2 text-sm' : 'text-[15px] sm:text-base md:text-lg'
        )}>
          {name}
        </h3>
        {!compact && (
          <p className="mono-tech text-xs italic text-neutral-500">
            {spec}
          </p>
        )}
      </div>
    </Link>
  )
}
