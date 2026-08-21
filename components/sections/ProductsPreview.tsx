// components/sections/ProductsPreview.tsx
// Epic 2 Slice 1 (E2-S1-FE-04) — RONDE 4 (2026-08), revisi 11 poin klien:
// - Latar: --color-paper-* (krem hangat, salah satu pola default AI yang
//   diperingatkan skill /frontend-design) diganti --color-salt-* (netral
//   mineral sejuk, selaras teal). Blob blur teal generik dihapus, diganti
//   .bg-salt-grain (kisi garis tipis, konsisten dgn seluruh beranda).
// - Bentuk: notch-both & ledger-card/ledger-pill diganti rounded-2xl +
//   panel-card + tag-pill (aturan bentuk tunggal Ronde 4, lihat globals.css).
// - Ikon: Package2/ArrowRight (Lucide) → Phosphor duotone.
// - Tipografi: nama produk (H3) pindah dari font-display (Fraunces —
//   sekarang HANYA dipakai di H1 hero) ke font-ui (Space Grotesk).
// - Spacing dirapikan ke skala konsisten section (py-16 md:py-24,
//   mb-12 md:mb-16 heading block, gap-5 grid).
//
// Nomor hasil uji lab tetap dari Fondasi Brand v1.0 §6.3 — data nyata,
// tidak dikarang untuk produk yang belum terdokumentasi.

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRightIcon, PackageIcon } from '@phosphor-icons/react/ssr'
import { ProductCard, type ProductCardData } from '@/components/blocks/ProductCard'
import { RevealWrapper } from '@/components/animations/RevealWrapper'
import type { Product } from '@/types/api'

const FALLBACK_PRODUCTS: ProductCardData[] = [
  {
    slug: 'garam-halus-yodium',
    name: 'Garam Halus PRO YD',
    spec: 'NaCl ≥97.0% • Beryodium',
    imagePath: '/images/products/garam-halus-yodium.jpg',
    is_sni: true,
  },
  {
    slug: 'garam-halus-non-yodium',
    name: 'Garam Halus PRO L',
    spec: 'NaCl ≥97.0% • Non-yodium',
    imagePath: '/images/products/garam-halus-non-yodium.jpg',
    is_sni: false,
  },
  {
    slug: 'garam-kasar-industri',
    name: 'Garam Kasar SPO/M',
    spec: 'NaCl ≥96.0% • Kasar SPO/M',
    imagePath: '/images/products/garam-kasar-industri.jpg',
    is_sni: true,
  },
  {
    // "Premium" dihapus dari nama tampilan — Fondasi Brand v1.0 §5.3
    // eksplisit mendaftarkan "Premium" sebagai kata yang dihindari
    // ("sudah terlalu umum digunakan oleh semua kompetitor tanpa
    // substansi"). "Premium" di dokumen sumber (Lampiran 14.1 PRD) adalah
    // KODE internal produk, bukan nama pemasaran.
    slug: 'garam-kasar-petani',
    name: 'Garam Kasar Petani',
    spec: 'NaCl ≥94.0% • Kasar',
    imagePath: '/images/products/garam-kasar-petani.jpg',
    is_sni: false,
  },
  {
    slug: 'garam-ghpt',
    name: 'Garam Halus Pakan Ternak',
    spec: 'NaCl ≥95.0% • GHPT',
    imagePath: '/images/products/garam-ghpt.jpg',
    is_sni: false,
  },
]

// Nomor hasil uji lab — Fondasi Brand v1.0 §6.3. Hanya 3 produk yang
// punya nomor terdokumentasi eksplisit; sisanya sengaja tidak diberi
// badge (jangan mengarang data lab).
const LAB_NUMBERS: Record<string, string> = {
  'garam-halus-yodium': 'LAB/VII/2183/2023',
  'garam-halus-non-yodium': 'LAB/VII/2967/2024',
  'garam-kasar-industri': 'LAB/VI/1825/2023',
}

const PRODUCT_BLURBS: Record<string, string> = {
  'garam-halus-yodium':
    'Garam halus beryodium sesuai SNI 8207-2016 — pilihan utama industri makanan, minuman, dan katering yang membutuhkan dokumentasi lab lengkap.',
  'garam-halus-non-yodium':
    'Garam halus murni tanpa yodium untuk aplikasi industri yang mensyaratkan kadar NaCl tinggi tanpa tambahan mineral.',
  'garam-kasar-industri':
    'Garam kasar SPO/M untuk kebutuhan industri berskala besar — pengasinan, water treatment, hingga proses teknis lainnya.',
  'garam-kasar-petani':
    'Garam kasar hasil panen petani mitra di Madura, diproses dengan kualitas terjaga untuk kebutuhan industri menengah.',
  'garam-ghpt':
    'Formulasi garam halus khusus pakan ternak dengan komposisi mineral yang disesuaikan kebutuhan peternakan.',
}

function toCardData(product: Product): ProductCardData {
  return {
    slug: product.slug,
    name: product.name,
    spec: product.tagline ?? '',
    imagePath: product.photo_url ?? undefined,
    is_sni: product.is_sni,
  }
}

