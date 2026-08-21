// components/sections/IndustriesGrid.tsx
// Epic 2 Slice 1 (E2-S1-FE-06) — Wireframe v1.0 §5.
// RONDE 4 (2026-08), revisi 11 poin klien:
// - Bentuk: tile bento (.notch/.notch-lg) & badge ikon (.facet-frame)
//   diganti rounded-2xl (tile) + .icon-hex (badge) — aturan bentuk
//   tunggal Ronde 4, lihat globals.css.
// - Latar: tekstur titik dot-grid per-tile (generik) diganti
//   .bg-salt-texture (kisi garis terfaset) — konsisten dgn seluruh
//   beranda, bukan motif berbeda-beda tiap section.
// - Ikon: Lucide → Phosphor duotone.
// - Tipografi: judul H2 pindah ke font-ui (Fraunces kini hanya H1 hero).
//
// RONDE Tahap 8 (2026-08): .bg-salt-texture DICABUT dari tile — klien
// eksplisit "tidak suka motif garis-garis di section manapun pada
// Beranda". Gradient duotone tiap tile (sudah ada, cukup kaya) berdiri
// sendiri tanpa hatching tambahan. H2 juga ditulis ulang — versi lama
// ("Industri yang Kami Layani") sekadar mengulang eyebrow di atasnya
// ("Sektor yang Kami Layani") kata demi kata, plus belum pernah dapat
// aksen italic yg konsisten dgn H2 section lain.
//
// Server Component — semua data statis, hover via CSS, animasi via
// RevealWrapper (client).
//
// TODO(post-launch): Ganti ikon dgn custom SVG line-art 48×48 jika
// klien menyediakan file SVG resmi. Lokasi: public/icons/industries/{slug}.svg.

import Link from 'next/link'
import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import {
  ForkKnifeIcon,   // Makanan & Minuman
  FishIcon,        // Pengasinan Ikan
  DropIcon,        // Water Treatment
  PlantIcon,       // Pakan Ternak
  FileTextIcon,    // Pulp & Kertas
  StackIcon,       // Penyamakan Kulit
} from '@phosphor-icons/react/ssr'
import { RevealWrapper } from '@/components/animations/RevealWrapper'

interface Industry {
  slug: string
  name: string
  icon: PhosphorIcon
  /** Contoh kegunaan spesifik — bukan deskripsi generik (Fondasi Brand §5.1) */
  useCase: string
  /** Gradient duotone khas — dari palet teal/ink/sand yang sudah ada, bukan warna baru */
  featured?: boolean
}

// Data 6 sektor — sesuai Fondasi Brand v1.0 + wireframe. Dua tile
// pertama (Makanan & Minuman, Pengasinan Ikan) ditandai `featured`:
// segmen persona procurement yang paling sering disebut duluan di
// Fondasi Brand §6.2.
const INDUSTRIES: Industry[] = [
  {
    slug: 'makanan-minuman',
    name: 'Makanan & Minuman',
    icon: ForkKnifeIcon,
    useCase: 'Garam beryodium untuk pengolahan makanan kemasan dan minuman industri.',
    featured: true,
  },
  {
    slug: 'pengasinan-ikan',
    name: 'Pengasinan Ikan',
    icon: FishIcon,
    useCase: 'Garam kasar SPO/M untuk proses fermentasi dan pengawetan ikan asin.',
    featured: true,
  },
  {
    slug: 'water-treatment',
    name: 'Water Treatment',
    icon: DropIcon,
    useCase: 'Garam murni untuk regenerasi resin dan pengolahan air industri.',
  },
  {
    slug: 'pakan-ternak',
    name: 'Pakan Ternak',
    icon: PlantIcon,
    useCase: 'Garam halus GHPT sebagai suplemen mineral pakan ternak.',
  },
  {
    slug: 'pulp-kertas',
    name: 'Pulp & Kertas',
    icon: FileTextIcon,
    useCase: 'Garam industri untuk proses pemutihan dan produksi bubur kertas.',
  },
  {
    slug: 'penyamakan-kulit',
    name: 'Penyamakan Kulit',
    icon: StackIcon,
    useCase: 'Garam kasar untuk pengawetan kulit mentah sebelum proses penyamakan.',
  },
]

