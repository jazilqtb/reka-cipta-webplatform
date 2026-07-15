// components/calculator/CalculatorResult.tsx
// Epic 6 Slice 2 (E6-S2-FE-02) — hasil kalkulasi + CTA ke /minta-penawaran
// dengan volume & produk pre-filled (AR-04).
//
// CTA Link memakai class buttonVariants(...) langsung, bukan
// <Button asChild> — proyek pakai Base UI (@base-ui/react) yang tidak
// punya pattern asChild seperti Radix (lihat components/sections/HeroCarousel.tsx).
//
// Animasi reveal: Design System §13.6 mendefinisikan class `.success-reveal`,
// tapi class ini TIDAK ada di globals.css (frozen file, gap yang sama dengan
// `.card-hover-lift` — lihat Catatan Penutup epic6_task_breakdown_slice1).
// Dipakai `animate-in fade-in-0 slide-in-from-bottom-4` dari `tw-animate-css`
// (sudah terinstal, dipakai juga di components/ui/dialog.tsx) sebagai
// pengganti yang benar-benar berfungsi, bukan class yang diam-diam no-op.

'use client'

import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CalculatorOutput } from '@/lib/calculator'

interface Props {
  result: CalculatorOutput
  onReset: () => void
}

export function CalculatorResult({ result, onReset }: Props) {
  const primarySlug = result.recommendedSlugs[0]
  const rfqHref = `/minta-penawaran?volume=${result.estimateMaxTon}&produk=${primarySlug}`

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-300 mx-auto max-w-2xl space-y-6 rounded-xl border border-neutral-200 bg-white p-8">
      <div className="text-center">
        <p className="text-sm font-medium text-neutral-500">Estimasi Kebutuhan Garam Anda</p>
        <p className="mt-2 text-4xl font-extrabold text-brand-teal-600">
          {result.estimateMinTon} &ndash; {result.estimateMaxTon} ton
          <span className="block text-base font-medium text-neutral-500">per bulan</span>
        </p>
      </div>

      <div className="rounded-lg bg-brand-teal-50 p-4">
        <p className="text-sm font-semibold text-brand-teal-700">Rekomendasi Produk</p>
        <p className="mt-1 text-sm text-neutral-700">{result.reasoning}</p>
      </div>

      <div className="space-y-3">
        <Link href={rfqHref} className={cn(buttonVariants({ size: 'lg' }), 'w-full')}>
          Minta Penawaran untuk {result.estimateMaxTon} Ton/Bulan
        </Link>
        <Button variant="outline" size="lg" onClick={onReset} className="w-full">
          Hitung Ulang
        </Button>
      </div>
    </div>
  )
}