// ─── Kartu unggulan — horizontal, foto + narasi ───────────────────
function FeaturedProductCard({ product }: { product: ProductCardData }) {
  const blurb = PRODUCT_BLURBS[product.slug] ?? product.spec
  const labNumber = LAB_NUMBERS[product.slug]

  return (
    <Link
      href={`/produk/${product.slug}`}
      aria-label={`Lihat detail produk ${product.name}`}
      className="panel-card group relative flex flex-col overflow-hidden rounded-2xl md:flex-row"
    >
      <div className="relative h-64 w-full shrink-0 overflow-hidden bg-gradient-to-br from-brand-teal-50 to-brand-teal-100 md:h-auto md:w-[44%]">
        {product.imagePath ? (
          <Image
            src={product.imagePath}
            alt={`Foto produk ${product.name}`}
            fill
            sizes="(max-width: 768px) 100vw, 44vw"
            priority
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <PackageIcon size={40} weight="duotone" className="text-brand-teal-600/40" aria-hidden="true" />
          </div>
        )}
        {product.is_sni && (
          <span className="tag-pill-dark absolute right-4 top-4 backdrop-blur-sm">
            SNI
          </span>
        )}
      </div>

      {/* Narasi */}
      <div className="flex flex-1 flex-col justify-center gap-3 p-7 md:p-10 lg:p-12">
        <p className="rule-index font-ui text-brand-teal-600">Katalog Utama</p>
        <h3 className="text-balance font-ui text-lg font-semibold tracking-tight text-ink-700 md:text-xl">
          {product.name}
        </h3>
        <p className="mono-tech text-xs text-neutral-500">{product.spec}</p>
        <p className="text-pretty text-sm leading-relaxed text-neutral-700 md:text-base">
          {blurb}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="link-arrow font-ui text-sm font-semibold text-brand-teal-600 group-hover:text-brand-teal-700">
            Lihat Spesifikasi Lengkap
            <ArrowRightIcon weight="bold" className="arrow-icon h-4 w-4" aria-hidden="true" />
          </span>
          {labNumber && (
            <span className="tag-pill">Hasil Uji {labNumber}</span>
          )}
        </div>
      </div>
    </Link>
  )
}

interface ProductsPreviewProps {
  products: Product[]
}

export function ProductsPreview({ products }: ProductsPreviewProps) {
  const items = products.length > 0 ? products.map(toCardData) : FALLBACK_PRODUCTS
  const [featured, ...rest] = items

  return (
    <section
      // RONDE 7: padding bawah dipangkas lebih lanjut — jarak ke section
      // Kepercayaan terasa berlebih menurut klien.
      // RONDE Tahap 8: .bg-salt-grain (kisi garis tipis) dicabut — klien
      // tidak suka motif garis apa pun di Beranda. bg-salt-50 solid saja.
      className="bg-salt-50 px-4 pt-14 pb-8 md:pt-20 md:pb-10"
      aria-labelledby="products-heading"
    >
      <div className="mx-auto max-w-7xl">
        {/* Heading — tipografi lebih ekspresif (RONDE 6): campuran
            weight/italic DALAM satu typeface (font-ui/Space Grotesk),
            bukan menambah font-display baru di luar H1 hero (aturan
            "Fraunces hanya H1" tetap ketat, lihat globals.css §Ronde 4). */}
        <RevealWrapper>
          <div className="mb-8 md:mb-12">
            <p className="rule-index font-ui text-brand-teal-600">Katalog Produk</p>
            <h2
              id="products-heading"
              className="mt-3 max-w-2xl text-balance font-ui text-2xl md:text-3xl font-semibold leading-tight text-ink-700"
            >
              5 Pilihan Garam <span className="font-medium text-brand-teal-600">Bersertifikasi</span>
            </h2>
            <p className="mt-4 max-w-xl text-pretty text-base text-neutral-700">
              Dari halus food-grade beryodium hingga kasar ber-NaCl tinggi untuk
              proses teknis.
            </p>
          </div>
        </RevealWrapper>

        {/* ── DESKTOP: kartu unggulan + grid 4 ────────────────── */}
        <div className="hidden md:block">
          {featured && (
            <RevealWrapper variant="reveal-up" className="mb-5 block">
              <FeaturedProductCard product={featured} />
            </RevealWrapper>
          )}

          <div className="grid grid-cols-4 gap-5">
            {rest.map((product, index) => (
              <RevealWrapper key={product.slug} variant="reveal-up" delay={index * 80}>
                <ProductCard {...product} className="h-full" />
              </RevealWrapper>
            ))}
          </div>
        </div>

        {/* ── MOBILE (RONDE Tahap 3): grid 2 kolom statis DIGANTI
            horizontal swipe — dgn 5 item ganjil, grid 2-kolom selalu
            menyisakan 1 sel kosong di baris terakhir (keluhan klien).
            Carousel tidak punya masalah ini krn tidak ada "baris".
            Kartu compact (foto + nama saja, spec disembunyikan — poin 3)
            supaya lebih banyak produk kelihatan sekaligus di layar. ── */}
        <div
          className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2 md:hidden"
          aria-label="Geser untuk lihat produk lain"
        >
          {items.map((product, index) => (
            <RevealWrapper
              key={product.slug}
              variant="reveal-up"
              delay={index * 60}
              className="w-[38vw] shrink-0 snap-start"
            >
              <ProductCard {...product} compact className="h-full" />
            </RevealWrapper>
          ))}
          <div className="w-1 shrink-0" aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}
