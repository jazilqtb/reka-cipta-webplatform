// components/sections/AboutHero.tsx
// RONDE Tahap 7 (2026-08) — "samakan DNA desain /tentang-kami dengan
// Beranda & /produk". Komponen baru, BUKAN memperluas <InnerPageHero>
// (dipakai 5 halaman lain: jadi-supplier, artikel, kalkulator,
// minta-penawaran, kontak) — pola scope yg sama dgn ProductCatalogHero.tsx
// & ProductHero.tsx: jangan diam-diam mendesain ulang halaman yg tidak
// diminta.
//
// DNA identik dgn Hero lain yg sudah dibangun: gradient VERTIKAL murni
// (bg-gradient-to-b, bukan diagonal — pelajaran seam Tahap 5), mesh
// eyebrow + H1 font-ui beraksen italic, garis kredensial mono-tech,
// SectionDivider curve menutup ke section putih di bawahnya.
import Link from 'next/link'
import { CaretRightIcon, BuildingsIcon, UsersThreeIcon } from '@phosphor-icons/react/ssr'
import { SectionDivider } from '@/components/decorative/SectionDivider'
import { TEAM_MEMBERS } from '@/constants/company-profile'

export function AboutHero() {
  return (
    <>
    <section className="relative overflow-hidden surface-dark px-4 pb-14 pt-14 md:pb-20 md:pt-20">

      <div className="relative mx-auto max-w-5xl">
        <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 font-ui text-sm text-brand-teal-300/70">
          <Link href="/" className="link-animated transition-colors hover:text-brand-teal-200">Beranda</Link>
          <CaretRightIcon size={16} weight="bold" aria-hidden="true" />
          <span aria-current="page" className="text-white/90">Tentang Kami</span>
        </nav>

        <p className="rule-index font-ui text-brand-teal-300">Tentang Kami</p>

        <h1 className="mt-3 max-w-2xl text-balance font-ui text-3xl md:text-4xl font-semibold leading-[1.1] tracking-tight text-white">
          Distributor Garam yang Membangun Kepercayaan Lewat{' '}
          <span className="font-medium text-brand-teal-300">Transparansi dan Konsistensi</span>
        </h1>

        <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-white/70 md:text-lg">
          Sejak 2020, kami melayani mitra industri dengan standar kualitas yang konsisten
          dan proses kerja yang transparan.
        </p>

        {/* RONDE Tahap 8: stat kedua sebelumnya merujuk jumlah dokumen
            legalitas ("X Dokumen Legalitas Terverifikasi") — dangling
            reference setelah LegalDocsGrid dihapus total dari halaman
            ini (klien: dokumen resmi tidak perlu tampil di antarmuka
            publik). Diganti jumlah anggota tim inti — tetap faktual,
            dan section Tim di bawah memang menampilkannya. */}
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-5">
          <div className="flex items-center gap-1.5">
            <BuildingsIcon size={16} weight="duotone" className="text-brand-teal-300" aria-hidden="true" />
            <span className="font-ui text-xs font-medium text-white/50">Berdiri Resmi Sejak 2020</span>
          </div>
          <div className="flex items-center gap-1.5">
            <UsersThreeIcon size={16} weight="duotone" className="text-brand-teal-300" aria-hidden="true" />
            <span className="mono-tech text-base font-bold text-brand-teal-300">{TEAM_MEMBERS.length}</span>
            <span className="font-ui text-xs font-medium text-white/50">Anggota Tim Inti</span>
          </div>
        </div>
      </div>
    </section>
    <SectionDivider variant="curve" fromClassName="fill-ink-900" toClassName="bg-white" flip />
    </>
  )
}
