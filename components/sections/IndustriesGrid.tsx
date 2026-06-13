// components/sections/IndustriesGrid.tsx
// Epic 2 Slice 1 (E2-S1-FE-06) — Wireframe v1.0 §5.
//
// Server Component — semua data statis, hover via CSS, animasi via
// RevealWrapper (client). Ikon: Lucide React (Fase 0 fallback).
//
// TODO(post-launch): Ganti ikon Lucide dgn custom SVG line-art 48×48
// stroke teal jika klien menyediakan file SVG resmi. Lokasi file:
// public/icons/industries/{slug}.svg. Sesuai Fase 0.

import Link from 'next/link'
import {
  UtensilsCrossed, // Makanan & Minuman
  Fish,            // Pengasinan Ikan
  Droplets,        // Water Treatment
  Sprout,          // Pakan Ternak
  FileText,        // Pulp & Kertas
  Layers,          // Penyamakan Kulit
  type LucideIcon,
} from 'lucide-react'
import { RevealWrapper } from '@/components/animations/RevealWrapper'

interface Industry {
  slug: string
  name: string
  icon: LucideIcon
}

// Data 6 sektor — sesuai Fondasi Brand v1.0 + wireframe
const INDUSTRIES: Industry[] = [
  { slug: 'makanan-minuman',  name: 'Makanan & Minuman',  icon: UtensilsCrossed },
  { slug: 'pengasinan-ikan',  name: 'Pengasinan Ikan',    icon: Fish            },
  { slug: 'water-treatment',  name: 'Water Treatment',    icon: Droplets        },
  { slug: 'pakan-ternak',     name: 'Pakan Ternak',       icon: Sprout          },
  { slug: 'pulp-kertas',      name: 'Pulp & Kertas',      icon: FileText        },
  { slug: 'penyamakan-kulit', name: 'Penyamakan Kulit',   icon: Layers          },
]

export function IndustriesGrid() {
  return (
    <section
      className="bg-white px-4 py-14 md:py-16"
      aria-labelledby="industries-heading"
    >
      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        <RevealWrapper>
          <div className="mb-12 text-center md:mb-16">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-teal-600">
              Sektor yang Kami Layani
            </p>
            <h2 id="industries-heading" className="text-3xl font-bold text-ink-700 md:text-4xl">
              Industri yang Kami Layani
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-neutral-700">
              Garam industri SNI untuk enam sektor utama — dari food-grade hingga
              proses teknis. Hubungi kami untuk spesifikasi lebih detail.
            </p>
          </div>
        </RevealWrapper>

        {/* Grid 2×3 mobile, 3×2 desktop */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
          {INDUSTRIES.map((industry, index) => {
            const Icon = industry.icon
            return (
              <RevealWrapper
                key={industry.slug}
                variant="reveal-up"
                delay={index * 80}
              >
                <Link
                  // TODO(Future Epic): ganti ke /industri/[slug] saat
                  // halaman detail industri dibuat. Sementara: kontak.
                  href={`/kontak?industry=${industry.slug}`}
                  aria-label={`Pelajari layanan distribusi garam untuk industri ${industry.name}`}
                  className="card-hover-lift group flex flex-col items-center gap-3 rounded-2xl border border-transparent bg-white p-6 text-center transition-colors hover:bg-neutral-50 md:p-8"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-teal-50 transition-colors group-hover:bg-brand-teal-100">
                    <Icon
                      className="h-7 w-7 text-brand-teal-600"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="text-sm font-semibold leading-tight text-ink-700 md:text-base">
                    {industry.name}
                  </h3>
                </Link>
              </RevealWrapper>
            )
          })}
        </div>
      </div>
    </section>
  )
}
