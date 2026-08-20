// components/sections/AboutCTA.tsx
// RONDE Tahap 7 (2026-08) — "samakan DNA desain /tentang-kami". Halaman
// ini sebelumnya berakhir langsung di LegalDocsGrid (bg-salt-50) lalu
// Footer (ink-900) — transisi terang→gelap tanpa jeda/CTA, beda ritme
// dgn halaman lain yg sudah dirombak (Beranda→StagedCTASection,
// /produk/[slug]→ProductCTA, keduanya menutup dgn panel CTA gelap
// sebelum Footer). Ditambah panel penutup ringan di sini supaya
// ritmenya konsisten & funnel-nya tidak berhenti begitu saja — pola
// SAMA dgn ProductCTA.tsx (gradient VERTIKAL, 2 SectionDivider
// masuk/keluar, kartu solid tanpa border-hover).
//
// RONDE Tahap 8 (2026-08): LegalDocsGrid (bg-salt-50) DIHAPUS TOTAL dari
// halaman ini. Section TERAKHIR sebelum panel ini sekarang OrgStructure
// (bg-white) — divider MASUK diupdate dari fill-salt-50 → fill-white
// supaya tetap match persis (bukan bug seam baru).
import Link from 'next/link'
import { PackageIcon, ChatCircleIcon, ArrowRightIcon } from '@phosphor-icons/react/ssr'
import { RevealWrapper } from '@/components/animations/RevealWrapper'
import { SectionDivider } from '@/components/decorative/SectionDivider'

export function AboutCTA() {
  return (
    <>
    <SectionDivider variant="diagonal" fromClassName="fill-white" toClassName="bg-brand-teal-700" />
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-teal-700 to-brand-teal-800 px-4 py-14 md:py-20">
      <div className="relative mx-auto max-w-3xl text-center">
        <RevealWrapper>
          <p className="rule-index font-ui justify-center text-brand-teal-200">Langkah Berikutnya</p>
          <h2 className="mt-3 text-balance font-ui text-2xl md:text-3xl font-semibold leading-tight text-white">
            Ingin Tahu Lebih Lanjut Tentang <span className="font-medium text-brand-teal-200">Kami</span>?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-white/70">
            Jelajahi portofolio produk kami, atau hubungi langsung tim kami untuk pertanyaan
            spesifik seputar kemitraan.
          </p>
        </RevealWrapper>

        <RevealWrapper variant="reveal-up" delay={100}>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/produk"
              className="font-ui group inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-ink-900/30 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink-900/45"
            >
              <PackageIcon size={20} weight="duotone" className="transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
              Lihat Katalog Produk
            </Link>
            <Link
              href="/kontak"
              className="font-ui group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-teal-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-teal-50"
            >
              <ChatCircleIcon size={20} weight="duotone" className="transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
              Hubungi Kami
              <ArrowRightIcon size={16} weight="bold" className="arrow-icon" aria-hidden="true" />
            </Link>
          </div>
        </RevealWrapper>
      </div>
    </section>
    <SectionDivider variant="diagonal" fromClassName="fill-brand-teal-800" toClassName="bg-ink-900" flip />
    </>
  )
}
