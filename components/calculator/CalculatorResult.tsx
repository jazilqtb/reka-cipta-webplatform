// components/calculator/CalculatorResult.tsx
// Epic 6 Slice 2 (E6-S2-FE-02) — hasil kalkulasi + CTA ke /minta-penawaran
// dengan volume & produk pre-filled (AR-04).
//
// Animasi reveal: Design System §13.6 mendefinisikan class `.success-reveal`,
// tapi class ini TIDAK ada di globals.css (frozen file, gap yang sama dengan
// `.card-hover-lift` — lihat Catatan Penutup epic6_task_breakdown_slice1).
// Dipakai `animate-in fade-in-0 slide-in-from-bottom-4` dari `tw-animate-css`
// (sudah terinstal, dipakai juga di components/ui/dialog.tsx) sebagai
// pengganti yang benar-benar berfungsi, bukan class yang diam-diam no-op.
//
// RONDE Tahap 11 (2026-08) — Design System Rollout (T6): panel hasil jadi
// kartu gelap beraksen teal (angka estimasi = "data", bahasa visualnya
// mono-tech spt SpecTable /produk/[slug]), tombol jadi rounded-xl dgn
// hover-lift. buttonVariants/Button shadcn dilepas dari file ini supaya
// tombolnya sama persis dgn tombol di halaman lain. Logika kalkulasi &
// href prefill TIDAK disentuh.

'use client'

import Link from 'next/link'
import { ArrowRightIcon, ArrowCounterClockwiseIcon } from '@phosphor-icons/react/ssr'
import type { CalculatorOutput } from '@/lib/calculator'

interface Props {
  result: CalculatorOutput
  onReset: () => void
}

export function CalculatorResult({ result, onReset }: Props) {
  const primarySlug = result.recommendedSlugs[0]
  const rfqHref = `/minta-penawaran?volume=${result.estimateMaxTon}&produk=${primarySlug}`

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-4 mx-auto max-w-2xl space-y-5 duration-300">
      {/* Panel angka — gelap & tegas supaya hasil kalkulasi terbaca
          sebagai "output", bukan sekadar paragraf lain di halaman. */}
      <div className="relative overflow-hidden rounded-2xl surface-depth p-8 text-center">
        <div className="relative">
          <p className="rule-index font-ui justify-center text-brand-teal-300">
            Estimasi Kebutuhan Anda
          </p>
          <p className="mono-tech mt-4 text-2xl md:text-3xl font-bold leading-none text-white">
            {result.estimateMinTon}&ndash;{result.estimateMaxTon}
            <span className="ml-2 text-2xl font-medium text-brand-teal-300">ton</span>
          </p>
          <p className="font-ui mt-2 text-sm text-white/50">per bulan</p>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-teal-600/15 bg-brand-teal-50 p-5">
        <p className="font-ui text-sm font-bold text-brand-teal-700">Rekomendasi Produk</p>
        <p className="mt-1.5 text-pretty text-sm leading-relaxed text-neutral-700">
          {result.reasoning}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href={rfqHref}
          className="font-ui group inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-teal-600 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-teal-500 focus-visible:outline-none focus-visible:shadow-focus"
        >
          Minta Penawaran {result.estimateMaxTon} Ton/Bulan
          <ArrowRightIcon size={16} weight="bold" className="arrow-icon" aria-hidden="true" />
        </Link>
        <button
          type="button"
          onClick={onReset}
          className="font-ui group inline-flex items-center justify-center gap-2 rounded-xl border border-ink-900/15 px-5 py-3 text-sm font-semibold text-ink-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-salt-50 focus-visible:outline-none focus-visible:shadow-focus"
        >
          <ArrowCounterClockwiseIcon
            size={16}
            weight="bold"
            className="transition-transform duration-300 group-hover:-rotate-90"
            aria-hidden="true"
          />
          Hitung Ulang
        </button>
      </div>
    </div>
  )
}
