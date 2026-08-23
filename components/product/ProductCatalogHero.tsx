// components/product/ProductCatalogHero.tsx
// RONDE Tahap 4 (2026-08) — "DNA desain Beranda" diterapkan ke /produk.
//
// SENGAJA komponen baru, BUKAN memperluas <InnerPageHero> yang sudah
// dipakai 6 halaman lain (jadi-supplier, artikel, kalkulator,
// minta-penawaran, tentang-kami, kontak) — merombak komponen bersama
// itu akan diam-diam mendesain ulang 6 halaman yang TIDAK diminta klien
// ("perombakan total pada halaman /produk"). Scope ketat: hanya file
// ini + page.tsx /produk yang menggunakannya.
//
// Tanpa foto (klien: "jika butuh gambar/video, beri tahu — untuk saat
// ini pakai dummy jangan sampai menghambat"). Diputuskan TIDAK memakai
// foto dummy generik di sini — hero katalog cukup kuat dgn gradient
// gelap + mesh gradient + tipografi, tanpa risiko foto stok yang terasa
// asal. Foto TETAP relevan di tiap kartu produk (data asli sudah ada
// via product.photo_url, fallback ikon sudah ada) — lihat daftar aset
// di laporan akhir untuk saran foto lifestyle/tekstur jika klien mau
// menambah kekayaan visual hero ini nanti.
//
// RONDE Tahap 5 (2026-08) — 2 revisi klien atas iterasi Tahap 4:
//
// (1) "Motif garis-garis" — .bg-salt-texture (kisi garis diagonal, sama
//     motif yg SUDAH dihapus dari StagedCTA/Footer/HowItWorks sejak
//     Ronde 6-7 krn dinilai tidak profesional) SEHARUSNYA tidak pernah
//     dipasang lagi di sini pada Tahap 4 — dihapus total. Diganti mesh
//     gradient: beberapa radial-gradient lembut warna teal/ocean-blue
//     brand, DIKLASTER DI AREA ATAS SAJA (lihat poin 2 kenapa).
//
// (2) BUG divider tidak seamless — root cause: section ini sebelumnya
//     pakai gradient DIAGONAL (bg-gradient-to-br, ...to-brand-teal-950),
//     sedangkan <SectionDivider> di bawahnya adalah PATH SVG WARNA FLAT
//     (fill-ink-900). Warna flat itu hanya cocok dgn satu titik di
//     gradient diagonal — di sisi kanan layar warna asli sudah bergeser
//     ke arah teal-950, jadi fill flat "fill-ink-900" terlihat SALAH
//     WARNA (bukan cuma seam 1px, tapi pita warna yg beda sepanjang
//     tepi), persis kesan "seperti tempelan" yg dilaporkan klien. FIX:
//     gradient dasar diubah jadi VERTIKAL MURNI (bg-gradient-to-b, ujung
//     bawah = ink-900 solid, konstan di seluruh lebar) — sekarang
//     match 1:1 dgn fill-ink-900 divider di semua titik x. Kekayaan
//     warna teal/ocean-blue TETAP ada lewat mesh-gradient overlay +
//     pertama tinggi section) supaya tepi BAWAH (yg ditempeli divider)
//     selalu murni ink-900 tanpa campuran warna lain. SectionDivider.tsx
//     sendiri juga ditambah overlap 1px (lihat catatan di sana) sbg
//     lapisan pengaman kedua utk celah sub-pixel rendering.
import Link from 'next/link'
import { CaretRightIcon, SealCheckIcon } from '@phosphor-icons/react/ssr'
import { SectionDivider } from '@/components/decorative/SectionDivider'

interface BreadcrumbItem {
  label: string
  href?: string
}

const BREADCRUMB: BreadcrumbItem[] = [
  { label: 'Beranda', href: '/' },
  { label: 'Produk' },
]

export function ProductCatalogHero() {
  return (
    <>
    <section className="relative overflow-hidden surface-depth line-motif-deep edge-marine-bottom px-4 pb-14 pt-14 md:pb-20 md:pt-20">

      <div className="relative mx-auto max-w-5xl">
        <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 font-ui text-sm text-brand-teal-300/70">
          {BREADCRUMB.map((item, index) => (
            <span key={item.label} className="flex items-center gap-1.5">
              {index > 0 && <CaretRightIcon size={16} weight="bold" aria-hidden="true" />}
              {item.href ? (
                <Link href={item.href} className="link-animated transition-colors hover:text-brand-teal-200">
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-white/90">{item.label}</span>
              )}
            </span>
          ))}
        </nav>

        <p className="rule-index font-ui text-brand-teal-300">Katalog Produk</p>

        {/* RONDE Tahap 5: copywriting ditulis ulang — versi lama
            ("...Data Uji Lab, Bukan Klaim") dinilai klien reaktif/
            try-hard, terdengar seperti dibuat AI. Diganti tone B2B
            standar industri: fokus kualitas & konsistensi pasokan,
            tanpa perlu membantah klaim siapa pun. */}
        <h1 className="mt-3 max-w-2xl text-balance font-ui text-3xl md:text-4xl font-semibold leading-[1.1] tracking-tight text-white">
          Garam Industri Bersertifikat SNI, Dipasok dengan{' '}
          <span className="font-medium text-brand-teal-300">Standar yang Konsisten</span>
        </h1>

        <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-white/70 md:text-lg">
          Lima varian garam untuk kebutuhan industri makanan, pengasinan, water treatment,
          hingga pakan ternak. Setiap produk dilengkapi hasil uji laboratorium yang
          dapat diunduh langsung.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-5">
          <div className="flex items-center gap-1.5">
            <span className="mono-tech text-base font-bold text-brand-teal-300">5</span>
            <span className="font-ui text-xs font-medium text-white/50">Varian Produk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <SealCheckIcon size={16} weight="fill" className="text-brand-teal-300" aria-hidden="true" />
            <span className="font-ui text-xs font-medium text-white/50">Bersertifikat SNI</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-ui text-xs font-medium text-white/50">Hasil uji laboratorium tersedia untuk diunduh</span>
          </div>
        </div>
      </div>
    </section>
    <SectionDivider
      variant="curve"
      fromClassName="fill-ink-900"
      toClassName="bg-salt-50"
      flip
    />
    </>
  )
}
