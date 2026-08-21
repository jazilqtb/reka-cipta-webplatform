// components/sections/PageHero.tsx
// RONDE Tahap 11 (2026-08) — Design System Rollout ke 7 rute sisa.
// Lihat docs/TASK-PLAN-design-rollout.md (T1).
//
// Hero generik yang MENGKODIFIKASI pola yang sudah terbukti di 4 Hero
// sebelumnya (ProductCatalogHero, ProductHero, AboutHero, ContactHero).
// Tujuannya: 7 rute berikutnya TIDAK perlu menyalin-tempel pola yang
// sama 7× — satu sumber, satu perilaku, satu titik perbaikan kalau
// nanti ada revisi.
//
// 4 Hero lama SENGAJA TIDAK di-refactor ke sini: semuanya sudah
// disetujui klien & tampil benar; menyentuhnya = risiko regresi seam
// tanpa perubahan visual apa pun bagi pengguna (scope_out di TASK-PLAN).
//
// DNA yang dikunci di sini (D1-D6 TASK-PLAN):
// - gradient VERTIKAL murni (bg-gradient-to-b) — bukan diagonal.
//   Ini akar bug "seam"/garis tempelan yang berulang di Tahap 5 & 8:
//   fill SVG divider itu FLAT, jadi cuma cocok kalau tepi bawah section
//   juga warna rata di seluruh lebar. Gradient diagonal bikin warna
//   tepi bawah berbeda antara sisi kiri & kanan → pita warna salah.
// - mesh gradient + blob diklaster di AREA ATAS saja, supaya tepi bawah
//   tetap ink-900 murni & match 1:1 dgn fill-ink-900 divider.
import Link from 'next/link'
import type { ReactNode } from 'react'
import { CaretRightIcon } from '@phosphor-icons/react/ssr'
import { SectionDivider } from '@/components/decorative/SectionDivider'

export interface HeroCredential {
  /** Ikon Phosphor — opsional, boleh hanya angka+label */
  icon?: ReactNode
  /** Angka/nilai mono-tech — opsional */
  value?: string | number
  label: string
}

interface PageHeroProps {
  eyebrow: string
  /** Bagian awal judul (teks biasa) */
  title: string
  /** Kata kunci beraksen italic teal — pola D4, opsional */
  titleAccent?: string
  /** Ekor judul setelah aksen, mis. tanda tanya atau kata penutup */
  titleTail?: string
  subtitle?: string
  /** Label breadcrumb terakhir (halaman ini). Beranda + separator dirender otomatis */
  breadcrumbLabel: string
  /** Segmen tengah opsional, mis. { label: 'Artikel', href: '/artikel' } utk halaman detail */
  breadcrumbParent?: { label: string; href: string }
  credentials?: HeroCredential[]
  /** Warna section DI BAWAH Hero — dipakai utk latar divider. Default putih. */
  dividerTo?: string
  /** Bentuk divider penutup. Default 'curve'. */
  dividerVariant?: 'wave' | 'curve' | 'diagonal'
}

export function PageHero({
  eyebrow,
  title,
  titleAccent,
  titleTail,
  subtitle,
  breadcrumbLabel,
  breadcrumbParent,
  credentials,
  dividerTo = 'bg-white',
  dividerVariant = 'curve',
}: PageHeroProps) {
  return (
    <>
      <section className="relative overflow-hidden surface-dark px-4 pb-14 pt-14 md:pb-20 md:pt-20">

        <div className="relative mx-auto max-w-5xl">
          <nav
            aria-label="Breadcrumb"
            className="mb-5 flex flex-wrap items-center gap-1.5 font-ui text-sm text-brand-teal-300/70"
          >
            <Link href="/" className="link-animated transition-colors hover:text-brand-teal-200">
              Beranda
            </Link>
            <CaretRightIcon size={16} weight="bold" aria-hidden="true" />
            {breadcrumbParent && (
              <>
                <Link
                  href={breadcrumbParent.href}
                  className="link-animated transition-colors hover:text-brand-teal-200"
                >
                  {breadcrumbParent.label}
                </Link>
                <CaretRightIcon size={16} weight="bold" aria-hidden="true" />
              </>
            )}
            <span aria-current="page" className="text-white/90">
              {breadcrumbLabel}
            </span>
          </nav>

          <p className="rule-index font-ui text-brand-teal-300">{eyebrow}</p>

          <h1 className="mt-3 max-w-3xl text-balance font-ui text-3xl md:text-4xl font-semibold leading-[1.1] tracking-tight text-white">
            {title}
            {titleAccent && (
              <>
                {' '}
                <span className="font-medium text-brand-teal-300">{titleAccent}</span>
              </>
            )}
            {titleTail}
          </h1>

          {subtitle && (
            <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-white/70 md:text-lg">
              {subtitle}
            </p>
          )}

          {credentials && credentials.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-5">
              {credentials.map((c) => (
                <div key={c.label} className="flex items-center gap-1.5">
                  {c.icon}
                  {c.value !== undefined && (
                    <span className="mono-tech text-base font-bold text-brand-teal-300">{c.value}</span>
                  )}
                  <span className="font-ui text-xs font-medium text-white/50">{c.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <SectionDivider variant={dividerVariant} fromClassName="fill-ink-900" toClassName={dividerTo} flip />
    </>
  )
}