export function IndustriesGrid() {
  return (
    <section
      // RONDE Tahap 3: padding atas dipangkas — melengkapi pemangkasan
      // padding-bawah CredibilitySection (poin 5, whitespace Mitra→Sektor).
      className="bg-white px-4 pt-8 pb-14 md:pt-10 md:pb-20"
      aria-labelledby="industries-heading"
    >
      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        <RevealWrapper>
          <div className="mb-8 text-center md:mb-12">
            <p className="rule-index font-ui justify-center text-brand-teal-600">
              Sektor yang Kami Layani
            </p>
            <h2
              id="industries-heading"
              className="mt-3 text-balance font-ui text-2xl md:text-3xl font-semibold leading-tight text-ink-700"
            >
              Garam untuk Beragam <span className="font-medium text-brand-teal-600">Kebutuhan</span> Industri
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-pretty text-neutral-700">
              Tiap sektor memakai spesifikasi garam yang berbeda.
            </p>
          </div>
        </RevealWrapper>

        {/* Bento: 2 tile unggulan (baris 1) + 4 tile reguler (baris 2) —
            desktop/tablet TIDAK diubah (feedback klien: "desain ini
            sudah sempurna"). RONDE Tahap 3: khusus mobile (<sm), 6 tile
            stack 1-kolom terlalu memakan scroll vertikal (poin 4) —
            diganti horizontal swipe, kembali jadi grid bento normal
            mulai breakpoint sm ke atas. */}
        <div className="carousel-row gap-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
          {INDUSTRIES.map((industry, index) => {
            const Icon = industry.icon
            return (
              <RevealWrapper
                key={industry.slug}
                variant="reveal-up"
                delay={index * 70}
                className={`w-[78vw] shrink-0 snap-start sm:w-auto sm:shrink ${industry.featured ? 'lg:col-span-2' : 'lg:col-span-1'}`}
              >
                <Link
                  // RONDE Tahap 9: link ke /kontak?industry=... DIHAPUS —
                  // klien menilai tile industri → form kontak tidak
                  // relevan (pengunjung ingin lihat produk, bukan
                  // langsung disodori form). Diarahkan ke /produk —
                  // langkah lanjutan yang lebih natural ("lihat industri
                  // yang kami layani" → "lihat produknya"), tanpa perlu
                  // membangun filter per-industri di /produk (di luar
                  // cakupan permintaan ini, lihat TODO Future Epic di
                  // bawah utk /industri/[slug] kalau nanti dibutuhkan).
                  // TODO(Future Epic): ganti ke /industri/[slug] saat
                  // halaman detail industri per-sektor dibuat.
                  href="/produk"
                  aria-label={`Lihat produk garam untuk industri ${industry.name}: ${industry.useCase}`}
                  /* SATU permukaan untuk keenam kartu (2026-08-21).
                     Sebelumnya tiap kartu punya gradient dua-stop sendiri —
                     enam perlakuan warna untuk enam hal yang setara, dan
                     tiga di antaranya memakai primary sebagai bidang penuh
                     kartu. Itu melanggar dua aturan sekaligus: gradient
                     sebagai latar (§9 anti-pattern #9) dan primary sebagai
                     bidang lebih besar dari tombol/badge (§2.5). Warna
                     bukan pembeda yang bermakna di sini — keenam sektor
                     setara, yang membedakan cuma ikon dan namanya. */
                  className={`card-hover-lift group relative flex h-full flex-col justify-between overflow-hidden rounded-md bg-steel-900 p-6 text-white ${
                    industry.featured ? 'min-h-[220px] md:p-8' : 'min-h-[200px]'
                  }`}
                >
                  {/* RONDE 6: badge .icon-hex dihapus — ikon polos lebih
                      besar, transform-only hover (bukan frame/bg yang
                      terkesan "tempelan"), langsung di atas gradient.
                      RONDE 7: panah pojok kanan atas dihapus — link ini
                      menuju /kontak, bukan halaman detail industri, jadi
                      ikon panah "lihat detail" menyesatkan. */}
                  <div className="relative z-10">
                    <Icon
                      size={40}
                      weight="duotone"
                      className="text-marine-200 transition-transform duration-150 group-hover:scale-105"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="relative z-10 mt-6">
                    {/* text-white eksplisit — globals.css §BASE menimpa semua
                        h1-h6 ke ink-700 by default; tanpa ini judul nyaris
                        tak terlihat di atas background gradient gelap. */}
                    <h3 className="font-ui text-lg font-bold leading-tight text-white md:text-xl">
                      {industry.name}
                    </h3>
                    <p className="mt-2 text-pretty text-sm leading-relaxed text-white/80">
                      {industry.useCase}
                    </p>
                  </div>
                </Link>
              </RevealWrapper>
            )
          })}
        </div>
      </div>
    </section>
  )
}
